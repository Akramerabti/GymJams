// components/blog/AdBanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import adService from '../../services/adsense.js';

const AdBanner = ({ position, className = '' }) => {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const isDevelopment = adService.isInDevelopmentMode();
  
  // Get dimensions based on position
  const dimensions = adService.getAdDimensions(position);

  // Initialize and display ad
  useEffect(() => {
    let mounted = true;
    
    const initAd = async () => {
      try {
        // Initialize the ad service first
        await adService.init();
        
        // In development mode, always show fallbacks
        if (isDevelopment) {
          setAdLoaded(true);
          return;
        }
        
        // Check if the adRef exists and is in the DOM
        if (!adRef.current) {
          console.warn('Ad container ref not found');
          setAdError(true);
          return;
        }
        
        // Wait for next render cycle to ensure dimensions are applied
        setTimeout(() => {
          if (!mounted) return;
          
          const container = adRef.current;
          
          // Debug dimensions
          console.log(`Ad container dimensions for ${position}:`, {
            width: container.offsetWidth,
            height: container.offsetHeight,
            style: container.style.cssText
          });
          
          // Only initialize if the container has dimensions
          if (container.offsetWidth > 0) {
            // Find the AdSense ins element in this container
            const adElement = container.querySelector('.adsbygoogle');
            
            if (adElement) {
              // Push to AdSense for initialization
              try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                setAdLoaded(true);
              } catch (error) {
                console.error('Error initializing AdSense:', error);
                setAdError(true);
              }
            } else {
              console.warn('AdSense element not found in container');
              setAdError(true);
            }
          } else {
            console.warn('Ad container has zero width, not displaying ad');
            setAdError(true);
          }
        }, 500);
        
      } catch (error) {
        console.error('Error setting up ad:', error);
        if (mounted) setAdError(true);
      }
    };
    
    initAd();
    
    return () => {
      mounted = false;
    };
  }, [position, isDevelopment]);

  // In development mode, show fallback
  if (isDevelopment) {
    return (
      <div 
        className={`ad-container ad-${position} ${className}`}
        style={{ 
          width: dimensions.width,
          height: dimensions.height,
          maxWidth: dimensions.maxWidth || 'none',
          margin: '0 auto',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div 
          style={{ width: '100%', height: '100%' }}
          dangerouslySetInnerHTML={{ __html: adService.getFallbackAdHtml(position) }}
        />
        <div 
          className="ad-label"
          style={{
            fontSize: '10px',
            lineHeight: '1',
            color: '#999',
            textAlign: 'center',
            marginTop: '2px',
          }}
        >
          Advertisement (Dev Mode)
        </div>
      </div>
    );
  }

  // If there was an error, show fallback
  if (adError) {
    return (
      <div 
        className={`ad-container ad-${position} ${className}`}
        style={{ 
          width: dimensions.width,
          height: dimensions.height,
          maxWidth: dimensions.maxWidth || 'none',
          margin: '0 auto',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{ width: '100%', height: '100%' }}
          dangerouslySetInnerHTML={{ __html: adService.getFallbackAdHtml(position) }}
        />
        <div 
          className="ad-label"
          style={{
            fontSize: '10px',
            lineHeight: '1',
            color: '#999',
            textAlign: 'center',
            marginTop: '2px',
          }}
        >
          Advertisement (Fallback)
        </div>
      </div>
    );
  }

  // Default ad display
  return (
    <div 
      ref={adRef}
      className={`ad-container ad-${position} ${className}`}
      style={{ 
        width: dimensions.width,
        height: dimensions.height,
        minWidth: position === 'sidebar' ? '300px' : '336px',
        minHeight: position === 'sidebar' ? '250px' : '280px',
        maxWidth: dimensions.maxWidth || 'none',
        margin: '0 auto',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* The AdSense ad container */}
      <ins 
        className="adsbygoogle"
        style={{ 
          display: 'block',
          width: '100%',
          height: '100%',
          minHeight: position === 'sidebar' ? '250px' : '280px',
          opacity: adLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
        data-ad-client="ca-pub-2652838159140308"
        data-ad-slot={getAdSlot(position)}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
      
      {/* Advertisement label */}
      <div 
        className="ad-label"
        style={{
          fontSize: '10px',
          lineHeight: '1',
          color: '#999',
          textAlign: 'center',
          marginTop: '2px',
        }}
      >
        Advertisement
      </div>
    </div>
  );
};

// Helper function to get ad slot based on position
function getAdSlot(position) {
  // Replace these with your actual ad slots from your AdSense account
  const slots = {
    'top': '5273146000',       // Replace with your actual slot ID
    'sidebar': '5273146000',   // Replace with your actual slot ID
    'inContent': '2613401062', // Replace with your actual slot ID
    'footer': '5273146000'     // Replace with your actual slot ID
  };
  
  return slots[position] || slots.sidebar;
}

export default AdBanner;