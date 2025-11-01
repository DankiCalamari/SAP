import React, { useState } from 'react';
import { formatCurrency } from '../../utils/format';

export default function Cart({ items, onQuantityChange, onRemoveItem, readonly = false }) {
  const [confirmingRemoval, setConfirmingRemoval] = useState(null);

  const handleQuantityChange = (item, delta) => {
    const newQuantity = item.quantity + delta;

    if (newQuantity === 0) {
      // Show confirmation for removal
      setConfirmingRemoval(item.id);
    } else {
      onQuantityChange(item.id, newQuantity);
    }
  };

  const handleRemoveClick = (item) => {
    if (item.quantity > 1) {
      setConfirmingRemoval(item.id);
    } else {
      onRemoveItem(item.id);
    }
  };

  const confirmRemoval = (itemId) => {
    onRemoveItem(itemId);
    setConfirmingRemoval(null);
  };

  const cancelRemoval = () => {
    setConfirmingRemoval(null);
  };

  if (items.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>🛒</div>
        <div style={styles.emptyText}>Cart is empty</div>
        <div style={styles.emptySubtext}>Scan or search for items to add</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.headerRow}>
            <th style={styles.headerCell}>Image</th>
            <th style={{...styles.headerCell, textAlign: 'left'}}>Name</th>
            <th style={styles.headerCell}>SKU</th>
            <th style={styles.headerCell}>Qty</th>
            <th style={styles.headerCell}>Unit Price</th>
            <th style={styles.headerCell}>Subtotal</th>
            {!readonly && <th style={styles.headerCell}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} style={styles.row}>
              <td style={styles.cell}>
                <div style={styles.imageContainer}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={styles.image} />
                  ) : (
                    <div style={styles.imagePlaceholder}>📦</div>
                  )}
                </div>
              </td>
              <td style={{...styles.cell, textAlign: 'left'}}>
                <div style={styles.productName}>{item.name}</div>
                {item.category && (
                  <div style={styles.productCategory}>{item.category}</div>
                )}
              </td>
              <td style={styles.cell}>
                <div style={styles.sku}>{item.sku}</div>
              </td>
              <td style={styles.cell}>
                {readonly ? (
                  <div style={styles.quantityReadonly}>{item.quantity}</div>
                ) : (
                  <div style={styles.quantityControls}>
                    <button
                      onClick={() => handleQuantityChange(item, -1)}
                      disabled={item.quantity <= 1}
                      style={{
                        ...styles.quantityButton,
                        ...(item.quantity <= 1 ? styles.quantityButtonDisabled : {})
                      }}
                    >
                      −
                    </button>
                    <div style={styles.quantityDisplay}>{item.quantity}</div>
                    <button
                      onClick={() => handleQuantityChange(item, 1)}
                      style={styles.quantityButton}
                    >
                      +
                    </button>
                  </div>
                )}
              </td>
              <td style={styles.cell}>
                <div style={styles.price}>{formatCurrency(item.price)}</div>
              </td>
              <td style={styles.cell}>
                <div style={styles.subtotal}>{formatCurrency(item.price * item.quantity)}</div>
              </td>
              {!readonly && (
                <td style={styles.cell}>
                  <button
                    onClick={() => handleRemoveClick(item)}
                    style={styles.removeButton}
                    title="Remove item"
                  >
                    ✕
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Confirmation Modal */}
      {confirmingRemoval && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>Remove Item?</div>
            <div style={styles.modalText}>
              {items.find(i => i.id === confirmingRemoval)?.quantity > 1
                ? `Remove ${items.find(i => i.id === confirmingRemoval)?.quantity} units of ${items.find(i => i.id === confirmingRemoval)?.name}?`
                : 'Remove this item from cart?'}
            </div>
            <div style={styles.modalActions}>
              <button onClick={cancelRemoval} style={styles.modalButtonCancel}>
                Cancel
              </button>
              <button onClick={() => confirmRemoval(confirmingRemoval)} style={styles.modalButtonConfirm}>
                Remove
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
    width: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  headerRow: {
    borderBottom: '2px solid #e0e0e0',
  },
  headerCell: {
    padding: '12px 8px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666666',
    textAlign: 'center',
  },
  row: {
    borderBottom: '1px solid #f0f0f0',
  },
  cell: {
    padding: '12px 8px',
    textAlign: 'center',
    verticalAlign: 'middle',
  },
  imageContainer: {
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
  },
  image: {
    maxWidth: '48px',
    maxHeight: '48px',
    objectFit: 'contain',
  },
  imagePlaceholder: {
    fontSize: '24px',
  },
  productName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  productCategory: {
    fontSize: '12px',
    color: '#999999',
    marginTop: '4px',
  },
  sku: {
    fontSize: '12px',
    color: '#666666',
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  quantityButton: {
    width: '32px',
    height: '32px',
    border: '1px solid #d0d0d0',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#404040',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  quantityDisplay: {
    fontSize: '16px',
    fontWeight: 'bold',
    width: '40px',
    textAlign: 'center',
  },
  quantityReadonly: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  price: {
    fontSize: '14px',
    color: '#666666',
  },
  subtotal: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  removeButton: {
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: '#f44336',
    color: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    opacity: 0.5,
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: '8px',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#999999',
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
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '400px',
    width: '90%',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '16px',
  },
  modalText: {
    fontSize: '14px',
    color: '#666666',
    marginBottom: '24px',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  modalButtonCancel: {
    padding: '10px 20px',
    border: '1px solid #d0d0d0',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666666',
  },
  modalButtonConfirm: {
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
