import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom'; // <-- Add this import
import SocialLoginButtons from './SocialLoginButtons';

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const { darkMode } = useTheme(); // <-- Use theme context
  const navigate = useNavigate(); // <-- Add this line

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate random success/failure for demo
      if (Math.random() > 0.3) {
        alert('Login successful!');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err) {
      setError('Invalid email or password. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerificationEmail = () => {
    alert('Verification email sent!');
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-colors duration-300
        ${darkMode
          ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800'
          : 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900'
        }
        py-8 px-2 sm:px-6 lg:px-8
        overflow-y-auto
      `}
      style={{ minHeight: '100dvh' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full filter blur-xl opacity-20 animate-pulse
          ${darkMode ? 'bg-blue-900' : 'bg-blue-500'}
        `}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full filter blur-xl opacity-20 animate-pulse
          ${darkMode ? 'bg-indigo-900' : 'bg-indigo-500'}
        `}></div>
      </div>

      <div className="relative flex justify-center items-center w-full z-10 mt-8 mb-8">
        <div
          className={`
            bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20
            transition-colors duration-300
            w-full
            max-w-xs sm:max-w-sm
            md:max-w-[33vw] lg:max-w-[33vw] xl:max-w-[33vw]
            min-h-[400px] sm:min-h-[480px] md:min-h-[520px] lg:min-h-[560px]
            ${darkMode ? 'bg-gray-900/95 border-gray-800 text-gray-100' : ''}
            p-4 sm:p-8 space-y-6
          `}
        >
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600">
              Sign in to your GymShop account
            </p>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{error}</p>
                  {error.includes('not verified') && (
                    <button
                      type="button"
                      onClick={handleResendVerificationEmail}
                      className="text-sm text-blue-600 hover:text-blue-500 font-medium underline mt-1"
                    >
                      Resend verification email
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-12 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                onClick={() => navigate('/forgot-password')} // <-- Add this handler
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Sign in
                </div>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <SocialLoginButtons />
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;