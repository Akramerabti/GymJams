import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Phone, Lock, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../stores/authStore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { countryCodes, formatE164, isValidPhoneNumber } from '../utils/phoneUtils';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('1'); 
  const [countryFlag, setCountryFlag] = useState('🇺🇸'); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [phoneInputValue, setPhoneInputValue] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Debugging - log dropdown state changes
    //("Dropdown state changed:", isDropdownOpen);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Update formatted phone value when input or country changes
  useEffect(() => {
    // Check validity
    const valid = isValidPhoneNumber(phoneInputValue, countryCode);
    setIsPhoneValid(valid);
    
    // Pass the E.164 formatted value to form data
    const e164Value = formatE164(phoneInputValue, countryCode);
    setFormData(prev => ({ ...prev, phone: e164Value }));
    
    // Clear phone error if it becomes valid
    if (valid && errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  }, [phoneInputValue, countryCode]);

  // Form validation logic
  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone || !formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!isPhoneValid) {
      newErrors.phone = 'Invalid phone number format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for phone input
    if (name === 'phone') {
      // Extract only digits
      const digits = value.replace(/\D/g, '');
      setPhoneInputValue(digits);
      return;
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCountrySelect = (code, flag) => {
    setCountryCode(code);
    setCountryFlag(flag);
    setIsDropdownOpen(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { confirmPassword, ...registrationData } = formData;
      const response = await register(registrationData);
      if (response && (response.token || response.user)) {
        toast.success('Registration successful!', {
          description: 'Please check your email to verify your account.'
        });
        const encodedEmail = encodeURIComponent(registrationData.email);
        localStorage.setItem('verificationEmail', registrationData.email);
        navigate(`/email-verification-notification?email=${encodedEmail}`, {
          replace: true,
          state: { email: registrationData.email }
        });
        window.location.href = `/email-verification-notification?email=${encodedEmail}`;
        return;
      }
      throw new Error('Registration unsuccessful');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed', {
        description: error.response?.data?.message || 'Registration failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Format the phone number for display based on country code
  const formatPhoneDisplay = (phone, code) => {
    if (!phone) return '';
    
    // For US/Canada format
    if (code === '1') {
      if (phone.length > 6) {
        return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
      } else if (phone.length > 3) {
        return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
      } else if (phone.length > 0) {
        return `(${phone}`;
      }
    }
    
    // For other countries, just return the raw digits
    return phone;
  };

  return (
    <div className="register-page relative overflow-hidden">
      {/* Floating Balls */}
      {[...Array(15)].map((_, index) => (
        <div
          key={index}
          className="absolute rounded-full bg-opacity-30"
          style={{
            width: `${Math.random() * 50 + 20}px`,
            height: `${Math.random() * 50 + 20}px`,
            backgroundColor: ['#006eff', '#ff5733', '#d94b1f'][Math.floor(Math.random() * 3)],
            left: `${Math.random() * 100}vw`,
            top: `${Math.random() * 100}vh`,
            animation: `float ${Math.random() * 5 + 5}s ease-in-out infinite`
          }}
        ></div>
      ))}
      <div className="register-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-white">
            Create your account
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  icon={<User className="w-5 h-5 icon" />}
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  className="input-field"
                />
              </div>
              <div>
                <Input
                  icon={<User className="w-5 h-5 icon" />}
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  className="input-field"
                />
              </div>
            </div>

            <Input
              icon={<Mail className="w-5 h-5 icon" />}
              name="email"
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              className="input-field"
            />

            {/* Custom Phone Input with Country Code Dropdown */}
            <div className="relative">
              <div className={`flex h-10 w-full rounded-md border ${errors.phone ? 'border-red-500' : 'border-gray-300'} bg-white overflow-hidden`}>
                {/* Country dropdown button */}
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
                  
                  {/* Country dropdown menu with AnimatePresence */}
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
                          {countryCodes.map((country) => (
                            <button
                              key={`${country.code}-${country.country}`}
                              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center ${
                                countryCode === country.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                              }`}
                              onClick={() => handleCountrySelect(country.code, country.flag)}
                              type="button"
                            >
                              <span className="text-base mr-2">{country.flag}</span>
                              <span>{country.name}</span>
                              <span className="ml-1 text-gray-500">(+{country.code})</span>
                              {countryCode === country.code && (
                                <Check className="h-4 w-4 ml-auto text-blue-500" />
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                
                {/* Divider */}
                <div className="w-px h-6 self-center bg-gray-300"></div>
                
                {/* Phone input */}
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    name="phone"
                    type="tel"
                    value={formatPhoneDisplay(phoneInputValue, countryCode)}
                    onChange={(e) => {
                      // Extract only digits
                      const digits = e.target.value.replace(/\D/g, '');
                      setPhoneInputValue(digits);
                    }}
                    className="w-full h-full pl-8 pr-8 text-sm border-0 focus:outline-none focus:ring-0"
                    placeholder={countryCode === '1' ? "(555) 123-4567" : "Phone number"}
                  />
                </div>
                
                {/* Validity indicator */}
                {phoneInputValue.length > 0 && (
                  <div className="self-center pr-2">
                    {isPhoneValid ? (
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
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            <div className="relative">
              <Input
                icon={<Lock className="w-5 h-5 icon" />}
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                className="input-field"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 icon" />
                ) : (
                  <Eye className="w-5 h-5 icon" />
                )}
              </button>
            </div>

            <Input
              icon={<Lock className="w-5 h-5 icon" />}
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              className="input-field"
            />

            <Button
              type="submit"
              className="submit-button w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner"></div>
                  <span className="ml-2">Creating Account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                </div>
              </div>
                        
              <div className="mt-6">
                <SocialLoginButtons />
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter className="text-center">
          <p className="text-sm text-gray-300">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </div>
    </div>
  );
};

export default Register;