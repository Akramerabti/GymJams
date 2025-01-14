import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import subscriptionService from '../services/subscription.service';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, Settings, ChevronRight, Edit3, Award, 
  Calendar, BarChart2, Target, Activity, ArrowUpRight,
  ChevronUp, Dumbbell, Zap, UserPlus, RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
  <DashboardCard className="p-6">
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
  </DashboardCard>
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

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [isEditingQuestionnaire, setIsEditingQuestionnaire] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Mock data for demonstration
  const mockStats = {
    workoutsCompleted: 12,
    currentStreak: 5,
    monthlyProgress: 68,
    goalsAchieved: 3
  };

  const [showAccessTokenInput, setShowAccessTokenInput] = useState(false);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || '');
  const [verifyingToken, setVerifyingToken] = useState(false);

  const handleAccessTokenSubmit = async (e) => {
    e.preventDefault();
    setVerifyingToken(true);
    try {
      const response = await subscriptionService.verifyAccessToken(accessToken);
      if (response.success) {
        toast.success('Access token verified successfully!');
        
        // Check questionnaire status immediately after token verification
        const questionnaireStatus = await subscriptionService.checkQuestionnaireStatus(accessToken);
        
        if (!questionnaireStatus?.completed) {
          // Redirect to questionnaire if not completed
          navigate('/questionnaire', { 
            state: { 
              subscription: response.subscription,
              accessToken: accessToken
            }
          });
          return;
        }
        
        setShowAccessTokenInput(false);
        // Reload dashboard data with the new token only if questionnaire is completed
        fetchDashboardData(accessToken);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      toast.error('Invalid access token. Please check and try again.');
      localStorage.removeItem('accessToken');
    } finally {
      setVerifyingToken(false);
    }
  };

  const fetchDashboardData = async (token = null) => {
    try {
      setLoading(true);
      const [subData, questionnaireData] = await Promise.all([
        subscriptionService.getCurrentSubscription(token),
        subscriptionService.checkQuestionnaireStatus(token)
      ]);
      
      console.log('Subscription data:', subData);
      console.log('Questionnaire data:', questionnaireData);
  
      // Check if questionnaire is NOT completed by checking hasCompletedQuestionnaire
      if (!subData.hasCompletedQuestionnaire) {
        // Redirect to questionnaire with subscription data
        navigate('/questionnaire', {
          state: { 
            subscription: subData,
            accessToken: token
          }
        });
        return;
      }
      
      setSubscription(subData);
      setQuestionnaire(questionnaireData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        setShowAccessTokenInput(true);
        localStorage.removeItem('accessToken');
      }
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If user is logged in, fetch data normally
    if (user) {
      fetchDashboardData();
      return;
    }

    // If there's a stored access token, try to use it
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      fetchDashboardData(storedToken);
    } else {
      setShowAccessTokenInput(true);
    }
  }, [user]);

  const handleUpgradeClick = () => {
    if (!subscription || !SUBSCRIPTION_TIERS[subscription.type]?.upgrade) return;
    setShowUpgradeModal(true);
  };

  const handleEditQuestionnaire = () => {
    setIsEditingQuestionnaire(true);
    navigate('/questionnaire', { state: { isEditing: true, currentAnswers: questionnaire?.data } });
  };

  // Access Token Input UI
  if (showAccessTokenInput) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Access Your Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAccessTokenSubmit} className="space-y-4">
                <div>
                  <label 
                    htmlFor="accessToken" 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Enter your access token
                  </label>
                  <input
                    id="accessToken"
                    type="text"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Paste your access token here"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={verifyingToken}
                >
                  {verifyingToken ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Verifying...
                    </>
                  ) : (
                    'Access Dashboard'
                  )}
                </Button>
              </form>
              <p className="mt-4 text-sm text-gray-600 text-center">
                Check your email for the access token sent during subscription purchase
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const currentTier = SUBSCRIPTION_TIERS[subscription?.type || 'basic'];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-8 rounded-2xl bg-gradient-to-r ${currentTier.color} text-white`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back{user ? `, ${user.firstName}` : ''}! 👋
              </h1>
              <div className="flex items-center">
                {currentTier.icon}
                <span className="ml-2 text-lg">{currentTier.name} Plan</span>
              </div>
            </div>
            {currentTier.upgrade && (
              <Button
                onClick={handleUpgradeClick}
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                Upgrade to {SUBSCRIPTION_TIERS[currentTier.upgrade].name}
                <ArrowUpRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Workouts Completed"
            value={mockStats.workoutsCompleted}
            icon={<Dumbbell className="w-6 h-6 text-blue-600" />}
            trend={12}
          />
          <StatCard
            title="Current Streak"
            value={`${mockStats.currentStreak} days`}
            icon={<Activity className="w-6 h-6 text-blue-600" />}
            trend={8}
          />
          <StatCard
            title="Monthly Progress"
            value={`${mockStats.monthlyProgress}%`}
            icon={<BarChart2 className="w-6 h-6 text-blue-600" />}
            trend={15}
          />
          <StatCard
            title="Goals Achieved"
            value={mockStats.goalsAchieved}
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
                <ProgressRing progress={68} />
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
                className="bg-blue-50 text-blue-600 hover:bg-blue-100"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
            {questionnaire && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(questionnaire.data).map(([key, value]) => (
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
            )}
          </div>
        </DashboardCard>
      </div>

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

export default Dashboard;