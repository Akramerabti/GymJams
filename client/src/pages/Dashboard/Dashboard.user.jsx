// Dashboard.user.jsx (refactored)
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../stores/authStore';
import subscriptionService from '../../services/subscription.service';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Award, Crown, Zap, Calendar, BarChart2, Dumbbell, Activity, User, CheckCircle, MessageSquare} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Card, CardHeader, CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent } from '@/components/ui/card';
// Import components
import WelcomeHeader from './ClientOrganization/WelcomeHeader';
import StatisticsGrid from './ClientOrganization/StatisticsGrid';
import GoalsSection from './ClientOrganization/GoalsSection';
import WorkoutSection from './ClientOrganization/WorkoutSection';
import ProgressSection from './ClientOrganization/ProgressSection';
import ProfileSection from './ClientOrganization/ProfileSection';
import Chat from './components/Chat';

// Import utility functions
import { calculateTrend } from '../../utils/calculateTrend';

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
  const [historicalStats, setHistoricalStats] = useState(null);
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

        // Store a copy of the stats for historical comparison
        // In a real app, you would fetch historical data from the server
        setHistoricalStats({
          workoutsCompleted: Math.max(0, (subData.stats?.workoutsCompleted || 0) - 2),
          currentStreak: Math.max(0, (subData.stats?.currentStreak || 0) - 1),
          monthlyProgress: Math.max(0, (subData.stats?.monthlyProgress || 0) - 5),
          goalsAchieved: Math.max(0, (subData.stats?.goalsAchieved || 0)),
        });

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
      
      // Update subscription with new stats
      setSubscription(prev => ({
        ...prev,
        stats: updatedStats
      }));
      
      await subscriptionService.updateClientStats(subscription._id, updatedStats);
      
      toast.success('Workout completed! Great job!');
    } catch (error) {
      console.error('Failed to mark workout as complete:', error);
      toast.error('Failed to update workout status');
    }
  };
  
  // Update a goal
  const handleUpdateGoal = async (updatedGoal) => {
    try {
      // Update goals in local state
      const updatedGoals = goals.map(goal => 
        goal.id === updatedGoal.id ? updatedGoal : goal
      );
      
      setGoals(updatedGoals);
      
      // If this were a real app, you would update the goal on the server
      // For now, we'll just simulate it with a toast
      toast.success('Goal progress updated successfully!');
    } catch (error) {
      console.error('Failed to update goal:', error);
      toast.error('Failed to update goal progress');
    }
  };
  
  // Update stats
  const handleUpdateStats = async (updatedStats) => {
    try {
      // Update subscription with new stats
      const newSubscription = {
        ...subscription,
        stats: {
          ...subscription.stats,
          ...updatedStats
        }
      };
      
      setSubscription(newSubscription);
      
      // Update stats on server
      await subscriptionService.updateClientStats(subscription._id, updatedStats);
      
      toast.success('Stats updated successfully!');
    } catch (error) {
      console.error('Failed to update stats:', error);
      toast.error('Failed to update stats');
    }
  };
  
  const handleAddMetricEntry = async (entryData) => {
    try {
      const { metricType, value, date, notes } = entryData;
  
      // Create new entry
      const newEntry = {
        date,
        value,
        notes
      };
  
      // Update health metrics in local state
      const updatedHealthMetrics = {
        ...healthMetrics,
        [metricType]: [...(Array.isArray(healthMetrics[metricType]) ? healthMetrics[metricType] : []), newEntry].sort((a, b) => new Date(a.date) - new Date(b.date))
      };
  
      setHealthMetrics(updatedHealthMetrics);
  
      // Update progress data
      const updatedProgress = {
        ...progress,
        [`${metricType}Progress`]: updatedHealthMetrics[metricType]
      };
  
      setProgress(updatedProgress);
  
      // Update progress on server
      await subscriptionService.updateClientProgress(subscription._id, updatedProgress);
  
      toast.success('Metric entry added successfully!');
    } catch (error) {
      console.error('Failed to add metric entry:', error);
      toast.error('Failed to add metric entry');
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
  
  const handleManageSubscription = () => {
    navigate('/subscription-management');
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

  // Calculate trends for stats based on historical data
  const calculateStatTrends = () => {
    if (!subscription || !historicalStats) return {};
    
    return {
      workoutsCompleted: calculateTrend(
        subscription.stats?.workoutsCompleted || 0,
        historicalStats.workoutsCompleted
      ),
      currentStreak: calculateTrend(
        subscription.stats?.currentStreak || 0,
        historicalStats.currentStreak
      ),
      monthlyProgress: calculateTrend(
        subscription.stats?.monthlyProgress || 0,
        historicalStats.monthlyProgress
      ),
      goalsAchieved: calculateTrend(
        subscription.stats?.goalsAchieved || 0,
        historicalStats.goalsAchieved
      )
    };
  };
  
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
        {/* Welcome Header */}
        <WelcomeHeader
          user={user}
          subscription={subscription}
          assignedCoach={assignedCoach}
          onChatOpen={() => setShowChat(true)}
          onUpgradeClick={handleUpgradeClick}
        />
        
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
              <StatisticsGrid 
                stats={subscription?.stats || {}} 
                historicalStats={historicalStats || {}}
                onStatClick={(tab) => handleTabChange(tab)}
              />
              
              {/* Goals Section */}
              <GoalsSection 
                goals={goals} 
                onUpdateGoal={handleUpdateGoal} 
                onViewAll={() => handleTabChange('progress')}
              />
              
              {/* Workouts Section */}
              <WorkoutSection 
                workouts={workouts} 
                stats={subscription?.stats || {}} 
                onCompleteWorkout={handleCompleteWorkout} 
                onViewAll={() => handleTabChange('workouts')} 
              />
              
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
            <WorkoutSection 
              workouts={workouts} 
              stats={subscription?.stats || {}} 
              onCompleteWorkout={handleCompleteWorkout} 
              showAll={true}
            />
          </TabsContent>
          
          {/* Progress Tab */}
          <TabsContent value="progress" ref={progressRef}>
            <ProgressSection 
              stats={subscription?.stats || {}} 
              healthMetrics={healthMetrics} 
              onUpdateStats={handleUpdateStats}
              onAddMetricEntry={handleAddMetricEntry}
            />
          </TabsContent>
          
          {/* Profile Tab */}
          <TabsContent value="profile" ref={profileRef}>
            <ProfileSection 
              subscription={subscription} 
              questionnaire={questionnaire} 
              currentTier={currentTier} 
              onEditQuestionnaire={handleEditQuestionnaire} 
              onManageSubscription={handleManageSubscription} 
              onUpgradeClick={handleUpgradeClick} 
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Floating Chat Icon and Chat Modal */}
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