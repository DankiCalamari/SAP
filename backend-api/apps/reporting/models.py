import uuid
from django.db import models
from apps.auth.models import Store


class DailySalesReport(models.Model):
    """Denormalized daily sales summary for performance"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store_id = models.ForeignKey(Store, on_delete=models.CASCADE)
    date = models.DateField()
    total_sales = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_items_sold = models.IntegerField(default=0)
    total_discount_given = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_tax_collected = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    transaction_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Daily Report - {self.date}"

    class Meta:
        db_table = 'daily_sales_reports'
        unique_together = ('store_id', 'date')
        indexes = [
            models.Index(fields=['store_id', 'date']),
            models.Index(fields=['date']),
        ]
