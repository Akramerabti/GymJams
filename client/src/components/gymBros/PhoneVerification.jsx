import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Phone, CheckCircle, Loader, ArrowRight, LogIn } from 'lucide-react';
import api from '../../services/api';
import gymbrosService from '../../services/gymbros.service';
import useAuthStore from '../../stores/authStore';
import PhoneInput from '../../pages/phoneinput';
import { removeCountryCode, detectCountryFromPhone } from '../../utils/phoneUtils'; // Add this import

const PhoneVerification = ({ 
  phone, 
  onChange, 
  onVerified, 
  isLoginFlow = false,
  onExistingAccountFound,
  onContinueWithNewAccount
}) => {
  const { loginWithToken } = useAuthStore();
  const [verificationStep, setVerificationStep] = useState('input'); // 'input', 'verifying', 'verified'
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const [verificationToken, setVerificationToken] = useState(null);
  const [phoneExists, setPhoneExists] = useState(false);
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



      const exists = await gymbrosService.checkPhoneExists(phone);
      console.log('Phone exists check:', exists);
      setPhoneExists(exists);
      
      if (exists && !isLoginFlow) {
        // If this is not explicitly a login flow and phone exists, alert the user
        toast.info(
          'This phone is already registered',
          {
            description: 'Would you like to log in with this number?',
            action: {
              label: 'Yes, login',
              onClick: () => onExistingAccountFound && onExistingAccountFound(phone)
            }
          }
        );
        setIsLoading(false);
        return;
      }
      
      // Send verification code
      const response = await gymbrosService.sendVerificationCode(phone);
      
      if (response.success) {
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
        throw new Error(response.message || 'Failed to send verification code');
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
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First verify the phone number with the code
      const response = await gymbrosService.verifyCode(phone, verificationCode);
      console.log('Verification response:', response);
      
      if (response.success && response.token) {
        setVerificationToken(response.token);
        setVerificationStep('verified');
        
        // Store for potential use in other components
        localStorage.setItem('verifiedPhone', phone);
        localStorage.setItem('verificationToken', response.token);
        
        // If this is a login flow or the phone exists, check profile directly
        if (isLoginFlow || phoneExists) {
          try {
            console.log('Checking profile with verified phone in one step');
            const profileData = await gymbrosService.checkProfileWithVerifiedPhone(
              phone, 
              response.token
            );
            
            console.log('Profile check result:', profileData);
            
            if (profileData.success) {
              // Check if we have a user account
              if (profileData.user) {
                // We have both user and potentially a profile
                await loginWithToken(response.token, profileData.user);
                toast.success('Logged in successfully!');
                
                // Notify parent component of successful verification and login
                onVerified && onVerified(
                  true, 
                  profileData.user, 
                  profileData.token, 
                  profileData
                );
              } else if (profileData.profile) {
              
                onVerified && onVerified(
                  true,
                  null, // No user yet
                  response.token,
                  {
                    hasProfile: true,
                    profile: profileData.profile,
                    needsRegistration: true
                  }
                );
              } else {
                // Neither user nor profile found - new signup
                toast.info('Phone verified! Please create your profile.');
                onVerified && onVerified(true, null, response.token);
              }
            } else {
              // Profile check failed but phone verification succeeded
              toast.error(profileData.message || 'Failed to find user with this phone number');
              onVerified && onVerified(true, null, response.token);
            }
          } catch (profileError) {
            console.error('Error checking profile with verified phone:', profileError);
            toast.error('Error verifying your profile. Please try again.');
            
            // Still mark as verified since the phone verification worked
            onVerified && onVerified(true, null, response.token);
          }
        } else {
          // For new account creation, just mark as verified
          onVerified && onVerified(true, null, response.token);
        }
      } else {
        toast.error(response.message || 'Invalid verification code');
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
    
    // If we've filled the last digit, attempt verification automatically
    if (value && index === 5) {
      const allFilled = newOtpValues.every(v => v !== '');
      if (allFilled) {
        setTimeout(() => handleVerifyCode(), 300);
      }
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
      } else {
        // Clear current input
        const newOtpValues = [...otpValues];
        newOtpValues[index] = '';
        setOtpValues(newOtpValues);
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
      
      // Auto-verify after a short delay
      setTimeout(() => handleVerifyCode(), 300);
    }
  };

  const handleContinueAsNewAccount = () => {
    // User has chosen to continue creating a new account despite having an existing one
    if (onContinueWithNewAccount) {
      onContinueWithNewAccount(phone, verificationToken);
    }
  };
  
  return (
    <div className="w-full space-y-4">
      {verificationStep === 'input' && (
        <>
          <div className="relative">
            <PhoneInput
              value={phone}
              onChange={onChange}
              onValidChange={(isValid) => {
                if (!isValid) {
                  setPhoneError('Please enter a valid phone number');
                } else {
                  setPhoneError('');
                }
              }}
              autoFocus
              className="w-full"
            />
            {phoneError && (
              <p className="text-red-500 text-sm mt-2">{phoneError}</p>
            )}
          </div>
          
          <button
            onClick={handleSendVerificationCode}
            disabled={isLoading || phoneError}
            className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Phone className="w-5 h-5 mr-2" />
            )}
            {isLoginFlow ? 'Login with Phone Number' : 'Verify Phone Number'}
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
          <p className="text-gray-600 text-center mb-4">
            Your phone number has been successfully verified.
          </p>
          
          {phoneExists && !isLoginFlow && (
            <div className="w-full mt-4 space-y-3">
              <button
                onClick={handleContinueAsNewAccount}
                className="w-full py-3 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Continue with New Account
              </button>
              
              <button
                onClick={() => onExistingAccountFound && onExistingAccountFound(phone)}
                className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Log In to Existing Account
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PhoneVerification;