/**
 * Validation utilities for the server
 */


// Email validation
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Password validation
  export const isValidPassword = (password) => {
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
  
  // Postal code validation
  export const validatePostalCode = (postalCode, country = 'US') => {
    const postalRegexByCountry = {
      US: /^\d{5}(-\d{4})?$/,
      CA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
      UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i
    };
    
    const regex = postalRegexByCountry[country];
    return regex ? regex.test(postalCode) : true;
  };
  
  // Price validation
  export const validatePrice = (price) => {
    const isValid = !isNaN(price) && price >= 0 && price <= 1000000;
    return {
      isValid,
      errors: isValid ? [] : ['Price must be between 0 and 1,000,000']
    };
  };
  
  // Stock validation
  export const validateStock = (quantity) => {
    const isValid = !isNaN(quantity) && quantity >= 0 && Number.isInteger(quantity);
    return {
      isValid,
      errors: isValid ? [] : ['Stock quantity must be a positive integer']
    };
  };
  
  // Name validation
  export const validateName = (name) => {
    const isValid = name.length >= 2 && name.length <= 50;
    return {
      isValid,
      errors: isValid ? [] : ['Name must be between 2 and 50 characters']
    };
  };
  
  // Address validation
  export const validateAddress = (address) => {
    const errors = [];
    
    if (!address.street) errors.push('Street is required');
    if (!address.city) errors.push('City is required');
    if (!address.state) errors.push('State is required');
    if (!address.zipCode) errors.push('Zip code is required');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  // Product validation
  export const validateProduct = (product) => {
    const errors = [];
    
    if (!product.name) errors.push('Product name is required');
    if (!product.description) errors.push('Description is required');
    if (!validatePrice(product.price).isValid) errors.push('Invalid price');
    if (!validateStock(product.stockQuantity).isValid) errors.push('Invalid stock quantity');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };