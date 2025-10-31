import uuid
from django.db import models
from apps.auth.models import Store


class Category(models.Model):
    """Product category model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    store_id = models.ForeignKey(Store, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'categories'
        unique_together = ('store_id', 'name')


class Product(models.Model):
    """Product model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sku = models.CharField(max_length=100)  # Barcode/SKU
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category_id = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # Percentage
    reorder_level = models.IntegerField(default=10)
    store_id = models.ForeignKey(Store, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'products'
        unique_together = ('store_id', 'sku')
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['store_id', 'is_active']),
            models.Index(fields=['category_id']),
        ]
