from rest_framework import serializers
from apps.returns.models import Return, ReturnLineItem


class ReturnLineItemSerializer(serializers.ModelSerializer):
    """Serializer for return line items"""
    product_name = serializers.CharField(source='product_id.name', read_only=True)

    class Meta:
        model = ReturnLineItem
        fields = (
            'id', 'product_id', 'product_name', 'quantity_returned', 'refund_amount'
        )


class ReturnSerializer(serializers.ModelSerializer):
    """Serializer for Return model"""
    user_name = serializers.CharField(source='user_id.full_name', read_only=True)
    line_items = ReturnLineItemSerializer(many=True, read_only=True)

    class Meta:
        model = Return
        fields = (
            'id', 'store_id', 'original_sale_id', 'user_id', 'user_name',
            'return_reason', 'total_refund', 'status', 'rejection_reason',
            'line_items', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'store_id', 'user_id', 'created_at', 'updated_at')


class ReturnCreationSerializer(serializers.Serializer):
    """Serializer for creating returns"""
    original_sale_id = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(
        child=serializers.DictField(),
        help_text='List of items: {product_id, quantity, reason}'
    )
    customer_id = serializers.CharField(required=False, allow_blank=True)
    return_reason = serializers.CharField(required=False, default='Customer return')

    def validate_items(self, value):
        """Validate items list"""
        if not value:
            raise serializers.ValidationError('At least one item must be returned')

        for item in value:
            if 'product_id' not in item or 'quantity' not in item:
                raise serializers.ValidationError(
                    'Each item must have product_id and quantity'
                )

        return value
