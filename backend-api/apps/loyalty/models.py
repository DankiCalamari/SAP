import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField
from apps.auth.models import Store, User
from apps.products.models import Product


class Customer(models.Model):
    """Customer loyalty program model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    phone = models.CharField(max_length=20)  # Primary identifier
    email = models.EmailField(blank=True)
    full_name = models.CharField(max_length=255)
    loyalty_points = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    store_id = models.ForeignKey(Store, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name

    class Meta:
        db_table = 'customers'
        unique_together = ('store_id', 'phone')
        indexes = [
            models.Index(fields=['phone']),
            models.Index(fields=['email']),
            models.Index(fields=['store_id']),
        ]


class Discount(models.Model):
    """Promotional discounts model"""
    DISCOUNT_TYPES = (
        ('percentage', 'Percentage'),
        ('fixed_amount', 'Fixed Amount'),
        ('buy_x_get_y', 'Buy X Get Y'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=100, unique=True, blank=True)  # Optional
    name = models.CharField(max_length=255)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)  # Percentage or amount
    applicable_products = models.JSONField(default=list, blank=True)  # JSON array of product IDs
    start_date = models.DateField()
    end_date = models.DateField()
    max_uses = models.IntegerField(null=True, blank=True)  # Null = unlimited
    times_used = models.IntegerField(default=0)
    store_id = models.ForeignKey(Store, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'discounts'
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['store_id']),
            models.Index(fields=['start_date', 'end_date']),
        ]


class Layaway(models.Model):
    """Layaway/hold on items"""
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('fulfilled', 'Fulfilled'),
        ('cancelled', 'Cancelled'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store_id = models.ForeignKey(Store, on_delete=models.CASCADE)
    customer_id = models.ForeignKey(Customer, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_remaining = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField()
    fulfilled_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Layaway {self.id} - {self.customer_id.full_name}"

    class Meta:
        db_table = 'layaways'
        indexes = [
            models.Index(fields=['store_id', 'status']),
            models.Index(fields=['customer_id']),
        ]


class LayawayItem(models.Model):
    """Items in a layaway"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    layaway_id = models.ForeignKey(Layaway, on_delete=models.CASCADE, related_name='items')
    product_id = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.IntegerField()
    price_per_item = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Layaway item - {self.product_id.name if self.product_id else 'Unknown'}"

    class Meta:
        db_table = 'layaway_items'
