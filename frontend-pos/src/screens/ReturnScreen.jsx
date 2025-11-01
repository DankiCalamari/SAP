import React, { useState } from 'react';
import api from '../api';
import { formatCurrency, formatDate } from '../utils/format';
import { isReturnEligible } from '../utils/validators';
import ReceiptPrinter from '../components/ReceiptPrinter/ReceiptPrinter';

export default function ReturnScreen() {
  // Search state
  const [searchTab, setSearchTab] = useState('receipt'); // 'receipt' | 'date' | 'customer'
  const [receiptNumber, setReceiptNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Return processing state
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [returnItems, setReturnItems] = useState({});
  const [returnReason, setReturnReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [returnTransaction, setReturnTransaction] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Search by receipt number
  const handleSearchByReceipt = async () => {
    if (!receiptNumber.trim()) {
      setSearchError('Please enter a receipt number');
      return;
    }

    setSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const response = await api.getSaleById(receiptNumber);
      setSelectedTransaction(response.data);
      initializeReturnItems(response.data);
    } catch (err) {
      console.error('Error finding transaction:', err);
      if (err.response?.status === 404) {
        setSearchError('Transaction not found. Check receipt number.');
      } else {
        setSearchError('Unable to search. Try again.');
      }
    } finally {
      setSearching(false);
    }
  };

  // Search by date range
  const handleSearchByDate = async () => {
    if (!startDate || !endDate) {
      setSearchError('Please select both start and end dates');
      return;
    }

    setSearching(true);
    setSearchError('');

    try {
      const response = await api.getSales({
        start_date: startDate,
        end_date: endDate,
        customer: customerQuery || undefined,
      });
      setSearchResults(response.data || []);

      if (response.data.length === 0) {
        setSearchError('No transactions found for selected dates');
      }
    } catch (err) {
      console.error('Error searching transactions:', err);
      setSearchError('Unable to search. Try again.');
    } finally {
      setSearching(false);
    }
  };

  // Search by customer
  const handleSearchByCustomer = async () => {
    if (!customerQuery.trim()) {
      setSearchError('Please enter customer name, phone, or email');
      return;
    }

    setSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const response = await api.searchCustomers(customerQuery);
      const customers = response.data || [];

      if (customers.length === 0) {
        setSearchError('No customers found');
        setSearching(false);
        return;
      }

      // Get transactions for first customer
      const customer = customers[0];
      const salesResponse = await api.getSales({ customer: customer.id });
      setSearchResults(salesResponse.data || []);

      if (salesResponse.data.length === 0) {
        setSearchError('No transactions found for this customer');
      }
    } catch (err) {
      console.error('Error searching by customer:', err);
      setSearchError('Unable to search. Try again.');
    } finally {
      setSearching(false);
    }
  };

  // Initialize return items state
  const initializeReturnItems = (transaction) => {
    const items = {};
    transaction.items.forEach(item => {
      items[item.id] = {
        selected: false,
        quantity: item.quantity,
      };
    });
    setReturnItems(items);
  };

  // Handle transaction selection from results
  const handleSelectTransaction = async (transaction) => {
    try {
      const response = await api.getSaleById(transaction.id);
      setSelectedTransaction(response.data);
      initializeReturnItems(response.data);
      setSearchResults([]);
    } catch (err) {
      console.error('Error loading transaction:', err);
      setError('Unable to load transaction details');
    }
  };

  // Toggle item selection
  const handleToggleItem = (itemId) => {
    setReturnItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId].selected,
      },
    }));
  };

  // Update return quantity
  const handleQuantityChange = (itemId, quantity) => {
    const item = selectedTransaction.items.find(i => i.id === itemId);
    const maxQty = item.quantity;

    setReturnItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: Math.max(1, Math.min(maxQty, quantity)),
      },
    }));
  };

  // Calculate return total
  const calculateReturnTotal = () => {
    if (!selectedTransaction) return 0;

    let total = 0;
    selectedTransaction.items.forEach(item => {
      if (returnItems[item.id]?.selected) {
        const qty = returnItems[item.id].quantity;
        total += qty * item.price;
      }
    });

    // Apply discount proportionally if it was used
    if (selectedTransaction.discount && selectedTransaction.discount > 0) {
      const discountRatio = selectedTransaction.discount / selectedTransaction.subtotal;
      total = total * (1 - discountRatio);
    }

    return total;
  };

  // Process return
  const handleProcessReturn = async () => {
    // Validation
    const selectedItems = Object.entries(returnItems).filter(([_, data]) => data.selected);
    if (selectedItems.length === 0) {
      setError('Please select at least one item to return');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!returnReason) {
      setError('Please select a return reason');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (returnReason === 'other' && !customReason.trim()) {
      setError('Please provide a reason for the return');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Prepare return data
      const returnData = {
        sale_id: selectedTransaction.id,
        items: selectedItems.map(([itemId, data]) => {
          const item = selectedTransaction.items.find(i => i.id === parseInt(itemId));
          return {
            product_id: item.product_id,
            quantity: data.quantity,
            price: item.price,
          };
        }),
        reason: returnReason === 'other' ? customReason : returnReason,
        refund_amount: calculateReturnTotal(),
      };

      // Create return
      const returnResponse = await api.createReturn(returnData);

      // Process refund
      await api.refundSale(selectedTransaction.id);

      // Prepare return transaction for receipt
      const returnTrans = {
        ...returnResponse.data,
        id: returnResponse.data.id,
        original_receipt_id: selectedTransaction.id,
        items: selectedItems.map(([itemId, data]) => {
          const item = selectedTransaction.items.find(i => i.id === parseInt(itemId));
          return {
            ...item,
            quantity: data.quantity,
          };
        }),
        subtotal: calculateReturnTotal(),
        total: calculateReturnTotal(),
        payment_method: selectedTransaction.payment_method,
        created_at: new Date().toISOString(),
        store_name: 'SAP Store',
      };

      setReturnTransaction(returnTrans);
      setShowReceipt(true);

      // Reset form
      setSelectedTransaction(null);
      setReturnItems({});
      setReturnReason('');
      setCustomReason('');
    } catch (err) {
      console.error('Error processing return:', err);
      setError(err.response?.data?.message || 'Failed to process return');
    } finally {
      setProcessing(false);
    }
  };

  // Receipt settings
  const receiptSettings = {
    headerText: localStorage.getItem('pos_receipt_header') || '',
    footerText: localStorage.getItem('pos_receipt_footer') || 'Thank you for your purchase!',
    showLogo: localStorage.getItem('pos_receipt_show_logo') === 'true',
    logoUrl: localStorage.getItem('pos_receipt_logo_url') || '',
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Process Return</h1>
      </div>

      {!selectedTransaction ? (
        // Search Phase
        <div style={styles.searchContainer}>
          {/* Search Tabs */}
          <div style={styles.tabs}>
            <button
              onClick={() => setSearchTab('receipt')}
              style={{
                ...styles.tab,
                ...(searchTab === 'receipt' ? styles.tabActive : {}),
              }}
            >
              By Receipt Number
            </button>
            <button
              onClick={() => setSearchTab('date')}
              style={{
                ...styles.tab,
                ...(searchTab === 'date' ? styles.tabActive : {}),
              }}
            >
              By Date Range
            </button>
            <button
              onClick={() => setSearchTab('customer')}
              style={{
                ...styles.tab,
                ...(searchTab === 'customer' ? styles.tabActive : {}),
              }}
            >
              By Customer
            </button>
          </div>

          <div style={styles.searchContent}>
            {/* By Receipt Number */}
            {searchTab === 'receipt' && (
              <div style={styles.searchForm}>
                <label style={styles.label}>Receipt/Transaction Number</label>
                <div style={styles.searchInput}>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="Enter receipt number"
                    style={styles.input}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchByReceipt()}
                  />
                  <button
                    onClick={handleSearchByReceipt}
                    disabled={searching}
                    style={{
                      ...styles.searchButton,
                      ...(searching ? styles.buttonDisabled : {}),
                    }}
                  >
                    {searching ? 'Searching...' : 'Find Transaction'}
                  </button>
                </div>
              </div>
            )}

            {/* By Date Range */}
            {searchTab === 'date' && (
              <div style={styles.searchForm}>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Customer (Optional)</label>
                  <input
                    type="text"
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    placeholder="Filter by customer name or phone"
                    style={styles.input}
                  />
                </div>

                <button
                  onClick={handleSearchByDate}
                  disabled={searching}
                  style={{
                    ...styles.searchButton,
                    ...(searching ? styles.buttonDisabled : {}),
                  }}
                >
                  {searching ? 'Searching...' : 'Search Transactions'}
                </button>
              </div>
            )}

            {/* By Customer */}
            {searchTab === 'customer' && (
              <div style={styles.searchForm}>
                <label style={styles.label}>Customer Name, Phone, or Email</label>
                <div style={styles.searchInput}>
                  <input
                    type="text"
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    placeholder="Search for customer"
                    style={styles.input}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchByCustomer()}
                  />
                  <button
                    onClick={handleSearchByCustomer}
                    disabled={searching}
                    style={{
                      ...styles.searchButton,
                      ...(searching ? styles.buttonDisabled : {}),
                    }}
                  >
                    {searching ? 'Searching...' : 'Find Customer'}
                  </button>
                </div>
              </div>
            )}

            {searchError && (
              <div style={styles.errorMessage}>{searchError}</div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div style={styles.results}>
                <h3 style={styles.resultsTitle}>Transactions Found</h3>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>Receipt #</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Customer</th>
                      <th style={styles.th}>Total</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((transaction) => (
                      <tr key={transaction.id} style={styles.tableRow}>
                        <td style={styles.td}>#{transaction.id}</td>
                        <td style={styles.td}>{formatDate(transaction.created_at, 'short')}</td>
                        <td style={styles.td}>{transaction.customer_name || 'Walk-in'}</td>
                        <td style={styles.td}>{formatCurrency(transaction.total)}</td>
                        <td style={styles.td}>
                          <button
                            onClick={() => handleSelectTransaction(transaction)}
                            style={styles.viewButton}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Return Processing Phase
        <div style={styles.returnContainer}>
          {/* Transaction Details */}
          <div style={styles.transactionInfo}>
            <h3 style={styles.sectionTitle}>Original Transaction</h3>
            <div style={styles.infoGrid}>
              <div>Receipt #: <strong>#{selectedTransaction.id}</strong></div>
              <div>Date: <strong>{formatDate(selectedTransaction.created_at, 'time')}</strong></div>
              <div>Cashier: <strong>{selectedTransaction.cashier_name || 'Unknown'}</strong></div>
              <div>Customer: <strong>{selectedTransaction.customer_name || 'Walk-in'}</strong></div>
            </div>

            {/* Return Eligibility Warning */}
            {!isReturnEligible(selectedTransaction.created_at) && (
              <div style={styles.warningBox}>
                ⚠️ This transaction is outside the 60-day return window
              </div>
            )}
          </div>

          {/* Items to Return */}
          <div style={styles.itemsSection}>
            <h3 style={styles.sectionTitle}>Select Items to Return</h3>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Return</th>
                  <th style={styles.th}>Item Name</th>
                  <th style={styles.th}>SKU</th>
                  <th style={styles.th}>Original Qty</th>
                  <th style={styles.th}>Return Qty</th>
                  <th style={styles.th}>Unit Price</th>
                  <th style={styles.th}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedTransaction.items.map((item) => (
                  <tr key={item.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <input
                        type="checkbox"
                        checked={returnItems[item.id]?.selected || false}
                        onChange={() => handleToggleItem(item.id)}
                        style={styles.checkbox}
                      />
                    </td>
                    <td style={styles.td}>{item.name}</td>
                    <td style={styles.td}>{item.sku}</td>
                    <td style={styles.td}>{item.quantity}</td>
                    <td style={styles.td}>
                      {returnItems[item.id]?.selected ? (
                        <input
                          type="number"
                          value={returnItems[item.id].quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                          min={1}
                          max={item.quantity}
                          style={styles.quantityInput}
                        />
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={styles.td}>{formatCurrency(item.price)}</td>
                    <td style={styles.td}>
                      {returnItems[item.id]?.selected
                        ? formatCurrency(returnItems[item.id].quantity * item.price)
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={styles.refundTotal}>
              Refund Amount: <strong>{formatCurrency(calculateReturnTotal())}</strong>
            </div>
          </div>

          {/* Return Reason */}
          <div style={styles.reasonSection}>
            <label style={styles.label}>Return Reason *</label>
            <select
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              style={styles.select}
            >
              <option value="">Select reason</option>
              <option value="defective">Defective</option>
              <option value="wrong_item">Wrong Item</option>
              <option value="changed_mind">Changed Mind</option>
              <option value="other">Other</option>
            </select>

            {returnReason === 'other' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please describe the reason"
                style={styles.textarea}
              />
            )}
          </div>

          {error && (
            <div style={styles.errorMessage}>{error}</div>
          )}

          {/* Actions */}
          <div style={styles.actions}>
            <button
              onClick={() => {
                setSelectedTransaction(null);
                setReturnItems({});
                setReturnReason('');
                setCustomReason('');
                setError('');
              }}
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              onClick={handleProcessReturn}
              disabled={processing}
              style={{
                ...styles.processButton,
                ...(processing ? styles.buttonDisabled : {}),
              }}
            >
              {processing ? 'Processing...' : 'Process Return'}
            </button>
          </div>
        </div>
      )}

      {/* Return Receipt */}
      {showReceipt && returnTransaction && (
        <ReceiptPrinter
          transaction={returnTransaction}
          receiptSettings={receiptSettings}
          onClose={() => {
            setShowReceipt(false);
            setReturnTransaction(null);
          }}
          type="return"
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '24px',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
  },
  searchContainer: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    borderBottom: '2px solid #e0e0e0',
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#666666',
    borderBottom: '3px solid transparent',
  },
  tabActive: {
    color: '#2196f3',
    borderBottomColor: '#2196f3',
  },
  searchContent: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
  },
  searchForm: {
    maxWidth: '600px',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  formGroup: {
    flex: 1,
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: '8px',
  },
  searchInput: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    minHeight: '80px',
    marginTop: '8px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  searchButton: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: '#2196f3',
    color: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  buttonDisabled: {
    backgroundColor: '#90caf9',
    cursor: 'not-allowed',
  },
  errorMessage: {
    padding: '12px',
    marginTop: '16px',
    backgroundColor: '#ffebee',
    color: '#f44336',
    borderRadius: '4px',
    fontSize: '14px',
  },
  warningBox: {
    padding: '12px',
    marginTop: '16px',
    backgroundColor: '#fff3e0',
    color: '#ff9800',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  results: {
    marginTop: '24px',
  },
  resultsTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '16px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    borderBottom: '2px solid #e0e0e0',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666666',
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0',
  },
  td: {
    padding: '12px',
    fontSize: '14px',
  },
  viewButton: {
    padding: '6px 12px',
    border: 'none',
    backgroundColor: '#2196f3',
    color: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  returnContainer: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
  transactionInfo: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 0,
    marginBottom: '16px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    fontSize: '14px',
  },
  itemsSection: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  quantityInput: {
    width: '60px',
    padding: '6px',
    fontSize: '14px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    textAlign: 'center',
  },
  refundTotal: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#e8f5e9',
    borderRadius: '4px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#4caf50',
    textAlign: 'right',
  },
  reasonSection: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  actions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '14px 32px',
    border: '1px solid #d0d0d0',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#666666',
  },
  processButton: {
    padding: '14px 32px',
    border: 'none',
    backgroundColor: '#2196f3',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ffffff',
  },
};
