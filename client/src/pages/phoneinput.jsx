import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Phone } from 'lucide-react';

const PhoneInput = ({ value, onChange, error }) => {
  const [formattedValue, setFormattedValue] = useState('');

  // Format the phone number with dashes
  const formatPhoneNumber = (input) => {
    // Remove all non-digit characters
    const cleaned = input.replace(/\D/g, '');
    
    // Limit to 10 digits
    const truncated = cleaned.slice(0, 10);
    
    // Add dashes after 3rd and 6th digits if they exist
    let formatted = truncated;
    if (truncated.length > 3) {
      formatted = truncated.slice(0, 3) + '-' + truncated.slice(3);
    }
    if (truncated.length > 6) {
      formatted = formatted.slice(0, 7) + '-' + formatted.slice(7);
    }
    
    return formatted;
  };

  // Handle input changes
  const handleChange = (e) => {
    const input = e.target.value;
    const formatted = formatPhoneNumber(input);
    setFormattedValue(formatted);
    
    // Pass only digits to parent component
    const digitsOnly = formatted.replace(/\D/g, '');
    onChange(digitsOnly);
  };

  // Initialize formatted value from prop
  useEffect(() => {
    if (value) {
      setFormattedValue(formatPhoneNumber(value));
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Phone Number
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Phone className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="tel"
          placeholder="123-456-7890"
          value={formattedValue}
          onChange={handleChange}
          className="pl-10" // Add padding for the icon
          maxLength={12} // Account for two dashes
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default PhoneInput;