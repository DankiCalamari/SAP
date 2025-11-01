import React, { useState, useRef } from 'react';
import api from '../../api';
import { formatPhone } from '../../utils/format';
import { validateEmail, validatePhone } from '../../utils/validators';

export default function CustomerSearch({ isOpen, onClose, onCustomerSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');

  // Create form state
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [creating, setCreating] = useState(false);

  const debounceTimer = useRef(null);

  const search = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.searchCustomers(searchQuery);
      setResults(response.data || []);
    } catch (err) {
      console.error('Error searching customers:', err);
      setError('Unable to search customers. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      search(value);
    }, 300);
  };

  const handleCustomerClick = (customer) => {
    onCustomerSelect(customer);
    handleClose();
  };

  const validateCreateForm = () => {
    const errors = {};

    if (!newCustomer.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!newCustomer.phone.trim()) {
      errors.phone = 'Phone is required';
    } else if (!validatePhone(newCustomer.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (!newCustomer.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(newCustomer.email)) {
      errors.email = 'Please enter a valid email';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();

    if (!validateCreateForm()) {
      return;
    }

    setCreating(true);
    setError('');

    try {
      const response = await api.createCustomer({
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.replace(/\D/g, ''), // Remove formatting
        email: newCustomer.email.trim(),
      });

      // Select the newly created customer
      onCustomerSelect(response.data);
      handleClose();
    } catch (err) {
      console.error('Error creating customer:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Unable to create customer. Try again.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setShowCreateForm(false);
    setNewCustomer({ name: '', phone: '', email: '' });
    setFormErrors({});
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Customer Lookup</h2>
          <button onClick={handleClose} style={styles.closeButton}>✕</button>
        </div>

        <div style={styles.content}>
          {!showCreateForm ? (
            <>
              {/* Search Input */}
              <input
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="Search by name, phone, or email"
                style={styles.searchInput}
                autoFocus
              />

              {/* Error Message */}
              {error && (
                <div style={styles.errorMessage}>{error}</div>
              )}

              {/* Results */}
              <div style={styles.results}>
                {loading ? (
                  <div style={styles.emptyState}>Searching...</div>
                ) : query.length < 2 ? (
                  <div style={styles.emptyState}>
                    Enter customer information to search
                  </div>
                ) : results.length === 0 ? (
                  <div style={styles.emptyStateWithAction}>
                    <div style={styles.emptyText}>No customers found</div>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      style={styles.createButton}
                    >
                      Create New Customer
                    </button>
                  </div>
                ) : (
                  results.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleCustomerClick(customer)}
                      style={styles.customerCard}
                    >
                      <div style={styles.customerName}>{customer.name}</div>
                      <div style={styles.customerDetail}>{formatPhone(customer.phone)}</div>
                      <div style={styles.customerDetail}>{customer.email}</div>
                      {customer.loyalty_points !== undefined && (
                        <div style={styles.loyaltyPoints}>
                          Points: {customer.loyalty_points}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Create Customer Form */}
              <div style={styles.formHeader}>
                <h3 style={styles.formTitle}>Create New Customer</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  style={styles.backButton}
                >
                  ← Back to Search
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name *</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    placeholder="Full name"
                    style={{
                      ...styles.input,
                      ...(formErrors.name ? styles.inputError : {}),
                    }}
                  />
                  {formErrors.name && (
                    <div style={styles.fieldError}>{formErrors.name}</div>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone *</label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    placeholder="(555) 555-5555"
                    style={{
                      ...styles.input,
                      ...(formErrors.phone ? styles.inputError : {}),
                    }}
                  />
                  {formErrors.phone && (
                    <div style={styles.fieldError}>{formErrors.phone}</div>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email *</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    placeholder="email@example.com"
                    style={{
                      ...styles.input,
                      ...(formErrors.email ? styles.inputError : {}),
                    }}
                  />
                  {formErrors.email && (
                    <div style={styles.fieldError}>{formErrors.email}</div>
                  )}
                </div>

                {error && (
                  <div style={styles.errorMessage}>{error}</div>
                )}

                <div style={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    style={styles.buttonCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    style={{
                      ...styles.buttonSubmit,
                      ...(creating ? styles.buttonDisabled : {}),
                    }}
                  >
                    {creating ? 'Creating...' : 'Create Customer'}
                  </button>
                </div>
              </form>
            </>
          )}
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
    maxHeight: '80vh',
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
  searchInput: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    boxSizing: 'border-box',
    marginBottom: '16px',
  },
  results: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#999999',
    fontSize: '14px',
  },
  emptyStateWithAction: {
    padding: '40px 20px',
    textAlign: 'center',
  },
  emptyText: {
    color: '#999999',
    fontSize: '14px',
    marginBottom: '16px',
  },
  createButton: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: '#2196f3',
    color: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  customerCard: {
    padding: '16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#ffffff',
  },
  customerName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  customerDetail: {
    fontSize: '14px',
    color: '#666666',
    marginBottom: '4px',
  },
  loyaltyPoints: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#2196f3',
    marginTop: '8px',
  },
  formHeader: {
    marginBottom: '24px',
  },
  formTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '12px',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#2196f3',
    cursor: 'pointer',
    fontSize: '14px',
    padding: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666666',
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
  fieldError: {
    color: '#f44336',
    fontSize: '12px',
    marginTop: '4px',
  },
  errorMessage: {
    padding: '12px',
    backgroundColor: '#ffebee',
    color: '#f44336',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
  buttonCancel: {
    padding: '12px 24px',
    border: '1px solid #d0d0d0',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666666',
  },
  buttonSubmit: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: '#2196f3',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  buttonDisabled: {
    backgroundColor: '#90caf9',
    cursor: 'not-allowed',
  },
};
