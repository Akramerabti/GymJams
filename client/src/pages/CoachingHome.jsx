import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Award, Calendar, MessageCircle, ChevronDown, 
  CheckCircle, Lock, Sparkles, Star, Instagram, Twitter, Youtube,
  X, ExternalLink, Coins,Shield,User
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../stores/authStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '../services/api';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import subscriptionService from '../services/subscription.service';

const CoachingHome = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { user } = useAuth();
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [accessError, setAccessError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [coaches, setCoaches] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Define the base URL
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fallback image URL
  const fallbackAvatarUrl = `${baseUrl}/uploads/fallback-avatar.jpg`;

  useEffect(() => {
    // Check for dark mode
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark-mode');
      setIsDarkMode(isDark);
    };

    // Check initial state
    checkDarkMode();

    // Set up observer for dark mode changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' && 
            mutation.target === document.documentElement) {
          checkDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Clean up
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        if (user) {
          console.log('User:', user);
          if ((user.role || user.user?.role) === 'coach') {
            console.log('User is a coach');
            navigate('/dashboard');
            return;
          }
          const response = await api.get('/subscription/current');
          if (response.data && response.data.status === 'active') {
            navigate('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCoaches = async () => {
      try {
        const response = await subscriptionService.getCoaches();
        setCoaches(response);
        console.log('Coaches:', response);
      } catch (error) {
        console.error('Error fetching coaches:', error);
      }
    };

    fetchCoaches();
    checkSubscription();
  }, [user, navigate]);

  const features = [
    {
      icon: <Calendar className="w-12 h-12 text-blue-600 dark:text-blue-400" />,
      title: 'Personalized Training',
      description: 'Get custom workout plans tailored to your goals and schedule',
    },
    {
      icon: <MessageCircle className="w-12 h-12 text-blue-600 dark:text-blue-400" />,
      title: 'Expert Guidance',
      description: 'Direct communication with certified fitness coaches',
    },
    {
      icon: <Award className="w-12 h-12 text-blue-600 dark:text-blue-400" />,
      title: 'Progress Tracking',
      description: 'Track your improvements with detailed analytics and feedback',
    },
  ];

  const subscriptionPlans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 39.99,
      pointsPerMonth: 100,
      features: [
        'Training/Nutrition plan',
        'Monthly plan updates',
        'Text support',
        '100 points monthly',
      ],
      color: isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
      borderColor: 'border-blue-200',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 69.99,
      pointsPerMonth: 200,
      features: [
        'Advanced training plan',
        'Nutrition guidance',
        'Weekly plan updates',
        'Priority support',
        '200 points monthly',
      ],
      color: isDarkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200',
      borderColor: 'border-blue-400',
      popular: true,
    },
    {
      id: 'elite',
      name: 'Elite',
      price: 89.99,
      pointsPerMonth: 500,
      features: [
        'Custom training and nutrition plan',
        'Weekly video/call consultations',
        'Enhanced questionnaire',
        'Tailored coach',
        '500 points monthly',
      ],
      color: isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
      borderColor: 'border-blue-200',
    },
  ];

  const handleSelectPlan = (plan) => {
    if (!user) {
      setSelectedPlan(plan);
      setIsModalOpen(true);
    } else {
      navigate('/subscription-checkout', {
        state: {
          plan,
          returnUrl: '/questionnaire',
        },
      });
    }
  };

  const handleContinueWithoutLogin = () => {
    navigate('/subscription-checkout', {
      state: {
        plan: selectedPlan,
        returnUrl: '/questionnaire',
      },
    });
    setIsModalOpen(false);
  };

  const handleSubscriptionAccess = async (e) => {
    e.preventDefault();
    setAccessError('');

    try {
      await subscriptionService.verifyAccessToken(accessToken);
      navigate('/dashboard', { state: { accessToken } }); // Pass the access token in the state
      toast.success('Successfully accessed subscription!');
    } catch (error) {
      setAccessError('Invalid or expired access token');
      toast.error('Failed to access subscription');
    }
  };

  const handleLogin = () => {
    navigate('/login');
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Hero Section with Parallax Effect */}
      <motion.section
        className="relative bg-gradient-to-b from-blue-900 to-blue-700 dark:from-blue-950 dark:to-blue-800 text-white py-20 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 bg-[url('/images/gym-hero.jpg')] bg-cover bg-center opacity-50 dark:opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/70 dark:to-blue-950/70"></div>
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <motion.h1
              className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-xl"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Transform Your Fitness Journey
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Get personalized coaching and achieve your fitness goals faster
            </motion.p>
            <motion.button
              onClick={() => document.getElementById('plans').scrollIntoView({ behavior: 'smooth' })}
              className="bg-white dark:bg-gray-100 text-blue-500 dark:text-blue-300 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors inline-flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              View Plans
              <ArrowRight className="ml-2 w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* Subscription Access Section - ENHANCED */}
      <section className={`
        py-12 relative overflow-hidden
        ${isDarkMode 
          ? 'bg-gradient-to-r from-blue-950 via-indigo-950 to-blue-950' 
          : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50'}
      `}>
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute top-1/4 left-1/6 w-64 h-64 rounded-full bg-blue-400 blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-indigo-500 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <AnimatePresence>
            {!showAccessForm ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-xl mx-auto text-center"
              >
                <motion.button
                  onClick={() => setShowAccessForm(true)}
                  className={`
                    group flex items-center justify-center space-x-2 mx-auto py-3 px-6 rounded-full
                    ${isDarkMode 
                      ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/70' 
                      : 'bg-white/80 text-blue-600 hover:bg-white'}
                    backdrop-blur-sm shadow-lg border border-blue-500/20 hover:border-blue-500/40
                    transition-all duration-300 transform hover:scale-105
                  `}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Lock className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-medium">Already have a subscription? Access it here</span>
                  <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform duration-300" />
                </motion.button>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-md mx-auto"
              >
                <div className={`
                  relative backdrop-blur-md p-8 rounded-2xl shadow-xl
                  ${isDarkMode 
                    ? 'bg-gray-900/70 border border-gray-700' 
                    : 'bg-white/90 border border-blue-100'}
                `}>
                  <button 
                    onClick={() => setShowAccessForm(false)}
                    className={`
                      absolute top-4 right-4 p-1.5 rounded-full
                      ${isDarkMode 
                        ? 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700' 
                        : 'bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200'}
                      transition-colors duration-200
                    `}
                  >
                    <X size={16} />
                  </button>
                  
                  <h3 className={`
                    text-xl font-bold mb-4 flex items-center
                    ${isDarkMode ? 'text-white' : 'text-gray-900'}
                  `}>
                    <Lock className="w-5 h-5 mr-2 text-blue-500" />
                    Access Your Subscription
                  </h3>
                  
                  <p className={`
                    text-sm mb-6
                    ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                  `}>
                    Enter your access token to continue with your existing subscription.
                  </p>
                  
                  <form onSubmit={handleSubscriptionAccess} className="space-y-4">
                    <div>
                      <label className={`
                        block text-sm font-medium mb-2
                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}
                      `}>
                        Access Token
                      </label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Enter your subscription access token"
                          value={accessToken}
                          onChange={(e) => setAccessToken(e.target.value)}
                          className={`
                            pl-10
                            ${accessError ? 'border-red-500 dark:border-red-700' : ''}
                            ${isDarkMode 
                              ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'}
                          `}
                        />
                        <span className="absolute left-3 top-3 text-gray-400">
                          <Lock className="w-4 h-4" />
                        </span>
                      </div>
                      {accessError && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center"
                        >
                          <X className="w-4 h-4 mr-1" /> {accessError}
                        </motion.p>
                      )}
                    </div>
                    
                    <div className="flex justify-between gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAccessForm(false)}
                        className={`
                          flex-1
                          ${isDarkMode 
                            ? 'bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800' 
                            : 'bg-white hover:bg-gray-50'}
                        `}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Access Subscription
                      </Button>
                    </div>
                    
                    <p className={`
                      text-xs text-center mt-3
                      ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                    `}>
                      Lost your access token? <a href="/contact" className="text-blue-500 hover:text-blue-600 hover:underline">Contact support</a>
                    </p>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Features Section with Animated Icons */}
      <section className={`
        py-20 
        ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}
        transition-colors duration-300
      `}>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`
                  text-center p-8 rounded-2xl transition-all duration-300
                  ${isDarkMode 
                    ? 'hover:bg-gray-800/80 shadow-lg shadow-blue-900/5' 
                    : 'hover:bg-white hover:shadow-xl'}
                `}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: [0, -10, 10, -5, 5, 0] }}
                  transition={{ duration: 0.5 }}
                  className="mx-auto w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6"
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coaches Section - ENHANCED */}
      <section className={`
        py-20 relative overflow-hidden
        ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}
        transition-colors duration-300
      `}>
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute top-0 left-0 w-full h-64 -translate-y-1/2 opacity-5" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
              fill={isDarkMode ? "#3B82F6" : "#93C5FD"}></path>
          </svg>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-5 translate-x-1/4 translate-y-1/4"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-5 -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Meet Our Expert Coaches
            </motion.h2>
            <motion.p
              className={`max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Our certified professionals are ready to guide you on your fitness journey with personalized training and expert advice.
            </motion.p>
          </div>
          
          {coaches.length > 0 ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
    {coaches.map((coach, index) => (
      <motion.div
        key={coach._id}
        className={`
          rounded-2xl overflow-hidden transition-all duration-300
          ${isDarkMode 
            ? 'bg-gray-800 border border-gray-700 hover:border-blue-600' 
            : 'bg-white border border-gray-100 hover:border-blue-300'} 
          group hover:shadow-2xl hover:-translate-y-2
        `}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        {/* Coach Image */}
        <div className="relative h-64 overflow-hidden">
          {coach.profileImage ? (
            <img 
              src={coach.profileImage} 
              alt={`Coach ${coach.firstName}`}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = fallbackAvatarUrl; 
              }}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <User className={`w-24 h-24 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
          )}
          <div className={`absolute bottom-0 left-0 right-0 p-4 ${isDarkMode ? 'bg-gradient-to-t from-black/80 to-transparent' : 'bg-gradient-to-t from-black/70 to-transparent'}`}>
            <h3 className="text-xl font-bold text-white drop-shadow-sm">
              {coach.firstName} {coach.lastName}
            </h3>
          </div>
        </div>
        
        {/* Coach Details */}
        <div className="p-6">
          {/* Coach Specialties */}
          <div className="mb-4 flex flex-wrap gap-2">
            {coach.specialties && coach.specialties.length > 0 ? (
              coach.specialties.slice(0, 3).map((specialty, idx) => (
                <span key={idx} className={`
                  text-xs px-2 py-1 rounded-full
                  ${isDarkMode 
                    ? 'bg-blue-900/30 text-blue-300' 
                    : 'bg-blue-100 text-blue-800'}
                `}>
                  {specialty}
                </span>
              ))
            ) : (
              <span className={`
                text-xs px-2 py-1 rounded-full
                ${isDarkMode 
                  ? 'bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 text-gray-700'}
              `}>
                Fitness Coach
              </span>
            )}
            {coach.specialties && coach.specialties.length > 3 && (
              <span className={`
                text-xs px-2 py-1 rounded-full
                ${isDarkMode 
                  ? 'bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 text-gray-700'}
              `}>
                +{coach.specialties.length - 3} more
              </span>
            )}
          </div>
          
          {/* Coach Rating if available */}
          {coach.rating && (
            <div className="flex items-center mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${
                      i < Math.floor(coach.rating) 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-300 dark:text-gray-600'
                    }`} 
                  />
                ))}
              </div>
              <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {coach.rating.toFixed(1)}
              </span>
            </div>
          )}
          
          {/* Coach Bio (truncated) */}
          {coach.bio && (
            <p className={`text-sm mb-4 line-clamp-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {coach.bio}
            </p>
          )}
          
          {/* Social links if available */}
          {coach.socialLinks && (
            <div className="flex space-x-2 mb-4">
              {coach.socialLinks.instagram && (
                <a 
                  href={coach.socialLinks.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <Instagram className="w-4 h-4 text-pink-500" />
                </a>
              )}
              {coach.socialLinks.twitter && (
                <a 
                  href={coach.socialLinks.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <Twitter className="w-4 h-4 text-blue-400" />
                </a>
              )}
            </div>
          )}
          
          {/* Call-to-action button */}
          <button
            onClick={() => handleSelectPlan(subscriptionPlans[1])} // Default to premium plan
            className={`
              w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center
              ${isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'}
              transition-colors duration-300
            `}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            See Coaching Plans
          </button>
        </div>
      </motion.div>
    ))}
  </div>
) : (
  <div className="text-center py-16">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto"
    >
      <div className={`
        rounded-xl shadow-lg p-8 
        ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}
      `}>
        <div className={`
          w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center
          ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}
        `}>
          <svg 
            className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No Coaches Available</h3>
        <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          We're currently expanding our team of expert coaches. Check back soon!
        </p>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Interested in joining our coaching team?{' '}
          <a href="/contact" className="text-blue-600 hover:text-blue-700 hover:underline">
            Contact us
          </a>
        </p>
      </div>
    </motion.div>
  </div>
)}
        </div>
      </section>

      {/* Pricing Section with Hover Effects */}
      <section id="plans" className={`
        py-20 relative overflow-hidden
        ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}
        transition-colors duration-300
      `}>
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue-600/5 blur-3xl"></div>
          <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-indigo-600/5 blur-3xl"></div>
          <div className="absolute top-1/2 right-1/2 w-40 h-40 rounded-full bg-blue-600/5 blur-2xl"></div>
          
          {/* Animated sparkles */}
          <motion.div 
            className="absolute top-20 right-20 opacity-30"
            animate={{ 
              y: [0, -10, 0, 10, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          >
            <Sparkles className="w-6 h-6 text-blue-400" />
          </motion.div>
          
          <motion.div 
            className="absolute bottom-40 left-40 opacity-30"
            animate={{ 
              y: [0, 10, 0, -10, 0],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </motion.div>
        </div>
        
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Choose Your Coaching Plan
            </motion.h2>
            <motion.p
              className={`max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Select the perfect coaching plan that aligns with your fitness goals and budget. 
              All plans include personalized attention and expert guidance.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {subscriptionPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                className={`
                  ${plan.color} rounded-2xl overflow-hidden relative border-2
                  ${plan.popular ? 'border-blue-500 dark:border-blue-600' : plan.borderColor}  
                  shadow-lg hover:shadow-xl transition-all duration-300
                  ${plan.popular ? 'md:transform md:scale-105 z-10' : 'z-0'}
                `}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.3 }
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-5 inset-x-0 flex justify-center">
                    <div className="bg-blue-600 text-white px-4 py-1 rounded-full shadow-lg text-sm font-medium flex items-center space-x-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300 mr-1" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}
                
                <div className="p-8">
                  <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <div className="mb-6 flex items-baseline">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className={`ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>/month</span>
                  </div>
                  
                  <div className="mb-6 flex items-center">
                    <div className={`
                      p-2 rounded-full mr-2
                      ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}
                    `}>
                      <Coins className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className={`font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {plan.pointsPerMonth} points monthly
                    </span>
                  </div>
                  
                  <div className={`
                    p-4 rounded-xl mb-6
                    ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}
                  `}>
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <div className="mt-0.5">
                            <CheckCircle className={`
                              w-5 h-5 mr-2
                              ${isDarkMode ? 'text-green-400' : 'text-green-500'}
                            `} />
                          </div>
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelectPlan(plan)}
                    className={`
                      w-full py-4 px-4 rounded-lg font-semibold flex items-center justify-center
                      ${plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : isDarkMode 
                          ? 'bg-gray-800 text-white hover:bg-gray-700' 
                          : 'bg-gray-800 text-white hover:bg-gray-900'
                      }
                      transition-all duration-300 shadow-md hover:shadow-xl
                    `}
                  >
                    Get Started
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Money back guarantee banner */}
          <motion.div 
            className={`
              max-w-3xl mx-auto p-4 rounded-xl flex items-center justify-center space-x-3
              ${isDarkMode ? 'bg-blue-900/20 border border-blue-900/30' : 'bg-blue-50 border border-blue-100'}
            `}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Shield className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              <span className="font-semibold">10-day money-back guarantee.</span> Try risk-free and cancel anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Modal for non-logged-in users */}
      <AnimatePresence>
        {!user && isModalOpen && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ 
                type: "spring", 
                duration: 0.4,
                bounce: 0.2
              }}
              className={`
                bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full relative
                border border-gray-200 dark:border-gray-700
              `}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className={`
                  absolute top-4 right-4 p-2 rounded-full
                  ${isDarkMode 
                    ? 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200'}
                  transition-colors duration-200
                `}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/50">
                  <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                  You're Not Logged In
                </h2>
              </div>

              <p className={`mb-6 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                By logging in, you can earn <strong>GymjTonic points</strong>, which can get you discounts and make future purchases cheaper.
              </p>

              <a
                href="/about-gymjammer-points"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline transition-colors mb-6 block text-center"
              >
                Learn more about Gymtonic points
              </a>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Button
                  onClick={handleLogin}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700 py-3"
                >
                  Log In
                </Button>
                <Button
                  onClick={handleContinueWithoutLogin}
                  className={`flex-1 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 hover:bg-gray-900'} text-white py-3`}
                >
                  Continue Anyway
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CoachingHome;