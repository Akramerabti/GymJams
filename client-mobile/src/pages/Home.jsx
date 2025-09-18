/*
 * HOME.JSX - SIMPLIFIED SUCCESS FLOW
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
  Check,
  CheckCircle2
} from 'lucide-react';

import SocialMapSection from '../components/home-sections/SocialMapSection';
import { useSocket } from '../SocketContext';

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { balance } = usePoints();
  const { setPageState } = useSocket();
  
  // Simplified states
  const [currentScreen, setCurrentScreen] = useState('checking'); // 'checking', 'success', 'loading', 'dashboard'
  const [socialMapLoaded, setSocialMapLoaded] = useState(false);

  useEffect(() => {
    setPageState('home');
    return () => setPageState('other');
  }, [setPageState]);

  // Simple success check on mount
useEffect(() => {
  const checkForSuccess = () => {
    // Check for any success indicator
    const urlParams = new URLSearchParams(window.location.search);
    const hasSuccessIndicator = 
      urlParams.get('loginSuccess') || 
      urlParams.get('fromOAuth') ||
      localStorage.getItem('showLoginSuccess') ||
      localStorage.getItem('emailLoginSuccess') ||
      sessionStorage.getItem('oauthLoginSuccess');

    if (hasSuccessIndicator) {
      console.log('🏠 HOME: Success indicator found, showing success screen');
      
      // Clean up all indicators
      localStorage.removeItem('showLoginSuccess');
      localStorage.removeItem('emailLoginSuccess');
      sessionStorage.removeItem('oauthLoginSuccess');
      
      // Clean URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState(null, null, cleanUrl);
      
      // Show success screen
      setCurrentScreen('success');
      
      // FIXED: Direct transition to dashboard after success (no loading screen)
      setTimeout(() => {
        console.log('🏠 HOME: Success screen complete, showing dashboard');
        setCurrentScreen('dashboard');
      }, 3000); // Show success for 3 seconds, then directly to dashboard
      
    } else {
      console.log('🏠 HOME: No success indicator, normal flow');
      // Normal flow - show loading then dashboard
      setCurrentScreen('loading');
      setTimeout(() => {
        setCurrentScreen('dashboard');
      }, 1500); // Reduced loading time for normal flow
    }
  };

  // Check on mount
  checkForSuccess();

  // Listen for login success event (avoids page reload)
  const handleLoginSuccess = () => {
    console.log('🏠 HOME: Login success event received');
    checkForSuccess();
  };

  window.addEventListener('loginSuccess', handleLoginSuccess);
  
  return () => {
    window.removeEventListener('loginSuccess', handleLoginSuccess);
  };
}, []);

  const handleSocialMapLoad = () => {
    setSocialMapLoaded(true);
  };

  const handleNavigate = (route) => {
    navigate(route);
  };

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
    }, 
    { 
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

  // Success Screen
  if (currentScreen === 'success') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center shadow-2xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>

          <motion.h1
            className="text-4xl font-black text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Welcome to GymTonic!
          </motion.h1>

          <motion.p
            className="text-xl text-green-200 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            Login successful!
          </motion.p>

          <motion.p
            className="text-lg text-emerald-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            Get ready to transform your fitness journey
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Professional Loading Screen (no icon)
  if (currentScreen === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex space-x-2 justify-center mb-4">
            <motion.div
              className="w-3 h-3 bg-gray-500 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-3 h-3 bg-gray-500 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-3 h-3 bg-gray-500 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
            />
          </div>
          <p className="text-gray-400 text-lg">Loading Dashboard</p>
        </div>
      </div>
    );
  }

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

        /* Circular Menu Styles */
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

          .menu-btn:nth-child(2) { top: -120px; }
          .menu-btn:nth-child(3) { top: -75px; left: 95px; }
          .menu-btn:nth-child(4) { top: 30px; left: 120px; }
          .menu-btn:nth-child(5) { top: 30px; left: -120px; }
          .menu-btn:nth-child(6) { top: -75px; left: -95px; }
        }
      `}</style>

      {/* Main Dashboard */}
      <motion.div
        className="min-h-dvh w-full bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
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

            {/* Social Map Section */}
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