import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, Phone, Check } from 'lucide-react';
import { 
  countryCodes, 
  formatPhoneForDisplay, 
  formatE164, 
  isValidPhoneNumber 
} from '../utils/phoneUtils';

const PhoneInput = ({ 
  value, 
  onChange, 
  onValidChange,
  autoFocus = false,
  className = ''
}) => {
  const [countryCode, setCountryCode] = useState('1'); // Default to US/Canada code
  const [countryFlag, setCountryFlag] = useState('🇺🇸'); // Default to US flag
  const [inputValue, setInputValue] = useState('');
  const [formattedValue, setFormattedValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Initialize with a provided value if any
  useEffect(() => {
    if (value) {
      // Try to detect country code
      const digits = value.replace(/\D/g, '');
      
      if (digits.startsWith('1')) {
        setCountryCode('1');
        setCountryFlag('🇺🇸'); // Default to US
        setInputValue(digits.substring(1)); // Remove country code
      } else {
        // Just use the value as is
        setInputValue(digits);
      }
    }
  }, [value]);

  // Update formatted value when input or country changes
  useEffect(() => {
    const formatted = formatPhoneForDisplay(inputValue, countryCode);
    setFormattedValue(formatted);
    
    // Check validity
    const valid = isValidPhoneNumber(inputValue, countryCode);
    setIsValid(valid);
    
    // Notify parent about validity change
    if (onValidChange) {
      onValidChange(valid);
    }
    
    // Pass the E.164 formatted value to parent
    if (onChange) {
      const e164Value = formatE164(inputValue, countryCode);
      onChange(e164Value);
    }
  }, [inputValue, countryCode]); // Remove onChange and onValidChange from dependencies

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-focus the input if specified
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleInputChange = (e) => {
    // Extract only digits
    const digits = e.target.value.replace(/\D/g, '');
    setInputValue(digits);
  };

  const handleCountrySelect = (code, flag) => {
    setCountryCode(code);
    setCountryFlag(flag);
    setIsDropdownOpen(false);
    
    // Focus back on the input after selecting country
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`flex items-center border rounded-lg overflow-hidden ${
        isFocused ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
      } ${isValid ? 'bg-white' : 'bg-gray-50'}`}>
        {/* Country dropdown button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="h-full px-3 py-2 flex items-center text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="text-xl mr-1">{countryFlag}</span>
            <span className="text-sm font-medium">+{countryCode}</span>
            {isDropdownOpen ? 
              <ChevronUp className="h-4 w-4 ml-1" /> : 
              <ChevronDown className="h-4 w-4 ml-1" />
            }
          </button>
          
          {/* Country dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute z-10 left-0 mt-2 w-60 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 max-h-60 overflow-y-auto">
              <div className="py-1">
                {countryCodes.map((country) => (
                  <button
                    key={`${country.code}-${country.country}`}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${
                      countryCode === country.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                    onClick={() => handleCountrySelect(country.code, country.flag)}
                  >
                    <span className="text-xl mr-2">{country.flag}</span>
                    <span>{country.name}</span>
                    <span className="ml-1 text-gray-500">(+{country.code})</span>
                    {countryCode === country.code && (
                      <Check className="h-4 w-4 ml-auto text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Divider */}
        <div className="w-px h-6 bg-gray-300"></div>
        
        {/* Phone input */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Phone className={`h-5 w-5 ${isFocused ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>
          <input
            ref={inputRef}
            type="tel"
            value={formattedValue}
            onChange={handleInputChange}
            className="w-full pl-10 pr-3 py-2 bg-transparent focus:outline-none"
            placeholder="(555) 123-4567"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>
        
        {/* Validity indicator */}
        {inputValue.length > 0 && (
          <div className="pr-3">
            {isValid ? (
              <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-3 w-3 text-green-600" />
              </div>
            ) : (
              <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xs">!</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Helper text */}
      {inputValue.length > 0 && !isValid && (
        <p className="mt-1 text-sm text-red-500">
          Please enter a valid phone number
        </p>
      )}
    </div>
  );
};

export default PhoneInput;