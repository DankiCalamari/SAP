from rest_framework import serializers
from apps.products.models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""
    class Meta:
        model = Category
        fields = ('id', 'name', 'description', 'store_id', 'created_at')
        read_only_fields = ('id', 'created_at')


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model"""
    category_name = serializers.CharField(source='category_id.name', read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'sku', 'name', 'description', 'category_id', 'category_name',
            'unit_price', 'cost_price', 'tax_rate', 'reorder_level',
            'store_id', 'is_active', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'store_id')

    def validate_sku(self, value):
        """Ensure SKU is unique per store"""
        instance = self.instance
        store_id = self.initial_data.get('store_id') or (instance.store_id if instance else None)

        # Check if SKU already exists for this store (excluding current product)
        query = Product.objects.filter(sku=value, store_id=store_id)
        if instance:
            query = query.exclude(id=instance.id)

        if query.exists():
            raise serializers.ValidationError('SKU already exists for this store')

        return value

    def validate_unit_price(self, value):
        """Ensure unit price is positive"""
        if value < 0:
            raise serializers.ValidationError('Unit price cannot be negative')
        return value

    def validate_tax_rate(self, value):
        """Ensure tax rate is between 0 and 100"""
        if value < 0 or value > 100:
            raise serializers.ValidationError('Tax rate must be between 0 and 100')
        return value


class ProductDetailSerializer(ProductSerializer):
    """Detailed product serializer with inventory info"""
    inventory = serializers.SerializerMethodField()

    def get_inventory(self, obj):
        """Get current inventory levels"""
        from apps.inventory.models import Inventory

        try:
            inv = Inventory.objects.get(product_id=obj, store_id=obj.store_id)
            return {
                'quantity_on_hand': inv.quantity_on_hand,
                'reserved_quantity': inv.reserved_quantity,
                'available_quantity': inv.available_quantity,
            }
        except Inventory.DoesNotExist:
            return {
                'quantity_on_hand': 0,
                'reserved_quantity': 0,
                'available_quantity': 0,
            }

    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + ('inventory',)
