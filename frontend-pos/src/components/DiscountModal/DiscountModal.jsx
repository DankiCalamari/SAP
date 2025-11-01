import React, { useState } from 'react';
import api from '../../api';
import { formatCurrency, formatDate } from '../../utils/format';
import { validateDiscountCode } from '../../utils/validators';

export default function DiscountModal({ isOpen, onClose, onDiscountApply, currentTotal }) {
  const [discountCode, setDiscountCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validatedDiscount, setValidatedDiscount] = useState(null);

  // Manager discount state
  const [showManagerDiscount, setShowManagerDiscount] = useState(false);
  const [managerPin, setManagerPin] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [manualDiscount, setManualDiscount] = useState({
    type: 'percentage',
    value: '',
    reason: '',
  });
  const [manualError, setManualError] = useState('');

  const handleValidateCode = async () => {
    setError('');
    setValidatedDiscount(null);

    if (!discountCode.trim()) {
      setError('Please enter a discount code');
      return;
    }

    if (!validateDiscountCode(discountCode)) {
      setError('Invalid discount code format');
      return;
    }

    setLoading(true);

    try {
      const response = await api.validateDiscount(discountCode.toUpperCase());
      const discount = response.data;

      // Check minimum purchase requirement
      if (discount.min_purchase && currentTotal < discount.min_purchase) {
        setError(`Minimum purchase of ${formatCurrency(discount.min_purchase)} required`);
        setLoading(false);
        return;
      }

      setValidatedDiscount(discount);
    } catch (err) {
      console.error('Error validating discount:', err);
      if (err.response?.status === 404 || err.response?.status === 400) {
        setError('Invalid or expired discount code');
      } else {
        setError('Unable to validate discount code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyValidatedDiscount = () => {
    if (validatedDiscount) {
      onDiscountApply(validatedDiscount);
      handleClose();
    }
  };

  const handleVerifyPin = async () => {
    if (!managerPin || managerPin.length < 4) {
      setManualError('Please enter manager PIN');
      return;
    }

    setVerifyingPin(true);
    setManualError('');

    try {
      await api.verifyManagerPin(managerPin);
      setPinVerified(true);
      setManualError('');
    } catch (err) {
      console.error('Error verifying PIN:', err);
      setManualError('Invalid PIN');
      setManagerPin('');
    } finally {
      setVerifyingPin(false);
    }
  };

  const handleApplyManualDiscount = () => {
    setManualError('');

    // Validation
    if (!manualDiscount.value || parseFloat(manualDiscount.value) <= 0) {
      setManualError('Please enter a valid discount value');
      return;
    }

    if (manualDiscount.type === 'percentage' && parseFloat(manualDiscount.value) > 100) {
      setManualError('Percentage cannot exceed 100%');
      return;
    }

    if (manualDiscount.type === 'fixed' && parseFloat(manualDiscount.value) >= currentTotal) {
      setManualError('Discount cannot exceed transaction total');
      return;
    }

    if (!manualDiscount.reason.trim()) {
      setManualError('Please provide a reason for the discount');
      return;
    }

    // Create manual discount object
    const discount = {
      code: 'MANAGER_OVERRIDE',
      name: `Manager Discount (${manualDiscount.reason})`,
      type: manualDiscount.type,
      value: parseFloat(manualDiscount.value),
      min_purchase: 0,
      is_manual: true,
    };

    onDiscountApply(discount);
    handleClose();
  };

  const handleClose = () => {
    setDiscountCode('');
    setError('');
    setValidatedDiscount(null);
    setShowManagerDiscount(false);
    setManagerPin('');
    setPinVerified(false);
    setManualDiscount({ type: 'percentage', value: '', reason: '' });
    setManualError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Apply Discount</h2>
          <button onClick={handleClose} style={styles.closeButton}>✕</button>
        </div>

        <div style={styles.content}>
          {/* Discount Code Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Discount Code</h3>

            {!validatedDiscount ? (
              <div style={styles.codeInput}>
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="Enter discount code"
                  style={styles.input}
                  disabled={loading}
                  onKeyPress={(e) => e.key === 'Enter' && handleValidateCode()}
                />
                <button
                  onClick={handleValidateCode}
                  disabled={loading}
                  style={{
                    ...styles.buttonPrimary,
                    ...(loading ? styles.buttonDisabled : {}),
                  }}
                >
                  {loading ? 'Validating...' : 'Apply'}
                </button>
              </div>
            ) : (
              <div style={styles.discountDetails}>
                <div style={styles.discountName}>{validatedDiscount.name}</div>
                <div style={styles.discountInfo}>
                  <span style={styles.discountType}>
                    {validatedDiscount.type === 'percentage'
                      ? `${validatedDiscount.value}% off`
                      : `${formatCurrency(validatedDiscount.value)} off`}
                  </span>
                </div>

                {validatedDiscount.valid_until && (
                  <div style={styles.discountMeta}>
                    Valid until: {formatDate(validatedDiscount.valid_until)}
                  </div>
                )}

                {validatedDiscount.min_purchase > 0 && (
                  <div style={styles.discountMeta}>
                    Minimum purchase: {formatCurrency(validatedDiscount.min_purchase)}
                  </div>
                )}

                <div style={styles.discountActions}>
                  <button onClick={() => setValidatedDiscount(null)} style={styles.buttonSecondary}>
                    Try Different Code
                  </button>
                  <button onClick={handleApplyValidatedDiscount} style={styles.buttonSuccess}>
                    Apply This Discount
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div style={styles.errorMessage}>{error}</div>
            )}
          </div>

          <div style={styles.divider}>OR</div>

          {/* Manager Discount Section */}
          <div style={styles.section}>
            <label style={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={showManagerDiscount}
                onChange={(e) => {
                  setShowManagerDiscount(e.target.checked);
                  if (!e.target.checked) {
                    setPinVerified(false);
                    setManagerPin('');
                    setManualError('');
                  }
                }}
                style={styles.checkbox}
              />
              <span>Manager Discount</span>
            </label>

            {showManagerDiscount && (
              <div style={styles.managerSection}>
                {!pinVerified ? (
                  <div>
                    <label style={styles.label}>Manager PIN</label>
                    <div style={styles.pinInput}>
                      <input
                        type="password"
                        value={managerPin}
                        onChange={(e) => setManagerPin(e.target.value)}
                        placeholder="Enter PIN"
                        maxLength={6}
                        style={styles.input}
                        disabled={verifyingPin}
                        onKeyPress={(e) => e.key === 'Enter' && handleVerifyPin()}
                      />
                      <button
                        onClick={handleVerifyPin}
                        disabled={verifyingPin}
                        style={{
                          ...styles.buttonPrimary,
                          ...(verifyingPin ? styles.buttonDisabled : {}),
                        }}
                      >
                        {verifyingPin ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={styles.label}>Discount Type</label>
                    <div style={styles.radioGroup}>
                      <label style={styles.radioLabel}>
                        <input
                          type="radio"
                          value="percentage"
                          checked={manualDiscount.type === 'percentage'}
                          onChange={(e) => setManualDiscount({...manualDiscount, type: e.target.value})}
                          style={styles.radio}
                        />
                        <span>Percentage</span>
                      </label>
                      <label style={styles.radioLabel}>
                        <input
                          type="radio"
                          value="fixed"
                          checked={manualDiscount.type === 'fixed'}
                          onChange={(e) => setManualDiscount({...manualDiscount, type: e.target.value})}
                          style={styles.radio}
                        />
                        <span>Fixed Amount</span>
                      </label>
                    </div>

                    <label style={styles.label}>
                      Discount Value {manualDiscount.type === 'percentage' ? '(%)' : '($)'}
                    </label>
                    <input
                      type="number"
                      value={manualDiscount.value}
                      onChange={(e) => setManualDiscount({...manualDiscount, value: e.target.value})}
                      placeholder={manualDiscount.type === 'percentage' ? 'e.g., 10' : 'e.g., 5.00'}
                      step={manualDiscount.type === 'percentage' ? '1' : '0.01'}
                      min="0"
                      max={manualDiscount.type === 'percentage' ? '100' : undefined}
                      style={styles.input}
                    />

                    <label style={styles.label}>Reason (Required)</label>
                    <input
                      type="text"
                      value={manualDiscount.reason}
                      onChange={(e) => setManualDiscount({...manualDiscount, reason: e.target.value})}
                      placeholder="Reason for discount"
                      style={styles.input}
                    />

                    <button onClick={handleApplyManualDiscount} style={styles.buttonPrimary}>
                      Apply Manual Discount
                    </button>
                  </div>
                )}

                {manualError && (
                  <div style={styles.errorMessage}>{manualError}</div>
                )}
              </div>
            )}
          </div>
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
    zIndex: 1500,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    width: '500px',
    maxWidth: '90%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
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
    marginBottom: '16px',
  },
  codeInput: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  buttonPrimary: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: '#2196f3',
    color: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  buttonSecondary: {
    padding: '12px 24px',
    border: '1px solid #d0d0d0',
    backgroundColor: '#ffffff',
    color: '#666666',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  buttonSuccess: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: '#4caf50',
    color: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#90caf9',
    cursor: 'not-allowed',
  },
  discountDetails: {
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  },
  discountName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  discountInfo: {
    marginBottom: '12px',
  },
  discountType: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#4caf50',
  },
  discountMeta: {
    fontSize: '14px',
    color: '#666666',
    marginBottom: '4px',
  },
  discountActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  errorMessage: {
    padding: '12px',
    marginTop: '12px',
    backgroundColor: '#ffebee',
    color: '#f44336',
    borderRadius: '4px',
    fontSize: '14px',
  },
  divider: {
    textAlign: 'center',
    margin: '24px 0',
    fontSize: '14px',
    color: '#999999',
    fontWeight: 'bold',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '16px',
  },
  checkbox: {
    marginRight: '8px',
    cursor: 'pointer',
  },
  managerSection: {
    padding: '16px',
    backgroundColor: '#fff3e0',
    borderRadius: '8px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666666',
    marginTop: '16px',
    marginBottom: '8px',
  },
  pinInput: {
    display: 'flex',
    gap: '8px',
  },
  radioGroup: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  radio: {
    marginRight: '8px',
    cursor: 'pointer',
  },
};
