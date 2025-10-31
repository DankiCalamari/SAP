import uuid
from django.db import models
from apps.authentication.models import Store, User
from apps.products.models import Product
from apps.sales.models import Sale


class Return(models.Model):
    """Returned items from sales"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store_id = models.ForeignKey(Store, on_delete=models.CASCADE)
    original_sale_id = models.ForeignKey(Sale, on_delete=models.SET_NULL, null=True, blank=True)
    user_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)  # Who processed return
    return_reason = models.TextField()
    total_refund = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Return {self.id} - {self.total_refund}"

    class Meta:
        db_table = 'returns'
        indexes = [
            models.Index(fields=['store_id', 'status']),
            models.Index(fields=['original_sale_id']),
            models.Index(fields=['created_at']),
        ]


class ReturnLineItem(models.Model):
    """Individual items being returned"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    return_id = models.ForeignKey(Return, on_delete=models.CASCADE, related_name='line_items')
    product_id = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity_returned = models.IntegerField()
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"Return item - {self.product_id.name if self.product_id else 'Unknown'}"

    class Meta:
        db_table = 'return_line_items'
        indexes = [
            models.Index(fields=['return_id']),
            models.Index(fields=['product_id']),
        ]
