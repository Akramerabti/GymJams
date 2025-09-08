import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Phone, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const countries = [
  { name: 'United States', code: '1', flag: '🇺🇸' },
  { name: 'Canada', code: '1', flag: '🇨🇦' },
  { name: 'United Kingdom', code: '44', flag: '🇬🇧' },
  { name: 'Australia', code: '61', flag: '🇦🇺' },
  { name: 'Germany', code: '49', flag: '🇩🇪' },
  { name: 'France', code: '33', flag: '🇫🇷' },
  { name: 'Japan', code: '81', flag: '🇯🇵' },
  { name: 'South Korea', code: '82', flag: '🇰🇷' },
  { name: 'India', code: '91', flag: '🇮🇳' },
  { name: 'China', code: '86', flag: '🇨🇳' },
];

// Phone formatting utility functions
const formatPhoneDisplay = (digits, countryCode) => {
  if (!digits) return '';
  
  if (countryCode === '1') {
    // US/Canada formatting
    if (digits.length <= 3) {
      return `(${digits}`;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  }
  
  // Generic international format for other countries
  return digits.length > 0 ? digits.replace(/(.{1,3})(?=.)/g, '$1 ') : '';
};

const isValidPhoneNumber = (digits, countryCode) => {
  if (!digits) return false;
  
  if (countryCode === '1') {
    return digits.length === 10;
  }
  
  return digits.length >= 8 && digits.length <= 15;
};

const PhoneInput = ({ 
  value = '', 
  onChange, 
  onValidChange, 
  autoFocus = false, 
  className = '',
  darkMode: propDarkMode,
  ...props 
}) => {
  const { darkMode: contextDarkMode } = useTheme();
  const darkMode = propDarkMode !== undefined ? propDarkMode : contextDarkMode;
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [countryCode, setCountryCode] = useState('1');
  const [countryFlag, setCountryFlag] = useState('🇺🇸');
  const [inputValue, setInputValue] = useState('');
  const [formattedValue, setFormattedValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(false);
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize with US by default
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update parent component with E.164 format and validity
  useEffect(() => {
    const digits = inputValue.replace(/\D/g, '');
    const valid = isValidPhoneNumber(digits, countryCode);
    setIsValid(valid);
    
    // Format for display
    const formatted = formatPhoneDisplay(digits, countryCode);
    setFormattedValue(formatted);
    
    // Send E.164 format to parent
    const e164 = digits.length > 0 ? `+${countryCode}${digits}` : '';
    onChange?.(e164);
    onValidChange?.(valid);
  }, [inputValue, countryCode]); // Removed onChange and onValidChange from dependencies

  const handleInputChange = (e) => {
    const input = e.target.value;
    // Extract only digits
    const digits = input.replace(/\D/g, '');
    
    // Limit length based on country
    const maxLength = countryCode === '1' ? 10 : 15;
    const limitedDigits = digits.slice(0, maxLength);
    
    setInputValue(limitedDigits);
  };

  const handleCountrySelect = (code, flag) => {
    setCountryCode(code);
    setCountryFlag(flag);
    setIsDropdownOpen(false);
    
    // Clear input when changing countries
    setInputValue('');
    setFormattedValue('');
    
    // Focus input after country selection
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Theme-aware styles
  const getContainerStyles = () => {
    const baseStyles = "relative flex items-center border-2 rounded-xl overflow-hidden transition-all duration-300";
    const themeStyles = darkMode 
      ? "bg-gray-800 border-gray-600 focus-within:border-blue-400" 
      : "bg-white border-gray-300 focus-within:border-blue-500";
    
    return `${baseStyles} ${themeStyles} ${className}`;
  };

  const getDropdownStyles = () => {
    const baseStyles = "absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border shadow-lg";
    const themeStyles = darkMode 
      ? "bg-gray-800 border-gray-600" 
      : "bg-white border-gray-200";
    
    return `${baseStyles} ${themeStyles}`;
  };

  const getInputStyles = () => {
    const baseStyles = "w-full pl-10 pr-3 py-2 bg-transparent focus:outline-none";
    const themeStyles = darkMode 
      ? "text-white placeholder-gray-400" 
      : "text-black placeholder-gray-500";
    
    return `${baseStyles} ${themeStyles}`;
  };

  const getButtonStyles = (isSelected = false) => {
    const baseStyles = "w-full px-3 py-2 text-left hover:bg-opacity-50 transition-colors flex items-center";
    
    if (darkMode) {
      return `${baseStyles} ${isSelected 
        ? 'bg-blue-600 text-white' 
        : 'text-gray-300 hover:bg-gray-700'
      }`;
    } else {
      return `${baseStyles} ${isSelected 
        ? 'bg-blue-50 text-blue-700' 
        : 'text-gray-700 hover:bg-gray-50'
      }`;
    }
  };

  const getIconStyles = (focused = false) => {
    if (darkMode) {
      return focused ? 'text-blue-400' : 'text-gray-400';
    } else {
      return focused ? 'text-blue-500' : 'text-gray-400';
    }
  };

  return (
    <div className="relative w-full">
      <div className={getContainerStyles()}>
        {/* Country selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center px-3 py-2 hover:bg-opacity-50 transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            }`}
          >
            <span className="text-xl mr-2">{countryFlag}</span>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              +{countryCode}
            </span>
            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${
              isDropdownOpen ? 'rotate-180' : ''
            } ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
          
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={getDropdownStyles()}
              >
                <div className="p-1">
                  {countries.map((country) => (
                    <button
                      key={`${country.code}-${country.name}`}
                      type="button"
                      className={getButtonStyles(countryCode === country.code)}
                      onClick={() => handleCountrySelect(country.code, country.flag)}
                    >
                      <span className="text-xl mr-2">{country.flag}</span>
                      <span className="flex-1">{country.name}</span>
                      <span className={`ml-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        (+{country.code})
                      </span>
                      {countryCode === country.code && (
                        <Check className={`h-4 w-4 ml-auto ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Divider */}
        <div className={`w-px h-6 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
        
        {/* Phone input */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Phone className={`h-5 w-5 ${getIconStyles(isFocused)}`} />
          </div>
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formattedValue}
            onChange={handleInputChange}
            className={getInputStyles()}
            placeholder={countryCode === '1' ? "(555) 123-4567" : "Phone number"}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
        </div>
        
        {/* Validity indicator */}
        {inputValue.length > 0 && (
          <div className="pr-3">
            {isValid ? (
              <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-green-800' : 'bg-green-100'
              }`}>
                <Check className={`h-3 w-3 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
            ) : (
              <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-red-800' : 'bg-red-100'
              }`}>
                <span className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-600'}`}>!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneInput;