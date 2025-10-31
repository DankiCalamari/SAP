from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.sales.models import Sale, Payment
from apps.sales.serializers import SaleSerializer, SaleCreationSerializer, PaymentSerializer
from apps.sales.services import SalesService
from apps.authentication.permissions import IsCashier, IsManager
from apps.loyalty.models import Customer
from apps.inventory.services import InventoryService
from apps.products.models import Product
from decimal import Decimal


class SaleViewSet(viewsets.ModelViewSet):
    """ViewSet for sales transactions"""
    permission_classes = (IsAuthenticated,)
    serializer_class = SaleSerializer
    filterset_fields = ('status', 'payment_method', 'cashier_id', 'customer_id')
    search_fields = ('id', 'cashier_id__full_name')
    ordering_fields = ('created_at', 'total_amount')
    ordering = ('-created_at',)

    def get_queryset(self):
        """Filter sales by user's store"""
        store_id = self.request.user.store_id
        if self.request.user.role == 'admin':
            return Sale.objects.all()
        return Sale.objects.filter(store_id=store_id)

    @action(detail=False, methods=['post'])
    def create_transaction(self, request):
        """Create a new POS transaction"""
        if request.user.role not in ('cashier', 'manager', 'admin'):
            return Response(
                {'error': 'Only cashiers can create transactions'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = SaleCreationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        store_id = request.user.store_id
        items_raw = serializer.validated_data['items']

        # Validate all products exist
        errors = SalesService.validate_items_exist(items_raw, store_id)
        if errors:
            return Response(
                {'errors': errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate inventory available
        errors = SalesService.validate_inventory_available(items_raw, store_id)
        if errors:
            return Response(
                {'errors': errors},
                status=status.HTTP_402_PAYMENT_REQUIRED
            )

        # Calculate line totals
        try:
            line_items_data, subtotal = SalesService.calculate_line_totals(
                items_raw, store_id
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get customer if provided
        customer = None
        if serializer.validated_data.get('customer_id'):
            try:
                customer = Customer.objects.get(
                    id=serializer.validated_data['customer_id'],
                    store_id=store_id
                )
            except Customer.DoesNotExist:
                return Response(
                    {'error': 'Customer not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Create the sale
        try:
            sale = SalesService.create_sale(
                store_id=store_id,
                cashier=request.user,
                items_data=line_items_data,
                payment_method=serializer.validated_data['payment_method'],
                payment_details=serializer.validated_data.get('payment_details', {}),
                customer=customer,
                discounts=serializer.validated_data.get('discounts', []),
                loyalty_points_redeemed=serializer.validated_data.get(
                    'loyalty_points_redeemed', 0
                )
            )

            # Get receipt data
            receipt_data = SalesService.get_receipt_data(sale.id)

            return Response({
                'sale_id': str(sale.id),
                'transaction_number': receipt_data['transaction_number'],
                'receipt_data': receipt_data,
                'success': True
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail='pk', methods=['post'])
    def void(self, request, pk=None):
        """Void/cancel a completed sale"""
        if request.user.role not in ('manager', 'admin'):
            return Response(
                {'error': 'Only managers can void sales'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            sale = Sale.objects.get(id=pk, store_id=request.user.store_id)
        except Sale.DoesNotExist:
            return Response(
                {'error': 'Sale not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if sale.status != 'completed':
            return Response(
                {'error': 'Only completed sales can be voided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update sale status
        sale.status = 'voided'
        sale.save()

        # Restore inventory
        for line_item in sale.line_items.all():
            InventoryService.adjust_inventory(
                product_id=line_item.product_id,
                store_id=sale.store_id,
                quantity_change=line_item.quantity,
                transaction_type='return',
                user=request.user,
                reference_id=f"VOID-{sale.id}"
            )

        return Response({
            'success': True,
            'message': 'Sale voided successfully'
        }, status=status.HTTP_200_OK)

    @action(detail='pk', methods=['post'])
    def refund(self, request, pk=None):
        """Process refund for a sale"""
        if request.user.role not in ('manager', 'admin'):
            return Response(
                {'error': 'Only managers can process refunds'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            sale = Sale.objects.get(id=pk, store_id=request.user.store_id)
        except Sale.DoesNotExist:
            return Response(
                {'error': 'Sale not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Extract refund items from request
        refund_items = request.data.get('items', [])
        reason = request.data.get('reason', 'Customer return')

        if not refund_items:
            return Response(
                {'error': 'At least one item must be returned'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate refund amount and update inventory
        total_refund = Decimal('0.00')

        for refund_item in refund_items:
            line_item_id = refund_item.get('sale_line_item_id')
            quantity_returning = int(refund_item.get('quantity_returning', 0))

            try:
                line_item = sale.line_items.get(id=line_item_id)
            except:
                return Response(
                    {'error': f'Line item {line_item_id} not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            if quantity_returning > line_item.quantity:
                return Response(
                    {'error': f'Return quantity exceeds original quantity'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Calculate refund for this item
            refund_amount = line_item.unit_price * quantity_returning
            total_refund += refund_amount

            # Restore inventory
            InventoryService.adjust_inventory(
                product_id=line_item.product_id,
                store_id=sale.store_id,
                quantity_change=quantity_returning,
                transaction_type='return',
                user=request.user,
                reference_id=f"REFUND-{sale.id}",
                notes=reason
            )

        # Determine new sale status
        original_total = sale.subtotal - sale.discount_amount + sale.tax_amount
        refund_percentage = (total_refund / original_total) * 100

        if refund_percentage >= 100:
            sale.status = 'refunded_full'
        else:
            sale.status = 'refunded_partial'

        sale.save()

        return Response({
            'success': True,
            'refund_amount': float(total_refund),
            'new_sale_status': sale.status
        }, status=status.HTTP_200_OK)

    @action(detail='pk', methods=['get'])
    def receipt(self, request, pk=None):
        """Get receipt data for a sale"""
        try:
            sale = Sale.objects.get(id=pk, store_id=request.user.store_id)
        except Sale.DoesNotExist:
            return Response(
                {'error': 'Sale not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        receipt_data = SalesService.get_receipt_data(pk)
        return Response(receipt_data, status=status.HTTP_200_OK)
