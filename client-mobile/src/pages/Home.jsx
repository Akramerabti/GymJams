/*
 * HOME.JSX - UTILITY DASHBOARD
 * 
 * PURPOSE: Clean utility dashboard for navigation and feature preview
 * LAYOUT:
 * - 5 circular buttons arranged in a circle with points in center
 * - Social map preview section (now using SocialMapSection component)
 * - Games preview section
 * - All designed for redirects, not embedded content
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { usePoints } from '../hooks/usePoints';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Users, 
  Gamepad2, 
  GraduationCap, 
  Dumbbell,
  Coins,
  MessageCircle,
  Play,
  ArrowRight,
  ChevronRight,
  Gift,
  Star,
  Shield,
  Clock,
  Check
} from 'lucide-react';

import SocialMapSection from '../components/home-sections/SocialMapSection';
import { useSocket } from '../SocketContext';

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { balance } = usePoints();
  const { setPageState } = useSocket();
  const [socialMapLoaded, setSocialMapLoaded] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Set page state to skip location updates on home page
  useEffect(() => {
    setPageState('home');
    setIsLoaded(true);
    
    // Clean up page state when component unmounts
    return () => {
      setPageState('other');
    };
  }, [setPageState]);

  // Remove the problematic auth check useEffect that was causing early returns
  // Let the App-level MobileGatekeeper handle authentication flow instead

  // 5 main feature buttons arranged in circle
  const circleButtons = [
     { 
      name: 'GymBros', 
      icon: Users, 
      route: '/gymbros', 
      gradient: 'from-orange-400 to-red-500',
      description: 'Social'
    }, 
    { 
      name: 'Shop', 
      icon: ShoppingBag, 
      route: '/shop', 
      gradient: 'from-emerald-400 to-teal-500',
      description: 'Supplements'
    },
  
    { 
      name: 'Games', 
      icon: Gamepad2, 
      route: '/games', 
      gradient: 'from-yellow-400 to-orange-500',
      description: 'Play & Win'
    },
    { 
  name: 'Contact', 
  icon: MessageCircle, 
  route: '/contact', 
  gradient: 'from-blue-400 to-cyan-500',
  description: 'Support'
}, { 
      name: 'Coaching', 
      icon: GraduationCap, 
      route: '/coaching', 
      gradient: 'from-purple-400 to-indigo-500',
      description: 'Training'
    }
  ];

  // Games preview cards
  const gameCards = [
    { id: 'coinflip', name: 'Coin Flip', icon: Coins, players: '234 online', status: 'Hot' },
    { id: 'slots', name: 'Slot Machine', icon: Star, players: '156 online', status: 'Popular' },
    { id: 'dice', name: 'Dice Roll', icon: Gift, players: '89 online', status: 'New' },
    { id: 'roulette', name: 'Roulette', icon: Shield, players: '167 online', status: 'Classic' }
  ];

  // Check for login success parameter
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const loginSuccess = urlParams.get('loginSuccess');
  const fromOAuth = urlParams.get('fromOAuth');
  const showSuccess = localStorage.getItem('showLoginSuccess');

  if (loginSuccess === 'true' || fromOAuth === 'true' || showSuccess === 'true') {
    localStorage.removeItem('showLoginSuccess');
    // Clean the URL
    window.history.replaceState(null, null, window.location.pathname);
    
    // Force show success screen immediately
    setShowSuccessScreen(true);
    setIsLoaded(false); // Prevent other content from showing
    setSocialMapLoaded(false); // Prevent social map from loading
    
    // Hide success screen after 3 seconds
    setTimeout(() => {
      setShowSuccessScreen(false);
      setIsLoaded(true);
      setSocialMapLoaded(true);
    }, 3000);
  } else {
    // Normal loading flow
    setTimeout(() => {
      setIsLoaded(true);
    }, 1500);
  }
}, []); // Empty dependency array - only run once on mount

  const handleSocialMapLoad = () => {
  setSocialMapLoaded(true);
};

  const handleNavigate = (route) => {
    navigate(route);
  };

  const showLoadingScreen = (!isLoaded || !socialMapLoaded) && !showSuccessScreen;

  return (
    <>
      <style jsx>{`
        .glass-morphism {
          backdrop-filter: blur(20px);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .glass-card {
          backdrop-filter: blur(15px);
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        
        ::-webkit-scrollbar {
          display: none;
        }
        
        html {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .aurora-bg {
          background: 
            radial-gradient(ellipse at top left, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at top right, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at bottom left, rgba(236, 72, 153, 0.15) 0%, transparent 50%);
        }

        .floating-orb {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .animated-orbs {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.floating-orb-1 {
  animation: float1 8s ease-in-out infinite;
}

.floating-orb-2 {
  animation: float2 12s ease-in-out infinite;
}

.floating-orb-3 {
  animation: float3 10s ease-in-out infinite;
}

.floating-orb-4 {
  animation: float4 15s ease-in-out infinite;
}

.floating-orb-5 {
  animation: float5 9s ease-in-out infinite;
}

.floating-orb-6 {
  animation: float6 11s ease-in-out infinite;
}

.floating-orb-7 {
  animation: float7 14s ease-in-out infinite;
}

.floating-orb-8 {
  animation: float8 7s ease-in-out infinite;
}

.floating-orb-9 {
  animation: float9 13s ease-in-out infinite;
}

.floating-orb-10 {
  animation: float10 16s ease-in-out infinite;
}

@keyframes float7 {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  50% { transform: translate(-70px, 80px) scale(1.3); }
}

@keyframes float8 {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  25% { transform: translate(80px, -60px) scale(0.7); }
  75% { transform: translate(-40px, 70px) scale(1.1); }
}

@keyframes float9 {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  40% { transform: translate(60px, 90px) scale(0.9); }
  80% { transform: translate(-80px, -70px) scale(1.2); }
}

@keyframes float10 {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  30% { transform: translate(-90px, 50px) scale(1.1); }
  70% { transform: translate(70px, -80px) scale(0.8); }
}

@keyframes float1 {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  25% { transform: translate(30px, -40px) scale(1.1); }
  50% { transform: translate(-20px, -60px) scale(0.9); }
  75% { transform: translate(-40px, -30px) scale(1.05); }
}

@keyframes float2 {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(-50px, 40px) scale(0.8); }
  66% { transform: translate(60px, -20px) scale(1.2); }
}

@keyframes float3 {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  30% { transform: translate(40px, 50px) scale(1.1); }
  70% { transform: translate(-30px, -40px) scale(0.9); }
}

@keyframes float4 {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  25% { transform: translate(-60px, -30px) scale(0.7); }
  50% { transform: translate(50px, 60px) scale(1.3); }
  75% { transform: translate(20px, -50px) scale(1.1); }
}

@keyframes float5 {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  40% { transform: translate(-40px, 30px) scale(1.2); }
  80% { transform: translate(35px, -45px) scale(0.8); }
}

@keyframes float6 {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  20% { transform: translate(55px, -25px) scale(1.1); }
  60% { transform: translate(-45px, 40px) scale(0.9); }
  90% { transform: translate(25px, 30px) scale(1.15); }
}

        /* New Circular Menu Styles */
        .circular-menu {
          margin: 0 auto;
          position: relative;
          width: 70px;
          height: 70px;
          margin-top: 80px;
          margin-bottom: 80px;
        }

        .menu-btn {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          position: absolute;
          overflow: hidden;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          transition: all 0.3s cubic-bezier(.25,.8,.25,1);
        }

        .menu-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
        }

        /* Center button (points) */
        .menu-btn:first-child {
          z-index: 10;
          background: rgba(255, 255, 255, 0.2);
        }

        /* Feature buttons positioning */
        .menu-btn:nth-child(2) {
          top: -150px;
          opacity: 1;
          animation: slideIn1 0.6s ease-out forwards;
          animation-delay: 0.1s;
        }

        .menu-btn:nth-child(3) {
          top: -92px;
          left: 120px;
          opacity: 1;
          animation: slideIn2 0.6s ease-out forwards;
          animation-delay: 0.2s;
        }

        .menu-btn:nth-child(4) {
          top: 40px;
          left: 150px;
          opacity: 1;
          animation: slideIn3 0.6s ease-out forwards;
          animation-delay: 0.3s;
        }

        .menu-btn:nth-child(5) {
          top: 40px;
          left: -150px;
          opacity: 1;
          animation: slideIn4 0.6s ease-out forwards;
          animation-delay: 0.4s;
        }

        .menu-btn:nth-child(6) {
          top: -92px;
          left: -120px;
          opacity: 1;
          animation: slideIn5 0.6s ease-out forwards;
          animation-delay: 0.5s;
        }

        @keyframes slideIn1 {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes slideIn2 {
          from { transform: translate(-50px, 50px); opacity: 0; }
          to { transform: translate(0, 0); opacity: 1; }
        }

        @keyframes slideIn3 {
          from { transform: translateX(-50px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideIn4 {
          from { transform: translateX(50px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideIn5 {
          from { transform: translate(50px, 50px); opacity: 0; }
          to { transform: translate(0, 0); opacity: 1; }
        }

        .menu-icon {
          width: 28px;
          height: 28px;
          color: white;
          margin-bottom: 4px;
        }

        .menu-label {
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
        }

        /* Main content styles */
        .main-content {
          margin-top: 40px;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-top: 20px;
            padding: 1rem;
          }
          
          .circular-menu {
            transform: scale(0.8);
            margin-top: 60px;
            margin-bottom: 60px;
          }

          .menu-btn:nth-child(2) { top: 105px; }
          .menu-btn:nth-child(3) { top: -75px; left: 65px; }
          .menu-btn:nth-child(4) { top: 30px; left: 90px; }
          .menu-btn:nth-child(5) { top: 30px; left: -90px; }
          .menu-btn:nth-child(6) { top: -75px; left: -65px; }
        }
      `}</style>

      {/* Loading Screen */}
      <AnimatePresence>
        {showLoadingScreen && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <motion.div
                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-pink-600 rounded-full flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Dumbbell className="w-8 h-8 text-white" />
              </motion.div>
              <p className="text-white text-lg">Loading Dashboard...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Screen */}
<AnimatePresence>
  {showSuccessScreen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center"
    >
      {/* Aurora Background */}
      <div className="absolute inset-0 aurora-bg opacity-60" />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center z-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center"
        >
          <Check className="w-12 h-12 text-white" />
        </motion.div>
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-3xl font-bold text-white mb-2"
        >
          Welcome Back!
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-lg text-white/80"
        >
          Successfully logged in with Google
        </motion.p>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

      {/* Main Dashboard */}
      <motion.div
        className="min-h-screen w-full bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Aurora Background */}
        <div className="absolute inset-0 aurora-bg opacity-60" />
        
        {/* Animated Background Orbs */}
<div className="animated-orbs">
  <motion.div 
    className="floating-orb-1 absolute top-20 left-16 w-20 h-20 bg-gradient-to-r from-purple-500/25 to-indigo-500/25 rounded-full blur-md"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.5, duration: 2 }}
  />
  <motion.div 
    className="floating-orb-2 absolute top-60 right-20 w-24 h-24 bg-gradient-to-r from-blue-500/30 to-cyan-500/25 rounded-full blur-md"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 1, duration: 2 }}
  />
  <motion.div 
    className="floating-orb-3 absolute bottom-32 left-1/4 w-18 h-18 bg-gradient-to-r from-emerald-500/25 to-teal-500/25 rounded-full blur-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 1.5, duration: 2 }}
  />
  <motion.div 
    className="floating-orb-4 absolute top-1/3 right-1/3 w-16 h-16 bg-gradient-to-r from-orange-500/25 to-pink-500/25 rounded-full blur-md"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 2, duration: 2 }}
  />
  <motion.div 
    className="floating-orb-5 absolute bottom-20 right-32 w-28 h-28 bg-gradient-to-r from-indigo-500/20 to-purple-500/30 rounded-full blur-md"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.8, duration: 2 }}
  />
  <motion.div 
    className="floating-orb-6 absolute top-40 left-1/3 w-14 h-14 bg-gradient-to-r from-pink-500/30 to-red-500/25 rounded-full blur-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 1.2, duration: 2 }}
  />
  <motion.div 
    className="floating-orb-7 absolute top-80 left-20 w-22 h-22 bg-gradient-to-r from-cyan-500/25 to-blue-500/25 rounded-full blur-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.3, duration: 2 }}
  />
  <motion.div 
    className="floating-orb-8 absolute bottom-60 right-1/4 w-16 h-16 bg-gradient-to-r from-yellow-500/20 to-orange-500/25 rounded-full blur-md"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 2.2, duration: 2 }}
  />
  <motion.div 
    className="floating-orb-9 absolute top-1/4 left-1/2 w-20 h-20 bg-gradient-to-r from-violet-500/25 to-purple-500/25 rounded-full blur-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 1.8, duration: 2 }}
  />
  <motion.div 
    className="floating-orb-10 absolute bottom-40 left-40 w-18 h-18 bg-gradient-to-r from-rose-500/25 to-pink-500/25 rounded-full blur-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 2.5, duration: 2 }}
  />
</div>

        {/* Content */}
        <div className="relative z-10 main-content pb-8">
          <div className="max-w-6xl mx-auto mt-40">

            {/* Circular Menu Navigation */}
            <div className="circular-menu">
              {/* Center Points Button */}
              <motion.div
                className="menu-btn"
                onClick={() => handleNavigate('/profile')}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              >
                <Coins className="w-6 h-6 text-yellow-400" />
                <span className="text-white font-bold text-lg">
                {balance !== null && balance !== undefined ? balance : ''}
              </span>
              </motion.div>

              {/* Feature Buttons */}
              {circleButtons.map((button, index) => (
                <div
                  key={button.name}
                  className="menu-btn"
                  onClick={() => handleNavigate(button.route)}
                >
                  <button.icon className="menu-icon" />
                  <span className="menu-label">{button.name}</span>
                </div>
              ))}
            </div>

            {/* Social Map Section - Now using the new component */}
             <SocialMapSection 
              onNavigate={handleNavigate} 
              onLoad={handleSocialMapLoad}
              isVisible={socialMapLoaded}
            />

            {/* Games Section */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.6 }}
            >
              <div className="glass-card rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-white flex items-center">
                    <Gamepad2 className="w-8 h-8 mr-3 text-purple-400" />
                    Featured Games
                  </h2>
                  <motion.button
                    className="flex items-center text-orange-300 hover:text-orange-200 font-semibold"
                    whileHover={{ x: 5 }}
                    onClick={() => handleNavigate('/games')}
                  >
                    Enter Game Room <ArrowRight className="w-5 h-5 ml-2" />
                  </motion.button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {gameCards.map((game, index) => (
                    <motion.button
                      key={game.id}
                      onClick={() => handleNavigate('/games')}
                      className="glass-morphism p-6 rounded-2xl text-center hover:bg-white/15 transition-all duration-300"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 1.6 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                    >
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500/30 to-blue-500/30 inline-block mb-4">
                        <game.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2">{game.name}</h3>
                      <p className="text-indigo-300 text-sm mb-3">{game.players}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        game.status === 'Hot' ? 'bg-red-500/20 text-red-400' :
                        game.status === 'New' ? 'bg-green-500/20 text-green-400' :
                        game.status === 'Popular' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {game.status}
                      </span>
                      <Play className="w-4 h-4 text-green-400 mt-2 mx-auto" />
                    </motion.button>
                  ))}
                </div>
                
                <motion.button
                  className="w-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-2 border-purple-500/30 text-purple-300 py-4 rounded-2xl hover:from-purple-500/30 hover:to-blue-500/30 transition-all duration-300 font-bold text-lg"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleNavigate('/games')}
                >
                  <Gamepad2 className="w-6 h-6 inline mr-3" />
                  Play All Games
                </motion.button>
              </div>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Home;