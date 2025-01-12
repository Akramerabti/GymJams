import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react';
import { useAuth } from '../stores/authStore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  // Utility function to format phone number
  const formatPhoneNumber = (value) => {
    if (!value) return value;

    const phoneNumber = value.replace(/[^\d]/g, ''); // Remove all non-digits
    const phoneNumberLength = phoneNumber.length;

    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    }
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

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
    } else if (!/^\d{3}-\d{3}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format (XXX-XXX-XXXX)';
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Format phone number if the field is 'phone'
    const formattedValue = name === 'phone' ? formatPhoneNumber(value) : value;

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Starting registration process');
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
  
    setLoading(true);
    try {
      const { confirmPassword, ...registrationData } = formData;
      
      // Clean phone number before sending
      registrationData.phone = registrationData.phone.replace(/-/g, '');
      
      console.log('Cleaned registration data:', registrationData);
      
      // Store email in localStorage
      localStorage.setItem('verificationEmail', registrationData.email);
      console.log('Email stored in localStorage:', registrationData.email);
      
      const response = await register(registrationData);
      console.log('Registration response:', response);
      
      // Check if we have either a token or user object
      if (response && (response.token || response.user)) {
        console.log('Registration successful, preparing for redirect');
        
        toast.success("Registration successful!", {
          description: "Please check your email to verify your account."
        });

        console.log('Navigating to verification page');
        navigate('/email-verification-notification', { 
          replace: true,
          state: { email: registrationData.email } 
        });
        
        return;
      }
      
      // If we got here, something went wrong
      console.log('Invalid registration response format:', response);
      localStorage.removeItem('verificationEmail');
      throw new Error('Registration unsuccessful');
      
    } catch (error) {
      console.error('Registration error details:', {
        error,
        response: error.response,
        data: error.response?.data
      });
      
      localStorage.removeItem('verificationEmail');
      
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Registration failed';
      
      console.log('Setting error message:', errorMessage);
      toast.error("Registration failed", {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Create your account
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    icon={<User className="w-5 h-5" />}
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    error={errors.firstName}
                  />
                </div>
                <div>
                  <Input
                    icon={<User className="w-5 h-5" />}
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    error={errors.lastName}
                  />
                </div>
              </div>

              <Input
                icon={<Mail className="w-5 h-5" />}
                name="email"
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />

              <Input
                icon={<Phone className="w-5 h-5" />}
                name="phone"
                placeholder="Phone Number (XXX-XXX-XXXX)"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
              />

              <div className="relative">
                <Input
                  icon={<Lock className="w-5 h-5" />}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>

              <Input
                icon={<Lock className="w-5 h-5" />}
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;