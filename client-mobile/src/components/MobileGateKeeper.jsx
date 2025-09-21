import BrowserGoogleAuthButton from './auth/BrowserGoogleAuthButton';
import React, { useState, useEffect, useRef} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Phone, Eye, EyeOff, CheckCircle2, Loader2, ArrowLeft, Key } from 'lucide-react';
import { useAuth } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';

const MobileGatekeeper = ({ isOpen, onAccountCreated, onClose }) => {
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // New states for OAuth password setup
  const [passwordSetupEmail, setPasswordSetupEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const loginTimeoutRef = useRef(null);
  const successScreenStartTimeRef = useRef(null);

  const { login, register } = useAuth();


  useEffect(() => {
    if (isOpen && currentScreen === 'loading') {
      const timer = setTimeout(() => {
        setCurrentScreen('auth');
      }, 2500);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [isOpen, currentScreen]);

  useEffect(() => {
    if (isOpen) {
      setCurrentScreen('loading');
      setAuthMode('login');
      setStep(1);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      });
      setErrors({});
      setPasswordSetupEmail('');
      setEmailSent(false);
      setCooldown(0);
    } else {
      setCurrentScreen('loading');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('dark', 'bg-gray-900');
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Cooldown timer for password setup email
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(current => current - 1);
      }, 1000);
      return () => {
        clearInterval(timer);
      };
    }
  }, [cooldown]);

  // ...existing code...

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  useEffect(() => {
    return () => {
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
        loginTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen && loginTimeoutRef.current) {
      clearTimeout(loginTimeoutRef.current);
      loginTimeoutRef.current = null;
    }
  }, [isOpen]);

  const validateStep = (currentStep) => {
    const newErrors = {};
    
    if (authMode === 'login') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required';
      }
    } else {
      if (currentStep === 1) {
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email';
        }
      }
      
      if (currentStep === 2) {
        if (!formData.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
          newErrors.phone = 'Please enter a valid phone number';
        }
        
        if (!formData.password) {
          newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
          newErrors.password = 'Password must contain uppercase, lowercase, and number';
        }
        
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendPasswordSetupEmail = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: passwordSetupEmail });
      setEmailSent(true);
      setCooldown(60);
      toast.success('Password setup email sent!');
    } catch (error) {
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

const handleLogin = async (data = formData, retryCount = 0) => {
  if (!validateStep(1)) {
    return;
  }
  
  setIsLoading(true);
  
  try {
    setErrors({});
    await login(data.email, data.password);
    localStorage.setItem('showLoginSuccess', 'true');
    localStorage.setItem('hasCompletedOnboarding', 'true');
    localStorage.setItem('userLoginMethod', 'email_password');
    localStorage.setItem('persistentLogin', 'true');
    if (onAccountCreated) {
      onAccountCreated({ email: data.email }, 'logged_in_successfully');
    }
    if (onClose) {
      onClose();
    }
    toast.success('Login successful!');
    setTimeout(() => {
      navigate('/?loginSuccess=true');
    }, 100);
  } catch (err) {
    if (err.isOAuthUser || err.redirectToPasswordSetup || err.response?.data?.isOAuthUser) {
      setPasswordSetupEmail(data.email);
      setCurrentScreen('password-setup');
      setIsLoading(false);
      return;
    }
    const MAX_RETRIES = 3;
    if ((err.statusCode === 408 || !err.response) && retryCount < MAX_RETRIES) {
      const nextRetry = retryCount + 1;
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      toast.info(`Retrying login attempt ${nextRetry}/${MAX_RETRIES}...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return handleLogin(data, nextRetry);
    }
    let errorMessage = 'An unexpected error occurred. Please try again.';
    if (err.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out. Please check your internet connection and try again.';
    } else if (err.response) {
      switch (err.response.status) {
        case 400:
          if (err.response.data?.isOAuthUser) {
            setPasswordSetupEmail(data.email);
            setCurrentScreen('password-setup');
            setIsLoading(false);
            return;
          }
          errorMessage = 'Email and password are required.';
          break;
        case 401:
          errorMessage = 'Invalid email or password. Please check your credentials.';
          break;
        case 403:
          errorMessage = 'Your email is not verified. Please check your inbox.';
          break;
        case 404:
          errorMessage = 'User not found. Please check your email address.';
          break;
        case 429:
          errorMessage = 'Too many login attempts. Please try again later.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = 'Something went wrong. Please try again.';
      }
    } else if (err.request) {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    }
    setErrors({ submit: errorMessage });
    toast.error('Login failed', { description: errorMessage });
    if (retryCount >= MAX_RETRIES) {
      toast.info('Refreshing page...', { duration: 2000 });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  } finally {
    setIsLoading(false);
  }
};

  const handleSignup = async () => {
    if (!validateStep(2)) {
      return;
    }
    setIsLoading(true);
    try {
      const { confirmPassword, ...registrationData } = formData;
      const response = await register(registrationData);
      if (response && (response.token || response.user)) {
        localStorage.setItem('verificationEmail', registrationData.email);
        toast.success('Registration successful!', {
          description: 'Please check your email to verify your account.'
        });
        const encodedEmail = encodeURIComponent(registrationData.email);
        navigate(`/email-verification-notification?email=${encodedEmail}`);
        return;
      }
      toast.error('Registration unsuccessful. No token or user returned.');
      throw new Error('Registration unsuccessful');
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Registration failed. Please try again.';
      setErrors({ submit: errorMessage });
      toast.error('Registration failed', {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepTransition = () => {
    if (validateStep(1)) {
      setStep(2);
    }
  };

  if (!isOpen) {
    return null;
  }

  if (currentScreen === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-hidden" data-gatekeeper="true" data-screen="loading">
        <div className="h-full flex flex-col items-center justify-center px-4">
          <motion.div
            className="mx-auto mb-8 flex items-center justify-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ width: 'clamp(7rem, 30vw, 10rem)', height: 'clamp(7rem, 30vw, 10rem)' }}
          >
            <img
              src="/Picture2.png"
              alt="GymTonic"
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '1.5rem', background: 'rgba(255,255,255,0.05)' }}
            />
          </motion.div>
          <motion.p
            className="text-indigo-200 font-medium mb-8 text-center"
            style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.25rem)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            All for one Fitness, For All
          </motion.p>
          <motion.div
            className="flex justify-center gap-2"
            style={{ background: 'transparent' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                style={{ width: 'clamp(0.6rem, 2vw, 1rem)', height: 'clamp(0.6rem, 2vw, 1rem)' }}
                animate={{
                  y: [-10, 0, -10],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'success') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 overflow-hidden" data-gatekeeper="true" data-screen="success">
        <div className="h-full flex items-center justify-center px-6">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            onAnimationStart={() => console.log('🚪 MOBILE_GATEKEEPER: Success screen animation started')}
            onAnimationComplete={() => console.log('🚪 MOBILE_GATEKEEPER: Success screen animation completed')}
          >
            <motion.div
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center shadow-2xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h1
              className="text-3xl font-black text-white mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Welcome to GymTonic!
            </motion.h1>

            <motion.p
              className="text-lg text-green-200 mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              {authMode === 'login' ? 'Logged in successfully!' : 'Account created successfully!'}
            </motion.p>

            <motion.p
              className="text-emerald-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              Get ready to transform your fitness journey
            </motion.p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ✅ NEW PASSWORD SETUP SCREEN - stays within mobile app
  if (currentScreen === 'password-setup') {
    if (emailSent) {
      return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="pt-20 pb-4 px-6">
              <div className="mx-auto mb-4 bg-gradient-to-br from-blue-400 to-green-500 rounded-2xl flex items-center justify-center shadow-xl"
                style={{ width: 'clamp(4rem, 15vw, 6rem)', height: 'clamp(4rem, 15vw, 6rem)' }}>
                <Mail className="text-white" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }} />
              </div>

              <h1 className="font-bold text-white text-center mb-2"
                style={{ fontSize: 'clamp(1.3rem, 5vw, 2rem)' }}>
                Check Your Email
              </h1>

              <p className="text-blue-200 text-center"
                style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)' }}>
                We sent a password setup link
              </p>
            </div>

            <div className="flex-1 bg-gradient-to-br from-gray-800/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10 overflow-hidden">
              <div className="h-full overflow-y-auto px-6 py-6">
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="text-center space-y-4">
                    <p className="text-sm text-gray-300">
                      We sent a password setup link to:
                    </p>
                    <p className="font-medium text-white text-lg">{passwordSetupEmail}</p>
                    <p className="text-sm text-gray-400">
                      Click the link in the email to create your password. If you don't see it, check your spam folder.
                    </p>
                    
                    <div className="pt-4">
                      <button
                        onClick={handleSendPasswordSetupEmail}
                        disabled={cooldown > 0 || isLoading}
                        className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
                      >
                        {cooldown > 0 
                          ? `Resend email (${cooldown}s)` 
                          : isLoading 
                            ? 'Sending...' 
                            : 'Resend setup email'
                        }
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentScreen('auth');
                      setPasswordSetupEmail('');
                      setEmailSent(false);
                      setCooldown(0);
                    }}
                    className="w-full mt-6 bg-gray-700/60 text-gray-300 py-3 rounded-xl hover:bg-gray-600/60 transition-colors flex items-center justify-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="pt-20 pb-4 px-6">
            <div className="mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl"
              style={{ width: 'clamp(4rem, 15vw, 6rem)', height: 'clamp(4rem, 15vw, 6rem)' }}>
              <Key className="text-white" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }} />
            </div>

            <h1 className="font-bold text-white text-center mb-2"
              style={{ fontSize: 'clamp(1.3rem, 5vw, 2rem)' }}>
              Set Up Your Password
            </h1>

            <p className="text-amber-200 text-center"
              style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)' }}>
              Your account uses Google sign-in
            </p>
          </div>

          <div className="flex-1 bg-gradient-to-br from-gray-800/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10 overflow-hidden">
            <div className="h-full overflow-y-auto px-6 py-6">
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-300 mb-4">
                    Your account <strong className="text-white">{passwordSetupEmail}</strong> was created using Google sign-in.
                  </p>
                  <p className="text-sm text-gray-400 mb-6">
                    To also be able to login with email and password, we'll send you a secure link to set up your password.
                  </p>
                </div>

                <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-300 mb-2">What happens next:</h3>
                  <ul className="text-sm text-blue-200 space-y-1">
                    <li>• We'll send you a secure setup link via email</li>
                    <li>• Click the link to create your password</li>
                    <li>• You can then login with either Google or email/password</li>
                  </ul>
                </div>

                <button
                  onClick={handleSendPasswordSetupEmail}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending Setup Email...
                    </>
                  ) : (
                    'Send Password Setup Email'
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setCurrentScreen('auth');
                    setPasswordSetupEmail('');
                    setEmailSent(false);
                    setCooldown(0);
                  }}
                  className="w-full bg-gray-700/60 text-gray-300 py-3 rounded-xl hover:bg-gray-600/60 transition-colors flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="pt-20 pb-4 px-6">
          <motion.div
            className="mx-auto mb-4 flex items-center justify-center"
            style={{ width: 'clamp(4rem, 15vw, 6rem)', height: 'clamp(4rem, 15vw, 6rem)' }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <img
              src="/Picture2.png"
              alt="GymTonic"
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '1.5rem' }}
            />
          </motion.div>

          <motion.h1
            className="font-bold text-white text-center mb-2"
            style={{ fontSize: 'clamp(1.3rem, 5vw, 2rem)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {authMode === 'login' ? 'Welcome Back' : 'Join GymTonic'}
          </motion.h1>

          <motion.p
            className="text-orange-200 text-center"
            style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {authMode === 'login' ? 'Log in to continue your journey' : 'Create your account to get started'}
          </motion.p>
        </div>

        {/* Form Container */}
        <div className="flex-1 bg-gradient-to-br from-gray-800/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10 overflow-hidden">
          <div className="h-full overflow-y-auto px-6 py-6">
            {authMode === 'login' ? (
              // Login Form
              <motion.form
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  console.log('🚪 MOBILE_GATEKEEPER: Login form submitted');
                  handleLogin();
                }}
              >
                {/* Social Login Buttons */}
                <BrowserGoogleAuthButton onAccountCreated={(userData, action) => {
                  console.log('🚪 MOBILE_GATEKEEPER: BrowserGoogleAuthButton callback:', { userData, action });
                  onAccountCreated(userData, action);
                }} />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800 text-gray-400">Or continue with email</span>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-700/60 border-2 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                        errors.email ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full pl-10 pr-12 py-3 bg-gray-700/60 border-2 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                        errors.password ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        console.log('🚪 MOBILE_GATEKEEPER: Password visibility toggled');
                        setShowPassword(!showPassword);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-400"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                  )}
                </div>

                {errors.submit && (
                  <p className="text-sm text-red-400 text-center">{errors.submit}</p>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Log In'
                  )}
                </motion.button>

                <p className="text-center text-gray-400 mt-4">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🚪 MOBILE_GATEKEEPER: Switching to signup mode');
                      setAuthMode('signup');
                      setErrors({});
                    }}
                    className="text-orange-400 hover:text-orange-300 font-semibold"
                  >
                    Sign up
                  </button>
                </p>
              </motion.form>
            ) : (
              // Signup Form with Steps
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  // Step 1: Personal Info
                  <motion.form
                    key="step1"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      console.log('🚪 MOBILE_GATEKEEPER: Step 1 form submitted');
                      handleStepTransition();
                    }}
                  >
                    {/* Progress Indicator */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>Step 1 of 2</span>
                        <span>Personal Info</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full w-1/2"></div>
                      </div>
                    </div>

                    {/* Social Login Buttons */}
                   <BrowserGoogleAuthButton onAccountCreated={onAccountCreated} />

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-600"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-800 text-gray-400">Or sign up with email</span>
                      </div>
                    </div>

                    {/* Form fields */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
                        <input
                          type="text"
                          autoComplete="given-name"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 bg-gray-700/60 border-2 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                            errors.firstName ? 'border-red-500' : 'border-gray-600'
                          }`}
                          placeholder="Enter your first name"
                        />
                      </div>
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
                        <input
                          type="text"
                          autoComplete="family-name"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 bg-gray-700/60 border-2 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                            errors.lastName ? 'border-red-500' : 'border-gray-600'
                          }`}
                          placeholder="Enter your last name"
                        />
                      </div>
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
                        <input
                          type="email"
                          autoComplete="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 bg-gray-700/60 border-2 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                            errors.email ? 'border-red-500' : 'border-gray-600'
                          }`}
                          placeholder="Enter your email"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                      )}
                    </div>

                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all"
                    >
                      Continue
                    </motion.button>

                    <p className="text-center text-gray-400">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          console.log('🚪 MOBILE_GATEKEEPER: Switching to login mode');
                          setAuthMode('login');
                          setErrors({});
                          setStep(1);
                        }}
                        className="text-orange-400 hover:text-orange-300 font-semibold"
                      >
                        Log in
                      </button>
                    </p>
                  </motion.form>
                ) : (
                  // Step 2: Account Security
                  <motion.form
                    key="step2"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      console.log('🚪 MOBILE_GATEKEEPER: Step 2 form submitted');
                      handleSignup();
                    }}
                  >
                    {/* Progress Indicator */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>Step 2 of 2</span>
                        <span>Account Security</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full w-full"></div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        console.log('🚪 MOBILE_GATEKEEPER: Back button clicked, going to step 1');
                        setStep(1);
                      }}
                      className="mb-4 p-2 rounded-lg bg-gray-700/60 text-gray-300 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
                        <input
                          type="tel"
                          autoComplete="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 bg-gray-700/60 border-2 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                            errors.phone ? 'border-red-500' : 'border-gray-600'
                          }`}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className={`w-full pl-10 pr-12 py-3 bg-gray-700/60 border-2 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                            errors.password ? 'border-red-500' : 'border-gray-600'
                          }`}
                          placeholder="Create a password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-400"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className={`w-full pl-10 pr-12 py-3 bg-gray-700/60 border-2 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                            errors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                          }`}
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-400"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                      )}
                    </div>

                    {errors.submit && (
                      <p className="text-sm text-red-400 text-center">{errors.submit}</p>
                    )}

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileGatekeeper;