import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Phone, CheckCircle, Loader, ArrowRight, LogIn } from 'lucide-react';
import gymbrosService from '../../services/gymbros.service';
import useAuthStore from '../../stores/authStore';
import PhoneInput from '../../pages/phoneinput';
import { useTheme } from '../../contexts/ThemeContext';

const PhoneVerification = ({ 
  phone, 
  onChange, 
  onVerified, 
  isLoginFlow = false,
  onExistingAccountFound,
  onContinueWithNewAccount
}) => {
  const { loginWithToken } = useAuthStore();
  const { darkMode } = useTheme();
  const [verificationStep, setVerificationStep] = useState('input'); 
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const [verificationToken, setVerificationToken] = useState(null);
  const [phoneExists, setPhoneExists] = useState(false);
  const [isExistingAccountFlow, setIsExistingAccountFlow] = useState(false);
  const inputRefs = useRef([]);

const handleVerifyCode = async (codeOverride) => {
  const code = codeOverride || otpValues.join('');
  if (code.length !== 6) {
    toast.error('Please enter the full 6-digit code.');
    return;
  }
  setIsLoading(true);

  try {
    const verifyResponse = await gymbrosService.verifyCode(phone, code);

    if (!verifyResponse.success) {
      toast.error(verifyResponse.message || 'Invalid verification code');
      return;
    }

    if (verifyResponse.guestToken) {
      gymbrosService.setGuestToken(verifyResponse.guestToken);
    }

    // STEP 1: Phone code is verified, now check if account/profile exists
    let hasAccount = false;
    let hasProfile = false;
    let userData = null;
    let profileData = null;

    try {
      const profileCheckResponse = await gymbrosService.checkProfileWithVerifiedPhone(
        phone, 
        verifyResponse.token
      );

      console.log('📱 Profile check response:', profileCheckResponse);

      if (profileCheckResponse.success) {
        // Check if profile exists (regardless of user account status)
        if (profileCheckResponse.hasProfile && profileCheckResponse.profile) {
          hasProfile = true;
          profileData = profileCheckResponse.profile;
          
          // If there's also a user account, try to login
          if (profileCheckResponse.user && profileCheckResponse.token) {
            try {
              await loginWithToken(profileCheckResponse.token, profileCheckResponse.user);
              hasAccount = true;
              userData = profileCheckResponse.user;
              
              setVerificationStep('account_exists');
              onVerified(
                true, 
                profileCheckResponse.user, 
                profileCheckResponse.token, 
                { hasProfile: true, profile: profileCheckResponse.profile }
              );
              toast.success('Welcome back! Logged in successfully.');
              return;
            } catch (loginError) {
              console.error('Login error:', loginError);
              toast.error('Login failed. Please try again.');
              return;
            }
          } else {
            // Profile exists but no user account (guest profile)
            setVerificationStep('account_exists');
            onVerified(
              true, 
              null, // No user account, this is guest flow
              profileCheckResponse.token || verifyResponse.token,
              { hasProfile: true, profile: profileCheckResponse.profile }
            );
            toast.success('Welcome back! Profile found.');
            return;
          }
        }
      }
    } catch (profileCheckError) {
      console.warn('⚠️ Profile check failed:', profileCheckError);
      // Continue to show "no account" flow
    }

    // STEP 2: Phone is verified but NO account/profile exists
    // Handle based on the user's intent (login vs signup)
    if (isLoginFlow) {
      // User expects account to exist but none found
      console.log('📱 LOGIN FLOW: No account found - show account not found error');
      setVerificationStep('no_account_login');
      return;
    } else {
      // User is creating new account (signup flow) - this is expected
      console.log('📱 SIGNUP FLOW: No account found - this is expected, proceed with creation');
      setVerificationStep('no_account_signup');
      
      // Store verification token and proceed
      setVerificationToken(verifyResponse.token);
      localStorage.setItem('verificationToken', verifyResponse.token);
      localStorage.setItem('verifiedPhone', phone);
      
      onVerified(true, null, verifyResponse.token, null);
      return;
    }

  } catch (error) {
    console.error('Verification error:', error);
    toast.error('Verification failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  const handleSendVerificationCode = async () => {
    if (!phone || phone.trim() === '') {
      setPhoneError('Please enter your phone number');
      return;
    }
    
    setIsLoading(true);
    setPhoneError('');
    
    try {
      // Check if phone exists FIRST
      console.log('📱 Checking if phone exists:', phone);
      const exists = await gymbrosService.checkPhoneExists(phone);
      setPhoneExists(exists);
      setIsExistingAccountFlow(exists);
      
      console.log('📱 Phone exists result:', exists);
      
      // If phone exists and this isn't already a login flow, ask user intent
      if (exists && !isLoginFlow) {
        console.log('🔄 Phone exists, showing login option');
        toast.info(
          'This phone is already registered',
          {
            description: 'Would you like to log in with this number?',
            action: {
              label: 'Yes, login',
              onClick: () => {
                console.log('👤 User chose to login with existing account');
                onExistingAccountFound && onExistingAccountFound(phone);
              }
            }
          }
        );
        setIsLoading(false);
        return;
      }

      // Send verification code
      console.log('📤 Sending verification code to:', phone);
      const response = await gymbrosService.sendVerificationCode(phone);
      console.log('📤 Send code response:', response);
      
      if (response.success) {
        setVerificationStep('verifying');
        setTimer(30);
        
        if (exists) {
          toast.success('Login code sent!', {
            description: `We sent a login code to verify your identity`
          });
        } else {
          toast.success('Verification code sent!', {
            description: `Check your messages for the 6-digit code`
          });
        }
        
        if (response.token) {
          setVerificationToken(response.token);
        }
      } else {
        setPhoneError(response.message || 'Failed to send verification code');
        toast.error(response.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('❌ Error sending verification code:', error);
      setPhoneError('Failed to send verification code. Please try again.');
      toast.error('Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Timer countdown for resend
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(timer => timer - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (index, value) => {
  // Only allow single digits
  if (value.length > 1) {
    value = value.slice(-1);
  }
  
  if (!/^\d*$/.test(value)) {
    return; // Only allow digits
  }
  
  const newOtpValues = [...otpValues];
  newOtpValues[index] = value;
  setOtpValues(newOtpValues);
  
  // Auto-move to next input if value is entered
  if (value && index < 5) {
    inputRefs.current[index + 1]?.focus();
  }
  
  // Auto-verify when all 6 digits are entered
  if (newOtpValues.join('').length === 6 && newOtpValues.every(v => v !== '')) {
    // Pass the complete code directly instead of relying on state
    setTimeout(() => {
      handleVerifyCode(newOtpValues.join('')); // Pass the complete code here
    }, 100);
  }
};

const renderVerificationStep = () => {
  if (verificationStep === 'no_account_login') {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className="bg-red-500/20 backdrop-blur-sm rounded-full p-4 mb-4 border border-red-400/30">
          <Phone className="w-10 h-10 text-red-300" />
        </div>
        <h3 className="text-lg font-bold text-red-300 mb-2">Account Not Found</h3>
        <p className="text-center text-white mb-2">No account exists for this phone number</p>
        <p className="text-center font-semibold text-white text-lg">{phone}</p>
        
        <div className="mt-4 p-4 bg-blue-500/10 backdrop-blur-sm rounded-lg border border-blue-400/30">
          <p className="text-blue-200 text-sm text-center mb-3">
            Would you like to create a new account instead?
          </p>
          <button
            onClick={() => {
              // Switch to signup flow and continue with account creation
              setVerificationStep('no_account_signup');
              if (verificationToken) {
                localStorage.setItem('verificationToken', verificationToken);
                localStorage.setItem('verifiedPhone', phone);
                onVerified(true, null, verificationToken, null);
              }
            }}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
          >
            Create New Account
          </button>
        </div>
      </div>
    );
  }

  if (verificationStep === 'no_account_signup') {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className="bg-green-500/20 backdrop-blur-sm rounded-full p-4 mb-4 border border-green-400/30">
          <CheckCircle className="w-10 h-10 text-green-300" />
        </div>
        <h3 className="text-lg font-bold text-green-300 mb-2">Phone Verified!</h3>
        <p className="text-center text-white mb-2">Ready to create your GymBros profile</p>
        <p className="text-center font-semibold text-white text-lg">{phone}</p>
        
        <div className="mt-4 p-4 bg-blue-500/10 backdrop-blur-sm rounded-lg border border-blue-400/30">
          <p className="text-blue-200 text-sm text-center mb-3">
            Let's get you set up with a new account!
          </p>
        </div>
      </div>
    );
  }

  if (verificationStep === 'account_exists') {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className="bg-green-500/20 backdrop-blur-sm rounded-full p-4 mb-4 border border-green-400/30">
          <CheckCircle className="w-10 h-10 text-green-300" />
        </div>
        <h3 className="text-lg font-bold text-green-300 mb-2">Welcome Back!</h3>
        <p className="text-center text-white mb-2">Account found and verified</p>
        <p className="text-center font-semibold text-white text-lg">{phone}</p>
        
        <div className="mt-4 p-4 bg-green-500/10 backdrop-blur-sm rounded-lg border border-green-400/30">
          <p className="text-green-200 text-sm text-center">
            Redirecting you to the app...
          </p>
        </div>
      </div>
    );
  }

  return null;
};


  const handleOtpKeyDown = (index, e) => {
    // Handle navigation
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
  
  // Enhanced paste handler with mobile support
  const handleOtpPaste = (e) => {
    e.preventDefault();
    let pastedData = '';
    
    // Handle different paste sources
    if (e.clipboardData && e.clipboardData.getData) {
      pastedData = e.clipboardData.getData('text');
    } else if (window.clipboardData && window.clipboardData.getData) {
      pastedData = window.clipboardData.getData('Text');
    }
    
    // Clean the pasted data
    pastedData = pastedData.trim().replace(/\s+/g, '').replace(/\D/g, '');
    
    // Check if pasted content is exactly 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const newOtpValues = pastedData.split('');
      setOtpValues(newOtpValues);
      
      // Focus the last input
      setTimeout(() => {
        inputRefs.current[5]?.focus();
      }, 10);
      
      // Auto-verify after a short delay
      setTimeout(() => {
        handleVerifyCode();
      }, 300);
      
      toast.success('Code pasted successfully!');
    } else if (pastedData.length > 0) {
      // If it's not exactly 6 digits, still try to use what we can
      const digits = pastedData.slice(0, 6).padEnd(6, '').split('');
      const newOtpValues = digits.map(d => /^\d$/.test(d) ? d : '');
      setOtpValues(newOtpValues);
      
      // Focus the next empty input
      const nextEmptyIndex = newOtpValues.findIndex(v => v === '');
      if (nextEmptyIndex !== -1) {
        setTimeout(() => {
          inputRefs.current[nextEmptyIndex]?.focus();
        }, 10);
      }
    }
  };

  // Add support for iOS SMS auto-fill
  const handleOtpInput = (index, e) => {
    const inputType = e.nativeEvent.inputType;
    const data = e.nativeEvent.data;
    
    // Handle iOS SMS auto-fill
    if (inputType === 'insertCompositionText' || inputType === 'insertText') {
      if (data && /^\d{6}$/.test(data)) {
        e.preventDefault();
        const newOtpValues = data.split('');
        setOtpValues(newOtpValues);
        
        // Focus the last input
        setTimeout(() => {
          inputRefs.current[5]?.focus();
        }, 10);
        
        // Auto-verify
        setTimeout(() => {
          handleVerifyCode();
        }, 300);
        return;
      }
    }
    
    // Regular input handling
    handleOtpChange(index, e.target.value);
  };

  const handleContinueAsNewAccount = () => {
    // User has chosen to continue creating a new account despite having an existing one
    if (onContinueWithNewAccount) {
      onContinueWithNewAccount(phone, verificationToken);
    }
  };

  // Theme-aware input styles
  const getInputStyles = () => {
    if (darkMode) {
      return "bg-gray-800 border-gray-600 text-white focus:border-blue-400 focus:ring-blue-400/20";
    } else {
      return "bg-white border-gray-300 text-black focus:border-blue-500 focus:ring-blue-500/20";
    }
  };

  const getOtpInputStyles = () => {
    if (darkMode) {
      return "bg-gray-800 border-gray-600 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20";
    } else {
      return "bg-white border-gray-300 text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
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
                if (phone && phone.trim() && !isValid) {
                  setPhoneError('Please enter a valid phone number');
                } else {
                  setPhoneError('');
                }
              }}
              autoFocus
              className={`w-full ${getInputStyles()}`}
              darkMode={darkMode}
            />
            {phoneError && (
              <p className="text-red-500 text-sm mt-2">{phoneError}</p>
            )}
          </div>
          
          <button
            onClick={handleSendVerificationCode}
            disabled={isLoading || phoneError}
            className={`w-full mt-4 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
              darkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
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
          <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            We've sent a 6-digit verification code to <span className="font-semibold">{phone}</span>
          </p>
          
          {/* Enhanced OTP Input Section */}
          <div className="flex items-center justify-center space-x-2 my-6">
            {otpValues.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpInput(index, e)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={index === 0 ? handleOtpPaste : undefined}
                autoComplete={index === 0 ? "one-time-code" : "off"}
                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-md transition-all duration-200 ${getOtpInputStyles()}`}
                style={{
                  // Ensure proper mobile support
                  fontSize: '24px',
                  lineHeight: '1',
                }}
              />
            ))}
          </div>
          
          
          <div className="flex flex-col items-center justify-center space-y-3">
            <button
              onClick={handleVerifyCode}
              disabled={isLoading || otpValues.join('').length !== 6}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
                darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
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
              className={`font-medium text-sm transition-colors ${
                darkMode 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-blue-600 hover:text-blue-800'
              } ${(isLoading || timer > 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {timer > 0 ? `Resend code in ${timer}s` : 'Resend code'}
            </button>
            
            <button
              onClick={() => setVerificationStep('input')}
              className={`font-medium text-sm transition-colors ${
                darkMode 
                  ? 'text-gray-400 hover:text-gray-300' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Change phone number
            </button>
          </div>
        </>
      )}

      {(verificationStep === 'account_exists' || verificationStep === 'no_account') && renderVerificationStep()}
      
       {verificationStep === 'verified' && (
      <div className="flex flex-col items-center justify-center py-4">
        <div className="bg-green-100 rounded-full p-3 mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-600 mb-2">Phone Verified!</h3>
        <p className={`text-center mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Your phone number has been successfully verified.
        </p>
      </div>
    )}
      
      {phoneExists && verificationStep === 'verified' && !isLoginFlow && (
        <div className={`p-4 rounded-lg border ${
          darkMode ? 'bg-yellow-900/20 border-yellow-600/30' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <h4 className={`font-medium mb-2 ${
            darkMode ? 'text-yellow-400' : 'text-yellow-800'
          }`}>
            Account Already Exists
          </h4>
          <p className={`text-sm mb-3 ${
            darkMode ? 'text-yellow-300' : 'text-yellow-700'
          }`}>
            This phone number is already associated with an account. Would you like to continue creating a new account or log in instead?
          </p>
          <div className="flex space-x-2">
            <button
              onClick={handleContinueAsNewAccount}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Create New Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneVerification;