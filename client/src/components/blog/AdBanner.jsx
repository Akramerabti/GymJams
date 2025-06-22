// components/blog/AdBanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import adService from '../../services/adsense.js';

const AdBanner = ({ position, className = '' }) => {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [adUnfilled, setAdUnfilled] = useState(false);
  const [visibilityChecked, setVisibilityChecked] = useState(false);
  const isDevelopment = adService.isInDevelopmentMode();
  
  // Define responsive dimensions with fallbacks
  const responsiveDimensions = {
    'top': { 
      width: '728px', 
      height: '90px',
      mobileWidth: '320px',
      mobileHeight: '100px' 
    },
    'sidebar': { 
      width: '300px', 
      height: '250px',
      mobileWidth: '300px',
      mobileHeight: '250px'
    },
    'inContent': { 
      width: '336px', 
      height: '280px',
      mobileWidth: '300px',
      mobileHeight: '250px'
    },
    'footer': { 
      width: '728px', 
      height: '90px',
      mobileWidth: '320px',
      mobileHeight: '100px'
    }
  };
  
  // Get dimensions based on position and screen size
  const getDimensions = () => {
    const dims = responsiveDimensions[position] || responsiveDimensions.sidebar;
    const isMobile = window.innerWidth < 768;
    
    return {
      width: isMobile ? dims.mobileWidth : dims.width,
      height: isMobile ? dims.mobileHeight : dims.height
    };
  };

  // Check if the ad is visible after a delay
  const checkAdVisibility = () => {
    if (!adRef.current) return;
    
    // Look for the adsbygoogle element
    const adElement = adRef.current.querySelector('.adsbygoogle');
    if (!adElement) return;
    
    // Check if ad is unfilled
    const adStatus = adElement.getAttribute('data-ad-status');
    if (adStatus === 'unfilled') {
      //(`Ad in position ${position} is unfilled, showing fallback`);
      setAdUnfilled(true);
    }
    
    setVisibilityChecked(true);
  };
  
  // Initialize ad service and display ad
  useEffect(() => {
    let mounted = true;
    
    const initAd = async () => {
      try {
        // Initialize the ad service first
        await adService.init();
        
        // In development mode, don't try to load real ads
        if (isDevelopment) {
          setAdLoaded(true);
          return;
        }
        
        // Set dimensions based on screen size
        const dims = getDimensions();
        
        // Force dimensions immediately after rendering
        if (adRef.current) {
          // Set container dimensions
          adRef.current.style.display = 'block';
          adRef.current.style.width = dims.width;
          adRef.current.style.height = dims.height;
          adRef.current.style.maxWidth = '100%';
          adRef.current.style.margin = '0 auto';
          adRef.current.style.overflow = 'hidden';
          adRef.current.style.position = 'relative'; // Ensure position context
          
          // Delay to ensure DOM is updated
          setTimeout(() => {
            if (!mounted) return;
            
            // Initialize AdSense
            try {
              // Get the AdSense element
              const adElement = adRef.current.querySelector('.adsbygoogle');
              
              if (adElement) {
                // Set AdSense element dimensions
                adElement.style.display = 'block';
                adElement.style.width = dims.width;
                adElement.style.height = dims.height;
                adElement.style.maxWidth = '100%';
                
                // Push to AdSense
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                setAdLoaded(true);
                
                // Check visibility after a delay to see if ad was filled
                setTimeout(checkAdVisibility, 2000);
              } else {
                console.error(`AdSense element not found in ${position} container`);
                setAdError(true);
              }
            } catch (error) {
              console.error(`Error initializing AdSense for ${position}:`, error);
              setAdError(true);
            }
          }, 200);
        } else {
          console.error(`Ad container ref not found for ${position}`);
          setAdError(true);
        }
      } catch (error) {
        console.error(`Error in ad setup for ${position}:`, error);
        if (mounted) setAdError(true);
      }
    };
    
    // Add resize listener to update ad dimensions
    const handleResize = () => {
      if (adRef.current) {
        const dims = getDimensions();
        adRef.current.style.width = dims.width;
        adRef.current.style.height = dims.height;
        
        const adElement = adRef.current.querySelector('.adsbygoogle');
        if (adElement) {
          adElement.style.width = dims.width;
          adElement.style.height = dims.height;
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    initAd();
    
    return () => {
      mounted = false;
      window.removeEventListener('resize', handleResize);
    };
  }, [position, isDevelopment]);

  // Create a premium content promo as a better fallback
  const renderPremiumPromo = () => {
    const dims = getDimensions();
    
    // Choose appropriate promo based on ad position
    const promos = {
      'top': {
        title: 'Premium Coaching',
        description: 'Transform your fitness journey with expert guidance',
        cta: 'Try Now',
        link: '/coaching'
      },
      'sidebar': {
        title: 'Join Premium',
        description: 'Get exclusive workout plans and nutrition guides',
        cta: 'Learn More',
        link: '/subscription'
      },
      'inContent': {
        title: 'Premium Equipment',
        description: 'Shop our best-selling fitness gear',
        cta: 'Shop Now',
        link: '/shop'
      },
      'footer': {
        title: 'Download Our App',
        description: 'Track workouts and nutrition on the go',
        cta: 'Get Started',
        link: '/app'
      }
    };
    
    const promo = promos[position] || promos.sidebar;
    
    // Determine if this is a wide or tall format
    const isWideFormat = dims.width > dims.height;
    
    // Wide format (banner style)
    if (isWideFormat) {
      return (
        <div 
          style={{ 
            width: dims.width,
            height: dims.height,
            maxWidth: '100%',
            overflow: 'hidden',
            display: 'flex',
            background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
            borderRadius: '8px',
            color: 'white',
            padding: '12px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{promo.title}</h3>
            <p style={{ fontSize: '12px', margin: '0 0 8px 0', opacity: 0.9 }}>{promo.description}</p>
            <a 
              href={promo.link} 
              style={{
                fontSize: '12px',
                padding: '4px 12px',
                background: 'white',
                color: '#1e40af',
                borderRadius: '4px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-block',
                textAlign: 'center',
                marginTop: 'auto',
                maxWidth: '120px'
              }}
            >
              {promo.cta}
            </a>
          </div>
          <div style={{ width: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '20px'
              }}>💪</div>
            </div>
          </div>
        </div>
      );
    }
    
    // Tall format (box style)
    return (
      <div 
        style={{ 
          width: dims.width,
          height: dims.height,
          maxWidth: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
          borderRadius: '8px',
          color: 'white',
          padding: '16px',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '24px', margin: '8px 0' }}>💪</div>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '8px 0' }}>{promo.title}</h3>
        <p style={{ fontSize: '14px', margin: '8px 0 16px', flex: 1 }}>{promo.description}</p>
        <a 
          href={promo.link} 
          style={{
            fontSize: '14px',
            padding: '8px 16px',
            background: 'white',
            color: '#1e40af',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 'bold',
            display: 'block',
            textAlign: 'center',
            marginTop: 'auto'
          }}
        >
          {promo.cta}
        </a>
      </div>
    );
  };

  // Show fallback ad in development
  if (isDevelopment) {
    return (
      <div 
        className={`ad-container ad-${position} ${className}`}
        style={{ 
          maxWidth: '100%',
          margin: '0 auto',
          display: 'block'
        }}
      >
        {renderPremiumPromo()}
        <div style={{ fontSize: '10px', color: '#999', textAlign: 'center' }}>
          Advertisement (Dev Mode)
        </div>
      </div>
    );
  }

  // Show fallback on error
  if (adError || adUnfilled) {
    return (
      <div 
        className={`ad-container ad-${position} ${className}`}
        style={{ 
          maxWidth: '100%',
          margin: '0 auto',
          display: 'block'
        }}
      >
        {renderPremiumPromo()}
        <div style={{ fontSize: '10px', color: '#999', textAlign: 'center' }}>
          Sponsored Content
        </div>
      </div>
    );
  }

  // Return the AdSense container with responsive dimensions
  const dims = getDimensions();
  return (
    <div 
      ref={adRef}
      className={`ad-container ad-${position} ${className}`}
      style={{ 
        display: 'block',
        width: dims.width,
        height: 'auto', // Changed to auto height to prevent layout shift
        maxWidth: '100%',
        margin: '0 auto',
        overflow: 'hidden',
        minHeight: '50px' // Ensure at least some space
      }}
    >
      {/* AdSense ad */}
      <ins 
        className="adsbygoogle"
        style={{ 
          display: 'block',
          width: dims.width,
          height: dims.height,
          maxWidth: '100%'
        }}
        data-ad-client="ca-pub-2652838159140308"
        data-ad-slot={getAdSlot(position)}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
      
      {/* Ad label */}
      <div style={{ fontSize: '10px', color: '#999', textAlign: 'center' }}>
        Advertisement
      </div>
    </div>
  );
};

// Get the correct ad slot ID for each position
function getAdSlot(position) {
  const slots = {
    'top': '5273146000',
    'sidebar': '5273146000',
    'inContent': '2613401062',
    'footer': '5273146000'
  };
  
  return slots[position] || slots.sidebar;
}

export default AdBanner;