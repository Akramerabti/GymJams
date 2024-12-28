// utils/helpers.js

// Performance Utilities
export const debounce = (func, wait = 300) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };
  
  export const throttle = (func, limit = 300) => {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };
  
  // Array and Object Utilities
  export const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (Array.isArray(obj)) return obj.map(deepClone);
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, deepClone(value)])
    );
  };
  
  export const sortBy = (arr, key, direction = 'asc') => {
    return [...arr].sort((a, b) => {
      const valueA = typeof a[key] === 'string' ? a[key].toLowerCase() : a[key];
      const valueB = typeof b[key] === 'string' ? b[key].toLowerCase() : b[key];
      
      if (direction === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      }
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    });
  };
  
  // Product and Cart Utilities
  export const calculateCartTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const tax = subtotal * 0.08; // 8% tax
    
    return {
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax
    };
  };
  
  export const calculateProductDiscount = (price, discountPercent) => {
    const discountAmount = (price * discountPercent) / 100;
    const finalPrice = price - discountAmount;
    
    return {
      originalPrice: price,
      discountAmount,
      finalPrice,
      discountPercent,
      savings: ((discountAmount / price) * 100).toFixed(1)
    };
  };
  
  // Pagination Utilities 
  export const getPaginationRange = (currentPage, totalPages, maxVisible = 5) => {
    const pages = [];
    const halfVisible = Math.floor(maxVisible / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return {
      pages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      totalPages
    };
  };
  
  // Data Storage Utilities
  export const storage = {
    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('Storage error:', error);
        return false;
      }
    },
    
    get: (key, defaultValue = null) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.error('Storage error:', error);
        return defaultValue;
      }
    },
    
    remove: (key) => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('Storage error:', error);
        return false;
      }
    },
    
    clear: () => {
      try {
        localStorage.clear();
        return true;
      } catch (error) {
        console.error('Storage error:', error);
        return false;
      }
    }
  };
  
  // URL and Query String Utilities
  export const buildQueryString = (params) => {
    return Object.entries(params)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  };
  
  export const parseQueryString = (queryString) => {
    if (!queryString) return {};
    
    return queryString
      .substring(1)
      .split('&')
      .reduce((params, param) => {
        const [key, value] = param.split('=');
        if (key && value) {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
        return params;
      }, {});
  };
  
  // Search and Filter Utilities
  export const searchProducts = (products, searchTerm, fields = ['name', 'description', 'category']) => {
    if (!searchTerm) return products;
    
    const normalizedSearch = searchTerm.toLowerCase();
    return products.filter(product => 
      fields.some(field => 
        product[field]?.toString().toLowerCase().includes(normalizedSearch)
      )
    );
  };
  
  export const filterProducts = (products, filters) => {
    return products.filter(product => {
      for (const [key, value] of Object.entries(filters)) {
        if (!value) continue;
        
        switch (key) {
          case 'category':
            if (product.category !== value) return false;
            break;
          case 'priceRange':
            const [min, max] = value.split('-').map(Number);
            if (product.price < min || product.price > max) return false;
            break;
          case 'inStock':
            if (value && product.stockQuantity <= 0) return false;
            break;
          // Add more filter cases as needed
        }
      }
      return true;
    });
  };
  
  // Error Handling Utilities
  export const tryParseJSON = (jsonString, defaultValue = null) => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return defaultValue;
    }
  };
  
  export const handleApiError = (error) => {
    if (error.response) {
      // Server responded with error
      return {
        message: error.response.data.message || 'Server error occurred',
        status: error.response.status,
        type: 'api'
      };
    } else if (error.request) {
      // Request made but no response
      return {
        message: 'No response from server',
        type: 'network'
      };
    } else {
      // Request setup error
      return {
        message: error.message || 'An error occurred',
        type: 'client'
      };
    }
  };