import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { validateBarcode } from '../../utils/validators';
import { formatCurrency } from '../../utils/format';

export default function ProductSearch({ onProductSelect, placeholder = "Search products...", autoFocus = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceTimer = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !inputRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function
  const search = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      // Check if it's a barcode
      if (validateBarcode(searchQuery)) {
        const response = await api.getProductByBarcode(searchQuery);
        setResults([response.data]);
      } else {
        const response = await api.searchProducts(searchQuery);
        setResults(response.data.slice(0, 20)); // Limit to 20 results
      }
      setShowDropdown(true);
    } catch (err) {
      console.error('Error searching products:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for 300ms debounce
    debounceTimer.current = setTimeout(() => {
      search(value);
    }, 300);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) {
      if (e.key === 'Enter' && validateBarcode(query)) {
        // Auto-trigger barcode search on Enter
        search(query);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelectProduct(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setQuery('');
    }
  };

  // Handle product selection
  const handleSelectProduct = (product) => {
    onProductSelect(product);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    setSelectedIndex(-1);

    // Refocus input for next scan
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div style={styles.container}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length >= 2 && setShowDropdown(true)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={styles.input}
      />

      {showDropdown && (
        <div ref={dropdownRef} style={styles.dropdown}>
          {loading ? (
            <div style={styles.emptyState}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={styles.emptyState}>
              {query.length < 2 ? 'Start typing to search' : `No products found for "${query}"`}
            </div>
          ) : (
            results.map((product, index) => (
              <div
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                style={{
                  ...styles.resultItem,
                  ...(index === selectedIndex ? styles.resultItemSelected : {}),
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div style={styles.productName}>{product.name}</div>
                <div style={styles.productDetails}>
                  <span style={styles.productSku}>SKU: {product.sku}</span>
                  <span style={styles.productPrice}>{formatCurrency(product.price)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100%',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    backgroundColor: '#ffffff',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    maxHeight: '400px',
    overflowY: 'auto',
    zIndex: 1000,
  },
  emptyState: {
    padding: '16px',
    textAlign: 'center',
    color: '#666666',
    fontSize: '14px',
  },
  resultItem: {
    padding: '12px',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.15s',
  },
  resultItemSelected: {
    backgroundColor: '#f5f5f5',
  },
  productName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '4px',
  },
  productDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productSku: {
    fontSize: '12px',
    color: '#666666',
  },
  productPrice: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#4caf50',
  },
};
