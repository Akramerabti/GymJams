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
    const checkScreenType = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
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
    root.style.setProperty('--font-family', 'Rubik, sans-serif');
    root.style.setProperty('--font-weight-extrabold', '800');

    return () => {
      clearTimeout(timer);
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
    
    setTimeout(() => {
      navigate(route);
    }, 300);
  };

  const sectionStyle = {
    padding: 'clamp(1.5rem, 3vw, 2.5rem)',
    border: '0.25rem solid var(--color-black)',
    backgroundColor: 'var(--color-white)',
    boxShadow: '0.5rem 0.5rem rgba(132, 81, 61, 0.35)',
    borderRadius: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  };

  const titleStyle = {
    fontFamily: 'var(--font-family)',
    fontWeight: 'var(--font-weight-extrabold)',
    lineHeight: '1',
    textTransform: 'uppercase',
    color: 'var(--color-white)',
    textShadow: `-1px -1px 0 var(--color-black), 0 -1px 0 var(--color-black), 1px -1px 0 var(--color-black), 
                 -1px 0 0 var(--color-black), 1px 0 0 var(--color-black), -1px 1px 0 var(--color-black), 
                 0 1px 0 var(--color-black), 1px 1px 0 var(--color-black), -2px -2px 0 var(--color-black), 
                 -1px -2px 0 var(--color-black), 0 -2px 0 var(--color-black), 1px -2px 0 var(--color-black), 
                 2px -2px 0 var(--color-black), 2px -1px 0 var(--color-black), 2px 0 0 var(--color-black), 
                 2px 1px 0 var(--color-black), 2px 2px 0 var(--color-black), 1px 2px 0 var(--color-black), 
                 0 2px 0 var(--color-black), -1px 2px 0 var(--color-black), -2px 2px 0 var(--color-black), 
                 -2px 1px 0 var(--color-black), -2px 0 0 var(--color-black), -2px -1px 0 var(--color-black)`,
    textAlign: 'center'
  };

  // Mobile Layout
  const MobileLayout = () => (
    <div style={{ 
      height: '100vh',
      backgroundColor: 'var(--color-yellow)',
      backgroundImage: `radial-gradient(var(--color-dark-yellow) 20%, transparent 0), 
                       radial-gradient(var(--color-dark-yellow) 20%, transparent 0)`,
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 10px 10px',
      display: 'flex',
      flexDirection: 'column',
      padding: '0.5rem'
    }}>
      
      {/* Header with more space above */}
      <motion.header 
        style={{
          textAlign: 'center',
          paddingTop: '2rem', // Added top padding
          paddingBottom: '1.5rem',
          color: 'var(--color-black)',
          flexShrink: 0
        }}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 style={{
          fontFamily: 'var(--font-family)',
          fontSize: 'clamp(3rem, 10vw, 5rem)', // Increased size
          fontWeight: 'var(--font-weight-extrabold)',
          color: 'var(--color-white)',
          fontStyle: 'italic',
          letterSpacing: '-0.05em',
          textShadow: titleStyle.textShadow,
          margin: '0',
          lineHeight: '0.9'
        }}>
          GYMTONIC
        </h1>
      </motion.header>

      {/* Sections Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        paddingBottom: '1rem'
      }}>

        {/* Section 1: GymBros Near Me */}
        <motion.div 
          style={{
            ...sectionStyle,
            backgroundColor: 'var(--color-blue)',
            flex: 1,
            display: 'flex',
            minHeight: '80px', // Minimum height for very small screens
            maxHeight: '140px' // Maximum height to prevent too tall sections
          }}
          onClick={() => handleOptionClick('gymbros', '/gymbros', true)}
          whileHover={{ 
            scale: 1.02,
            backgroundColor: 'var(--color-dark-blue)',
            boxShadow: '0.75rem 0.75rem rgba(132, 81, 61, 0.35)'
          }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: -50 }}
          animate={animationsComplete ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            gap: '0.25rem'
          }}>
            <Dumbbell 
              size={clamp(24, 6, 40)}
              color="var(--color-yellow)"
              style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
            />
            <h3 style={{...titleStyle, fontSize: 'clamp(0.9rem, 3vw, 1.5rem)'}}>
              GYMBROS NEAR ME
            </h3>
          </div>
        </motion.div>

        {/* Section 2: Coaching Near Me */}
        <motion.div 
          style={{
            ...sectionStyle,
            backgroundColor: 'var(--color-purple)',
            flex: 1,
            display: 'flex',
            minHeight: '80px',
            maxHeight: '140px'
          }}
          onClick={() => handleOptionClick('coaching', '/coaching', true)}
          whileHover={{ 
            scale: 1.02,
            backgroundColor: 'var(--color-dark-purple)',
            boxShadow: '0.75rem 0.75rem rgba(132, 81, 61, 0.35)'
          }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 50 }}
          animate={animationsComplete ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            gap: '0.25rem'
          }}>
            <Trophy 
              size={clamp(24, 6, 40)}
              color="var(--color-yellow)"
              style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
            />
            <h3 style={{...titleStyle, fontSize: 'clamp(0.9rem, 3vw, 1.5rem)'}}>
              COACHING NEAR ME
            </h3>
          </div>
        </motion.div>

        {/* Section 3: Shop */}
        <motion.div 
          style={{
            ...sectionStyle,
            backgroundColor: 'var(--color-red)',
            flex: 1,
            display: 'flex',
            minHeight: '80px',
            maxHeight: '140px'
          }}
          onClick={() => handleOptionClick('shop', '/shop', false)}
          whileHover={{ 
            scale: 1.02,
            backgroundColor: 'var(--color-dark-red)',
            boxShadow: '0.75rem 0.75rem rgba(132, 81, 61, 0.35)'
          }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: 50 }}
          animate={animationsComplete ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            gap: '0.25rem'
          }}>
            <ShoppingBag 
              size={clamp(24, 6, 40)}
              color="var(--color-yellow)"
              style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
            />
            <h3 style={{...titleStyle, fontSize: 'clamp(0.9rem, 3vw, 1.5rem)'}}>
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
      backgroundColor: 'var(--color-yellow)',
      backgroundImage: `radial-gradient(var(--color-dark-yellow) 20%, transparent 0), 
                       radial-gradient(var(--color-dark-yellow) 20%, transparent 0)`,
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 10px 10px',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem'
    }}>
      
      {/* Header with more space */}
      <motion.header 
        style={{
          textAlign: 'center',
          paddingTop: '3rem', // More space above title
          paddingBottom: '3rem',
          color: 'var(--color-black)',
          flexShrink: 0
        }}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 style={{
          fontFamily: 'var(--font-family)',
          fontSize: screenType === 'tablet' ? 'clamp(5rem, 10vw, 8rem)' : 'clamp(6rem, 10vw, 10rem)', // Bigger title
          fontWeight: 'var(--font-weight-extrabold)',
          color: 'var(--color-white)',
          fontStyle: 'italic',
          letterSpacing: '-0.05em',
          textShadow: titleStyle.textShadow,
          margin: '0',
          lineHeight: '0.9'
        }}>
          GYMTONIC
        </h1>
      </motion.header>

      {/* Desktop Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: screenType === 'tablet' ? 'repeat(auto-fit, minmax(250px, 1fr))' : 'repeat(3, 1fr)',
        gap: '2rem',
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        flex: 1,
        alignItems: 'center'
      }}>
        
        {/* Section 1: GymBros Near Me */}
        <motion.div 
          style={{
            ...sectionStyle,
            backgroundColor: 'var(--color-blue)',
            height: screenType === 'tablet' ? '200px' : '250px', // Fixed heights instead of minHeight
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => handleOptionClick('gymbros', '/gymbros', true)}
          whileHover={{ 
            scale: 1.02,
            backgroundColor: 'var(--color-dark-blue)',
            boxShadow: '0.75rem 0.75rem rgba(132, 81, 61, 0.35)'
          }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 100 }}
          animate={animationsComplete ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <Dumbbell 
              size={screenType === 'tablet' ? 50 : 60}
              color="var(--color-yellow)"
              style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
            />
            <h3 style={{...titleStyle, fontSize: screenType === 'tablet' ? '1.75rem' : '2rem'}}>
              GYMBROS NEAR ME
            </h3>
          </div>
        </motion.div>

        {/* Section 2: Coaching Near Me */}
        <motion.div 
          style={{
            ...sectionStyle,
            backgroundColor: 'var(--color-purple)',
            height: screenType === 'tablet' ? '200px' : '250px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => handleOptionClick('coaching', '/coaching', true)}
          whileHover={{ 
            scale: 1.02,
            backgroundColor: 'var(--color-dark-purple)',
            boxShadow: '0.75rem 0.75rem rgba(132, 81, 61, 0.35)'
          }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 100 }}
          animate={animationsComplete ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <Trophy 
              size={screenType === 'tablet' ? 50 : 60}
              color="var(--color-yellow)"
              style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
            />
            <h3 style={{...titleStyle, fontSize: screenType === 'tablet' ? '1.75rem' : '2rem'}}>
              COACHING NEAR ME
            </h3>
          </div>
        </motion.div>

        {/* Section 3: Shop */}
        <motion.div 
          style={{
            ...sectionStyle,
            backgroundColor: 'var(--color-red)',
            height: screenType === 'tablet' ? '200px' : '250px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => handleOptionClick('shop', '/shop', false)}
          whileHover={{ 
            scale: 1.02,
            backgroundColor: 'var(--color-dark-red)',
            boxShadow: '0.75rem 0.75rem rgba(132, 81, 61, 0.35)'
          }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 100 }}
          animate={animationsComplete ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <ShoppingBag 
              size={screenType === 'tablet' ? 50 : 60}
              color="var(--color-yellow)"
              style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
            />
            <h3 style={{...titleStyle, fontSize: screenType === 'tablet' ? '1.75rem' : '2rem'}}>
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