import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Dumbbell, ChevronRight, ChevronLeft, CheckCircle, Award, Clock, MapPin, Target, Phone } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../stores/authStore';
import ImageUploader from './ImageUploader'; // Assume this is a custom component for image uploads
import LocationPicker from './LocationPicker'; // Assume this is a custom component for location selection

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
  'Technology', 'Fashion', 'Foodie', 'Wine Tasting', 'Coffee Enthusiast',
  'Podcasts', 'Self-Improvement', 'Volunteering', 'Pets', 'Outdoor Adventures',
  'Road Trips', 'Karaoke', 'Comedy Shows', 'Astrology', 'Board Games',
  'DIY Projects', 'Festivals', 'Camping', 'Surfing', 'Skiing', 'Snowboarding',
  'Tennis', 'Soccer', 'Basketball', 'Running', 'Gym Workouts', 'Spa & Wellness',
  'Street Food', 'Fine Dining', 'Mixology', 'Live Music', 'Stand-up Comedy',
  'Thrift Shopping', 'Antiques', 'True Crime', 'Sci-Fi & Fantasy',
  'Adrenaline Sports', 'Motorcycles', 'Car Enthusiast', 'Gaming (Video & Board)',
  'Esports', 'Magic & Illusions', 'Mythology', 'Cosplay', 'Street Art',
  'Concerts & Gigs', 'Murder Mysteries', 'Stargazing', 'Ghost Hunting',
  'Escape Rooms', 'Social Causes', 'Entrepreneurship', 'Minimalism', 'Urban Exploring'
];

const GymBrosSetup = ({ onProfileCreated }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward
  const [profileData, setProfileData] = useState({
    name: '',
    age: '',
    gender: '',
    height: '',
    heightUnit: 'cm',
    interests: [],
    work: '',
    studies: '',
    phone: '', // Pre-fill phone if available
    workoutTypes: [],
    experienceLevel: '',
    preferredTime: '',
    goals: '',
    location: {
      lat: null,
      lng: null,
      address: '',
    },
    images: [], // Array to store up to 6 images
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Pre-fill user data when user object is available
  useEffect(() => {
    if (user?.user) {
      setProfileData(prev => ({
        ...prev,
        name: user.user.firstName || '',
        phone: user.user.phone || '',
        location: {
          lat: user.user.location?.lat || null,
          lng: user.user.location?.lng || null,
          address: user.user.location?.address || '',
        },
      }));
    }
  }, [user]);

  const steps = [
    {
      id: 'name',
      title: "What's your name?",
      subtitle: "Let's start with the basics",
      icon: <CheckCircle size={24} />,
      isValid: () => profileData.name.trim().length > 0,
      component: (
        <div className="w-full">
          <input 
            type="text" 
            value={profileData.name} 
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full p-4 text-2xl bg-transparent border-b-2 border-primary focus:outline-none" 
            placeholder="Enter your name"
            autoFocus
          />
        </div>
      )
    },
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
            onChange={(e) => handleChange('studies', e.target.value)}
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
  
      useEffect(() => {
    setProgress(((currentStep + 1) / steps.length) * 100);
  }, [currentStep, steps.length]);

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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Add userId to profileData
      const payload = {
        ...profileData,
        userId: user.user.id, // Ensure userId is included
      };
  
      // Log the payload to the console for debugging
      console.log("Payload being sent:", payload);
  
      // Send the payload as JSON
      const response = await api.post('/gym-bros/profile', payload, {
        headers: { 'Content-Type': 'application/json' }, // Set the content type to JSON
      });
  
      toast.success('Profile created successfully!');
      onProfileCreated(response.data);
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile');
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

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
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

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col h-[80vh]">
      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
        <div
          className="h-full bg-primary rounded-full transition-all bg-black duration-500 ease-out"
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
      <div className="flex justify-between mt-4">
        <button
          onClick={goToPrevStep}
          disabled={currentStep === 0}
          className="p-2 rounded-full bg-primary text-white bg-gray-300 hover:bg-primary/90 transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={goToNextStep}
          className="p-2 rounded-full bg-primary text-white bg-blue-500 hover:bg-primary/90 transition-all"
          disabled={loading}
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

export default GymBrosSetup;