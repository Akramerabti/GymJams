import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Dumbbell, Trophy, ShoppingBag, Users, Gamepad2, ArrowRight, Star, Target, MessageCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const ConversionHeroSection = ({ onNavigate, isActive, goToSection, scrollY }) => {
  const { darkMode } = useTheme();
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [animationsComplete, setAnimationsComplete] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Initialize content visibility and animations
    const initTimer = setTimeout(() => setShowContent(true), 100);
    const animTimer = setTimeout(() => setAnimationsComplete(true), 600);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(animTimer);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const requestLocationPermission = async () => {
    if ('geolocation' in navigator) {
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          });
        });
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  };

  const handleOptionClick = async (option, route, requiresLocation = false) => {
    setSelectedOption(option);
    
    if (requiresLocation) {
      await requestLocationPermission();
    }
    
    setTimeout(() => {
      onNavigate(route);
    }, 300);
  };

  const navigateToSection = (sectionIndex) => {
    if (goToSection) {
      goToSection(sectionIndex);
    }
  };

  const backgroundGradient = 'linear-gradient(135deg, #ff8c00 0%, #dc2626 50%, #8b5cf6 100%)';
  const platformFeatures = [
    {
      icon: ShoppingBag,
      title: 'Shop Premium Gear',
      description: 'High-quality supplements, equipment, and fitness apparel',
      color: 'from-blue-500 to-purple-600',
      route: '/shop',
      delay: 0.2
    },
    {
      icon: Trophy,
      title: 'Expert Coaching',
      description: 'Personalized training programs from certified professionals',
      color: 'from-purple-500 to-pink-600',
      route: '/coaching',
      delay: 0.4,
      requiresLocation: true
    },
    {
      icon: Users,
      title: 'Find Gym Partners',
      description: 'Connect with like-minded fitness enthusiasts nearby',
      color: 'from-green-500 to-blue-600',
      route: '/gymbros',
      delay: 0.6,
      requiresLocation: true
    },
    {
      icon: Gamepad2,
      title: 'Fitness Games',
      description: 'Gamify your workout routine with interactive challenges',
      color: 'from-orange-500 to-red-600',
      route: '/games',
      delay: 0.8
    }
  ];

  return (
    <div className="absolute inset-0" style={{ marginTop: 'var(--navbar-height, 0px)' }}>
      <div className={`w-full h-full transition-all duration-700 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        {/* Background with dot pattern */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 0 0, #000000 ${isMobile ? '2px' : '3px'}, transparent ${isMobile ? '2px' : '3px'}),
              radial-gradient(circle at ${isMobile ? '15px 15px' : '20px 20px'}, #000000 ${isMobile ? '1.5px' : '2px'}, transparent ${isMobile ? '1.5px' : '2px'}),
              radial-gradient(circle at ${isMobile ? '8px 25px' : '10px 35px'}, #000000 ${isMobile ? '1px' : '1.5px'}, transparent ${isMobile ? '1px' : '1.5px'}),
              ${backgroundGradient}
            `,
            backgroundSize: `${isMobile ? '30px 30px' : '40px 40px'}, ${isMobile ? '30px 30px' : '40px 40px'}, ${isMobile ? '30px 30px' : '40px 40px'}, 100% 100%`,
            backgroundPosition: '0 0, 0 0, 0 0, 0 0',
          }}
        />

        {/* Content container */}
        <div className="relative z-10 h-full flex flex-col" style={{ minHeight: '100dvh' }}>
          
          {/* Header Section */}
          <header className="text-center py-8 px-4">
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={animationsComplete ? { opacity: 1, y: 0 } : { opacity: 0, y: -50 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="text-white mb-4" style={{
                fontFamily: 'Rubik, Arial, sans-serif',
                fontSize: isMobile ? '3rem' : '5rem',
                fontWeight: '800',
                fontStyle: 'italic',
                letterSpacing: '-0.05em',
                textShadow: `
                  -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000,
                  -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000,
                  ${isMobile ? '8px 8px 0 #000, 12px 12px 0 #000' : '12px 12px 0 #000, 16px 16px 0 #000, 20px 20px 0 #000'}
                `,
                margin: '0',
                lineHeight: '0.9'
              }}>
                GYMTONIC
              </h1>
              
            </motion.div>
          </header>

          {/* Platform Features Grid */}
          <div className="flex-1 px-4 pb-8">
            <div className="max-w-6xl mx-auto">
              <div className={`grid gap-6 h-full ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'}`}>
                {platformFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="group cursor-pointer h-full"
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={animationsComplete ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
                    transition={{ duration: 0.8, delay: feature.delay, ease: "easeOut" }}
                    onClick={() => handleOptionClick(feature.title, feature.route, feature.requiresLocation)}
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`
                      h-full p-6 rounded-2xl border-4 border-black shadow-2xl
                      bg-white hover:bg-gray-50 transition-all duration-300
                      transform hover:shadow-3xl relative overflow-hidden
                      ${isMobile ? 'min-h-[200px]' : 'min-h-[300px]'}
                    `}>
                      
                      {/* Animated background gradient */}
                      <div className={`
                        absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500
                        bg-gradient-to-br ${feature.color}
                      `} />
                      
                      {/* Content */}
                      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center">
                        
                        {/* Icon */}
                        <div className={`
                          w-16 h-16 md:w-20 md:h-20 rounded-full mb-4
                          bg-gradient-to-br ${feature.color}
                          flex items-center justify-center
                          shadow-lg group-hover:shadow-xl transition-all duration-300
                          group-hover:scale-110
                        `}>
                          <feature.icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                        </div>

                        {/* Title */}
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                          {feature.title}
                        </h3>

                        {/* Description */}
                        <p className="text-gray-600 leading-relaxed group-hover:text-gray-500 transition-colors">
                          {feature.description}
                        </p>

                        {/* Hover arrow */}
                        <div className="mt-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          <ArrowRight className="w-6 h-6 text-gray-700 animate-bounce" />
                        </div>
                      </div>

                      {/* Decorative corner */}
                      <div className={`
                        absolute top-0 right-0 w-20 h-20 
                        bg-gradient-to-bl ${feature.color} opacity-5
                        transform rotate-45 translate-x-10 -translate-y-10
                        group-hover:opacity-15 transition-opacity duration-300
                      `} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Why Choose Gymtonic Section */}
          <motion.div 
            className="bg-black/20 backdrop-blur-sm py-8 px-4 mt-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={animationsComplete ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                Why Choose Gymtonic?
              </h2>
              
              <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-3'}`}>
                <div className="text-white/90">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500 flex items-center justify-center">
                    <Star className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-2">All-in-One Platform</h3>
                  <p className="text-sm">Everything you need for your fitness journey in one place</p>
                </div>
                
                <div className="text-white/90">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500 flex items-center justify-center">
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-2">Personalized Experience</h3>
                  <p className="text-sm">Tailored recommendations based on your goals and preferences</p>
                </div>
                
                <div className="text-white/90">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-500 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-2">Community Driven</h3>
                  <p className="text-sm">Connect with thousands of fitness enthusiasts worldwide</p>
                </div>
              </div>

              {/* CTA Button */}
              <motion.div 
                className="mt-8"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={() => navigateToSection(1)}
                  className="bg-white text-gray-900 px-8 py-4 rounded-full font-bold text-lg
                           shadow-2xl hover:shadow-3xl transition-all duration-300
                           border-4 border-black hover:bg-gray-100"
                >
                  Start Your Fitness Journey
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Loading overlay */}
      {selectedOption && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl border-4 border-black">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-900 font-semibold">Redirecting to {selectedOption}...</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ConversionHeroSection;