import { useCartStore } from '../store';
import { useMemo } from 'react';

/**
 * useCart - Wrapper around useCartStore with additional helpers
 * @returns {object} Cart state and methods with computed properties
 */
export function useCart() {
  const cartStore = useCartStore();

  // Computed properties
  const subtotal = useMemo(() => {
    return cartStore.items.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);
  }, [cartStore.items]);

  const itemCount = useMemo(() => {
    return cartStore.items.reduce((count, item) => {
      return count + item.quantity;
    }, 0);
  }, [cartStore.items]);

  const total = useMemo(() => {
    let amount = subtotal;

    // Apply discount
    if (cartStore.discount) {
      if (cartStore.discount.type === 'percentage') {
        amount = amount - (amount * cartStore.discount.value / 100);
      } else if (cartStore.discount.type === 'fixed') {
        amount = amount - cartStore.discount.value;
      }
    }

    // Get tax rate from settings or use default
    const taxRate = parseFloat(localStorage.getItem('pos_tax_rate') || '8.5');
    const tax = amount * (taxRate / 100);

    return amount + tax;
  }, [subtotal, cartStore.discount]);

  // Enhanced addItem: check if item exists, increment qty or add new
  const addItem = (product, quantity = 1) => {
    const existing = cartStore.items.find(item => item.id === product.id);

    if (existing) {
      cartStore.updateQuantity(product.id, existing.quantity + quantity);
    } else {
      cartStore.addItem({
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: quantity,
        image: product.image_url,
        category: product.category,
      });
    }
  };

  // Apply discount with validation
  const applyDiscount = (discount) => {
    // Check min_purchase requirement
    if (discount.min_purchase && subtotal < discount.min_purchase) {
      throw new Error(`Minimum purchase of $${discount.min_purchase} required`);
    }

    cartStore.setDiscount(discount);
  };

  // Remove discount
  const removeDiscount = () => {
    cartStore.setDiscount(null);
  };

  return {
    items: cartStore.items,
    discount: cartStore.discount,
    addItem,
    removeItem: cartStore.removeItem,
    updateQuantity: cartStore.updateQuantity,
    clearCart: cartStore.clearCart,
    subtotal,
    total,
    itemCount,
    applyDiscount,
    removeDiscount,
  };
}
