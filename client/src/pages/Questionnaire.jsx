import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, Check, Award, Crown, Zap,
  User, Target, Dumbbell, Apple, Moon, Activity, Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { TextArea } from '@/components/ui/textarea';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '../stores/authStore';
import subscriptionService from '../services/subscription.service';
import { toast } from 'sonner';

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

// Questionnaire components for different sections
const Questionnaire = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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
  
  // Get subscription tier and available sections from location state
  const [subscriptionTier, setSubscriptionTier] = useState('basic');
  const [accessToken, setAccessToken] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [availableSections, setAvailableSections] = useState(SUBSCRIPTION_TIERS.basic.sections);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initQuestionnaire = async () => {
      try {
        // Get data from location state
        const stateSubscription = location.state?.subscription;
        const stateAnswers = location.state?.currentAnswers;
        const stateAccessToken = location.state?.accessToken;
        const stateIsEditing = location.state?.isEditing || false;
        const stateTierSections = location.state?.tierSections;
        
        setIsEditing(stateIsEditing);
        
        if (stateAccessToken) {
          setAccessToken(stateAccessToken);
        }
        
        // If we have a subscription, determine the tier
        if (stateSubscription) {
          setSubscription(stateSubscription);
          const tier = stateSubscription.subscription || 'basic';
          setSubscriptionTier(tier);
          
          // Set available sections based on tier or passed sections
          if (stateTierSections) {
            setAvailableSections(stateTierSections);
          } else {
            setAvailableSections(SUBSCRIPTION_TIERS[tier].sections);
          }
        } else if (!user) {
          // If no user and no subscription in state, try to get subscription from access token
          if (stateAccessToken) {
            const subResponse = await subscriptionService.getCurrentSubscription(stateAccessToken);
            if (subResponse) {
              setSubscription(subResponse);
              const tier = subResponse.subscription || 'basic';
              setSubscriptionTier(tier);
              setAvailableSections(SUBSCRIPTION_TIERS[tier].sections);
            }
          } else {
            // If no access token and no user, redirect to login
            navigate('/login');
            return;
          }
        } else {
          // User is logged in but no subscription passed - try to fetch it
          const subResponse = await subscriptionService.getCurrentSubscription();
          if (subResponse) {
            setSubscription(subResponse);
            const tier = subResponse.subscription || 'basic';
            setSubscriptionTier(tier);
            setAvailableSections(SUBSCRIPTION_TIERS[tier].sections);
          } else {
            navigate('/coaching');
            return;
          }
        }
        
        // If we have existing answers, populate the form
        if (stateAnswers) {
          setFormData(prevData => ({
            ...prevData,
            ...stateAnswers
          }));
        }
        
      } catch (error) {
        console.error('Error initializing questionnaire:', error);
        toast.error('Failed to load questionnaire data');
        navigate('/coaching');
      }
    };

    initQuestionnaire();
  }, [location, navigate, user]);

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
    try {
      setIsSubmitting(true);
      
      // Call the API to submit questionnaire
      const response = await subscriptionService.submitQuestionnaire(
        formData,
        accessToken
      );
      
      if (response) {
        toast.success('Questionnaire submitted successfully!');
        
        // Redirect to dashboard
        navigate('/dashboard', {
          state: {
            accessToken: accessToken || null
          }
        });
      }
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      toast.error('Failed to submit questionnaire. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
      case 'recovery':
        return (
          <RecoveryForm 
            formData={formData} 
            onChange={handleInputChange} 
            onArrayToggle={handleArrayToggle}
          />
        );
      case 'lifestyle':
        return (
          <LifestyleForm 
            formData={formData} 
            onChange={handleInputChange} 
            onArrayToggle={handleArrayToggle}
          />
        );
      case 'medical':
        return (
          <MedicalForm 
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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with subscription badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center bg-white rounded-full px-4 py-2 border shadow-sm mb-4">
            {SUBSCRIPTION_TIERS[subscriptionTier].icon}
            <span className="ml-2 font-medium">{SUBSCRIPTION_TIERS[subscriptionTier].name} Plan</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? 'Update Your Fitness Profile' : 'Complete Your Fitness Profile'}
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            This information helps us create a personalized plan to achieve your fitness goals.
            {subscriptionTier === 'elite' && 
              ' Your Elite plan includes our most comprehensive assessment.'}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {sections.length}
            </span>
            <span className="text-sm font-medium">
              {Math.round(((currentStep + 1) / sections.length) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / sections.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step indicators */}
        <div className="hidden sm:flex justify-between mb-8 px-2">
          {sections.map((section, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`flex flex-col items-center space-y-2 ${
                      index === currentStep
                        ? 'text-blue-600'
                        : index < currentStep
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                    onClick={() => index <= currentStep && setCurrentStep(index)}
                    disabled={index > currentStep}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        index === currentStep
                          ? 'border-blue-600 bg-blue-50'
                          : index < currentStep
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      {index < currentStep ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        section.icon
                      )}
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{section.title}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {/* Current form section */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-lg border-t-4 border-t-blue-600">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-50 rounded-full mr-3">
                    {sections[currentStep].icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {sections[currentStep].title}
                    </h2>
                    <p className="text-gray-600">
                      {sections[currentStep].description}
                    </p>
                  </div>
                </div>

                <div className="space-y-6 py-4">
                  {getCurrentSectionComponent()}
                </div>

                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="flex items-center"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                  >
                    {currentStep === sections.length - 1 ? (
                      isSubmitting ? 'Submitting...' : 'Submit'
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
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
  );
};

// Individual form sections

const BasicInformationForm = ({ formData, onChange }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            placeholder="e.g. 175"
            value={formData.height}
            onChange={(e) => onChange('height', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            placeholder="e.g. 70"
            value={formData.weight}
            onChange={(e) => onChange('weight', e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            placeholder="e.g. 30"
            value={formData.age}
            onChange={(e) => onChange('age', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) => onChange('gender', value)}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

const FitnessBackgroundForm = ({ formData, onChange, onArrayToggle }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Fitness experience level</Label>
        <RadioGroup
          value={formData.experience}
          onValueChange={(value) => onChange('experience', value)}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="beginner" id="beginner" />
            <Label htmlFor="beginner">Beginner (0-1 years)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="intermediate" id="intermediate" />
            <Label htmlFor="intermediate">Intermediate (1-3 years)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="advanced" id="advanced" />
            <Label htmlFor="advanced">Advanced (3+ years)</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="frequency">How many days per week do you want to work out?</Label>
        <Select
          value={formData.frequency.toString()}
          onValueChange={(value) => onChange('frequency', parseInt(value))}
        >
          <SelectTrigger id="frequency">
            <SelectValue placeholder="Select days per week" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} {num === 1 ? 'day' : 'days'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>What time of day do you prefer to exercise?</Label>
        <div className="grid grid-cols-2 gap-2">
          {['morning', 'afternoon', 'evening', 'late night'].map((time) => (
            <div key={time} className="flex items-center space-x-2">
              <Checkbox
                id={`time-${time}`}
                checked={formData.timeOfDay?.includes(time)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onArrayToggle('timeOfDay', time);
                  } else {
                    onArrayToggle('timeOfDay', time);
                  }
                }}
              />
              <Label htmlFor={`time-${time}`} className="capitalize">
                {time}
              </Label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="equipment"
          checked={formData.equipment}
          onCheckedChange={(checked) => onChange('equipment', checked)}
        />
        <Label htmlFor="equipment">
          I have access to gym equipment/facilities
        </Label>
      </div>
    </div>
  );
};

const GoalsForm = ({ formData, onChange, onArrayToggle }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>What are your fitness goals?</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { id: 'weight', label: 'Weight management' },
            { id: 'strength', label: 'Build strength' },
            { id: 'endurance', label: 'Improve endurance' },
            { id: 'flexibility', label: 'Increase flexibility' },
            { id: 'sports', label: 'Sports performance' },
            { id: 'health', label: 'General health' }
          ].map((goal) => (
            <div key={goal.id} className="flex items-center space-x-2">
              <Checkbox
                id={`goal-${goal.id}`}
                checked={formData.goals?.includes(goal.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onArrayToggle('goals', goal.id);
                  } else {
                    onArrayToggle('goals', goal.id);
                  }
                }}
              />
              <Label htmlFor={`goal-${goal.id}`}>{goal.label}</Label>
            </div>
          ))}
        </div>
      </div>
      
      {formData.goals?.includes('weight') && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="targetWeight">Target weight (kg)</Label>
            <Input
              id="targetWeight"
              type="number"
              placeholder="e.g. 65"
              value={formData.targetWeight}
              onChange={(e) => onChange('targetWeight', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timeframe">Timeframe to reach goal</Label>
            <Select
              value={formData.timeframe}
              onValueChange={(value) => onChange('timeframe', value)}
            >
              <SelectTrigger id="timeframe">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-month">1 month</SelectItem>
                <SelectItem value="3-months">3 months</SelectItem>
                <SelectItem value="6-months">6 months</SelectItem>
                <SelectItem value="1-year">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      {/* Additional goals fields can be added based on selected goals */}
    </div>
  );
};

const NutritionForm = ({ formData, onChange, onArrayToggle }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="nutrition">How would you describe your eating habits?</Label>
        <Select
          value={formData.nutrition}
          onValueChange={(value) => onChange('nutrition', value)}
        >
          <SelectTrigger id="nutrition">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="strict">Very strict/controlled</SelectItem>
            <SelectItem value="moderate">Mostly healthy with occasional treats</SelectItem>
            <SelectItem value="flexible">Flexible, no specific regime</SelectItem>
            <SelectItem value="improving">Needs improvement</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Any dietary restrictions or preferences?</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { id: 'vegetarian', label: 'Vegetarian' },
            { id: 'vegan', label: 'Vegan' },
            { id: 'gluten-free', label: 'Gluten-free' },
            { id: 'dairy-free', label: 'Dairy-free' },
            { id: 'keto', label: 'Ketogenic' },
            { id: 'paleo', label: 'Paleo' }
          ].map((diet) => (
            <div key={diet.id} className="flex items-center space-x-2">
              <Checkbox
                id={`diet-${diet.id}`}
                checked={formData.dietRestrictions?.includes(diet.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onArrayToggle('dietRestrictions', diet.id);
                  } else {
                    onArrayToggle('dietRestrictions', diet.id);
                  }
                }}
              />
              <Label htmlFor={`diet-${diet.id}`}>{diet.label}</Label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="mealsPerDay">How many meals do you typically eat per day?</Label>
        <Select
          value={formData.mealsPerDay.toString()}
          onValueChange={(value) => onChange('mealsPerDay', parseInt(value))}
        >
          <SelectTrigger id="mealsPerDay">
            <SelectValue placeholder="Select meals per day" />
          </SelectTrigger>
          <SelectContent>
            {[2, 3, 4, 5, 6].map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} {num === 1 ? 'meal' : 'meals'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="trackCalories"
          checked={formData.trackCalories}
          onCheckedChange={(checked) => onChange('trackCalories', checked)}
        />
        <Label htmlFor="trackCalories">
          I currently track calories and/or macronutrients
        </Label>
      </div>
    </div>
  );
};

const RecoveryForm = ({ formData, onChange, onArrayToggle }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="sleep">How many hours of sleep do you get on average?</Label>
        <Select
          value={formData.sleep.toString()}
          onValueChange={(value) => onChange('sleep', parseInt(value))}
        >
          <SelectTrigger id="sleep">
            <SelectValue placeholder="Select hours" />
          </SelectTrigger>
          <SelectContent>
            {[4, 5, 6, 7, 8, 9, 10].map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} hours
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>How do you manage stress?</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { id: 'meditation', label: 'Meditation' },
            { id: 'yoga', label: 'Yoga' },
            { id: 'reading', label: 'Reading' },
            { id: 'nature', label: 'Time in nature' },
            { id: 'hobbies', label: 'Hobbies' },
            { id: 'social', label: 'Social activities' },
            { id: 'therapy', label: 'Therapy/counseling' },
            { id: 'nothing', label: 'No specific techniques' }
          ].map((item) => (
            <div key={item.id} className="flex items-center space-x-2">
              <Checkbox
                id={`stress-${item.id}`}
                checked={formData.stress?.includes(item.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onArrayToggle('stress', item.id);
                  } else {
                    onArrayToggle('stress', item.id);
                  }
                }}
              />
              <Label htmlFor={`stress-${item.id}`}>{item.label}</Label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>What recovery methods do you currently use?</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { id: 'stretching', label: 'Stretching' },
            { id: 'foam-rolling', label: 'Foam rolling' },
            { id: 'massage', label: 'Massage' },
            { id: 'sauna', label: 'Sauna/steam room' },
            { id: 'ice-bath', label: 'Cold therapy/ice baths' },
            { id: 'compression', label: 'Compression garments' },
            { id: 'nothing', label: 'None currently' }
          ].map((item) => (
            <div key={item.id} className="flex items-center space-x-2">
              <Checkbox
                id={`recovery-${item.id}`}
                checked={formData.recovery?.includes(item.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onArrayToggle('recovery', item.id);
                  } else {
                    onArrayToggle('recovery', item.id);
                  }
                }}
              />
              <Label htmlFor={`recovery-${item.id}`}>{item.label}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LifestyleForm = ({ formData, onChange, onArrayToggle }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="occupation">What is your occupation?</Label>
        <Input
          id="occupation"
          placeholder="e.g. Software Developer"
          value={formData.occupation}
          onChange={(e) => onChange('occupation', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="activityLevel">How active is your daily lifestyle?</Label>
        <Select
          value={formData.activityLevel}
          onValueChange={(value) => onChange('activityLevel', value)}
        >
          <SelectTrigger id="activityLevel">
            <SelectValue placeholder="Select activity level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sedentary">Sedentary (little to no exercise)</SelectItem>
            <SelectItem value="light">Lightly active (light exercise 1-3 days/week)</SelectItem>
            <SelectItem value="moderate">Moderately active (moderate exercise 3-5 days/week)</SelectItem>
            <SelectItem value="active">Very active (hard exercise 6-7 days/week)</SelectItem>
            <SelectItem value="extreme">Extremely active (physical job & hard exercise)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>What are your main hobbies or interests?</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { id: 'reading', label: 'Reading' },
            { id: 'gaming', label: 'Gaming' },
            { id: 'cooking', label: 'Cooking' },
            { id: 'arts', label: 'Arts & Crafts' },
            { id: 'music', label: 'Music' },
            { id: 'outdoors', label: 'Outdoor activities' },
            { id: 'travel', label: 'Travel' },
            { id: 'tech', label: 'Technology' }
          ].map((hobby) => (
            <div key={hobby.id} className="flex items-center space-x-2">
              <Checkbox
                id={`hobby-${hobby.id}`}
                checked={formData.hobbies?.includes(hobby.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onArrayToggle('hobbies', hobby.id);
                  } else {
                    onArrayToggle('hobbies', hobby.id);
                  }
                }}
              />
              <Label htmlFor={`hobby-${hobby.id}`}>{hobby.label}</Label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="energy">Rate your average daily energy level (1-10)</Label>
        <div className="space-y-2">
          <Input
            id="energy"
            type="range"
            min="1"
            max="10"
            value={formData.energy}
            onChange={(e) => onChange('energy', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Low (1)</span>
            <span>Medium (5)</span>
            <span>High (10)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const MedicalForm = ({ formData, onChange, onArrayToggle }) => {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> This information is kept strictly confidential and will only be used to customize your fitness plan safely.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label>Do you have any medical conditions that might affect your exercise?</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { id: 'hypertension', label: 'Hypertension (High blood pressure)' },
            { id: 'heart-disease', label: 'Heart disease' },
            { id: 'diabetes', label: 'Diabetes' },
            { id: 'asthma', label: 'Asthma' },
            { id: 'arthritis', label: 'Arthritis' },
            { id: 'back-pain', label: 'Chronic back pain' },
            { id: 'none', label: 'None' }
          ].map((condition) => (
            <div key={condition.id} className="flex items-center space-x-2">
              <Checkbox
                id={`condition-${condition.id}`}
                checked={formData.medicalConditions?.includes(condition.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onArrayToggle('medicalConditions', condition.id);
                  } else {
                    onArrayToggle('medicalConditions', condition.id);
                  }
                }}
              />
              <Label htmlFor={`condition-${condition.id}`}>{condition.label}</Label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Do you have any current or recurring injuries?</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { id: 'shoulder', label: 'Shoulder injury' },
            { id: 'knee', label: 'Knee injury' },
            { id: 'back', label: 'Back injury' },
            { id: 'ankle', label: 'Ankle/foot injury' },
            { id: 'wrist', label: 'Wrist/hand injury' },
            { id: 'hip', label: 'Hip injury' },
            { id: 'none', label: 'None' }
          ].map((injury) => (
            <div key={injury.id} className="flex items-center space-x-2">
              <Checkbox
                id={`injury-${injury.id}`}
                checked={formData.injuries?.includes(injury.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onArrayToggle('injuries', injury.id);
                  } else {
                    onArrayToggle('injuries', injury.id);
                  }
                }}
              />
              <Label htmlFor={`injury-${injury.id}`}>{injury.label}</Label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Are you currently taking any medications?</Label>
        <TextArea
          placeholder="Please list any medications that might impact your exercise (optional)"
          value={formData.medications.join(', ')}
          onChange={(e) => onChange('medications', e.target.value.split(', ').filter(m => m.trim()))}
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Do you have any allergies we should be aware of?</Label>
        <TextArea
          placeholder="Please list any allergies (optional)"
          value={formData.allergies.join(', ')}
          onChange={(e) => onChange('allergies', e.target.value.split(', ').filter(a => a.trim()))}
          rows={3}
        />
      </div>
    </div>
  );
};

export default Questionnaire;