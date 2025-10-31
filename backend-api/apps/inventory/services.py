"""Business logic for inventory operations"""
from django.db import transaction
from apps.inventory.models import Inventory, InventoryTransaction
from apps.products.models import Product


class InventoryService:
    """Service for handling inventory operations"""

    @staticmethod
    def get_or_create_inventory(product_id, store_id):
        """Get or create inventory record for product"""
        inventory, created = Inventory.objects.get_or_create(
            product_id=product_id,
            store_id=store_id,
            defaults={'quantity_on_hand': 0, 'reserved_quantity': 0}
        )
        return inventory

    @staticmethod
    @transaction.atomic
    def adjust_inventory(product_id, store_id, quantity_change, transaction_type, user, reference_id=None, notes=None):
        """Adjust inventory quantity and create transaction record"""
        inventory = InventoryService.get_or_create_inventory(product_id, store_id)

        # Update inventory
        inventory.quantity_on_hand += quantity_change
        inventory.save()

        # Create audit record
        InventoryTransaction.objects.create(
            product_id=product_id,
            store_id=store_id,
            transaction_type=transaction_type,
            quantity_change=quantity_change,
            reference_id=reference_id or '',
            notes=notes or '',
            created_by_user_id=user
        )

        return inventory

    @staticmethod
    def check_available_quantity(product_id, store_id, quantity_needed):
        """Check if sufficient quantity is available"""
        try:
            inventory = Inventory.objects.get(product_id=product_id, store_id=store_id)
            return inventory.available_quantity >= quantity_needed
        except Inventory.DoesNotExist:
            return False

    @staticmethod
    def reserve_quantity(product_id, store_id, quantity):
        """Reserve quantity for layaway/hold"""
        inventory = InventoryService.get_or_create_inventory(product_id, store_id)
        inventory.reserved_quantity += quantity
        inventory.save()
        return inventory

    @staticmethod
    def release_reservation(product_id, store_id, quantity):
        """Release reserved quantity"""
        try:
            inventory = Inventory.objects.get(product_id=product_id, store_id=store_id)
            inventory.reserved_quantity = max(0, inventory.reserved_quantity - quantity)
            inventory.save()
            return inventory
        except Inventory.DoesNotExist:
            return None

    @staticmethod
    def get_low_stock_products(store_id):
        """Get products below reorder level"""
        products = Product.objects.filter(store_id=store_id, is_active=True)
        low_stock = []

        for product in products:
            try:
                inventory = Inventory.objects.get(product_id=product, store_id=store_id)
                if inventory.quantity_on_hand < product.reorder_level:
                    low_stock.append({
                        'product_id': product.id,
                        'name': product.name,
                        'sku': product.sku,
                        'current_quantity': inventory.quantity_on_hand,
                        'reorder_level': product.reorder_level,
                        'units_below': product.reorder_level - inventory.quantity_on_hand
                    })
            except Inventory.DoesNotExist:
                if product.reorder_level > 0:
                    low_stock.append({
                        'product_id': product.id,
                        'name': product.name,
                        'sku': product.sku,
                        'current_quantity': 0,
                        'reorder_level': product.reorder_level,
                        'units_below': product.reorder_level
                    })

        return low_stock
