import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowRight, User, Award, Crown, Zap, FileEdit, Calendar, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import subscriptionService from '../../../services/subscription.service';
import ratingService from '../../../services/rating.service';

// Subscription tier configuration
const SUBSCRIPTION_TIERS = {
  basic: {
    name: 'Basic',
    color: 'from-blue-500 to-blue-600',
    icon: <Award className="w-8 h-8" />,
    upgrade: 'premium',
    features: ['Weekly workout plans', 'Basic progress tracking', 'Coach messaging'],
    canRequestPlanUpdate: false,
  },
  premium: {
    name: 'Premium',
    color: 'from-purple-500 to-purple-600',
    icon: <Crown className="w-8 h-8" />,
    upgrade: 'elite',
    features: ['Custom workout plans', 'Comprehensive progress tracking', 'Nutrition guidance', 'Priority coach support'],
    canRequestPlanUpdate: true,
    planUpdateFrequency: 'weekly',
  },
  elite: {
    name: 'Elite',
    color: 'from-amber-500 to-amber-600',
    icon: <Zap className="w-8 h-8" />,
    upgrade: null,
    features: ['Personalized workout plans', 'Advanced progress analytics', 'Custom nutrition plans', 'Daily coach support', 'Recovery tracking'],
    canRequestPlanUpdate: true,
    planUpdateFrequency: 'anytime',
  }
};

const WelcomeHeader = ({ 
  user, 
  subscription, 
  assignedCoach, 
  onChatOpen, 
  onUpgradeClick,
  onSessionRequest
}) => {
  const [showPlanRequestModal, setShowPlanRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasRatedCoach, setHasRatedCoach] = useState(false);
  const [checkingRating, setCheckingRating] = useState(true);
  
  // Get user first name
  const getUserFirstName = () => {
    return user?.user?.firstName || user?.firstName || '';
  };
  
  // Get current subscription tier
  const currentTier = SUBSCRIPTION_TIERS[subscription?.subscription || 'basic'];
  
  // Check if user can request plan update
  const canRequestPlanUpdate = currentTier.canRequestPlanUpdate;
    // Check if user has already rated this coach - run this on component mount
  useEffect(() => {
    const checkCoachRating = async () => {
      if (!assignedCoach || !assignedCoach._id || !subscription) {
        setCheckingRating(false);
        return;
      }
      
      try {
        setCheckingRating(true);
        
        // Use the proper rating API to check if user has rated this coach
        const result = await ratingService.checkUserRating(assignedCoach._id);
        setHasRatedCoach(result.hasRated);
      } catch (error) {
        console.error('Error checking if user has rated coach:', error);
        
        // Fallback: assume they haven't rated if the API call fails
        // This allows them to try rating, and the backend will prevent duplicates
        setHasRatedCoach(false);
      } finally {
        setCheckingRating(false);
      }
    };
    
    checkCoachRating();
  }, [assignedCoach, subscription]);
  
  // Check if user has used their weekly request (for premium)
  const hasUsedWeeklyRequest = () => {
    if (currentTier.planUpdateFrequency !== 'weekly') return false;
    
    // Get the last request time from localStorage
    const lastRequestTime = localStorage.getItem('lastPlanRequestTime');
    if (!lastRequestTime) return false;
    
    // Convert to Date
    const lastRequest = new Date(lastRequestTime);
    const now = new Date();
    
    // Check if the last request was less than 7 days ago
    const daysSinceLastRequest = Math.floor((now - lastRequest) / (1000 * 60 * 60 * 24));
    return daysSinceLastRequest < 7;
  };
  
  const handleRequestPlanUpdate = () => {
    // For premium users, check if they've already used their weekly request
    if (currentTier.planUpdateFrequency === 'weekly' && hasUsedWeeklyRequest()) {
      toast.error('You can only request one plan update per week with Premium tier');
      return;
    }
    
    setShowPlanRequestModal(true);
  };
  
  const handleSubmitRequest = async () => {
    if (!requestMessage.trim()) {
      toast.error('Please enter a message for your coach');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Here you would call an API to submit the request
      // For now we'll simulate a successful request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store the current time as the last request time (for premium users)
      if (currentTier.planUpdateFrequency === 'weekly') {
        localStorage.setItem('lastPlanRequestTime', new Date().toISOString());
      }
      
      toast.success('Plan update request sent to your coach!');
      setShowPlanRequestModal(false);
      setRequestMessage('');
    } catch (error) {
      toast.error('Failed to send request. Please try again.');
      console.error('Error sending plan update request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
    const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    if (hasRatedCoach) {
      toast.error('You have already rated this coach');
      setShowRatingModal(false);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the proper rating API to submit the rating
      if (assignedCoach && assignedCoach._id) {
        const result = await ratingService.rateCoach(assignedCoach._id, rating);
        
        toast.success('Thank you for rating your coach!');
        //('Coach rating submitted:', result);
        
        // Update local state to reflect that user has rated
        setShowRatingModal(false);
        setRating(0); // Reset rating after submission
        setHasRatedCoach(true);
      } else {
        throw new Error('Coach information is missing');
      }
    } catch (error) {
      console.error('Error submitting coach rating:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400 && error.response?.data?.error?.includes('already rated')) {
        toast.error('You have already rated this coach');
        setHasRatedCoach(true); // Update state to prevent further attempts
      } else if (error.response?.status === 401) {
        toast.error('You must be logged in to rate a coach');
      } else if (error.response?.status === 404) {
        toast.error('Coach not found');
      } else {
        toast.error('Failed to submit rating. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
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
                onClick={onChatOpen}
                className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Message Coach
              </Button>
            </motion.div>
          )}
          
          {/* Rate Coach Button - ONLY show if user has NOT already rated and we're not still checking */}
          {assignedCoach && !checkingRating && !hasRatedCoach && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full sm:w-auto"
            >
              <Button
                onClick={() => setShowRatingModal(true)}
                className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white"
                title="Rate your coach"
              >
                <Star className="w-5 h-5 mr-2" />
                Rate Coach
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
                onClick={onUpgradeClick}
                className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white"
              >
                Upgrade to {SUBSCRIPTION_TIERS[currentTier.upgrade].name}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Rating Modal */}
      <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
        <DialogContent className="sm:max-w-[425px] z-[100000]">
          <DialogHeader>
            <DialogTitle>Rate Your Coach</DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            {hasRatedCoach ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold">
                    {assignedCoach?.firstName} {assignedCoach?.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    You have already rated this coach
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-6">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-black">
                    {assignedCoach?.firstName} {assignedCoach?.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Your feedback helps improve coaching quality
                  </p>
                </div>
                
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="focus:outline-none p-1"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <Star
                        className={`w-8 h-8 ${
                          (hoverRating || rating) >= star
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        } transition-colors duration-100 transform ${
                          (hoverRating || rating) >= star ? 'scale-110' : 'scale-100'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRatingModal(false)}
              disabled={isSubmitting}
            >
              Close
            </Button>
            {!hasRatedCoach && (
              <Button 
                onClick={handleSubmitRating}
                disabled={isSubmitting || rating === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default WelcomeHeader;