// utils/formatters.js

// Currency formatting
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Date formatting
  export const formatDate = (date, format = 'full') => {
    const d = new Date(date);
    
    const formats = {
      full: new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      short: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      relative: (date) => {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
  
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 30) return `${days}d ago`;
        return new Intl.DateTimeFormat('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }).format(date);
      }
    };
  
    return (format === 'relative') 
      ? formats.relative(d)
      : formats[format].format(d);
  };
  
  // Order status formatting
  export const formatOrderStatus = (status) => {
    const statusMap = {
      'pending': {
        label: 'Pending',
        color: 'yellow',
        icon: 'clock'
      },
      'processing': {
        label: 'Processing',
        color: 'blue',
        icon: 'loader'
      },
      'shipped': {
        label: 'Shipped',
        color: 'green',
        icon: 'truck'
      },
      'delivered': {
        label: 'Delivered',
        color: 'green',
        icon: 'check'
      },
      'cancelled': {
        label: 'Cancelled',
        color: 'red',
        icon: 'x'
      }
    };
  
    return statusMap[status] || {
      label: status,
      color: 'gray',
      icon: 'help-circle'
    };
  };
  
  // File size formatting
  export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Phone number formatting
  export const formatPhoneNumber = (phoneNumber) => {
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    
    return phoneNumber;
  };
  
  // Address formatting
  export const formatAddress = (address) => {
    const {
      street,
      apartment,
      city,
      state,
      zipCode,
      country
    } = address;
  
    const parts = [
      street,
      apartment,
      `${city}, ${state} ${zipCode}`,
      country
    ].filter(Boolean);
  
    return parts.join('\n');
  };
  
  // Product rating formatting
  export const formatRating = (rating, maxRating = 5) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);
  
    return {
      full: fullStars,
      half: hasHalfStar ? 1 : 0,
      empty: emptyStars
    };
  };