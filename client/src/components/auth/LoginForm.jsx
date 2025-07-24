import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import * as z from 'zod';
import api from '../../services/api';
import { useAuth } from '../../stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import SocialLoginButtons from './SocialLoginButtons';
import { useTranslation } from 'react-i18next';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { darkMode } = useTheme();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data, retryCount = 0) => {
    try {
      setError('');
      await login(data.email, data.password);
      navigate('/');
    } catch (err) {
      const MAX_RETRIES = 3;
      if ((err.statusCode === 408 || !err.response) && retryCount < MAX_RETRIES) {
        const nextRetry = retryCount + 1;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        toast.info(`Retrying login attempt ${nextRetry}/${MAX_RETRIES}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return onSubmit(data, nextRetry);
      }
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (err.response) {
        switch (err.response.status) {
          case 400:
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
      setError(errorMessage);
      toast.error('Login failed', { description: errorMessage });
      if (retryCount >= MAX_RETRIES) {
        toast.info('Refreshing page...', { duration: 2000 });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    }
  };

  const handleResendVerificationEmail = async () => {
    try {
      const email = watch('email');
      await api.post('/auth/resend-verification', { email });
      navigate(`/email-verification-notification?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error('Failed to resend verification email. Please try again.');
    }
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
            ${darkMode
              ? 'bg-gray-900/95 border-gray-800 text-gray-100'
              : 'bg-white/95 border-white/20'
            }
            backdrop-blur-sm rounded-2xl shadow-2xl
            transition-colors duration-300
            w-full
            max-w-xs sm:max-w-sm
            md:max-w-[33vw] lg:max-w-[33vw] xl:max-w-[33vw]
            min-h-[400px] sm:min-h-[480px] md:min-h-[520px] lg:min-h-[560px]
            p-4 sm:p-8 space-y-6
          `}
        >
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('loginform.welcomeBack')}
            </h2>
            <p className="text-gray-600">
              {t('loginform.signInToAccount')}
            </p>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{error}</p>
                    {error.includes('not verified') && (
                      <button
                        type="button"
                        onClick={handleResendVerificationEmail}
                        className="text-sm text-blue-600 hover:text-blue-500 font-medium underline mt-1"
                      >
                        {t('loginform.resendVerification')}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('loginform.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('loginform.emailPlaceholder')}
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
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('loginform.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`block w-full pl-10 pr-12 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('loginform.passwordPlaceholder')}
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
                  {errors.password.message}
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  {t('loginform.rememberMe')}
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                {t('loginform.forgotPassword')}
              </Link>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('loginform.signingIn')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  {t('loginform.signIn')}
                </div>
              )}
            </motion.button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('loginform.orContinueWith')}</span>
              </div>
            </div>

            {/* Social Login */}
            <SocialLoginButtons />
          </form>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t('loginform.noAccount')}{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                {t('loginform.signUp')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;