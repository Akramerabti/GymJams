import React from 'react';
import { 
  Dumbbell, CheckCircle, Award, Clock, 
  MapPin, Target, Phone, LogIn, User
} from 'lucide-react';
import PhoneVerification from './PhoneVerification';
import ImageUploader from './ImageUploader';
import LocationPicker from './LocationPicker';

// Constants for the form options
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
];

export const buildSteps = ({
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
}) => {
  // Check if the user already has a verified phone number
  const hasVerifiedPhone = isAuthenticated && user && 
    (user.phone || (user.user && user.user.phone));

  // Start with common steps
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                goToNextStep();
              }
            }}
            className="w-full p-4 text-2xl bg-transparent border-b-2 border-primary focus:outline-none" 
            placeholder="Enter your name"
            autoFocus
          />
          
          {!isAuthenticated && !showPhoneLogin && (
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
    }
  ];
  
  // Add phone verification step (always included, but behavior changes if user is logged in)
  stepsList.push({
    id: 'phone',
    title: authMode === 'login' ? "Log in with your phone" : "What's your phone number?",
    subtitle: authMode === 'login' ? 
      "We'll verify your identity" : 
      "We'll send a verification code to this number",
    icon: <Phone size={24} />,
    isValid: () => isPhoneVerified || hasVerifiedPhone,
    component: hasVerifiedPhone ? (
      // For logged-in users with a phone, just show that their phone is already verified
      <div className="w-full space-y-4">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-green-100 rounded-full p-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <p className="text-center text-gray-700">
          Your phone number is already verified
        </p>
        <p className="text-center font-semibold">{profileData.phone}</p>
      </div>
    ) : (
      // For users without a verified phone, show the PhoneVerification component
      <PhoneVerification
        phone={profileData.phone}
        onChange={handlePhoneChange}
        onVerified={handlePhoneVerified}
        isLoginFlow={authMode === 'login'}
        onExistingAccountFound={handleExistingAccountFound}
        onContinueWithNewAccount={handleContinueWithNewAccount}
      />
    )
  });
  
  // Only include these steps for signup (not for login)
  if (authMode === 'signup') {
    stepsList = [
      ...stepsList,
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  goToNextStep();
                }
              }}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      goToNextStep();
                    }
                  }}
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    goToNextStep();
                  }
                }}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        goToNextStep();
                      }
                    }}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      goToNextStep();
                    }
                  }}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  goToNextStep();
                }
              }}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  goToNextStep();
                }
              }}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      goToNextStep();
                    }
                  }}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      goToNextStep();
                    }
                  }}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      goToNextStep();
                    }
                  }}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  goToNextStep();
                }
              }}
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
    ];
  }

  return stepsList;
};

export default buildSteps;