/**
 * formatCurrency - Format number as currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * formatDate - Format date string
 * @param {string} dateString - ISO date string
 * @param {string} format - Format type: 'short' | 'long' | 'time'
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, format = 'short') {
  const date = new Date(dateString);

  if (format === 'short') {
    // MM/DD/YYYY
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } else if (format === 'long') {
    // January 15, 2025
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } else if (format === 'time') {
    // MM/DD/YYYY hh:mm AM/PM
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
  }

  return dateString;
}

/**
 * formatPhone - Format phone number
 * @param {string} phoneNumber - Phone number string
 * @returns {string} Formatted phone number
 */
export function formatPhone(phoneNumber) {
  if (!phoneNumber) return '';

  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // Check if it's a valid 10-digit phone number
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Check if it's 11 digits (with country code)
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Return original if invalid format
  return phoneNumber;
}

/**
 * formatBarcode - Format barcode for display
 * @param {string} barcode - Barcode string
 * @returns {string} Formatted barcode string
 */
export function formatBarcode(barcode) {
  if (!barcode || barcode.length < 6) return barcode;

  // Add hyphen for readability: 123456789012 => 123456-789012
  const mid = Math.floor(barcode.length / 2);
  return `${barcode.slice(0, mid)}-${barcode.slice(mid)}`;
}
