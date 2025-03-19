import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Dumbbell, ChevronRight, ChevronLeft, Moon, Sun
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../stores/authStore';
import { buildSteps } from './buildSteps';
import gymbrosService from '../../services/gymbros.service';

const GymBrosSetup = ({ onProfileCreated }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    age: '',
    gender: '',
    height: '',
    heightUnit: 'cm',
    interests: [],
    work: '',
    studies: '',
    phone: '',
    workoutTypes: [],
    experienceLevel: '',
    preferredTime: '',
    goals: '',
    location: {
      lat: null,
      lng: null,
      address: '',
    },
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState(null);
  const [authMode, setAuthMode] = useState('signup'); // 'signup' or 'login'
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const storedDarkMode = localStorage.getItem('gymBrosDarkMode') === 'true';
    setDarkMode(storedDarkMode);
  }, []);

  // If user is authenticated, initialize profile data with user info
  useEffect(() => {
    if (user) {
      console.log('Initializing profile data with user info:', user);
      const userData = user.user || user;
      
      // Pre-fill data if user is logged in
      setProfileData(prev => ({
        ...prev,
        name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : prev.name,
        phone: userData.phone || prev.phone,
      }));
      
      // If user has a phone number, consider it verified
      if (userData.phone) {
        setIsPhoneVerified(true);
        console.log('User already has a phone number, marking as verified:', userData.phone);
      }
    }
  }, [user]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('gymBrosDarkMode', newMode.toString());
  };

  // Handler functions for form inputs
  const handleChange = (field, value) => {
    if (field === 'location') {
      setProfileData(prev => ({
        ...prev,
        location: { ...prev.location, ...value },
      }));
    } else {
      setProfileData(prev => ({ ...prev, [field]: value }));
    }
  };
  
  const handleWorkoutTypeToggle = (type) => {
    setProfileData(prev => {
      if (prev.workoutTypes.includes(type)) {
        return {
          ...prev,
          workoutTypes: prev.workoutTypes.filter(t => t !== type),
        };
      } else {
        return {
          ...prev,
          workoutTypes: [...prev.workoutTypes, type],
        };
      }
    });
  };

  const handleInterestToggle = (interest) => {
    setProfileData(prev => {
      if (prev.interests.includes(interest)) {
        return {
          ...prev,
          interests: prev.interests.filter(i => i !== interest),
        };
      } else {
        return {
          ...prev,
          interests: [...prev.interests, interest],
        };
      }
    });
  };

  const handlePhoneChange = (phone) => {
    // Don't allow changing the phone if the user is logged in and has a phone
    if (isAuthenticated && user && (user.phone || (user.user && user.user.phone))) {
      toast.error("You can't change your phone number when logged in");
      return;
    }
    
    setProfileData(prev => ({ ...prev, phone }));
    // Reset verification status when phone number changes
    setIsPhoneVerified(false);
    setVerificationToken(null);
  };
  
  const handleLoginWithPhone = () => {
    setAuthMode('login');
    setShowPhoneLogin(true);
    
    // Go to phone verification step
    const phoneVerificationIndex = steps.findIndex(step => step.id === 'phone');
    if (phoneVerificationIndex !== -1) {
      setDirection(1);
      setCurrentStep(phoneVerificationIndex);
    }
  };
  
  const handleExistingAccountFound = (phone) => {
    // Set auth mode to login
    setAuthMode('login');
    
    // Go directly to phone verification step for login
    setShowPhoneLogin(true);
    
    // Find the phone verification step index
    const phoneVerificationIndex = steps.findIndex(step => step.id === 'phone');
    if (phoneVerificationIndex !== -1) {
      setCurrentStep(phoneVerificationIndex);
    }
    
    toast.info(
      'Account found with this phone number',
      { description: 'Please verify to log in' }
    );
  };
  
  const handleContinueWithNewAccount = (phone, token) => {
    setAuthMode('signup');
    setShowPhoneLogin(false); // Hide the login button for new accounts
    setVerificationToken(token);
    setIsPhoneVerified(true);
    goToNextStep();
  };

  const handlePhoneVerified = async (verified, userData = null, token = null, profileData = null) => {
    setIsPhoneVerified(verified);
    
    if (token) {
      setVerificationToken(token);
    }
    
    // If we received user data, we've successfully logged in
    if (userData) {
      // Handle successful login
      toast.success('Logged in successfully!');
      
      // Update profile data with user information
      if (userData.firstName) {
        setProfileData(prev => ({
          ...prev,
          name: userData.firstName + (userData.lastName ? ' ' + userData.lastName : '')
        }));
      }
      
      // If we also received profile data, the user already has a GymBros profile
      if (profileData && profileData.hasProfile) {
        // User already has a profile, notify parent component
        toast.success('Found your existing profile!');
        onProfileCreated(profileData.profile);
        return; // Exit early as we're done
      }
    
      try {
        // Use the special function for phone verification flow instead of the regular endpoint
        const verifiedPhone = profileData?.verifiedPhone || userData.phone;
        if (verifiedPhone && token) {
          console.log('Checking profile with verified phone:', verifiedPhone);
          const gymBrosProfile = await gymbrosService.checkProfileWithVerifiedPhone(verifiedPhone, token);
          
          if (gymBrosProfile.hasProfile) {
            // User has a profile, notify parent component
            toast.success('Found your existing profile!');
            onProfileCreated(gymBrosProfile.profile);
            return; // Exit early as we're done
          }
        } else {
          console.warn('Missing verified phone or token for profile check');
        }
      } catch (error) {
        console.error('Error checking for GymBros profile:', error);
        // Continue with setup flow if we couldn't check for profile
      }
      
      // No existing profile, move to next step in setup
      goToNextStep();
    }
  };
  
  const handleSubmit = async () => {
    if (!isPhoneVerified) {
      toast.error('Please verify your phone number before proceeding.');
      return;
    }
  
    setLoading(true);
    try {
      const payload = {
        ...profileData,
        verificationToken, // Include the verification token
      };
  
      // If we're in login mode and have a verification token, check for existing profile
      if (authMode === 'login' && verificationToken) {
        try {
          // Try to fetch existing profile
          const profileResponse = await gymbrosService.getGymBrosProfile();
          
          if (profileResponse.hasProfile) {
            // User already has a profile, notify parent component
            toast.success('Profile found!');
            onProfileCreated(profileResponse.profile);
            return; // Exit early as we're done
          }
        } catch (profileError) {
          console.error('Error checking for profile:', profileError);
          // Continue with profile creation if profile check fails
        }
      }

      // Create or update profile
      const response = await gymbrosService.createOrUpdateProfile(payload);
  
      toast.success('Profile created successfully!');
      onProfileCreated(response);
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const goToNextStep = () => {
    const currentStepConfig = steps[currentStep];

    // Validate current step
    if (!currentStepConfig.isValid()) {
      toast.error(`Please complete the "${currentStepConfig.title}" step`);
      return;
    }

    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else if (currentStep === steps.length - 1) {
      handleSubmit();
    }
  };

  // Use the buildSteps function to create the steps
  const steps = buildSteps({
    isAuthenticated,
    user,
    profileData,
    authMode,
    showPhoneLogin,
    isPhoneVerified,
    handleChange,
    handleLoginWithPhone,
    handlePhoneChange,
    handlePhoneVerified,
    handleExistingAccountFound,
    handleContinueWithNewAccount,
    handleInterestToggle,
    handleWorkoutTypeToggle,
    goToNextStep,
  });

  // Add keyboard event listener for Enter key
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if Enter key was pressed and not in a form input that should submit normally
      if (e.key === 'Enter' && 
          e.target.tagName !== 'TEXTAREA' && 
          !e.target.matches('input[type="text"], input[type="number"]')) {
        e.preventDefault();
        goToNextStep();
      }
    };
  
    // Add event listener for keydown
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentStep]);

  // Update progress bar based on current step
  useEffect(() => {
    setProgress(((currentStep + 1) / steps.length) * 100);
  }, [currentStep, steps.length]);

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
      
      // If we're going back to the first step, ensure the login button is shown if it was previously shown
      if (currentStep - 1 === 0 && !isAuthenticated) {
        setShowPhoneLogin(false);
      }
    }
  };



  // Animation variants for smoother transitions
  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  const darkModeClasses = {
    bg: darkMode ? 'bg-gray-900' : 'bg-white',
    text: darkMode ? 'text-gray-200' : 'text-gray-900',
    border: darkMode ? 'border-gray-700' : 'border-gray-300',
    button: darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    buttonActive: darkMode ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white',
  };

  return (
    <div className={`${darkModeClasses.bg} ${darkModeClasses.text} max-w-md mx-auto p-4 flex flex-col h-[80vh] transition-colors duration-300`}>
      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out bg-blue-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full flex-1 flex flex-col"
          >
            {/* Step title and subtitle */}
            <div className="mb-4">
              <div className="flex items-center mb-1">
                {steps[currentStep].icon}
                <h2 className="text-xl font-bold ml-2">{steps[currentStep].title}</h2>
              </div>
              <p className="text-sm text-gray-500">{steps[currentStep].subtitle}</p>
            </div>

            {/* Step component */}
            <div className="flex-1 flex items-center justify-center">
              {steps[currentStep].component}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={goToPrevStep}
          disabled={currentStep === 0}
          className={`p-2 rounded-full ${darkModeClasses.button} transition-all ${currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ChevronLeft size={24} />
        </button>

        {/* Dark Mode Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-blue-900'} transition-colors`}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button
          onClick={goToNextStep}
          className={`p-2 rounded-full ${darkModeClasses.buttonActive} transition-all`}
          disabled={loading}
        >
          {loading ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <ChevronRight size={24} />
          )}
        </button>
      </div>
    </div>
  );
};

export default GymBrosSetup;