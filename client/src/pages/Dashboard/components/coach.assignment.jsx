import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Search, CheckCircle, Clock, RefreshCw, Mail, Star, Info, X, Sparkles, Award, Target, Heart, Trophy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import subscriptionService from '../../../services/subscription.service';
import { getFallbackAvatarUrl } from '../../../utils/imageUtils';
  // Define the base URL
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  // Helper function to format image URLs for Supabase compatibility
  const formatImageUrl = (imageUrl) => {
    if (!imageUrl) return getFallbackAvatarUrl();
    
    // If it's already a full URL (Supabase), use it directly
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // For legacy local paths, add the base URL
    if (imageUrl.startsWith('/')) {
      return `${baseUrl}${imageUrl}`;
    }
    
    // For relative paths
    return `${baseUrl}/${imageUrl}`;
  };

const CoachProfileModal = ({ coach, onClose }) => {
  // Function to render a detail row
  const DetailRow = ({ icon: Icon, label, value }) => {
    if (!value) return null;
    
    return (
      <div className="flex items-center space-x-3 mb-2">
        <Icon className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <div>
          <span className="text-gray-600 font-medium mr-2">{label}:</span>
          <span className="text-gray-800">{value}</span>
        </div>
      </div>
    );
  };

  // Prepare coach details with detailed formatting
  const renderCoachDetails = () => {
    const details = [
      // Personal Information
      { 
        section: 'Personal Information', 
        items: [
          { 
            icon: User, 
            label: 'Full Name', 
            value: `${coach.firstName} ${coach.lastName}` 
          },
          { 
            icon: Clock, 
            label: 'Time Zone', 
            value: coach.timeZone 
          }
        ]
      },
      // Professional Details
      { 
        section: 'Professional Profile', 
        items: [
          { 
            icon: Star, 
            label: 'Specialties', 
            value: coach.specialties?.join(' • ') 
          },
          { 
            icon: Star, 
            label: 'Rating', 
            value: coach.rating ? `${coach.rating.toFixed(1)} / 5.0` : null 
          }
        ]
      }
    ];

    return details.map((detailSection, sectionIndex) => (
      <div key={sectionIndex} className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
          {detailSection.section}
        </h3>
        {detailSection.items.map((item, index) => (
          item.value && (
            <DetailRow 
              key={index}
              icon={item.icon}
              label={item.label}
              value={item.value}
            />
          )
        ))}
      </div>
    ));
  };  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 z-20 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
          onClick={onClose}
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Header with Premium Gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 relative overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0.3, 0.8, 0.3],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
          
          <div className="flex items-center space-x-4 relative z-10">
            <div className="relative">
              <img
                src={formatImageUrl(coach.profileImage)}
                alt={`Coach ${coach.firstName} ${coach.lastName}`}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                onError={(e) => {
                  console.error('Image load error for coach:', coach.profileImage);
                  e.target.onerror = null;
                  e.target.src = getFallbackAvatarUrl(); 
                }}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {coach.firstName} {coach.lastName}
                <Award className="w-6 h-6 text-yellow-400" />
              </h2>
              <p className="text-white/90 mt-1">
                {coach.specialties?.join(' • ') || 'Fitness Coach'}
              </p>
              {coach.rating && (
                <div className="flex items-center mt-2 space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(coach.rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-white/90 ml-2 text-sm">
                    {coach.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coach Details */}
        <div className="p-6 space-y-4">
          {/* Bio */}
          {coach.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                About Me
              </h3>
              <p className="text-gray-600 leading-relaxed">{coach.bio}</p>
            </div>
          )}

          {/* Detailed Coach Information */}
          {renderCoachDetails()}
        </div>
      </motion.div>
    </motion.div>
  );
};


const MAX_RETRIES = 2; // Maximum number of retry attempts

const CoachAssignment = ({ subscription, onCoachAssigned }) => {
  const [loading, setLoading] = useState(true);
  const [coaches, setCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [assignmentStatus, setAssignmentStatus] = useState('pending');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [error, setError] = useState(null);
  const [tempSelectedCoach, setTempSelectedCoach] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedCoachForProfile, setSelectedCoachForProfile] = useState(null);
  const [retryCount, setRetryCount] = useState(0); // Track retry attempts
  const navigate = useNavigate();

  const isBasicPlan = subscription?.subscription === 'basic';
  const loadingPhrases = [
    { phrase: "Analyzing your fitness goals...", duration: 1000 },
    { phrase: "Matching with expert coaches...", duration: 2500 },
    { phrase: "Finding your perfect mentor...", duration: 2000 },
    { phrase: "Almost there...", duration: 3500 },
  ];

  // Define vibrant gradient combinations for coach cards
  const gradientCombinations = [
    'from-pink-500 via-rose-500 to-red-500',
    'from-blue-500 via-cyan-500 to-teal-500', 
    'from-purple-500 via-violet-500 to-indigo-500',
    'from-green-500 via-emerald-500 to-cyan-500',
    'from-orange-500 via-amber-500 to-yellow-500',
    'from-indigo-500 via-blue-500 to-purple-500',
    'from-emerald-500 via-green-500 to-lime-500',
    'from-rose-500 via-pink-500 to-purple-500',
    'from-cyan-500 via-blue-500 to-indigo-500',
    'from-amber-500 via-orange-500 to-red-500'
  ];

  useEffect(() => {
    if (assignmentStatus === 'pending') {
      let currentIndex = 0;

      const showNextPhrase = () => {
        setCurrentPhraseIndex(currentIndex);

        if (currentIndex < loadingPhrases.length - 1) {
          currentIndex++;
          setTimeout(showNextPhrase, loadingPhrases[currentIndex].duration);
        }
      };

      setTimeout(showNextPhrase, loadingPhrases[currentIndex].duration);

      return () => clearTimeout(showNextPhrase);
    }
  }, [assignmentStatus]);

  useEffect(() => {
    const initializeCoachAssignment = async () => {
      try {
        setLoading(true);
        if (isBasicPlan) {
          setTimeout(async () => {
            const response = await subscriptionService.assignRandomCoach();
            //('Random Coach Response:', response);
            setSelectedCoach(response.coach);
            setAssignmentStatus('assigned');
            await new Promise(resolve => setTimeout(resolve, 7000));
            onCoachAssigned(response.coach);
          }, 8000);
        } else {
          const response = await subscriptionService.getCoaches();
          //('Coaches Response:', response); // Debugging log          // Ensure response is an array
          if (Array.isArray(response)) {
            //('Number of Coaches:', response.length); // Debugging log
            setCoaches(response); // Set the coaches array directly
          } else {
            console.error('Invalid coaches data:', response);
            setError('No coaches available. Please try again later.');
            setCoaches([]);
          }
        }
      } catch (error) {
        console.error('Error fetching coaches:', error);
        setError('Failed to assign coach. Please try again.');
        setCoaches([]);
      } finally {
        setLoading(false);
      }
    };

    initializeCoachAssignment();
  }, [isBasicPlan, navigate]);

  const handleConfirmSelection = () => {
    if (tempSelectedCoach) {
      handleCoachSelect(tempSelectedCoach);
      setShowConfirmationModal(false);
    }
  };
  const handleCoachSelect = async (coach, retryCount = 0) => {
    try {
      setAssignmentStatus('pending');
      await subscriptionService.assignCoach(coach.id);

      setSelectedCoach(coach);
      setAssignmentStatus('assigned');
      
      // For premium and elite users, show 5-second "Meet Your Coach" animation
      if (subscription?.subscription === 'premium' || subscription?.subscription === 'elite') {
        // Wait 5 seconds to show the coach reveal animation
        setTimeout(() => {
          onCoachAssigned(coach);
        }, 5000);
      } else {
        // For basic users, proceed immediately
        onCoachAssigned(coach);
      }
    } catch (error) {
      console.error('Coach selection error:', error);
      if (retryCount < MAX_RETRIES) {
        // Retry the assignment
        toast.info(`Retrying coach assignment... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
        setTimeout(() => {
          handleCoachSelect(coach, retryCount + 1);
        }, 2000);
      } else {
        setError('Failed to assign coach after multiple attempts. Please contact support.');
        setRetryCount(0); // Reset retry count
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    setAssignmentStatus('pending');
    setCurrentPhraseIndex(0);
    setRetryCount(0); // Reset retry count
  };

  const handleContactSupport = () => {
    navigate('/contact');
  };
  const CoachReveal = ({ selectedCoach }) => {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
      setShowConfetti(true);
    }, []);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative"
        >
          {showConfetti && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 pointer-events-none overflow-hidden"
            >
              {[...Array(60)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: "50%",
                    y: "50%",
                    scale: 0,
                  }}
                  animate={{
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    scale: Math.random() * 0.8 + 0.4,
                    opacity: [1, 0.7, 0],
                    rotate: [0, 360, 720],
                  }}
                  transition={{
                    duration: Math.random() * 3 + 2,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeOut",
                  }}
                  className={`absolute w-3 h-3 ${
                    ['bg-blue-500', 'bg-yellow-400', 'bg-green-400', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-400'][
                      Math.floor(Math.random() * 7)
                    ]
                  } ${
                    Math.random() > 0.5 ? 'rounded-full' : 'rounded-sm'
                  } shadow-lg`}
                />
              ))}
            </motion.div>
          )}

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}            className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-8 rounded-3xl shadow-2xl shadow-gray-900/20 relative overflow-hidden"
          >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 opacity-20">
              <motion.div
                className="absolute top-4 right-4 w-20 h-20 bg-white/20 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <motion.div
                className="absolute bottom-4 left-4 w-16 h-16 bg-white/10 rounded-full"
                animate={{
                  scale: [1.2, 1, 1.2],
                  rotate: [360, 180, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 1 }}              className="p-8 rounded-2xl shadow-2xl relative z-10 bg-white/95 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center space-y-6">
                <motion.div
                  initial={{ rotate: 180, scale: 0 }}
                  animate={{ rotate: 360, scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 1.2 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-md opacity-75"></div>
                  <img
                    src={formatImageUrl(selectedCoach.profileImage)}
                    alt={`Coach ${selectedCoach.firstName} ${selectedCoach.lastName}`}
                    className="relative w-36 h-36 rounded-full object-cover ring-4 ring-white shadow-2xl"
                    onError={(e) => {
                      console.error('Image load error for selected coach:', selectedCoach.profileImage);
                      e.target.onerror = null;
                      e.target.src = getFallbackAvatarUrl(); 
                    }}
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute -bottom-3 -right-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-3 shadow-xl"
                  >
                    <CheckCircle className="w-7 h-7 text-white" />
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.8 }}
                    className="absolute -top-3 -left-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-2 shadow-xl"
                  >
                    <Sparkles className="w-5 h-5 text-white" />
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.7 }}
                  className="text-center space-y-2"
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 2 }}
                    className="flex items-center justify-center gap-2 mb-4"
                  >
                    <Trophy className="w-8 h-8 text-yellow-500" />                    <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                      Meet Your Coach
                    </h3>
                    <Award className="w-8 h-8 text-purple-500" />
                  </motion.div>
                  <h4 className="text-2xl font-bold" style={{ color: '#000' }}>
                    {selectedCoach.firstName} {selectedCoach.lastName}
                  </h4>
                  
                  {selectedCoach.specialties && selectedCoach.specialties.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {selectedCoach.specialties.map((specialty, index) => (
                        <motion.span
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 2.2 + index * 0.1 }}
                          className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm rounded-full shadow-lg"
                        >
                          {specialty}
                        </motion.span>
                      ))}
                    </div>
                  ) : (                    <p className="mt-2 text-gray-600">No specialties listed.</p>
                  )}

                  {selectedCoach.rating && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.5 }}
                      className="flex items-center justify-center mt-4 space-x-1"
                    >
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 2.6 + i * 0.1 }}
                        >
                          <Star
                            className={`w-5 h-5 ${
                              i < Math.floor(selectedCoach.rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </motion.div>
                      ))}                      <span className="ml-2 font-semibold text-gray-700">
                        {selectedCoach.rating.toFixed(1)}
                      </span>
                    </motion.div>                  )}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  };  if (loading) {
    return (
      <Card className="w-full bg-white border-gray-200 shadow-lg">
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center space-y-4">
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
              }}
              className="relative"
            >
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              <div className="absolute inset-0 w-12 h-12 border-4 border-purple-600 border-b-transparent rounded-full opacity-50"></div>
            </motion.div>
            <p className="text-sm font-medium text-gray-600">
              Loading your coaching experience...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }  if (error) {
    return (
      <Card className="w-full bg-white border-gray-200 shadow-lg">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center"
          >
            <X className="w-8 h-8 text-red-600" />
          </motion.div>
          <h3 className="text-2xl font-bold text-red-600">
            Oops! Something went wrong.
          </h3>
          <p className="text-center max-w-md text-gray-600">
            {error}
          </p>
          <div className="flex space-x-4">
            <Button 
              onClick={handleRetry} 
              className="flex items-center transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={handleContactSupport} 
              variant="outline"
              className="flex items-center transition-all duration-200 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (isBasicPlan) {
    return (
      <Card className="w-full bg-white border-gray-200 shadow-lg mt-10">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="flex items-center text-gray-800">
            <Clock className="w-5 h-5 mr-2 text-blue-500" />
            Coach Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6">
            {assignmentStatus === 'pending' ? (
              <motion.div className="relative overflow-hidden rounded-2xl">
                {/* Premium Animated Background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-indigo-600/20 rounded-2xl"
                  animate={{
                    background: [
                      "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(147,51,234,0.2), rgba(79,70,229,0.2))",
                      "linear-gradient(135deg, rgba(147,51,234,0.2), rgba(79,70,229,0.2), rgba(59,130,246,0.2))",
                      "linear-gradient(135deg, rgba(79,70,229,0.2), rgba(59,130,246,0.2), rgba(147,51,234,0.2))"
                    ],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Floating Elements */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(15)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-2 h-2 ${
                        ['bg-blue-400', 'bg-purple-400', 'bg-indigo-400', 'bg-cyan-400'][i % 4]
                      } rounded-full opacity-60`}
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        y: [0, -20, 0],
                        x: [0, Math.random() * 20 - 10, 0],
                        opacity: [0.6, 1, 0.6],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center space-y-8 p-8 min-h-[400px]">
                  {/* Enhanced Animated Search Icon */}
                  <motion.div
                    animate={{
                      scale: [1, 1.15, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="relative"
                  >
                    {/* Outer Glow Ring */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-2xl opacity-75"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    
                    {/* Main Icon Container */}
                    <motion.div 
                      className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 p-6 rounded-full shadow-2xl"
                      animate={{
                        boxShadow: [
                          "0 20px 40px rgba(59,130,246,0.3)",
                          "0 25px 50px rgba(147,51,234,0.4)",
                          "0 20px 40px rgba(59,130,246,0.3)"
                        ]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Search className="w-14 h-14 text-white" />
                      
                      {/* Pulsing Ring */}
                      <motion.div
                        className="absolute inset-0 border-4 border-white/30 rounded-full"
                        animate={{
                          scale: [1, 1.4],
                          opacity: [0.8, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeOut"
                        }}
                      />
                    </motion.div>

                    {/* Orbiting Elements */}
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className={`absolute w-3 h-3 ${
                          ['bg-yellow-400', 'bg-green-400', 'bg-pink-400'][i]
                        } rounded-full shadow-lg`}
                        style={{
                          left: '50%',
                          top: '50%',
                        }}
                        animate={{
                          rotate: [0, 360],
                          x: [0, 60 * Math.cos((i * 120) * Math.PI / 180)],
                          y: [0, 60 * Math.sin((i * 120) * Math.PI / 180)],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "linear",
                          delay: i * 0.5,
                        }}
                      />
                    ))}
                  </motion.div>

                  {/* Enhanced Loading Text */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-6 w-full max-w-md"
                  >
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-transparent bg-clip-text">
                        Finding Your Perfect Coach Match
                      </h3>
                    </motion.div>                    {/* Enhanced Cycling loading phrases */}
                    <div className="relative h-8 flex items-center justify-center w-full">
                      <div className="px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm shadow-lg">
                        <motion.p 
                          key={currentPhraseIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className="text-lg font-medium"
                          style={{ color: '#000' }}
                        >
                          {loadingPhrases[currentPhraseIndex].phrase}
                        </motion.p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Enhanced Progress Dots */}
                  <div className="flex space-x-3">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="relative"
                      >
                        <motion.div
                          className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeInOut"
                          }}
                        />
                        <motion.div
                          className="absolute inset-0 w-3 h-3 bg-white rounded-full"
                          animate={{
                            scale: [0, 1.8, 0],
                            opacity: [0, 0.6, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeOut"
                          }}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <CoachReveal selectedCoach={selectedCoach} />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }  
  
  return (    <Card className="w-full bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 border-purple-200 shadow-xl mt-10">
      <CardHeader className="border-b border-purple-200 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 backdrop-blur-sm">
        <CardTitle className="flex items-center text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          <User className="w-6 h-6 mr-3 text-blue-500" />
          Choose Your Personal Coach
          <Sparkles className="w-5 h-5 ml-2 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-indigo-50/50">
        {/* Show CoachReveal animation for premium/elite users when coach is assigned */}
        {assignmentStatus === 'assigned' && selectedCoach && !isBasicPlan ? (
          <CoachReveal selectedCoach={selectedCoach} />
        ) : (
          <>
            {/* Scrollable Container with Custom Scrollbar */}
            <div className="max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gradient bg-gradient-to-br from-cyan-100/30 via-blue-100/30 to-purple-100/30 rounded-2xl p-4 backdrop-blur-sm border border-white/20 shadow-inner">
              {/* Responsive Grid - 2 cols on mobile, 2 on tablet, 3 on large tablet+, 4 on desktop, 5 on large desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
                {coaches && coaches.length > 0 ? (
                  coaches.map((coach, index) => {
                    const gradientClass = gradientCombinations[index % gradientCombinations.length];
                    
                    return (
                      <motion.div
                        key={coach.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        whileHover={{ 
                          scale: 1.03,
                          y: -5,
                        }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                        onClick={() => {
                          setTempSelectedCoach(coach);
                          setShowConfirmationModal(true);
                        }}
                      >
                        {/* Vibrant Gradient Background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-90`} />
                        
                        {/* Content Overlay */}
                        <div className="relative z-10 p-6 text-white">
                          {/* Info Button - Always Visible */}
                          <button
                            className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCoachForProfile(coach);
                            }}
                          >
                            <Info className="w-4 h-4 text-white" />
                          </button>

                          {/* Coach Card Content */}
                          <div className="flex flex-col items-center space-y-4">
                            {/* Profile Image */}
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: "spring", bounce: 0.4, delay: index * 0.1 + 0.2 }}
                              className="relative"
                            >
                              <img
                                src={formatImageUrl(coach.profileImage)}
                                alt="Coach profile"
                                className="w-20 h-20 lg:w-24 lg:h-24 rounded-full object-cover border-4 border-white/50 shadow-lg group-hover:border-white transition-all duration-300"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = getFallbackAvatarUrl(); 
                                }}
                              />
                              
                              {/* Animated Ring on Hover */}
                              <motion.div
                                className="absolute inset-0 border-2 border-white/60 rounded-full"
                                initial={{ scale: 1, opacity: 0 }}
                                whileHover={{ scale: 1.1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                              />
                            </motion.div>

                            {/* Coach Info */}
                            <div className="text-center w-full space-y-2">
                              {/* Name */}
                              <h4 className="text-lg lg:text-xl font-bold text-white drop-shadow-sm">
                                {coach.firstName} {coach.lastName}
                              </h4>
                              
                              {/* Specialties */}
                              <div className="min-h-[2.5rem] flex items-center justify-center">
                                {coach.specialties && coach.specialties.length > 0 ? (
                                  <div className="flex flex-wrap justify-center gap-1">
                                    {coach.specialties.slice(0, 2).map((specialty, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 text-xs font-medium rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30"
                                      >
                                        {specialty}
                                      </span>
                                    ))}
                                    {coach.specialties.length > 2 && (
                                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-white/30 backdrop-blur-sm text-white border border-white/40">
                                        +{coach.specialties.length - 2}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-white/80">
                                    Fitness Coach
                                  </p>
                                )}
                              </div>
                              
                              {/* Rating */}
                              {coach.rating && (
                                <div className="flex items-center justify-center space-x-1 mt-2">
                                  <Star className="w-4 h-4 text-yellow-300 fill-yellow-300 drop-shadow-sm" />
                                  <span className="text-sm font-semibold text-white drop-shadow-sm">
                                    {coach.rating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Subtle Bottom Decoration */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20"></div>
                        </div>

                        {/* Animated Particles on Hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          {[...Array(8)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-1 h-1 bg-white/60 rounded-full"
                              style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                              }}
                              animate={{
                                scale: [0, 1, 0],
                                opacity: [0, 1, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.2,
                              }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center"
                    >
                      <User className="w-8 h-8 text-gray-500" />
                    </motion.div>
                    <p className="text-lg font-medium text-gray-500">
                      No coaches available at the moment.
                    </p>
                    <p className="text-sm text-gray-400">
                      Please try again later or contact support.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Coach Profile Modal */}
      <AnimatePresence>
        {selectedCoachForProfile && (
          <CoachProfileModal 
            coach={selectedCoachForProfile} 
            onClose={() => setSelectedCoachForProfile(null)} 
          />
        )}
      </AnimatePresence>

      {/* Enhanced Confirmation Modal */}
      <AnimatePresence>
        {showConfirmationModal && tempSelectedCoach && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-2xl"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  {[...Array(10)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [1, 1.5, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    />
                  ))}
                </div>
                <h2 className="text-2xl font-bold text-white relative z-10 flex items-center">
                  <Heart className="w-6 h-6 mr-2 text-pink-300" />
                  Confirm Your Coach
                </h2>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative">
                    <img
                      src={formatImageUrl(tempSelectedCoach.profileImage)}
                      alt={`Coach ${tempSelectedCoach.firstName} ${tempSelectedCoach.lastName}`}
                      className="w-20 h-20 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                      onError={(e) => {
                        console.error('Image load error for temp selected coach:', tempSelectedCoach.profileImage);
                        e.target.onerror = null;
                        e.target.src = getFallbackAvatarUrl(); 
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {tempSelectedCoach.firstName} {tempSelectedCoach.lastName}
                    </h3>
                    <p className="text-gray-600">
                      {tempSelectedCoach.specialties?.join(', ') || 'Fitness Coach'}
                    </p>
                    {tempSelectedCoach.rating && (
                      <div className="flex items-center mt-1 space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm text-gray-700">
                          {tempSelectedCoach.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Are you sure you want to choose <span className="font-semibold text-blue-600">{tempSelectedCoach.firstName}</span> as your personal coach? 
                  This selection will help tailor your fitness journey to achieve your goals.
                </p>
                
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmationModal(false)}
                    className="transition-all duration-200 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmSelection}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Confirm Selection
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
export default CoachAssignment;