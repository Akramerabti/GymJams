import React from 'react';
import { 
  Dumbbell, CheckCircle, Award, Clock, 
  MapPin, Target, Phone, LogIn, User, Camera, Heart, Zap, Users
} from 'lucide-react';
import PhoneVerification from './PhoneVerification';
import ImageUploader from './ImageUploader';
import LocationPicker from './LocationPicker';
import AutoLocationStep from './AutoLocationStep';
import NearbyGymsPreview from './NearbyGymsPreview';
import GymSelector from './GymSelector';
import HeightPicker from './../ui/HeightPicker';
import { useScreenType } from '../../hooks/useScreenType';
import { useTheme } from '../../contexts/ThemeContext';

// Constants for the form options
const workoutTypes = [
  'Strength Training', 'Cardio', 'HIIT', 'CrossFit', 'Bodybuilding',
  'Yoga', 'Pilates', 'Calisthenics', 'Powerlifting', 'Olympic Lifting',
  'Functional Training', 'Group Classes'
];

const experienceLevels = ['Beginner', 'Intermediate', 'Advanced'];
const timePreferences = ['Morning', 'Afternoon', 'Evening', 'Late Night', 'Weekends Only', 'Flexible'];
const genders = ['Male', 'Female', 'Other'];

const interests = [
  'Reading', 'Traveling', 'Cooking', 'Hiking', 'Cycling', 'Swimming',
  'Painting', 'Photography', 'Music', 'Dancing', 'Gaming', 'Writing',
  'Fitness', 'Yoga', 'Meditation', 'Movies', 'Theater', 'Art', 'Nature',
  'Technology', 'Fashion', 'Foodie', 'Wine Tasting', 'Coffee Enthusiast'
];

// Theme-aware input component
const ThemedInput = ({ type = "text", value, onChange, onBlur, placeholder, className = "", ...props }) => {
  const { darkMode } = useTheme();
  
  const baseStyles = "w-full border-2 rounded-xl transition-all duration-300 focus:outline-none";
  const themeStyles = darkMode 
    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:bg-gray-800" 
    : "bg-white border-gray-300 text-black placeholder-gray-500 focus:border-blue-500 focus:bg-white";
  
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      className={`${baseStyles} ${themeStyles} ${className}`}
      {...props}
    />
  );
};

// Theme-aware select component
const ThemedSelect = ({ value, onChange, options, placeholder, className = "", ...props }) => {
  const { darkMode } = useTheme();
  
  const baseStyles = "w-full border-2 rounded-xl transition-all duration-300 focus:outline-none";
  const themeStyles = darkMode 
    ? "bg-gray-800 border-gray-600 text-white focus:border-blue-400" 
    : "bg-white border-gray-300 text-black focus:border-blue-500";
  
  return (
    <select
      value={value}
      onChange={onChange}
      className={`${baseStyles} ${themeStyles} ${className}`}
      {...props}
    >
      {placeholder && (
        <option value="" className={darkMode ? "text-gray-400" : "text-gray-500"}>
          {placeholder}
        </option>
      )}
      {options.map(option => (
        <option 
          key={option} 
          value={option} 
          className={darkMode ? "text-white bg-gray-800" : "text-black bg-white"}
        >
          {option}
        </option>
      ))}
    </select>
  );
};

// Theme-aware textarea component
const ThemedTextarea = ({ value, onChange, placeholder, rows = 3, className = "", ...props }) => {
  const { darkMode } = useTheme();
  
  const baseStyles = "w-full border-2 rounded-xl transition-all duration-300 focus:outline-none resize-none";
  const themeStyles = darkMode 
    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:bg-gray-800" 
    : "bg-white border-gray-300 text-black placeholder-gray-500 focus:border-blue-500 focus:bg-white";
  
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`${baseStyles} ${themeStyles} ${className}`}
      {...props}
    />
  );
};

const WelcomeStep = ({ goToNextStep, handleLoginWithPhone, isAuthenticated, showPhoneLogin, screenType }) => (
  <div className="relative h-full overflow-hidden">
    {/* Animated background gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-700 to-pink-600 opacity-90">
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
      {/* Animated floating elements for desktop */}
      {screenType === 'desktop' && (
        <>
          <div className="absolute top-20 left-10 w-16 h-16 bg-white/10 rounded-full animate-bounce delay-1000"></div>
          <div className="absolute top-40 right-20 w-12 h-12 bg-yellow-400/20 rounded-full animate-pulse delay-500"></div>
          <div className="absolute bottom-32 left-1/4 w-8 h-8 bg-pink-400/30 rounded-full animate-ping delay-700"></div>
        </>
      )}
    </div>
    
    <div className={`relative z-10 text-center px-6 py-8 text-white h-full flex flex-col justify-center ${
      screenType === 'mobile' ? 'px-4' : screenType === 'tablet' ? 'px-8' : 'px-12'
    }`}>
      {/* Hero Icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl scale-150 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-lg rounded-full p-6 border border-white/30 mx-auto w-fit shadow-2xl mt-10">
          <Dumbbell className="h-12 w-12 text-white" />
        </div>
      </div>
      
      {/* Main Headline */}
      <div className="mb-8 space-y-3">
        <h1 className={`font-bold text-yellow-300 drop-shadow-lg leading-tight ${
          screenType === 'mobile' ? 'text-2xl' : screenType === 'tablet' ? 'text-3xl' : 'text-4xl'
        }`}>
          Find Your Perfect<br />
          <span className="text-white">Gym Partner</span>
        </h1>
        
        <p className={`text-blue-100 font-medium ${
          screenType === 'mobile' ? 'text-lg' : 'text-xl'
        }`}>
          🚀 Transform Your Fitness Journey
        </p>
      </div>

      {/* Value Props */}
      <div className={`grid gap-4 mb-8 ${
        screenType === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'
      } max-w-2xl mx-auto`}>
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
          <Heart className="h-8 w-8 text-pink-300 mx-auto mb-2" />
          <h3 className="font-semibold text-white mb-1">Perfect Matches</h3>
          <p className="text-xs text-white/80">AI-powered compatibility</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
          <MapPin className="h-8 w-8 text-green-300 mx-auto mb-2" />
          <h3 className="font-semibold text-white mb-1">Local Partners</h3>
          <p className="text-xs text-white/80">Train in your area</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
          <Zap className="h-8 w-8 text-yellow-300 mx-auto mb-2" />
          <h3 className="font-semibold text-white mb-1">Instant Connect</h3>
          <p className="text-xs text-white/80">Start training today</p>
        </div>
      </div>

      {/* Success Stats */}
      <div className="mb-8">
        <p className="text-yellow-300 font-bold text-lg mb-2">Join 10,000+ Active Members</p>
        <div className="flex justify-center items-center space-x-2 mb-2">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-yellow-300 text-lg">⭐</span>
          ))}
          <span className="text-white/90 ml-2 font-medium">4.9/5 Rating</span>
        </div>
        <p className="text-white/70 text-sm">Average 3x better workout consistency</p>
      </div>
 
      {/* Action Buttons */}
      <div className={`space-y-4 w-full mx-auto ${
        screenType === 'mobile' ? 'max-w-sm' : 'max-w-md'
      }`}>
        {!isAuthenticated && (
          <button
            onClick={handleLoginWithPhone}
            className="w-full bg-white/15 backdrop-blur-sm border-2 border-white/40 text-white py-3 px-6 rounded-2xl font-medium hover:bg-white/25 transition-all duration-300 transform hover:scale-105 flex items-center justify-center group"
          >
            <LogIn className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
            Already have an account? Log in
          </button>
        )}
        
        <button
          onClick={goToNextStep}
          className={`w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-2xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center justify-center group ${
            screenType === 'mobile' ? 'py-4 px-6 text-lg' : 'py-5 px-8 text-xl'
          }`}
        >
          <span className="mr-2">🔥</span>
          Start Your Journey
          <Zap className="ml-2 h-5 w-5 group-hover:animate-bounce" />
        </button>
      </div>

      {/* Trust Indicators */}
      <div className="mt-8 text-center">
        <p className="text-white/60 text-xs mb-2">Trusted by fitness enthusiasts worldwide</p>
        <div className="flex justify-center items-center space-x-6 text-white/40">
          <span className="text-xs">🔒 Secure</span>
          <span className="text-xs">✅ Verified</span>
          <span className="text-xs">⚡ Fast Setup</span>
        </div>
      </div>
    </div>
  </div>
);

// Helper to parse "5'8"" to inches
function parseFeetInches(str) {
  const match = /^(\d+)'(\d+)"$/.exec(str);
  if (!match) return null;
  const feet = parseInt(match[1], 10);
  const inches = parseInt(match[2], 10);
  return feet * 12 + inches;
}

// Fixed BasicInfoStep component - with HeightPicker
// Fixed BasicInfoStep component - in buildSteps.jsx

const BasicInfoStep = ({
  profileData,
  handleChange,
  handleInputBlur,
  goToNextStep,
  handleLoginWithPhone,
  isAuthenticated,
  showPhoneLogin,
  screenType
}) => {
  const { darkMode } = useTheme();

  // Set default height if not set (on mount)
  React.useEffect(() => {
    if (!profileData.height) {
      if (profileData.heightUnit === 'inches') {
        // Default to 5'6" (66 inches)
        handleChange('height', 66);
      } else {
        // Default to 170 cm
        handleChange('height', 170);
      }
    }
    // eslint-disable-next-line
  }, [profileData.heightUnit]);

  // Enhanced handler for height change
  const handleHeightChange = (heightValue) => {
    if (profileData.heightUnit === 'inches') {
      // HeightPicker gives label like "5'8"", convert to inches
      if (typeof heightValue === 'string' && heightValue.includes("'")) {
        const inches = parseFeetInches(heightValue);
        if (typeof inches === 'number' && !isNaN(inches)) {
          handleChange('height', inches);
        }
      } else {
        // If it's already a number (total inches), use it directly
        const numValue = Number(heightValue);
        if (!isNaN(numValue) && numValue > 0) {
          handleChange('height', numValue);
        }
      }
    } else {
      // For cm, convert to number
      const cm = Number(heightValue);
      if (!isNaN(cm) && cm > 0) {
        handleChange('height', cm);
      }
    }
  };

  // Helper to display current height for debugging
  const getHeightDisplay = () => {
    if (!profileData.height) return 'Not set';
    
    if (profileData.heightUnit === 'inches') {
      const inches = Number(profileData.height);
      const feet = Math.floor(inches / 12);
      const remainingInches = inches % 12;
      return `${feet}'${remainingInches}" (${inches} total inches)`;
    } else {
      return `${profileData.height} cm`;
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[90vh] overflow-y-auto px-2 py-20">
      {/* Main Title */}
      <div className="text-center space-y-1 mb-4">
        <h2 className="text-xl font-bold text-white">Tell us about yourself</h2>
        <p className="text-white/80 text-sm">Basic information to get started</p>
      </div>
      
      {/* Name Input */}
      <div className="space-y-2 mb-2">
        <label className="text-white font-medium text-sm">What's your name?</label>
        <ThemedInput 
          type="text" 
          value={profileData.name} 
          onChange={(e) => handleChange('name', e.target.value)}
          className={screenType === 'mobile' ? 'p-3 text-lg' : 'p-4 text-xl'}
          placeholder="Enter your name"
          autoFocus
        />
      </div>

      {/* Age and Gender Row */}
      <div className={`grid gap-4 mb-2 ${screenType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Age */}
        <div className="space-y-2">
          <label className="text-white font-medium text-sm">Age</label>
          <ThemedInput 
            type="number" 
            value={profileData.age} 
            onChange={(e) => handleChange('age', e.target.value)}
            onBlur={(e) => handleInputBlur('age', e.target.value)}
            className="p-3"
            placeholder="Age"
            min="18"
            max="99"
          />
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <label className="text-white font-medium text-sm">Gender</label>
          <ThemedSelect
            value={profileData.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            options={genders}
            placeholder="Select gender"
            className="p-3"
          />
        </div>
      </div>

      {/* Height with HeightPicker */}
      <div className="space-y-2 mb-2 pt-4">
        <label className="text-white font-medium text-sm">Height</label>
        <HeightPicker
          value={
            profileData.height !== undefined && profileData.height !== null && profileData.height !== ''
              ? profileData.height.toString()
              : profileData.heightUnit === 'inches'
                ? '66'
                : '170'
          }
          unit={profileData.heightUnit || 'cm'}
          onHeightChange={handleHeightChange}
          onUnitChange={(unit) => handleChange('heightUnit', unit)}
          className="w-full"
        />
        {/* Debug info - remove in production */}
        <p className="text-white/50 text-xs">
          Debug: {profileData.heightUnit === 'inches'
            ? (() => {
                const inches = Number(profileData.height);
                const feet = Math.floor(inches / 12);
                const remainingInches = inches % 12;
                return `${feet}'${remainingInches}" (${inches} total inches)`;
              })()
            : `${profileData.height} cm`}
        </p>
      </div>

      {/* Spacer to push buttons to bottom if enough space */}
      <div className="flex-1" />

      {/* Navigation Buttons */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={() => {
            console.log('Continue clicked. Current height:', profileData.height, 'Type:', typeof profileData.height);
            goToNextStep();
          }}
          disabled={
            !profileData.name.trim() ||
            !profileData.age ||
            Number(profileData.age) < 18 ||
            Number(profileData.age) > 99 ||
            !profileData.gender ||
            !profileData.height ||
            !(typeof profileData.height === 'number' && profileData.height > 0)
          }
          className={`
            py-2 px-8 rounded-xl font-bold transition-all duration-200 shadow-lg
            ${(
              profileData.name.trim() &&
              profileData.age &&
              Number(profileData.age) >= 18 &&
              Number(profileData.age) <= 99 &&
              profileData.gender &&
              profileData.height &&
              typeof profileData.height === 'number' &&
              profileData.height > 0
            )
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600'
              : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }
          `}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// Combined Fitness Info Step (workout types + experience + time preference)
const FitnessInfoStep = ({ profileData, handleWorkoutTypeToggle, handleChange, screenType }) => {
  const { darkMode } = useTheme();
  
  return (
    <div className="w-full space-y-4">
      {/* Main Title */}
      <div className="text-center space-y-1 mb-4">
        <h2 className="text-xl font-bold text-white">Your Fitness Profile</h2>
        <p className="text-white/80 text-sm">Help us find compatible workout partners</p>
      </div>
      
      {/* Workout Types */}
      <div className="space-y-2">
        <label className="text-white font-medium text-sm">What workouts do you enjoy?</label>
        <div className={`grid gap-2 ${
          screenType === 'mobile' ? 'grid-cols-2' : 'grid-cols-3'
        }`}>
          {workoutTypes.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => handleWorkoutTypeToggle(type)}
              className={`px-2 py-1.5 rounded-full text-xs font-medium transition-colors ${
                profileData.workoutTypes.includes(type)
                  ? 'bg-white/30 text-white border-2 border-white/40 backdrop-blur-sm'
                  : 'bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Experience Level and Time Preference */}
      <div className={`grid gap-4 ${screenType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Experience Level */}
        <div className="space-y-2">
          <label className="text-white font-medium text-sm">Experience Level</label>
          <div className="flex flex-col gap-2">
            {experienceLevels.map(level => (
              <button
                key={level}
                type="button"
                onClick={() => handleChange('experienceLevel', level)}
                className={`px-3 py-2 rounded-xl text-sm flex items-center transition-colors ${
                  profileData.experienceLevel === level
                    ? 'bg-white/30 text-white border-2 border-white/40 backdrop-blur-sm'
                    : 'bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 backdrop-blur-sm'
                }`}
              >
                <Award size={14} className="mr-2" />
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Time Preference */}
        <div className="space-y-2">
          <label className="text-white font-medium text-sm">Preferred Time</label>
          <div className="flex flex-wrap gap-2">
            {timePreferences.map(time => (
              <button
                key={time}
                type="button"
                onClick={() => handleChange('preferredTime', time)}
                className={`px-2 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  profileData.preferredTime === time
                    ? 'bg-white/30 text-white border-2 border-white/40 backdrop-blur-sm'
                    : 'bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 backdrop-blur-sm'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const buildSteps = ({
  isAuthenticated,
  user,
  profileData,
  authMode,
  showPhoneLogin,
  isPhoneVerified,
  setIsPhoneVerified, // Add this parameter
  handleChange,
  handleInputBlur,
  handleLoginWithPhone,
  handlePhoneChange,
  handlePhoneVerified,
  handleExistingAccountFound,
  handleContinueWithNewAccount,
  handleInterestToggle,
  handleWorkoutTypeToggle,
  goToNextStep,
  imageUploaderRef
}) => {

  // Use screen type detection
  const { screenType } = useScreenType();
  const { darkMode } = useTheme();
  
  // Check if the user already has a verified phone number
  const hasVerifiedPhone = isAuthenticated && user && 
    (user.phone || (user.user && user.user.phone));

  // Start with common steps
  let stepsList = [
    {
      id: 'welcome',
      title: '🔥 Welcome to GymBros',
      subtitle: '🚀 Transform Your Fitness Journey',
      icon: <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-sm opacity-50"></div>
        <Dumbbell className="relative h-5 w-5 text-white drop-shadow-lg" />
      </div>,
      component: (
        <WelcomeStep
          goToNextStep={goToNextStep}
          handleLoginWithPhone={handleLoginWithPhone}
          isAuthenticated={isAuthenticated}
          showPhoneLogin={showPhoneLogin}
          screenType={screenType}
        />
      ),
      isValid: () => true,
    }
  ];

 if (!isAuthenticated || !hasVerifiedPhone) {
  stepsList.push({
    id: 'phone',
    title: authMode === 'login' ? "Log in with your phone" : "Verify your phone number",
    subtitle: authMode === 'login' ? 
      "We'll verify your identity" : 
      "We'll send a verification code",
    icon: <Phone size={24} />,
    isValid: () => isPhoneVerified || hasVerifiedPhone,
    component: (hasVerifiedPhone || isPhoneVerified) ? (
      <div className="w-full space-y-4">
        <div className="text-center space-y-1 mb-6">
          <h2 className="text-xl font-bold text-white">{authMode === 'login' ? 'Log in with your phone' : 'Verify your phone number'}</h2>
          <p className="text-white/80 text-sm">{authMode === 'login' ? "We'll verify your identity" : "We'll send a verification code"}</p>
        </div>
        
        <div className="flex flex-col items-center justify-center py-4">
          <div className="bg-green-500/20 backdrop-blur-sm rounded-full p-4 mb-4 border border-green-400/30">
            <CheckCircle className="w-10 h-10 text-green-300" />
          </div>
          <h3 className="text-lg font-bold text-green-300 mb-2">Phone Verified!</h3>
          <p className="text-center text-white mb-2">Your phone number has been successfully verified</p>
          <p className="text-center font-semibold text-white text-lg">{profileData.phone}</p>
          
         <button
    type="button"
    onClick={() => {
      // Allow user to change phone number
      handleChange('phone', '');
      setIsPhoneVerified(false); // Now this function is available
    }}
    className="mt-4 text-sm text-white/70 hover:text-white transition-colors underline"
  >
    Change phone number
  </button>
        </div>
      </div>
    ) : (
      <div className="w-full space-y-4">
        <div className="text-center space-y-1 mb-4">
          <h2 className="text-xl font-bold text-white">{authMode === 'login' ? 'Log in with your phone' : 'Verify your phone number'}</h2>
          <p className="text-white/80 text-sm">{authMode === 'login' ? "We'll verify your identity" : "We'll send a verification code"}</p>
        </div>
        <PhoneVerification
          phone={profileData.phone}
          onChange={handlePhoneChange}
          onVerified={(verified, userData, token, profileData) => {
            if (verified && userData?.phone) {
              handleChange('phone', userData.phone);
            }
            handlePhoneVerified(verified, userData, token, profileData);
          }}
          isLoginFlow={authMode === 'login'}
          onExistingAccountFound={handleExistingAccountFound}
          onContinueWithNewAccount={handleContinueWithNewAccount}
        />
      </div>
    )
  });
}
  
  // Only include profile building steps for signup (not for login)
  if (authMode === 'signup') {
    stepsList = [
      ...stepsList,
      {
  id: 'basicInfo',
  title: "Tell us about yourself",
  subtitle: "Basic information to get started",
  icon: <User size={24} />,
  isValid: () => {
    console.log('Validating basic info step:', {
      name: profileData.name?.trim(),
      age: profileData.age,
      ageNumber: Number(profileData.age),
      gender: profileData.gender,
      height: profileData.height,
      heightType: typeof profileData.height
    });

    const isValid = (
      profileData.name?.trim().length > 0 &&
      profileData.age &&
      Number(profileData.age) >= 18 &&
      Number(profileData.age) <= 99 &&
      profileData.gender !== '' &&
      profileData.height &&
      (
        (typeof profileData.height === 'number' && profileData.height > 0) ||
        (typeof profileData.height === 'string' && Number(profileData.height) > 0)
      )
    );

    console.log('BasicInfo step validation result:', isValid);
    return isValid;
  },
  component: (
    <BasicInfoStep
      profileData={profileData}
      handleChange={handleChange}
      handleInputBlur={handleInputBlur}
      goToNextStep={goToNextStep}
      handleLoginWithPhone={handleLoginWithPhone}
      isAuthenticated={isAuthenticated}
      showPhoneLogin={showPhoneLogin}
      screenType={screenType}
    />
  )
},
      {
        id: 'photos',
        title: 'Add Your Photos',
        subtitle: 'Show your personality - add at least 2 photos',
        icon: <Camera className="h-5 w-5 text-blue-500" />,
        component: (
          <div className="w-full flex flex-col space-y-3">
            {/* Title and Instructions */}
            <div className="text-center space-y-1 flex-shrink-0">
              <h2 className="text-xl font-bold text-white">Add Your Photos</h2>
              <p className="text-white/80 text-sm">Show your personality - add at least 2 photos</p>
            </div>
            
            {/* Image Uploader - compact version */}
            <div className="flex justify-center">
              <ImageUploader
                key="photo-uploader"
                ref={imageUploaderRef}
                images={profileData.photos || []}
                onImagesChange={(newImages) => {
                  handleChange('photos', newImages);
                }}
                uploadAfterCompletion={true}
              />
            </div>
            
            {/* Progress indicator */}
            <div className="text-center flex-shrink-0">
              <p className="text-white/70 text-xs">
                {profileData.photos?.filter(Boolean).length || 0} / 2 photos minimum
              </p>
            </div>
          </div>
        ),
        isValid: () => {
          const hasEnoughPhotos = profileData.photos && profileData.photos.filter(Boolean).length >= 2;
          return hasEnoughPhotos;
        }
      },
      {
        id: 'fitnessInfo',
        title: "Your Fitness Profile",
        subtitle: "Help us find compatible workout partners",
        icon: <Dumbbell size={24} />,
        isValid: () => profileData.workoutTypes.length > 0 && profileData.experienceLevel !== '' && profileData.preferredTime !== '',
        component: (
          <FitnessInfoStep
            profileData={profileData}
            handleWorkoutTypeToggle={handleWorkoutTypeToggle}
            handleChange={handleChange}
            screenType={screenType}
          />
        )
      },
      {
        id: 'interests',
        title: "What interests you?",
        subtitle: "Find partners with similar hobbies",
        icon: <Heart size={24} />,
        isValid: () => profileData.interests.length > 0,
        component: (
          <div className="w-full space-y-3">
            {/* Main Title */}
            <div className="text-center space-y-1 mb-4">
              <h2 className="text-xl font-bold text-white">What interests you?</h2>
              <p className="text-white/80 text-sm">Find partners with similar hobbies</p>
            </div>
            
            <div className={`grid gap-2 ${
              screenType === 'mobile' ? 'grid-cols-3' : 'grid-cols-4'
            }`}>
              {interests.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-2 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    profileData.interests.includes(interest)
                      ? 'bg-white/30 text-white border-2 border-white/40 backdrop-blur-sm'
                      : 'bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
            <p className="text-sm text-white/70 text-center">
              Selected: {profileData.interests.length > 0 ? 
                profileData.interests.length : 
                'None yet - please select at least one'}
            </p>
          </div>
        )
      },
      {
        id: 'goalsAndWork',
        title: "Complete Your Profile",
        subtitle: "Optional: Tell us more about yourself",
        icon: <Target size={24} />,
        isValid: () => true, // Optional step
        component: (
          <div className="w-full space-y-4">
            {/* Main Title */}
            <div className="text-center space-y-1 mb-4">
              <h2 className="text-xl font-bold text-white">Complete Your Profile</h2>
              <p className="text-white/80 text-sm">Optional: Tell us more about yourself</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-white font-medium text-sm">Fitness Goals (Optional)</label>
              <ThemedTextarea 
                value={profileData.goals} 
                onChange={(e) => handleChange('goals', e.target.value)}
                className="p-3"
                placeholder="e.g., Lose weight, build muscle, train for marathon..."
                rows={3}
              />
            </div>

            <div className={`grid gap-4 ${screenType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <div className="space-y-2">
                <label className="text-white font-medium text-sm">Work (Optional)</label>
                <ThemedInput 
                  type="text" 
                  value={profileData.work} 
                  onChange={(e) => handleChange('work', e.target.value)}
                  className="p-3"
                  placeholder="Your profession"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white font-medium text-sm">Studies (Optional)</label>
                <ThemedInput 
                  type="text" 
                  value={profileData.studies} 
                  onChange={(e) => handleChange('studies', e.target.value)}
                  className="p-3"
                  placeholder="Your field of study"
                />
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'location',
        title: "Where are you located?",
        subtitle: "Find gym partners nearby",
        icon: <MapPin size={24} />,
        isValid: () => profileData.location && profileData.location.lat !== null && profileData.location.lng !== null && profileData.location.city,
        canSkip: () => {
          // This step can be skipped if user already has location data
          return profileData.hasExistingLocation || false;
        },
        component: (
          <div className="w-full">
            {/* Main Title */}
            <div className="text-center space-y-1 mb-6">
              <h2 className="text-xl font-bold text-white">Where are you located?</h2>
              <p className="text-white/80 text-sm">Find gym partners nearby</p>
            </div>
            
            <AutoLocationStep
              location={profileData.location}
              onLocationChange={(location) => handleChange('location', location)}
              showSkipOption={true}
              existingLocationMessage={profileData.existingLocationMessage}
              user={user}
              phone={profileData.phone || (user && user.phone)}
            />
            
            {/* Show nearby gyms if location is set - temporarily disabled to prevent API spam */}
            {false && profileData.location && profileData.location.lat && profileData.location.lng && (
              <div className="mt-6">
                <h3 className="text-white font-medium text-sm mb-3">
                  🏋️ Gyms near you
                </h3>
                <NearbyGymsPreview 
                  location={profileData.location}
                  onGymSelect={(gym) => handleChange('selectedGym', gym)}
                />
              </div>
            )}
          </div>
        )
      },
      {
        id: 'gym_selection',
        title: "Where do you workout?",
        subtitle: "Connect with people at your gym",
        icon: <Dumbbell size={24} />,
        isValid: () => true, // Optional step
        component: (
          <div className="w-full">
            {/* Main Title */}
            <div className="text-center space-y-1 mb-6">
              <h2 className="text-xl font-bold text-white">Where do you workout?</h2>
              <p className="text-white/80 text-sm">Connect with people at your gym</p>
            </div>
            <GymSelector
              location={profileData.location}
              selectedGyms={profileData.selectedGyms}
              onGymSelect={(gyms) => {
                console.log('GymSelector onGymSelect called with:', gyms);
                handleChange('selectedGyms', gyms);
              }}
              onCreateGym={(gymData) => {
                const currentGyms = profileData.selectedGyms || [];
                handleChange('selectedGyms', [...currentGyms, gymData]);
                handleChange('newGym', gymData);
              }}
              isGuest={!isAuthenticated}
              userId={user && user._id}
            />
          </div>
        )
      },
    ];
  }

  return stepsList;
};

export default buildSteps;