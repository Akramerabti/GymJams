import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Dumbbell, Trophy, ShoppingBag, Zap } from 'lucide-react';

const ConversionLanding = () => {
  // Navigation would be handled by react-router in production
  const navigate = (route) => {
    window.location.href = route;
  };
  
  const [animationsComplete, setAnimationsComplete] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [screenType, setScreenType] = useState('mobile');

  useEffect(() => {
    // Reset default browser styles
    const style = document.createElement('style');
    style.textContent = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html, body {
        height: 100%;
        overflow: hidden;
        margin: 0;
        padding: 0;
      }
      #root {
        height: 100vh;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);

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
    
    // Start animations after component mounts
    const timer = setTimeout(() => {
      setAnimationsComplete(true);
    }, 1000);
    
    // Add Rubik font and CSS variables
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Rubik:wght@400;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Add CSS variables to document root
    const root = document.documentElement;
    root.style.setProperty('--color-black', '#000');
    root.style.setProperty('--color-white', '#fff');
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

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScreenType);
      document.head.removeChild(style);
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
      navigate(route);
    }, 300);
  };

  const sectionStyle = {
    height: '100%',
    width: '100%',
    padding: 'clamp(1rem, 3vw, 2rem)',
    border: '0.25rem solid var(--color-black)',
    backgroundColor: 'var(--color-white)',
    boxShadow: '0.5rem 0.5rem rgba(132, 81, 61, 0.35)',
    borderRadius: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    boxSizing: 'border-box'
  };

  const titleStyle = {
    fontFamily: 'var(--font-family)',
    fontWeight: 'var(--font-weight-extrabold)',
    fontSize: 'clamp(0.8rem, 2.5vw, 1.6rem)',
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
    margin: '0',
    textAlign: 'center'
  };

  // Mobile Layout
  const MobileLayout = () => (
    <div style={{ 
      height: '100vh',
      width: '100vw',
      background: `
        radial-gradient(circle at 0 0, var(--color-black) 2px, transparent 2px),
        radial-gradient(circle at 15px 15px, var(--color-black) 1.5px, transparent 1.5px),
        radial-gradient(circle at 8px 25px, var(--color-black) 1px, transparent 1px),
        linear-gradient(135deg, var(--color-orange) 0%, var(--color-red) 50%, var(--color-purple) 100%)
      `,
      backgroundSize: '30px 30px, 30px 30px, 30px 30px, 100% 100%',
      backgroundPosition: '0 0, 0 0, 0 0, 0 0',
      display: 'flex',
      flexDirection: 'column',
      padding: 'clamp(0.5rem, 2vw, 1rem)',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      
      {/* Header */}
      <motion.header 
        style={{
          textAlign: 'center',
          color: 'var(--color-black)',
          flexShrink: 0,
          paddingBottom: 'clamp(0.5rem, 1.5vh, 1rem)',
          boxSizing: 'border-box'
        }}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 style={{
          fontFamily: 'var(--font-family)',
          fontSize: 'clamp(1.8rem, 6vw, 3.5rem)',
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

      {/* Sections Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(0.3rem, 1vh, 0.8rem)',
        minHeight: 0,
        boxSizing: 'border-box'
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
              top: '50%',
              left: '10%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(80px, 25vw, 120px)',
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
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: '100px',
                  height: '3px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), rgba(255,255,255,0.3), transparent)',
                  top: `${25 + (i * 10)}%`,
                  right: '-100px',
                }}
                animate={{
                  x: [0, -(window.innerWidth + 100)],
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
            justifyContent: 'center',
            height: '100%',
            gap: 'clamp(0.3rem, 1.5vh, 0.8rem)',
            position: 'relative',
            zIndex: 1
          }}>
            <Dumbbell 
              size={Math.min(40, window.innerWidth * 0.08)}
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
              top: '50%',
              left: '35%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(80px, 25vw, 120px)',
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
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: '3px',
                  height: '100px',
                  background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.7), rgba(255,255,255,0.4), transparent)',
                  left: `${25 + (i * 8)}%`,
                  top: '-100px',
                }}
                animate={{
                  y: [0, 400],
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
            justifyContent: 'center',
            height: '100%',
            gap: 'clamp(0.3rem, 1.5vh, 0.8rem)',
            position: 'relative',
            zIndex: 1
          }}>
            <Trophy 
              size={Math.min(40, window.innerWidth * 0.08)}
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
              top: '50%',
              left: '65%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(80px, 25vw, 120px)',
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
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: '70px',
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), rgba(255,255,255,0.5), transparent)',
                  top: `${20 + (i * 8)}%`,
                  left: '-70px',
                  transform: `rotate(${5 + (i * 2)}deg)`
                }}
                animate={{
                  x: [0, window.innerWidth + 70],
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
            justifyContent: 'center',
            height: '100%',
            gap: 'clamp(0.3rem, 1.5vh, 0.8rem)',
            position: 'relative',
            zIndex: 1
          }}>
            <ShoppingBag 
              size={Math.min(35, window.innerWidth * 0.07)}
              color="#FF6B6B"
              style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
            />
            <h3 style={{...titleStyle, fontSize: 'clamp(0.9rem, 3vw, 1.6rem)'}}>
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
      height: '100vh',
      width: '100vw',
      background: `
        radial-gradient(circle at 0 0, var(--color-black) 3px, transparent 3px),
        radial-gradient(circle at 20px 20px, var(--color-black) 2px, transparent 2px),
        radial-gradient(circle at 10px 35px, var(--color-black) 1.5px, transparent 1.5px),
        radial-gradient(circle at 35px 10px, var(--color-black) 1px, transparent 1px),
        linear-gradient(135deg, var(--color-orange) 0%, var(--color-red) 30%, var(--color-purple) 70%, #ff1493 100%)
      `,
      backgroundSize: '40px 40px, 40px 40px, 40px 40px, 40px 40px, 100% 100%',
      backgroundPosition: '0 0, 0 0, 0 0, 0 0, 0 0',
      display: 'flex',
      flexDirection: 'column',
      padding: 'clamp(1rem, 2vw, 2rem)',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      
      {/* Header */}
      <motion.header 
        style={{
          textAlign: 'center',
          color: 'var(--color-black)',
          flexShrink: 0,
          paddingBottom: 'clamp(1rem, 2vh, 2rem)',
          boxSizing: 'border-box'
        }}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 style={{
          fontFamily: 'var(--font-family)',
          fontSize: 'clamp(3rem, 6vw, 6rem)',
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
          margin: '0',
          lineHeight: '1'
        }}>
          GYMTONIC
        </h1>
      </motion.header>

      {/* Desktop Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'clamp(1rem, 3vw, 3rem)',
        flex: 1,
        alignItems: 'stretch',
        boxSizing: 'border-box',
        minHeight: 0
      }}>
        
        {/* Section 1: GymBros Near Me */}
        <motion.div 
          style={{
            ...sectionStyle,
            backgroundColor: 'var(--color-blue)',
            background: 'linear-gradient(315deg, #FFD700 0%, #FFEA64 20%, #4FC3F7 45%, var(--color-blue) 70%, #144c90 100%)'
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
              top: '50%',
              left: '10%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(120px, 20vw, 250px)',
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
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: '120px',
                  height: '4px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), rgba(255,255,255,0.3), transparent)',
                  top: `${15 + (i * 8)}%`,
                  right: '-120px',
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
            justifyContent: 'center',
            height: '100%',
            gap: 'clamp(0.8rem, 2vh, 1.5rem)',
            position: 'relative',
            zIndex: 1
          }}>
            <Dumbbell 
              size={Math.min(60, window.innerWidth * 0.05)}
              color="#4FC3F7"
              style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
            />
            <h3 style={{...titleStyle, fontSize: 'clamp(1rem, 2vw, 1.8rem)'}}>
              GYMBROS NEAR ME
            </h3>
          </div>
        </motion.div>

        {/* Section 2: Coaching Near Me */}
        <motion.div 
          style={{
            ...sectionStyle,
            backgroundColor: 'var(--color-purple)',
            background: 'radial-gradient(ellipse at center, var(--color-purple) 0%, var(--color-purple) 50%, #a855f7 85%, #c084fc 100%)'
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
              top: '50%',
              left: '30%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(120px, 20vw, 250px)',
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
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: '4px',
                  height: '120px',
                  background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.6), rgba(255,255,255,0.3), transparent)',
                  left: `${25 + (i * 8)}%`,
                  top: '-120px',
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
            justifyContent: 'center',
            height: '100%',
            gap: 'clamp(0.8rem, 2vh, 1.5rem)',
            position: 'relative',
            zIndex: 1
          }}>
            <Trophy 
              size={Math.min(60, window.innerWidth * 0.05)}
              color="#C084FC"
              style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
            />
            <h3 style={{...titleStyle, fontSize: 'clamp(1rem, 2vw, 1.8rem)'}}>
              COACHING NEAR ME
            </h3>
          </div>
        </motion.div>

        {/* Section 3: Shop */}
        <motion.div 
          style={{
            ...sectionStyle,
            backgroundColor: 'var(--color-red)',
            background: 'linear-gradient(135deg, #FFD700 0%, #FFEA64 20%, #FF6B35 45%, var(--color-red) 70%, #B91C1C 100%)'
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
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(120px, 20vw, 250px)',
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
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: '100px',
                  height: '3px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), rgba(255,255,255,0.3), transparent)',
                  top: `${12 + (i * 6)}%`,
                  left: '-100px',
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
            justifyContent: 'center',
            height: '100%',
            gap: 'clamp(0.8rem, 2vh, 1.5rem)',
            position: 'relative',
            zIndex: 1
          }}>
            <ShoppingBag 
              size={Math.min(60, window.innerWidth * 0.05)}
              color="#FF6B6B"
              style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
            />
            <h3 style={{...titleStyle, fontSize: 'clamp(1rem, 2vw, 1.8rem)'}}>
              SHOP
            </h3>
          </div>
        </motion.div>
      </div>
    </div>
  );

  return (
    <>
      {screenType === 'mobile' ? <MobileLayout /> : <DesktopLayout />}

      {/* Loading overlay */}
      {selectedOption && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              border: '4px solid var(--color-yellow)',
              borderTop: '4px solid transparent',
              borderRadius: '50%',
              width: 'clamp(3rem, 8vw, 5rem)',
              height: 'clamp(3rem, 8vw, 5rem)'
            }}
          />
        </motion.div>
      )}
    </>
  );
};

export default ConversionLanding;
