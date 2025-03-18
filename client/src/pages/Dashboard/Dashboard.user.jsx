import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../stores/authStore';
import subscriptionService from '../../services/subscription.service';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Award, Crown, Zap, Calendar, BarChart2, Dumbbell, Activity, User, CheckCircle, MessageSquare, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { usePoints } from '../../hooks/usePoints';

// Import components
import WelcomeHeader from './ClientOrganization/WelcomeHeader';
import StatisticsGrid from './ClientOrganization/StatisticsGrid';
import GoalsSection from './ClientOrganization/GoalsSection';
import WorkoutSection from './ClientOrganization/WorkoutSection';
import ProgressSection from './ClientOrganization/ProgressSection';
import ProfileSection from './ClientOrganization/ProfileSection';
import Chat from './components/Chat';

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

// Helper function for formatting dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// Helper function to get goal icon
const getGoalIcon = (type) => {
  switch (type) {
    case 'strength':
      return <Dumbbell className="w-6 h-6 text-blue-600" />;
    case 'cardio':
      return <Activity className="w-6 h-6 text-green-600" />;
    case 'weight':
      return <BarChart2 className="w-6 h-6 text-red-600" />;
    default:
      return <Calendar className="w-6 h-6 text-purple-600" />;
  }
};

// Helper function to calculate trend
const calculateTrend = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
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

  const { addPoints, updatePointsInBackend } = usePoints();

  // Refs for scrolling
  const overviewRef = useRef(null);
  const workoutsRef = useRef(null);
  const progressRef = useRef(null);
  const profileRef = useRef(null);

  const generateGoals = async (subscriptionData) => {
    const generatedGoals = [];
  
    // Check if subscription already has goals
    if (subscriptionData.goals && Array.isArray(subscriptionData.goals) && subscriptionData.goals.length > 0) {
      // Use existing goals
      setGoals(subscriptionData.goals);
      return;
    } 
    
    // Generate default goals based on questionnaire
    if (questionnaire?.data?.goals) {
      const userGoals = Array.isArray(questionnaire.data.goals)
        ? questionnaire.data.goals
        : [];
  
      if (userGoals.includes('strength')) {
        generatedGoals.push({
          title: 'Strength Improvement',
          type: 'strength',
          target: 'Increase bench press by 10%',
          progress: Math.min(100, Math.max(0, (subscriptionData.stats?.strengthProgress || 0) * 100)),
          difficulty: 'medium',
          dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 4 weeks from now
          icon: <Dumbbell className="w-6 h-6 text-blue-600" />,
        });
      }
  
      if (userGoals.includes('endurance')) {
        generatedGoals.push({
          title: 'Endurance Improvement',
          type: 'cardio',
          target: 'Increase cardio capacity by 15%',
          progress: Math.min(100, Math.max(0, (subscriptionData.stats?.cardioProgress || 0) * 100)),
          difficulty: 'medium',
          dueDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000), // 6 weeks from now
          icon: <Activity className="w-6 h-6 text-green-600" />,
        });
      }
  
      if (userGoals.includes('weight')) {
        generatedGoals.push({
          title: 'Weight Management',
          type: 'weight',
          target: 'Lose 5% body fat',
          progress: Math.min(100, Math.max(0, (subscriptionData.stats?.weightProgress || 0) * 100)),
          difficulty: 'hard',
          dueDate: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000), // 8 weeks from now
          icon: <Target className="w-6 h-6 text-red-600" />,
        });
      }
    }
  
    // Add default consistency goal
    generatedGoals.push({
      title: 'Workout Consistency',
      type: 'consistency',
      target: `${subscriptionData.stats?.weeklyTarget || 3} workouts per week`,
      progress: Math.min(100, Math.max(0, ((subscriptionData.stats?.workoutsCompleted || 0) / ((subscriptionData.stats?.weeklyTarget || 3) * 4)) * 100)),
      difficulty: 'easy',
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Ongoing (90 days)
      icon: <Calendar className="w-6 h-6 text-purple-600" />,
    });
  
    // Set goals in the state
    setGoals(generatedGoals);
    
    // Save the generated goals to the backend
    try {
      // Remove icon property as it can't be serialized
      const goalsForBackend = generatedGoals.map(({ icon, ...goal }) => goal);
      await subscriptionService.saveQuestionnaireDerivedGoals(subscriptionData._id, goalsForBackend);
      console.log('Goals saved to backend successfully');
    } catch (error) {
      console.error('Failed to save goals to backend:', error);
      // Don't show error to user as this is happening in the background
    }
  };

  const handleRequestGoalCompletion = async (goalId) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) {
        toast.error('Goal not found');
        return;
      }
      
      // Update local state to show pending approval
      const updatedGoals = goals.map(g => 
        g.id === goalId 
          ? { 
              ...g, 
              status: 'pending_approval',
              clientRequestedCompletion: true,
              clientCompletionRequestDate: new Date().toISOString(),
              progress: 100
            } 
          : g
      );
      
      setGoals(updatedGoals);
      
      // Send request to the backend
      await subscriptionService.requestGoalCompletion(subscription._id, goalId);
      
      toast.success('Completion request sent to your coach!', {
        description: 'Your coach will review and approve this goal.'
      });
    } catch (error) {
      console.error('Failed to request goal completion:', error);
      toast.error('Failed to send completion request');
    }
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
        stats: updatedStats,
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
          ...updatedStats,
        },
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
        notes,
      };

      // Update health metrics in local state
      const updatedHealthMetrics = {
        ...healthMetrics,
        [metricType]: [...(Array.isArray(healthMetrics[metricType]) ? healthMetrics[metricType] : []), newEntry].sort((a, b) => new Date(a.date) - new Date(b.date)),
      };

      setHealthMetrics(updatedHealthMetrics);

      // Update progress data
      const updatedProgress = {
        ...progress,
        [`${metricType}Progress`]: updatedHealthMetrics[metricType],
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
        subscription: subscription,
      },
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

          // Set health metrics with fallbacks for undefined/null values
          setHealthMetrics({
            weight: Array.isArray(subData.progress.weightProgress) ? subData.progress.weightProgress : [],
            bodyFat: Array.isArray(subData.progress.bodyFatProgress) ? subData.progress.bodyFatProgress : [],
            strength: Array.isArray(subData.progress.strengthProgress) ? subData.progress.strengthProgress : [],
            cardio: Array.isArray(subData.progress.cardioProgress) ? subData.progress.cardioProgress : [],
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

    // Return cleanup function or nothing, not an object
    return () => {
      // Any cleanup logic here if needed
    };
  }, [user, navigate]);

  // Get subscription tier
  const currentTier = SUBSCRIPTION_TIERS[subscription?.subscription || 'basic'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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
                onCompleteGoal={handleRequestGoalCompletion} // Changed from handleCompleteGoal
                onViewAll={() => handleTabChange('progress')}
                subscription={subscription}
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