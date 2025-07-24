import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, User, Phone, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import Onboarding from '../../pages/Onboarding';
import { useTranslation } from 'react-i18next';

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

const CompleteOAuthProfile = ({ user, token, missingFields, onComplete, onUserUpdate }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [countryCode, setCountryCode] = useState('1');
  const [countryFlag, setCountryFlag] = useState('🇺🇸'); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [phoneInputValue, setPhoneInputValue] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentUser, setCurrentUser] = useState(user); 
  const dropdownRef = useRef(null);
  
  const [formData, setFormData] = useState({
    phone: '',
    lastName: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});  
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

  useEffect(() => {
    if (missingFields?.phone && phoneInputValue) {
      const e164Value = `+${countryCode}${phoneInputValue}`;
      setFormData(prev => ({ ...prev, phone: e164Value }));
    }
  }, [phoneInputValue, countryCode, missingFields]);

  const validatePhone = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      return t('completeoauthprofile.phoneRequired');
    }
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    if (!cleanPhone.startsWith('+') || cleanPhone.length < 10) {
      return t('completeoauthprofile.phoneInvalid');
    }
    return '';
  };

  const validateLastName = (lastName) => {
    if (!lastName || lastName.trim() === '') {
      return t('completeoauthprofile.lastNameRequired');
    }
    return '';
  };

  const formatPhoneDisplay = (phone, code) => {
    if (!phone) return '';
    
    if (code === '1' && phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  const handleCountrySelect = (code, flag) => {
    setCountryCode(code);
    setCountryFlag(flag);
    setIsDropdownOpen(false);
  };

  const handlePhoneInputChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    setPhoneInputValue(digits);
    
    if (formErrors.phone) {
      setFormErrors(prev => ({ ...prev, phone: '' }));
    }
  };  

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    const errors = {};
    
    if (missingFields.phone) {
      const phoneError = validatePhone(formData.phone);
      if (phoneError) errors.phone = phoneError;
    }
    
    if (missingFields.lastName) {
      const lastNameError = validateLastName(formData.lastName);
      if (lastNameError) errors.lastName = lastNameError;
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {

      const updateData = {};
      if (missingFields.phone) updateData.phone = formData.phone;
      if (missingFields.lastName) updateData.lastName = formData.lastName;
      if (currentUser.tempToken) {
        updateData.tempToken = currentUser.tempToken;
      }

        const response = await api.post('/auth/complete-oauth-profile', updateData, {
        headers: currentUser.tempToken ? {} : {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.isComplete) {
        if (currentUser.tempToken && response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        if (response.data.bonusAwarded) {
          toast.success('Profile completed successfully! You received 100 bonus points!', {
            duration: 4000
          });
        } else {
          toast.success('Profile completed successfully!');
        }
        setShowOnboarding(true);
      } else {
        toast.error('Profile completion failed. Please try again.');
      }    } catch (error) {
      console.error('Profile completion error:', error);
      console.error('Error response data:', error.response?.data);
      
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || 'Failed to complete profile. Please try again.';

      if (errorData?.error) {
        console.error('Server error details:', errorData.error);
      }
      if (errorData?.debug) {
        console.error('Debug information:', errorData.debug);
      }

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
      
      if (errorData?.error?.type === 'duplicate') {
        const field = errorData.error.field;
        setFormErrors({
          [field]: `This ${field} is already registered with another account. Please use a different ${field}.`
        });
      } else if (errorData?.error?.type === 'validation') {

        const validationErrors = {};
        if (errorData.error.fields) {
          errorData.error.fields.forEach(field => {
            validationErrors[field] = `Invalid ${field} format`;
          });
        }
        setFormErrors(validationErrors);
      } else if (errorData?.error?.type === 'token' || errorData?.error?.type === 'token_expired') {
        toast.error('Your session has expired. Please sign in again.');
        navigate('/login');
        return;
      } else if (errorMessage.includes('phone number is already')) {
        setFormErrors({ phone: 'This phone number is already registered with another account. Please use a different number.' });
      } else if (errorMessage.includes('email is already registered')) {
        toast.error('This email is already registered. Please contact support if you believe this is an error.');
      } else if (errorData?.field) {
        setFormErrors({
          [errorData.field]: errorMessage
        });
      } else if (errorData?.requiresReauth) {
        toast.error('Your session has expired. Please sign in again.');
        navigate('/login');
        return;
      } else {
        const detailMessage = errorData?.debug 
          ? `${errorMessage} (${errorData.debug.name}: ${errorData.debug.originalMessage})`
          : errorMessage;
        toast.error(detailMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    if (onComplete) {
      onComplete();
    } else {
      navigate('/');
    }
  };

  const getIcon = () => {
    if (missingFields.phone && missingFields.lastName) {
      return <User className="w-8 h-8 text-blue-600" />;
    } else if (missingFields.phone) {
      return <Phone className="w-8 h-8 text-blue-600" />;
    } else {
      return <User className="w-8 h-8 text-blue-600" />;
    }
  };

  const getTitle = () => {
    if (missingFields.phone && missingFields.lastName) {
      return t('completeoauthprofile.title');
    } else if (missingFields.phone) {
      return t('completeoauthprofile.addPhone');
    } else if (missingFields.lastName) {
      return t('completeoauthprofile.addLastName');
    }
    return t('completeoauthprofile.title');
  };

  const getDescription = () => {
    const fields = [];
    if (missingFields.lastName) fields.push(t('completeoauthprofile.lastName'));
    if (missingFields.phone) fields.push(t('completeoauthprofile.phoneNumber'));
    if (fields.length === 1) {
      return t('completeoauthprofile.provideOne', { field: fields[0] });
    } else if (fields.length === 2) {
      return t('completeoauthprofile.provideTwo', { field1: fields[0], field2: fields[1] });
    }
    return t('completeoauthprofile.provideInfo');
  };

  if (showOnboarding) {
    return <Onboarding onClose={handleOnboardingClose} showPointsMessage={true} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {getTitle()}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="py-6">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              {getIcon()}
            </div>
          </div>
          
          <p className="text-gray-600 text-center mb-6">
            {getDescription()}
          </p>
          
          <form onSubmit={handleFormSubmit}>
            {missingFields.lastName && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('completeoauthprofile.lastName')}
                </label>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder={t('completeoauthprofile.lastNamePlaceholder')}
                  className={`w-full ${formErrors.lastName ? 'border-red-500' : ''}`}
                  required
                />
                {formErrors.lastName && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.lastName}</p>
                )}
              </div>
            )}
            
            {missingFields.phone && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('completeoauthprofile.phoneNumber')}
                </label>

                <div className="relative">
                  <div className={`flex h-10 w-full rounded-md border ${formErrors.phone ? 'border-red-500' : 'border-gray-300'} bg-white overflow-hidden`}>
                    <div className="relative z-20" ref={dropdownRef}>
                      <button
                        type="button"
                        className="h-full px-2 flex items-center text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      >
                        <span className="text-base mr-1">{countryFlag}</span>
                        <span className="text-xs font-medium">+{countryCode}</span>
                        {isDropdownOpen ? 
                          <ChevronUp className="h-3 w-3 ml-1" /> : 
                          <ChevronDown className="h-3 w-3 ml-1" />
                        }
                      </button>
                    
                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div 
                            className="absolute z-50 left-0 top-full mt-1 w-64 rounded-md shadow-lg bg-white border border-gray-200 max-h-60 overflow-y-auto"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                          >
                            <div className="py-1">
                              {countryCodes.map((country, index) => (
                                <button
                                  key={`${country.code}-${country.country}-${index}`}
                                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center ${
                                    countryCode === country.code && countryFlag === country.flag ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                  }`}
                                  onClick={() => handleCountrySelect(country.code, country.flag)}
                                  type="button"
                                >
                                  <span className="text-base mr-2">{country.flag}</span>
                                  <span>{country.name}</span>
                                  <span className="ml-1 text-gray-500">(+{country.code})</span>
                                  {countryCode === country.code && countryFlag === country.flag && (
                                    <Check className="h-4 w-4 ml-auto text-blue-500" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <div className="w-px h-6 self-center bg-gray-300"></div>
                    
                    <div className="relative flex-grow">
                      <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-500" />
                      </div>
                      <input
                        type="tel"
                        value={formatPhoneDisplay(phoneInputValue, countryCode)}
                        onChange={handlePhoneInputChange}
                        className="w-full h-full pl-8 pr-8 text-sm border-0 focus:outline-none focus:ring-0"
                        placeholder={countryCode === '1' ? "(555) 123-4567" : "Phone number"}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <p className="mt-1 text-xs text-gray-500">
                  {t('completeoauthprofile.example', { example: countryCode === '1' ? '12042867839' : `${countryCode}XXXXXXXXX` })}
                </p>
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.phone}</p>
                )}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('completeoauthprofile.saving')}
                </>
              ) : (
                t('completeoauthprofile.completeProfile')
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="justify-center">
          <p className="text-xs text-gray-500 text-center">
            {t('completeoauthprofile.infoSecure')}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CompleteOAuthProfile;
