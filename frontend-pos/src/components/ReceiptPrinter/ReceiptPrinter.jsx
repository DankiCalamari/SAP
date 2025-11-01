import React, { useRef } from 'react';
import { formatCurrency, formatDate } from '../../utils/format';
import { usePrinter } from '../../hooks/usePrinter';

export default function ReceiptPrinter({ transaction, receiptSettings, onClose, type = 'sale' }) {
  const receiptRef = useRef(null);
  const { print, emailReceipt } = usePrinter();
  const [emailSending, setEmailSending] = React.useState(false);
  const [emailSuccess, setEmailSuccess] = React.useState(false);
  const [emailError, setEmailError] = React.useState('');

  const handlePrint = () => {
    if (receiptRef.current) {
      print(receiptRef.current);
    }
  };

  const handleEmail = async () => {
    if (!transaction.customer_email) {
      setEmailError('No customer email address');
      return;
    }

    setEmailSending(true);
    setEmailError('');

    try {
      await emailReceipt(transaction.id, transaction.customer_email);
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (err) {
      setEmailError('Failed to send email');
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>{type === 'return' ? 'Return Receipt' : 'Sale Receipt'}</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        <div style={styles.receiptContainer}>
          <div ref={receiptRef} style={styles.receipt}>
            {/* Logo (if configured) */}
            {receiptSettings?.showLogo && receiptSettings?.logoUrl && (
              <div style={styles.logoContainer}>
                <img src={receiptSettings.logoUrl} alt="Store Logo" style={styles.logo} />
              </div>
            )}

            {/* Store Info */}
            <div style={styles.storeName}>{transaction.store_name || 'SAP Store'}</div>
            <div style={styles.storeInfo}>{transaction.store_address || ''}</div>
            <div style={styles.storeInfo}>{transaction.store_phone || ''}</div>

            <div style={styles.divider}>- - - - - - - - - - - - - - - -</div>

            {/* Custom Header Text */}
            {receiptSettings?.headerText && (
              <div style={styles.customText}>{receiptSettings.headerText}</div>
            )}

            {/* Return Receipt Banner */}
            {type === 'return' && (
              <>
                <div style={styles.returnBanner}>*** RETURN RECEIPT ***</div>
                <div style={styles.originalReceipt}>Original Receipt: #{transaction.original_receipt_id}</div>
              </>
            )}

            {/* Transaction Info */}
            <div style={styles.transactionInfo}>
              <div style={styles.infoRow}>
                <span>Receipt #:</span>
                <span>#{transaction.id || transaction.receipt_number}</span>
              </div>
              <div style={styles.infoRow}>
                <span>Date:</span>
                <span>{formatDate(transaction.created_at || new Date().toISOString(), 'time')}</span>
              </div>
              <div style={styles.infoRow}>
                <span>Cashier:</span>
                <span>{transaction.cashier_name || 'Unknown'}</span>
              </div>
              <div style={styles.infoRow}>
                <span>Customer:</span>
                <span>{transaction.customer_name || 'Walk-in'}</span>
              </div>
            </div>

            <div style={styles.divider}>- - - - - - - - - - - - - - - -</div>

            {/* Items Table */}
            <div style={styles.itemsHeader}>
              <span style={{flex: '0 0 30px'}}>Qty</span>
              <span style={{flex: 1}}>Item</span>
              <span style={{flex: '0 0 60px', textAlign: 'right'}}>Total</span>
            </div>

            {(transaction.items || []).map((item, index) => (
              <div key={index}>
                <div style={styles.itemRow}>
                  <span style={{flex: '0 0 30px'}}>{item.quantity}</span>
                  <span style={{flex: 1}}>{item.name}</span>
                  <span style={{flex: '0 0 60px', textAlign: 'right'}}>
                    {formatCurrency(item.quantity * item.price)}
                  </span>
                </div>
                <div style={styles.itemDetail}>
                  {formatCurrency(item.price)} each
                </div>
              </div>
            ))}

            <div style={styles.divider}>- - - - - - - - - - - - - - - -</div>

            {/* Totals */}
            <div style={styles.totalRow}>
              <span>Subtotal:</span>
              <span>{formatCurrency(transaction.subtotal || 0)}</span>
            </div>

            {transaction.discount && transaction.discount > 0 && (
              <div style={styles.totalRow}>
                <span>Discount ({transaction.discount_name}):</span>
                <span>-{formatCurrency(transaction.discount)}</span>
              </div>
            )}

            <div style={styles.totalRow}>
              <span>Tax ({transaction.tax_rate || 8.5}%):</span>
              <span>{formatCurrency(transaction.tax || 0)}</span>
            </div>

            <div style={styles.divider}>==========================</div>

            <div style={styles.grandTotal}>
              <span>TOTAL:</span>
              <span>{formatCurrency(transaction.total || 0)}</span>
            </div>

            <div style={styles.divider}>- - - - - - - - - - - - - - - -</div>

            {/* Payment Info */}
            <div style={styles.paymentInfo}>
              <div style={styles.paymentRow}>
                <span>Paid:</span>
                <span style={{textTransform: 'capitalize'}}>
                  {(transaction.payment_method || 'cash').replace('_', ' ')}
                </span>
              </div>

              {transaction.payment_method === 'cash' && transaction.amount_tendered && (
                <>
                  <div style={styles.paymentRow}>
                    <span>Tendered:</span>
                    <span>{formatCurrency(transaction.amount_tendered)}</span>
                  </div>
                  <div style={styles.paymentRow}>
                    <span>Change:</span>
                    <span>{formatCurrency(transaction.change || 0)}</span>
                  </div>
                </>
              )}

              {transaction.payment_method === 'card' && transaction.card_details && (
                <>
                  <div style={styles.paymentRow}>
                    <span>Card:</span>
                    <span style={{textTransform: 'capitalize'}}>
                      {transaction.card_details.type} ending in {transaction.card_details.last_4}
                    </span>
                  </div>
                  {transaction.card_details.auth_code && (
                    <div style={styles.paymentRow}>
                      <span>Auth:</span>
                      <span>{transaction.card_details.auth_code}</span>
                    </div>
                  )}
                </>
              )}

              {transaction.payment_method === 'split' && transaction.split_details && (
                <>
                  {transaction.split_details.cash > 0 && (
                    <div style={styles.paymentRow}>
                      <span>Cash:</span>
                      <span>{formatCurrency(transaction.split_details.cash)}</span>
                    </div>
                  )}
                  {transaction.split_details.card > 0 && (
                    <div style={styles.paymentRow}>
                      <span>Card:</span>
                      <span>{formatCurrency(transaction.split_details.card)}</span>
                    </div>
                  )}
                  {transaction.split_details.mobile > 0 && (
                    <div style={styles.paymentRow}>
                      <span>Mobile Pay:</span>
                      <span>{formatCurrency(transaction.split_details.mobile)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={styles.divider}>- - - - - - - - - - - - - - - -</div>

            {/* Footer */}
            {receiptSettings?.footerText && (
              <div style={styles.customText}>{receiptSettings.footerText}</div>
            )}

            <div style={styles.footer}>Thank you for your purchase!</div>
            <div style={styles.footer}>Returns accepted within 60 days with receipt</div>

            {/* Barcode (simple text representation) */}
            <div style={styles.barcode}>
              *{transaction.id || transaction.receipt_number}*
            </div>
          </div>
        </div>

        <div style={styles.actions}>
          <button onClick={handlePrint} style={styles.button}>
            🖨️ Print Receipt
          </button>

          {transaction.customer_email && (
            <button
              onClick={handleEmail}
              disabled={emailSending}
              style={{
                ...styles.button,
                ...(emailSending ? styles.buttonDisabled : {}),
              }}
            >
              {emailSending ? '📧 Sending...' : '📧 Email Receipt'}
            </button>
          )}

          <button onClick={onClose} style={styles.buttonSecondary}>
            Close
          </button>
        </div>

        {emailSuccess && (
          <div style={styles.successMessage}>Email sent successfully!</div>
        )}

        {emailError && (
          <div style={styles.errorMessage}>{emailError}</div>
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          ${receiptRef.current && `#receipt-${transaction.id}`} * {
            visibility: visible;
          }
          ${receiptRef.current && `#receipt-${transaction.id}`} {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  overlay: {
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
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #e0e0e0',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666666',
  },
  receiptContainer: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  receipt: {
    width: '300px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    padding: '16px',
    fontFamily: 'monospace',
    fontSize: '12px',
    lineHeight: '1.5',
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  logo: {
    maxWidth: '200px',
    maxHeight: '80px',
  },
  storeName: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    marginBottom: '4px',
  },
  storeInfo: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#666666',
  },
  divider: {
    margin: '12px 0',
    textAlign: 'center',
    color: '#999999',
  },
  customText: {
    textAlign: 'center',
    fontSize: '12px',
    margin: '12px 0',
  },
  returnBanner: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#f44336',
    fontSize: '14px',
    margin: '12px 0',
  },
  originalReceipt: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#666666',
    marginBottom: '12px',
  },
  transactionInfo: {
    fontSize: '11px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  itemsHeader: {
    display: 'flex',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  itemRow: {
    display: 'flex',
    marginBottom: '2px',
  },
  itemDetail: {
    fontSize: '10px',
    color: '#666666',
    marginLeft: '30px',
    marginBottom: '6px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
    fontSize: '11px',
  },
  grandTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: 'bold',
    fontSize: '16px',
    marginBottom: '8px',
  },
  paymentInfo: {
    fontSize: '11px',
  },
  paymentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  footer: {
    textAlign: 'center',
    fontSize: '11px',
    marginBottom: '4px',
  },
  barcode: {
    textAlign: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    marginTop: '12px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #e0e0e0',
  },
  button: {
    flex: 1,
    padding: '12px',
    border: 'none',
    backgroundColor: '#2196f3',
    color: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  buttonSecondary: {
    flex: 1,
    padding: '12px',
    border: '1px solid #d0d0d0',
    backgroundColor: '#ffffff',
    color: '#666666',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#90caf9',
    cursor: 'not-allowed',
  },
  successMessage: {
    padding: '12px',
    margin: '0 24px 16px',
    backgroundColor: '#e8f5e9',
    color: '#4caf50',
    borderRadius: '4px',
    textAlign: 'center',
    fontSize: '14px',
  },
  errorMessage: {
    padding: '12px',
    margin: '0 24px 16px',
    backgroundColor: '#ffebee',
    color: '#f44336',
    borderRadius: '4px',
    textAlign: 'center',
    fontSize: '14px',
  },
};
