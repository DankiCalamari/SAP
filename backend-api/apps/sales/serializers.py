from rest_framework import serializers
from decimal import Decimal
from apps.sales.models import Sale, SaleLineItem, Payment


class SaleLineItemSerializer(serializers.ModelSerializer):
    """Serializer for individual line items in a sale"""
    product_name = serializers.CharField(source='product_id.name', read_only=True)

    class Meta:
        model = SaleLineItem
        fields = (
            'id', 'product_id', 'product_name', 'quantity', 'unit_price',
            'line_total', 'discount_applied', 'notes'
        )


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payment records"""
    class Meta:
        model = Payment
        fields = (
            'id', 'payment_method', 'amount', 'status', 'reference_code', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class SaleSerializer(serializers.ModelSerializer):
    """Serializer for completed sales"""
    cashier_name = serializers.CharField(source='cashier_id.full_name', read_only=True)
    customer_name = serializers.CharField(
        source='customer_id.full_name', read_only=True, required=False
    )
    line_items = SaleLineItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Sale
        fields = (
            'id', 'store_id', 'cashier_id', 'cashier_name', 'total_items',
            'subtotal', 'discount_amount', 'loyalty_discount', 'tax_amount',
            'total_amount', 'payment_method', 'status', 'customer_id', 'customer_name',
            'line_items', 'payments', 'created_at', 'completed_at'
        )
        read_only_fields = (
            'id', 'store_id', 'cashier_id', 'created_at', 'completed_at'
        )


class SaleCreationSerializer(serializers.Serializer):
    """Serializer for creating sales transactions"""
    items = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField(),
            help_text='Each item should have: product_id, quantity, unit_price'
        )
    )
    customer_id = serializers.CharField(required=False, allow_blank=True)
    discounts = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text='List of discount objects with discount_id or discount_code'
    )
    loyalty_points_redeemed = serializers.IntegerField(required=False, default=0)
    payment_method = serializers.ChoiceField(
        choices=['cash', 'card', 'mobile_payment', 'split']
    )
    payment_details = serializers.DictField(required=False)
    tax_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)

    def validate_items(self, value):
        """Validate items list"""
        if not value:
            raise serializers.ValidationError('At least one item is required')

        for item in value:
            if 'product_id' not in item or 'quantity' not in item:
                raise serializers.ValidationError(
                    'Each item must have product_id and quantity'
                )

            try:
                quantity = int(item['quantity'])
                if quantity <= 0:
                    raise ValueError()
            except (ValueError, TypeError):
                raise serializers.ValidationError('Quantity must be a positive integer')

        return value
