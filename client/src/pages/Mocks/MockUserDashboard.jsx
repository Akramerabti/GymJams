import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Award, Crown, Zap, Calendar, BarChart2, Dumbbell, Activity, Clock, Badge, User, CheckCircle, MessageSquare, Target, X, Send, Star, TrendingUp, TrendingDown, Minus, Plus, ChevronUp, ChevronDown, Edit, Save, Scale, Heart, Edit3, Download, ArrowRight, FileEdit } from 'lucide-react';

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
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
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
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};

const GoalsSection = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
        <Target className="w-6 h-6 mr-2 text-purple-600" />
        Your Goals
      </h2>
      <button
        className="text-purple-600 hover:text-purple-700 font-medium"
      >
        View All →
      </button>
    </div>
    
    <div className="space-y-4">
      {mockGoals.filter(g => g.status === 'active').slice(0, 2).map(goal => (
        <div key={goal.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              {goal.icon}
              <h3 className="font-semibold ml-2 dark:text-white">{goal.title}</h3>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300">{goal.due}</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-3">{goal.target}</p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} />
          </div>
          <button
            className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors duration-200"
          >
            Request Completion
          </button>
        </div>
      ))}
    </div>
  </div>
);

const WorkoutSection = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
        <Dumbbell className="w-6 h-6 mr-2 text-blue-600" />
        Recent Workouts
      </h2>
      <button
        className="text-blue-600 hover:text-blue-700 font-medium"
      >
        View All →
      </button>
    </div>
    
    <div className="space-y-4">
      {mockSubscription.workouts.slice(0, 3).map(workout => (
        <div key={workout.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold dark:text-white">{workout.title}</h3>
            {workout.completed ? (
              <span className="bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300 px-2 py-1 rounded-full text-sm">
                Completed
              </span>
            ) : (
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 px-2 py-1 rounded-full text-sm">
                Scheduled
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
            {formatDate(workout.date)} • {workout.duration} minutes
          </p>
          {!workout.completed && (
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors duration-200"
            >
              Mark Complete
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);

const MockUserDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showChat, setShowChat] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [chatMessages, setChatMessages] = useState(mockChatMessages);

  const currentTier = SUBSCRIPTION_TIERS[mockSubscription?.subscription || 'premium'];
  const upcomingWorkout = mockSubscription.workouts.find(w => !w.completed && new Date(w.date) >= new Date());
  const historicalStats = {
    workoutsCompleted: mockSubscription.stats.workoutsCompleted - 2,
    currentStreak: mockSubscription.stats.currentStreak - 1,
    monthlyProgress: mockSubscription.stats.monthlyProgress - 5,
    goalsAchieved: mockSubscription.stats.goalsAchieved
  };

  const healthMetrics = {
    weight: mockSubscription.progress.weightProgress || [],
    bodyFat: mockSubscription.progress.bodyFatProgress || [],
    strength: mockSubscription.progress.strengthProgress || [],
    cardio: mockSubscription.progress.cardioProgress || [],
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: chatMessages.length + 1,
      senderId: 'user1',
      senderName: mockUser.firstName + ' ' + mockUser.lastName,
      message: newMessage,
      timestamp: new Date(),
      isCoach: false
    };

    setChatMessages([...chatMessages, message]);
    setNewMessage('');

    setTimeout(() => {
      const coachResponse = {
        id: chatMessages.length + 2,
        senderId: '1',
        senderName: mockAssignedCoach.firstName + ' ' + mockAssignedCoach.lastName,
        message: "Thanks for your message! I'll review this and get back to you with personalized advice.",
        timestamp: new Date(),
        isCoach: true
      };
      setChatMessages(prev => [...prev, coachResponse]);
    }, 2000);
  };

  const handleRateCoach = (stars) => {
    setRating(stars);
    setTimeout(() => {
      alert(`Thank you for rating your coach ${stars} stars!`);
      setShowRating(false);
    }, 500);
  };

  const StatisticsGrid = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Workouts Completed"
        value={mockSubscription.stats.workoutsCompleted}
        previousValue={historicalStats.workoutsCompleted}
        icon={<Dumbbell className="w-6 h-6 text-white" />}
        trend="up"
        onClick={() => setActiveTab('workouts')}
      />
      <StatCard
        title="Current Streak"
        value={`${mockSubscription.stats.currentStreak} days`}
        previousValue={`${historicalStats.currentStreak} days`}
        icon={<Activity className="w-6 h-6 text-white" />}
        trend="up"
        onClick={() => setActiveTab('progress')}
      />
      <StatCard
        title="Monthly Progress"
        value={`${mockSubscription.stats.monthlyProgress}%`}
        previousValue={`${historicalStats.monthlyProgress}%`}
        icon={<BarChart2 className="w-6 h-6 text-white" />}
        trend="up"
        onClick={() => setActiveTab('progress')}
      />
      <StatCard
        title="Goals Achieved"
        value={mockSubscription.stats.goalsAchieved}
        previousValue={historicalStats.goalsAchieved}
        icon={<Target className="w-6 h-6 text-white" />}
        trend="neutral"
        onClick={() => setActiveTab('goals')}
      />
    </div>
  );

  const Chat = () => (
    <AnimatePresence>
      {showChat && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowChat(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center">
                <img
                  src={mockAssignedCoach.profileImage}
                  alt="Coach"
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <h3 className="font-semibold dark:text-white">
                    {mockAssignedCoach.firstName} {mockAssignedCoach.lastName}
                  </h3>
                  <p className="text-sm text-green-600">Online</p>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.isCoach ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.isCoach
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      message.isCoach ? 'text-gray-500' : 'text-blue-100'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors duration-200"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const RatingModal = () => (
    <AnimatePresence>
      {showRating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowRating(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-center mb-4 dark:text-white">
              Rate Your Coach
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              How would you rate {mockAssignedCoach.firstName}'s coaching?
            </p>
            
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => handleRateCoach(star)}
                  className={`p-2 rounded-full transition-colors duration-200 ${
                    star <= rating 
                      ? 'text-yellow-400 hover:text-yellow-500' 
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <Star className="w-8 h-8 fill-current" />
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowRating(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRateCoach(rating || 5)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                Submit
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 dark:from-gray-950 dark:to-indigo-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8 p-4">
        <WelcomeHeader
          user={mockUser}
          subscription={mockSubscription}
          assignedCoach={mockAssignedCoach}
          onChatOpen={() => setShowChat(true)}
          onUpgradeClick={() => alert('Upgrade functionality would be here')}
          onRateCoach={() => setShowRating(true)}
        />

        {upcomingWorkout && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex justify-between items-center shadow-lg"
          >
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-300">
                  Upcoming workout: {upcomingWorkout.title}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {formatDate(upcomingWorkout.date)} at {upcomingWorkout.time}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('workouts')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              View Details
            </button>
          </motion.div>
        )}

        <div className="bg-white dark:bg-gray-800 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 shadow-sm px-4 py-2 rounded-t-lg transition-colors duration-300">
          <div className="grid grid-cols-5 bg-gray-100/80 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart2 },
              { id: 'workouts', label: 'Workouts', icon: Dumbbell },
              { id: 'sessions', label: 'Sessions', icon: Calendar },
              { id: 'progress', label: 'Progress', icon: Activity },
              { id: 'profile', label: 'Profile', icon: User }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <StatisticsGrid />
                <div className="grid lg:grid-cols-2 gap-6">
                  <GoalsSection />
                  <WorkoutSection />
                </div>
                
                <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 ${currentTier.gradientBg}`}>
                  <div className={`w-full h-2 bg-gradient-to-r ${currentTier.color} rounded-t-lg -mt-6 -mx-6 mb-6`} />
                  <div className="flex items-center mb-4">
                    {currentTier.icon}
                    <h2 className="ml-2 text-xl font-bold dark:text-white">
                      Your {currentTier.name} Plan Features
                    </h2>
                  </div>
                  <ul className="space-y-2">
                    {currentTier.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span className="dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {currentTier.upgrade && (
                    <button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg font-semibold transition-colors duration-300">
                      Upgrade to {SUBSCRIPTION_TIERS[currentTier.upgrade].name}
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'progress' && (
              <ProgressSection
                stats={mockSubscription.stats}
                healthMetrics={healthMetrics}
                onUpdateStats={() => alert('Update stats functionality would be here')}
                onAddMetricEntry={() => alert('Add metric entry functionality would be here')}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileSection
                subscription={mockSubscription}
                questionnaire={mockQuestionnaire}
                currentTier={currentTier}
                onEditQuestionnaire={() => alert('Edit questionnaire functionality would be here')}
                onManageSubscription={() => alert('Manage subscription functionality would be here')}
                onUpgradeClick={() => alert('Upgrade functionality would be here')}
              />
            )}

            {(activeTab === 'workouts' || activeTab === 'sessions') && (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 text-center">
                <h2 className="text-2xl font-bold mb-4 dark:text-white">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Section
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  This section would contain your {activeTab} information and functionality.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => setShowChat(true)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center justify-center z-40 transition-colors duration-200"
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </motion.button>

      <Chat />
      <RatingModal />
    </div>
  );
};

export default MockUserDashboard;