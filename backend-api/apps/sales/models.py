import uuid
from django.db import models
from apps.auth.models import Store, User
from apps.products.models import Product


class Sale(models.Model):
    """Completed transaction/sale"""
    STATUS_CHOICES = (
        ('completed', 'Completed'),
        ('voided', 'Voided'),
        ('refunded_partial', 'Partially Refunded'),
        ('refunded_full', 'Fully Refunded'),
    )

    PAYMENT_METHODS = (
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('mobile_payment', 'Mobile Payment'),
        ('split', 'Split Payment'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store_id = models.ForeignKey(Store, on_delete=models.CASCADE)
    cashier_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    total_items = models.IntegerField()
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    loyalty_discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    customer_id = models.ForeignKey('loyalty.Customer', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sale {self.id} - {self.total_amount}"

    class Meta:
        db_table = 'sales'
        indexes = [
            models.Index(fields=['store_id', 'created_at']),
            models.Index(fields=['cashier_id']),
            models.Index(fields=['customer_id']),
            models.Index(fields=['status']),
        ]


class SaleLineItem(models.Model):
    """Individual items in a sale"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sale_id = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='line_items')
    product_id = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)
    discount_applied = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Line item - {self.product_id.name if self.product_id else 'Unknown'}"

    class Meta:
        db_table = 'sale_line_items'
        indexes = [
            models.Index(fields=['sale_id']),
            models.Index(fields=['product_id']),
        ]


class Payment(models.Model):
    """Payment records for split payments"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('reversed', 'Reversed'),
    )

    PAYMENT_METHODS = (
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('mobile_payment', 'Mobile Payment'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sale_id = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='payments')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reference_code = models.CharField(max_length=255, blank=True)  # Stripe transaction ID, etc.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.id} - {self.amount}"

    class Meta:
        db_table = 'payments'
        indexes = [
            models.Index(fields=['sale_id']),
            models.Index(fields=['status']),
        ]
