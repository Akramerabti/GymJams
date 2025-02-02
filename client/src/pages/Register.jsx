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

  // Function to format phone number
  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    }
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

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

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = name === 'phone' ? formatPhoneNumber(value) : value;
    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e, retryCount = 0) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { confirmPassword, ...registrationData } = formData;
      registrationData.phone = registrationData.phone.replace(/-/g, '');
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

            <Input
              icon={<Phone className="w-5 h-5 icon" />}
              name="phone"
              placeholder="Phone Number (XXX-XXX-XXXX)"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              className="input-field"
            />

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