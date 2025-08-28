import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Phone, ChevronDown, Globe, Shield, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import Onboarding from '../../pages/Onboarding';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../stores/authStore';

const countryCodes = [
  { code: '1', name: 'United States', flag: '🇺🇸', country: 'US' },
  { code: '1', name: 'Canada', flag: '🇨🇦', country: 'CA' },
  { code: '44', name: 'United Kingdom', flag: '🇬🇧', country: 'GB' },
  { code: '33', name: 'France', flag: '🇫🇷', country: 'FR' },
  { code: '49', name: 'Germany', flag: '🇩🇪', country: 'DE' },
  { code: '39', name: 'Italy', flag: '🇮🇹', country: 'IT' },
  { code: '34', name: 'Spain', flag: '🇪🇸', country: 'ES' },
  { code: '52', name: 'Mexico', flag: '🇲🇽', country: 'MX' },
  { code: '55', name: 'Brazil', flag: '🇧🇷', country: 'BR' },
  { code: '86', name: 'China', flag: '🇨🇳', country: 'CN' },
  { code: '81', name: 'Japan', flag: '🇯🇵', country: 'JP' },
  { code: '82', name: 'South Korea', flag: '🇰🇷', country: 'KR' },
  { code: '91', name: 'India', flag: '🇮🇳', country: 'IN' },
  { code: '61', name: 'Australia', flag: '🇦🇺', country: 'AU' },
];

const CompleteOAuthProfile = ({ user, token, missingFields: propMissingFields, onComplete, onUserUpdate }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  
  // Import auth store to update user state after completion
  const { setUser, setToken } = useAuth();
  
  // State management
  const [countryCode, setCountryCode] = useState('1');
  const [countryFlag, setCountryFlag] = useState('🇺🇸'); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [phoneInputValue, setPhoneInputValue] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Function to decode JWT payload
  const decodeJWTPayload = (token) => {
    try {
      const payload = token.split('.')[1];
      const padding = '='.repeat((4 - payload.length % 4) % 4);
      const base64 = (payload + padding).replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(base64);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

  // Initialize component
  useEffect(() => {
    const initializeComponent = () => {
      try {
        const tempTokenFromUrl = searchParams.get('tempToken');
        
        if (tempTokenFromUrl) {
          console.log('Initializing with tempToken from URL');
          
          // Decode the JWT to get OAuth profile information
          const tokenData = decodeJWTPayload(tempTokenFromUrl);
          const oauthProfile = tokenData?.oauthProfile;
          
          if (!oauthProfile) {
            throw new Error('Invalid token data');
          }
          
          // Create user object - automatically handle lastName
          const userFromToken = {
            tempToken: tempTokenFromUrl,
            phone: oauthProfile.phone || null,
            lastName: oauthProfile.lastName && oauthProfile.lastName.trim() ? oauthProfile.lastName : 'unknown',
            firstName: oauthProfile.firstName || null,
            email: oauthProfile.email || null,
            profileImage: oauthProfile.profileImage || null,
            isNewUser: true
          };
          
          setCurrentUser(userFromToken);
          
          console.log('OAuth profile processed:', {
            firstName: oauthProfile.firstName,
            lastName: userFromToken.lastName,
            needsPhone: !oauthProfile.phone
          });
          
        } else if (user) {
          console.log('Initializing with user prop:', user);
          
          const safeUser = {
            phone: user.phone || null,
            lastName: user.lastName || 'unknown',
            tempToken: user.tempToken || null,
            ...user
          };
          
          setCurrentUser(safeUser);
          
        } else {
          console.error('No user data or tempToken provided');
          toast.error('Authentication data missing. Please try signing in again.');
          navigate('/login');
          return;
        }
        
        setLoading(false);
        
      } catch (error) {
        console.error('Error initializing CompleteOAuthProfile:', error);
        toast.error('Error loading profile completion. Please try again.');
        navigate('/login');
      }
    };

    initializeComponent();
  }, [user, propMissingFields, searchParams, navigate]);

  // Update phone format when input changes
  useEffect(() => {
    if (phoneInputValue) {
      const e164Value = `+${countryCode}${phoneInputValue}`;
      setPhoneNumber(e164Value);
    }
  }, [phoneInputValue, countryCode]);

  // Handle click outside dropdown
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

  // Validation
  const validatePhone = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      return 'Phone number is required for account security';
    }
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    if (!cleanPhone.startsWith('+') || cleanPhone.length < 10) {
      return 'Please enter a valid phone number';
    }
    return '';
  };

  // Phone formatting
  const formatPhoneDisplay = (phone, code) => {
    if (!phone) return '';
    
    if (code === '1' && phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  // Event handlers
  const handleCountrySelect = (code, flag) => {
    setCountryCode(code);
    setCountryFlag(flag);
    setIsDropdownOpen(false);
  };

  const handlePhoneInputChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    setPhoneInputValue(digits);
    
    if (phoneError) {
      setPhoneError('');
    }
  };

  // Form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone
    const phoneValidationError = validatePhone(phoneNumber);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      return;
    }

    setSubmitting(true);
    
    try {
      // Prepare update data - always include lastName as "unknown" if missing
      const updateData = {
        phone: phoneNumber,
        lastName: currentUser?.lastName || 'unknown'
      };
      
      if (currentUser?.tempToken) {
        updateData.tempToken = currentUser.tempToken;
      }

      console.log('Submitting profile completion:', updateData);

      // Make API call
      const response = await api.post('/auth/complete-oauth-profile', updateData, {
        headers: currentUser?.tempToken ? {} : {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Profile completion response:', response.data);

      if (response.data.isComplete) {
        // Store new token if provided and update auth store
        if (currentUser?.tempToken && response.data.token) {
          localStorage.setItem('token', response.data.token);
          
          // Update auth store with new token and user data
          setToken(response.data.token);
          setUser(response.data.user);
        }

        // Show success message
        if (response.data.bonusAwarded) {
          toast.success('Welcome to GymTonic! You received 100 bonus points!', {
            duration: 4000
          });
        } else {
          toast.success('Profile completed successfully!');
        }

        // Update current user state
        const updatedUser = response.data.user || currentUser;
        setCurrentUser(updatedUser);
        
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }
        
        // Show onboarding
        setShowOnboarding(true);
      } else {
        toast.error('Profile completion failed. Please try again.');
      }
      
    } catch (error) {
      console.error('Profile completion error:', error);
      
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || 'Failed to complete profile. Please try again.';

      // Handle token refresh for retries
      if (errorData?.tempToken) {
        const updatedUser = {
          ...currentUser,
          tempToken: errorData.tempToken
        };
        setCurrentUser(updatedUser);
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }
      }
      
      // Handle specific errors
      if (errorMessage.includes('phone number is already')) {
        setPhoneError('This phone number is already registered. Please use a different number.');
      } else if (errorData?.error?.type === 'token_expired') {
        toast.error('Your session has expired. Please sign in again.');
        navigate('/login');
        return;
      } else {
        toast.error(errorMessage);
      }
      
    } finally {
      setSubmitting(false);
    }
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    if (onComplete) {
      onComplete(currentUser);
    } else {
      navigate('/');
    }
  };

  // Show loading while initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="flex flex-col items-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-16 h-16 text-blue-600 mb-6" />
            </motion.div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Setting up your account...</h2>
            <p className="text-gray-500 text-center">Please wait while we prepare everything</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show onboarding if completed
  if (showOnboarding) {
    return <Onboarding onClose={handleOnboardingClose} showPointsMessage={true} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="shadow-2xl border-0 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-4"
            >
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Phone className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <h1 className="text-2xl font-bold mb-2">Almost There!</h1>
              <p className="text-blue-100 text-sm">
                We need your phone number to secure your account and enable all features
              </p>
            </motion.div>
          </div>
          
          <CardContent className="p-8">
            {/* Welcome message with user info */}
            {currentUser?.firstName && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Welcome, {currentUser.firstName}!
                    </p>
                    <p className="text-xs text-green-600">
                      Connected via Google • Account verified
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Phone number form */}
            <motion.form
              onSubmit={handleFormSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Phone Number
                  </label>
                  
                  <div className={`relative rounded-xl border-2 transition-all duration-200 ${
                    phoneError ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-blue-300 focus-within:border-blue-500'
                  }`}>
                    <div className="flex">
                      {/* Country selector */}
                      <div className="relative" ref={dropdownRef}>
                        <button
                          type="button"
                          className="flex items-center px-4 py-4 text-gray-700 hover:bg-gray-50 transition-colors rounded-l-xl"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                          <span className="text-lg mr-2">{countryFlag}</span>
                          <span className="text-sm font-medium mr-1">+{countryCode}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {isDropdownOpen && (
                            <motion.div 
                              className="absolute z-50 left-0 top-full mt-1 w-72 rounded-xl shadow-2xl bg-white border border-gray-200 max-h-60 overflow-y-auto"
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                            >
                              <div className="p-2">
                                {countryCodes.map((country, index) => (
                                  <button
                                    key={`${country.code}-${country.country}-${index}`}
                                    className={`w-full text-left px-3 py-3 text-sm rounded-lg hover:bg-gray-50 flex items-center transition-colors ${
                                      countryCode === country.code && countryFlag === country.flag 
                                        ? 'bg-blue-50 text-blue-700 font-medium' 
                                        : 'text-gray-700'
                                    }`}
                                    onClick={() => handleCountrySelect(country.code, country.flag)}
                                    type="button"
                                  >
                                    <span className="text-lg mr-3">{country.flag}</span>
                                    <div className="flex-1">
                                      <span className="block">{country.name}</span>
                                      <span className="text-xs text-gray-500">+{country.code}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      {/* Separator */}
                      <div className="w-px bg-gray-200 self-stretch"></div>
                      
                      {/* Phone input */}
                      <div className="flex-1 relative">
                        <input
                          type="tel"
                          value={formatPhoneDisplay(phoneInputValue, countryCode)}
                          onChange={handlePhoneInputChange}
                          className="w-full h-full px-4 py-4 text-gray-800 bg-transparent border-0 rounded-r-xl focus:outline-none placeholder-gray-400"
                          placeholder={countryCode === '1' ? "(555) 123-4567" : "Phone number"}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Error message */}
                  {phoneError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600 flex items-center"
                    >
                      <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center mr-2 flex-shrink-0">
                        !
                      </span>
                      {phoneError}
                    </motion.p>
                  )}
                  
                  {/* Help text */}
                  <p className="mt-2 text-xs text-gray-500 flex items-center">
                    <Shield className="w-3 h-3 mr-1" />
                    Your phone number is encrypted and used only for account security
                  </p>
                </div>
                
                {/* Submit button */}
                <motion.div
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    type="submit" 
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:shadow-xl"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Securing Account...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <Globe className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.form>
            
            {/* Security badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 pt-6 border-t border-gray-100"
            >
              <div className="flex items-center justify-center space-x-6 text-xs text-gray-400">
                <div className="flex items-center">
                  <Shield className="w-3 h-3 mr-1" />
                  SSL Encrypted
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                  GDPR Compliant
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CompleteOAuthProfile;