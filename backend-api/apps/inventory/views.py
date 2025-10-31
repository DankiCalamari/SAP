from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from apps.inventory.models import Inventory, InventoryTransaction
from apps.inventory.serializers import (
    InventorySerializer, InventoryTransactionSerializer, InventoryAdjustmentSerializer
)
from apps.inventory.services import InventoryService
from apps.products.models import Product
from apps.authentication.permissions import IsStockStaff, IsManager


class InventoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing inventory levels"""
    permission_classes = (IsAuthenticated,)
    serializer_class = InventorySerializer

    def get_queryset(self):
        """Filter inventory by user's store"""
        store_id = self.request.user.store_id
        if self.request.user.role == 'admin':
            return Inventory.objects.all()
        return Inventory.objects.filter(store_id=store_id)

    @action(detail=False, methods=['post'])
    def adjust(self, request):
        """Manual inventory adjustment"""
        if request.user.role not in ('stock_staff', 'manager', 'admin'):
            return Response(
                {'error': 'Only stock staff and managers can adjust inventory'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = InventoryAdjustmentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(
                id=serializer.validated_data['product_id'],
                store_id=request.user.store_id
            )
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            inventory = InventoryService.adjust_inventory(
                product_id=product,
                store_id=request.user.store_id,
                quantity_change=serializer.validated_data['quantity_change'],
                transaction_type='adjustment',
                user=request.user,
                notes=serializer.validated_data.get('notes', '')
            )

            result = InventorySerializer(inventory).data
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products below reorder level"""
        store_id = request.user.store_id
        limit = int(request.query_params.get('limit', 100))

        low_stock_products = InventoryService.get_low_stock_products(store_id)[:limit]

        return Response({
            'results': low_stock_products,
            'total': len(low_stock_products)
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def by_product(self, request):
        """Get inventory for specific product"""
        product_id = request.query_params.get('product_id')

        if not product_id:
            return Response(
                {'error': 'product_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(
                id=product_id,
                store_id=request.user.store_id
            )
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        inventory = InventoryService.get_or_create_inventory(product, request.user.store_id)
        serializer = InventorySerializer(inventory)

        return Response(serializer.data, status=status.HTTP_200_OK)


class InventoryTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing inventory transaction audit trail"""
    permission_classes = (IsAuthenticated,)
    serializer_class = InventoryTransactionSerializer
    filterset_fields = ('product_id', 'transaction_type', 'created_by_user_id')
    search_fields = ('product_id__name', 'notes')
    ordering_fields = ('created_at',)
    ordering = ('-created_at',)

    def get_queryset(self):
        """Filter transactions by user's store"""
        store_id = self.request.user.store_id
        if self.request.user.role == 'admin':
            return InventoryTransaction.objects.all()
        return InventoryTransaction.objects.filter(store_id=store_id)
