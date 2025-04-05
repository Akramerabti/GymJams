// components/blog/AdBanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import adService from '../../services/adsense.js';

const AdBanner = ({ position, className = '' }) => {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
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

  // Show fallback ad in development
  if (isDevelopment) {
    const dims = getDimensions();
    return (
      <div 
        className={`ad-container ad-${position} ${className}`}
        style={{ 
          width: dims.width,
          height: dims.height,
          maxWidth: '100%',
          margin: '0 auto',
          display: 'block'
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: adService.getFallbackAdHtml(position) }} />
        <div style={{ fontSize: '10px', color: '#999', textAlign: 'center' }}>
          Advertisement (Dev)
        </div>
      </div>
    );
  }

  // Show fallback on error
  if (adError) {
    const dims = getDimensions();
    return (
      <div 
        className={`ad-container ad-${position} ${className}`}
        style={{ 
          width: dims.width,
          height: dims.height,
          maxWidth: '100%',
          margin: '0 auto',
          display: 'block'
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: adService.getFallbackAdHtml(position) }} />
        <div style={{ fontSize: '10px', color: '#999', textAlign: 'center' }}>
          Advertisement (Fallback)
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
        height: dims.height,
        maxWidth: '100%',
        margin: '0 auto',
        overflow: 'hidden'
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