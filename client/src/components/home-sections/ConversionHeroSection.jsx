import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Trophy, Users, Gamepad2, ArrowRight, Star, Target, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ConversionHeroSection = ({ onNavigate, isActive, goToSection, scrollY, backgroundColor, textColor }) => {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [animationsComplete, setAnimationsComplete] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setViewportHeight(window.innerHeight);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Single timer - no separate showContent state to avoid timing conflicts
    const animTimer = setTimeout(() => setAnimationsComplete(true), 50); // Much faster

    return () => {
      clearTimeout(animTimer);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleOptionClick = async (option, route, requiresLocation = false) => {
    setSelectedOption(option);
    
    if (requiresLocation && 'geolocation' in navigator) {
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          });
        });
      } catch (error) {
        console.log('Location permission denied');
      }
    }
    
    setTimeout(() => {
      onNavigate(route);
    }, 300);
  };

  const backgroundGradient = backgroundColor === '#000000' 
    ? 'linear-gradient(135deg, rgba(255,140,0,0.8) 0%, rgba(220,38,38,0.8) 50%, rgba(139,92,246,0.8) 100%)'
    : 'linear-gradient(135deg, rgba(255,140,0,0.2) 0%, rgba(220,38,38,0.2) 50%, rgba(139,92,246,0.2) 100%)';

  const platformFeatures = [
    {
      icon: ShoppingBag,
      title: 'Shop',
      description: 'Premium gear & supplements',
      color: 'from-blue-500 to-purple-600',
      route: '/shop',
      delay: 0.1
    },
    {
      icon: Trophy,
      title: 'Coaching',
      description: 'Expert training programs',
      color: 'from-purple-500 to-pink-600',
      route: '/coaching',
      delay: 0.2,
      requiresLocation: true
    },
    {
      icon: Users,
      title: 'GymBros',
      description: 'Find workout partners',
      color: 'from-green-500 to-blue-600',
      route: '/gymbros',
      delay: 0.3,
      requiresLocation: true
    },
    {
      icon: Gamepad2,
      title: 'Games',
      description: 'Gamify your fitness',
      color: 'from-orange-500 to-red-600',
      route: '/games',
      delay: 0.4
    }
  ];

  // Calculate responsive sizes based on viewport
  const cardHeight = isMobile ? Math.min(120, viewportHeight * 0.15) : 200;
  const headerSize = isMobile ? Math.min(48, viewportHeight * 0.08) : 80;
  const iconSize = isMobile ? 'w-12 h-12' : 'w-16 h-16';

  return (
    <div className="absolute inset-0 flex flex-col" style={{ backgroundColor, color: textColor }}>
      {/* Show immediately, no opacity transition on wrapper */}
      <div className="w-full h-full flex flex-col">
        
        {/* Background gradient overlay */}
        <div 
          className="absolute inset-0"
          style={{ background: backgroundGradient }}
        />

        {/* Content wrapper - fills height with proper padding */}
        <div className="relative z-10 h-full flex flex-col p-4 md:p-8">
          
          {/* Header - Responsive sizing */}
          <header className={`text-center ${isMobile ? 'mb-4' : 'mb-8'}`}>
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={animationsComplete ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <h1 
                style={{
                  fontFamily: 'Rubik, Arial, sans-serif',
                  fontSize: `${headerSize}px`,
                  fontWeight: '800',
                  fontStyle: 'italic',
                  letterSpacing: '-0.05em',
                  textShadow: backgroundColor === '#000000' 
                    ? '4px 4px 0 rgba(255,255,255,0.2)' 
                    : '4px 4px 0 rgba(0,0,0,0.2)',
                  margin: '0',
                  lineHeight: '0.9',
                  color: textColor
                }}
              >
                GYMTONIC
              </h1>
            </motion.div>
          </header>

          {/* Features Grid - Flex-1 to fill available space */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <div className="w-full max-w-6xl">
              <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-6'} w-full`}>
                {platformFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="cursor-pointer"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={animationsComplete ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: feature.delay }}
                    onClick={() => handleOptionClick(feature.title, feature.route, feature.requiresLocation)}
                    whileHover={!isMobile ? { scale: 1.05 } : {}}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div 
                      className={`
                        p-4 rounded-xl border-2 shadow-lg
                        transition-all duration-300 relative overflow-hidden
                        flex flex-col items-center justify-center text-center
                        ${backgroundColor === '#000000' 
                          ? 'bg-white/90 hover:bg-white border-white/20' 
                          : 'bg-black/90 hover:bg-black border-black/20'
                        }
                      `}
                      style={{ 
                        height: `${cardHeight}px`,
                        color: backgroundColor === '#000000' ? '#000000' : '#ffffff'
                      }}
                    >
                      {/* Icon */}
                      <div className={`
                        ${iconSize} rounded-full mb-2
                        bg-gradient-to-br ${feature.color}
                        flex items-center justify-center
                        shadow-md
                      `}>
                        <feature.icon className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
                      </div>

                      {/* Title */}
                      <h3 className={`font-bold ${isMobile ? 'text-sm' : 'text-lg'} mb-1`}>
                        {feature.title}
                      </h3>

                      {/* Description - Hidden on very small screens */}
                      {(!isMobile || viewportHeight > 600) && (
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-80`}>
                          {feature.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom CTA - Only show on larger screens or when there's space */}
          {(!isMobile || viewportHeight > 700) && (
            <motion.div 
              className={`text-center ${isMobile ? 'mt-4' : 'mt-8'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={animationsComplete ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {/* Button removed for better visibility */}
            </motion.div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {selectedOption && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className={`
            rounded-xl p-6 text-center shadow-2xl border-2
            ${backgroundColor === '#000000' ? 'bg-white border-white/20' : 'bg-black border-black/20'}
          `}>
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className={`font-semibold ${backgroundColor === '#000000' ? 'text-black' : 'text-white'}`}>
              Loading {selectedOption}...
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ConversionHeroSection;