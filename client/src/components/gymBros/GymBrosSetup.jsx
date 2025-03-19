import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Dumbbell, ChevronRight, ChevronLeft, CheckCircle, Award, Clock, 
  MapPin, Moon, Sun, Target, Phone, LogIn, User
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../stores/authStore';
import ImageUploader from './ImageUploader';
import LocationPicker from './LocationPicker';
import PhoneVerification from './PhoneVerification';
import gymbrosService from '../../services/gymbros.service';

const workoutTypes = [
  'Strength Training', 'Cardio', 'HIIT', 'CrossFit', 'Bodybuilding',
  'Yoga', 'Pilates', 'Calisthenics', 'Powerlifting', 'Olympic Lifting',
  'Functional Training', 'Group Classes'
];

const experienceLevels = ['Beginner', 'Intermediate', 'Advanced'];
const timePreferences = ['Morning', 'Afternoon', 'Evening', 'Late Night', 'Weekends Only', 'Flexible'];
const genders = ['Male', 'Female', 'Other'];
const heightUnits = ['cm', 'inches'];

const interests = [
  'Reading', 'Traveling', 'Cooking', 'Hiking', 'Cycling', 'Swimming',
  'Painting', 'Photography', 'Music', 'Dancing', 'Gaming', 'Writing',
  'Fitness', 'Yoga', 'Meditation', 'Movies', 'Theater', 'Art', 'Nature',
  'Technology', 'Fashion', 'Foodie', 'Wine Tasting', 'Coffee Enthusiast'
  // Shortened for brevity
];

const GymBrosSetup = ({ onProfileCreated }) => {
  const { user, login, isAuthenticated } = useAuthStore();
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
  const [showPhoneLogin, setShowPhoneLogin] = useState(true);
  const [phoneStepIndex, setPhoneStepIndex] = useState(1); // Default index of phone step

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('gymBrosDarkMode', newMode.toString());
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
    setProfileData(prev => ({ ...prev, phone }));
    // Reset verification status when phone number changes
    setIsPhoneVerified(false);
    setVerificationToken(null);
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
      
      // No profile data, check if the user has a GymBros profile
      try {
        const gymBrosProfile = await gymbrosService.getGymBrosProfile();
        
        if (gymBrosProfile.hasProfile) {
          // User has a profile, notify parent component
          toast.success('Found your existing profile!');
          onProfileCreated(gymBrosProfile.profile);
          return; // Exit early as we're done
        }
      } catch (error) {
        console.error('Error checking for GymBros profile:', error);
        // Continue with setup flow if we couldn't check for profile
      }
      
      // No existing profile, move to next step in setup
      goToNextStep();
    }
  };

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

  const handleExistingAccountFound = (phone) => {
    // Set auth mode to login
    setAuthMode('login');
    
    // Go directly to phone verification step for login
    setShowPhoneLogin(true);
    
    // Go to phone verification step
    if (phoneStepIndex !== -1) {
      setDirection(1);
      setCurrentStep(phoneStepIndex);
    }
    
    toast.info(
      'Account found with this phone number',
      { description: 'Please verify to log in' }
    );
  };

  const handleLoginWithPhone = () => {
    setAuthMode('login');
    setShowPhoneLogin(true);
    
    // Go to phone verification step
    if (phoneStepIndex !== -1) {
      setDirection(1);
      setCurrentStep(phoneStepIndex);
    }
  };
  
  const handleContinueWithNewAccount = (phone, token) => {
    setAuthMode('signup');
    setShowPhoneLogin(false); // Hide the login button for new accounts
    setVerificationToken(token);
    setIsPhoneVerified(true);
    goToNextStep();
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
  
  const buildSteps = () => {
    let stepsList = [
      {
        id: 'name',
        title: "What's your name?",
        subtitle: "Let's start with the basics",
        icon: <User size={24} />,
        isValid: () => profileData.name.trim().length > 0,
        component: (
          <div className="w-full space-y-4">
            <input 
              type="text" 
              value={profileData.name} 
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full p-4 text-2xl bg-transparent border-b-2 border-primary focus:outline-none" 
              placeholder="Enter your name"
              autoFocus
            />
            
            {!isAuthenticated && (authMode === 'login' || showPhoneLogin) && (
              <button
                onClick={handleLoginWithPhone}
                className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Log in with Phone Number
              </button>
            )}
          </div>
        )
      },
      {
        id: 'phone',
        title: authMode === 'login' ? "Log in with your phone" : "What's your phone number?",
        subtitle: authMode === 'login' ? 
          "We'll verify your identity" : 
          "We'll send a verification code to this number",
        icon: <Phone size={24} />,
        isValid: () => isPhoneVerified,
        component: (
          <PhoneVerification
            phone={profileData.phone}
            onChange={handlePhoneChange}
            onVerified={handlePhoneVerified}
            isLoginFlow={authMode === 'login'}
            onExistingAccountFound={handleExistingAccountFound}
            onContinueWithNewAccount={handleContinueWithNewAccount}
          />
        )
      },
      // Only include these steps for signup
      ...(authMode === 'signup' ? [
        {
          id: 'age',
          title: "How old are you?",
          subtitle: "Age helps find compatible gym partners",
          icon: <CheckCircle size={24} />,
          isValid: () => profileData.age >= 18 && profileData.age < 100,
          component: (
            <div className="w-full">
              <input 
                type="number" 
                value={profileData.age} 
                onChange={(e) => handleChange('age', e.target.value)}
                className="w-full p-4 text-2xl bg-transparent border-b-2 border-primary focus:outline-none" 
                placeholder="Enter your age"
                min="18"
                max="99"
                autoFocus
              />
              <p className="text-sm mt-2 text-gray-500">Must be 18 or older</p>
            </div>
          )
        },
        {
          id: 'gender',
          title: "What's your gender?",
          subtitle: "This helps us tailor your experience",
          icon: <CheckCircle size={24} />,
          isValid: () => profileData.gender !== '',
          component: (
            <div className="w-full">
              <div className="flex flex-col gap-3">
                {genders.map(gender => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => handleChange('gender', gender)}
                    className={`px-6 py-4 rounded-xl text-lg flex items-center transition-all ${
                      profileData.gender === gender
                        ? 'bg-primary text-white bg-blue-700 scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>
          )
        },
        {
          id: 'height',
          title: "What's your height?",
          subtitle: "This helps us tailor your experience",
          icon: <CheckCircle size={24} />,
          isValid: () => profileData.height !== '',
          component: (
            <div className="w-full">
              <div className="flex flex-col gap-3">
                <input 
                  type="number" 
                  value={profileData.height} 
                  onChange={(e) => handleChange('height', e.target.value)}
                  className="w-full p-4 text-2xl bg-transparent border-b-2 border-primary focus:outline-none" 
                  placeholder="Enter your height"
                  autoFocus
                />
                <div className="flex gap-2">
                  {heightUnits.map(unit => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => handleChange('heightUnit', unit)}
                      className={`px-4 py-2 rounded-xl text-md flex items-center transition-all ${
                        profileData.heightUnit === unit
                          ? 'bg-primary text-white bg-blue-700 scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        },
        {
          id: 'interests',
          title: "What are your interests?",
          subtitle: "This helps us tailor your experience",
          icon: <CheckCircle size={24} />,
          isValid: () => profileData.interests.length > 0,
          component: (
            <div className="w-full">
              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-2">
                {interests.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-4 py-3 rounded-full text-sm font-medium transition-all ${
                      profileData.interests.includes(interest)
                        ? 'bg-primary text-white bg-blue-700 scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              <p className="text-sm mt-4 text-gray-500">
                Selected: {profileData.interests.length > 0 ? 
                  profileData.interests.join(', ') : 
                  'None yet - please select at least one'}
              </p>
            </div>
          )
        },
        {
          id: 'work',
          title: "What's your work?",
          subtitle: "This helps us tailor your experience",
          icon: <CheckCircle size={24} />,
          isValid: () => true, // Optional
          component: (
            <div className="w-full">
              <input 
                type="text" 
                value={profileData.work} 
                onChange={(e) => handleChange('work', e.target.value)}
                className="w-full p-4 text-2xl bg-transparent border-b-2 border-primary focus:outline-none" 
                placeholder="Enter your work"
                autoFocus
              />
            </div>
          )
        },
        {
          id: 'studies',
          title: "What are you studying?",
          subtitle: "This helps us tailor your experience",
          icon: <CheckCircle size={24} />,
          isValid: () => true, // Optional
          component: (
            <div className="w-full">
              <input 
                type="text" 
                value={profileData.studies} 
                onChange={(e) => handleChange('studies', e.target.value)}
                className="w-full p-4 text-2xl bg-transparent border-b-2 border-primary focus:outline-none" 
                placeholder="Enter your studies"
                autoFocus
              />
            </div>
          )
        },
        {
          id: 'images',
          title: "Show off your gains",
          subtitle: "Upload 2-6 images (16:9 ratio)",
          icon: <CheckCircle size={24} />,
          isValid: () => profileData.images.length >= 2,
          component: (
            <ImageUploader 
              images={profileData.images}
              onImagesChange={(images) => handleChange('images', images)}
            />
          )
        },
        {
          id: 'workoutTypes',
          title: "What workouts do you enjoy?",
          subtitle: "Select all that apply",
          icon: <Dumbbell size={24} />,
          isValid: () => profileData.workoutTypes.length > 0,
          component: (
            <div className="w-full">
              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-2">
                {workoutTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleWorkoutTypeToggle(type)}
                    className={`px-4 py-3 rounded-full text-sm font-medium transition-all ${
                      profileData.workoutTypes.includes(type)
                        ? 'bg-primary text-white bg-blue-700 scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <p className="text-sm mt-4 text-gray-500">
                Selected: {profileData.workoutTypes.length > 0 ? 
                  profileData.workoutTypes.join(', ') : 
                  'None yet - please select at least one'}
              </p>
            </div>
          )
        },
        {
          id: 'experienceLevel',
          title: "What's your experience level?",
          subtitle: "Be honest - we'll match you appropriately",
          icon: <Award size={24} />,
          isValid: () => profileData.experienceLevel !== '',
          component: (
            <div className="w-full">
              <div className="flex flex-col gap-3">
                {experienceLevels.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleChange('experienceLevel', level)}
                    className={`px-6 py-4 rounded-xl text-lg flex items-center transition-all ${
                      profileData.experienceLevel === level
                        ? 'bg-primary text-white bg-blue-700 scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Award 
                      size={20} 
                      className={`mr-3 ${profileData.experienceLevel === level ? 'text-white' : 'text-gray-500'}`} 
                    />
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )
        },
        {
          id: 'preferredTime',
          title: "When do you prefer to work out?",
          subtitle: "Find partners with similar schedules",
          icon: <Clock size={24} />,
          isValid: () => profileData.preferredTime !== '',
          component: (
            <div className="w-full">
              <div className="grid grid-cols-2 gap-3">
                {timePreferences.map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleChange('preferredTime', time)}
                    className={`px-4 py-4 rounded-xl text-md flex items-center justify-center transition-all ${
                      profileData.preferredTime === time
                        ? 'bg-primary text-white bg-blue-700 scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Clock 
                      size={16} 
                      className={`mr-2 ${profileData.preferredTime === time ? 'text-white' : 'text-gray-500'}`} 
                    />
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )
        },
        {
          id: 'goals',
          title: "What are your fitness goals?",
          subtitle: "Find partners with similar ambitions",
          icon: <Target size={24} />,
          isValid: () => true, // Optional
          component: (
            <div className="w-full">
              <input 
                type="text" 
                value={profileData.goals} 
                onChange={(e) => handleChange('goals', e.target.value)}
                className="w-full p-4 text-2xl bg-transparent border-b-2 border-primary focus:outline-none" 
                placeholder="Enter your goals"
                autoFocus
              />
            </div>
          )
        },
        {
          id: 'location',
          title: "Where are you located?",
          subtitle: "Find gym partners nearby",
          icon: <MapPin size={24} />,
          isValid: () => profileData.location.lat !== null && profileData.location.lng !== null,
          component: (
            <LocationPicker 
              location={profileData.location}
              onLocationChange={(location) => handleChange('location', location)}
            />
          )
        },
      ] : [])
    ];

    const phoneIndex = stepsList.findIndex(step => step.id === 'phone');
    if (phoneIndex !== -1) {
      setPhoneStepIndex(phoneIndex);
    }

    return stepsList;
  };
  
const steps = buildSteps();

useEffect(() => {
  if (user?.user) {
    // Pre-fill data from logged-in user
    const userData = user.user;
    setProfileData(prev => ({
      ...prev,
      name: userData.firstName || '',
      phone: userData.phone || '',
      location: {
        lat: userData.location?.lat || null,
        lng: userData.location?.lng || null,
        address: userData.location?.address || '',
      },
    }));

    // If the user has a phone number, automatically go to the phone verification step
    if (userData.phone && userData.phone.trim() !== '') {
      const phoneIndex = steps.findIndex(step => step.id === 'phone');
      if (phoneIndex !== -1 && currentStep !== phoneIndex) {
        // Use a timeout to ensure this occurs after initial render
        setTimeout(() => {
          setDirection(1);
          setCurrentStep(phoneIndex);
        }, 300);
      }
    }
  }
}, [user, steps]);

useEffect(() => {
  // If phone number is provided and not empty, and we're in input step
  if (profileData.phone && profileData.phone.trim() !== '' && verificationStep === 'input') {
    // Validate phone number first (simplified check)
    const isValidPhone = /^\+\d{10,15}$/.test(profileData.phone);
    
    if (isValidPhone) {
      // Automatically send verification code
      handleSendVerificationCode();
    }
  }
}, [profileData.phone, verificationStep]);

useEffect(() => {
  setProgress(((currentStep + 1) / steps.length) * 100);
}, [currentStep, steps.length]);

const goToNextStep = () => {
  // In login mode, and if we've verified the phone, we've successfully logged in
  if (authMode === 'login' && isPhoneVerified && currentStep === phoneStepIndex) {
    return; // This is now handled in handlePhoneVerified
  }

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

const goToPrevStep = () => {
  if (currentStep > 0) {
    setDirection(-1);
    setCurrentStep(currentStep - 1);
    
    // If we're going back to the first step, ensure the login button is shown if it was previously shown
    if (currentStep - 1 === 0 && authMode === 'login') {
      setShowPhoneLogin(true);
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
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
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
          className={`p-2 rounded-full ${darkModeClasses.button} transition-all`}
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
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

export default GymBrosSetup;