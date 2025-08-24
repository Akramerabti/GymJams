/*
 * HOME.JSX - UTILITY DASHBOARD
 * 
 * PURPOSE: Clean utility dashboard for navigation and feature preview
 * LAYOUT:
 * - 5 circular buttons arranged in a circle with points in center
 * - Social map preview section
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
  MapPin,
  Activity,
  Dumbbell,
  Coins,
  Play,
  ArrowRight,
  Map,
  ChevronRight,
  Gift,
  Star,
  Shield,
  Clock,
  ExternalLink
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance } = usePoints();
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [menuActive] = useState(true); // always open

  // 5 main feature buttons arranged in circle
  const circleButtons = [
    { 
      name: 'Shop', 
      icon: ShoppingBag, 
      route: '/shop', 
      gradient: 'from-emerald-400 to-teal-500',
      description: 'Supplements'
    },
    { 
      name: 'Coaching', 
      icon: GraduationCap, 
      route: '/coaching', 
      gradient: 'from-purple-400 to-indigo-500',
      description: 'Training'
    },
    { 
      name: 'GymBros', 
      icon: Users, 
      route: '/gymbros', 
      gradient: 'from-orange-400 to-red-500',
      description: 'Social'
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
    }
  ];

  // Games preview cards
  const gameCards = [
    { id: 'coinflip', name: 'Coin Flip', icon: Coins, players: '234 online', status: 'Hot' },
    { id: 'slots', name: 'Slot Machine', icon: Star, players: '156 online', status: 'Popular' },
    { id: 'dice', name: 'Dice Roll', icon: Gift, players: '89 online', status: 'New' },
    { id: 'roulette', name: 'Roulette', icon: Shield, players: '167 online', status: 'Classic' }
  ];

  // Social map data
  const nearbyUsers = [
    { name: 'Alex M.', distance: '0.3 mi', status: 'working out', avatar: '🏃' },
    { name: 'Sarah K.', distance: '0.8 mi', status: 'online', avatar: '💪' },
    { name: 'Mike R.', distance: '1.2 mi', status: 'finished workout', avatar: '🔥' }
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

        /* Radial Menu Styles */
        .radial-menu {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translateX(-50%) translateY(-50%);
          width: 5em;
          height: 5em;
          z-index: 20;
        }

        .btn {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          opacity: 0;
          z-index: -10;
          cursor: pointer;
          transition: opacity 1s, z-index 0.3s, transform 1s;
          transform: translateX(0);
          border: none;
          outline: none;
        }

        .btn.trigger {
          opacity: 1;
          z-index: 100;
          cursor: pointer;
          transition: transform 0.3s;
        }

        .btn.trigger:hover {
          transform: scale(1.2);
        }

        .btn.trigger:hover .line {
          background-color: rgba(255, 255, 255, 0.7);
        }

        .btn.trigger:hover .line:before,
        .btn.trigger:hover .line:after {
          background-color: rgba(255, 255, 255, 0.7);
        }

        .line {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translateX(-50%) translateY(-50%);
          width: 60%;
          height: 6px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 6px;
          transition: background-color 0.3s, height 0.3s, top 0.3s;
        }

        .line:before,
        .line:after {
          content: "";
          display: block;
          position: absolute;
          left: 0;
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 6px;
          transition: background-color 0.3s, transform 0.3s;
        }

        .line:before {
          top: -12px;
          transform-origin: 15% 100%;
        }

        .line:after {
          top: 12px;
          transform-origin: 25% 30%;
        }

        .rotater {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transform-origin: 50% 50%;
        }

        .btn-icon {
          opacity: 0;
          z-index: -10;
        }

        .icon-container {
  text-align: center;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

       .icon-bg {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  margin: 0 auto 0.5rem;
  position: relative;
}

        .icon {
          width: 2rem;
          height: 2rem;
          color: white;
        }

        .icon-label {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          pointer-events: none;
        }

        .icon-title {
          color: white;
          font-weight: bold;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .icon-desc {
          color: rgba(165, 180, 252, 1);
          font-size: 0.75rem;
        }

        /* Active state */
        .radial-menu.active .btn-icon {
          opacity: 1;
          z-index: 50;
        }

        .radial-menu.active .trigger .line {
          height: 0px;
          top: 45%;
        }

        .radial-menu.active .trigger .line:before {
          transform: rotate(45deg);
          width: 110%;
        }

        .radial-menu.active .trigger .line:after {
          transform: rotate(-45deg);
          width: 110%;
        }

        /* Individual rotater positioning for 5 elements */
        .rotater:nth-child(1) {
          transform: rotate(-36deg);
        }
        .rotater:nth-child(2) {
          transform: rotate(36deg);
        }
        .rotater:nth-child(3) {
          transform: rotate(108deg);
        }
        .rotater:nth-child(4) {
          transform: rotate(180deg);
        }
        .rotater:nth-child(5) {
          transform: rotate(252deg);
        }

        .radial-menu.active .rotater:nth-child(1) .btn-icon {
  transform: translateY(-8em);
}
.radial-menu.active .rotater:nth-child(2) .btn-icon {
  transform: translateY(-8em);
}
.radial-menu.active .rotater:nth-child(3) .btn-icon {
  transform: translateY(-8em);
}
.radial-menu.active .rotater:nth-child(4) .btn-icon {
  transform: translateY(-8em);
}
.radial-menu.active .rotater:nth-child(5) .btn-icon {
  transform: translateY(-8em);
}

/* Counter-rotate the icon containers to keep content upright */
.radial-menu.active .rotater:nth-child(1) .icon-container {
  transform: rotate(36deg);
  transform-origin: center center;
}
.radial-menu.active .rotater:nth-child(2) .icon-container {
  transform: rotate(-36deg);
  transform-origin: center center;
}
.radial-menu.active .rotater:nth-child(3) .icon-container {
  transform: rotate(-108deg);
  transform-origin: center center;
}
.radial-menu.active .rotater:nth-child(4) .icon-container {
  transform: rotate(-180deg);
  transform-origin: center center;
}
.radial-menu.active .rotater:nth-child(5) .icon-container {
  transform: rotate(-252deg);
  transform-origin: center center;
}


        /* Main content styles */
        .main-content {
          margin-top: 80px;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-top: 70px;
            padding: 1rem;
          }
          
          .circle-container {
            transform: scale(0.8);
          }

          .radial-menu.active .rotater .btn-icon {
            transform: translateY(-8em) !important;
          }

          .icon-bg {
            width: 3rem;
            height: 3rem;
          }

          .icon {
            width: 1.5rem;
            height: 1.5rem;
          }

          .icon-title {
            font-size: 0.75rem;
          }

          .icon-desc {
            font-size: 0.625rem;
          }
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
        <div className="relative z-10 main-content pb-8 ">
          <div className="max-w-6xl mx-auto mt-30">

            {/* Radial Navigation */}
            <motion.div
              className="relative flex items-center justify-center mb-30 circle-container mt-20"
              style={{ height: '80px', width: '80px', margin: '0 auto' }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, duration: 2, type: "spring" }}
            >

              {/* Center Points Display as menu trigger (no lines) */}
              <motion.div
                className="absolute z-10 glass-morphism rounded-full w-14 h-14 flex flex-col items-center justify-center btn trigger"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                onClick={() => handleNavigate('/profile')}
                style={{ cursor: 'pointer' }}
              >
                <Coins className="w-6 h-6 text-yellow-400 mb-1" />
                <span className="text-white font-bold text-lg">{balance || 1250}</span>
                <span className="text-indigo-300 text-xs">points</span>
              </motion.div>

              {/* Radial Menu Structure */}
              <div className={`radial-menu ${menuActive ? 'active' : ''}`}>
                {/* Trigger is now the center points display above, so remove this */}
                <div className="icons">
                  {circleButtons.map((button, index) => (
                    <div key={button.name} className="rotater">
                      <motion.div
                        className="btn btn-icon"
                        onClick={() => handleNavigate(button.route)}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1 + index * 0.1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="icon-container">
                          <div className={`icon-bg`}>
                            <button.icon className="icon" />
                          </div>
                          <div className="icon-label">
                            <h3 className="icon-title">{button.name}</h3>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Social Map Section */}
            <motion.div
              className="mb-12 mt-40 "
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <div className="glass-card rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-white flex items-center">
                    <MapPin className="w-8 h-8 mr-3 text-red-400" />
                    Social Map
                  </h2>
                  <motion.button
                    className="flex items-center text-orange-300 hover:text-orange-200 font-semibold"
                    whileHover={{ x: 5 }}
                    onClick={() => handleNavigate('/gymbros')}
                  >
                    Open Full Map <ArrowRight className="w-5 h-5 ml-2" />
                  </motion.button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {nearbyUsers.map((user, index) => (
                    <motion.div
                      key={user.name}
                      className="glass-morphism p-4 rounded-2xl text-center"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 1.2 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="text-4xl mb-3 block">{user.avatar}</span>
                      <h3 className="text-white font-bold">{user.name}</h3>
                      <p className="text-orange-300 text-sm">{user.distance}</p>
                      <p className="text-indigo-300 text-xs">{user.status}</p>
                    </motion.div>
                  ))}
                </div>
                
                <motion.button
                  className="w-full bg-gradient-to-r from-red-500/20 to-pink-500/20 border-2 border-red-500/30 text-red-300 py-4 rounded-2xl hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 font-bold text-lg"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleNavigate('/gymbros')}
                >
                  <Map className="w-6 h-6 inline mr-3" />
                  Explore GymBros Map
                </motion.button>
              </div>
            </motion.div>

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