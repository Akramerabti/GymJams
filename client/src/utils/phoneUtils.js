// client/src/utils/phoneUtils.js

/**
 * Common country codes with their data
 */
export const countryCodes = [
    { code: '1', country: 'US', name: 'United States', flag: '🇺🇸' },
    { code: '1', country: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: '44', country: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: '33', country: 'FR', name: 'France', flag: '🇫🇷' },
    { code: '49', country: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: '61', country: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: '55', country: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: '86', country: 'CN', name: 'China', flag: '🇨🇳' },
    { code: '91', country: 'IN', name: 'India', flag: '🇮🇳' },
    { code: '52', country: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: '81', country: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: '82', country: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: '27', country: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    { code: '7', country: 'RU', name: 'Russia', flag: '🇷🇺' },
    { code: '34', country: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: '39', country: 'IT', name: 'Italy', flag: '🇮🇹' },
  ];
  
  /**
   * Detect country from phone number
   * @param {string} phoneNumber - The phone number to detect country from
   * @returns {object|null} - Country code object or null if not found
   */
  export const detectCountryFromPhone = (phoneNumber) => {
    if (!phoneNumber) return null;
    
    // Remove any non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Try to match country codes from longest to shortest
    for (let i = 3; i > 0; i--) {
      if (digits.length >= i) {
        const potentialCode = digits.substring(0, i);
        const country = countryCodes.find(c => c.code === potentialCode);
        if (country) return country;
      }
    }
    
    return null;
  };
  
  /**
   * Format a phone number for display based on country
   * @param {string} phoneNumber - The phone number to format
   * @param {string} countryCode - The country code
   * @returns {string} - Formatted phone number
   */
  export const formatPhoneForDisplay = (phoneNumber, countryCode) => {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Format based on country code
    if (countryCode === '1') { // US/Canada
      if (digits.length > 10) {
        // Format as +1 (XXX) XXX-XXXX
        return `+${countryCode} (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 10)}`;
      } else if (digits.length > 6) {
        // Format as (XXX) XXX-XXXX or partial
        return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
      } else if (digits.length > 3) {
        // Format as (XXX) XXX
        return `(${digits.substring(0, 3)}) ${digits.substring(3)}`;
      } else {
        // Format as (XXX
        return digits.length > 0 ? `(${digits}` : '';
      }
    }
    
    // Generic international format for other countries
    return digits.length > 0 ? `+${countryCode} ${digits}` : '';
  };
  
  /**
   * Convert a phone number to E.164 format
   * @param {string} phoneNumber - The phone number to convert
   * @param {string} countryCode - The country code
   * @returns {string} - E.164 formatted phone number
   */
  export const formatE164 = (phoneNumber, countryCode) => {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Check if it already has a country code
    if (digits.startsWith(countryCode)) {
      return `+${digits}`;
    }
    
    // Add the country code
    return `+${countryCode}${digits}`;
  };
  
  /**
   * Check if a phone number is valid
   * @param {string} phoneNumber - The phone number to validate
   * @param {string} countryCode - The country code
   * @returns {boolean} - Whether the phone number is valid
   */
  export const isValidPhoneNumber = (phoneNumber, countryCode) => {
    if (!phoneNumber) return false;
    
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Validate based on country code
    if (countryCode === '1') { // US/Canada
      return digits.length === 10;
    }
    
    // Generic validation for other countries (at least 8 digits)
    return digits.length >= 8 && digits.length <= 15;
  };