import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Dumbbell } from 'lucide-react';
import confetti from 'canvas-confetti';

const MatchModal = ({ 
  isVisible,
  onClose,
  onSendMessage,
  onKeepSwiping,
  currentUser,
  matchedUser
}) => {
  const confettiCanvasRef = useRef(null);
  const [confettiInstance, setConfettiInstance] = useState(null);
  
  const handleSendMessage = () => {
    // Dispatch custom event
    const matchEvent = new CustomEvent('navigateToMatches', {
      detail: { matchedProfile }
    });
    window.dispatchEvent(matchEvent);
    
    // Close modal and call the callback
    onSendMessage();
  };
  
  // Set up confetti on mount
  useEffect(() => {
    if (isVisible && confettiCanvasRef.current) {
      try {
        // Create confetti instance
        const myConfetti = confetti.create(confettiCanvasRef.current, {
          resize: true,
          useWorker: false // IMPORTANT: Set useWorker to false to avoid serialization issues
        });
        
        setConfettiInstance(myConfetti);
        
        // Fire initial confetti
        fireConfetti(myConfetti);
        
        // Set up interval for periodic confetti bursts
        const interval = setInterval(() => {
          fireConfetti(myConfetti);
        }, 2500);
        
        // Clean up
        return () => {
          clearInterval(interval);
          if (myConfetti) {
            myConfetti.reset();
          }
        };
      } catch (error) {
        console.error("Error initializing confetti:", error);
        // Continue with modal even if confetti fails
      }
    }
  }, [isVisible]);
  
  // Fire confetti with simpler shapes that can be serialized
  const fireConfetti = (confettiInstance) => {
    if (!confettiInstance) return;
    
    try {
      // Main confetti burst with basic shapes only (no custom shapes)
      confettiInstance({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6, x: 0.5 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        shapes: ['circle', 'square'], // Use only built-in shapes
        gravity: 0.8,
        scalar: 1.2
      });
      
      // Smaller side bursts
      setTimeout(() => {
        confettiInstance({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.5, x: 0.3 },
          colors: ['#3b82f6', '#10b981'],
          gravity: 0.6,
          scalar: 0.8
        });
      }, 300);
      
      setTimeout(() => {
        confettiInstance({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.5, x: 0.7 },
          colors: ['#f59e0b', '#ef4444'],
          gravity: 0.6,
          scalar: 0.8
        });
      }, 600);
    } catch (error) {
      console.error("Error firing confetti:", error);
    }
  };
  
  // Format image URL
  const formatImageUrl = (url) => {
    if (!url) return "/api/placeholder/400/400";
    
    if (url.startsWith('blob:')) {
      return url;
    } else if (url.startsWith('http')) {
      return url;
    } else {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    }
  };
  
  // Get profile images
  const currentUserImage = currentUser?.profileImage || (currentUser?.images && currentUser.images[0]);
  const matchedUserImage = matchedUser?.profileImage || (matchedUser?.images && matchedUser.images[0]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Canvas for confetti */}
          <canvas 
            ref={confettiCanvasRef}
            className="absolute inset-0 pointer-events-none z-10"
            style={{ width: '100%', height: '100%' }}
          />
          
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: "spring", damping: 30, stiffness: 500 }}
            className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl overflow-hidden shadow-2xl max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white z-20 p-2 rounded-full bg-black/20"
            >
              <X size={24} />
            </button>
            
            {/* Match images with overlapping effect */}
            <div className="relative h-48 flex justify-center">
              {/* Animated dumbbells */}
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -5, 5, 0],
                    scale: [1, 1.1, 1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <Dumbbell size={48} className="text-white drop-shadow-lg" />
                </motion.div>
              </div>
              
              <motion.div
                initial={{ x: -80, rotate: -10 }}
                animate={{ x: -40, rotate: 0 }}
                className="absolute top-16 z-10 rounded-full border-4 border-white shadow-xl h-28 w-28 overflow-hidden"
              >
                <img 
                  src={formatImageUrl(currentUserImage)} 
                  alt="Your profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/api/placeholder/400/400";
                  }}
                />
              </motion.div>
              
              <motion.div
                initial={{ x: 80, rotate: 10 }}
                animate={{ x: 40, rotate: 0 }}
                className="absolute top-16 z-10 rounded-full border-4 border-white shadow-xl h-28 w-28 overflow-hidden"
              >
                <img 
                  src={formatImageUrl(matchedUserImage)} 
                  alt={matchedUser?.name || 'Match'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/api/placeholder/400/400";
                  }}
                />
              </motion.div>
            </div>
            
            {/* Match text */}
            <div className="text-center px-6 pb-8 pt-4">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-white mb-2"
              >
                It's a Gain!
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/80 mb-8"
              >
                You and {matchedUser?.name || 'your match'} have liked each other. Time to plan your first workout together!
              </motion.p>
              
              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={onSendMessage}
                  className="flex items-center justify-center bg-white text-purple-600 py-3 px-4 rounded-xl font-semibold shadow-lg hover:bg-purple-50 transition-colors"
                >
                  <MessageSquare size={20} className="mr-2" />
                  Start to make gains
                </motion.button>
                
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={onKeepSwiping}
                  className="bg-white/20 text-white py-3 px-4 rounded-xl font-semibold hover:bg-white/30 transition-colors"
                >
                  Keep Swiping
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MatchModal;