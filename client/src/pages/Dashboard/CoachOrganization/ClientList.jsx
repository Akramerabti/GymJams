import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, MessageSquare, Clock, Calendar, 
  Info, Award, Crown, Zap, ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SubscriptionInfoDialog from './SupscriptionInfoDialog';

const ClientList = ({ clients, onClientClick, onChatClick }) => {
  // Only one subscription dialog can be open at a time
  const [activeDialog, setActiveDialog] = useState(null);
  
  // Subscription icons and styling
  const subscriptionConfig = {
    basic: {
      icon: <Award className="w-4 h-4 text-blue-500" />,
      label: 'Basic',
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    premium: {
      icon: <Crown className="w-4 h-4 text-purple-500" />,
      label: 'Premium',
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    elite: {
      icon: <Zap className="w-4 h-4 text-amber-500" />,
      label: 'Elite',
      color: 'bg-amber-100 text-amber-800 border-amber-200'
    }
  };

  return (
    <div className="space-y-4">
      {/* Map through the array of clients */}
      {clients.map((client, index) => {
        const subscriptionType = client.subscription || 'basic';
        const subConfig = subscriptionConfig[subscriptionType] || subscriptionConfig.basic;
        
        return (
          <motion.div
            key={client.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow p-4"
          >
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              {/* Client Info */}
              <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                <div className="relative">
                  {client.profileImage ? (
                    <img
                      src={client.profileImage}
                      alt={`${client.firstName} profile`}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-avatar.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                    client.status === 'active' 
                      ? 'bg-green-500' 
                      : client.status === 'paused' 
                        ? 'bg-amber-500' 
                        : 'bg-gray-400'
                  }`} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {client.firstName} {client.lastName}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Last active: {client.lastActive}</span>

                    {/* Subscription Badge with Info Icon */}
                    <div className="flex items-center">
                      <Badge className={`flex items-center gap-1 ${subConfig.color}`}>
                        {subConfig.icon}
                        <span>{subConfig.label}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDialog(client.id);
                          }}
                          className="ml-1 rounded-full hover:bg-white/20 p-0.5 flex items-center justify-center"
                          aria-label={`About ${subConfig.label} subscription`}
                        >
                          <Info className="w-3 h-3" />
                        </button>
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3 sm:mb-0">
                <div className="flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-700/50 rounded-md p-2">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Workouts</div>
                  <div className="font-semibold text-sm">{client.stats?.workoutsCompleted || 0}</div>
                </div>
                <div className="flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-700/50 rounded-md p-2">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="w-4 h-4 text-green-500 dark:text-green-400" />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Streak</div>
                  <div className="font-semibold text-sm">{client.stats?.currentStreak || 0} days</div>
                </div>
                <div className="flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-700/50 rounded-md p-2">
                  <div className="flex items-center justify-center mb-1">
                    <svg className="w-4 h-4 text-purple-500 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20V10" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18 20V4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6 20V16" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Progress</div>
                  <div className="font-semibold text-sm">{client.stats?.monthlyProgress || 0}%</div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChatClick(client)}
                  className="bg-white dark:bg-gray-700"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Chat
                  {client.unreadMessages > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {client.unreadMessages}
                    </span>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => onClientClick(client)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-1">Details</span>
                </Button>
              </div>
            </div>
            
            {/* Subscription Info Dialog for this client */}
            {activeDialog === client.id && (
              <SubscriptionInfoDialog 
                isOpen={true}
                onClose={() => setActiveDialog(null)}
                subscriptionType={subscriptionType}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default ClientList;