import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Key } from 'lucide-react';
import api from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const isOAuthSetup = searchParams.get('setup') === 'true'; // Check if this is OAuth password setup

  useEffect(() => {
    console.log('Reset Password Component Mounted');
    console.log('Token from URL:', token);
    console.log('Is OAuth Setup:', isOAuthSetup);
  }, [token, isOAuthSetup]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    
    // Password requirements
    const requirements = [];
    if (formData.password.length < 8) {
      requirements.push('at least 8 characters');
    }
    if (!/[A-Z]/.test(formData.password)) {
      requirements.push('an uppercase letter');
    }
    if (!/[a-z]/.test(formData.password)) {
      requirements.push('a lowercase letter');
    }
    if (!/[0-9]/.test(formData.password)) {
      requirements.push('a number');
    }
    if (!/[^A-Za-z0-9]/.test(formData.password)) {
      requirements.push('a special character');
    }
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (requirements.length > 0) {
      setPasswordError('Password must contain ' + requirements.join(', '));
      return;
    }
    setPasswordError('');

    setLoading(true);

    try {
      console.log('Sending reset request...');
      const response = await api.post('/auth/reset-password', {
        token,
        password: formData.password
      });
      console.log('Reset response:', response);

      if (isOAuthSetup) {
        toast.success('Password created successfully! You can now login with email and password.');
      } else {
        toast.success('Password reset successfully!');
      }
      
      navigate('/login');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(
        error.response?.data?.message || 
        `Failed to ${isOAuthSetup ? 'create' : 'reset'} password. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    console.log('No token found, showing error state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-6">
            <p className="text-red-500">
              Invalid or expired {isOAuthSetup ? 'setup' : 'reset password'} link.
            </p>
            <Button
              onClick={() => navigate(isOAuthSetup ? '/login' : '/forgot-password')}
              className="mt-4"
              variant="secondary"
            >
              {isOAuthSetup ? 'Back to Login' : 'Request New Link'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('Token found, showing form');
  
  const icon = isOAuthSetup ? Key : Lock;
  const IconComponent = icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isOAuthSetup ? 'Create Your Password' : 'Reset Your Password'}
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="text-center mb-4">
              <div className={`mx-auto w-12 h-12 ${isOAuthSetup ? 'bg-green-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mb-4`}>
                <IconComponent className={`h-6 w-6 ${isOAuthSetup ? 'text-green-600' : 'text-blue-600'}`} />
              </div>
              <p className="text-sm text-gray-600">
                {isOAuthSetup 
                  ? 'Create a password for your account so you can login with email and password in addition to Google sign-in.'
                  : 'Enter your new password below.'
                }
              </p>
            </div>

            {isOAuthSetup && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Good news!</strong> After creating your password, you'll be able to login using either:
                </p>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  <li>• Google sign-in (as usual)</li>
                  <li>• Email and password</li>
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      password: e.target.value
                    });
                    setPasswordError('');
                  }}
                  placeholder={isOAuthSetup ? 'Create password' : 'New password'}
                  required
                  className={`w-full pr-10 ${passwordError ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
              </p>
              {passwordError && (
                <p className="text-sm text-red-500 mt-1">{passwordError}</p>
              )}
            </div>

            <Input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({
                ...formData,
                confirmPassword: e.target.value
              })}
              placeholder="Confirm password"
              required
              className="w-full"
            />
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading 
                ? `${isOAuthSetup ? 'Creating' : 'Resetting'} Password...` 
                : `${isOAuthSetup ? 'Create' : 'Reset'} Password`
              }
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;