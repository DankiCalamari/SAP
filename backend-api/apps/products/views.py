from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from apps.products.models import Category, Product
from apps.products.serializers import CategorySerializer, ProductSerializer, ProductDetailSerializer
from apps.authentication.permissions import IsManager


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for product categories"""
    permission_classes = (IsAuthenticated,)
    serializer_class = CategorySerializer

    def get_queryset(self):
        """Filter categories by user's store"""
        store_id = self.request.user.store_id
        if self.request.user.role == 'admin':
            return Category.objects.all()
        return Category.objects.filter(store_id=store_id)

    def perform_create(self, serializer):
        """Assign store from user"""
        serializer.save(store_id=self.request.user.store_id)


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for products"""
    permission_classes = (IsAuthenticated,)
    serializer_class = ProductSerializer
    filterset_fields = ('category_id', 'is_active')
    search_fields = ('name', 'sku', 'description')
    ordering_fields = ('name', 'unit_price', 'created_at')

    def get_queryset(self):
        """Filter products by user's store"""
        store_id = self.request.user.store_id
        if self.request.user.role == 'admin':
            return Product.objects.all()
        return Product.objects.filter(store_id=store_id, is_active=True)

    def get_serializer_class(self):
        """Use detailed serializer for retrieve"""
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductSerializer

    def perform_create(self, serializer):
        """Assign store from user"""
        serializer.save(store_id=self.request.user.store_id)

    def create(self, request, *args, **kwargs):
        """Override create to check permissions"""
        if request.user.role not in ('manager', 'admin'):
            return Response(
                {'error': 'Only managers and admins can create products'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Override update to check permissions"""
        if request.user.role not in ('manager', 'admin'):
            return Response(
                {'error': 'Only managers and admins can update products'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Override destroy to soft-delete products"""
        if request.user.role not in ('manager', 'admin'):
            return Response(
                {'error': 'Only managers and admins can delete products'},
                status=status.HTTP_403_FORBIDDEN
            )

        instance = self.get_object()
        instance.is_active = False
        instance.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def by_barcode(self, request):
        """Search product by barcode/SKU"""
        barcode = request.query_params.get('barcode')

        if not barcode:
            return Response(
                {'error': 'Barcode parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        store_id = request.user.store_id
        query = Product.objects.filter(sku=barcode, store_id=store_id, is_active=True)

        if not query.exists():
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        product = query.first()
        serializer = ProductDetailSerializer(product)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products below reorder level"""
        from apps.inventory.models import Inventory

        store_id = request.user.store_id

        # Get all products in this store that are below reorder level
        low_stock_products = Product.objects.filter(
            store_id=store_id,
            is_active=True
        ).filter(
            inventory__quantity_on_hand__lt=Product._meta.get_field('reorder_level').get_default()
        )

        serializer = ProductDetailSerializer(low_stock_products, many=True)
        return Response({'results': serializer.data}, status=status.HTTP_200_OK)
