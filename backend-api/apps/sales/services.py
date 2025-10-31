"""Business logic for sales/POS transactions"""
from decimal import Decimal
from django.db import transaction
from apps.sales.models import Sale, SaleLineItem, Payment
from apps.inventory.services import InventoryService
from apps.products.models import Product
from apps.loyalty.models import Customer, Discount
from apps.authentication.models import Store


class SalesService:
    """Service for handling sales transactions"""

    @staticmethod
    def validate_items_exist(items, store_id):
        """Validate all items exist in the store"""
        errors = []

        for item in items:
            try:
                product = Product.objects.get(
                    id=item['product_id'],
                    store_id=store_id,
                    is_active=True
                )
            except Product.DoesNotExist:
                errors.append(f"Product {item['product_id']} not found or inactive")

        return errors

    @staticmethod
    def validate_inventory_available(items, store_id):
        """Check if inventory is available for all items"""
        errors = []

        for item in items:
            quantity = int(item['quantity'])
            if not InventoryService.check_available_quantity(
                item['product_id'], store_id, quantity
            ):
                errors.append(f"Insufficient inventory for product {item['product_id']}")

        return errors

    @staticmethod
    def calculate_line_totals(items, store_id):
        """Calculate totals for line items"""
        line_items_data = []
        subtotal = Decimal('0.00')

        for item in items:
            product = Product.objects.get(id=item['product_id'], store_id=store_id)
            quantity = int(item['quantity'])
            unit_price = Decimal(str(item.get('unit_price', product.unit_price)))

            line_total = quantity * unit_price
            subtotal += line_total

            line_items_data.append({
                'product': product,
                'quantity': quantity,
                'unit_price': unit_price,
                'line_total': line_total,
                'discount_applied': Decimal('0.00')
            })

        return line_items_data, subtotal

    @staticmethod
    def calculate_tax(subtotal, store_id):
        """Calculate tax based on products and store settings"""
        # For now, simple calculation - can be enhanced with per-product tax rates
        tax_rate = Decimal('0.10')  # Default 10% tax
        tax_amount = subtotal * tax_rate
        return tax_amount

    @staticmethod
    def apply_discounts(line_items_data, subtotal, discounts_list):
        """Apply discounts to line items"""
        total_discount = Decimal('0.00')

        # Simple implementation - distribute discounts proportionally
        # Can be enhanced to support buy-x-get-y and other complex discount types
        for discount_info in discounts_list:
            if 'discount_amount' in discount_info:
                total_discount += Decimal(str(discount_info['discount_amount']))

        return total_discount

    @staticmethod
    @transaction.atomic
    def create_sale(
        store_id,
        cashier,
        items_data,
        payment_method,
        payment_details,
        customer=None,
        discounts=None,
        loyalty_points_redeemed=0
    ):
        """Create a complete sale transaction"""

        # Calculate totals
        subtotal = sum(item['line_total'] for item in items_data)
        discount_amount = SalesService.apply_discounts(items_data, subtotal, discounts or [])
        tax_amount = SalesService.calculate_tax(subtotal, store_id)
        total_amount = subtotal - discount_amount + tax_amount

        # Create sale record
        sale = Sale.objects.create(
            store_id=store_id,
            cashier_id=cashier,
            total_items=sum(item['quantity'] for item in items_data),
            subtotal=subtotal,
            discount_amount=discount_amount,
            tax_amount=tax_amount,
            total_amount=total_amount,
            payment_method=payment_method,
            customer_id=customer
        )

        # Create line items
        for item in items_data:
            SaleLineItem.objects.create(
                sale_id=sale,
                product_id=item['product'],
                quantity=item['quantity'],
                unit_price=item['unit_price'],
                line_total=item['line_total'],
                discount_applied=item['discount_applied']
            )

        # Create payment record
        Payment.objects.create(
            sale_id=sale,
            payment_method=payment_method,
            amount=total_amount,
            status='completed',
            reference_code=payment_details.get('reference_code', '')
        )

        # Update inventory
        for item in items_data:
            InventoryService.adjust_inventory(
                product_id=item['product'],
                store_id=store_id,
                quantity_change=-item['quantity'],
                transaction_type='sale',
                user=cashier,
                reference_id=str(sale.id)
            )

        # Update customer loyalty if applicable
        if customer:
            # Add loyalty points (1 point per dollar spent)
            points_earned = int(subtotal)
            customer.loyalty_points += points_earned
            customer.total_spent += subtotal
            customer.save()

        return sale

    @staticmethod
    def get_receipt_data(sale_id):
        """Get formatted receipt data for a sale"""
        sale = Sale.objects.get(id=sale_id)

        return {
            'transaction_number': str(sale.id)[:8],
            'date': sale.created_at.isoformat(),
            'cashier': sale.cashier_id.full_name,
            'customer': sale.customer_id.full_name if sale.customer_id else 'Walk-in',
            'items': [
                {
                    'product_name': item.product_id.name,
                    'quantity': item.quantity,
                    'unit_price': float(item.unit_price),
                    'line_total': float(item.line_total),
                }
                for item in sale.line_items.all()
            ],
            'subtotal': float(sale.subtotal),
            'discount_amount': float(sale.discount_amount),
            'loyalty_discount': float(sale.loyalty_discount),
            'tax_amount': float(sale.tax_amount),
            'total_amount': float(sale.total_amount),
            'payment_method': sale.payment_method,
        }
