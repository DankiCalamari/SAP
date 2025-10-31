import uuid
from django.db import models
from django.db.models import F
from apps.auth.models import Store, User
from apps.products.models import Product


class Inventory(models.Model):
    """Current inventory levels"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product_id = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory')
    store_id = models.ForeignKey(Store, on_delete=models.CASCADE)
    quantity_on_hand = models.IntegerField(default=0)
    reserved_quantity = models.IntegerField(default=0)  # For layaway/holds
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.product_id.name} - {self.quantity_on_hand} on hand"

    @property
    def available_quantity(self):
        """Calculate available quantity (on hand - reserved)"""
        return max(0, self.quantity_on_hand - self.reserved_quantity)

    class Meta:
        db_table = 'inventory'
        unique_together = ('product_id', 'store_id')
        indexes = [
            models.Index(fields=['product_id', 'store_id']),
            models.Index(fields=['store_id']),
        ]


class InventoryTransaction(models.Model):
    """Audit trail for all inventory changes"""
    TRANSACTION_TYPES = (
        ('sale', 'Sale'),
        ('return', 'Return'),
        ('adjustment', 'Manual Adjustment'),
        ('layaway_create', 'Layaway Create'),
        ('layaway_fulfill', 'Layaway Fulfill'),
        ('damage', 'Damage/Loss'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product_id = models.ForeignKey(Product, on_delete=models.CASCADE)
    store_id = models.ForeignKey(Store, on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity_change = models.IntegerField()  # Can be positive or negative
    reference_id = models.CharField(max_length=255, blank=True)  # Links to Sale, Return, etc.
    notes = models.TextField(blank=True)
    created_by_user_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_type} - {self.product_id.name} ({self.quantity_change})"

    class Meta:
        db_table = 'inventory_transactions'
        indexes = [
            models.Index(fields=['product_id', 'store_id']),
            models.Index(fields=['created_at']),
            models.Index(fields=['transaction_type']),
        ]
