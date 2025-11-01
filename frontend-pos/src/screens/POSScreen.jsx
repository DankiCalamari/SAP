import React, { useState } from 'react';
import { useAuthStore } from '../store';
import { useCart } from '../hooks/useCart';
import ProductSearch from '../components/ProductSearch/ProductSearch';
import Cart from '../components/Cart/Cart';
import PaymentModal from '../components/PaymentModal/PaymentModal';
import ReceiptPrinter from '../components/ReceiptPrinter/ReceiptPrinter';
import CustomerSearch from '../components/CustomerSearch/CustomerSearch';
import DiscountModal from '../components/DiscountModal/DiscountModal';
import { formatCurrency } from '../utils/format';
import api from '../api';

export default function POSScreen() {
  const { user, logout } = useAuthStore();
  const cart = useCart();

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Transaction state
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');

  // Receipt settings from localStorage
  const receiptSettings = {
    headerText: localStorage.getItem('pos_receipt_header') || '',
    footerText: localStorage.getItem('pos_receipt_footer') || 'Thank you for your purchase!',
    showLogo: localStorage.getItem('pos_receipt_show_logo') === 'true',
    logoUrl: localStorage.getItem('pos_receipt_logo_url') || '',
  };

  // Handle product selection from search
  const handleProductSelect = (product) => {
    try {
      cart.addItem(product, 1);
    } catch (err) {
      console.error('Error adding product:', err);
      setError('Unable to add product to cart');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
  };

  // Handle discount application
  const handleDiscountApply = (discount) => {
    try {
      cart.applyDiscount(discount);
      setShowDiscountModal(false);
    } catch (err) {
      console.error('Error applying discount:', err);
      setError(err.message || 'Unable to apply discount');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Handle payment completion
  const handlePaymentComplete = async (paymentDetails) => {
    setProcessingPayment(true);
    setError('');

    try {
      // Prepare transaction data
      const transactionData = {
        items: cart.items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        payment_method: paymentDetails.payment_method,
        customer_id: selectedCustomer?.id || null,
        discount_id: cart.discount?.id || null,
        ...paymentDetails,
      };

      // Create transaction
      const response = await api.createSale(transactionData);
      const transaction = response.data;

      // Close payment modal
      setShowPaymentModal(false);

      // Store transaction for receipt
      setCurrentTransaction({
        ...transaction,
        items: cart.items,
        cashier_name: user.username || user.name,
        customer_name: selectedCustomer?.name || null,
        customer_email: paymentDetails.customer_email,
        store_name: 'SAP Store', // TODO: Get from settings
      });

      // Clear cart and customer
      cart.clearCart();
      setSelectedCustomer(null);

      // Show receipt
      setShowReceiptModal(true);
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err.response?.data?.message || 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle clear cart
  const handleClearCart = () => {
    cart.clearCart();
    setSelectedCustomer(null);
    setShowClearConfirm(false);
  };

  // Handle logout
  const handleLogout = () => {
    if (cart.items.length > 0) {
      if (!window.confirm('Cart has items. Are you sure you want to logout?')) {
        return;
      }
    }
    cart.clearCart();
    logout();
  };

  // Calculate tax
  const taxRate = parseFloat(localStorage.getItem('pos_tax_rate') || '8.5');
  const subtotalAfterDiscount = cart.discount
    ? cart.discount.type === 'percentage'
      ? cart.subtotal * (1 - cart.discount.value / 100)
      : cart.subtotal - cart.discount.value
    : cart.subtotal;
  const tax = subtotalAfterDiscount * (taxRate / 100);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (e) => {
      // Check if keyboard shortcuts are enabled
      const shortcutsEnabled = localStorage.getItem('pos_shortcuts_enabled') !== 'false';
      if (!shortcutsEnabled) return;

      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'F2') {
        e.preventDefault();
        setShowDiscountModal(true);
      } else if (e.key === 'F3') {
        e.preventDefault();
        setShowCustomerModal(true);
      } else if (e.key === 'F4' && cart.items.length > 0) {
        e.preventDefault();
        setShowPaymentModal(true);
      } else if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        if (cart.items.length > 0) {
          setShowClearConfirm(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cart.items.length]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.storeName}>SAP POS System</div>
        <div style={styles.cashierInfo}>Cashier: {user.username || user.name}</div>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Log Out
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Left Panel - Cart */}
        <div style={styles.leftPanel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Current Sale</h2>
          </div>

          <div style={styles.cartContainer}>
            <Cart
              items={cart.items}
              onQuantityChange={cart.updateQuantity}
              onRemoveItem={cart.removeItem}
            />
          </div>

          {/* Totals */}
          {cart.items.length > 0 && (
            <div style={styles.totals}>
              <div style={styles.totalRow}>
                <span>Subtotal:</span>
                <span>{formatCurrency(cart.subtotal)}</span>
              </div>

              {cart.discount && (
                <div style={{...styles.totalRow, color: '#4caf50'}}>
                  <span>Discount ({cart.discount.name}):</span>
                  <span>
                    -
                    {cart.discount.type === 'percentage'
                      ? formatCurrency(cart.subtotal * cart.discount.value / 100)
                      : formatCurrency(cart.discount.value)}
                  </span>
                </div>
              )}

              <div style={styles.totalRow}>
                <span>Tax ({taxRate}%):</span>
                <span>{formatCurrency(tax)}</span>
              </div>

              <div style={styles.grandTotal}>
                <span>TOTAL:</span>
                <span>{formatCurrency(cart.total)}</span>
              </div>

              {selectedCustomer && (
                <div style={styles.customerInfo}>
                  Customer: {selectedCustomer.name}
                  {selectedCustomer.loyalty_points !== undefined && (
                    <span style={styles.loyaltyPoints}> ({selectedCustomer.loyalty_points} points)</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Product Search */}
        <div style={styles.rightPanel}>
          <div style={styles.searchSection}>
            <ProductSearch
              onProductSelect={handleProductSelect}
              placeholder="Scan or search products..."
              autoFocus
            />
          </div>

          {/* Action Buttons */}
          <div style={styles.actions}>
            <button
              onClick={() => setShowDiscountModal(true)}
              disabled={cart.items.length === 0}
              style={{
                ...styles.actionButton,
                ...(cart.items.length === 0 ? styles.buttonDisabled : {}),
              }}
            >
              🏷️ Apply Discount (F2)
            </button>

            <button
              onClick={() => setShowCustomerModal(true)}
              style={styles.actionButton}
            >
              👤 Customer Lookup (F3)
            </button>

            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={cart.items.length === 0}
              style={{
                ...styles.completeSaleButton,
                ...(cart.items.length === 0 ? styles.buttonDisabled : {}),
              }}
            >
              💳 Complete Sale (F4)
            </button>

            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={cart.items.length === 0}
              style={{
                ...styles.clearButton,
                ...(cart.items.length === 0 ? styles.buttonDisabled : {}),
              }}
            >
              🗑️ Clear Cart
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div style={styles.errorAlert}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={cart.total}
        onComplete={handlePaymentComplete}
      />

      {showReceiptModal && currentTransaction && (
        <ReceiptPrinter
          transaction={currentTransaction}
          receiptSettings={receiptSettings}
          onClose={() => {
            setShowReceiptModal(false);
            setCurrentTransaction(null);
          }}
          type="sale"
        />
      )}

      <CustomerSearch
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onCustomerSelect={handleCustomerSelect}
      />

      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onDiscountApply={handleDiscountApply}
        currentTotal={cart.subtotal}
      />

      {/* Clear Cart Confirmation */}
      {showClearConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmModal}>
            <h3 style={styles.confirmTitle}>Clear Cart?</h3>
            <p style={styles.confirmText}>
              This will remove all items from the cart. This action cannot be undone.
            </p>
            <div style={styles.confirmActions}>
              <button onClick={() => setShowClearConfirm(false)} style={styles.buttonCancel}>
                Cancel
              </button>
              <button onClick={handleClearCart} style={styles.buttonConfirm}>
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    height: '64px',
    boxSizing: 'border-box',
  },
  storeName: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  cashierInfo: {
    fontSize: '16px',
  },
  logoutButton: {
    padding: '8px 16px',
    border: '1px solid #ffffff',
    backgroundColor: 'transparent',
    color: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  content: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  leftPanel: {
    flex: '0 0 60%',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #e0e0e0',
  },
  panelHeader: {
    padding: '24px',
    borderBottom: '1px solid #e0e0e0',
  },
  panelTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: 0,
  },
  cartContainer: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
  totals: {
    padding: '24px',
    borderTop: '2px solid #e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '16px',
  },
  grandTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '24px',
    fontWeight: 'bold',
    padding: '16px',
    marginTop: '8px',
    backgroundColor: '#404040',
    color: '#ffffff',
    borderRadius: '4px',
  },
  customerInfo: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#e3f2fd',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#1a1a1a',
  },
  loyaltyPoints: {
    fontWeight: 'bold',
    color: '#2196f3',
  },
  rightPanel: {
    flex: '0 0 40%',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    overflow: 'auto',
  },
  searchSection: {
    marginBottom: '24px',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  actionButton: {
    padding: '14px',
    border: '1px solid #d0d0d0',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'left',
    transition: 'background-color 0.2s',
  },
  completeSaleButton: {
    padding: '18px',
    border: 'none',
    backgroundColor: '#2196f3',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  clearButton: {
    padding: '14px',
    border: '1px solid #f44336',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#f44336',
    textAlign: 'left',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  errorAlert: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#ffebee',
    color: '#f44336',
    borderRadius: '4px',
    fontSize: '14px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  confirmModal: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '400px',
    width: '90%',
  },
  confirmTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 0,
    marginBottom: '16px',
  },
  confirmText: {
    fontSize: '14px',
    color: '#666666',
    marginBottom: '24px',
  },
  confirmActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  buttonCancel: {
    padding: '10px 20px',
    border: '1px solid #d0d0d0',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666666',
  },
  buttonConfirm: {
    padding: '10px 20px',
    border: 'none',
    backgroundColor: '#f44336',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#ffffff',
  },
};
