/**
 * Format currency with proper locale
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format date to readable string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // If less than 1 minute
  if (diffMins < 1) {
    return 'Just now';
  }

  // If less than 60 minutes
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  }

  // If less than 24 hours
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  // If less than 7 days
  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  // Otherwise, format as MM/DD/YYYY
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
};

/**
 * Format phone number
 */
export const formatPhone = (phoneNumber) => {
  if (!phoneNumber) return '';

  const digits = phoneNumber.replace(/\D/g, '');

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return phoneNumber;
};

/**
 * Format stock status
 */
export const getStockStatus = (quantity, lowThreshold) => {
  if (quantity === 0) {
    return { status: 'out', label: 'Out of Stock', color: '#f44336' };
  } else if (quantity <= lowThreshold) {
    return { status: 'low', label: 'Low Stock', color: '#ff9800' };
  } else {
    return { status: 'in', label: 'In Stock', color: '#4caf50' };
  }
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export default {
  formatCurrency,
  formatDate,
  formatPhone,
  getStockStatus,
  truncateText,
};
