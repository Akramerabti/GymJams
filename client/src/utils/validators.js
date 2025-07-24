// utils/validators.js

// Email validation
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Password validation
  export const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  // Phone number validation
  export const validatePhoneNumber = (phoneNumber) => {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phoneNumber);
  };
  
  // Postal code validation by country
  export const validatePostalCode = (postalCode, countryCode = 'US') => {
    const postalRegexByCountry = {
      US: /^\d{5}(-\d{4})?$/,
      CA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
      UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i
    };
    
    const regex = postalRegexByCountry[countryCode];
    return regex ? regex.test(postalCode) : true;
  };
  
  // Credit card validation
  export const validateCreditCard = (number) => {
    // Remove spaces and dashes
    const cleanNumber = number.replace(/[\s-]/g, '');
    
    // Check if the number contains only digits
    if (!/^\d+$/.test(cleanNumber)) return false;
    
    // Luhn algorithm implementation
    let sum = 0;
    let isEven = false;
    
    // Loop through values starting from the rightmost digit
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i));
  
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
  
      sum += digit;
      isEven = !isEven;
    }
  
    return sum % 10 === 0;
  };
  
  // Form field validation
  export const validateField = (name, value, rules = {}) => {
    const errors = [];
    
    if (rules.required && !value) {
      errors.push(`${name} is required`);
    }
  
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${name} must be at least ${rules.minLength} characters`);
    }
  
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${name} cannot exceed ${rules.maxLength} characters`);
    }
  
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${name} format is invalid`);
    }
  
    if (rules.match && value !== rules.match.value) {
      errors.push(`${name} must match ${rules.match.field}`);
    }
  
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  // Stock validation
  export const validateStock = (requestedQuantity, availableQuantity) => {
    return {
      isValid: requestedQuantity <= availableQuantity,
      remaining: availableQuantity - requestedQuantity,
      errors: requestedQuantity > availableQuantity 
        ? [`Only ${availableQuantity} items available`] 
        : []
    };
  };
  
  // Price validation
  export const validatePrice = (price) => {
    const errors = [];
    
    if (isNaN(price)) {
      errors.push('Price must be a number');
    }
    
    if (price < 0) {
      errors.push('Price cannot be negative');
    }
    
    if (price > 1000000) {
      errors.push('Price cannot exceed 1,000,000');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };