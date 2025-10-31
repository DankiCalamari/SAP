from rest_framework import serializers
from apps.reporting.models import DailySalesReport


class DailySalesReportSerializer(serializers.ModelSerializer):
    """Serializer for daily sales reports"""
    class Meta:
        model = DailySalesReport
        fields = (
            'id', 'store_id', 'date', 'total_sales', 'total_items_sold',
            'total_discount_given', 'total_tax_collected', 'transaction_count', 'created_at'
        )
        read_only_fields = ('id', 'created_at')
