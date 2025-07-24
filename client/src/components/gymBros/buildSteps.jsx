// filepath: x:\Downloads\GitHub\GymJams\client\src\components\gymBros\buildSteps.jsx
import React from 'react';
import { 
  Dumbbell, CheckCircle, Award, Clock, 
  MapPin, Target, Phone, LogIn, User, Camera
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
  imageUploaderRef
}) => {
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
        <div className="relative h-full overflow-hidden">
          <div className="relative z-10 text-center px-4 py-8 text-white h-full flex flex-col justify-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-110"></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-4 border border-white/20 mx-auto w-fit">
                <Dumbbell size={48} className="text-white drop-shadow-lg" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-6 text-yellow-300 drop-shadow-lg">
              Find Your Perfect Gym Partner
            </h2>

            <p className="mb-2 text-lg text-blue-100 font-medium">
              🚀 Ready to Transform Your Fitness?
            </p>
            <p className="mb-6 text-white/80 max-w-sm mx-auto leading-relaxed">
              Connect with motivated people who share your goals. Train together, stay accountable, and achieve more!
            </p>
          
            <div className="flex flex-wrap justify-center gap-2 mb-6 text-xs">
              <span className="bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20">
                💪 Workout Partners
              </span>
              <span className="bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20">
                📍 Local Matches
              </span>
              <span className="bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20">
                ⚡ Instant Connect
              </span>
            </div>
     
            <div className="space-y-3 w-full max-w-sm mx-auto">
              {!isAuthenticated && showPhoneLogin && (
                <button
                  onClick={handleLoginWithPhone}
                  className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white py-3 px-4 rounded-xl font-medium hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                >
                  <LogIn className="inline-block mr-2 h-5 w-5" />
                  Already have an account? Log in
                </button>
              )}
              
              <button
                onClick={goToNextStep}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                🔥 Let's Get Started!
              </button>
            </div>

            <div className="mt-6">
              <p className="text-yellow-300 font-semibold text-sm">Join Thousands of Fitness Enthusiasts</p>
              <div className="flex justify-center space-x-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-300 text-sm">⭐</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
      isValid: () => true, // Always valid
    },
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
            className="w-full p-4 text-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300" 
            placeholder="Enter your name"
            autoFocus
          />
          
          {!isAuthenticated && !showPhoneLogin && (
            <button
              onClick={handleLoginWithPhone}
              className="w-full mt-4 bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white py-3 px-4 rounded-xl hover:bg-white/30 transition-all duration-300 flex items-center justify-center transform hover:scale-105"
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
          <div className="bg-green-500/20 backdrop-blur-sm rounded-full p-3 border border-green-400/30">
            <CheckCircle className="w-8 h-8 text-green-300" />
          </div>
        </div>
        <p className="text-center text-white">
          Your phone number is already verified
        </p>
        <p className="text-center font-semibold text-white">{profileData.phone}</p>
      </div>
    ) : (
      // For users without a verified phone, show the PhoneVerification component
      <PhoneVerification
        phone={profileData.phone}
        onChange={handlePhoneChange}
        onVerified={(verified, userData, token, profileData) => {
          // Update the profileData with the verified phone number
          if (verified && userData?.phone) {
            handleChange('phone', userData.phone);
          }
          //('BUILDSTEPS DATA FROM PHONEINPUT.JSX:', verified, userData, token, profileData);
          handlePhoneVerified(verified, userData, token, profileData);
        }}
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
              className="w-full p-4 text-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300" 
              placeholder="Enter your age"
              min="18"
              max="99"
              autoFocus
            />
            <p className="text-sm mt-2 text-white/70">Must be 18 or older</p>
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
                      ? 'bg-white/30 text-white border-2 border-white/40 scale-105 backdrop-blur-sm'
                      : 'bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 backdrop-blur-sm'
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
                className="w-full p-4 text-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300" 
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
                        ? 'bg-white/30 text-white border-2 border-white/40 scale-105 backdrop-blur-sm'
                        : 'bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 backdrop-blur-sm'
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
                      ? 'bg-white/30 text-white border-2 border-white/40 scale-105 backdrop-blur-sm'
                      : 'bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
            <p className="text-sm mt-4 text-white/70">
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
              className="w-full p-4 text-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300" 
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
              className="w-full p-4 text-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300" 
              placeholder="Enter your studies"
              autoFocus
            />
          </div>
        )
      },
      {
        id: 'photos',
        title: 'Add Photos',
        subtitle: 'Add at least 2 photos of yourself',
        icon: <Camera className="h-5 w-5 text-blue-500" />,
        component: (
          <div className="w-full">
            <ImageUploader
              key="photo-uploader"
              ref={imageUploaderRef}
              images={profileData.photos || []}
              onImagesChange={(newImages) => {
                //('ImageUploader onImagesChange called with', newImages.length, 'images');
                handleChange('photos', newImages);
              }}
              uploadAfterCompletion={true}
            />
            
            <div className="mt-2 p-2 bg-white/10 backdrop-blur-sm rounded text-xs text-white/70">
              <p>Ref available: {imageUploaderRef.current ? 'YES' : 'NO'}</p>
              <p>Pending uploads: {imageUploaderRef.current?.getPendingUploadsCount?.() || 0}</p>
              <p>Photos in profile data: {profileData.photos?.length || 0}</p>
              <p>Blob URLs: {profileData.photos?.filter(url => url?.startsWith('blob:'))?.length || 0}</p>
              <p>Server URLs: {profileData.photos?.filter(url => url && !url.startsWith('blob:'))?.length || 0}</p>
            </div>
          </div>
        ),
        isValid: () => {
          const hasEnoughPhotos = profileData.photos && profileData.photos.filter(Boolean).length >= 2;
          //('Photos step isValid check:', hasEnoughPhotos, 'with', profileData.photos?.length || 0, 'photos');
          return hasEnoughPhotos;
        }
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
                      ? 'bg-white/30 text-white border-2 border-white/40 scale-105 backdrop-blur-sm'
                      : 'bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <p className="text-sm mt-4 text-white/70">
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
                      ? 'bg-white/30 text-white border-2 border-white/40 scale-105 backdrop-blur-sm'
                      : 'bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  <Award 
                    size={20} 
                    className={`mr-3 ${profileData.experienceLevel === level ? 'text-white' : 'text-white/70'}`} 
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
            <div className="flex flex-wrap gap-2">
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
                  className={`px-4 py-3 rounded-full text-sm font-medium transition-all ${
                    profileData.preferredTime === time
                      ? 'bg-white/30 text-white border-2 border-white/40 scale-105 backdrop-blur-sm'
                      : 'bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
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
            <textarea 
              value={profileData.goals} 
              onChange={(e) => handleChange('goals', e.target.value)}
              className="w-full p-4 text-lg bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300 resize-none"
              placeholder="e.g., Lose weight, build muscle, train for marathon..."
              rows="4"
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
          <div className="w-full">
            <LocationPicker
              location={profileData.location}
              onLocationChange={(location) => handleChange('location', location)}
            />
          </div>
        )
      },
    ];
  }

  return stepsList;
};

export default buildSteps;
