import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, Check, Award, Crown, Zap,
  User, Target, Dumbbell, Apple, Moon, Activity, Stethoscope, CheckCircle
} from 'lucide-react';

// Mock subscription data for premium plan
const mockSubscription = {
  subscription: 'premium',
  name: 'Premium',
  coachAssignmentStatus: 'pending'
};

// Define the subscription tiers and their available questionnaire sections
const SUBSCRIPTION_TIERS = {
  basic: {
    name: 'Basic',
    icon: <Award className="w-6 h-6" />,
    sections: ['basic', 'fitness', 'goals'],
  },
  premium: {
    name: 'Premium',
    icon: <Crown className="w-6 h-6" />,
    sections: ['basic', 'fitness', 'goals', 'nutrition'],
  },
  elite: {
    name: 'Elite',
    icon: <Zap className="w-6 h-6" />,
    sections: ['basic', 'fitness', 'goals', 'nutrition', 'recovery', 'lifestyle', 'medical'],
  }
};

// Define section icons
const SECTION_ICONS = {
  basic: <User className="w-5 h-5" />,
  fitness: <Dumbbell className="w-5 h-5" />,
  goals: <Target className="w-5 h-5" />,
  nutrition: <Apple className="w-5 h-5" />,
  recovery: <Moon className="w-5 h-5" />,
  lifestyle: <Activity className="w-5 h-5" />,
  medical: <Stethoscope className="w-5 h-5" />,
};

const MockQuestionnaire = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Basic Info
    height: '',
    weight: '',
    age: '',
    gender: '',
    
    // Fitness Background
    experience: 'beginner',
    frequency: 3,
    timeOfDay: [],
    equipment: false,
    
    // Goals
    goals: [],
    targetWeight: '',
    timeframe: '',
    
    // Nutrition (Premium+)
    nutrition: '',
    dietRestrictions: [],
    mealsPerDay: 3,
    trackCalories: false,
  });
  
  // Set premium plan by default
  const [subscriptionTier] = useState('premium');
  const [subscription] = useState(mockSubscription);
  const [availableSections] = useState(SUBSCRIPTION_TIERS.premium.sections);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Hide footer and scrollbars for full-screen experience
    document.body.classList.add('hide-footer', 'overflow-hidden');
    document.documentElement.classList.add('hide-footer', 'overflow-hidden');
    
    return () => {
      // Restore footer and scrollbars when component unmounts
      document.body.classList.remove('hide-footer', 'overflow-hidden');
      document.documentElement.classList.remove('hide-footer', 'overflow-hidden');
    };
  }, []);

  // Define sections based on subscription tier
  const sections = availableSections.map(section => {
    const sectionConfigs = {
      basic: {
        title: 'Basic Information',
        description: 'Tell us about yourself',
        icon: SECTION_ICONS.basic,
      },
      fitness: {
        title: 'Fitness Background',
        description: 'Your current fitness level',
        icon: SECTION_ICONS.fitness,
      },
      goals: {
        title: 'Fitness Goals',
        description: 'What you want to achieve',
        icon: SECTION_ICONS.goals,
      },
      nutrition: {
        title: 'Nutrition',
        description: 'Your eating habits',
        icon: SECTION_ICONS.nutrition,
      },
      recovery: {
        title: 'Recovery',
        description: 'Rest and recovery',
        icon: SECTION_ICONS.recovery,
      },
      lifestyle: {
        title: 'Lifestyle',
        description: 'Daily activities and habits',
        icon: SECTION_ICONS.lifestyle,
      },
      medical: {
        title: 'Medical History',
        description: 'Important health information',
        icon: SECTION_ICONS.medical,
      },
    };
    
    return sectionConfigs[section];
  });

  const handleInputChange = (field, value) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prevData => {
      const currentArray = Array.isArray(prevData[field]) ? prevData[field] : [];
      
      if (currentArray.includes(value)) {
        return {
          ...prevData,
          [field]: currentArray.filter(item => item !== value)
        };
      } else {
        return {
          ...prevData,
          [field]: [...currentArray, value]
        };
      }
    });
  };

  const handleNext = () => {
    if (currentStep < sections.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Mock submission delay
    setTimeout(() => {
      console.log('Questionnaire completed:', formData);
      window.location.href = '/mock-assignment';
      setIsSubmitting(false);

    }, 2000);
  };

  // Get the current section component based on the step
  const getCurrentSectionComponent = () => {
    const currentSection = availableSections[currentStep];
    
    switch (currentSection) {
      case 'basic':
        return (
          <BasicInformationForm 
            formData={formData} 
            onChange={handleInputChange} 
          />
        );
      case 'fitness':
        return (
          <FitnessBackgroundForm 
            formData={formData} 
            onChange={handleInputChange} 
            onArrayToggle={handleArrayToggle}
          />
        );
      case 'goals':
        return (
          <GoalsForm 
            formData={formData} 
            onChange={handleInputChange} 
            onArrayToggle={handleArrayToggle}
          />
        );
      case 'nutrition':
        return (
          <NutritionForm 
            formData={formData} 
            onChange={handleInputChange} 
            onArrayToggle={handleArrayToggle}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="questionnaire-fullscreen questionnaire-container w-screen h-screen overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 dark" style={{ position: 'relative' }}>
      {/* Leave Button */}
      <button
        style={{
          position: 'absolute',
          top: 75,
          right: 25,
          padding: '4px 12px',
          fontSize: '0.9rem',
          background: 'rgba(30, 41, 59, 0.6)', // dark slate, 60% opacity
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
        onClick={() => window.location.href = '/'}
      >
        Leave
      </button>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-600/20 to-rose-700/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-600/20 to-blue-700/20 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-yellow-600/10 to-orange-700/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Main content container */}
      <div className="relative z-0 w-full h-full flex flex-col questionnaire-content pt-16">
        <div className="flex-1 px-2 sm:px-4 lg:px-6 py-1 sm:py-2 lg:py-3 flex flex-col overflow-hidden min-h-0">
          <div className="max-w-6xl mx-auto flex-1 flex flex-col min-h-0 w-full">
            {/* Header with subscription badge - Compact for mobile */}
            <div className="text-center mb-1 sm:mb-2 lg:mb-3 flex-shrink-0 max-h-[120px] overflow-hidden">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center bg-gray-800/90 backdrop-blur-xl rounded-full px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 border-2 border-gray-700/50 shadow-2xl mb-1 sm:mb-2"
              >
                <div className="p-0.5 sm:p-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mr-1 sm:mr-2">
                  <div className="text-white text-xs sm:text-sm lg:text-sm">
                    {SUBSCRIPTION_TIERS[subscriptionTier].icon}
                  </div>
                </div>
                <span className="font-bold text-xs sm:text-sm lg:text-sm text-gray-200">{SUBSCRIPTION_TIERS[subscriptionTier].name} Plan</span>
              </motion.div>
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}
                className="text-sm sm:text-md md:text-base lg:text-xl font-bold bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent mb-0.5 sm:mb-1 drop-shadow-lg leading-tight"
              >
                Complete Your Fitness Profile
              </motion.h2>
            </div>

            {/* Progress indicator - Compact for mobile */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-1 sm:mb-2 lg:mb-2 flex-shrink-0 max-h-[60px] overflow-hidden">

              <div className="flex justify-between items-center mb-1">
                <span className="text-xs sm:text-xs lg:text-xs font-medium text-white/90 dark:text-gray-200/90 drop-shadow">
                  Step {currentStep + 1} of {sections.length}
                </span>
                <span className="text-xs sm:text-xs lg:text-xs font-bold text-white dark:text-gray-100 drop-shadow">
                  {Math.round(((currentStep + 1) / sections.length) * 100)}% Complete
                </span>
              </div>
              <div className="h-1 sm:h-1 lg:h-1 bg-black/20 dark:bg-gray-800/50 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / sections.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-cyan-400 via-white to-pink-400 dark:from-cyan-300 dark:via-blue-200 dark:to-pink-300 rounded-full shadow-lg"
                ></motion.div>
              </div>
            </motion.div>

            {/* Step indicators - Hidden on small mobile */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="hidden md:flex justify-between mb-1 sm:mb-2 lg:mb-1 px-1 sm:px-2 flex-shrink-0 max-h-[60px] overflow-hidden">
  
              {sections.map((section, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.08, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  className={`flex flex-col items-center space-y-0.5 sm:space-y-0.5 lg:space-y-0.5 transition-all duration-300 ${
                    index === currentStep
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : index < currentStep
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                  onClick={() => index <= currentStep && setCurrentStep(index)}
                  disabled={index > currentStep}
                >
                  <div
                    className={`w-5 sm:w-6 lg:w-7 h-5 sm:h-6 lg:h-7 rounded-full flex items-center justify-center border-2 shadow-lg transition-all duration-300 ${
                      index === currentStep
                        ? 'border-indigo-500 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-300 dark:shadow-indigo-900'
                        : index < currentStep
                        ? 'border-green-500 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-300 dark:shadow-green-900'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 shadow-gray-200 dark:shadow-gray-800'
                    }`}
                  >
                    {index < currentStep ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                      >
                        <Check className="w-2 sm:w-2 lg:w-2 h-2 sm:h-2 lg:h-2" />
                      </motion.div>
                    ) : (
                      <div className="text-xs sm:text-xs lg:text-xs">
                        {section.icon}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-center max-w-8 sm:max-w-10 lg:max-w-10 leading-tight">
                    {section.title}
                  </span>
                </motion.button>
              ))}
            </motion.div>

            {/* Current form section - Flexible height with controlled scrolling */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full flex flex-col"
                >
                  <div className="bg-gray-800/80 backdrop-blur-xl shadow-2xl border-0 overflow-hidden flex-1 flex flex-col rounded-2xl">
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-1"></div>
                    <div className="questionnaire-card-content pt-2 sm:pt-3 lg:pt-4 pb-2 sm:pb-3 lg:pb-4 flex-1 flex flex-col overflow-hidden px-4">
                      <motion.div 
                                             initial={{ y: 10, opacity: 0 }}
                                             animate={{ y: 0, opacity: 1 }}
                                             className="flex items-center mb-2 sm:mb-3 lg:mb-4 flex-shrink-0"
                                           >
                                             <div className="p-1.5 sm:p-2 lg:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl lg:rounded-2xl mr-2 sm:mr-3 lg:mr-4 shadow-lg">
                                               <div className="text-white text-xs sm:text-sm lg:text-base">
                                                 {sections[currentStep].icon}
                                               </div>
                                             </div>                        <div>
                                               <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white mb-0.5 sm:mb-1">
                                                 {sections[currentStep].title}
                                               </h2>
                                               <p className="text-xs sm:text-xs lg:text-sm text-gray-300">
                                                 {sections[currentStep].description}
                                               </p>
                                             </div>
                                           </motion.div>

                      <div className="flex-1 flex flex-col min-h-0">
                        <div className={`questionnaire-form-content flex-1 min-h-0 ${
                          currentStep > 0 ? 'overflow-y-auto scrollbar-hide' : 'overflow-hidden'
                        }`}>
                          {getCurrentSectionComponent()}
                        </div>
                      </div>

                      <div className="questionnaire-navigation flex justify-between mt-2 sm:mt-3 lg:mt-4 pt-2 sm:pt-3 lg:pt-4 border-t border-gray-700 flex-shrink-0">
                        <button
                          onClick={handleBack}
                          disabled={currentStep === 0}
                          className="flex items-center px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm lg:text-base font-semibold rounded-lg sm:rounded-xl border-2 bg-gray-700 text-white border-gray-600 hover:bg-gray-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-3 sm:w-4 lg:w-5 h-3 sm:h-4 lg:h-5 mr-1 sm:mr-2" />
                          Back
                        </button>
                        <button
                          onClick={handleNext}
                          disabled={isSubmitting}
                          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white flex items-center px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm lg:text-base font-semibold rounded-lg sm:rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {currentStep === sections.length - 1 ? (
                            isSubmitting ? (
                              <>
                                <div className="w-3 sm:w-4 lg:w-5 h-3 sm:h-4 lg:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 sm:mr-3"></div>
                                Submitting...
                              </>
                            ) : (
                              <>
                                Complete Profile
                                <CheckCircle className="w-3 sm:w-4 lg:w-5 h-3 sm:h-4 lg:h-5 ml-1 sm:ml-2" />
                              </>
                            )
                          ) : (
                            <>
                              Next Step
                              <ChevronRight className="w-3 sm:w-4 lg:w-5 h-3 sm:h-4 lg:h-5 ml-1 sm:ml-2" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Form components
const BasicInformationForm = ({ formData, onChange }) => {
  const genderOptions = [
    { value: 'male', label: 'Male', icon: '👨', color: 'from-blue-500 to-cyan-500' },
    { value: 'female', label: 'Female', icon: '👩', color: 'from-pink-500 to-rose-500' },
    { value: 'other', label: 'Other', icon: '🧑', color: 'from-purple-500 to-indigo-500' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say', icon: '🤐', color: 'from-gray-500 to-slate-500' }
  ];

  return (
    <div className="h-full flex flex-col space-y-2 sm:space-y-3 overflow-y-auto scrollbar-auto min-h-0">
      {/* Physical Stats */}
      <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl border border-blue-800 flex-shrink-0">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-2 sm:mb-3 flex items-center">
          <div className="w-5 sm:w-6 lg:w-7 h-5 sm:h-6 lg:h-7 bg-blue-500 rounded-full flex items-center justify-center mr-2">
            📏
          </div>
          Physical Stats
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <div className="space-y-1 sm:space-y-2">
            <label htmlFor="height" className="text-xs sm:text-sm lg:text-base font-medium text-gray-300">Height (cm)</label>
            <div className="relative">
              <input
                id="height"
                type="number"
                placeholder="175"
                value={formData.height}
                onChange={(e) => onChange('height', e.target.value)}
                className="w-full h-8 sm:h-10 lg:h-12 px-3 text-sm sm:text-base bg-gray-800 border-2 border-blue-700 focus:border-blue-400 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl text-white focus:outline-none"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs sm:text-sm">
                📏
              </div>
            </div>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <label htmlFor="weight" className="text-xs sm:text-sm lg:text-base font-medium text-gray-300">Weight (kg)</label>
            <div className="relative">
              <input
                id="weight"
                type="number"
                placeholder="70"
                value={formData.weight}
                onChange={(e) => onChange('weight', e.target.value)}
                className="w-full h-8 sm:h-10 lg:h-12 px-3 text-sm sm:text-base bg-gray-800 border-2 border-green-700 focus:border-green-400 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl text-white focus:outline-none"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs sm:text-sm">
                ⚖️
              </div>
            </div>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <label htmlFor="age" className="text-xs sm:text-sm lg:text-base font-medium text-gray-300">Age</label>
            <div className="relative">
              <input
                id="age"
                type="number"
                placeholder="30"
                value={formData.age}
                onChange={(e) => onChange('age', e.target.value)}
                className="w-full h-8 sm:h-10 lg:h-12 px-3 text-sm sm:text-base bg-gray-800 border-2 border-purple-700 focus:border-purple-400 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl text-white focus:outline-none"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs sm:text-sm">
                🎂
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Gender Selection */}
      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl border border-purple-800 flex-1 min-h-0 flex flex-col">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-2 sm:mb-3 flex items-center flex-shrink-0">
          <div className="w-5 sm:w-6 lg:w-7 h-5 sm:h-6 lg:h-7 bg-purple-500 rounded-full flex items-center justify-center mr-2">
            👤
          </div>
          Gender Identity
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2 flex-1">
          {genderOptions.map((option) => (
            <motion.div
              key={option.value}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`relative cursor-pointer rounded-lg p-2 sm:p-3 border-2 transition-all duration-300 ${
                formData.gender === option.value
                  ? `bg-gradient-to-br ${option.color} text-white border-transparent shadow-xl`
                  : 'bg-gray-800 border-gray-700 hover:border-purple-400 hover:shadow-lg text-white'
              }`}
              onClick={() => onChange('gender', option.value)}
            >
              <div className="text-center">
                <div className="text-base sm:text-lg lg:text-xl mb-1">{option.icon}</div>
                <div className="font-semibold text-xs sm:text-sm">{option.label}</div>
              </div>
              {formData.gender === option.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <CheckCircle className="w-3 h-3 text-green-500" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FitnessBackgroundForm = ({ formData, onChange, onArrayToggle }) => {
  const experienceOptions = [
    { 
      value: 'beginner', 
      label: 'Beginner', 
      description: '0-1 years',
      icon: '🌱', 
      color: 'from-green-400 to-emerald-500'
    },
    { 
      value: 'intermediate', 
      label: 'Intermediate', 
      description: '1-3 years',
      icon: '💪', 
      color: 'from-blue-400 to-cyan-500'
    },
    { 
      value: 'advanced', 
      label: 'Advanced', 
      description: '3+ years',
      icon: '🏆', 
      color: 'from-purple-400 to-violet-500'
    }
  ];

  const frequencyOptions = [
    { value: 1, label: '1 Day', icon: '🌟', color: 'from-yellow-400 to-orange-400' },
    { value: 2, label: '2 Days', icon: '🔥', color: 'from-orange-400 to-red-400' },
    { value: 3, label: '3 Days', icon: '💯', color: 'from-red-400 to-pink-400' },
    { value: 4, label: '4 Days', icon: '🚀', color: 'from-pink-400 to-purple-400' },
    { value: 5, label: '5 Days', icon: '⚡', color: 'from-purple-400 to-indigo-400' },
    { value: 6, label: '6 Days', icon: '🔋', color: 'from-indigo-400 to-blue-400' },
    { value: 7, label: '7 Days', icon: '👑', color: 'from-blue-400 to-cyan-400' }
  ];

  const timeOptions = [
    { id: 'early-morning', label: 'Early Morning', description: '5-7 AM', icon: '🌅', color: 'from-orange-400 to-red-400' },
    { id: 'morning', label: 'Morning', description: '7-10 AM', icon: '☀️', color: 'from-yellow-400 to-orange-400' },
    { id: 'midday', label: 'Midday', description: '10 AM-2 PM', icon: '🌞', color: 'from-blue-400 to-cyan-500' },
    { id: 'afternoon', label: 'Afternoon', description: '2-6 PM', icon: '🌤️', color: 'from-green-400 to-emerald-500' },
    { id: 'evening', label: 'Evening', description: '6-9 PM', icon: '🌇', color: 'from-purple-400 to-violet-500' },
    { id: 'night', label: 'Night', description: '9+ PM', icon: '🌙', color: 'from-indigo-400 to-purple-500' }
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-hide scrollable-form">
      <div className="space-y-2 sm:space-y-3 pb-4">
        {/* Experience Level */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-2 sm:p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <div className="w-5 sm:w-6 h-5 sm:h-6 bg-indigo-500 rounded-full flex items-center justify-center mr-2">
              🎯
            </div>
            Experience Level
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {experienceOptions.map((option) => (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative cursor-pointer rounded-lg p-2 border-2 transition-all duration-300 flex flex-col justify-center ${
                  formData.experience === option.value
                    ? `bg-gradient-to-br ${option.color} text-white border-transparent shadow-xl`
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg'
                }`}
                onClick={() => onChange('experience', option.value)}
              >
                <div className="text-center">
                  <div className="text-base sm:text-lg lg:text-xl">{option.icon}</div>
                  <div className="font-bold text-xs sm:text-sm">{option.label}</div>
                  <div className="text-xs opacity-75 hidden sm:block">{option.description}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Workout Frequency */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-2 sm:p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 flex-shrink-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <div className="w-5 sm:w-6 h-5 sm:h-6 bg-emerald-500 rounded-full flex items-center justify-center mr-2">
              📅
            </div>
            Workout Days per Week
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 sm:gap-2">
            {frequencyOptions.map((option) => (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative cursor-pointer rounded-lg p-1 sm:p-2 border-2 transition-all duration-300 ${
                  formData.frequency === option.value
                    ? `bg-gradient-to-br ${option.color} text-white border-transparent shadow-xl`
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg'
                }`}
                onClick={() => onChange('frequency', option.value)}
              >
                <div className="text-center">
                  <div className="text-sm sm:text-lg">{option.icon}</div>
                  <div className="font-semibold text-xs">{option.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Preferred Workout Times */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-2 sm:p-3 rounded-lg border border-cyan-200 dark:border-cyan-800">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <div className="w-5 sm:w-6 h-5 sm:h-6 bg-cyan-500 rounded-full flex items-center justify-center mr-2">
              ⏰
            </div>
            Preferred Workout Times
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1 sm:gap-2">
            {timeOptions.map((time) => (
              <motion.div
                key={time.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative cursor-pointer rounded-lg p-2 border-2 transition-all duration-300 ${
                  formData.timeOfDay?.includes(time.id)
                    ? `bg-gradient-to-br ${time.color} text-white border-transparent shadow-xl`
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg'
                }`}
                onClick={() => onArrayToggle('timeOfDay', time.id)}
              >
                <div className="text-center">
                  <div className="text-base sm:text-lg mb-1">{time.icon}</div>
                  <div className="font-bold text-xs">{time.label}</div>
                  <div className="text-xs opacity-75 hidden sm:block">{time.description}</div>
                </div>
                {formData.timeOfDay?.includes(time.id) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Equipment Access */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-2 sm:p-3 rounded-lg border border-purple-200 dark:border-purple-800">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <div className="w-5 sm:w-6 h-5 sm:h-6 bg-purple-500 rounded-full flex items-center justify-center mr-2">
              🏋️‍♂️
            </div>
            Equipment Access
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative cursor-pointer rounded-lg p-3 border-2 transition-all duration-300 ${
                formData.equipment === true
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white border-transparent shadow-xl'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg'
              }`}
              onClick={() => onChange('equipment', true)}
            >
              <div className="text-center">
                <div className="text-lg sm:text-xl mb-1">🏋️‍♂️</div>
                <div className="font-semibold text-xs sm:text-sm">Have Equipment</div>
                <div className="text-xs opacity-75 hidden sm:block">Gym or home gym</div>
              </div>
              {formData.equipment === true && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <CheckCircle className="w-3 h-3 text-green-500" />
                </motion.div>
              )}
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative cursor-pointer rounded-lg p-3 border-2 transition-all duration-300 ${
                formData.equipment === false
                  ? 'bg-gradient-to-br from-blue-400 to-cyan-500 text-white border-transparent shadow-xl'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg'
              }`}
              onClick={() => onChange('equipment', false)}
            >
              <div className="text-center">
                <div className="text-lg sm:text-xl mb-1">🏠</div>
                <div className="font-semibold text-xs sm:text-sm">Bodyweight Only</div>
                <div className="text-xs opacity-75 hidden sm:block">No equipment needed</div>
              </div>
              {formData.equipment === false && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <CheckCircle className="w-3 h-3 text-green-500" />
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GoalsForm = ({ formData, onChange, onArrayToggle }) => {
  const goalOptions = [
    { id: 'weight-loss', label: 'Weight Loss', icon: '📉', color: 'from-red-400 to-rose-500' },
    { id: 'weight-gain', label: 'Weight Gain', icon: '📈', color: 'from-blue-400 to-cyan-500' },
    { id: 'muscle-building', label: 'Muscle Building', icon: '💪', color: 'from-orange-400 to-red-500' },
    { id: 'strength', label: 'Build Strength', icon: '🏋️‍♂️', color: 'from-purple-400 to-violet-500' },
    { id: 'endurance', label: 'Improve Endurance', icon: '🏃‍♂️', color: 'from-green-400 to-emerald-500' },
    { id: 'flexibility', label: 'Increase Flexibility', icon: '🧘‍♀️', color: 'from-pink-400 to-rose-500' },
    { id: 'toning', label: 'Body Toning', icon: '✨', color: 'from-yellow-400 to-orange-500' },
    { id: 'maintenance', label: 'Maintain Current', icon: '⚖️', color: 'from-indigo-400 to-purple-500' }
  ];

  const timeframeOptions = [
    { value: '1-month', label: '1 Month', icon: '🚀', color: 'from-red-400 to-rose-500' },
    { value: '3-months', label: '3 Months', icon: '💪', color: 'from-orange-400 to-red-400' },
    { value: '6-months', label: '6 Months', icon: '🎯', color: 'from-green-400 to-emerald-500' },
    { value: '1-year', label: '1 Year', icon: '🏆', color: 'from-blue-400 to-cyan-500' },
    { value: 'long-term', label: 'Long-term', icon: '🌟', color: 'from-purple-400 to-violet-500' }
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-hide scrollable-form">
      <div className="space-y-2 sm:space-y-3 pb-4">
        {/* Primary Goals */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-2 sm:p-3 rounded-lg border border-cyan-200 dark:border-cyan-800">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <div className="w-5 sm:w-6 h-5 sm:h-6 bg-cyan-500 rounded-full flex items-center justify-center mr-2">
              🎯
            </div>
            Your Fitness Goals (Select All That Apply)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 sm:gap-2 pb-2">
            {goalOptions.map((goal) => (
              <motion.div
                key={goal.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative cursor-pointer rounded-lg p-2 border-2 transition-all duration-300 flex flex-col justify-center min-h-[4rem] ${
                  formData.goals?.includes(goal.id)
                    ? `bg-gradient-to-br ${goal.color} text-white border-transparent shadow-xl`
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg'
                }`}
                onClick={() => onArrayToggle('goals', goal.id)}
              >
                <div className="text-center">
                  <div className="text-base sm:text-lg mb-1">{goal.icon}</div>
                  <div className="font-semibold text-xs">{goal.label}</div>
                </div>
                {formData.goals?.includes(goal.id) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Target Weight (if weight goals selected) */}
        {(formData.goals?.includes('weight-loss') || formData.goals?.includes('weight-gain')) && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-2 sm:p-3 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <div className="w-5 sm:w-6 h-5 sm:h-6 bg-purple-500 rounded-full flex items-center justify-center mr-2">
                🎯
              </div>
              Target Weight (kg)
            </h3>
            <div className="relative">
              <input
                type="number"
                placeholder="Enter your target weight"
                value={formData.targetWeight}
                onChange={(e) => onChange('targetWeight', e.target.value)}
                className="w-full h-10 sm:h-12 px-3 text-sm sm:text-base bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 focus:border-purple-500 dark:focus:border-purple-400 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                ⚖️
              </div>
            </div>
          </div>
        )}

        {/* Timeframe */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-2 sm:p-3 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <div className="w-5 sm:w-6 h-5 sm:h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
              ⏰
            </div>
            Goal Timeframe
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-1 sm:gap-2">
            {timeframeOptions.map((option) => (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative cursor-pointer rounded-lg p-2 border-2 transition-all duration-300 ${
                  formData.timeframe === option.value
                    ? `bg-gradient-to-br ${option.color} text-white border-transparent shadow-xl`
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg'
                }`}
                onClick={() => onChange('timeframe', option.value)}
              >
                <div className="text-center">
                  <div className="text-lg">{option.icon}</div>
                  <div className="font-semibold text-xs">{option.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const NutritionForm = ({ formData, onChange, onArrayToggle }) => {
  const nutritionOptions = [
    { value: 'excellent', label: 'Excellent', icon: '🌟', color: 'from-green-400 to-emerald-500' },
    { value: 'good', label: 'Good', icon: '👍', color: 'from-blue-400 to-cyan-500' },
    { value: 'average', label: 'Average', icon: '😐', color: 'from-yellow-400 to-orange-500' },
    { value: 'poor', label: 'Poor', icon: '👎', color: 'from-red-400 to-rose-500' }
  ];

  const dietRestrictionOptions = [
    { id: 'vegetarian', label: 'Vegetarian', icon: '🥗', color: 'from-green-400 to-emerald-500' },
    { id: 'vegan', label: 'Vegan', icon: '🌱', color: 'from-green-500 to-teal-500' },
    { id: 'keto', label: 'Keto', icon: '🥑', color: 'from-purple-400 to-violet-500' },
    { id: 'gluten-free', label: 'Gluten-Free', icon: '🌾', color: 'from-orange-400 to-red-400' },
    { id: 'dairy-free', label: 'Dairy-Free', icon: '🥛', color: 'from-blue-400 to-cyan-500' },
    { id: 'none', label: 'No Restrictions', icon: '🍽️', color: 'from-gray-400 to-slate-500' }
  ];

  const mealOptions = [
    { value: 2, label: '2 Meals', icon: '🍽️', color: 'from-orange-400 to-red-400' },
    { value: 3, label: '3 Meals', icon: '🥗', color: 'from-green-400 to-emerald-500' },
    { value: 4, label: '4 Meals', icon: '🍳', color: 'from-blue-400 to-cyan-500' },
    { value: 5, label: '5+ Meals', icon: '🥙', color: 'from-purple-400 to-violet-500' }
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-hide scrollable-form">
      <div className="space-y-2 sm:space-y-3 pb-4">
        {/* Current Nutrition Rating */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-2 sm:p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <div className="w-5 sm:w-6 h-5 sm:h-6 bg-emerald-500 rounded-full flex items-center justify-center mr-2">
              🍎
            </div>
            Current Nutrition Habits
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 sm:gap-2">
            {nutritionOptions.map((option) => (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative cursor-pointer rounded-lg p-2 border-2 transition-all duration-300 ${
                  formData.nutrition === option.value
                    ? `bg-gradient-to-br ${option.color} text-white border-transparent shadow-xl`
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg'
                }`}
                onClick={() => onChange('nutrition', option.value)}
              >
                <div className="text-center">
                  <div className="text-lg">{option.icon}</div>
                  <div className="font-semibold text-xs sm:text-sm">{option.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Dietary Restrictions */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-2 sm:p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <div className="w-5 sm:w-6 h-5 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
              🚫
            </div>
            Dietary Preferences
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1 sm:gap-2">
            {dietRestrictionOptions.map((restriction) => (
              <motion.div
                key={restriction.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative cursor-pointer rounded-lg p-2 border-2 transition-all duration-300 min-h-[4rem] flex flex-col justify-center ${
                  formData.dietRestrictions?.includes(restriction.id)
                    ? `bg-gradient-to-br ${restriction.color} text-white border-transparent shadow-xl`
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg'
                }`}
                onClick={() => onArrayToggle('dietRestrictions', restriction.id)}
              >
                <div className="text-center">
                  <div className="text-base sm:text-lg mb-1">{restriction.icon}</div>
                  <div className="font-semibold text-xs">{restriction.label}</div>
                </div>
                {formData.dietRestrictions?.includes(restriction.id) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Meals Per Day */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-2 sm:p-3 rounded-lg border border-purple-200 dark:border-purple-800">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <div className="w-5 sm:w-6 h-5 sm:h-6 bg-purple-500 rounded-full flex items-center justify-center mr-2">
              🍽️
            </div>
            Meals Per Day
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 sm:gap-2">
            {mealOptions.map((option) => (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative cursor-pointer rounded-lg p-2 border-2 transition-all duration-300 ${
                  formData.mealsPerDay === option.value
                    ? `bg-gradient-to-br ${option.color} text-white border-transparent shadow-xl`
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg'
                }`}
                onClick={() => onChange('mealsPerDay', option.value)}
              >
                <div className="text-center">
                  <div className="text-lg">{option.icon}</div>
                  <div className="font-semibold text-xs sm:text-sm">{option.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockQuestionnaire;