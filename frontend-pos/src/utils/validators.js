/**
 * validateEmail - Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * validatePhone - Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone format
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Must be exactly 10 digits
  return digits.length === 10;
}

/**
 * isReturnEligible - Check if transaction is within 60-day return window
 * @param {string} transactionDate - ISO date string of transaction
 * @returns {boolean} True if eligible for return
 */
export function isReturnEligible(transactionDate) {
  if (!transactionDate) return false;

  const transDate = new Date(transactionDate);
  const now = new Date();
  const daysDiff = (now - transDate) / (1000 * 60 * 60 * 24);

  return daysDiff < 60;
}

/**
 * validateDiscountCode - Validate discount code format
 * @param {string} code - Discount code to validate
 * @returns {boolean} True if valid format
 */
export function validateDiscountCode(code) {
  if (!code || typeof code !== 'string') return false;

  // Code format: 6-12 alphanumeric characters, hyphens allowed
  const codeRegex = /^[A-Z0-9-]{6,12}$/i;
  return codeRegex.test(code);
}

/**
 * validateBarcode - Validate barcode format
 * @param {string} barcode - Barcode to validate
 * @returns {boolean} True if valid barcode
 */
export function validateBarcode(barcode) {
  if (!barcode || typeof barcode !== 'string') return false;

  // Must be 10-13 digits
  const barcodeRegex = /^\d{10,13}$/;
  return barcodeRegex.test(barcode);
}
