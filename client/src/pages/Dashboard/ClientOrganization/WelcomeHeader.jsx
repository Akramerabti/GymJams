import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowRight, User, Award, Crown, Zap } from 'lucide-react';

// Subscription tier configuration
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

const WelcomeHeader = ({ user, subscription, assignedCoach, onChatOpen, onUpgradeClick }) => {
  // Get user first name
  const getUserFirstName = () => {
    return user?.user?.firstName || user?.firstName || '';
  };
  
  // Get current subscription tier
  const currentTier = SUBSCRIPTION_TIERS[subscription?.subscription || 'basic'];
  
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
    </motion.div>
  );
};

export default WelcomeHeader;