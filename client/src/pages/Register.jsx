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

  const handlePhoneChange = (e) => {
    // Extract only digits
    const digits = e.target.value.replace(/\D/g, '');
    setPhoneInputValue(digits);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      toast.error('Please fix the errors in the form.');
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...registrationData } = formData;
      console.log('Submitting registration:', registrationData);
      const response = await register(registrationData);
      console.log('Registration response:', response);
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
      toast.error('Registration unsuccessful. No token or user returned.');
      throw new Error('Registration unsuccessful');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed', {
        description: error?.response?.data?.message || error?.message || 'Registration failed. Please try again.'
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
    <div className="min-h-[100dvh] md:min-h-screen relative overflow-hidden">
      {/* Modern Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          {/* Large gradient orbs */}
          <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 -right-32 w-80 h-80 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
          <div className="absolute -bottom-40 left-20 w-96 h-96 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          
          {/* Floating particles */}
          {[...Array(20)].map((_, index) => (
            <motion.div
              key={index}
              className="absolute rounded-full bg-white/10"
              style={{
                width: `${Math.random() * 8 + 4}px`,
                height: `${Math.random() * 8 + 4}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: Math.random() * 4 + 4,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Crect%20width%3D%221%22%20height%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[100dvh] md:min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm md:w-3/4 md:max-w-md lg:w-2/3 lg:max-w-lg xl:w-1/2 xl:max-w-xl"
        >
          {/* Glass morphism card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header with brand gradient */}
            <div className="relative p-8 pb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
              <div className="relative text-center">
                <motion.h1
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent mb-2"
                >
                  Join GymTonic
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/70 text-sm"
                >
                  Create your account and start your fitness journey
                </motion.p>
              </div>
            </div>

            {/* Form */}
            <div className="p-8 pt-2">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name fields */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
                    <input
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
                    />
                    {errors.firstName && (
                      <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
                    <input
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
                    />
                    {errors.lastName && (
                      <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </motion.div>

                {/* Email field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="relative"
                >
                  <Mail className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
                  <input
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                  )}
                </motion.div>

                {/* Phone field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="relative"
                >
                  <div className="flex">
                    {/* Country dropdown */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        className="h-12 px-3 flex items-center bg-white/10 border border-white/20 border-r-0 rounded-l-xl text-white hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      >
                        <span className="text-sm mr-1">{countryFlag}</span>
                        <span className="text-xs">+{countryCode}</span>
                        {isDropdownOpen ? 
                          <ChevronUp className="h-3 w-3 ml-1" /> : 
                          <ChevronDown className="h-3 w-3 ml-1" />
                        }
                      </button>
                      
                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 left-0 top-full mt-1 w-64 rounded-xl shadow-2xl bg-white/95 backdrop-blur-xl border border-white/20 max-h-60 overflow-y-auto"
                          >
                            <div className="p-2">
                              {countryCodes.map((country) => (
                                <button
                                  key={country.code}
                                  type="button"
                                  className="w-full text-left px-3 py-2 hover:bg-blue-500/20 rounded-lg transition-colors text-gray-800 text-sm"
                                  onClick={() => {
                                    setCountryCode(country.code);
                                    setCountryFlag(country.flag);
                                    setIsDropdownOpen(false);
                                  }}
                                >
                                  <span className="mr-2">{country.flag}</span>
                                  <span className="mr-2">+{country.code}</span>
                                  <span className="text-gray-600">{country.name}</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    {/* Phone input */}
                    <div className="flex-1 relative">
                      <Phone className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={phoneInputValue}
                        onChange={handlePhoneChange}
                        className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 border-l-0 rounded-r-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
                      />
                      {isPhoneValid && (
                        <Check className="w-4 h-4 absolute right-4 top-1/2 transform -translate-y-1/2 text-green-400" />
                      )}
                    </div>
                  </div>
                  {errors.phone && (
                    <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
                  )}
                </motion.div>
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
                {/* Password fields */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {errors.password && (
                      <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                    )}
                  </div>
                  
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
                    <input
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </motion.div>

                {/* Submit button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </motion.div>

                {/* Social login divider */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="relative my-6"
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gradient-to-r from-transparent via-slate-900/80 to-transparent text-white/70">
                      Or sign up with
                    </span>
                  </div>
                </motion.div>

                {/* Social login buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <SocialLoginButtons />
                </motion.div>
              </form>
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="p-6 pt-0 text-center"
            >
              <p className="text-white/70 text-sm">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;