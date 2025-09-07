import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, User, Gift, CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import SocialLoginButtons from '../auth/SocialLoginButtons';
import api from '../../services/api';

const DiscountSignUpContainer = ({ onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    emailConsent: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form', 'success', 'oauth'
  const [phoneInputValue, setPhoneInputValue] = useState('');
  const [countryCode, setCountryCode] = useState('1');
  const [countryFlag, setCountryFlag] = useState('🇺🇸');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const dropdownRef = useRef(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Common country codes
  const countryCodes = [
    { code: '1', flag: '🇺🇸', name: 'United States' },
    { code: '1', flag: '🇨🇦', name: 'Canada' },
    { code: '44', flag: '🇬🇧', name: 'United Kingdom' },
    { code: '33', flag: '🇫🇷', name: 'France' },
    { code: '49', flag: '🇩🇪', name: 'Germany' },
    { code: '39', flag: '🇮🇹', name: 'Italy' },
    { code: '34', flag: '🇪🇸', name: 'Spain' },
    { code: '61', flag: '🇦🇺', name: 'Australia' },
    { code: '81', flag: '🇯🇵', name: 'Japan' },
    { code: '86', flag: '🇨🇳', name: 'China' },
    { code: '91', flag: '🇮🇳', name: 'India' },
    { code: '55', flag: '🇧🇷', name: 'Brazil' },
    { code: '52', flag: '🇲🇽', name: 'Mexico' },
    { code: '7', flag: '🇷🇺', name: 'Russia' },
    { code: '82', flag: '🇰🇷', name: 'South Korea' }
  ];

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Update formatted phone value when input or country changes
  useEffect(() => {
    if (phoneInputValue) {
      const formattedPhone = `+${countryCode}${phoneInputValue}`;
      setFormData(prev => ({ ...prev, phone: formattedPhone }));
      
      // Basic phone validation (10-15 digits after country code)
      const phoneRegex = /^\+\d{1,4}\d{10,15}$/;
      setIsPhoneValid(phoneRegex.test(formattedPhone));
    } else {
      setFormData(prev => ({ ...prev, phone: '' }));
      setIsPhoneValid(false);
    }
  }, [phoneInputValue, countryCode]);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!isPhoneValid) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCountrySelect = (code, flag) => {
    setCountryCode(code);
    setCountryFlag(flag);
    setIsDropdownOpen(false);
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    setPhoneInputValue(value);
    
    // Clear phone error when user starts typing
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const parseName = (fullName) => {
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) {
      return {
        firstName: nameParts[0],
        lastName: 'Unknown'
      };
    }
    return {
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' ')
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const { firstName, lastName } = parseName(formData.fullName);
      
      // Create discount sign-up (this would be a special endpoint for lead capture)
      const discountData = {
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phone,
        emailConsent: formData.emailConsent,
        source: 'discount_signup'
      };

      // Call API to create discount signup and generate temporary password
      const response = await api.post('/auth/discount-signup', discountData);

      if (response.data.success) {
        setStep('success');
        toast.success('Welcome to GymTonic!', {
          description: 'Check your email for your temporary password and discount code!'
        });

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess({
            user: response.data.user,
            discountCode: response.data.discountCode,
            token: response.data.token,
            type: 'discount_signup'
          });
        }
      }
    } catch (error) {
      console.error('Discount signup error:', error);
      
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 409) {
        errorMessage = 'An account with this email or phone already exists. Try logging in instead.';
      }

      toast.error('Signup Failed', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSuccess = (userData, type) => {
    setStep('success');
    toast.success('Welcome to GymTonic!', {
      description: 'Your account has been created successfully!'
    });

    if (onSuccess) {
      onSuccess({
        user: userData,
        type: 'oauth_signup'
      });
    }
  };

  if (step === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md mx-auto text-center"
      >
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to GymTonic!
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Check your email for your login details and exclusive discount code!
          </p>
        </div>
        
        <button
          onClick={() => navigate('/')}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
        >
          Start Exploring
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md mx-auto relative"
    >
      {/* Close button inside container */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200 text-xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      )}
      
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Get Your 15% Exclusive Discount
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Join thousands of fitness enthusiasts and get instant access to exclusive deals!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter your full name"
            />
          </div>
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter your email"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <div className="relative flex">
            {/* Country Code Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="h-12 px-3 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="text-lg">{countryFlag}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">+{countryCode}</span>
              </button>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                  >
                    {countryCodes.map((country, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleCountrySelect(country.code, country.flag)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-3"
                      >
                        <span className="text-lg">{country.flag}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">+{country.code}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{country.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Phone Number Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                value={phoneInputValue}
                onChange={handlePhoneChange}
                className={`w-full pl-10 pr-4 py-3 border border-l-0 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter phone number"
              />
            </div>
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.phone}
            </p>
          )}
        </div>

        {/* Email Consent Checkbox */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="emailConsent"
            name="emailConsent"
            checked={formData.emailConsent}
            onChange={handleChange}
            className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label htmlFor="emailConsent" className="text-sm text-gray-700 dark:text-gray-300">
            I agree to receive emails about discounts, promotions, and fitness tips from GymTonic
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Gift className="w-5 h-5 mr-2" />
          )}
          {loading ? 'Creating Account...' : 'Get My Discount'}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            or continue with
          </span>
        </div>
      </div>

      {/* Google OAuth */}
      <SocialLoginButtons onAccountCreated={handleOAuthSuccess} />

      {/* Terms */}
      <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
        By signing up, you agree to our{' '}
        <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
          Privacy Policy
        </a>
      </p>
    </motion.div>
  );
};

export default DiscountSignUpContainer;
