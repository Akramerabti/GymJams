import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../stores/authStore';
import subscriptionService from '../../services/subscription.service';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, Settings, Edit3, Award, Calendar, BarChart2, 
  Target, Activity, ArrowUpRight, ChevronUp, Dumbbell, 
  Zap, UserPlus, RefreshCw, User, Joystick, MessageCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CoachAssignment from './components/coach.assignment';
import CoachInteraction from './components/CoachInteraction';
import Chat from './components/Chat'; // Import the Chat component

const DashboardCard = ({ children, className = '', ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}
    {...props}
  >
    {children}
  </motion.div>
);

const StatCard = ({ title, value, icon, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-white rounded-xl shadow-lg overflow-hidden p-6"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 rounded-lg bg-blue-50">
        {icon}
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

const SUBSCRIPTION_TIERS = {
  basic: {
    name: 'Basic',
    color: 'from-blue-500 to-blue-600',
    icon: <Award className="w-8 h-8" />,
    upgrade: 'premium'
  },
  premium: {
    name: 'Premium',
    color: 'from-purple-500 to-purple-600',
    icon: <Crown className="w-8 h-8" />,
    upgrade: 'elite'
  },
  elite: {
    name: 'Elite',
    color: 'from-amber-500 to-amber-600',
    icon: <Zap className="w-8 h-8" />,
    upgrade: null
  }
};

const DashboardUser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [initializing, setInitializing] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCoachAssignment, setShowCoachAssignment] = useState(false);
  const [assignedCoach, setAssignedCoach] = useState(null);
  const [showChat, setShowChat] = useState(false); // State for chat visibility
  const [bubblePosition, setBubblePosition] = useState({
  x: window.innerWidth - 80, // 80px from the right
  y: window.innerHeight - 80, // 80px from the bottom
});

// Update bubble position on window resize
useEffect(() => {
  const handleResize = () => {
    setBubblePosition({
      x: window.innerWidth - 80, // 80px from the right
      y: window.innerHeight - 80, // 80px from the bottom
    });
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
  

  // Fetch assigned coach details
  const fetchAssignedCoach = async () => {
    if (!subscription?.assignedCoach) {
      return;
    }
  
    try {
      const coaches = await subscriptionService.getCoaches(); // Directly assign the array
      const coach = coaches.find(c => c._id === subscription.assignedCoach);
      console.log('Assigned coach:', coach);
      if (coach) {
        setAssignedCoach(coach);
      } else {
        console.error('Coach not found in coaches list');
        toast.error('Unable to load coach details');
      }
    } catch (error) {
      console.error('Failed to fetch assigned coach:', error);
    }
  };

  useEffect(() => {
    if (subscription?.assignedCoach) {
      fetchAssignedCoach();
    }
  }, [subscription?.assignedCoach]); 

  const verifyQuestionnaireAndSubscription = async () => {
    try {
      setInitializing(true);
      const accessToken = localStorage.getItem('accessToken');

      const [subData, questionnaireData] = await Promise.all([
        subscriptionService.getCurrentSubscription(accessToken),
        subscriptionService.checkQuestionnaireStatus(user?.id || accessToken),
      ]);

      if (!questionnaireData?.completed) {
        navigate('/questionnaire', {
          state: { subscription: subData, accessToken: accessToken || null },
        });
        return;
      }

      if (!subData) {
        toast.error('No active subscription found');
        navigate('/coaching');
        return;
      }

      // Check coach assignment status
      if (subData.coachAssignmentStatus === 'pending' && !subData.assignedCoach) {
        setShowCoachAssignment(true);
      } else {
        setShowCoachAssignment(false);
      }
 
      setSubscription(subData);
      setQuestionnaire(questionnaireData);
      setLoading(false);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        navigate('/login');
      } else if (error.response?.status === 404) {
        toast.error('Subscription not found');
        navigate('/coaching');
      } else {
        toast.error('Failed to load dashboard data');
        navigate('/coaching');
      }
    } finally {
      setInitializing(false);
    }
  };

  const getUserFirstName = (user) => {
    return user?.user?.firstName || user?.firstName || '';
  };
  

  useEffect(() => {
    verifyQuestionnaireAndSubscription();
  }, [user]);

  const handleCoachAssigned = async (coach) => {
  try {

    const accessToken = localStorage.getItem('accessToken');
    const latestSubscription = await subscriptionService.getCurrentSubscription(accessToken);
    
    if (latestSubscription?.assignedCoach) {
      setShowCoachAssignment(false);
      setSubscription(latestSubscription);
      setAssignedCoach(coach);
    } else {
      // If still not updated, show loading state
      toast.info('Finalizing coach assignment...');
      setTimeout(() => {
        verifyQuestionnaireAndSubscription();
      }, 2000);
    }
  } catch (error) {
    console.error('Error handling coach assignment:', error);
    toast.error('Error updating coach assignment');
  }
};

  const handleUpgradeClick = () => {
    navigate('/dashboard/upgrade', {
      state: { subscription }, // Pass the current subscription data
    });
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

  const currentTier = SUBSCRIPTION_TIERS[subscription?.subscription || 'basic'];

  if (initializing || loading) {
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

  if (showCoachAssignment) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <CoachAssignment
            subscription={subscription}
            onCoachAssigned={handleCoachAssigned}
          />
        </div>
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
          className={`p-8 rounded-2xl bg-gradient-to-r ${currentTier.color} text-white`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-6 sm:space-y-0">
            {/* Left Side: Welcome Message and Coach Info */}
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back{user ? `, ${getUserFirstName(user)}` : ''}! 👋
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
                      Specialties: {assignedCoach.specialties?.join(', ') || 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Upgrade and Play Games Buttons */}
            <div className="flex flex-col items-center sm:items-end space-y-4 w-full sm:w-auto">
              {/* Play To Win Button (Visible only for subscribed users) */}
              {subscription && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full sm:w-auto"
                >
                  <Button
                    onClick={() => navigate('/hidden-games')}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-yellow-600 text-white hover:from-red-700 hover:to-purple-700"
                  >
                    <Joystick className="w-5 h-5 mr-2" />
                    Play To Win
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
                    className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white "
                  >
                    Upgrade to {SUBSCRIPTION_TIERS[currentTier.upgrade].name}
                    <ArrowUpRight className="ml-2 w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Coach Interaction Section */}
        {assignedCoach && (
          <CoachInteraction coach={assignedCoach} />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Workouts Completed"
            value={subscription?.stats?.workoutsCompleted || 0}
            icon={<Dumbbell className="w-6 h-6 text-blue-600" />}
            trend={12}
          />
          <StatCard
            title="Current Streak"
            value={`${subscription?.stats?.currentStreak || 0} days`}
            icon={<Activity className="w-6 h-6 text-blue-600" />}
            trend={8}
          />
          <StatCard
            title="Monthly Progress"
            value={`${subscription?.stats?.monthlyProgress || 0}%`}
            icon={<BarChart2 className="w-6 h-6 text-blue-600" />}
            trend={15}
          />
          <StatCard
            title="Goals Achieved"
            value={subscription?.stats?.goalsAchieved || 0}
            icon={<Target className="w-6 h-6 text-blue-600" />}
            trend={5}
          />
        </div>

        {/* Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DashboardCard className="lg:col-span-2">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Fitness Progress</h2>
              <div className="h-64 flex items-center justify-center">
                {/* Add your preferred charting library here */}
                <p className="text-gray-500">Progress chart coming soon...</p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Goal Progress</h2>
              <div className="flex flex-col items-center">
                <ProgressRing progress={subscription?.stats?.monthlyProgress || 0} />
                <p className="mt-4 text-gray-600">
                  You're making great progress!
                </p>
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* Questionnaire Section */}
        <DashboardCard>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Your Fitness Profile</h2>
              <Button
                onClick={handleEditQuestionnaire}
                className="bg-blue-50 text-white hover:bg-blue-100"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
            {questionnaire && questionnaire.data && Object.keys(questionnaire.data).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          </div>
        </DashboardCard>
      </div>

      {/* Floating Chat Bubble */}
<motion.div
  drag
  dragElastic={0.1} // Adds a slight elastic effect when clicked
  dragConstraints={{
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }}
  whileTap={{ scale: 0.9 }} // Slight scale effect on tap
  style={{
    position: 'fixed',
    bottom: 20, // Fixed distance from the bottom
    right: 20,  // Fixed distance from the right
    zIndex: 1000,
  }}
  className="cursor-pointer"
  onClick={() => setShowChat(!showChat)}
>
  <motion.div
    whileHover={{ scale: 1.1 }} // Slight scale effect on hover
    className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors"
  >
    <MessageCircle className="w-8 h-8 text-white" />
  </motion.div>
</motion.div>



      {/* Chat Component */}
      {showChat && assignedCoach && (
        <Chat subscription={subscription} onClose={() => setShowChat(false)} />
      )}

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-lg w-full"
            >
              <h2 className="text-2xl font-bold mb-4">
                Upgrade to {SUBSCRIPTION_TIERS[currentTier.upgrade].name}
              </h2>
              <p className="text-gray-600 mb-6">
                Get access to advanced features and personalized coaching with our {SUBSCRIPTION_TIERS[currentTier.upgrade].name} plan.
              </p>
              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowUpgradeModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    navigate('/subscription-checkout', {
                      state: { plan: SUBSCRIPTION_TIERS[currentTier.upgrade].name.toLowerCase() }
                    });
                  }}
                >
                  Upgrade Now
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardUser;