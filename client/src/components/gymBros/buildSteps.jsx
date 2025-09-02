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

const WelcomeStep = ({ goToNextStep, handleLoginWithPhone, isAuthenticated, showPhoneLogin, screenType }) => {
  const { darkMode } = useTheme();
  
  return (
    <div className="welcome-step-container relative min-h-full overflow-x-hidden overflow-y-auto">
      {/* Professional background gradient */}
      <div 
        className="absolute inset-0 opacity-90 overflow-hidden"
        style={{
          background: darkMode 
            ? 'linear-gradient(135deg, #1e293b 0%, #334155 20%, #475569 40%, #64748b 60%, #374151 80%, #1f2937 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 20%, #cbd5e1 40%, #94a3b8 60%, #64748b 80%, #475569 100%)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
      {/* Animated floating elements for desktop only - properly contained within viewport */}
      {screenType === 'desktop' && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="welcome-step-floating absolute top-20 left-8 w-12 h-12 bg-white/10 rounded-full animate-bounce delay-1000"></div>
          <div className="welcome-step-floating absolute top-40 right-8 w-10 h-10 bg-slate-400/20 rounded-full animate-pulse delay-500"></div>
          <div className="welcome-step-floating absolute bottom-32 left-1/3 w-6 h-6 bg-slate-300/30 rounded-full animate-ping delay-700"></div>
        </div>
      )}
    </div>
    
    <div className={`welcome-step-content relative z-10 text-center min-h-full flex flex-col ${
      screenType === 'mobile' 
        ? 'px-4 py-4' 
        : screenType === 'tablet' 
        ? 'px-6 py-6' 
        : 'px-8 py-8'
    }`}>
      
      {/* Hero Icon - Responsive sizing with proper spacing classes */}
      <div className={`welcome-step-hero relative flex-shrink-0 ${
        screenType === 'mobile' ? 'mb-3 mt-1' : 'mb-4 mt-2'
      }`}>
        <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl scale-150 animate-pulse"></div>
        <div className={`relative backdrop-blur-lg rounded-full border mx-auto w-fit shadow-2xl ${
          screenType === 'mobile' ? 'p-3' : 'p-4'
        }`}
             style={{
               background: darkMode 
                 ? 'linear-gradient(135deg, rgba(71, 85, 105, 0.3), rgba(100, 116, 139, 0.3))'
                 : 'linear-gradient(135deg, rgba(248, 250, 252, 0.3), rgba(226, 232, 240, 0.3))',
               borderColor: darkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(71, 85, 105, 0.3)'
             }}>
          <Dumbbell className={`${darkMode ? 'text-white' : 'text-gray-700'} ${
            screenType === 'mobile' ? 'h-8 w-8' : screenType === 'tablet' ? 'h-10 w-10' : 'h-12 w-12'
          }`} />
        </div>
      </div>
      
      {/* Main Headline - Responsive text sizing with professional colors */}
      <div className={`welcome-step-spacing space-y-1 flex-shrink-0 ${
        screenType === 'mobile' ? 'mb-3' : 'mb-4'
      }`}>
        <h1 className={`font-bold leading-tight ${
          screenType === 'mobile' 
            ? 'text-lg' 
            : screenType === 'tablet' 
            ? 'text-xl' 
            : 'text-2xl'
        }`}
            style={{
              color: darkMode ? '#e2e8f0' : '#334155'
            }}>
          Find Your Perfect<br />
          <span style={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>Gym Partner</span>
        </h1>
        
        <p className={`font-medium ${
          screenType === 'mobile' ? 'text-sm' : 'text-base'
        }`}
           style={{ color: darkMode ? '#cbd5e1' : '#475569' }}>
          🚀 Transform Your Fitness Journey
        </p>
      </div>

      {/* Value Props - Responsive grid with proper spacing and professional colors */}
      <div className={`welcome-step-grid welcome-step-spacing grid gap-2 max-w-2xl mx-auto flex-shrink-0 ${
        screenType === 'mobile' 
          ? 'grid-cols-1 mb-3' 
          : 'grid-cols-3 mb-4'
      }`}>
        <div 
          className="backdrop-blur-sm p-2.5 rounded-xl border"
          style={{
            background: darkMode 
              ? 'rgba(71, 85, 105, 0.2)' 
              : 'rgba(248, 250, 252, 0.2)',
            borderColor: darkMode 
              ? 'rgba(148, 163, 184, 0.3)' 
              : 'rgba(71, 85, 105, 0.3)'
          }}>
          <Heart className={`mx-auto mb-1 ${
            screenType === 'mobile' ? 'h-5 w-5' : 'h-6 w-6'
          }`}
                style={{ color: darkMode ? '#f472b6' : '#ec4899' }} />
          <h3 className={`font-semibold mb-1 ${
            screenType === 'mobile' ? 'text-xs' : 'text-sm'
          }`}
              style={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>Perfect Matches</h3>
          <p className="text-xs"
             style={{ color: darkMode ? 'rgba(203, 213, 225, 0.8)' : 'rgba(71, 85, 105, 0.8)' }}>AI-powered compatibility</p>
        </div>
        
        <div 
          className="backdrop-blur-sm p-2.5 rounded-xl border"
          style={{
            background: darkMode 
              ? 'rgba(71, 85, 105, 0.2)' 
              : 'rgba(248, 250, 252, 0.2)',
            borderColor: darkMode 
              ? 'rgba(148, 163, 184, 0.3)' 
              : 'rgba(71, 85, 105, 0.3)'
          }}>
          <MapPin className={`mx-auto mb-1 ${
            screenType === 'mobile' ? 'h-5 w-5' : 'h-6 w-6'
          }`}
                  style={{ color: darkMode ? '#34d399' : '#10b981' }} />
          <h3 className={`font-semibold mb-1 ${
            screenType === 'mobile' ? 'text-xs' : 'text-sm'
          }`}
              style={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>Local Partners</h3>
          <p className="text-xs"
             style={{ color: darkMode ? 'rgba(203, 213, 225, 0.8)' : 'rgba(71, 85, 105, 0.8)' }}>Train in your area</p>
        </div>
        
        <div 
          className="backdrop-blur-sm p-2.5 rounded-xl border"
          style={{
            background: darkMode 
              ? 'rgba(71, 85, 105, 0.2)' 
              : 'rgba(248, 250, 252, 0.2)',
            borderColor: darkMode 
              ? 'rgba(148, 163, 184, 0.3)' 
              : 'rgba(71, 85, 105, 0.3)'
          }}>
          <Zap className={`mx-auto mb-1 ${
            screenType === 'mobile' ? 'h-5 w-5' : 'h-6 w-6'
          }`}
              style={{ color: darkMode ? '#fbbf24' : '#f59e0b' }} />
          <h3 className={`font-semibold mb-1 ${
            screenType === 'mobile' ? 'text-xs' : 'text-sm'
          }`}
              style={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>Instant Connect</h3>
          <p className="text-xs"
             style={{ color: darkMode ? 'rgba(203, 213, 225, 0.8)' : 'rgba(71, 85, 105, 0.8)' }}>Start training today</p>
        </div>
      </div>

      {/* Success Stats - Compact on mobile with proper spacing and professional colors */}
      <div className={`welcome-step-stats welcome-step-spacing flex-shrink-0 ${
        screenType === 'mobile' ? 'mb-3' : 'mb-4'
      }`}>
        <p className={`font-bold mb-1 ${
          screenType === 'mobile' ? 'text-sm' : 'text-base'
        }`}
           style={{ color: darkMode ? '#cbd5e1' : '#475569' }}>Join 10,000+ Active Members</p>
        <div className="flex justify-center items-center space-x-1 mb-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={`text-yellow-400 ${
              screenType === 'mobile' ? 'text-sm' : 'text-base'
            }`}>⭐</span>
          ))}
          <span className={`ml-2 font-medium ${
            screenType === 'mobile' ? 'text-xs' : 'text-sm'
          }`}
                style={{ color: darkMode ? 'rgba(241, 245, 249, 0.9)' : 'rgba(30, 41, 59, 0.9)' }}>4.9/5 Rating</span>
        </div>
        <p className={`${
          screenType === 'mobile' ? 'text-xs' : 'text-sm'
        }`}
           style={{ color: darkMode ? 'rgba(203, 213, 225, 0.7)' : 'rgba(71, 85, 105, 0.7)' }}>Average 3x better workout consistency</p>
      </div>
      {/* Action Buttons - Flex grow to push to bottom with sticky positioning */}
      <div className={`welcome-step-actions w-full mx-auto flex-grow flex flex-col justify-end space-y-2 ${
        screenType === 'mobile' ? 'max-w-sm mb-3' : 'max-w-md mb-4'
      }`}>
        {!isAuthenticated && (
          <button
            onClick={handleLoginWithPhone}
            className={`welcome-step-button w-full backdrop-blur-sm border-2 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center group ${
              screenType === 'mobile' ? 'py-3 px-4 text-sm' : 'py-3 px-6 text-base'
            }`}
            style={{
              background: darkMode 
                ? 'rgba(71, 85, 105, 0.2)' 
                : 'rgba(248, 250, 252, 0.2)',
              borderColor: darkMode 
                ? 'rgba(148, 163, 184, 0.4)' 
                : 'rgba(71, 85, 105, 0.4)',
              color: darkMode ? '#f1f5f9' : '#1e293b'
            }}
          >
            <LogIn className={`mr-2 group-hover:rotate-12 transition-transform ${
              screenType === 'mobile' ? 'h-4 w-4' : 'h-5 w-5'
            }`} />
            <span className={screenType === 'mobile' ? 'text-xs' : 'text-sm'}>
              Already have an account? Log in
            </span>
          </button>
        )}
        
        <button
          onClick={goToNextStep}
          className={`welcome-step-button w-full font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center justify-center group ${
            screenType === 'mobile' 
              ? 'py-3 px-4 text-base' 
              : screenType === 'tablet'
              ? 'py-4 px-6 text-lg'
              : 'py-4 px-8 text-xl'
          }`}
          style={{
            background: darkMode 
              ? 'linear-gradient(135deg, #475569, #64748b, #94a3b8)'
              : 'linear-gradient(135deg, #1e293b, #334155, #475569)',
            color: '#ffffff'
          }}
        >
          <span className="mr-2">🔥</span>
          Start Your Journey
          <Zap className={`ml-2 group-hover:animate-bounce ${
            screenType === 'mobile' ? 'h-4 w-4' : 'h-5 w-5'
          }`} />
        </button>
      </div>

      {/* Trust Indicators - Always at bottom with proper spacing and professional colors */}
      <div className="welcome-step-trust text-center flex-shrink-0 mt-auto">
        <p className={`mb-1 ${
          screenType === 'mobile' ? 'text-xs' : 'text-sm'
        }`}
           style={{ color: darkMode ? 'rgba(203, 213, 225, 0.6)' : 'rgba(71, 85, 105, 0.6)' }}>Trusted by fitness enthusiasts worldwide</p>
        <div className={`flex justify-center items-center ${
          screenType === 'mobile' 
            ? 'space-x-3 text-xs' 
            : 'space-x-4 text-sm'
        }`}
             style={{ color: darkMode ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.4)' }}>
          <span>🔒 Secure</span>
          <span>✅ Verified</span>
          <span>⚡ Fast Setup</span>
        </div>
      </div>
    </div>
  </div>
  );
};

// Helper to parse "5'8"" to inches
function parseFeetInches(str) {
  const match = /^(\d+)'(\d+)"$/.exec(str);
  if (!match) return null;
  const feet = parseInt(match[1], 10);
  const inches = parseInt(match[2], 10);
  return feet * 12 + inches;
}


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
    <div className="flex flex-col h-full max-h-[90vh] overflow-y-auto px-2 ">
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
  setVerificationToken,
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
    component: (
      <div className="w-full space-y-4">
        <div className="text-center space-y-1 mb-4">
          <h2 className="text-xl font-bold text-white">
            {authMode === 'login' ? 'Log in with your phone' : 'Verify your phone number'}
          </h2>
          <p className="text-white/80 text-sm">
            {authMode === 'login' ? "We'll verify your identity" : "We'll send a verification code"}
          </p>
        </div>
        
        <PhoneVerification
          phone={profileData.phone}
          onChange={handlePhoneChange}
          onVerified={(verified, userData, token, existingProfileData) => {
            console.log('📱 Phone verification result:', {
              verified,
              hasUserData: !!userData,
              hasToken: !!token, 
              hasProfileData: !!existingProfileData
            });

            if (verified) {
              // Update phone in profile data
              if (userData?.phone) {
                handleChange('phone', userData.phone);
              } else if (!profileData.phone) {
                // Store the verified phone if not already stored
                const storedPhone = localStorage.getItem('verifiedPhone');
                if (storedPhone) {
                  handleChange('phone', storedPhone);
                }
              }

              // Handle different verification outcomes
              if (existingProfileData && existingProfileData.profile) {
                // User has existing profile - redirect to main app
                console.log('✅ Existing profile found, redirecting to app');
                handlePhoneVerified(verified, userData, token, existingProfileData);
                return;
              }

              if (userData) {
                // User has account but no profile - this is rare but possible
                console.log('👤 User account found but no GymBros profile');
                handlePhoneVerified(verified, userData, token, null);
                return;
              }

              // No existing account/profile - proceed with account creation
              console.log('🆕 New user - proceeding with account creation');
              setIsPhoneVerified(true);
              
              // Set verification token for profile creation
              if (token) {
                setVerificationToken(token);
                localStorage.setItem('verificationToken', token);
              }
              
              // Move to next step (basic info)
              setTimeout(() => {
                goToNextStep();
              }, 1500); // Give user time to see the "create account" message
            }
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