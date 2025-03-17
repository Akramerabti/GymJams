import React from 'react';
import { motion } from 'framer-motion';
import { Users, MessageSquare, ArrowRight, Star, Clock, Bell, Check, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Progress from '@/components/ui/progress';

const ClientList = ({ clients, onClientClick, onChatClick }) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      transition: { duration: 0.2 }
    }
  };

  // Status badge style helper
  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
      paused: "bg-red-100 text-red-800"
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${styles[status] || styles.active}`}>
        {status === 'active' && <Check className="inline-block w-3 h-3 mr-1" />}
        {status === 'pending' && <Clock className="inline-block w-3 h-3 mr-1" />}
        {status === 'paused' && <Bell className="inline-block w-3 h-3 mr-1" />}
        <span className="capitalize">{status}</span>
      </span>
    );
  };

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {clients.length > 0 ? (
        clients.map((client) => (
          <motion.div
            key={client.id}
            variants={itemVariants}
            whileHover="hover"
            className="cursor-pointer bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden transition-shadow"
            onClick={() => onClientClick(client)}
          >
            <div className="p-4">
              {/* Client Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                <div className="flex items-center mb-2 md:mb-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    {client.profileImage ? (
                      <img
                        src={client.profileImage}
                        alt={client.firstName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">
                      {client.firstName} {client.lastName || ''}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Last active: {client.lastActive}
                      </span>
                      {client.rating && (
                        <span className="flex items-center">
                          <Star className="w-3 h-3 mr-1 text-yellow-500" />
                          Rating: {client.rating}
                        </span>
                      )}
                      {getStatusBadge(client.status || 'active')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end w-full md:w-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChatClick(client);
                    }}
                    className="relative"
                  >
                    <MessageSquare className="w-5 h-5" />
                    {client.unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {client.unreadMessages}
                      </span>
                    )}
                  </Button>
                  <ArrowRight className="w-5 h-5 text-gray-400 ml-2 hidden md:block" />
                </div>
              </div>
              
              {/* Progress Section */}
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">Monthly Progress</span>
                  <span className="text-xs font-medium text-blue-600">{client.stats?.monthlyProgress || 0}%</span>
                </div>
                <Progress value={client.stats?.monthlyProgress || 0} className="h-1.5" />
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-gray-50 p-2 rounded text-center">
                  <p className="text-xs text-gray-500">Workouts</p>
                  <p className="font-medium text-gray-800">{client.stats?.workoutsCompleted || 0}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded text-center">
                  <p className="text-xs text-gray-500">Streak</p>
                  <p className="font-medium text-gray-800">{client.stats?.currentStreak || 0} days</p>
                </div>
                <div className="bg-gray-50 p-2 rounded text-center">
                  <p className="text-xs text-gray-500">Next Session</p>
                  <p className="font-medium text-gray-800">{client.nextSession || 'N/A'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No clients found</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Try adjusting your filters or search criteria
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ClientList;