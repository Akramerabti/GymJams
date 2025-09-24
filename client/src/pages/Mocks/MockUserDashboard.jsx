import React, { useState, useEffect, useRef} from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Award, Crown, Zap, Calendar, BarChart2, Dumbbell, Activity, Clock, Badge, User, CheckCircle, MessageSquare, Target, X, Send, Star, TrendingUp, TrendingDown, Minus, Plus, ChevronUp, ChevronDown, Edit, Save, Scale, Heart, Edit3, Download, ArrowRight, FileEdit, HelpCircle, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';

// Mock data - Updated to Premium subscription
const mockUser = {
  id: 1,
  name: 'Guest User',
  email: 'guest@example.com',
  firstName: 'Guest',
  lastName: 'User',
  points: 1250,
  user: {
    firstName: 'Guest',
    lastName: 'User'
  }
};

const mockAssignedCoach = {
  id: 1,
  _id: '1',
  firstName: 'Sarah',
  lastName: 'Mitchell',
  profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
  specialties: ['HIIT', 'Weight Training', 'Nutrition'],
  rating: 4.9,
  locationDisplay: 'New York, NY'
};

const mockSubscription = {
  _id: 'sub123',
  subscription: 'premium', // Changed to premium
  coachAssignmentStatus: 'assigned',
  assignedCoach: '1',
  status: 'active',
  startDate: '2024-01-01T00:00:00Z',
  currentPeriodEnd: '2025-02-01T00:00:00Z',
  cancelAtPeriodEnd: false,
  stats: {
    workoutsCompleted: 24,
    currentStreak: 5,
    monthlyProgress: 78,
    goalsAchieved: 3,
    weeklyTarget: 4,
    nutritionCompliance: 85
  },
  workouts: [
    {
      id: 1,
      title: 'Upper Body Strength',
      type: 'strength',
      duration: 45,
      date: '2025-01-15',
      time: '09:00',
      completed: false,
      exercises: [
        { name: 'Push-ups', sets: 3, reps: 12 },
        { name: 'Pull-ups', sets: 3, reps: 8 },
        { name: 'Bench Press', sets: 4, reps: 10 }
      ]
    },
    {
      id: 2,
      title: 'HIIT Cardio',
      type: 'cardio',
      duration: 30,
      date: '2025-01-13',
      time: '18:00',
      completed: true,
      completedDate: '2025-01-13T18:30:00Z'
    },
    {
      id: 3,
      title: 'Lower Body Power',
      type: 'strength',
      duration: 50,
      date: '2025-01-11',
      time: '07:00',
      completed: true,
      completedDate: '2025-01-11T07:50:00Z'
    }
  ],
  progress: {
    weightProgress: [
      { date: '2025-01-01', value: 75, notes: 'Starting weight' },
      { date: '2025-01-08', value: 74.2, notes: 'Good progress' },
      { date: '2025-01-15', value: 73.8, notes: 'Steady decline' }
    ],
    strengthProgress: [
      { date: '2025-01-01', value: 100, notes: 'Bench press baseline' },
      { date: '2025-01-08', value: 105, notes: 'Increased weight' },
      { date: '2025-01-15', value: 110, notes: 'New PR!' }
    ],
    bodyFatProgress: [
      { date: '2025-01-01', value: 18.5, notes: 'Starting body fat' },
      { date: '2025-01-08', value: 17.8, notes: 'Reducing steadily' },
      { date: '2025-01-15', value: 17.2, notes: 'Good progress' }
    ],
    cardioProgress: [
      { date: '2025-01-01', value: 12, notes: 'Mile run time' },
      { date: '2025-01-08', value: 11.5, notes: 'Improving' },
      { date: '2025-01-15', value: 11.2, notes: 'New personal best' }
    ]
  }
};

const mockQuestionnaire = {
  completed: true,
  data: {
    age: '28',
    goals: ['strength', 'weight_loss'],
    experience: 'intermediate',
    availability: '4-5 days per week',
    injuries: 'None',
    preferredWorkouts: ['Strength training', 'HIIT'],
    equipment: ['Gym access', 'Dumbbells', 'Resistance bands']
  }
};

const mockGoals = [
  {
    id: 'goal-1',
    title: 'Strength Improvement',
    type: 'strength',
    target: 'Increase bench press by 10%',
    progress: 65,
    difficulty: 'medium',
    due: 'Feb 15, 2025',
    status: 'active',
    icon: <Dumbbell className="w-6 h-6 text-blue-600" />
  },
  {
    id: 'goal-2',
    title: 'Workout Consistency',
    type: 'consistency',
    target: '4 workouts per week',
    progress: 85,
    difficulty: 'easy',
    due: 'Jan 31, 2025',
    status: 'active',
    icon: <Calendar className="w-6 h-6 text-green-600" />
  },
  {
    id: 'goal-3',
    title: 'Weight Loss Goal',
    type: 'weight',
    target: 'Lose 5kg in 2 months',
    progress: 100,
    difficulty: 'hard',
    due: 'Jan 10, 2025',
    status: 'completed',
    completed: true,
    completedDate: '2025-01-10',
    pointsAwarded: 150,
    icon: <BarChart2 className="w-6 h-6 text-red-600" />
  }
];

const mockChatMessages = [
  {
    id: 1,
    senderId: '1',
    senderName: 'Sarah Mitchell',
    message: 'Great work on your workouts this week! How are you feeling about the increased intensity?',
    timestamp: new Date(Date.now() - 3600000),
    isCoach: true
  },
  {
    id: 2,
    senderId: 'user1',
    senderName: 'Guest User',
    message: 'Thanks! I\'m feeling stronger already. The upper body workouts are challenging but I love the progress.',
    timestamp: new Date(Date.now() - 1800000),
    isCoach: false
  },
  {
    id: 3,
    senderId: '1',
    senderName: 'Sarah Mitchell',
    message: 'That\'s exactly what we want to hear! Keep it up and remember to focus on proper form over speed.',
    timestamp: new Date(Date.now() - 900000),
    isCoach: true
  }
];

const SUBSCRIPTION_TIERS = {
  basic: {
    name: 'Basic',
    color: 'from-blue-500 to-blue-600',
    gradientBg: 'bg-gradient-to-r from-blue-400/20 to-blue-500/20',
    borderColor: 'border-blue-200',
    shadow: 'shadow-blue-200/30',
    icon: <Award className="w-8 h-8 text-blue-500" />,
    upgrade: 'premium',
    features: ['Weekly workout plans', 'Basic progress tracking', 'Coach messaging'],
    canRequestPlanUpdate: false,
  },
  premium: {
    name: 'Premium',
    color: 'from-purple-500 to-purple-600',
    gradientBg: 'bg-gradient-to-r from-purple-400/20 to-purple-500/20',
    borderColor: 'border-purple-200',
    shadow: 'shadow-purple-200/30',
    icon: <Crown className="w-8 h-8 text-purple-500" />,
    upgrade: 'elite',
    features: ['Custom workout plans', 'Comprehensive progress tracking', 'Nutrition guidance', 'Priority coach support'],
    canRequestPlanUpdate: true,
    planUpdateFrequency: 'weekly',
  },
  elite: {
    name: 'Elite',
    color: 'from-amber-500 to-amber-600',
    gradientBg: 'bg-gradient-to-r from-amber-400/20 to-amber-500/20',
    borderColor: 'border-amber-200',
    shadow: 'shadow-amber-200/30',
    icon: <Zap className="w-8 h-8 text-amber-500" />,
    upgrade: null,
    features: ['Personalized workout plans', 'Advanced progress analytics', 'Custom nutrition plans', 'Daily coach support', 'Recovery tracking'],
    canRequestPlanUpdate: true,
    planUpdateFrequency: 'anytime',
  }
};

// Tutorial Steps Configuration
const TUTORIAL_STEPS = [
  {
    id: 1,
    target: 'welcome-header',
    title: 'Welcome to Your Dashboard',
    content: 'This is your personalized fitness dashboard. Here you can see your subscription details and connect with your coach.',
    position: 'bottom',
    tab: 'overview'
  },
  {
    id: 2,
    target: 'stats-grid',
    title: 'Your Fitness Stats',
    content: 'Track your key metrics at a glance. These cards show your workouts completed, current streak, monthly progress, and goals achieved.',
    position: 'bottom',
    tab: 'overview'
  },
  {
    id: 3,
    target: 'navigation-tabs',
    title: 'Navigation Tabs',
    content: 'Switch between different sections of your dashboard using these tabs. Each tab provides specific information and tools.',
    position: 'bottom',
    tab: 'overview'
  },
  {
    id: 4,
    target: 'goals-section',
    title: 'Your Fitness Goals',
    content: 'Set and track your fitness goals here. Monitor progress and request completion when you achieve them.',
    position: 'top',
    tab: 'overview'
  },
  {
    id: 5,
    target: 'workouts-section',
    title: 'Workout Schedule',
    content: 'View your recent and upcoming workouts. Mark them complete when finished to track your progress.',
    position: 'top',
    tab: 'overview'
  },
  {
    id: 6,
    target: 'progress-metrics',
    title: 'Health Metrics',
    content: 'Track detailed health metrics over time including weight, body fat, strength, and cardio fitness. Add new entries to see your progress trends.',
    position: 'top',
    tab: 'progress'
  },
  {
    id: 7,
    target: 'profile-section',
    title: 'Your Profile',
    content: 'Manage your subscription, fitness profile, and export your data. Keep your information up to date for personalized coaching.',
    position: 'top',
    tab: 'profile'
  },
  {
    id: 8,
    target: 'chat-button',
    title: 'Message Your Coach',
    content: 'Click here to chat with your assigned coach. Get personalized advice and support whenever you need it.',
    position: 'top',
    tab: 'overview'
  }
];

// Helper components
const StatCard = ({ title, value, previousValue, icon, trend, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    onClick={onClick}
    className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
          {trend === 'up' && <TrendingUp className="w-4 h-4 mr-1" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4 mr-1" />}
          {trend === 'neutral' && <Minus className="w-4 h-4 mr-1" />}
        </div>
      )}
    </div>
    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
    <p className="text-gray-600 dark:text-gray-300 text-sm">{title}</p>
    {previousValue !== undefined && (
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Previously: {previousValue}
      </p>
    )}
  </motion.div>
);

const Progress = ({ value, className = '' }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div
      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatTime = (date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Tutorial Overlay Component
const TutorialOverlay = ({ 
  step, 
  onNext, 
  onPrevious, 
  onSkip, 
  totalSteps,
  targetRef 
}) => {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState('bottom');
  const tooltipRef = useRef(null);

  useEffect(() => {
    const updatePosition = () => {
      if (targetRef?.current && tooltipRef.current) {
        const targetRect = targetRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const padding = 20;
        
        let top = 0;
        let left = 0;
        let arrow = step.position || 'bottom';

        // Calculate horizontal position
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        
        // Keep tooltip within viewport horizontally
        if (left < padding) {
          left = padding;
        } else if (left + tooltipRect.width > window.innerWidth - padding) {
          left = window.innerWidth - tooltipRect.width - padding;
        }

        // Calculate vertical position based on preference
        if (arrow === 'top') {
          top = targetRect.bottom + 10;
          // If tooltip would go below viewport, position above
          if (top + tooltipRect.height > window.innerHeight - padding) {
            top = targetRect.top - tooltipRect.height - 10;
            arrow = 'bottom';
          }
        } else {
          top = targetRect.top - tooltipRect.height - 10;
          // If tooltip would go above viewport, position below
          if (top < padding) {
            top = targetRect.bottom + 10;
            arrow = 'top';
          }
        }

        setTooltipPosition({ top, left });
        setArrowPosition(arrow);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [targetRef, step]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] pointer-events-none"
    >
      {/* Dark overlay with cutout */}
      <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={onSkip} />
      
      {/* Highlight box */}
      {targetRef?.current && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute border-4 border-blue-500 rounded-lg pointer-events-none"
          style={{
            top: targetRef.current.getBoundingClientRect().top - 4,
            left: targetRef.current.getBoundingClientRect().left - 4,
            width: targetRef.current.getBoundingClientRect().width + 8,
            height: targetRef.current.getBoundingClientRect().height + 8,
          }}
        />
      )}

      {/* Tooltip */}
      <motion.div
        ref={tooltipRef}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute bg-white rounded-lg shadow-2xl p-6 w-80 pointer-events-auto"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Arrow */}
        <div
          className={`absolute w-0 h-0 ${
            arrowPosition === 'top'
              ? '-top-2 left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white'
              : '-bottom-2 left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white'
          }`}
        />

        {/* Content */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
          <p className="text-gray-600">{step.content}</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i < step.id ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {step.id} of {totalSteps}
          </span>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <button
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700 flex items-center"
          >
            <SkipForward className="w-4 h-4 mr-1" />
            Skip Tour
          </button>
          <div className="flex space-x-2">
            {step.id > 1 && (
              <button
                onClick={onPrevious}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onNext}
              className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              {step.id === totalSteps ? 'Finish' : 'Next'}
              {step.id < totalSteps && <ChevronRight className="w-4 h-4 ml-1" />}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Progress Ring Component
const ProgressRing = ({ progress, size = 140, strokeWidth = 12 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-blue-600 transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute text-3xl font-bold">{progress}%</span>
    </div>
  );
};

// MetricCard Component
const MetricCard = ({ title, data = [], unit, change, color = 'blue', isPositiveGood = true, onAddEntry }) => {
  const safeData = Array.isArray(data) ? data : [];
  const hasEnoughData = safeData.length >= 2;
  const isGoodChange = (change > 0 && isPositiveGood) || (change < 0 && !isPositiveGood);
  
  const values = safeData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  const generateAreaPath = (data, minValue, maxValue) => {
    if (data.length < 2) return '';
    
    const valueRange = maxValue - minValue || 1;
    let path = `M 0 ${100 - ((data[0].value - minValue) / valueRange * 100)}`;
    
    for (let i = 1; i < data.length; i++) {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((data[i].value - minValue) / valueRange * 100);
      path += ` L ${x} ${y}`;
    }
    
    path += ` L 100 100 L 0 100 Z`;
    
    return path;
  };

  const getColorValue = (color, shade) => {
    const colorMap = {
      blue: { 500: '#3b82f6' },
      green: { 500: '#22c55e' },
      red: { 500: '#ef4444' },
      amber: { 500: '#f59e0b' },
      purple: { 500: '#8b5cf6' },
    };
    return colorMap[color]?.[500] || colorMap.blue[500];
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-lg border shadow-sm"
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-700">{title}</h3>
        <div className="flex items-center space-x-2">
          {change !== undefined && (
            <div className={`flex items-center ${isGoodChange ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? (
                <ChevronUp className="w-4 h-4 mr-1" />
              ) : (
                <ChevronDown className="w-4 h-4 mr-1" />
              )}
              <span className="text-xs">{Math.abs(change).toFixed(1)}{unit}</span>
            </div>
          )}
          <button 
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            onClick={onAddEntry}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="h-32 relative">
        {hasEnoughData ? (
          <svg width="100%" height="100%" className="overflow-visible">
            <defs>
              <linearGradient id={`gradient-${color}-${title.replace(/\s+/g, '-').toLowerCase()}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={getColorValue(color, 500)} stopOpacity="0.2" />
                <stop offset="100%" stopColor={getColorValue(color, 500)} stopOpacity="0" />
              </linearGradient>
            </defs>
            
            <path
              d={generateAreaPath(safeData, minValue, maxValue)}
              fill={`url(#gradient-${color}-${title.replace(/\s+/g, '-').toLowerCase()})`}
            />
            
            {safeData.map((point, i) => {
              if (i === 0) return null;
              
              const prevPoint = safeData[i - 1];
              const x1 = ((i - 1) / (safeData.length - 1)) * 100;
              const y1 = 100 - ((prevPoint.value - minValue) / valueRange * 100);
              const x2 = (i / (safeData.length - 1)) * 100;
              const y2 = 100 - ((point.value - minValue) / valueRange * 100);
              
              return (
                <line
                  key={`line-${i}`}
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke={getColorValue(color, 500)}
                  strokeWidth="2"
                />
              );
            })}
            
            {safeData.map((point, i) => {
              const x = (i / (safeData.length - 1)) * 100;
              const y = 100 - ((point.value - minValue) / valueRange * 100);
              
              return (
                <circle
                  key={`circle-${i}`}
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="3"
                  fill="white"
                  stroke={getColorValue(color, 500)}
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            {safeData.length === 1 ? (
              <div className="text-center">
                <div className="text-xl font-bold mb-2">{safeData[0].value}{unit}</div>
                <div className="text-xs text-gray-500">{formatDate(safeData[0].date)}</div>
              </div>
            ) : (
              <p>No data available</p>
            )}
          </div>
        )}
        
        {hasEnoughData && (
          <>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
              <span>{formatDate(safeData[0].date)}</span>
              <span>{formatDate(safeData[safeData.length - 1].date)}</span>
            </div>
            
            <div className="absolute top-0 right-0 text-lg font-bold">
              {safeData[safeData.length - 1].value}{unit}
            </div>
          </>
        )}
      </div>
      
      {safeData.length > 0 && (
        <div className="mt-3 text-xs text-right">
          <button className="text-blue-600 hover:text-blue-700 transition-colors">
            View History
          </button>
        </div>
      )}
    </motion.div>
  );
};

// WelcomeHeader Component
const WelcomeHeader = ({ 
  user, 
  subscription, 
  assignedCoach, 
  onChatOpen, 
  onUpgradeClick,
  onRateCoach
}) => {
  const getUserFirstName = () => {
    return user?.user?.firstName || user?.firstName || 'Guest';
  };
  
  const currentTier = SUBSCRIPTION_TIERS[subscription?.subscription || 'premium'];
  
  return (
    <motion.div
      id="welcome-header"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-8 rounded-2xl bg-gradient-to-r ${currentTier.color} text-white shadow-lg`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-6 sm:space-y-0">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {getUserFirstName()}!
          </h1>
          <div className="flex items-center justify-center sm:justify-start">
            {currentTier.icon}
            <span className="ml-2 text-lg">{currentTier.name} Plan</span>
          </div>
          
          {assignedCoach && (
            <div className="mt-4 flex items-center space-x-3 justify-center sm:justify-start">
              <div className="p-2 bg-white/20 rounded-full">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Coach: {assignedCoach.firstName} {assignedCoach.lastName}
                </h3>
                <p className="text-sm text-white/80">
                  Specialties: {assignedCoach.specialties?.join(', ') || 'Fitness Training'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center sm:items-end space-y-4 w-full sm:w-auto">
          {assignedCoach && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full sm:w-auto"
              >
                <button
                  onClick={onChatOpen}
                  className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Message Coach
                </button>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full sm:w-auto"
              >
                <button
                  onClick={onRateCoach}
                  className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                  title="Rate your coach"
                >
                  <Star className="w-5 h-5 mr-2" />
                  Rate Coach
                </button>
              </motion.div>
            </>
          )}
          
          {currentTier.upgrade && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full sm:w-auto"
            >
              <button
                onClick={onUpgradeClick}
                className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                Upgrade to {SUBSCRIPTION_TIERS[currentTier.upgrade].name}
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ProgressSection Component
const ProgressSection = ({ 
  stats, 
  healthMetrics, 
  onUpdateStats,
  onAddMetricEntry
}) => {
  const [activeMetric, setActiveMetric] = useState(null);
  const [isMetricDialogOpen, setIsMetricDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  
  const calculateChange = (data) => {
    if (!data || data.length < 2) return undefined;
    const latest = data[data.length - 1].value;
    const earliest = data[0].value;
    return latest - earliest;
  };
  
  const handleAddMetricEntry = (metricType) => {
    const metricData = healthMetrics[metricType];
    const lastValue = metricData && metricData.length > 0 
      ? metricData[metricData.length - 1].value 
      : '';
      
    setActiveMetric({
      type: metricType,
      lastValue: lastValue.toString(),
      label: {
        weight: 'Weight',
        bodyFat: 'Body Fat',
        strength: 'Strength',
        cardio: 'Cardio'
      }[metricType],
      unit: {
        weight: 'lbs',
        bodyFat: '%',
        strength: 'lbs',
        cardio: 'min'
      }[metricType]
    });
    
    setIsMetricDialogOpen(true);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex flex-row justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Overall Progress</h2>
            <button
              onClick={() => setIsStatsDialogOpen(true)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Update Stats
            </button>
          </div>
          <div className="flex flex-col items-center">
            <ProgressRing progress={stats?.monthlyProgress || 0} />
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              {stats?.monthlyProgress >= 75 
                ? 'Excellent progress!' 
                : stats?.monthlyProgress >= 50 
                  ? 'Good progress!' 
                  : stats?.monthlyProgress >= 25 
                    ? 'You\'re making progress!' 
                    : 'Just getting started!'}
            </p>
            <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-sm">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <p className="text-sm text-gray-500 dark:text-gray-400">Workouts</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats?.workoutsCompleted || 0}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <p className="text-sm text-gray-500 dark:text-gray-400">Streak</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats?.currentStreak || 0} days</p>
              </div>
            </div>
          </div>
        </div>
        
        <div id="progress-metrics" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Health Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard 
              title="Weight Tracking" 
              data={healthMetrics.weight} 
              unit="lbs" 
              change={calculateChange(healthMetrics.weight)}
              color="blue"
              isPositiveGood={false}
              onAddEntry={() => handleAddMetricEntry('weight')}
            />
            
            <MetricCard 
              title="Body Fat" 
              data={healthMetrics.bodyFat} 
              unit="%" 
              change={calculateChange(healthMetrics.bodyFat)}
              color="amber"
              isPositiveGood={false}
              onAddEntry={() => handleAddMetricEntry('bodyFat')}
            />
            
            <MetricCard 
              title="Strength" 
              data={healthMetrics.strength} 
              unit="lbs" 
              change={calculateChange(healthMetrics.strength)}
              color="green"
              isPositiveGood={true}
              onAddEntry={() => handleAddMetricEntry('strength')}
            />
            
            <MetricCard 
              title="Cardio Fitness" 
              data={healthMetrics.cardio} 
              unit="min" 
              change={calculateChange(healthMetrics.cardio)}
              color="red"
              isPositiveGood={false}
              onAddEntry={() => handleAddMetricEntry('cardio')}
            />
          </div>
        </div>
      </div>
      
      {/* Mock dialogs - just show alert for demo */}
      {isMetricDialogOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsMetricDialogOpen(false)}
        >
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Metric Entry</h3>
            <p className="text-gray-600 mb-4">This is a demo - metric entry dialog would appear here.</p>
            <button
              onClick={() => setIsMetricDialogOpen(false)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {isStatsDialogOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsStatsDialogOpen(false)}
        >
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Update Stats</h3>
            <p className="text-gray-600 mb-4">This is a demo - stats update dialog would appear here.</p>
            <button
              onClick={() => setIsStatsDialogOpen(false)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ProfileSection Component
const ProfileSection = ({ 
  subscription, 
  questionnaire, 
  currentTier, 
  onEditQuestionnaire, 
  onManageSubscription, 
  onUpgradeClick 
}) => {
  return (
    <div id="profile-section" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Subscription Details</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-medium text-gray-900 dark:text-white">Plan</span>
              <span className="flex items-center text-gray-900 dark:text-white">
                {currentTier.icon && <span className="w-5 h-5 mr-2">{currentTier.icon}</span>}
                {currentTier.name}
              </span>
            </div>            
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-medium text-gray-900 dark:text-white">Status</span>
              <span className={`px-2 py-1 rounded-full text-sm font-medium border ${
                subscription?.status === 'active' 
                  ? "bg-green-50 text-green-700 border-green-200"
                  : subscription?.status === 'cancelled'
                  ? "bg-red-50 text-red-700 border-red-200"
                  : subscription?.status === 'past_due'
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-gray-50 text-gray-700 border-gray-200"
              }`}>
                {subscription?.status === 'active' 
                  ? 'Active' 
                  : subscription?.status === 'cancelled'
                  ? 'Cancelled'
                  : subscription?.status === 'past_due'
                  ? 'Past Due'
                  : subscription?.status || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-medium text-gray-900 dark:text-white">Start Date</span>
              <span className="text-gray-900 dark:text-white">{subscription?.startDate ? formatDate(subscription.startDate) : 'N/A'}</span>
            </div>
            
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-medium text-gray-900 dark:text-white">
                {subscription?.status === 'cancelled' ? 'Ended' : 'Next Billing'}
              </span>
              <span className="text-gray-900 dark:text-white">
                {subscription?.status === 'cancelled' && subscription?.endDate
                  ? formatDate(subscription.endDate)
                  : subscription?.currentPeriodEnd 
                  ? formatDate(subscription.currentPeriodEnd)
                  : 'N/A'}
              </span>
            </div>            
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900 dark:text-white">Auto-Renewal</span>
              <span className={`px-2 py-1 rounded-full text-sm font-medium border ${
                subscription?.status === 'cancelled'
                  ? "bg-gray-50 text-gray-700 border-gray-200"
                  : subscription?.cancelAtPeriodEnd 
                  ? "bg-amber-50 text-amber-700 border-amber-200" 
                  : "bg-green-50 text-green-700 border-green-200"
              }`}>
                {subscription?.status === 'cancelled' 
                  ? 'N/A' 
                  : subscription?.cancelAtPeriodEnd 
                  ? 'Off' 
                  : 'On'}
              </span>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <button 
              onClick={onManageSubscription}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Manage Subscription
            </button>
            {currentTier.upgrade && (
              <button 
                onClick={onUpgradeClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Upgrade Plan
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex flex-row items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fitness Profile</h2>
            <button
              onClick={onEditQuestionnaire}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
          </div>
          {questionnaire && questionnaire.data && Object.keys(questionnaire.data).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(questionnaire.data)
                .filter(([key, value]) => {
                  if (value === null || value === undefined || value === '') return false;
                  if (Array.isArray(value) && value.length === 0) return false;
                  return true;
                })
                .map(([key, value]) => (
                  <div key={key} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </h3>
                    <p className="text-gray-900 dark:text-white">
                      {Array.isArray(value) ? value.join(', ') : value}
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">No fitness profile data available.</p>
          )}
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Data Export</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Download your fitness data including workouts, progress metrics, and goals.
          </p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(mockChatMessages);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  
  // Refs for tutorial targets
  const welcomeHeaderRef = useRef(null);
  const statsGridRef = useRef(null);
  const navigationTabsRef = useRef(null);
  const goalsSectionRef = useRef(null);
  const workoutsSectionRef = useRef(null);
  const progressMetricsRef = useRef(null);
  const profileSectionRef = useRef(null);
  const chatButtonRef = useRef(null);

  const currentTier = SUBSCRIPTION_TIERS[mockSubscription.subscription];

  // Start tutorial
  const startTutorial = () => {
    setShowTutorial(true);
    setCurrentTutorialStep(0);
  };

  // End tutorial
  const endTutorial = () => {
    setShowTutorial(false);
    setCurrentTutorialStep(0);
  };

  // Next tutorial step
  const nextTutorialStep = () => {
    if (currentTutorialStep < TUTORIAL_STEPS.length - 1) {
      const nextStep = currentTutorialStep + 1;
      setCurrentTutorialStep(nextStep);
      
      // Switch tabs if needed for the next step
      const nextStepConfig = TUTORIAL_STEPS[nextStep];
      if (nextStepConfig.tab && nextStepConfig.tab !== activeTab) {
        setActiveTab(nextStepConfig.tab);
      }
    } else {
      endTutorial();
    }
  };

  // Previous tutorial step
  const previousTutorialStep = () => {
    if (currentTutorialStep > 0) {
      const prevStep = currentTutorialStep - 1;
      setCurrentTutorialStep(prevStep);
      
      // Switch tabs if needed for the previous step
      const prevStepConfig = TUTORIAL_STEPS[prevStep];
      if (prevStepConfig.tab && prevStepConfig.tab !== activeTab) {
        setActiveTab(prevStepConfig.tab);
      }
    }
  };

  // Get current target ref based on tutorial step
  const getCurrentTargetRef = () => {
    const currentStep = TUTORIAL_STEPS[currentTutorialStep];
    if (!currentStep) return null;

    switch (currentStep.target) {
      case 'welcome-header': return welcomeHeaderRef;
      case 'stats-grid': return statsGridRef;
      case 'navigation-tabs': return navigationTabsRef;
      case 'goals-section': return goalsSectionRef;
      case 'workouts-section': return workoutsSectionRef;
      case 'progress-metrics': return progressMetricsRef;
      case 'profile-section': return profileSectionRef;
      case 'chat-button': return chatButtonRef;
      default: return null;
    }
  };

  // Auto-start tutorial on component mount (for demo purposes)
  useEffect(() => {
    const timer = setTimeout(() => {
      startTutorial();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg = {
      id: messages.length + 1,
      senderId: 'user1',
      senderName: 'Guest User',
      message: newMessage,
      timestamp: new Date(),
      isCoach: false
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  const handleWorkoutComplete = (workoutId) => {
    // In a real app, this would update the backend
    console.log(`Workout ${workoutId} marked as complete`);
  };

  const handleGoalComplete = (goalId) => {
    // In a real app, this would update the backend
    console.log(`Goal ${goalId} marked as complete`);
  };

  const handleUpgradeClick = () => {
    alert(`Upgrade to ${currentTier.upgrade} plan clicked!`);
  };

  const handleRateCoach = () => {
    alert('Rate coach functionality would open here!');
  };

  const handleEditQuestionnaire = () => {
    alert('Edit questionnaire functionality would open here!');
  };

  const handleManageSubscription = () => {
    alert('Manage subscription functionality would open here!');
  };

  const handleUpdateStats = () => {
    alert('Update stats functionality would open here!');
  };

  const handleAddMetricEntry = () => {
    alert('Add metric entry functionality would open here!');
  };

  // Stats cards data
  const statsCards = [
    {
      title: 'Workouts Completed',
      value: mockSubscription.stats.workoutsCompleted,
      icon: <Dumbbell className="w-6 h-6 text-white" />,
      trend: 'up'
    },
    {
      title: 'Current Streak',
      value: `${mockSubscription.stats.currentStreak} days`,
      icon: <Activity className="w-6 h-6 text-white" />,
      trend: 'up'
    },
    {
      title: 'Monthly Progress',
      value: `${mockSubscription.stats.monthlyProgress}%`,
      icon: <TrendingUp className="w-6 h-6 text-white" />,
      trend: 'up'
    },
    {
      title: 'Goals Achieved',
      value: mockSubscription.stats.goalsAchieved,
      icon: <Target className="w-6 h-6 text-white" />,
      trend: 'neutral'
    }
  ];

  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4" style={{ position: 'relative' }}>
      {/* Leave Mock Button on the right */}
      <button
        style={{
          position: 'absolute',
          top: 80,
          right: 30,
          padding: '8px 16px',
          fontSize: '0.9rem',
          background: 'rgba(30, 41, 59, 0.6)', // dark slate, 60% opacity
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
        onClick={() => navigate('/')}
      >
        Leave
      </button>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Tutorial Help Button */}
        <div className="flex justify-end">
          <button
            onClick={startTutorial}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
            <span>Show Tutorial</span>
          </button>
        </div>

        {/* Welcome Header */}
        <div ref={welcomeHeaderRef}>
          <WelcomeHeader
            user={mockUser}
            subscription={mockSubscription}
            assignedCoach={mockAssignedCoach}
            onChatOpen={() => setIsChatOpen(true)}
            onUpgradeClick={handleUpgradeClick}
            onRateCoach={handleRateCoach}
          />
        </div>

        {/* Stats Grid */}
        <div ref={statsGridRef} id="stats-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
              onClick={handleUpdateStats}
            />
          ))}
        </div>

        {/* Navigation Tabs */}
        <div ref={navigationTabsRef} id="navigation-tabs" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {['overview', 'progress', 'profile'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Goals Section */}
                <div ref={goalsSectionRef} id="goals-section" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Goals</h2>
                    <button className="text-blue-600 hover:text-blue-700 transition-colors">
                      View All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockGoals.map((goal) => (
                      <div key={goal.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {goal.icon}
                            <span className="font-medium text-gray-900 dark:text-white">{goal.title}</span>
                          </div>
                          {goal.completed && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{goal.target}</p>
                        <Progress value={goal.progress} className="mb-2" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Progress: {goal.progress}%</span>
                          <span>Due: {goal.due}</span>
                        </div>
                        {!goal.completed && (
                          <button
                            onClick={() => handleGoalComplete(goal.id)}
                            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workouts Section */}
                <div ref={workoutsSectionRef} id="workouts-section" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Workouts</h2>
                  <div className="space-y-4">
                    {mockSubscription.workouts.map((workout) => (
                      <div key={workout.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${workout.completed ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                            {workout.type === 'strength' ? <Dumbbell className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">{workout.title}</h3>
                            <p className="text-sm text-gray-500">
                              {formatDate(workout.date)} • {workout.duration}min
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {workout.completed ? (
                            <span className="text-green-600 font-medium">Completed</span>
                          ) : (
                            <button
                              onClick={() => handleWorkoutComplete(workout.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'progress' && (
              <ProgressSection
                stats={mockSubscription.stats}
                healthMetrics={mockSubscription.progress}
                onUpdateStats={handleUpdateStats}
                onAddMetricEntry={handleAddMetricEntry}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileSection
                subscription={mockSubscription}
                questionnaire={mockQuestionnaire}
                currentTier={currentTier}
                onEditQuestionnaire={handleEditQuestionnaire}
                onManageSubscription={handleManageSubscription}
                onUpgradeClick={handleUpgradeClick}
              />
            )}
          </div>
        </div>

        {/* Floating Chat Button */}
        <div ref={chatButtonRef} id="chat-button" className="fixed bottom-6 right-6">
          <button
            onClick={() => setIsChatOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Modal */}
        {isChatOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Chat with Coach</h3>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isCoach ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.isCoach
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tutorial Overlay */}
        <AnimatePresence>
          {showTutorial && currentTutorialStep < TUTORIAL_STEPS.length && (
            <TutorialOverlay
              step={TUTORIAL_STEPS[currentTutorialStep]}
              onNext={nextTutorialStep}
              onPrevious={previousTutorialStep}
              onSkip={endTutorial}
              totalSteps={TUTORIAL_STEPS.length}
              targetRef={getCurrentTargetRef()}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;