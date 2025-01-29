import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import * as z from 'zod';
import api from '../../services/api';
import { useAuth } from '../../stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
  register,
  handleSubmit,
  watch, // Add this
  formState: { errors, isSubmitting },
} = useForm({
  resolver: zodResolver(loginSchema),
});

  const onSubmit = async (data, retryCount = 0) => {
    try {
      setError('');
      console.log('Sending login request:', data);

      // Use the login function from useAuthStore
      await login(data.email, data.password);

      // Redirect to home page
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);

      // Maximum retry attempts
      const MAX_RETRIES = 3;

      // If it's a timeout or network error and we haven't exceeded max retries
      if ((err.statusCode === 408 || !err.response) && retryCount < MAX_RETRIES) {
        // Increment retry count
        const nextRetry = retryCount + 1;

        // Calculate delay with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);

        // Show retry toast
        toast.info(`Retrying login attempt ${nextRetry}/${MAX_RETRIES}...`);

        // Wait for the delay
        await new Promise(resolve => setTimeout(resolve, delay));

        // Retry the login
        return onSubmit(data, nextRetry);
      }

      // If we've exhausted retries or it's another type of error, show error message
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

      // Set the error message and display a toast notification
      setError(errorMessage);
      toast.error('Login failed', { description: errorMessage });

      // If all retries failed, automatically refresh the page after a delay
      if (retryCount >= MAX_RETRIES) {
        toast.info('Refreshing page...', {
          duration: 2000,
        });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    }
  };

  const handleResendVerificationEmail = async () => {
  try {
    const email = watch('email'); // Get the email from the form
    await api.post('/auth/resend-verification', { email })
    navigate('/email-verification-notification');
  } catch (err) {
    toast.error('Failed to resend verification email. Please try again.');
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to GymShop
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence>
            {error && (
              <motion.div
                className=" flex justify-center bg-red-50 text-red-500 p-3 rounded-md text-sm"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {error}
                {error.includes('not verified') && (
                  <button
                    type="button"
                    onClick={handleResendVerificationEmail}
                    className="font-semibold w-1/3 mt-1 h-1/2 bg-gradient-to-br from-red-400 to-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Resend 
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="rounded-md shadow-sm space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm hover:border-blue-400 transition-colors"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm hover:border-blue-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </motion.div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <LogIn className="h-5 w-5 text-blue-500 group-hover:text-blue-400 transition-colors" />
            </span>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginForm;
