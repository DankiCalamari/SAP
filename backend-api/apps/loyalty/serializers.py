from rest_framework import serializers
from apps.loyalty.models import Customer, Discount, Layaway, LayawayItem
from datetime import date


class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for Customer model"""
    class Meta:
        model = Customer
        fields = (
            'id', 'phone', 'email', 'full_name', 'loyalty_points',
            'total_spent', 'store_id', 'created_at'
        )
        read_only_fields = ('id', 'store_id', 'loyalty_points', 'total_spent', 'created_at')

    def validate_phone(self, value):
        """Validate phone is unique per store"""
        instance = self.instance
        store_id = self.initial_data.get('store_id')

        query = Customer.objects.filter(phone=value, store_id=store_id)
        if instance:
            query = query.exclude(id=instance.id)

        if query.exists():
            raise serializers.ValidationError('Phone number already registered for this store')

        return value


class DiscountSerializer(serializers.ModelSerializer):
    """Serializer for Discount model"""
    class Meta:
        model = Discount
        fields = (
            'id', 'code', 'name', 'discount_type', 'discount_value',
            'applicable_products', 'start_date', 'end_date', 'max_uses',
            'times_used', 'store_id', 'is_active', 'created_at'
        )
        read_only_fields = ('id', 'times_used', 'store_id', 'created_at')

    def validate(self, data):
        """Validate discount dates and values"""
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError('Start date must be before end date')

        if data['discount_value'] < 0:
            raise serializers.ValidationError('Discount value cannot be negative')

        if data['discount_type'] == 'percentage' and data['discount_value'] > 100:
            raise serializers.ValidationError('Percentage discount cannot exceed 100%')

        return data


class LayawayItemSerializer(serializers.ModelSerializer):
    """Serializer for Layaway items"""
    product_name = serializers.CharField(source='product_id.name', read_only=True)

    class Meta:
        model = LayawayItem
        fields = ('id', 'product_id', 'product_name', 'quantity', 'price_per_item')


class LayawaySerializer(serializers.ModelSerializer):
    """Serializer for Layaway model"""
    customer_name = serializers.CharField(source='customer_id.full_name', read_only=True)
    items = LayawayItemSerializer(many=True, read_only=True)

    class Meta:
        model = Layaway
        fields = (
            'id', 'store_id', 'customer_id', 'customer_name', 'status',
            'total_amount', 'amount_paid', 'balance_remaining', 'items',
            'created_at', 'due_date', 'fulfilled_at'
        )
        read_only_fields = ('id', 'store_id', 'created_at', 'fulfilled_at')
