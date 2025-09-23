import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Crown, Zap, Calendar, BarChart2, Dumbbell, Activity, 
  CheckCircle, MessageSquare, Target, Bell, User, Clock, 
  TrendingUp, Trophy, Heart, ArrowRight, X, ChevronRight, ChevronLeft,
  Play, Pause, RotateCcw, Settings, Plus, Edit3, Apple, Moon, Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Progress from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Tutorial steps configuration
const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    target: '.welcome-header',
    title: 'Welcome to Your Coaching Dashboard',
    description: 'This is your personalized fitness command center where you can track progress, view workouts, and communicate with your coach.',
    position: 'bottom'
  },
  {
    id: 'subscription-tier',
    target: '.subscription-tier',
    title: 'Your Subscription Plan',
    description: 'See your current plan benefits and upgrade options. Premium plans unlock advanced features like custom nutrition and priority coach support.',
    position: 'bottom'
  },
  {
    id: 'stats-grid',
    target: '.stats-grid',
    title: 'Progress Statistics',
    description: 'Monitor your fitness journey with key metrics like workouts completed, current streak, and goal achievements.',
    position: 'bottom'
  },
  {
    id: 'upcoming-workout',
    target: '.upcoming-workout',
    title: 'Next Workout Notification',
    description: 'Never miss a session! Get reminders for your scheduled workouts and quick access to workout details.',
    position: 'bottom'
  },
  {
    id: 'goals-section',
    target: '.goals-section',
    title: 'Your Fitness Goals',
    description: 'Track progress toward your personal fitness targets. Request goal completion and earn points for achievements.',
    position: 'top'
  },
  {
    id: 'workouts-section',
    target: '.workouts-section',
    title: 'Workout Plans',
    description: 'Access your personalized workout routines, mark them complete, and view detailed exercise instructions.',
    position: 'top'
  },
  {
    id: 'coach-chat',
    target: '.coach-chat',
    title: 'Coach Communication',
    description: 'Stay connected with your personal trainer through real-time messaging and get expert guidance.',
    position: 'left'
  },
  {
    id: 'progress-tracking',
    target: '.progress-tracking',
    title: 'Progress Tracking',
    description: 'Log your measurements, weights, and performance metrics to visualize your transformation over time.',
    position: 'top'
  }
];

// Mock data (exact same structure as original)
const mockSubscription = {
  subscription: 'premium',
  stats: {
    workoutsCompleted: 24,
    currentStreak: 7,
    goalsAchieved: 3,
    monthlyProgress: 85
  },
  _id: 'mock-subscription-id'
};

const mockWorkouts = [
  {
    id: 1,
    title: 'Upper Body Strength',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    time: '9:00 AM',
    duration: '45 min',
    type: 'strength',
    completed: false,
    exercises: ['Push-ups', 'Pull-ups', 'Bench Press', 'Rows']
  },
  {
    id: 2,
    title: 'HIIT Cardio Blast',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    time: '6:00 PM',
    duration: '30 min',
    type: 'cardio',
    completed: false,
    exercises: ['Burpees', 'Mountain Climbers', 'Jump Squats', 'High Knees']
  },
  {
    id: 3,
    title: 'Lower Body Power',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    time: '7:00 AM',
    duration: '50 min',
    type: 'strength',
    completed: false,
    exercises: ['Squats', 'Deadlifts', 'Lunges', 'Calf Raises']
  }
];

const mockGoals = [
  {
    id: 1,
    title: 'Complete 20 Workouts This Month',
    progress: 75,
    target: '20 workouts',
    type: 'consistency',
    dueDate: '2025-01-31',
    status: 'active',
    due: 'Jan 31, 2025'
  },
  {
    id: 2,
    title: 'Increase Bench Press by 15%',
    progress: 60,
    target: '185 lbs',
    type: 'strength',
    dueDate: '2025-02-15',
    status: 'active',
    due: 'Feb 15, 2025'
  },
  {
    id: 3,
    title: 'Lose 10 Pounds',
    progress: 40,
    target: '170 lbs',
    type: 'weight',
    dueDate: '2025-03-01',
    status: 'active',
    due: 'Mar 1, 2025'
  }
];

const SUBSCRIPTION_TIERS = {
  basic: {
    name: 'Basic',
    icon: <Award className="w-6 h-6" />,
    color: 'from-blue-500 to-blue-600',
    features: ['Weekly workout plans', 'Basic progress tracking', 'Coach messaging'],
    sections: ['basic', 'fitness', 'goals'],
  },
  premium: {
    name: 'Premium',
    icon: <Crown className="w-6 h-6" />,
    color: 'from-purple-500 to-purple-600',
    features: ['Custom workout plans', 'Nutrition guidance', 'Priority coach support', 'Advanced analytics'],
    sections: ['basic', 'fitness', 'goals', 'nutrition'],
  },
  elite: {
    name: 'Elite',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-amber-500 to-amber-600',
    features: ['Personalized plans', 'Daily coach support', 'Recovery tracking', 'Premium features'],
    sections: ['basic', 'fitness', 'goals', 'nutrition', 'recovery', 'lifestyle', 'medical'],
  }
};

// Define section icons (exact same as original)
const SECTION_ICONS = {
  basic: <User className="w-5 h-5" />,
  fitness: <Dumbbell className="w-5 h-5" />,
  goals: <Target className="w-5 h-5" />,
  nutrition: <Apple className="w-5 h-5" />,
  recovery: <Moon className="w-5 h-5" />,
  lifestyle: <Activity className="w-5 h-5" />,
  medical: <Stethoscope className="w-5 h-5" />,
};

// Tutorial Overlay Component with scroll locking
const TutorialOverlay = ({ step, onNext, onClose, totalSteps }) => {
  const [targetElement, setTargetElement] = useState(null);
  const [overlayStyle, setOverlayStyle] = useState({});

  useEffect(() => {
    // Disable scrolling when tutorial is active
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    const scrollY = window.scrollY;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    if (step?.target) {
      const element = document.querySelector(step.target);
      if (element) {
        setTargetElement(element);
        
        // Get element position relative to the fixed body
        const rect = element.getBoundingClientRect();
        
        setOverlayStyle({
          top: rect.top + scrollY,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      }
    }

    // Cleanup function to restore scrolling
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, scrollY);
      }
    };
  }, [step]);

  if (!step || !targetElement) return null;

  const getTooltipPosition = () => {
    const tooltipOffset = 20;
    const baseStyle = {
      position: 'absolute',
      zIndex: 1001,
      maxWidth: '320px',
      width: 'calc(100vw - 2rem)'
    };

    switch (step.position) {
      case 'top':
        return {
          ...baseStyle,
          bottom: `calc(100vh - ${overlayStyle.top}px + ${tooltipOffset}px)`,
          left: Math.max(16, overlayStyle.left + overlayStyle.width / 2),
          transform: 'translateX(-50%)'
        };
      case 'bottom':
        return {
          ...baseStyle,
          top: overlayStyle.top + overlayStyle.height + tooltipOffset,
          left: Math.max(16, overlayStyle.left + overlayStyle.width / 2),
          transform: 'translateX(-50%)'
        };
      case 'left':
        return {
          ...baseStyle,
          top: overlayStyle.top + overlayStyle.height / 2,
          right: `calc(100vw - ${overlayStyle.left}px + ${tooltipOffset}px)`,
          transform: 'translateY(-50%)'
        };
      case 'right':
        return {
          ...baseStyle,
          top: overlayStyle.top + overlayStyle.height / 2,
          left: overlayStyle.left + overlayStyle.width + tooltipOffset,
          transform: 'translateY(-50%)'
        };
      default:
        return {
          ...baseStyle,
          top: overlayStyle.top + overlayStyle.height + tooltipOffset,
          left: Math.max(16, overlayStyle.left + overlayStyle.width / 2),
          transform: 'translateX(-50%)'
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] pointer-events-none"
    >
      {/* Dark overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{
          clipPath: `polygon(0% 0%, 0% 100%, ${overlayStyle.left}px 100%, ${overlayStyle.left}px ${overlayStyle.top}px, ${overlayStyle.left + overlayStyle.width}px ${overlayStyle.top}px, ${overlayStyle.left + overlayStyle.width}px ${overlayStyle.top + overlayStyle.height}px, ${overlayStyle.left}px ${overlayStyle.top + overlayStyle.height}px, ${overlayStyle.left}px 100%, 100% 100%, 100% 0%)`
        }}
      />
      
      {/* Highlight circle */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute border-4 border-blue-400 rounded-lg shadow-lg shadow-blue-400/50"
        style={{
          top: overlayStyle.top - 8,
          left: overlayStyle.left - 8,
          width: overlayStyle.width + 16,
          height: overlayStyle.height + 16,
          background: 'transparent'
        }}
      />

      {/* Pulsing effect */}
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute border-2 border-blue-300/50 rounded-lg"
        style={{
          top: overlayStyle.top - 12,
          left: overlayStyle.left - 12,
          width: overlayStyle.width + 24,
          height: overlayStyle.height + 24,
          background: 'transparent'
        }}
      />
      
      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="pointer-events-auto"
        style={getTooltipPosition()}
      >
        <Card className="bg-white dark:bg-gray-800 shadow-2xl border-2 border-blue-400">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                {step.title}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Step {TUTORIAL_STEPS.findIndex(s => s.id === step.id) + 1} of {totalSteps}</span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${((TUTORIAL_STEPS.findIndex(s => s.id === step.id) + 1) / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
              {step.description}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={onNext}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {TUTORIAL_STEPS.findIndex(s => s.id === step.id) === totalSteps - 1 ? 'Finish Tour' : 'Next'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-300 dark:border-gray-600"
              >
                Skip Tour
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

// Mock Questionnaire Component (EXACT same structure as original)
const MockQuestionnaire = ({ onComplete }) => {
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
    
    // Recovery (Elite)
    sleep: 7,
    stress: [],
    recovery: [],
    
    // Lifestyle (Elite)
    occupation: '',
    activityLevel: 'moderate',
    hobbies: [],
    energy: 5,
    
    // Medical (Elite)
    medicalConditions: [],
    injuries: [],
    medications: [],
    allergies: [],
  });

  // Get available sections based on subscription tier
  const availableSections = SUBSCRIPTION_TIERS.premium.sections; // Mock as premium
  
  // Define sections based on subscription tier (exact same as original)
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
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Get the current section component based on the step (exact same as original)
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
    <div className="questionnaire-fullscreen questionnaire-container w-screen h-dvh overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 dark">
      {/* Animated background elements (exact same as original) */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-600/20 to-rose-700/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-600/20 to-blue-700/20 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-yellow-600/10 to-orange-700/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Main content container (exact same structure as original) */}
      <div className="relative z-0 w-full h-full flex flex-col questionnaire-content pt-16">
        <div className="flex-1 px-2 sm:px-4 lg:px-6 py-1 sm:py-2 lg:py-3 flex flex-col overflow-hidden min-h-0">
          <div className="max-w-6xl mx-auto flex-1 flex flex-col min-h-0 w-full">
            {/* Header with subscription badge */}
            <div className="text-center mb-1 sm:mb-2 lg:mb-3 flex-shrink-0">              
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center bg-gray-800/90 backdrop-blur-xl rounded-full px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 border-2 border-gray-700/50 shadow-2xl mb-1 sm:mb-2"
              >
                <div className="p-0.5 sm:p-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mr-1 sm:mr-2">
                  <div className="text-white text-xs sm:text-sm lg:text-base">
                    {SUBSCRIPTION_TIERS.premium.icon}
                  </div>
                </div>
                <span className="font-bold text-xs sm:text-sm lg:text-base text-gray-200">Premium Plan</span>
              </motion.div>
              
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent mb-0.5 sm:mb-1 drop-shadow-lg leading-tight"
              >
                Complete Your Fitness Profile
              </motion.h1>
            </div>

            {/* Progress indicator */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-1 sm:mb-2 lg:mb-3 flex-shrink-0"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs sm:text-sm font-medium text-white/90 dark:text-gray-200/90 drop-shadow">
                  Step {currentStep + 1} of {sections.length}
                </span>
                <span className="text-xs sm:text-sm font-bold text-white dark:text-gray-100 drop-shadow">
                  {Math.round(((currentStep + 1) / sections.length) * 100)}% Complete
                </span>
              </div>
              <div className="h-1 sm:h-1.5 bg-black/20 dark:bg-gray-800/50 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / sections.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-cyan-400 via-white to-pink-400 dark:from-cyan-300 dark:via-blue-200 dark:to-pink-300 rounded-full shadow-lg"
                ></motion.div>
              </div>
            </motion.div>

            {/* Current form section */}
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
                  <Card className="bg-gray-800/80 backdrop-blur-xl shadow-2xl border-0 overflow-hidden flex-1 flex flex-col">
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-1"></div>
                    <CardContent className="questionnaire-card-content pt-2 sm:pt-3 lg:pt-4 pb-2 sm:pb-3 lg:pb-4 flex-1 flex flex-col overflow-hidden">
                      <motion.div 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex items-center mb-2 sm:mb-3 lg:mb-4 flex-shrink-0"
                      >
                        <div className="p-1.5 sm:p-2 lg:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl lg:rounded-2xl mr-2 sm:mr-3 lg:mr-4 shadow-lg">
                          <div className="text-white text-sm sm:text-base lg:text-lg">
                            {sections[currentStep].icon}
                          </div>
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-0.5 sm:mb-1">
                            {sections[currentStep].title}
                          </h2>
                          <p className="text-xs sm:text-sm lg:text-base text-gray-300">
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
                        <Button
                          variant="outline"
                          onClick={handleBack}
                          disabled={currentStep === 0}
                          className="flex items-center px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm lg:text-base font-semibold rounded-lg sm:rounded-xl border-2 bg-gray-700 text-white border-gray-600 hover:bg-gray-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-3 sm:w-4 lg:w-5 h-3 sm:h-4 lg:h-5 mr-1 sm:mr-2" />
                          Back
                        </Button>
                        <Button
                          onClick={handleNext}
                          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white flex items-center px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm lg:text-base font-semibold rounded-lg sm:rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                        >
                          {currentStep === sections.length - 1 ? (
                            <>
                              Complete Profile
                              <CheckCircle className="w-3 sm:w-4 lg:w-5 h-3 sm:h-4 lg:h-5 ml-1 sm:ml-2" />
                            </>
                          ) : (
                            <>
                              Next Step
                              <ChevronRight className="w-3 sm:w-4 lg:w-5 h-3 sm:h-4 lg:h-5 ml-1 sm:ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Form components (exact same as original)
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
            <Label htmlFor="height" className="text-xs sm:text-sm lg:text-base font-medium text-gray-300">Height (cm)</Label>
            <div className="relative">
              <Input
                id="height"
                type="number"
                placeholder="175"
                value={formData.height}
                onChange={(e) => onChange('height', e.target.value)}
                className="h-8 sm:h-10 lg:h-12 text-sm sm:text-base bg-gray-800 border-2 border-blue-700 focus:border-blue-400 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl text-white"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs sm:text-sm">
                📏
              </div>
            </div>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="weight" className="text-xs sm:text-sm lg:text-base font-medium text-gray-300">Weight (kg)</Label>
            <div className="relative">
              <Input
                id="weight"
                type="number"
                placeholder="70"
                value={formData.weight}
                onChange={(e) => onChange('weight', e.target.value)}
                className="h-8 sm:h-10 lg:h-12 text-sm sm:text-base bg-gray-800 border-2 border-green-700 focus:border-green-400 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl text-white"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs sm:text-sm">
                ⚖️
              </div>
            </div>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="age" className="text-xs sm:text-sm lg:text-base font-medium text-gray-300">Age</Label>
            <div className="relative">
              <Input
                id="age"
                type="number"
                placeholder="30"
                value={formData.age}
                onChange={(e) => onChange('age', e.target.value)}
                className="h-8 sm:h-10 lg:h-12 text-sm sm:text-base bg-gray-800 border-2 border-purple-700 focus:border-purple-400 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl text-white"
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

        {/* Scrollable section for time and equipment */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide scrollable-form space-y-2 sm:space-y-3">
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

        {/* Conditional sections based on selected goals */}
        <div className="space-y-2 sm:space-y-3">
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
                <Input
                  type="number"
                  placeholder="Enter your target weight"
                  value={formData.targetWeight}
                  onChange={(e) => onChange('targetWeight', e.target.value)}
                  className="h-10 sm:h-12 text-sm sm:text-base bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 focus:border-purple-500 dark:focus:border-purple-400 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl"
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

// Dashboard Components (exact same structure as original)
const WelcomeHeader = ({ user, subscription, assignedCoach }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="welcome-header bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-xl"
  >
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome back, Demo User! 👋
        </h1>
        <p className="text-blue-100 text-lg">
          Ready to crush your fitness goals today?
        </p>
        {assignedCoach && (
          <p className="text-blue-200 text-sm mt-1">
            Your coach: Coach Sarah Johnson
          </p>
        )}
      </div>
      <div className="subscription-tier">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            {SUBSCRIPTION_TIERS[subscription.subscription].icon}
            <span className="font-semibold">
              {SUBSCRIPTION_TIERS[subscription.subscription].name} Plan
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
          >
            Upgrade Plan
          </Button>
        </div>
      </div>
    </div>
  </motion.div>
);

const StatisticsGrid = ({ stats }) => (
  <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-4">
    {[
      {
        icon: <Dumbbell className="w-6 h-6 text-blue-600" />,
        label: 'Workouts Completed',
        value: stats.workoutsCompleted,
        change: '+3 this week',
        color: 'blue'
      },
      {
        icon: <Trophy className="w-6 h-6 text-orange-600" />,
        label: 'Current Streak',
        value: `${stats.currentStreak} days`,
        change: 'Personal best!',
        color: 'orange'
      },
      {
        icon: <Target className="w-6 h-6 text-green-600" />,
        label: 'Goals Achieved',
        value: stats.goalsAchieved,
        change: '+1 this month',
        color: 'green'
      },
      {
        icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
        label: 'Monthly Progress',
        value: `${stats.monthlyProgress}%`,
        change: 'On track',
        color: 'purple'
      }
    ].map((stat, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              {stat.icon}
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.label}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stat.value}
            </div>
            <div className={`text-xs text-${stat.color}-600 dark:text-${stat.color}-400`}>
              {stat.change}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    ))}
  </div>
);

const UpcomingWorkout = ({ workout }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="upcoming-workout bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Bell className="w-5 h-5 text-blue-600" />
        <div>
          <p className="font-medium text-blue-800 dark:text-blue-300">
            Next workout: {workout.title}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {new Date(workout.date).toLocaleDateString()} at {workout.time}
          </p>
        </div>
      </div>
      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
        View Details
      </Button>
    </div>
  </motion.div>
);

const GoalsSection = ({ goals }) => (
  <Card className="goals-section">
    <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-600" />
          Your Fitness Goals
        </CardTitle>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {goals.slice(0, 3).map((goal) => (
          <div key={goal.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">{goal.title}</h4>
              <Badge variant="outline">{goal.status}</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Progress</span>
                <span>{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} className="h-2" />
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm text-gray-500">Target: {goal.target}</span>
              <Button size="sm" variant="outline">
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const WorkoutsSection = ({ workouts }) => (
  <Card className="workouts-section">
    <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-blue-600" />
          Your Workouts
        </CardTitle>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {workouts.slice(0, 3).map((workout) => (
          <div key={workout.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium">{workout.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(workout.date).toLocaleDateString()} • {workout.duration}
                </p>
              </div>
              <Badge 
                variant={workout.type === 'strength' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {workout.type}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {workout.exercises.slice(0, 2).join(', ')}
                {workout.exercises.length > 2 && ` +${workout.exercises.length - 2} more`}
              </div>
              <Button size="sm">
                <Play className="w-4 h-4 mr-2" />
                Start
              </Button>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const ProgressTracking = () => (
  <Card className="progress-tracking">
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-green-600" />
        Progress Tracking
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600">185 lbs</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Current Weight</div>
          <div className="text-xs text-green-600">-5 lbs this month</div>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">15%</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Body Fat</div>
          <div className="text-xs text-blue-600">-2% this month</div>
        </div>
      </div>
      <Button variant="outline" size="sm" className="w-full mt-4">
        <Plus className="w-4 h-4 mr-2" />
        Add Entry
      </Button>
    </CardContent>
  </Card>
);

// Main Component
const MockCoachingDemo = () => {
  const [showQuestionnaire, setShowQuestionnaire] = useState(true);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const handleQuestionnaireComplete = () => {
    setShowQuestionnaire(false);
    // Start tutorial after a brief delay
    setTimeout(() => {
      setShowTutorial(true);
    }, 1000);
  };

  const handleNextTutorial = () => {
    if (currentTutorialStep < TUTORIAL_STEPS.length - 1) {
      setCurrentTutorialStep(currentTutorialStep + 1);
    } else {
      setShowTutorial(false);
      setTutorialCompleted(true);
    }
  };

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    setTutorialCompleted(true);
  };

  const restartTutorial = () => {
    setCurrentTutorialStep(0);
    setShowTutorial(true);
    setTutorialCompleted(false);
  };

  const startFromQuestionnaire = () => {
    setShowQuestionnaire(true);
    setShowTutorial(false);
    setTutorialCompleted(false);
    setCurrentTutorialStep(0);
  };

  // Show questionnaire first
  if (showQuestionnaire) {
    return <MockQuestionnaire onComplete={handleQuestionnaireComplete} />;
  }

  // Dashboard (exact same structure as original)
  return (
    <div className="min-h-dvh bg-gradient-to-b from-gray-50 to-blue-50 dark:from-gray-950 dark:to-indigo-950 relative">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Mock Coaching Dashboard
          </h1>
          <div className="flex items-center gap-2">
            {tutorialCompleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={restartTutorial}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Restart Tour
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={startFromQuestionnaire}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Restart Demo
            </Button>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
              Demo Mode
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content (exact same structure as original dashboard) */}
      <div className="px-4 py-6 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Welcome Header */}
          <WelcomeHeader 
            user={{ name: 'Demo User' }}
            subscription={mockSubscription}
            assignedCoach={true}
          />

          {/* Upcoming Workout Notification */}
          <UpcomingWorkout workout={mockWorkouts[0]} />

          {/* Navigation Tabs (exact same as original) */}
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <div className="bg-white dark:bg-gray-800 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 shadow-sm px-4 py-2 rounded-t-lg transition-colors duration-300">
              <TabsList className="grid w-full grid-cols-5 bg-gray-100/80 dark:bg-gray-700/50 backdrop-blur-sm">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all duration-300">
                  <BarChart2 className="w-4 h-4 mr-2 inline-block" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="workouts" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all duration-300">
                  <Dumbbell className="w-4 h-4 mr-2 inline-block" />
                  <span className="hidden sm:inline">Workouts</span>
                </TabsTrigger>
                <TabsTrigger value="sessions" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all duration-300">
                  <Calendar className="w-4 h-4 mr-2 inline-block" />
                  <span className="hidden sm:inline">Sessions</span>
                </TabsTrigger>
                <TabsTrigger value="progress" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all duration-300">
                  <Activity className="w-4 h-4 mr-2 inline-block" />
                  <span className="hidden sm:inline">Progress</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all duration-300">
                  <User className="w-4 h-4 mr-2 inline-block" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="space-y-6">
                {/* Statistics Grid */}
                <StatisticsGrid stats={mockSubscription.stats} />

                {/* Goals and Workouts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GoalsSection goals={mockGoals} />
                  <WorkoutsSection workouts={mockWorkouts} />
                </div>

                {/* Progress Tracking */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ProgressTracking />
                  
                  {/* Coach Communication */}
                  <Card className="coach-chat md:col-span-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        Coach Communication
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            Coach Sarah: "Great job on yesterday's workout! Keep up the momentum 💪"
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">2 hours ago</p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm">
                            "Thanks coach! Feeling stronger already 🔥"
                          </p>
                          <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-4">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Open Chat
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Other tabs would show similar content */}
            <TabsContent value="workouts">
              <WorkoutsSection workouts={mockWorkouts} />
            </TabsContent>

            <TabsContent value="sessions">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Demo session data would be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress">
              <ProgressTracking />
            </TabsContent>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Demo profile data would be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Floating Chat Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          size="lg"
          className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <TutorialOverlay
            step={TUTORIAL_STEPS[currentTutorialStep]}
            onNext={handleNextTutorial}
            onClose={handleCloseTutorial}
            totalSteps={TUTORIAL_STEPS.length}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MockCoachingDemo;