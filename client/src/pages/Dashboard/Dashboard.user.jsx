import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../stores/authStore';
import subscriptionService from '../../services/subscription.service';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, ChevronDown, ChevronUp, Medal, 
  MessageSquare, Dumbbell, BarChart2, Target, 
  Activity, User, Clock, ArrowRight, Edit3, 
  Download, ChevronLeft, ChevronRight, Info,
  Bell, CheckCircle, X, Plus, Award, Heart,Crown, Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import  Progress from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Chat from './components/Chat';

// Helper function for formatting dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// Subscription tier configuration with features
const SUBSCRIPTION_TIERS = {
  basic: {
    name: 'Basic',
    color: 'from-blue-500 to-blue-600',
    icon: <Award className="w-8 h-8" />,
    upgrade: 'premium',
    features: ['Weekly workout plans', 'Basic progress tracking', 'Coach messaging'],
  },
  premium: {
    name: 'Premium',
    color: 'from-purple-500 to-purple-600',
    icon: <Crown className="w-8 h-8" />,
    upgrade: 'elite',
    features: ['Custom workout plans', 'Comprehensive progress tracking', 'Nutrition guidance', 'Priority coach support'],
  },
  elite: {
    name: 'Elite',
    color: 'from-amber-500 to-amber-600',
    icon: <Zap className="w-8 h-8" />,
    upgrade: null,
    features: ['Personalized workout plans', 'Advanced progress analytics', 'Custom nutrition plans', 'Daily coach support', 'Recovery tracking'],
  }
};

// Custom UI Components
const StatCard = ({ title, value, icon: Icon, trend, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-white rounded-xl shadow-lg overflow-hidden p-6"
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 rounded-lg bg-blue-50">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      {trend && (
        <div className={`flex items-center ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend > 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronUp className="w-4 h-4 transform rotate-180" />}
          <span className="ml-1">{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
    <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
    <p className="text-2xl font-bold">{value}</p>
  </motion.div>
);

const ProgressRing = ({ progress, size = 120, strokeWidth = 12 }) => {
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
      <span className="absolute text-2xl font-bold">{progress}%</span>
    </div>
  );
};

const WorkoutCard = ({ workout, onComplete }) => {
  const isCompleted = workout.completed;
  const workoutDate = new Date(workout.date);
  const isToday = new Date().toDateString() === workoutDate.toDateString();
  const isPast = workoutDate < new Date() && !isToday;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-sm border p-4 ${isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium text-lg">{workout.title}</h3>
          <p className="text-sm text-gray-600">
            {formatDate(workout.date)} {workout.time && `• ${workout.time}`}
          </p>
        </div>
        <Badge 
          className={`
            ${isCompleted 
              ? 'bg-green-100 text-green-800 border-green-200' 
              : isToday 
                ? 'bg-blue-100 text-blue-800 border-blue-200' 
                : isPast 
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-gray-100 text-gray-800 border-gray-200'
            }
          `}
        >
          {isCompleted 
            ? 'Completed' 
            : isToday 
              ? 'Today' 
              : isPast 
                ? 'Missed' 
                : formatDate(workout.date)}
        </Badge>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">
        {workout.description || `${workout.type || 'General'} workout with ${workout.exercises?.length || 0} exercises`}
      </p>
      
      {workout.exercises && workout.exercises.length > 0 && (
        <div className="space-y-2 mb-3">
          {workout.exercises.slice(0, 3).map((exercise, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{exercise.name}</span>
              <span className="text-gray-600">{exercise.sets} × {exercise.reps}</span>
            </div>
          ))}
          {workout.exercises.length > 3 && (
            <p className="text-xs text-gray-500 text-center">
              +{workout.exercises.length - 3} more exercises
            </p>
          )}
        </div>
      )}
      
      {!isCompleted && (
        <div className="flex justify-end">
          <Button 
            onClick={() => onComplete(workout)} 
            size="sm"
            className={isToday ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-700"}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {isToday ? "Complete" : "Mark Complete"}
          </Button>
        </div>
      )}
    </motion.div>
  );
};

const GoalCard = ({ goal }) => {
  const { title, target, progress, due, icon: Icon } = goal;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-lg border shadow-sm"
    >
      <div className="flex items-start space-x-4">
        <div className="bg-blue-50 p-2 rounded-full">
          {Icon || <Target className="w-6 h-6 text-blue-600" />}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm text-gray-600 mb-2">{target}</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Due: {due}</p>
        </div>
      </div>
    </motion.div>
  );
};

const MetricCard = ({ title, data, unit, change, color = 'blue', isPositiveGood = true, children }) => {
  // Determine if the change is "good" based on the metric type
  const isGoodChange = (change > 0 && isPositiveGood) || (change < 0 && !isPositiveGood);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-lg border shadow-sm"
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-700">{title}</h3>
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
      </div>
      
      {children || (
        <>
          {data && data.length > 1 ? (
            <div className="h-32 relative">
              {/* Simple line chart visualization */}
              <svg width="100%" height="100%" className="overflow-visible">
                {data.map((point, i) => {
                  const x = (i / (data.length - 1)) * 100 + "%";
                  const min = Math.min(...data.map(d => d.value));
                  const max = Math.max(...data.map(d => d.value));
                  const range = max - min || 1;
                  const y = (1 - ((point.value - min) / range)) * 100 + "%";
                  
                  return (
                    <g key={i}>
                      {i > 0 && (
                        <line 
                          x1={(i-1) / (data.length - 1) * 100 + "%"}
                          y1={(1 - ((data[i-1].value - min) / range)) * 100 + "%"}
                          x2={x}
                          y2={y}
                          stroke={`var(--${color}-500)`}
                          strokeWidth="2"
                        />
                      )}
                      <circle
                        cx={x}
                        cy={y}
                        r="3"
                        fill="white"
                        stroke={`var(--${color}-500)`}
                        strokeWidth="2"
                      />
                    </g>
                  );
                })}
              </svg>
              
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
                <span>{formatDate(data[0].date)}</span>
                <span>{formatDate(data[data.length - 1].date)}</span>
              </div>
              
              <div className="absolute top-0 right-0 text-xl font-bold">
                {data[data.length - 1].value}{unit}
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-400">
              No data available
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [subscription, setSubscription] = useState(null);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState([]);
  const [progress, setProgress] = useState(null);
  const [goals, setGoals] = useState([]);
  const [assignedCoach, setAssignedCoach] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [upcomingWorkout, setUpcomingWorkout] = useState(null);
  const [healthMetrics, setHealthMetrics] = useState({
    weight: [],
    bodyFat: [],
    strength: [],
    cardio: [],
  });
  
  // Refs for scrolling
  const overviewRef = useRef(null);
  const workoutsRef = useRef(null);
  const progressRef = useRef(null);
  const profileRef = useRef(null);
  
  // Verify subscription and load data
  useEffect(() => {
    const verifyQuestionnaireAndSubscription = async () => {
      try {
        setLoading(true);
        const accessToken = localStorage.getItem('accessToken');

        // Load subscription and questionnaire data
        const [subData, questionnaireData] = await Promise.all([
          subscriptionService.getCurrentSubscription(accessToken),
          subscriptionService.checkQuestionnaireStatus(user?.id || accessToken),
        ]);

        // Redirect to questionnaire if not completed
        if (!questionnaireData?.completed) {
          navigate('/questionnaire', {
            state: { subscription: subData, accessToken: accessToken || null },
          });
          return;
        }

        // Redirect to coaching page if no subscription
        if (!subData) {
          toast.error('No active subscription found');
          navigate('/coaching');
          return;
        }

        setSubscription(subData);
        setQuestionnaire(questionnaireData);
        
        // Get coach details if assigned
        if (subData.assignedCoach) {
          try {
            const coaches = await subscriptionService.getCoaches();
            const coach = coaches.find(c => c._id === subData.assignedCoach);
            if (coach) {
              setAssignedCoach(coach);
            }
          } catch (error) {
            console.error('Failed to fetch coach details:', error);
          }
        }
        
        // Set workouts data
        if (subData.workouts && Array.isArray(subData.workouts)) {
          setWorkouts(subData.workouts);
          
          // Find next upcoming workout
          const now = new Date();
          const upcoming = subData.workouts
            .filter(w => !w.completed && new Date(w.date) >= now)
            .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
            
          setUpcomingWorkout(upcoming);
        }
        
        // Set progress data
        if (subData.progress) {
          setProgress(subData.progress);
          
          // Set health metrics
          setHealthMetrics({
            weight: subData.progress.weightProgress || [],
            bodyFat: subData.progress.bodyFatProgress || [],
            strength: subData.progress.strengthProgress || [],
            cardio: subData.progress.cardioProgress || [],
          });
        }
        
        // Generate goals from subscription data
        generateGoals(subData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        
        if (error.response?.status === 401) {
          toast.error('Session expired. Please log in again.');
          navigate('/login');
        } else {
          toast.error('Failed to load dashboard data');
        }
      } finally {
        setLoading(false);
      }
    };

    verifyQuestionnaireAndSubscription();
  }, [user, navigate]);
  
  // Generate client goals from subscription data
  const generateGoals = (subscriptionData) => {
    const generatedGoals = [];
    
    // Check if subscription has goals
    if (subscriptionData.goals && Array.isArray(subscriptionData.goals)) {
      // Use existing goals
      subscriptionData.goals.forEach(goal => {
        generatedGoals.push({
          id: goal.id,
          title: goal.title,
          target: goal.target,
          progress: goal.progress,
          due: formatDate(goal.dueDate),
          icon: getGoalIcon(goal.type),
        });
      });
    } else {
      // Generate default goals based on questionnaire
      if (questionnaire?.data?.goals) {
        const userGoals = Array.isArray(questionnaire.data.goals) 
          ? questionnaire.data.goals 
          : [];
        
        if (userGoals.includes('strength')) {
          generatedGoals.push({
            id: 'strength-goal',
            title: 'Strength Improvement',
            target: 'Increase bench press by 10%',
            progress: Math.min(100, Math.max(0, (subscriptionData.stats?.strengthProgress || 0) * 100)),
            due: '4 weeks',
            icon: <Dumbbell className="w-6 h-6 text-blue-600" />,
          });
        }
        
        if (userGoals.includes('endurance')) {
          generatedGoals.push({
            id: 'endurance-goal',
            title: 'Endurance Improvement',
            target: 'Increase cardio capacity by 15%',
            progress: Math.min(100, Math.max(0, (subscriptionData.stats?.cardioProgress || 0) * 100)),
            due: '6 weeks',
            icon: <Activity className="w-6 h-6 text-green-600" />,
          });
        }
        
        if (userGoals.includes('weight')) {
          generatedGoals.push({
            id: 'weight-goal',
            title: 'Weight Management',
            target: 'Lose 5% body fat',
            progress: Math.min(100, Math.max(0, (subscriptionData.stats?.weightProgress || 0) * 100)),
            due: '8 weeks',
            icon: <Target className="w-6 h-6 text-red-600" />,
          });
        }
      }
      
      // Add default consistency goal
      generatedGoals.push({
        id: 'consistency-goal',
        title: 'Workout Consistency',
        target: `${subscriptionData.stats?.weeklyTarget || 3} workouts per week`,
        progress: Math.min(100, Math.max(0, ((subscriptionData.stats?.workoutsCompleted || 0) / ((subscriptionData.stats?.weeklyTarget || 3) * 4)) * 100)),
        due: 'Ongoing',
        icon: <Calendar className="w-6 h-6 text-purple-600" />,
      });
    }
    
    setGoals(generatedGoals);
  };
  
  const getGoalIcon = (type) => {
    switch (type) {
      case 'strength':
        return <Dumbbell className="w-6 h-6 text-blue-600" />;
      case 'endurance':
        return <Activity className="w-6 h-6 text-green-600" />;
      case 'weight':
        return <Target className="w-6 h-6 text-red-600" />;
      case 'nutrition':
        return <Apple className="w-6 h-6 text-amber-600" />;
      case 'consistency':
        return <Calendar className="w-6 h-6 text-purple-600" />;
      default:
        return <Award className="w-6 h-6 text-blue-600" />;
    }
  };
  
  // Get user first name
  const getUserFirstName = () => {
    return user?.user?.firstName || user?.firstName || '';
  };
  
  // Mark workout as complete
  const handleCompleteWorkout = async (workout) => {
    try {
      // Update local state
      const updatedWorkouts = workouts.map(w => 
        w.id === workout.id ? { ...w, completed: true, completedDate: new Date().toISOString() } : w
      );
      
      setWorkouts(updatedWorkouts);
      
      // Update workout data on server
      await subscriptionService.updateClientWorkouts(subscription._id, updatedWorkouts);
      
      // Update stats
      const updatedStats = {
        ...subscription.stats,
        workoutsCompleted: (subscription.stats?.workoutsCompleted || 0) + 1,
      };
      
      await subscriptionService.updateClientStats(subscription._id, updatedStats);
      
      toast.success('Workout completed! Great job!');
    } catch (error) {
      console.error('Failed to mark workout as complete:', error);
      toast.error('Failed to update workout status');
    }
  };
  
  const handleEditQuestionnaire = () => {
    navigate('/questionnaire', { 
      state: { 
        isEditing: true, 
        currentAnswers: questionnaire?.data,
        subscription: subscription 
      }
    });
  };
  
  const handleUpgradeClick = () => {
    navigate('/dashboard/upgrade', {
      state: { subscription },
    });
  };
  
  // Scroll to specific section
  const scrollToSection = (section) => {
    const refs = {
      overview: overviewRef,
      workouts: workoutsRef,
      progress: progressRef,
      profile: profileRef,
    };
    
    if (refs[section]?.current) {
      refs[section].current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value);
    scrollToSection(value);
  };
  
  // Get subscription tier
  const currentTier = SUBSCRIPTION_TIERS[subscription?.subscription || 'basic'];
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-8 rounded-2xl bg-gradient-to-r ${currentTier.color} text-white shadow-lg`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-6 sm:space-y-0">
            {/* Left Side: Welcome Message and Coach Info */}
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back{getUserFirstName() ? `, ${getUserFirstName()}` : ''}! 👋
              </h1>
              <div className="flex items-center justify-center sm:justify-start">
                {currentTier.icon}
                <span className="ml-2 text-lg">{currentTier.name} Plan</span>
              </div>
              
              {/* Display Assigned Coach */}
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

            {/* Right Side: Buttons */}
            <div className="flex flex-col items-center sm:items-end space-y-4 w-full sm:w-auto">
              {/* Message Coach Button */}
              {assignedCoach && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full sm:w-auto"
                >
                  <Button
                    onClick={() => setShowChat(true)}
                    className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Message Coach
                  </Button>
                </motion.div>
              )}
              
              {/* Upgrade Button */}
              {currentTier.upgrade && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full sm:w-auto"
                >
                  <Button
                    onClick={handleUpgradeClick}
                    className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white"
                  >
                    Upgrade to {SUBSCRIPTION_TIERS[currentTier.upgrade].name}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
        
        {/* Notification Banner for upcoming workout */}
        {upcomingWorkout && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center"
          >
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-blue-800">Upcoming workout: {upcomingWorkout.title}</p>
                <p className="text-sm text-blue-600">{formatDate(upcomingWorkout.date)} {upcomingWorkout.time && `at ${upcomingWorkout.time}`}</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                handleTabChange('workouts');
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              View Details
            </Button>
          </motion.div>
        )}

        {/* Navigation Tabs */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange}>
          <div className="bg-white sticky top-0 z-10 border-b shadow-sm px-4 py-2 rounded-t-lg">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">
                <BarChart2 className="w-4 h-4 mr-2 inline-block" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="workouts">
                <Dumbbell className="w-4 h-4 mr-2 inline-block" />
                <span className="hidden sm:inline">Workouts</span>
              </TabsTrigger>
              <TabsTrigger value="progress">
                <Activity className="w-4 h-4 mr-2 inline-block" />
                <span className="hidden sm:inline">Progress</span>
              </TabsTrigger>
              <TabsTrigger value="profile">
                <User className="w-4 h-4 mr-2 inline-block" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Overview Tab */}
          <TabsContent value="overview" ref={overviewRef}>
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  title="Workouts Completed"
                  value={subscription?.stats?.workoutsCompleted || 0}
                  icon={Dumbbell}
                  trend={12}
                />
                <StatCard
                  title="Current Streak"
                  value={`${subscription?.stats?.currentStreak || 0} days`}
                  icon={Activity}
                  trend={8}
                />
                <StatCard
                  title="Monthly Progress"
                  value={`${subscription?.stats?.monthlyProgress || 0}%`}
                  icon={BarChart2}
                  trend={15}
                />
                <StatCard
                  title="Goals Achieved"
                  value={subscription?.stats?.goalsAchieved || 0}
                  icon={Target}
                  trend={5}
                />
              </div>
          
              {/* Goals Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Current Goals</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleTabChange('progress')}
                  >
                    View All
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.slice(0, 2).map(goal => (
                      <GoalCard key={goal.id} goal={goal} />
                    ))}
                  </div>
                </CardContent>
              </Card>
          
              {/* Recent Workouts */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent & Upcoming Workouts</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleTabChange('workouts')}
                  >
                    View All
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workouts.slice(0, 3).map(workout => (
                      <WorkoutCard 
                        key={workout.id} 
                        workout={workout} 
                        onComplete={handleCompleteWorkout} 
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Subscription Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Your {currentTier.name} Plan Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {currentTier.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                {currentTier.upgrade && (
                  <CardFooter>
                    <Button 
                      onClick={handleUpgradeClick}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Upgrade to {SUBSCRIPTION_TIERS[currentTier.upgrade].name}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
          </TabsContent>
          
          {/* Workouts Tab */}
          <TabsContent value="workouts" ref={workoutsRef}>
            <div className="space-y-6">
              {/* Workout calendar/timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Workout Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  {workouts.length > 0 ? (
                    <div className="space-y-4">
                      {workouts.map(workout => (
                        <WorkoutCard 
                          key={workout.id} 
                          workout={workout} 
                          onComplete={handleCompleteWorkout}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Dumbbell className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <h3 className="text-xl font-medium text-gray-700">No workouts yet</h3>
                      <p className="text-gray-500 mt-2">Your coach will add workouts to your plan soon.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Workout statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Workout Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Completion Rate</p>
                      <p className="text-2xl font-bold">
                        {workouts.length > 0 
                          ? Math.round((workouts.filter(w => w.completed).length / workouts.length) * 100) 
                          : 0}%
                      </p>
                      <div className="mt-2">
                        <Progress 
                          value={workouts.length > 0 
                            ? (workouts.filter(w => w.completed).length / workouts.length) * 100 
                            : 0
                          } 
                        />
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Weekly Target</p>
                      <p className="text-2xl font-bold">
                        {subscription?.stats?.weeklyTarget || 3} workouts
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {subscription?.stats?.currentStreak || 0} day streak
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Total Completed</p>
                      <p className="text-2xl font-bold">
                        {subscription?.stats?.workoutsCompleted || 0}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Since {formatDate(subscription?.startDate)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Progress Tab */}
          <TabsContent value="progress" ref={progressRef}>
            <div className="space-y-6">
              {/* Overall Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    <ProgressRing progress={subscription?.stats?.monthlyProgress || 0} />
                    <p className="mt-4 text-gray-600">
                      You're making great progress!
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Goals */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Fitness Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map(goal => (
                      <GoalCard key={goal.id} goal={goal} />
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Health Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Health Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MetricCard 
                      title="Weight Tracking" 
                      data={healthMetrics.weight} 
                      unit="lbs" 
                      change={healthMetrics.weight.length >= 2 
                        ? healthMetrics.weight[healthMetrics.weight.length-1].value - healthMetrics.weight[0].value 
                        : undefined}
                      color="blue"
                      isPositiveGood={false} // For weight, lower is typically better
                    />
                    
                    <MetricCard 
                      title="Body Fat" 
                      data={healthMetrics.bodyFat} 
                      unit="%" 
                      change={healthMetrics.bodyFat.length >= 2 
                        ? healthMetrics.bodyFat[healthMetrics.bodyFat.length-1].value - healthMetrics.bodyFat[0].value 
                        : undefined}
                      color="amber"
                      isPositiveGood={false} // For body fat, lower is typically better
                    />
                    
                    <MetricCard 
                      title="Strength" 
                      data={healthMetrics.strength} 
                      unit="lbs" 
                      change={healthMetrics.strength.length >= 2 
                        ? healthMetrics.strength[healthMetrics.strength.length-1].value - healthMetrics.strength[0].value 
                        : undefined}
                      color="green"
                      isPositiveGood={true} // For strength, higher is better
                    />
                    
                    <MetricCard 
                      title="Cardio Fitness" 
                      data={healthMetrics.cardio} 
                      unit="min" 
                      change={healthMetrics.cardio.length >= 2 
                        ? healthMetrics.cardio[healthMetrics.cardio.length-1].value - healthMetrics.cardio[0].value 
                        : undefined}
                      color="red"
                      isPositiveGood={false} // For cardio time, lower is better
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Profile Tab */}
          <TabsContent value="profile" ref={profileRef}>
            <div className="space-y-6">
              {/* Subscription Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="font-medium">Plan</span>
                      <span className="flex items-center">
                        {currentTier.icon && <span className="w-5 h-5 mr-2">{currentTier.icon}</span>}
                        {currentTier.name}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="font-medium">Status</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {subscription?.status === 'active' ? 'Active' : subscription?.status}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="font-medium">Start Date</span>
                      <span>{formatDate(subscription?.startDate)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="font-medium">Next Billing</span>
                      <span>{formatDate(subscription?.currentPeriodEnd)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Auto-Renewal</span>
                      <Badge 
                        variant="outline" 
                        className={subscription?.cancelAtPeriodEnd 
                          ? "bg-amber-50 text-amber-700 border-amber-200" 
                          : "bg-green-50 text-green-700 border-green-200"}
                      >
                        {subscription?.cancelAtPeriodEnd ? 'Off' : 'On'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/subscription-management')}
                  >
                    Manage Subscription
                  </Button>
                  {currentTier.upgrade && (
                    <Button 
                      onClick={handleUpgradeClick}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Upgrade Plan
                    </Button>
                  )}
                </CardFooter>
              </Card>
              
              {/* Fitness Profile */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Fitness Profile</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditQuestionnaire}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </CardHeader>
                <CardContent>
                  {questionnaire && questionnaire.data && Object.keys(questionnaire.data).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(questionnaire.data)
                        .filter(([key, value]) => {
                          // Filter out null, undefined, empty strings, and empty arrays
                          if (value === null || value === undefined || value === '') return false;
                          if (Array.isArray(value) && value.length === 0) return false;
                          return true;
                        })
                        .map(([key, value]) => (
                          <div key={key} className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-600 mb-2">
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </h3>
                            <p className="text-gray-900">
                              {Array.isArray(value) ? value.join(', ') : value}
                            </p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No fitness profile data available.</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Export Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Export</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Download your fitness data including workouts, progress metrics, and goals.
                  </p>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Floating Chat Icon */}
      {assignedCoach && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            className="fixed bottom-4 right-4 z-10"
          >
            <Button
              onClick={() => setShowChat(true)}
              className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
            >
              <MessageSquare className="w-6 h-6" />
            </Button>
          </motion.div>
        
          {/* Chat Modal */}
          {showChat && (
            <Chat
              subscription={subscription}
              onClose={() => setShowChat(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ClientDashboard;