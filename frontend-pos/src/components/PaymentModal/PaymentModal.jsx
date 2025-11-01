import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/format';
import { validateEmail } from '../../utils/validators';

export default function PaymentModal({ isOpen, onClose, total, onComplete }) {
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Cash payment state
  const [amountTendered, setAmountTendered] = useState('');
  const [change, setChange] = useState(0);

  // Card payment state
  const [cardType, setCardType] = useState('visa');
  const [lastFour, setLastFour] = useState('');
  const [authCode, setAuthCode] = useState('');

  // Mobile pay state
  const [mobilePayType, setMobilePayType] = useState('apple_pay');
  const [transactionId, setTransactionId] = useState('');

  // Split payment state
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [mobileAmount, setMobileAmount] = useState(0);
  const [remaining, setRemaining] = useState(total);

  // Email receipt state
  const [sendEmail, setSendEmail] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Calculate change for cash payment
  useEffect(() => {
    if (paymentMethod === 'cash' && amountTendered) {
      const tendered = parseFloat(amountTendered) || 0;
      setChange(Math.max(0, tendered - total));
    }
  }, [amountTendered, total, paymentMethod]);

  // Calculate remaining for split payment
  useEffect(() => {
    if (paymentMethod === 'split') {
      const paid = cashAmount + cardAmount + mobileAmount;
      setRemaining(Math.max(0, total - paid));
    }
  }, [cashAmount, cardAmount, mobileAmount, total, paymentMethod]);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setAmountTendered(total.toFixed(2));
      setChange(0);
      setCardType('visa');
      setLastFour('');
      setAuthCode('');
      setMobilePayType('apple_pay');
      setTransactionId('');
      setCashAmount(0);
      setCardAmount(0);
      setMobileAmount(0);
      setRemaining(total);
      setSendEmail(false);
      setCustomerEmail('');
      setEmailError('');
    }
  }, [isOpen, total]);

  const validateForm = () => {
    // Email validation
    if (sendEmail) {
      if (!customerEmail.trim()) {
        setEmailError('Email address required');
        return false;
      }
      if (!validateEmail(customerEmail)) {
        setEmailError('Invalid email format');
        return false;
      }
    }

    // Payment method specific validation
    if (paymentMethod === 'cash') {
      const tendered = parseFloat(amountTendered) || 0;
      if (tendered < total) {
        return false;
      }
    } else if (paymentMethod === 'split') {
      if (remaining > 0) {
        return false;
      }
    }

    return true;
  };

  const handleComplete = () => {
    if (!validateForm()) {
      return;
    }

    const paymentDetails = {
      payment_method: paymentMethod,
      customer_email: sendEmail ? customerEmail : null,
    };

    if (paymentMethod === 'cash') {
      paymentDetails.amount_tendered = parseFloat(amountTendered);
      paymentDetails.change = change;
    } else if (paymentMethod === 'card') {
      paymentDetails.card_details = {
        type: cardType,
        last_4: lastFour,
        auth_code: authCode,
      };
    } else if (paymentMethod === 'mobile_pay') {
      paymentDetails.mobile_details = {
        type: mobilePayType,
        transaction_id: transactionId,
      };
    } else if (paymentMethod === 'split') {
      paymentDetails.split_details = {
        cash: cashAmount,
        card: cardAmount,
        mobile: mobileAmount,
      };
    }

    onComplete(paymentDetails);
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Complete Payment - {formatCurrency(total)}</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        <div style={styles.content}>
          {/* Payment Method Selection */}
          <div style={styles.section}>
            <label style={styles.sectionTitle}>Payment Method</label>
            <div style={styles.radioGroup}>
              {[
                { value: 'cash', label: '💵 Cash' },
                { value: 'card', label: '💳 Card' },
                { value: 'mobile_pay', label: '📱 Mobile Pay' },
                { value: 'split', label: '🔀 Split Payment' },
              ].map((method) => (
                <label key={method.value} style={styles.radioLabel}>
                  <input
                    type="radio"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={styles.radio}
                  />
                  <span>{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Cash Payment Section */}
          {paymentMethod === 'cash' && (
            <div style={styles.section}>
              <label style={styles.label}>Amount Tendered</label>
              <input
                type="number"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                step="0.01"
                min={total}
                style={styles.input}
                autoFocus
              />
              {parseFloat(amountTendered) < total && (
                <div style={styles.error}>Insufficient amount</div>
              )}
              {change > 0 && (
                <div style={styles.changeDisplay}>
                  Change: <span style={styles.changeAmount}>{formatCurrency(change)}</span>
                </div>
              )}
            </div>
          )}

          {/* Card Payment Section */}
          {paymentMethod === 'card' && (
            <div style={styles.section}>
              <div style={styles.note}>
                Process card payment on terminal, then enter details
              </div>
              <label style={styles.label}>Card Type</label>
              <select value={cardType} onChange={(e) => setCardType(e.target.value)} style={styles.select}>
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="amex">American Express</option>
                <option value="discover">Discover</option>
                <option value="other">Other</option>
              </select>

              <label style={styles.label}>Last 4 Digits</label>
              <input
                type="text"
                value={lastFour}
                onChange={(e) => setLastFour(e.target.value.slice(0, 4))}
                placeholder="1234"
                maxLength={4}
                style={styles.input}
              />

              <label style={styles.label}>Authorization Code (Optional)</label>
              <input
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="Auth code"
                style={styles.input}
              />
            </div>
          )}

          {/* Mobile Pay Section */}
          {paymentMethod === 'mobile_pay' && (
            <div style={styles.section}>
              <div style={styles.note}>
                Complete payment on mobile device, then enter transaction ID
              </div>
              <label style={styles.label}>Payment Type</label>
              <select value={mobilePayType} onChange={(e) => setMobilePayType(e.target.value)} style={styles.select}>
                <option value="apple_pay">Apple Pay</option>
                <option value="google_pay">Google Pay</option>
                <option value="samsung_pay">Samsung Pay</option>
              </select>

              <label style={styles.label}>Transaction ID</label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Transaction ID"
                style={styles.input}
              />
            </div>
          )}

          {/* Split Payment Section */}
          {paymentMethod === 'split' && (
            <div style={styles.section}>
              <label style={styles.label}>Cash Amount</label>
              <input
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                style={styles.input}
              />

              <label style={styles.label}>Card Amount</label>
              <input
                type="number"
                value={cardAmount}
                onChange={(e) => setCardAmount(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                style={styles.input}
              />

              <label style={styles.label}>Mobile Pay Amount</label>
              <input
                type="number"
                value={mobileAmount}
                onChange={(e) => setMobileAmount(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                style={styles.input}
              />

              <div style={{
                ...styles.remainingDisplay,
                color: remaining > 0 ? '#f44336' : '#4caf50',
              }}>
                Remaining: {formatCurrency(remaining)}
              </div>
            </div>
          )}

          {/* Email Receipt Section */}
          <div style={styles.section}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => {
                  setSendEmail(e.target.checked);
                  setEmailError('');
                }}
                style={styles.checkbox}
              />
              <span>Email receipt</span>
            </label>

            {sendEmail && (
              <>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => {
                    setCustomerEmail(e.target.value);
                    setEmailError('');
                  }}
                  placeholder="customer@example.com"
                  style={{
                    ...styles.input,
                    ...(emailError ? styles.inputError : {}),
                  }}
                />
                {emailError && (
                  <div style={styles.error}>{emailError}</div>
                )}
              </>
            )}
          </div>
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.buttonCancel}>
            Cancel
          </button>
          <button
            onClick={handleComplete}
            disabled={!validateForm()}
            style={{
              ...styles.buttonComplete,
              ...(!validateForm() ? styles.buttonDisabled : {}),
            }}
          >
            Complete Transaction
          </button>
        </div>
      </div>
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
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    width: '600px',
    maxWidth: '90%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid #e0e0e0',
  },
  title: {
    fontSize: '24px',
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
  content: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    display: 'block',
    marginBottom: '12px',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '16px',
  },
  radio: {
    marginRight: '8px',
    cursor: 'pointer',
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666666',
    display: 'block',
    marginTop: '16px',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#f44336',
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  note: {
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#666666',
    marginBottom: '16px',
  },
  error: {
    color: '#f44336',
    fontSize: '14px',
    marginTop: '8px',
  },
  changeDisplay: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#e8f5e9',
    borderRadius: '4px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#4caf50',
    textAlign: 'center',
  },
  changeAmount: {
    fontSize: '24px',
  },
  remainingDisplay: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '18px',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '16px',
    marginBottom: '12px',
  },
  checkbox: {
    marginRight: '8px',
    cursor: 'pointer',
  },
  footer: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    padding: '24px',
    borderTop: '1px solid #e0e0e0',
  },
  buttonCancel: {
    padding: '14px 24px',
    border: '1px solid #d0d0d0',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#666666',
  },
  buttonComplete: {
    padding: '14px 24px',
    border: 'none',
    backgroundColor: '#2196f3',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  buttonDisabled: {
    backgroundColor: '#90caf9',
    cursor: 'not-allowed',
  },
};
