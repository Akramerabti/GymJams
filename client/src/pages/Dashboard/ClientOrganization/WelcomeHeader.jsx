import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowRight, User, Award, Crown, Zap, FileEdit, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TextArea } from '@/components/ui/textArea';
import { toast } from 'sonner';

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
  
  // Get user first name
  const getUserFirstName = () => {
    return user?.user?.firstName || user?.firstName || '';
  };
  
  // Get current subscription tier
  const currentTier = SUBSCRIPTION_TIERS[subscription?.subscription || 'basic'];
  
  // Check if user can request plan update
  const canRequestPlanUpdate = currentTier.canRequestPlanUpdate;
  
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
          
          {/* Make a Request Button - Only for Premium and Elite */}
          {assignedCoach && canRequestPlanUpdate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full sm:w-auto"
            >
              <Button
                onClick={handleRequestPlanUpdate}
                className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white"
                disabled={currentTier.planUpdateFrequency === 'weekly' && hasUsedWeeklyRequest()}
              >
                <FileEdit className="w-5 h-5 mr-2" />
                Request Plan Update
                {currentTier.planUpdateFrequency === 'weekly' && hasUsedWeeklyRequest() && (
                  <span className="ml-1 text-xs">(Weekly limit reached)</span>
                )}
              </Button>
            </motion.div>
          )}
          
          {/* Session Request Button - Tier-based UI indication */}
          {assignedCoach && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full sm:w-auto"
            >
              <Button
                onClick={onSessionRequest}
                className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white"
              >
                <Calendar className="w-5 h-5 mr-2" />
                {subscription?.subscription === 'basic' ? 'View Sessions' : 'Request Session'}
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
      
      {/* Plan Update Request Modal */}
      <Dialog open={showPlanRequestModal} onOpenChange={setShowPlanRequestModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Plan Update</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Let your coach know what changes you'd like to see in your current plan:
            </p>
            <TextArea
              placeholder="Describe the updates you'd like to your workout or nutrition plan..."
              rows={6}
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="mb-2"
            />
            {currentTier.planUpdateFrequency === 'weekly' && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Note: With Premium tier, you can request one plan update per week.
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowPlanRequestModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default WelcomeHeader;