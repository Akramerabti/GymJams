import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Phone, CheckCircle, Loader } from 'lucide-react';
import api from '../../services/api';

const PhoneVerification = ({ phone, onChange, onVerified }) => {
  const [verificationStep, setVerificationStep] = useState('input'); // 'input', 'verifying', 'verified'
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const inputRefs = useRef([]);
  
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);
  
  const handleSendVerificationCode = async () => {
    if (!phone || phone.trim() === '') {
      setPhoneError('Please enter your phone number');
      return;
    }
    
    setIsLoading(true);
    setPhoneError('');
    
    try {
      // First check if phone already exists
      const phoneCheckResponse = await api.post('/gym-bros/check-phone', { phone });
      if (phoneCheckResponse.data.exists) {
        setPhoneError('This phone number is already in use.');
        setIsLoading(false);
        return;
      }
      
      // Send verification code
      const response = await api.post('/gym-bros/send-verification', { phone });
      
      if (response.data.success) {
        setVerificationStep('verifying');
        setTimer(30); // 30 second countdown for resend
        toast.success('Verification code sent!');
        // Focus the first OTP input
        setTimeout(() => {
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
          }
        }, 100);
      } else {
        throw new Error(response.data.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      setPhoneError(error.response?.data?.message || 'Failed to send verification code');
      toast.error('Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerifyCode = async () => {
    const verificationCode = otpValues.join('');
    
    if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await api.post('/gym-bros/verify-code', { 
        phone, 
        code: verificationCode 
      });
      
      if (response.data.success) {
        setVerificationStep('verified');
        onVerified(true);
        toast.success('Phone number verified!');
      } else {
        toast.error(response.data.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      toast.error(error.response?.data?.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d*$/.test(value)) return;
    
    // Update the OTP array
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value.substring(0, 1); // Take only the first character
    setOtpValues(newOtpValues);
    
    // Auto-focus next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };
  
  const handleOtpKeyDown = (index, e) => {
    // Navigate between inputs with arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
    
    // Handle backspace to navigate backwards and clear
    if (e.key === 'Backspace') {
      if (otpValues[index] === '') {
        // If current input is empty, move to previous and clear it
        if (index > 0) {
          const newOtpValues = [...otpValues];
          newOtpValues[index - 1] = '';
          setOtpValues(newOtpValues);
          inputRefs.current[index - 1].focus();
        }
      }
    }
  };
  
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Check if pasted content is a 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const newOtpValues = pastedData.split('');
      setOtpValues(newOtpValues);
      // Focus the last input
      inputRefs.current[5].focus();
    }
  };
  
  return (
    <div className="w-full space-y-4">
      {verificationStep === 'input' && (
        <>
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={(e) => onChange(e.target.value)}
              className="w-full p-4 text-2xl bg-transparent border-b-2 border-primary focus:outline-none"
              placeholder="Enter your phone number"
              autoFocus
            />
            {phoneError && (
              <p className="text-red-500 text-sm mt-2">{phoneError}</p>
            )}
          </div>
          
          <button
            onClick={handleSendVerificationCode}
            disabled={isLoading}
            className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Phone className="w-5 h-5 mr-2" />
            )}
            Send Verification Code
          </button>
        </>
      )}
      
      {verificationStep === 'verifying' && (
        <>
          <p className="text-center text-gray-600">
            We've sent a 6-digit verification code to <span className="font-semibold">{phone}</span>
          </p>
          
          <div className="flex items-center justify-center space-x-2 my-6">
            {otpValues.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={index === 0 ? handleOtpPaste : undefined}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
              />
            ))}
          </div>
          
          <div className="flex flex-col items-center justify-center space-y-3">
            <button
              onClick={handleVerifyCode}
              disabled={isLoading || otpValues.join('').length !== 6}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-2" />
              )}
              Verify Code
            </button>
            
            <button
              onClick={handleSendVerificationCode}
              disabled={isLoading || timer > 0}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {timer > 0 ? `Resend code in ${timer}s` : 'Resend code'}
            </button>
            
            <button
              onClick={() => setVerificationStep('input')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Change phone number
            </button>
          </div>
        </>
      )}
      
      {verificationStep === 'verified' && (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="bg-green-100 rounded-full p-3 mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-green-600 mb-2">Phone Verified!</h3>
          <p className="text-gray-600 text-center">
            Your phone number has been successfully verified.
          </p>
        </div>
      )}
    </div>
  );
};

export default PhoneVerification;