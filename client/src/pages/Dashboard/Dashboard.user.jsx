import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../stores/authStore';
import subscriptionService from '../../services/subscription.service';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Award, Crown, Zap, Calendar, BarChart2, Dumbbell, Activity, Clock, Badge, User, CheckCircle, MessageSquare, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { usePoints } from '../../hooks/usePoints';
import { useSocket } from '../../SocketContext';
import Progress from '@/components/ui/progress';

// Import components
import WelcomeHeader from './ClientOrganization/WelcomeHeader';
import StatisticsGrid from './ClientOrganization/StatisticsGrid';
import GoalsSection from './ClientOrganization/GoalsSection';
import WorkoutSection from './ClientOrganization/WorkoutSection';
import ProgressSection from './ClientOrganization/ProgressSection';
import ProfileSection from './ClientOrganization/ProfileSection';
import UpcomingSessions from './ClientOrganization/UpcomingSessions';
import SessionsView from '../../components/subscription/SessionsView';
import Chat from './components/Chat';

const createCacheManager = () => {
  // Cache configuration
  const CACHE_DURATION = {
    SUBSCRIPTION: 5 * 60 * 1000, // 5 minutes
    QUESTIONNAIRE: 60 * 60 * 1000, // 1 hour
    COACHES: 30 * 60 * 1000, // 30 minutes
    GOALS: 3 * 60 * 1000, // 3 minutes
    WORKOUTS: 3 * 60 * 1000, // 3 minutes
    DEFAULT: 5 * 60 * 1000 // 5 minutes
  };

  // Cache storage structure
  const getCache = (key) => {
    try {
      const cachedData = localStorage.getItem(`dashboard_cache_${key}`);
      if (!cachedData) return null;
      
      const { data, timestamp, duration } = JSON.parse(cachedData);
      
      // Check if cache is still valid
      const now = Date.now();
      if (now - timestamp > duration) {
        localStorage.removeItem(`dashboard_cache_${key}`);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  };

  // Set cache with expiration
  const setCache = (key, data, customDuration) => {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        duration: customDuration || CACHE_DURATION.DEFAULT
      };
      
      localStorage.setItem(`dashboard_cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Cache storage error:', error);
      // If localStorage is full, clear older caches
      try {
        clearOldCaches();
      } catch (e) {
        console.error('Failed to clear old caches:', e);
      }
    }
  };

  // Clear caches that are older than their duration
  const clearOldCaches = () => {
    try {
      const now = Date.now();
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('dashboard_cache_')) {
          try {
            const cachedData = JSON.parse(localStorage.getItem(key));
            if (now - cachedData.timestamp > cachedData.duration) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            // If the item is corrupted, just remove it
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('Error clearing old caches:', error);
    }
  };

  // Clear specific cache
  const clearCache = (key) => {
    try {
      localStorage.removeItem(`dashboard_cache_${key}`);
    } catch (error) {
      console.error('Cache clearing error:', error);
    }
  };

  // Clear all dashboard caches
  const clearAllCaches = () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('dashboard_cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing all caches:', error);
    }
  };

  return {
    getCache,
    setCache,
    clearCache,
    clearAllCaches,
    CACHE_DURATION
  };
};

// Create API wrapper with caching, rate limiting and retry logic
const createApiWrapper = (cacheManager) => {
  // Tracking for in-flight requests to prevent duplicates
  const pendingRequests = new Map();
  
  // Rate limiting tracking
  const requestTimestamps = [];
  const MAX_REQUESTS_PER_MINUTE = 60;

  // Check if we're being rate limited
  const checkRateLimit = () => {
    const now = Date.now();
    // Remove timestamps older than 1 minute
    while (requestTimestamps.length > 0 && requestTimestamps[0] < now - 60000) {
      requestTimestamps.shift();
    }
    
    return requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE;
  };

  // Add request to rate limit tracker
  const trackRequest = () => {
    requestTimestamps.push(Date.now());
  };

  // Fetch with caching, deduplication and retries
  const fetchWithCache = async (key, fetchFn, options = {}) => {
    const {
      cacheDuration,
      forceRefresh = false,
      retries = 3,
      retryDelay = 1000,
      deduplicate = true,
      onSuccess = null,
      onError = null
    } = options;

    // If this exact request is in flight and deduplication is enabled, wait for it
    const requestKey = `${key}_${JSON.stringify(options)}`;
    if (deduplicate && pendingRequests.has(requestKey)) {
      try {
        return await pendingRequests.get(requestKey);
      } catch (error) {
        // If the pending request fails, continue with a new request
        console.warn('Pending request failed, trying again:', error);
      }
    }

    // Check for cached data if not forcing refresh
    if (!forceRefresh) {
      const cachedData = cacheManager.getCache(key);
      if (cachedData) {
        return cachedData;
      }
    }

    // Check rate limiting
    if (checkRateLimit()) {
      console.warn('Rate limit reached, adding delay...');
      // Add increasing delay based on how many requests are pending
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    }

    // Create a promise for this request
    const requestPromise = (async () => {
      let attempt = 0;
      
      while (attempt < retries) {
        try {
          trackRequest();
          const data = await fetchFn();
          
          // Cache the successful response
          cacheManager.setCache(key, data, cacheDuration);
          
          if (onSuccess) onSuccess(data);
          return data;
        } catch (error) {
          attempt++;
          
          // Handle rate limiting errors specifically
          if (error.response?.status === 429) {
            const retryAfter = parseInt(error.response.headers['retry-after']) || 10;
            console.warn(`Rate limited. Waiting ${retryAfter}s before retry ${attempt}/${retries}`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          } else if (attempt < retries) {
            // For other errors, use exponential backoff
            const delay = retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
            console.warn(`Request failed, retrying in ${Math.round(delay)}ms (${attempt}/${retries}):`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            // Final error after all retries
            if (onError) onError(error);
            throw error;
          }
        }
      }
      
      throw new Error(`Failed after ${retries} attempts`);
    })();
    
    // Store the pending request
    if (deduplicate) {
      pendingRequests.set(requestKey, requestPromise);
      
      // Clean up after the request is complete
      requestPromise
        .catch(() => {})
        .finally(() => {
          pendingRequests.delete(requestKey);
        });
    }
    
    return requestPromise;
  };

  return {
    fetchWithCache
  };
};

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

const ClientDashboard = () => {
  const { user } = useAuth();
  const { socket, notifications } = useSocket();
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
  const [showAllSessions, setShowAllSessions] = useState(false);
  const { addPoints, updatePointsInBackend } = usePoints();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(0);

  // Initialize cache manager and API wrapper
  const cacheManager = useRef(createCacheManager()).current;
  const apiWrapper = useRef(createApiWrapper(cacheManager)).current;

  const overviewRef = useRef(null);
  const workoutsRef = useRef(null);
  const progressRef = useRef(null);
  const profileRef = useRef(null);
  const goalsRef = useRef(null);

  // Generate fallback goals with caching
  const generateFallbackGoals = async (subscriptionData) => {
    try {
      // Check cache for generated goals
      const cacheKey = `generatedGoals_${subscriptionData._id}`;
      const cachedGoals = cacheManager.getCache(cacheKey);
      
      if (cachedGoals) {
        setGoals(cachedGoals);
        return cachedGoals;
      }
      
      const generatedGoals = [];
      
      // Generate default goals based on questionnaire
      if (questionnaire?.data?.goals) {
        const userGoals = Array.isArray(questionnaire.data.goals)
          ? questionnaire.data.goals
          : [];
    
        if (userGoals.includes('strength')) {
          generatedGoals.push({
            id: `goal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: 'Strength Improvement',
            type: 'strength',
            target: 'Increase bench press by 10%',
            progress: Math.min(100, Math.max(0, (subscriptionData.stats?.strengthProgress || 0) * 100)),
            difficulty: 'medium',
            dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
            due: formatDate(new Date(Date.now() + 28 * 24 * 60 * 60 * 1000)),
            status: 'active',
            createdAt: new Date().toISOString(),
            icon: getGoalIcon('strength'),
          });
        }
        
        // Add consistency goal
        generatedGoals.push({
          id: `goal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: 'Workout Consistency',
          type: 'consistency',
          target: `${subscriptionData.stats?.weeklyTarget || 3} workouts per week`,
          progress: Math.min(100, Math.max(0, ((subscriptionData.stats?.workoutsCompleted || 0) / ((subscriptionData.stats?.weeklyTarget || 3) * 4)) * 100)),
          difficulty: 'easy',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          due: formatDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
          status: 'active',
          createdAt: new Date().toISOString(),
          icon: getGoalIcon('consistency'),
        });
      }
    
      // Set goals in the state
      setGoals(generatedGoals);
      
      // Cache the generated goals
      cacheManager.setCache(cacheKey, generatedGoals, cacheManager.CACHE_DURATION.GOALS);
      
      // Save generated goals to the server in the background
      try {
        await subscriptionService.saveQuestionnaireDerivedGoals(subscriptionData._id, generatedGoals);
        console.log('Goals saved to backend successfully');
      } catch (error) {
        console.error('Failed to save goals to backend:', error);
      }
      
      return generatedGoals;
    } catch (error) {
      console.error('Error generating fallback goals:', error);
      return [];
    }
  };

  // Fetch goals with caching
  const fetchGoals = async (subscriptionData) => {
    try {
      // Generate cache key for this subscription's goals
      const cacheKey = `goals_${subscriptionData._id}`;
      
      // Use wrapper to fetch with caching
      const goals = await apiWrapper.fetchWithCache(
        cacheKey,
        async () => {
          const response = await subscriptionService.getClientGoals(subscriptionData._id);
          return Array.isArray(response) && response.length > 0 ? response : null;
        },
        {
          cacheDuration: cacheManager.CACHE_DURATION.GOALS,
          onError: (error) => {
            console.error('Failed to fetch goals, falling back to generated goals:', error);
          }
        }
      );
      
      if (goals) {
        // Use goals from server
        setGoals(goals);
        console.log('Goals fetched from server:', goals);
        return;
      }
      
      // If no goals from server, generate them locally
      await generateFallbackGoals(subscriptionData);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
      // Fall back to local generation
      await generateFallbackGoals(subscriptionData);
    }
  };

  // Handle goal completion request with proper error handling
  const handleRequestGoalCompletion = async (goalId) => {
    try {
      // Find the goal to be completed
      const goal = goals.find(g => g.id === goalId);
      if (!goal) {
        toast.error('Goal not found');
        return;
      }
      
      // Optimistic UI update
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
      
      // Clear the goals cache since we're updating
      cacheManager.clearCache(`goals_${subscription._id}`);
      
      // Send request to the backend with retry
      const retryRequest = async (attempts = 3, delay = 1000) => {
        try {
          return await subscriptionService.requestGoalCompletion(subscription._id, goalId);
        } catch (error) {
          if (attempts <= 1) throw error;
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          return retryRequest(attempts - 1, delay * 2);
        }
      };
      
      const updatedGoal = await retryRequest();
      
      // Update with server response to ensure consistency
      if (updatedGoal) {
        setGoals(goals.map(g => g.id === goalId ? updatedGoal : g));
      }
      
      toast.success('Completion request sent to your coach!', {
        description: 'Your coach will review and approve this goal.'
      });
      
      // Refresh goals from server to ensure sync, but with a delay to avoid immediate request
      setTimeout(() => {
        fetchGoals(subscription);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to request goal completion:', error);
      toast.error('Failed to send completion request');
      
      // Revert optimistic update by refetching
      fetchGoals(subscription);
    }
  };

  // Mark workout as complete with error handling
  const handleCompleteWorkout = async (workout) => {
    try {
      // Update local state
      const updatedWorkouts = workouts.map(w =>
        w.id === workout.id ? { ...w, completed: true, completedDate: new Date().toISOString() } : w
      );

      setWorkouts(updatedWorkouts);

      // Update workout data on server with retry logic
      const updateWithRetry = async (attempts = 3, delay = 1000) => {
        try {
          await subscriptionService.updateClientWorkouts(subscription._id, updatedWorkouts);
        } catch (error) {
          if (attempts <= 1) throw error;
          
          console.warn(`Retry ${4-attempts}/3 for updating workouts...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return updateWithRetry(attempts - 1, delay * 2);
        }
      };
      
      await updateWithRetry();

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

      // Clear relevant caches
      cacheManager.clearCache(`subscription_${subscription._id}`);
      cacheManager.clearCache(`workouts_${subscription._id}`);

      // Update stats on server
      await subscriptionService.updateClientStats(subscription._id, updatedStats);

      toast.success('Workout completed! Great job!');
    } catch (error) {
      console.error('Failed to mark workout as complete:', error);
      toast.error('Failed to update workout status');
      
      // Revert local state by re-fetching
      const refreshData = async () => {
        try {
          const subData = await subscriptionService.getCurrentSubscription();
          if (subData?.workouts) {
            setWorkouts(subData.workouts);
          }
        } catch (refreshError) {
          console.error('Failed to refresh workout data:', refreshError);
        }
      };
      
      refreshData();
    }
  };

  // Update stats with caching and error handling
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
      
      // Clear the subscription cache
      cacheManager.clearCache(`subscription_${subscription._id}`);

      // Update stats on server with retry logic
      const updateWithRetry = async (attempts = 3, delay = 1000) => {
        try {
          await subscriptionService.updateClientStats(subscription._id, updatedStats);
        } catch (error) {
          if (attempts <= 1) throw error;
          
          console.warn(`Retry ${4-attempts}/3 for updating stats...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return updateWithRetry(attempts - 1, delay * 2);
        }
      };
      
      await updateWithRetry();

      toast.success('Stats updated successfully!');
    } catch (error) {
      console.error('Failed to update stats:', error);
      toast.error('Failed to update stats');
      
      // Revert changes in the UI
      // Get from cache or re-fetch to restore previous state
      const cachedSubscription = cacheManager.getCache(`subscription_${subscription._id}`);
      if (cachedSubscription) {
        setSubscription(cachedSubscription);
      } else {
        try {
          const refreshedSubscription = await subscriptionService.getCurrentSubscription();
          setSubscription(refreshedSubscription);
        } catch (refreshError) {
          console.error('Failed to refresh subscription data:', refreshError);
        }
      }
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

  // Update a goal
  const handleUpdateGoal = async (updatedGoal) => {
    try {
      // Update goals in local state with optimistic approach
      const updatedGoals = goals.map(goal =>
        goal.id === updatedGoal.id ? updatedGoal : goal
      );

      setGoals(updatedGoals);
      
      // Clear the goals cache
      cacheManager.clearCache(`goals_${subscription._id}`);

      // Update goal on the server with retry logic
      const updateWithRetry = async (attempts = 3, delay = 1000) => {
        try {
          // If this were a real app, you would update the goal on the server
          // For now, we mock this with a delay to simulate a network request
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // In the real implementation, you'd use something like:
          // await subscriptionService.updateGoal(subscription._id, updatedGoal);
          
          return true;
        } catch (error) {
          if (attempts <= 1) throw error;
          
          console.warn(`Retry ${4-attempts}/3 for updating goal...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return updateWithRetry(attempts - 1, delay * 2);
        }
      };
      
      await updateWithRetry();

      toast.success('Goal progress updated successfully!');
    } catch (error) {
      console.error('Failed to update goal:', error);
      toast.error('Failed to update goal progress');
      
      // Revert changes by refetching goals
      fetchGoals(subscription);
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    scrollToSection(value);
  };

  // Add metric entry with error handling
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
      
      // Clear the progress cache
      cacheManager.clearCache(`progress_${subscription._id}`);

      // Update progress on server with retry logic
      const updateWithRetry = async (attempts = 3, delay = 1000) => {
        try {
          await subscriptionService.updateClientProgress(subscription._id, updatedProgress);
        } catch (error) {
          if (attempts <= 1) throw error;
          
          console.warn(`Retry ${4-attempts}/3 for updating progress...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return updateWithRetry(attempts - 1, delay * 2);
        }
      };
      
      await updateWithRetry();

      toast.success('Metric entry added successfully!');
    } catch (error) {
      console.error('Failed to add metric entry:', error);
      toast.error('Failed to add metric entry');
      
      // Revert local state by re-fetching the data
      try {
        const refreshedSubscription = await subscriptionService.getCurrentSubscription();
        if (refreshedSubscription?.progress) {
          setProgress(refreshedSubscription.progress);
          
          // Rebuild health metrics from the progress data
          setHealthMetrics({
            weight: Array.isArray(refreshedSubscription.progress.weightProgress) ? refreshedSubscription.progress.weightProgress : [],
            bodyFat: Array.isArray(refreshedSubscription.progress.bodyFatProgress) ? refreshedSubscription.progress.bodyFatProgress : [],
            strength: Array.isArray(refreshedSubscription.progress.strengthProgress) ? refreshedSubscription.progress.strengthProgress : [],
            cardio: Array.isArray(refreshedSubscription.progress.cardioProgress) ? refreshedSubscription.progress.cardioProgress : [],
          });
        }
      } catch (refreshError) {
        console.error('Failed to refresh progress data:', refreshError);
      }
    }
  };

  // Create an optimized data fetching function with caching and error handling
  const fetchDashboardData = async (forceRefresh = false) => {
    // If already refreshing, don't trigger another refresh
    if (isRefreshing && !forceRefresh) return;
    
    // Check if we've refreshed recently (within the last 10 seconds) unless forced
    const now = Date.now();
    if (!forceRefresh && now - lastRefresh < 10000) {
      console.log('Skipping refresh - too recent');
      return;
    }
    
    setIsRefreshing(true);
    setLastRefresh(now);
    
    try {
      if (!forceRefresh) setLoading(true);
      
      const accessToken = localStorage.getItem('accessToken');

      // Load subscription with caching
      const subData = await apiWrapper.fetchWithCache(
        `subscription_${user?.id || accessToken}`,
        async () => await subscriptionService.getCurrentSubscription(accessToken),
        { 
          cacheDuration: cacheManager.CACHE_DURATION.SUBSCRIPTION,
          forceRefresh
        }
      );

      // If no subscription, redirect to coaching page
      if (!subData) {
        toast.error('No active subscription found');
        navigate('/coaching');
        return;
      }

      // Load questionnaire data with caching
      const questionnaireData = await apiWrapper.fetchWithCache(
        `questionnaire_${user?.id || accessToken}`,
        async () => await subscriptionService.checkQuestionnaireStatus(user?.id || accessToken),
        { 
          cacheDuration: cacheManager.CACHE_DURATION.QUESTIONNAIRE,
          forceRefresh
        }
      );

      // Redirect to questionnaire if not completed
      if (!questionnaireData?.completed) {
        navigate('/questionnaire', {
          state: { subscription: subData, accessToken: accessToken || null },
        });
        return;
      }

      // Store a copy of the stats for historical comparison
      setHistoricalStats({
        workoutsCompleted: Math.max(0, (subData.stats?.workoutsCompleted || 0) - 2),
        currentStreak: Math.max(0, (subData.stats?.currentStreak || 0) - 1),
        monthlyProgress: Math.max(0, (subData.stats?.monthlyProgress || 0) - 5),
        goalsAchieved: Math.max(0, (subData.stats?.goalsAchieved || 0)),
      });

      setSubscription(subData);
      setQuestionnaire(questionnaireData);

      // Get coach details if assigned, with caching
      if (subData.assignedCoach) {
        try {
          const coaches = await apiWrapper.fetchWithCache(
            'coaches_list',
            async () => await subscriptionService.getCoaches(),
            { 
              cacheDuration: cacheManager.CACHE_DURATION.COACHES,
              forceRefresh: forceRefresh || !assignedCoach
            }
          );
          
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

      // Fetch goals with its own caching mechanism
      await fetchGoals(subData);

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
      setIsRefreshing(false);
    }
  };

  // Handle initial data loading
  useEffect(() => {
    // Check if we have cached data to show immediately
    const loadCachedData = () => {
      const accessToken = localStorage.getItem('accessToken');
      const cacheKey = `subscription_${user?.id || accessToken}`;
      const cachedSubscription = cacheManager.getCache(cacheKey);
      
      if (cachedSubscription) {
        console.log('Loading from cache while fetching fresh data');
        setSubscription(cachedSubscription);
        
        // Load other cached data
        const cachedQuestionnaire = cacheManager.getCache(`questionnaire_${user?.id || accessToken}`);
        if (cachedQuestionnaire) setQuestionnaire(cachedQuestionnaire);
        
        // If we have cached data, we can show it while fetching fresh data
        setLoading(false);
      }
    };
    
    // Try to load cached data first
    loadCachedData();
    
    // Then fetch fresh data
    fetchDashboardData(true);
    
    // Set up a more reasonable refresh interval - every 3 minutes instead of constantly
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('Background refresh triggered');
        fetchDashboardData(false);
      }
    }, 3 * 60 * 1000); // Every 3 minutes
    
    // Handle tab visibility changes - refresh when tab becomes visible after being hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check when the last refresh was
        const now = Date.now();
        // Only refresh if it's been more than 2 minutes since the last refresh
        if (now - lastRefresh > 2 * 60 * 1000) {
          console.log('Visibility change triggered refresh');
          fetchDashboardData(false);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up interval and event listener
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Handle socket events with improved error handling
  useEffect(() => {
    const socketInstance = socket?.socket || socket;
    
    if (socketInstance && subscription) {
    
      const handleGoalApproved = (data) => {
        const { goalId, title, pointsAwarded, status } = data;
        
        // Update goals with optimistic approach but verify data
        if (goalId) {
          setGoals(prevGoals => 
            prevGoals.map(goal => 
              goal.id === goalId 
                ? { 
                    ...goal, 
                    status: 'completed',
                    completed: true,
                    completedDate: new Date().toISOString(),
                    pointsAwarded,
                    progress: 100
                  } 
                : goal
            )
          );
          
          // Clear goals cache since data changed
          cacheManager.clearCache(`goals_${subscription._id}`);
          
          // Update subscription stats
          setSubscription(prevSub => {
            const updatedSub = {
              ...prevSub,
              stats: {
                ...prevSub.stats,
                goalsAchieved: (prevSub.stats?.goalsAchieved || 0) + 1
              }
            };
            
            // Update the cache with the new data
            cacheManager.setCache(`subscription_${user?.id}`, updatedSub, cacheManager.CACHE_DURATION.SUBSCRIPTION);
            
            return updatedSub;
          });
          
          // Award points
          if (addPoints && pointsAwarded) {
            addPoints(pointsAwarded);
            
            // Use a debounced approach for updating points on the backend
            const updatePoints = () => {
              try {
                updatePointsInBackend(user?.points + pointsAwarded || pointsAwarded);
              } catch (error) {
                console.error('Failed to update points:', error);
              }
            };
            
            // Delay slightly to avoid rate limiting
            setTimeout(updatePoints, 500);
          }
        }
      };
      
      const handleGoalRejected = (data) => {
        const { goalId, title, reason, status } = data;
        
        if (goalId) {
          setGoals(prevGoals => 
            prevGoals.map(goal => 
              goal.id === goalId 
                ? { 
                    ...goal, 
                    status: 'active',
                    clientRequestedCompletion: false,
                    clientCompletionRequestDate: null,
                    rejectionReason: reason,
                    rejectedAt: new Date().toISOString()
                  } 
                : goal
            )
          );
          
          // Clear goals cache since data changed
          cacheManager.clearCache(`goals_${subscription._id}`);
        }
      };

      if (typeof socketInstance.on === 'function') {
        socketInstance.on('goalApproved', handleGoalApproved);
        socketInstance.on('goalRejected', handleGoalRejected);
      
        return () => {
          if (typeof socketInstance.off === 'function') {
            socketInstance.off('goalApproved', handleGoalApproved);
            socketInstance.off('goalRejected', handleGoalRejected);
          }
        };
      } else {
        console.warn('Socket is not properly initialized or missing .on method');
      }
    }
  }, [socket, subscription, addPoints, updatePointsInBackend, user]);

  const currentTier = SUBSCRIPTION_TIERS[subscription?.subscription || 'basic'];

  const scrollToSection = (sectionId) => {
    const sectionRefs = {
      overview: overviewRef,
      workouts: workoutsRef,
      progress: progressRef,
      profile: profileRef,
      goals: goalsRef
    };
    
    const ref = sectionRefs[sectionId];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full drop-shadow-lg"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 dark:from-gray-950 dark:to-indigo-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <WelcomeHeader
          user={user}
          subscription={subscription}
          assignedCoach={assignedCoach}
          onChatOpen={() => setShowChat(true)}
          onUpgradeClick={handleUpgradeClick}
        />

        {/* Notification Banner for upcoming workout with enhanced styling */}
        {upcomingWorkout && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex justify-between items-center shadow-lg shadow-blue-500/5 dark:shadow-blue-900/5"
          >
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-300">Upcoming workout: {upcomingWorkout.title}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">{formatDate(upcomingWorkout.date)} {upcomingWorkout.time && `at ${upcomingWorkout.time}`}</p>
              </div>
            </div>
            <Button
              onClick={() => {
                handleTabChange('workouts');
              }}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-300"
            >
              View Details
            </Button>
          </motion.div>
        )}

        {/* Navigation Tabs with enhanced styling */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange}>
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

          {/* Overview Tab with enhanced styling */}
          <TabsContent value="overview" ref={overviewRef}>
            <div className="space-y-6">
              {/* Stats Grid with enhanced styling */}
              <StatisticsGrid
                stats={subscription?.stats || {}}
                historicalStats={historicalStats || {}}
                onStatClick={(tab) => handleTabChange(tab)}
              />

              {/* Goals Section with enhanced styling */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-1 rounded-lg shadow-lg shadow-indigo-500/5 dark:shadow-indigo-900/5">
                <GoalsSection
                  goals={goals}
                  onUpdateGoal={handleUpdateGoal}
                  onCompleteGoal={handleRequestGoalCompletion}
                  onViewAll={() => handleTabChange('goals')} 
                  subscription={subscription}
                />
              </div>

              {/* Workouts Section with enhanced styling */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-1 rounded-lg shadow-lg shadow-blue-500/5 dark:shadow-blue-900/5">
                <WorkoutSection
                  workouts={workouts}
                  stats={subscription?.stats || {}}
                  onCompleteWorkout={handleCompleteWorkout}
                  onViewAll={() => handleTabChange('workouts')}
                />
              </div>

              {/* Sessions Section with enhanced styling */}
              <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-1 rounded-lg shadow-lg shadow-green-500/5 dark:shadow-green-900/5">
                <UpcomingSessions 
                  subscription={subscription}
                  onViewAll={() => {
                    setActiveTab('sessions');
                    setShowAllSessions(true);
                  }}
                />
              </div>

              {/* Subscription Features with enhanced styling */}
              <Card className={`overflow-hidden shadow-xl ${currentTier.shadow} transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${currentTier.gradientBg} border-0`}>
                <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${currentTier.color}`}></div>
                <CardHeader className="pt-6">
                  <div className="flex items-center mb-2">
                    {currentTier.icon}
                    <CardTitle className="ml-2">Your {currentTier.name} Plan Features</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {currentTier.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" />
                        <span className="dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                {currentTier.upgrade && (
                  <CardFooter className="bg-gradient-to-r from-white/50 to-white/80 dark:from-gray-800/30 dark:to-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                    <Button
                      onClick={handleUpgradeClick}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-colors duration-300"
                    >
                      Upgrade to {SUBSCRIPTION_TIERS[currentTier.upgrade].name}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Workouts Tab with enhanced styling */}
          <TabsContent value="workouts" ref={workoutsRef}>
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-1 rounded-lg shadow-lg shadow-blue-500/5 dark:shadow-blue-900/5">
              <WorkoutSection
                workouts={workouts}
                stats={subscription?.stats || {}}
                onCompleteWorkout={handleCompleteWorkout}
                showAll={true}
              />
            </div>
          </TabsContent>

          {/* Progress Tab with enhanced styling */}
          <TabsContent value="progress" ref={progressRef}>
            <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-1 rounded-lg shadow-lg shadow-green-500/5 dark:shadow-green-900/5">
              <ProgressSection
                stats={subscription?.stats || {}}
                healthMetrics={healthMetrics}
                onUpdateStats={handleUpdateStats}
                onAddMetricEntry={handleAddMetricEntry}
              />
            </div>
          </TabsContent>

          {/* Session Tab with enhanced styling */}
          <TabsContent value="sessions">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-1 rounded-lg shadow-lg shadow-amber-500/5 dark:shadow-amber-900/5">
              <SessionsView subscription={subscription} />
            </div>
          </TabsContent>

          {/* Profile Tab with enhanced styling */}
          <TabsContent value="profile" ref={profileRef}>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-1 rounded-lg shadow-lg shadow-indigo-500/5 dark:shadow-indigo-900/5">
              <ProfileSection
                subscription={subscription}
                questionnaire={questionnaire}
                currentTier={currentTier}
                onEditQuestionnaire={handleEditQuestionnaire}
                onManageSubscription={handleManageSubscription}
                onUpgradeClick={handleUpgradeClick}
              />
            </div>
          </TabsContent>

          <TabsContent value="goals" ref={goalsRef}>
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-1 rounded-lg shadow-lg shadow-purple-500/5 dark:shadow-purple-900/5">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Your Goals</h2>
                
                {/* Pending Approvals Section */}
                {goals.filter(g => g.status === 'pending_approval' || g.clientRequestedCompletion).length > 0 && (
                  <div className="bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg p-4 mb-4">
                    <h3 className="flex items-center text-lg font-semibold text-amber-800 dark:text-amber-400 mb-2">
                      <Clock className="w-5 h-5 mr-2" />
                      Pending Coach Approval
                    </h3>
                    <p className="text-amber-700 dark:text-amber-400 mb-4">
                      These goals are waiting for your coach's review and approval.
                    </p>
                    
                    <div className="space-y-3">
                      {goals
                        .filter(g => g.status === 'pending_approval' || g.clientRequestedCompletion)
                        .map(goal => (
                          <div key={goal.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-amber-200 dark:border-amber-700/50 shadow-md">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-lg dark:text-white">{goal.title}</h4>
                              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-200 dark:border-amber-700/50">
                                Awaiting Approval
                              </Badge>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-3">{goal.target}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Submitted: {formatDate(goal.clientCompletionRequestDate || new Date())}
                            </p>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
                
                {/* Active Goals Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center text-gray-800 dark:text-gray-200 mb-3">
                    <Target className="w-4 h-4 mr-2" />
                    Active Goals
                  </h3>
                  
                  {goals.filter(g => !g.completed && g.status === 'active').length > 0 ? (
                    <div className="space-y-4">
                      {goals
                        .filter(g => !g.completed && g.status === 'active')
                        .map(goal => (
                          <div key={goal.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div className="flex items-center mb-2">
                              {goal.icon || getGoalIcon(goal.type)}
                              <h4 className="font-medium text-lg ml-2 dark:text-white">{goal.title}</h4>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-3">{goal.target}</p>
                            
                            <div className="space-y-1 mb-3">
                              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>Progress</span>
                                <span>{goal.progress}%</span>
                              </div>
                              <Progress value={goal.progress} className="h-2 bg-gray-200 dark:bg-gray-700" />
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-500 dark:text-gray-400">Due: {goal.due}</p>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors duration-300"
                                onClick={() => handleRequestGoalCompletion(goal.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Request Completion
                              </Button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    goals.filter(g => g.status === 'pending_approval' || g.clientRequestedCompletion).length === 0 && (
                      <div className="text-center py-8 bg-gray-50/70 dark:bg-gray-800/50 rounded-lg shadow-inner">
                        <Target className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                        <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No active goals</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Your coach will assign goals for you to work on.</p>
                      </div>
                    )
                  )}
                </div>

    
    {/* Completed Goals Section */}
    {goals.filter(g => g.completed || g.status === 'completed').length > 0 && (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Completed Goals</h3>
        <div className="space-y-4">
          {goals
            .filter(g => g.completed || g.status === 'completed')
            .map(goal => (
              <div key={goal.id} className="bg-white p-4 rounded-lg border border-green-200 ">
                <div className="flex items-center mb-2">
                  {goal.icon || getGoalIcon(goal.type)}
                  <h4 className="font-medium text-lg ml-2">{goal.title}</h4>
                  <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">
                    Completed
                  </Badge>
                </div>
                <p className="text-gray-600 mb-2">{goal.target}</p>
                <p className="text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 inline mr-1" /> 
                  Completed on {formatDate(goal.completedDate)}
                </p>
                {goal.pointsAwarded > 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    <Award className="w-4 h-4 inline mr-1" />
                    Earned {goal.pointsAwarded} points
                  </p>
                )}
              </div>
            ))
          }
        </div>
      </div>
    )}
  </div>
</div>
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