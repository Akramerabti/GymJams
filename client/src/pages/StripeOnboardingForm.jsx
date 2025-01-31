import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, User, Home, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const StripeOnboardingForm = ({ onSubmit, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [formData, setFormData] = useState({
    email: initialData.email || '',
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    phone: initialData.phone || '',
    dateOfBirth: {
      day: '',
      month: '',
      year: '',
    },
    address: {
      line1: '',
      city: '',
      state: '',
      postalCode: '',
    }
  });

  const handleSubmit = async (e) => {
    console.log('Form data:', initialData);
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ ...formData,});
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (path, value) => {
    const pathArray = path.split('.');
    setFormData((prev) => {
      const newData = { ...prev };
      let current = newData;
      for (let i = 0; i < pathArray.length - 1; i++) {
        current = current[pathArray[i]];
      }
      current[pathArray[pathArray.length - 1]] = value;
      return newData;
    });
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-xl overflow-hidden bg-white/80 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardTitle className="text-2xl font-bold text-center">
          <div className="flex items-center justify-center space-x-2">
            <CreditCard className="w-6 h-6 animate-pulse" />
            <span className="animate-fade-in">Payout Information</span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-center space-x-4 mb-8">
            {['personal', 'address'].map((section) => (
              <Button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                className={`transition-all duration-300 transform hover:scale-105 ${
                  activeSection === section
                    ? 'bg-blue-600 text-white scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {section === 'personal' ? (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Personal</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Home className="w-4 h-4" />
                    <span>Address</span>
                  </div>
                )}
              </Button>
            ))}
          </div>

          <div className={`transition-all duration-500 transform ${
            activeSection === 'personal' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 hidden'
          }`}>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="group">
                  <Input
                    value={formData.firstName}
                    disabled
                    className="transition-all duration-300 border-gray-300 focus:ring-blue-500 group-hover:border-blue-400"
                  />
                  <label className="text-sm text-gray-600 transition-all duration-300 group-hover:text-blue-600">
                    First Name
                  </label>
                </div>
                <div className="group">
                  <Input
                    value={formData.lastName}
                    disabled
                    className="transition-all duration-300 border-gray-300 focus:ring-blue-500 group-hover:border-blue-400"
                  />
                  <label className="text-sm text-gray-600 transition-all duration-300 group-hover:text-blue-600">
                    Last Name
                  </label>
                </div>
              </div>

              <div className="group">
                <Input
                  type="email"
                  value={formData.email}
                  disabled
                  className="transition-all duration-300 border-gray-300 focus:ring-blue-500 group-hover:border-blue-400"
                />
                <label className="text-sm text-gray-600 transition-all duration-300 group-hover:text-blue-600">
                  Email
                </label>
              </div>

              <div className="group">
                <Input
                  type="tel"
                  value={formData.phone}
                  disabled
                  className="transition-all duration-300 border-gray-300 focus:ring-blue-500 group-hover:border-blue-400"
                />
                <label className="text-sm text-gray-600 transition-all duration-300 group-hover:text-blue-600">
                  Phone
                </label>
              </div>

              <div className="space-y-4">
                <label className="flex items-center space-x-2 text-gray-700">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span>Date of Birth</span>
                </label>
                <div className="grid grid-cols-3 gap-4 text-gray-700">
                  <select
                    value={formData.dateOfBirth.month}
                    onChange={(e) => handleChange('dateOfBirth.month', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-400"
                  >
                    <option value="" >Month</option>
                    {months.map((month, index) => (
                      <option key={month} value={index + 1} >
                        {month}
                      </option>
                    ))}
                  </select>
                  <select
                    value={formData.dateOfBirth.day}
                    onChange={(e) => handleChange('dateOfBirth.day', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-400"
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <select
                    value={formData.dateOfBirth.year}
                    onChange={(e) => handleChange('dateOfBirth.year', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-400"
                  >
                    <option value="">Year</option>
                    {Array.from(
                      { length: 100 },
                      (_, i) => new Date().getFullYear() - 18 - i
                    ).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className={`transition-all duration-500 transform ${
            activeSection === 'address' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 hidden'
          }`}>
            <div className="space-y-6">
              <div className="group">
                <Input
                  value={formData.address.line1}
                  onChange={(e) => handleChange('address.line1', e.target.value)}
                  required
                  placeholder="Street Address"
                  className="transition-all duration-300 border-gray-300 focus:ring-blue-500 group-hover:border-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="group">
                  <Input
                    value={formData.address.city}
                    onChange={(e) => handleChange('address.city', e.target.value)}
                    required
                    placeholder="City"
                    className="transition-all duration-300 border-gray-300 focus:ring-blue-500 group-hover:border-blue-400"
                  />
                </div>
                <div className="group">
                  <Input
                    value={formData.address.state}
                    onChange={(e) => handleChange('address.state', e.target.value)}
                    required
                    placeholder="State"
                    className="transition-all duration-300 border-gray-300 focus:ring-blue-500 group-hover:border-blue-400"
                  />
                </div>
              </div>

              <div className="group">
                <Input
                  value={formData.address.postalCode}
                  onChange={(e) => handleChange('address.postalCode', e.target.value)}
                  required
                  placeholder="ZIP Code"
                  className="transition-all duration-300 border-gray-300 focus:ring-blue-500 group-hover:border-blue-400"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              <span className="animate-pulse">Continue to Verification</span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default StripeOnboardingForm;