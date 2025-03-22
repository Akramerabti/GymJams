import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, UserPlus, RefreshCw, Heart,X,Wifi } from 'lucide-react';

const EmptyStateMessage = ({ 
  type = 'noProfiles',
  onRefresh,
  message,
  description,
  icon: CustomIcon,
  actionLabel
}) => {
  // Predefined messages for common states
  const messages = {
    noProfiles: {
      title: 'No more profiles',
      description: 'We couldn\'t find any more gym partners matching your criteria',
      icon: <UserPlus size={48} className="text-gray-400" />,
      actionLabel: 'Refresh'
    },
    noMatches: {
      title: 'No matches yet',
      description: 'Start swiping to find your perfect gym partner',
      icon: <Heart size={48} className="text-gray-300" />,
      actionLabel: null
    },
    error: {
      title: 'Something went wrong',
      description: 'We\'re having trouble finding gym partners right now',
      icon: <X size={48} className="text-red-500" />,
      actionLabel: 'Try Again'
    },
    loading: {
      title: 'Finding gym partners',
      description: 'This may take a moment',
      icon: <Dumbbell size={48} className="text-blue-500 animate-bounce" />,
      actionLabel: null
    },
    networkError: {
      title: 'Connection issue',
      description: 'Check your internet connection and try again',
      icon: <Wifi size={48} className="text-orange-500" />,
      actionLabel: 'Retry'
    }
  };

  // Get the appropriate message content
  const content = message ? 
    { title: message, description, icon: CustomIcon, actionLabel } : 
    messages[type];

  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-100 rounded-full p-6 mb-6"
      >
        {content.icon}
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-xl font-bold mb-2"
      >
        {content.title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-gray-500 mb-6"
      >
        {content.description}
      </motion.p>

      {content.actionLabel && onRefresh && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          onClick={onRefresh}
          className="px-6 py-3 bg-blue-600 text-white rounded-full flex items-center shadow-lg hover:bg-blue-700 transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw size={18} className="mr-2" />
          {content.actionLabel}
        </motion.button>
      )}
    </div>
  );
};

export default EmptyStateMessage;