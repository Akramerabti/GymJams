/**
 * Formats a number as a currency string.
 * @param {number} amount - The amount to format.
 * @param {string} [currency='USD'] - The currency code (e.g., 'USD', 'CAD').
 * @param {string} [locale='en-US'] - The locale to use for formatting.
 * @returns {string} - The formatted currency string.
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
    if (isNaN(amount)) {
      throw new Error('Invalid amount: Amount must be a number');
    }
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };
  
  /**
   * Formats a date string into a human-readable format.
   * @param {string|Date} date - The date to format (can be a string or Date object).
   * @param {string} [locale='en-US'] - The locale to use for formatting.
   * @param {Object} [options] - Additional options for formatting.
   * @returns {string} - The formatted date string.
   */
  export const formatDate = (date, locale = 'en-US', options = {}) => {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date: Date must be a valid date string or object');
    }
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }).format(dateObj);
  };
  
  /**
   * Capitalizes the first letter of a string.
   * @param {string} str - The string to capitalize.
   * @returns {string} - The capitalized string.
   */
  export const capitalize = (str) => {
    if (typeof str !== 'string') {
      throw new Error('Invalid input: Input must be a string');
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  
  /**
   * Truncates a string to a specified length and adds an ellipsis if necessary.
   * @param {string} str - The string to truncate.
   * @param {number} maxLength - The maximum length of the string.
   * @returns {string} - The truncated string.
   */
  export const truncate = (str, maxLength) => {
    if (typeof str !== 'string') {
      throw new Error('Invalid input: Input must be a string');
    }
    if (str.length <= maxLength) {
      return str;
    }
    return str.slice(0, maxLength) + '...';
  };
  