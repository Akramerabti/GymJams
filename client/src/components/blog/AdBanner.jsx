// components/blog/AdBanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import adService from '../../services/adsense.js';

const AdBanner = ({ position, className = '' }) => {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const isDevelopment = adService.isInDevelopmentMode();
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  
  // Get dimensions based on position
  const dimensions = adService.getAdDimensions(position);

  // Initialize and display ad
  useEffect(() => {
    let mounted = true;
    let retryTimer = null;
    
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
          console.warn(`Ad container ref not found for ${position}`);
          setAdError(true);
          return;
        }
        
        // Measure and display ad
        const measureAndDisplay = () => {
          if (!mounted || !adRef.current) return;
          
          const container = adRef.current;
          const parentVisible = isElementVisible(container.parentElement);
          
          // Debug dimensions and visibility
          console.log(`Ad container dimensions for ${position}:`, {
            width: container.offsetWidth,
            height: container.offsetHeight,
            style: container.style.cssText,
            parentIsVisible: parentVisible,
            retryCount: retryCountRef.current
          });
          
          // Check if container has dimensions
          if (container.offsetWidth > 0) {
            // Find the AdSense ins element
            const adElement = container.querySelector('.adsbygoogle');
            
            if (adElement) {
              // Initialize AdSense ad
              try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                setAdLoaded(true);
                retryCountRef.current = 0; // Reset counter on success
              } catch (error) {
                console.error(`Error initializing AdSense for ${position}:`, error);
                setAdError(true);
              }
            } else {
              console.warn(`AdSense element not found in container for ${position}`);
              setAdError(true);
            }
          } else {
            console.warn(`Ad container has zero width for ${position}, retryCount: ${retryCountRef.current}`);
            
            // Retry with exponential backoff if we haven't reached max retries
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++;
              const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 5000);
              console.log(`Retrying ad initialization for ${position} in ${delay}ms...`);
              
              retryTimer = setTimeout(measureAndDisplay, delay);
            } else {
              console.warn(`Max retries reached for ${position} ad, giving up`);
              setAdError(true);
            }
          }
        };
        
        // Initial measurement after a short delay to ensure render
        setTimeout(measureAndDisplay, 300);
        
      } catch (error) {
        console.error(`Error setting up ad for ${position}:`, error);
        if (mounted) setAdError(true);
      }
    };
    
    // Helper function to check if an element is visible
    const isElementVisible = (element) => {
      if (!element) return false;
      
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0';
    };
    
    initAd();
    
    // Cleanup function
    return () => {
      mounted = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
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

  // Default ad display - use inline style to ensure dimensions
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
        position: 'relative', // Ensure position context
        visibility: 'visible', // Force visibility
      }}
    >
      {/* The AdSense ad container */}
      <ins 
        className="adsbygoogle"
        style={{ 
          display: 'block',
          width: '100%',
          height: '100%',
          minWidth: position === 'sidebar' ? '300px' : '336px',
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
  // Using your actual ad slot IDs
  const slots = {
    'top': '5273146000',       // Your actual slot ID
    'sidebar': '5273146000',   // Your actual slot ID
    'inContent': '2613401062', // Your actual slot ID
    'footer': '5273146000'     // Your actual slot ID
  };
  
  return slots[position] || slots.sidebar;
}

export default AdBanner;