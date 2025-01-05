import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock } from 'lucide-react';
import api from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();
  const token = searchParams.get('token');

  // Add debugging
  useEffect(() => {
    console.log('Reset Password Component Mounted');
    console.log('Token from URL:', token);
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      console.log('Sending reset request...');
      const response = await api.post('/auth/reset-password', {
        token,
        password: formData.password
      });
      console.log('Reset response:', response);

      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(
        error.response?.data?.message || 
        'Failed to reset password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Add debugging for render paths
  console.log('Rendering ResetPassword component');
  console.log('Current token:', token);

  if (!token) {
    console.log('No token found, showing error state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-6">
            <p className="text-red-500">Invalid or expired reset password link.</p>
            <Button
              onClick={() => navigate('/forgot-password')}
              className="mt-4"
              variant="secondary"
            >
              Request New Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('Token found, showing reset form');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="text-center mb-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">
                Enter your new password below.
              </p>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({
                    ...formData,
                    password: e.target.value
                  })}
                  placeholder="New password"
                  required
                  className="w-full pr-10" // Add padding for the eye icon
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
                Password must be at least 8 characters long
              </p>
            </div>

            <Input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({
                ...formData,
                confirmPassword: e.target.value
              })}
              placeholder="Confirm new password"
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
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;