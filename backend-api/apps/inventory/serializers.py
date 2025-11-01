from rest_framework import serializers
from apps.inventory.models import Inventory, InventoryTransaction


class InventorySerializer(serializers.ModelSerializer):
    """Serializer for Inventory model"""
    product_name = serializers.CharField(source='product_id.name', read_only=True)
    available_quantity = serializers.SerializerMethodField()

    def get_available_quantity(self, obj):
        return obj.available_quantity

    class Meta:
        model = Inventory
        fields = (
            'id', 'product_id', 'product_name', 'store_id',
            'quantity_on_hand', 'reserved_quantity', 'available_quantity',
            'last_updated'
        )
        read_only_fields = ('id', 'last_updated', 'store_id')


class InventoryTransactionSerializer(serializers.ModelSerializer):
    """Serializer for InventoryTransaction model"""
    product_name = serializers.CharField(source='product_id.name', read_only=True)
    user_name = serializers.CharField(source='created_by_user_id.full_name', read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = (
            'id', 'product_id', 'product_name', 'store_id', 'transaction_type',
            'quantity_change', 'reference_id', 'notes', 'created_by_user_id',
            'user_name', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'store_id', 'created_by_user_id')


class InventoryAdjustmentSerializer(serializers.Serializer):
    """Serializer for inventory adjustment requests"""
    product_id = serializers.CharField()
    quantity_change = serializers.IntegerField()
    reason = serializers.CharField(max_length=255)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_quantity_change(self, value):
        """Ensure quantity change is not zero"""
        if value == 0:
            raise serializers.ValidationError('Quantity change must be non-zero')
        return value

    def validate_reason(self, value):
        """Validate reason"""
        valid_reasons = ['damage', 'miscount', 'loss', 'incoming', 'return', 'other']
        if value.lower() not in valid_reasons:
            raise serializers.ValidationError(
                f'Reason must be one of: {", ".join(valid_reasons)}'
            )
        return value
