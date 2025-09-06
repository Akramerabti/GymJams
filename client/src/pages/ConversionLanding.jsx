
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Dumbbell, Trophy, ShoppingBag, Zap } from 'lucide-react';

const ANIMATION_KEY = 'gymtonic-conversion-animated';

const ConversionLanding = () => {
  // Check if animations have already been shown in this session
  const hasAnimatedThisSession = sessionStorage.getItem(ANIMATION_KEY) === 'true';
  const navigate = useNavigate();
  
  const [animationsComplete, setAnimationsComplete] = useState(hasAnimatedThisSession);
  const [selectedOption, setSelectedOption] = useState(null);
  const [screenType, setScreenType] = useState('mobile');
  const [backgroundVariant, setBackgroundVariant] = useState('default');
  const mountedRef = useRef(false);
  const componentId = useRef(Math.random().toString(36).substr(2, 9));
  const animationTimerRef = useRef(null);

  useEffect(() => {
    console.log(`🎬 ConversionLanding[${componentId.current}]: Component MOUNTED`);
    console.log(`🎬 Has animated this session: ${hasAnimatedThisSession}`);
    mountedRef.current = true;
    
    return () => {
      console.log(`🔥 ConversionLanding[${componentId.current}]: Component UNMOUNTED`);
      mountedRef.current = false;
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const checkScreenType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenType('mobile');
      } else if (width >= 768 && width < 1024) {
        setScreenType('tablet');
      } else {
        setScreenType('desktop');
      }
    };

    checkScreenType();
    window.addEventListener('resize', checkScreenType);

    // Always apply styles
    let link = document.querySelector('link[href*="Rubik"]');
    if (!link) {
      link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Rubik:wght@400;600;700;800&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    const root = document.documentElement;
    if (!root.style.getPropertyValue('--color-black')) {
      root.style.setProperty('--color-black', '#000');
      root.style.setProperty('--color-white', '#fff');
      root.style.setProperty('--color-silver', '#c0c0c0');
      root.style.setProperty('--color-blue', '#1b62b9');
      root.style.setProperty('--color-dark-blue', '#144c90');
      root.style.setProperty('--color-purple', '#7c3aed');
      root.style.setProperty('--color-dark-purple', '#5b21b6');
      root.style.setProperty('--color-red', '#e63838');
      root.style.setProperty('--color-dark-red', '#a22929');
      root.style.setProperty('--color-yellow', '#ffea64');
      root.style.setProperty('--color-dark-yellow', '#fddd50');
      root.style.setProperty('--color-orange', '#ff6b35');
      root.style.setProperty('--color-pink', '#ff006e');
      root.style.setProperty('--font-family', 'Rubik, sans-serif');
      root.style.setProperty('--font-weight-extrabold', '800');
    }

    // 50% chance to use alternative background
    const useAlternativeBackground = Math.random() < 0.5;
    setBackgroundVariant(useAlternativeBackground ? 'alternative' : 'default');
    console.log(`🎨 ConversionLanding[${componentId.current}]: Background variant: ${useAlternativeBackground ? 'alternative (silver)' : 'default (colorful)'}`);

    // Check if we should animate
    if (hasAnimatedThisSession) {
      console.log(`🎬 ConversionLanding[${componentId.current}]: Already animated this session, skipping animation delay`);
      // Don't set timer, animations are already complete
    } else {
      console.log(`🎬 ConversionLanding[${componentId.current}]: First time this session, starting animation timer`);
      
      // Mark as animated immediately to prevent issues with quick refreshes
      sessionStorage.setItem(ANIMATION_KEY, 'true');
      
      // Start animation timer
      animationTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          console.log(`🎬 ConversionLanding[${componentId.current}]: Animation timer fired, starting animations`);
          setAnimationsComplete(true);
        }
      }, 800);
    }

    return () => {
      clearTimeout(animationTimerRef.current);
      window.removeEventListener('resize', checkScreenType);
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
    
    // Set flag to indicate navigation is happening from conversion page
    sessionStorage.setItem('conversion-back-nav', 'true');
    
    setTimeout(() => {
      navigate(route);
    }, 300);
  };

  const sectionStyle = {
    height: '100%',
    width: '100%',
    padding: 'clamp(1.5rem, 5vw, 3rem)', // Increased padding significantly
    border: '0.25rem solid var(--color-black)',
    backgroundColor: 'var(--color-white)',
    boxShadow: '0.5rem 0.5rem rgba(132, 81, 61, 0.35)',
    margin: '0',
    borderRadius: '1.2rem', // Slightly larger border radius
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box'
  };

  const titleStyle = {
    fontFamily: 'var(--font-family)',
    fontWeight: 'var(--font-weight-extrabold)',
    fontSize: 'clamp(0.9rem, 3vw, 1.8rem)',
    lineHeight: '1',
    textTransform: 'uppercase',
    color: 'var(--color-yellow)',
    textShadow: `
      -1px -1px 0 var(--color-black), 0 -1px 0 var(--color-black), 1px -1px 0 var(--color-black), 
      -1px 0 0 var(--color-black), 1px 0 0 var(--color-black), -1px 1px 0 var(--color-black), 
      0 1px 0 var(--color-black), 1px 1px 0 var(--color-black), -2px -2px 0 var(--color-black), 
      -1px -2px 0 var(--color-black), 0 -2px 0 var(--color-black), 1px -2px 0 var(--color-black), 
      2px -2px 0 var(--color-black), 2px -1px 0 var(--color-black), 2px 0 0 var(--color-black), 
      2px 1px 0 var(--color-black), 2px 2px 0 var(--color-black), 1px 2px 0 var(--color-black), 
      0 2px 0 var(--color-black), -1px 2px 0 var(--color-black), -2px 2px 0 var(--color-black), 
      -2px 1px 0 var(--color-black), -2px 0 0 var(--color-black), -2px -1px 0 var(--color-black),
      4px 4px 0 #000, 5px 5px 0 #000, 6px 6px 0 #000, 7px 7px 0 #000, 8px 8px 0 #000,
      9px 9px 0 #000, 10px 10px 0 #000, 11px 11px 0 #000, 12px 12px 0 #000
    `,
    marginBottom: '0',
    textAlign: 'center'
  };

  // Helper function to get background styles based on variant
  const getBackgroundStyles = (isMobile = true) => {
    const dotColor = backgroundVariant === 'alternative' ? 'var(--color-white)' : 'var(--color-black)';
    const gradientStyle = backgroundVariant === 'alternative' 
      ? 'linear-gradient(135deg, var(--color-white) 0%, var(--color-silver) 50%, var(--color-black) 100%)'
      : 'linear-gradient(135deg, var(--color-orange) 0%, var(--color-red) 50%, var(--color-purple) 100%)';

    const mobileBackground = `
      radial-gradient(circle at 0 0, ${dotColor} 2px, transparent 2px),
      radial-gradient(circle at 15px 15px, ${dotColor} 1.5px, transparent 1.5px),
      radial-gradient(circle at 8px 25px, ${dotColor} 1px, transparent 1px),
      ${gradientStyle}
    `;

    const desktopBackground = `
      radial-gradient(circle at 0 0, ${dotColor} 3px, transparent 3px),
      radial-gradient(circle at 20px 20px, ${dotColor} 2px, transparent 2px),
      radial-gradient(circle at 10px 35px, ${dotColor} 1.5px, transparent 1.5px),
      radial-gradient(circle at 35px 10px, ${dotColor} 1px, transparent 1px),
      ${gradientStyle}
    `;

    return isMobile ? mobileBackground : desktopBackground;
  };

  // Mobile Layout
  const MobileLayout = () => (
    <div style={{ 
      height: '100dvh', 
      WebkitHeight: '-webkit-fill-available', // Safari fallback
      background: getBackgroundStyles(true),
      backgroundSize: '30px 30px, 30px 30px, 30px 30px, 100% 100%',
      backgroundPosition: '0 0, 0 0, 0 0, 0 0',
      display: 'flex',
      flexDirection: 'column',
      padding: '0.5rem',
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: 'fixed', // Fixed positioning to prevent any scrolling
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      
      {/* Header - Reduced size */}
      <motion.header 
        style={{
          textAlign: 'center',
          paddingBottom: '1.5rem',          paddingBottom: '0.25rem',
          color: 'var(--color-black)',
          flexShrink: 0
        }}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 style={{
          fontFamily: 'var(--font-family)',
          fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
          fontWeight: 'var(--font-weight-extrabold)',
          color: 'var(--color-white)',
          fontStyle: 'italic',
          letterSpacing: '-0.05em',
          textShadow: `
            -1px -1px 0 var(--color-black), 0 -1px 0 var(--color-black), 1px -1px 0 var(--color-black), 
            -1px 0 0 var(--color-black), 1px 0 0 var(--color-black), -1px 1px 0 var(--color-black), 
            0 1px 0 var(--color-black), 1px 1px 0 var(--color-black), -2px -2px 0 var(--color-black), 
            -1px -2px 0 var(--color-black), 0 -2px 0 var(--color-black), 1px -2px 0 var(--color-black), 
            2px -2px 0 var(--color-black), 2px -1px 0 var(--color-black), 2px 0 0 var(--color-black), 
            2px 1px 0 var(--color-black), 2px 2px 0 var(--color-black), 1px 2px 0 var(--color-black), 
            0 2px 0 var(--color-black), -1px 2px 0 var(--color-black), -2px 2px 0 var(--color-black), 
            -2px 1px 0 var(--color-black), -2px 0 0 var(--color-black), -2px -1px 0 var(--color-black),
            4px 4px 0 #000, 5px 5px 0 #000, 6px 6px 0 #000, 7px 7px 0 #000, 8px 8px 0 #000,
            9px 9px 0 #000, 10px 10px 0 #000, 11px 11px 0 #000, 12px 12px 0 #000
          `,
          margin: '0',
          lineHeight: '1'
        }}>
          GYMTONIC
        </h1>
      </motion.header>

      {/* Sections Container - Takes remaining space */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem', // Much larger gap between sections
        minHeight: 0,
        overflow: 'hidden', // Prevent any overflow
        padding: '0.5rem' // Additional padding around container
      }}>

        {/* Section 1: GymBros Near Me */}
        <motion.div 
          style={{
            ...sectionStyle,
            backgroundColor: 'var(--color-blue)',
            background: 'linear-gradient(315deg, #FFD700 0%, #FFEA64 20%, #4FC3F7 45%, var(--color-blue) 70%, #144c90 100%)',
            flex: 1
          }}
          onClick={() => handleOptionClick('gymbros', '/gymbros', true)}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: -50 }}
          animate={animationsComplete ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          {/* Background image animation */}
          <motion.img
            src="/Muscular_conversion.png"
            alt="Muscular conversion"
            style={{
              position: 'absolute',
              top: '35%',
              left: '5%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(100px, 30vw, 130px)',
              height: 'auto',
              opacity: 1,
              zIndex: 0
            }}
            initial={{ opacity: 0, x: -(window.innerWidth + 120) }}
            animate={animationsComplete ? { opacity: 1, x: 0 } : {}}
            transition={{
              duration: 1.4,
              ease: "easeOut",
              delay: 0.2
            }}
          />
          
          {/* Wind animation lines */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            pointerEvents: 'none'
          }}>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: '120px',
                  height: '4px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), rgba(255,255,255,0.3), transparent)',
                  top: `${20 + (i * 10)}%`,
                  right: '-120px',
                }}
                animate={{
                  x: [0, -(window.innerWidth + 120)],
                  opacity: [0, 0.8, 0.8, 0]
                }}
                transition={{
                  duration: 2 + (i * 0.3),
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: i * 0.05
                }}
              />
            ))}
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            height: '100%',
            gap: '0.5rem',
            position: 'relative',
            zIndex: 1,
            paddingTop: '0.25rem'
          }}>
            <Dumbbell 
              size={clamp(30, 8, 50)}
              color="#4FC3F7"
              style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
            />
            <h3 style={titleStyle}>
              GYMBROS NEAR ME
            </h3>
          </div>
        </motion.div>

        {/* Section 2: Coaching Near Me */}
        <motion.div 
          style={{
            ...sectionStyle,
            backgroundColor: 'var(--color-purple)',
            background: 'radial-gradient(ellipse at center, var(--color-purple) 0%, var(--color-purple) 50%, #a855f7 85%, #c084fc 100%)',
            flex: 1
          }}
          onClick={() => handleOptionClick('coaching', '/coaching', true)}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 50 }}
          animate={animationsComplete ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        >
          {/* Background image animation */}
          <motion.img
            src="/coach_conversion.png"
            alt="Coach conversion"
            style={{
              position: 'absolute',
              top: '40%',
              left: '35%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(100px, 30vw, 130px)',
              height: 'auto',
              opacity: 1,
              zIndex: 0
            }}
            initial={{ opacity: 0, y: window.innerHeight + 120 }}
            animate={animationsComplete ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 1.4,
              ease: "easeOut",
              delay: 0.2
            }}
          />
          
          {/* Wind animation lines */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            pointerEvents: 'none'
          }}>
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: '5px',
                  height: '120px',
                  background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.7), rgba(255,255,255,0.4), transparent)',
                  left: `${20 + (i * 8)}%`,
                  top: '-120px',
                }}
                animate={{
                  y: [0, 500],
                  opacity: [0, 0.9, 0.6, 0]
                }}
                transition={{
                  duration: 1.8 + (i * 0.3),
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: i * 0.08
                }}
              />
            ))}
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            height: '100%',
            gap: '0.5rem',
            position: 'relative',
            zIndex: 1,
            paddingTop: '0.25rem'
          }}>
            <Trophy 
              size={clamp(30, 8, 50)}
              color="#C084FC"
              style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
            />
            <h3 style={titleStyle}>
              COACHING NEAR ME
            </h3>
          </div>
        </motion.div>

        {/* Section 3: Shop */}
        <motion.div 
          style={{
            ...sectionStyle,
            backgroundColor: 'var(--color-red)',
            background: 'linear-gradient(135deg, #FFD700 0%, #FFEA64 20%, #FF6B35 45%, var(--color-red) 70%, #B91C1C 100%)',
            flex: 1
          }}
          onClick={() => handleOptionClick('shop', '/shop', false)}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: 50 }}
          animate={animationsComplete ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
        >
          {/* Background image animation */}
          <motion.img
            src="/Blonde_conversion.png"
            alt="Blonde conversion"
            style={{
              position: 'absolute',
              top: '35%',
              left: '65%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(100px, 30vw, 130px)',
              height: 'auto',
              opacity: 1,
              zIndex: 0
            }}
            initial={{ opacity: 0, x: window.innerWidth + 120 }}
            animate={animationsComplete ? { opacity: 1, x: 0 } : {}}
            transition={{
              duration: 1.4,
              ease: "easeOut",
              delay: 0.2
            }}
          />
          
          {/* Wind animation lines */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            pointerEvents: 'none'
          }}>
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: '80px',
                  height: '3px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), rgba(255,255,255,0.5), transparent)',
                  top: `${15 + (i * 7)}%`,
                  left: '-80px',
                  transform: `rotate(${5 + (i * 2)}deg)`
                }}
                animate={{
                  x: [0, window.innerWidth + 80],
                  opacity: [0, 1, 0.7, 0]
                }}
                transition={{
                  duration: 1.5 + (i * 0.2),
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: i * 0.08
                }}
              />
            ))}
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            height: '100%',
            gap: '0.3rem',
            position: 'relative',
            zIndex: 1,
            paddingTop: '0.25rem'
          }}>
            <ShoppingBag 
              size={clamp(25, 6, 40)}
              color="#FF6B6B"
              style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
            />
            <h3 style={{...titleStyle, fontSize: 'clamp(1rem, 3.5vw, 1.8rem)'}}>
              SHOP
            </h3>
          </div>
        </motion.div>
      </div>
    </div>
  );

  // Desktop Layout
  const DesktopLayout = () => (
    <div style={{ 
      height: '100dvh', // Also use dvh for desktop for consistency
      background: getBackgroundStyles(false),
      backgroundSize: '40px 40px, 40px 40px, 40px 40px, 40px 40px, 100% 100%',
      backgroundPosition: '0 0, 0 0, 0 0, 0 0, 0 0',
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      
      {/* Header */}
      <motion.header 
        style={{
          textAlign: 'center',
          paddingBottom: '0.5rem',
          color: 'var(--color-black)',
          flexShrink: 0
        }}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 style={{
          fontFamily: 'var(--font-family)',
          fontSize: 'clamp(3rem, 6vw, 5rem)',
          fontWeight: 'var(--font-weight-extrabold)',
          color: 'var(--color-white)',
          fontStyle: 'italic',
          letterSpacing: '-0.05em',
          textShadow: `
            -1px -1px 0 var(--color-black), 0 -1px 0 var(--color-black), 1px -1px 0 var(--color-black), 
            -1px 0 0 var(--color-black), 1px 0 0 var(--color-black), -1px 1px 0 var(--color-black), 
            0 1px 0 var(--color-black), 1px 1px 0 var(--color-black), -2px -2px 0 var(--color-black), 
            -1px -2px 0 var(--color-black), 0 -2px 0 var(--color-black), 1px -2px 0 var(--color-black), 
            2px -2px 0 var(--color-black), 2px -1px 0 var(--color-black), 2px 0 0 var(--color-black), 
            2px 1px 0 var(--color-black), 2px 2px 0 var(--color-black), 1px 2px 0 var(--color-black), 
            0 2px 0 var(--color-black), -1px 2px 0 var(--color-black), -2px 2px 0 var(--color-black), 
            -2px 1px 0 var(--color-black), -2px 0 0 var(--color-black), -2px -1px 0 var(--color-black),
            6px 6px 0 #000, 7px 7px 0 #000, 8px 8px 0 #000, 9px 9px 0 #000, 10px 10px 0 #000,
            11px 11px 0 #000, 12px 12px 0 #000, 13px 13px 0 #000, 14px 14px 0 #000, 15px 15px 0 #000,
            16px 16px 0 #000, 17px 17px 0 #000, 18px 18px 0 #000
          `,
          margin: '30px 0 20px 0',
          lineHeight: '1'
        }}>
          GYMTONIC
        </h1>
      </motion.header>

      {/* Desktop Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '4rem', // Increased gap between sections
        width: '100%',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        
        {/* Section 1: GymBros Near Me */}
        <motion.div 
          style={{
            ...sectionStyle,
            backgroundColor: 'var(--color-blue)',
            background: 'linear-gradient(315deg, #FFD700 0%, #FFEA64 20%, #4FC3F7 45%, var(--color-blue) 70%, #144c90 100%)',
            margin: '0',
            minHeight: 'auto'
          }}
          onClick={() => handleOptionClick('gymbros', '/gymbros', true)}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: -100 }}
          animate={animationsComplete ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          {/* Background image animation */}
          <motion.img
            src="/Muscular_conversion.png"
            alt="Muscular conversion"
            style={{
              position: 'absolute',
              top: '45%',
              left: '-5%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(120px, 25vw, 300px)',
              height: 'auto',
              opacity: 1,
              zIndex: 0
            }}
            initial={{ opacity: 0, x: -650 }}
            animate={animationsComplete ? { opacity: 1, x: 0 } : {}}
            transition={{
              duration: 1.4,
              ease: "easeOut",
              delay: 0.2
            }}
          />
          
          {/* Wind animation lines */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            pointerEvents: 'none'
          }}>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: '150px',
                  height: '5px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), rgba(255,255,255,0.3), transparent)',
                  top: `${10 + (i * 7)}%`,
                  right: '-150px',
                }}
                animate={{
                  x: [0, -650],
                  opacity: [0, 0.8, 0.5, 0]
                }}
                transition={{
                  duration: 2.5 + (i * 0.4),
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: i * 0.05
                }}
              />
            ))}
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            height: '100%',
            gap: '1rem',
            position: 'relative',
            zIndex: 1,
            paddingTop: '2rem'
          }}>
            <Dumbbell 
              size={60}
              color="#4FC3F7"
              style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
            />
            <h3 style={{...titleStyle, fontSize: 'clamp(1rem, 2.5vw, 1.8rem)'}}>
              GYMBROS NEAR ME
            </h3>
          </div>
        </motion.div>

        {/* Section 2: Coaching Near Me */}
        <motion.div 
          style={{
            ...sectionStyle,
            backgroundColor: 'var(--color-purple)',
            background: 'radial-gradient(ellipse at center, var(--color-purple) 0%, var(--color-purple) 50%, #a855f7 85%, #c084fc 100%)',
            margin: '0',
            minHeight: 'auto'
          }}
          onClick={() => handleOptionClick('coaching', '/coaching', true)}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 100 }}
          animate={animationsComplete ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        >
          {/* Background image animation */}
          <motion.img
            src="/coach_conversion.png"
            alt="Coach conversion"
            style={{
              position: 'absolute',
              top: '45%',
              left: '30%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(120px, 25vw, 300px)',
              height: 'auto',
              opacity: 1,
              zIndex: 0
            }}
            initial={{ opacity: 0, y: 600 }}
            animate={animationsComplete ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 1.4,
              ease: "easeOut",
              delay: 0.2
            }}
          />
          
          {/* Wind animation lines */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            pointerEvents: 'none'
          }}>
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: '5px',
                  height: '140px',
                  background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.6), rgba(255,255,255,0.3), transparent)',
                  left: `${20 + (i * 8)}%`,
                  top: '-140px',
                }}
                animate={{
                  y: [0, 600],
                  opacity: [0, 0.8, 0.5, 0]
                }}
                transition={{
                  duration: 2.2 + (i * 0.3),
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: i * 0.08
                }}
              />
            ))}
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            height: '100%',
            gap: '1rem',
            position: 'relative',
            zIndex: 1,
            paddingTop: '1rem'
          }}>
            <Trophy 
              size={60}
              color="#C084FC"
              style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
            />
            <h3 style={{...titleStyle, fontSize: 'clamp(1rem, 2.5vw, 1.8rem)'}}>
              COACHING NEAR ME
            </h3>
          </div>
        </motion.div>

        {/* Section 3: Shop */}
        <motion.div 
          style={{
            ...sectionStyle,
            backgroundColor: 'var(--color-red)',
            background: 'linear-gradient(135deg, #FFD700 0%, #FFEA64 20%, #FF6B35 45%, var(--color-red) 70%, #B91C1C 100%)',
            margin: '0',
            minHeight: 'auto'
          }}
          onClick={() => handleOptionClick('shop', '/shop', false)}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: 100 }}
          animate={animationsComplete ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
        >
          {/* Background image animation */}
          <motion.img
            src="/Blonde_conversion.png"
            alt="Blonde conversion"
            style={{
              position: 'absolute',
              top: '45%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(120px, 25vw, 300px)',
              height: 'auto',
              opacity: 1,
              zIndex: 0
            }}
            initial={{ opacity: 0, x: 650 }}
            animate={animationsComplete ? { opacity: 1, x: 0 } : {}}
            transition={{
              duration: 1.4,
              ease: "easeOut",
              delay: 0.2 
            }}
          />
          
          {/* Wind animation lines */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            pointerEvents: 'none'
          }}>
            {[...Array(14)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: '120px',
                  height: '4px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), rgba(255,255,255,0.3), transparent)',
                  top: `${8 + (i * 6)}%`,
                  left: '-120px',
                  transform: `rotate(${10 + (i * 2)}deg)`
                }}
                animate={{
                  x: [0, 650],
                  opacity: [0, 0.8, 0.5, 0]
                }}
                transition={{
                  duration: 1.8 + (i * 0.25),
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: i * 0.06
                }}
              />
            ))}
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            height: '100%',
            gap: '1rem',
            position: 'relative',
            zIndex: 1,
            paddingTop: '1rem'
          }}>
            <ShoppingBag 
              size={60}
              color="#FF6B6B"
              style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
            />
            <h3 style={{...titleStyle, fontSize: 'clamp(1rem, 2.5vw, 1.8rem)'}}>
              SHOP
            </h3>
          </div>
        </motion.div>
      </div>
    </div>
  );

  // Helper function for clamping values
  const clamp = (min, vw, max) => {
    const viewport = window.innerWidth;
    const size = Math.max(min, Math.min(max, viewport * (vw / 100)));
    return size;
  };

  return (
    <>
      {screenType === 'mobile' ? <MobileLayout /> : <DesktopLayout />}

      {/* Loading overlay */}
      {selectedOption && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }} // Very fast transition to hide background immediately
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: getBackgroundStyles(screenType === 'mobile'), // Use same background as component
            backgroundSize: screenType === 'mobile' 
              ? '30px 30px, 30px 30px, 30px 30px, 100% 100%'
              : '40px 40px, 40px 40px, 40px 40px, 40px 40px, 100% 100%',
            backgroundPosition: screenType === 'mobile'
              ? '0 0, 0 0, 0 0, 0 0'
              : '0 0, 0 0, 0 0, 0 0, 0 0',
            backdropFilter: 'blur(12px)', // Strong blur to create loading effect
            filter: 'blur(2px)', // Additional blur on the background itself
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999 // Higher z-index to ensure it's on top
          }}
        >
          {/* Semi-transparent overlay to improve spinner visibility */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)', // Light overlay for better contrast
            zIndex: 1
          }} />
          
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              border: '4px solid var(--color-yellow)',
              borderTop: '4px solid transparent',
              borderRadius: '50%',
              width: 'clamp(3rem, 8vw, 5rem)',
              height: 'clamp(3rem, 8vw, 5rem)',
              zIndex: 2, // Above the overlay
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))' // Add shadow for better visibility
            }}
          />
        </motion.div>
      )}
    </>
  );
};

export default ConversionLanding;
