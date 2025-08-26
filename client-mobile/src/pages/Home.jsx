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
  BarChart3,
  Activity,
  Dumbbell,
  Coins,
  Play,
  ArrowRight,
  ChevronRight,
  Gift,
  Star,
  Shield,
  Clock,
  ExternalLink
} from 'lucide-react';

import SocialMapSection from '../components/home-sections/SocialMapSection';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance } = usePoints();
  
  const [isLoaded, setIsLoaded] = useState(false);

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
      name: 'Analytics', 
      icon: BarChart3, 
      route: '/dashboard', 
      gradient: 'from-blue-400 to-cyan-500',
      description: 'Progress'
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

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigate = (route) => {
    navigate(route);
  };

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

          .menu-btn:nth-child(2) { top: -110px; }
          .menu-btn:nth-child(3) { top: -35px; left: 96px; }
          .menu-btn:nth-child(4) { top: 75px; left: 75px; }
          .menu-btn:nth-child(5) { top: 75px; left: -75px; }
          .menu-btn:nth-child(6) { top: -35px; left: -96px; }
        }
      `}</style>

      {/* Loading Screen */}
      <AnimatePresence>
        {!isLoaded && (
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

      {/* Main Dashboard */}
      <motion.div
        className="min-h-screen w-full bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Aurora Background */}
        <div className="absolute inset-0 aurora-bg opacity-60" />
        
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="floating-orb absolute top-20 left-10 w-24 h-24 bg-purple-500/10 rounded-full blur-xl" />
          <div className="floating-orb absolute top-40 right-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl" style={{animationDelay: '-2s'}} />
          <div className="floating-orb absolute bottom-20 left-1/4 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl" style={{animationDelay: '-4s'}} />
        </div>

        {/* Content */}
        <div className="relative z-10 main-content pb-8">
          <div className="max-w-6xl mx-auto mt-50">

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
                <span className="text-white font-bold text-lg">{balance || 1250}</span>
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
            <SocialMapSection onNavigate={handleNavigate} />

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