from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import date, datetime, timedelta
from django.db.models import Sum, Count, Q, F, DecimalField
from django.db.models.functions import TruncDate
from apps.reporting.models import DailySalesReport
from apps.reporting.serializers import DailySalesReportSerializer
from apps.sales.models import Sale, SaleLineItem
from apps.products.models import Product
from apps.inventory.models import Inventory
from apps.authentication.permissions import IsManager


class ReportingViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for business reports and analytics"""
    permission_classes = (IsAuthenticated,)
    serializer_class = DailySalesReportSerializer

    def get_queryset(self):
        """Filter reports by user's store"""
        store_id = self.request.user.store_id
        if self.request.user.role == 'admin':
            return DailySalesReport.objects.all()
        return DailySalesReport.objects.filter(store_id=store_id)

    @action(detail=False, methods=['get'])
    def daily_sales(self, request):
        """Get daily sales summary"""
        date_str = request.query_params.get('date', str(date.today()))
        store_id = request.user.store_id

        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get sales for the day
        sales = Sale.objects.filter(
            store_id=store_id,
            created_at__date=target_date
        )

        total_sales = sales.aggregate(
            total=Sum('total_amount'),
            items=Sum('total_items'),
            discounts=Sum('discount_amount'),
            tax=Sum('tax_amount'),
            count=Count('id')
        )

        return Response({
            'date': target_date.isoformat(),
            'total_sales': float(total_sales['total'] or 0),
            'total_items_sold': total_sales['items'] or 0,
            'total_discount_given': float(total_sales['discounts'] or 0),
            'total_tax_collected': float(total_sales['tax'] or 0),
            'transaction_count': total_sales['count'] or 0,
            'breakdown_by_payment_method': self._breakdown_by_payment_method(sales)
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def products(self, request):
        """Get product performance metrics"""
        metric = request.query_params.get('metric', 'best_sellers')
        store_id = request.user.store_id
        limit = int(request.query_params.get('limit', 50))

        if metric == 'best_sellers':
            products = self._get_best_sellers(store_id, limit)
        elif metric == 'slow_movers':
            products = self._get_slow_movers(store_id, limit)
        elif metric == 'overstock':
            products = self._get_overstock(store_id, limit)
        else:
            return Response(
                {'error': f'Unknown metric: {metric}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({'results': products}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def inventory_status(self, request):
        """Get inventory health snapshot"""
        store_id = request.user.store_id

        inventories = Inventory.objects.filter(store_id=store_id)

        total_value = 0
        on_hand_count = 0
        low_stock_items = []
        overstock_items = []

        for inv in inventories:
            # Calculate inventory value
            value = inv.product_id.cost_price * inv.quantity_on_hand
            total_value += value
            on_hand_count += inv.quantity_on_hand

            # Check for low stock
            if inv.quantity_on_hand < inv.product_id.reorder_level:
                low_stock_items.append({
                    'product_id': str(inv.product_id.id),
                    'product_name': inv.product_id.name,
                    'current_quantity': inv.quantity_on_hand,
                    'reorder_level': inv.product_id.reorder_level
                })

            # Check for overstock (more than 2x reorder level)
            if inv.quantity_on_hand > inv.product_id.reorder_level * 2:
                overstock_items.append({
                    'product_id': str(inv.product_id.id),
                    'product_name': inv.product_id.name,
                    'current_quantity': inv.quantity_on_hand,
                    'suggested_level': inv.product_id.reorder_level
                })

        return Response({
            'total_value': float(total_value),
            'on_hand_count': on_hand_count,
            'low_stock_items': low_stock_items,
            'low_stock_count': len(low_stock_items),
            'overstock_items': overstock_items,
            'overstock_count': len(overstock_items)
        }, status=status.HTTP_200_OK)

    def _breakdown_by_payment_method(self, sales):
        """Get breakdown of sales by payment method"""
        breakdown = {}
        for method in ['cash', 'card', 'mobile_payment', 'split']:
            total = sales.filter(payment_method=method).aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            breakdown[method] = float(total)
        return breakdown

    def _get_best_sellers(self, store_id, limit):
        """Get best selling products"""
        products = SaleLineItem.objects.filter(
            sale_id__store_id=store_id
        ).values('product_id__id', 'product_id__name').annotate(
            sales_count=Count('id'),
            total_revenue=Sum('line_total'),
            quantity_sold=Sum('quantity')
        ).order_by('-sales_count')[:limit]

        return [
            {
                'product_id': str(p['product_id__id']),
                'product_name': p['product_id__name'],
                'sales_count': p['sales_count'],
                'total_revenue': float(p['total_revenue'] or 0),
                'quantity_sold': p['quantity_sold']
            }
            for p in products
        ]

    def _get_slow_movers(self, store_id, limit):
        """Get slow moving products"""
        # Products with very few sales
        products = SaleLineItem.objects.filter(
            sale_id__store_id=store_id,
            product_id__store_id=store_id
        ).values('product_id__id', 'product_id__name').annotate(
            sales_count=Count('id'),
            total_revenue=Sum('line_total')
        ).order_by('sales_count')[:limit]

        return [
            {
                'product_id': str(p['product_id__id']),
                'product_name': p['product_id__name'],
                'sales_count': p['sales_count'],
                'total_revenue': float(p['total_revenue'] or 0)
            }
            for p in products
        ]

    def _get_overstock(self, store_id, limit):
        """Get overstocked products"""
        inventories = Inventory.objects.filter(
            store_id=store_id,
            quantity_on_hand__gte=F('product_id__reorder_level') * 2
        )[:limit]

        return [
            {
                'product_id': str(inv.product_id.id),
                'product_name': inv.product_id.name,
                'current_quantity': inv.quantity_on_hand,
                'reorder_level': inv.product_id.reorder_level,
                'excess_units': inv.quantity_on_hand - inv.product_id.reorder_level
            }
            for inv in inventories
        ]
