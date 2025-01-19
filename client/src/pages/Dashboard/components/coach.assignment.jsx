import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Search, CheckCircle, Clock, RefreshCw,Mail, Star,Info, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import subscriptionService from '../../../services/subscription.service';

const CoachProfileModal = ({ coach, onClose }) => {
  // Function to render a detail row
  const DetailRow = ({ icon: Icon, label, value }) => {
    if (!value) return null;
    
    return (
      <div className="flex items-center space-x-3 mb-2">
        <Icon className="w-5 h-5 text-blue-600 flex-shrink-0" />
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
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
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
  };

  return (
    <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto"
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
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 text-gray-600 hover:bg-gray-100"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
          <div className="flex items-center space-x-4">
            {coach.profileImage ? (
              <img
                src={coach.profileImage}
                alt={`${coach.firstName} ${coach.lastName}`}
                className="w-24 h-24 rounded-full object-cover border-4 border-white"
              />
            ) : (
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">
                {coach.firstName} {coach.lastName}
              </h2>
              <p className="text-white/80">
                {coach.specialties?.join(' • ') || 'Fitness Coach'}
              </p>
            </div>
          </div>
        </div>

        {/* Coach Details */}
        <div className="p-6 space-y-4">
          {/* Bio */}
          {coach.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                About Me
              </h3>
              <p className="text-gray-600">{coach.bio}</p>
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
    { phrase: "Matching with expert coaches...", duration: 500 },
    { phrase: "Finding your perfect mentor...", duration: 2000 },
    { phrase: "Almost there...", duration: 3500 },
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
          // Simulate a delay for the basic plan
          setTimeout(async () => {
            const response = await subscriptionService.assignRandomCoach();
            setSelectedCoach(response.coach);
            setAssignmentStatus('assigned');
            await new Promise(resolve => setTimeout(resolve, 7000));
            onCoachAssigned(response.coach);
          }, 8000);
        } else {
          const response = await subscriptionService.getCoaches();
          setCoaches(response.coaches);
        }
      } catch (error) {
        setError('Failed to assign coach. Please try again.');
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
      const response = await subscriptionService.assignCoach(coach.id);

      setSelectedCoach(coach);
      setAssignmentStatus('assigned');
      onCoachAssigned(coach);
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

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
          />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <h3 className="text-2xl font-bold text-red-600">Oops! Something went wrong.</h3>
          <p className="text-gray-600">{error}</p>
          <div className="flex space-x-4">
            <Button onClick={handleRetry} className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={handleContactSupport} className="flex items-center">
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
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Coach Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6">
            {assignmentStatus === 'pending' ? (
              <motion.div className="relative">
                {/* Animated Background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg"
                  animate={{
                    background: [
                      "linear-gradient(to right, rgba(59,130,246,0.1), rgba(147,51,234,0.1))",
                      "linear-gradient(to right, rgba(147,51,234,0.1), rgba(59,130,246,0.1))",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                />

                <div className="relative z-10 flex flex-col items-center justify-center space-y-8 p-8">
                  {/* Animated Search Icon */}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
                    <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-full">
                      <Search className="w-12 h-12 text-white" />
                    </div>
                  </motion.div>

                  {/* Loading Text */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-4 w-full"
                  >
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                      Finding Your Perfect Coach Match
                    </h3>

                    {/* Cycling loading phrases */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-6 flex items-center justify-center w-full"
                    >
                      <motion.p
                        key={currentPhraseIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="text-white absolute w-full text-center"
                      >
                        {loadingPhrases[currentPhraseIndex].phrase}
                      </motion.p>
                    </motion.div>
                  </motion.div>

                  {/* Progress Dots */}
                  <div className="flex space-x-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-blue-500 rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
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

  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          <User className="w-6 h-6 mr-3" />
          Choose Your Personal Coach
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coaches.map((coach) => (
            <motion.div
              key={coach.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
              }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group relative cursor-pointer"
              onClick={() => {
                setTempSelectedCoach(coach);
                setShowConfirmationModal(true);
              }}
            >
              <div className="flex flex-col items-center">
                {coach.profileImage ? (
                  <motion.img
                    src={coach.profileImage}
                    alt={coach.firstName}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.6 }}
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 group-hover:border-blue-300 transition-all"
                  />
                ) : (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center"
                  >
                    <User className="w-12 h-12 text-white" />
                  </motion.div>
                )}

                <div className="text-center mt-1 w-full">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCoachForProfile(coach);
                  }}
                >
                  <Info className="w-5 h-5" />
                </Button>
              </div>
                
                <div className="text-center mt-1 w-full">
                  <h4 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition">
                    {coach.firstName} {coach.lastName}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {coach.specialties?.join(' • ')}
                  </p>
                  
                  <div className="flex items-center justify-center mt-2 space-x-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-semibold text-gray-700">
                      {coach.rating?.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
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

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-2xl"
            >
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                <h2 className="text-2xl font-bold text-white">Confirm Your Coach</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  {tempSelectedCoach?.profileImage ? (
                    <img
                      src={tempSelectedCoach.profileImage}
                      alt={tempSelectedCoach.firstName}
                      className="w-20 h-20 rounded-full object-cover border-4 border-blue-100"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {tempSelectedCoach?.firstName} {tempSelectedCoach?.lastName}
                    </h3>
                    <p className="text-gray-600">
                      {tempSelectedCoach?.specialties?.join(', ')}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to choose {tempSelectedCoach?.firstName} as your personal coach? 
                  This selection will help tailor your fitness journey.
                </p>
                <div className="flex text-red-600 justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmationModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmSelection}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
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