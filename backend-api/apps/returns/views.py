from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import datetime, timedelta
from apps.returns.models import Return, ReturnLineItem
from apps.returns.serializers import ReturnSerializer, ReturnCreationSerializer
from apps.sales.models import Sale, SaleLineItem
from apps.inventory.services import InventoryService
from apps.authentication.permissions import IsManager
from decimal import Decimal


class ReturnViewSet(viewsets.ModelViewSet):
    """ViewSet for return management"""
    permission_classes = (IsAuthenticated,)
    serializer_class = ReturnSerializer
    filterset_fields = ('status', 'original_sale_id')
    ordering_fields = ('created_at', 'total_refund')
    ordering = ('-created_at',)

    def get_queryset(self):
        """Filter returns by user's store"""
        store_id = self.request.user.store_id
        if self.request.user.role == 'admin':
            return Return.objects.all()
        return Return.objects.filter(store_id=store_id)

    @action(detail=False, methods=['post'])
    def create_return(self, request):
        """Create a new return"""
        serializer = ReturnCreationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        store_id = request.user.store_id
        items = serializer.validated_data['items']
        original_sale_id = serializer.validated_data.get('original_sale_id')

        # Validate sale if provided
        sale = None
        if original_sale_id:
            try:
                sale = Sale.objects.get(id=original_sale_id, store_id=store_id)
                # Check return window (60 days)
                days_since_sale = (datetime.now() - sale.created_at.replace(tzinfo=None)).days
                if days_since_sale > 60:
                    return Response({
                        'error': 'Return window expired (60 days maximum)'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except Sale.DoesNotExist:
                return Response(
                    {'error': 'Original sale not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Create return record
        total_refund = Decimal('0.00')

        try:
            ret = Return.objects.create(
                store_id=store_id,
                original_sale_id=sale,
                user_id=request.user,
                return_reason=serializer.validated_data.get('return_reason', 'Customer return'),
                total_refund=total_refund,
                status='pending'
            )

            # Create return line items
            for item in items:
                product_id = item['product_id']
                quantity_returned = int(item['quantity'])

                # Validate if sale is provided
                if sale:
                    try:
                        sale_line = sale.line_items.get(product_id=product_id)
                        if quantity_returned > sale_line.quantity:
                            return Response({
                                'error': f'Return quantity exceeds original quantity for product {product_id}'
                            }, status=status.HTTP_400_BAD_REQUEST)

                        refund_amount = sale_line.unit_price * quantity_returned
                    except SaleLineItem.DoesNotExist:
                        return Response({
                            'error': f'Product {product_id} not found in original sale'
                        }, status=status.HTTP_404_NOT_FOUND)
                else:
                    # For independent returns, calculate refund based on current product price
                    from apps.products.models import Product
                    try:
                        product = Product.objects.get(id=product_id, store_id=store_id)
                        refund_amount = product.unit_price * quantity_returned
                    except Product.DoesNotExist:
                        return Response({
                            'error': f'Product {product_id} not found'
                        }, status=status.HTTP_404_NOT_FOUND)

                ReturnLineItem.objects.create(
                    return_id=ret,
                    product_id_id=product_id,
                    quantity_returned=quantity_returned,
                    refund_amount=refund_amount
                )

                total_refund += refund_amount

            # Update return total
            ret.total_refund = total_refund
            ret.save()

            return Response(
                ReturnSerializer(ret).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail='pk', methods=['post'])
    def approve(self, request, pk=None):
        """Approve a return"""
        if request.user.role not in ('manager', 'admin'):
            return Response(
                {'error': 'Only managers can approve returns'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            ret = Return.objects.get(id=pk, store_id=request.user.store_id)
        except Return.DoesNotExist:
            return Response(
                {'error': 'Return not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if ret.status != 'pending':
            return Response(
                {'error': 'Only pending returns can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Restore inventory and create transactions
        for line_item in ret.line_items.all():
            InventoryService.adjust_inventory(
                product_id=line_item.product_id,
                store_id=ret.store_id,
                quantity_change=line_item.quantity_returned,
                transaction_type='return',
                user=request.user,
                reference_id=f"RETURN-{ret.id}"
            )

        ret.status = 'completed'
        ret.save()

        return Response({
            'success': True,
            'message': 'Return approved'
        }, status=status.HTTP_200_OK)

    @action(detail='pk', methods=['post'])
    def reject(self, request, pk=None):
        """Reject a return"""
        if request.user.role not in ('manager', 'admin'):
            return Response(
                {'error': 'Only managers can reject returns'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            ret = Return.objects.get(id=pk, store_id=request.user.store_id)
        except Return.DoesNotExist:
            return Response(
                {'error': 'Return not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if ret.status != 'pending':
            return Response(
                {'error': 'Only pending returns can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ret.status = 'rejected'
        ret.rejection_reason = request.data.get('reason', 'Return rejected')
        ret.save()

        return Response({
            'success': True,
            'message': 'Return rejected'
        }, status=status.HTTP_200_OK)
