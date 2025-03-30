// client/src/components/gymBros/components/ActiveBoostNotification.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, X } from 'lucide-react';
import gymbrosService from '../../../services/gymbros.service';

const ActiveBoostNotification = () => {
  const [activeBoost, setActiveBoost] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');
  
  // Fetch active boosts on mount
  useEffect(() => {
    const fetchBoosts = async () => {
      try {
        const boosts = await gymbrosService.getActiveBoosts();
        
        if (boosts && boosts.length > 0) {
          // Get the boost with the highest factor
          const highestBoost = boosts.reduce((prev, current) => 
            (prev.boostFactor > current.boostFactor) ? prev : current
          );
          
          setActiveBoost(highestBoost);
        } else {
          setActiveBoost(null);
        }
      } catch (error) {
        console.error('Error fetching active boosts:', error);
      }
    };
    
    fetchBoosts();
    
    // Poll for active boosts every minute
    const interval = setInterval(fetchBoosts, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Update time remaining every second
  useEffect(() => {
    if (!activeBoost) return;
    
    const updateTimeRemaining = () => {
      const now = new Date();
      const expiry = new Date(activeBoost.expiresAt);
      const diffMs = expiry - now;
      
      // If expired, hide notification
      if (diffMs <= 0) {
        setActiveBoost(null);
        setIsVisible(false);
        return;
      }
      
      // Format time remaining
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      
      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };
    
    // Update immediately
    updateTimeRemaining();
    
    // Then update every second
    const interval = setInterval(updateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [activeBoost]);
  
  // Don't render if no active boost or notification dismissed
  if (!activeBoost || !isVisible) return null;
  
  // Get boost color based on type
  const getBoostColor = () => {
    switch (activeBoost.boostType) {
      case 'boost-basic': 
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'boost-premium': 
        return 'bg-gradient-to-r from-blue-500 to-indigo-600';
      case 'boost-ultra': 
        return 'bg-gradient-to-r from-amber-500 to-orange-600';
      default: 
        return 'bg-gradient-to-r from-blue-500 to-indigo-600';
    }
  };
  
  // Get boost name based on type
  const getBoostName = () => {
    switch (activeBoost.boostType) {
      case 'boost-basic': return 'Basic Boost';
      case 'boost-premium': return 'Premium Boost';
      case 'boost-ultra': return 'Ultra Boost';
      default: return 'Boost';
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-xs w-full shadow-lg rounded-lg ${getBoostColor()} text-white`}
      >
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 15, 0, -15, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "loop"
              }}
              className="bg-white rounded-full p-1.5 mr-3"
            >
              <Zap className="h-5 w-5 text-purple-600" />
            </motion.div>
            
            <div>
              <div className="font-bold">{getBoostName()}</div>
              <div className="text-xs flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {timeRemaining} remaining • {activeBoost.boostFactor}x visibility
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/20 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ActiveBoostNotification;