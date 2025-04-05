// components/blog/AdBanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import adService from '../../services/adsense.js';

const AdBanner = ({ position, className = '' }) => {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [hasAttemptedInit, setHasAttemptedInit] = useState(false);
  const isDevelopment = adService.isInDevelopmentMode();
  
  // Get dimensions based on position
  const dimensions = adService.getAdDimensions(position);

  // Function to initialize the ad
  const initializeAd = (container) => {
    if (adLoaded || hasAttemptedInit) return; // Prevent duplicate initialization
    
    setHasAttemptedInit(true);
    
    console.log(`Initializing ad for ${position} with dimensions:`, {
      width: container.offsetWidth,
      height: container.offsetHeight,
      style: container.style.cssText
    });
    
    // Find the AdSense ins element
    const adElement = container.querySelector('.adsbygoogle');
    
    if (adElement && container.offsetWidth > 0) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (error) {
        console.error('Error initializing AdSense:', error);
        setAdError(true);
      }
    } else {
      if (!adElement) {
        console.warn('AdSense element not found in container');
      }
      if (container.offsetWidth <= 0) {
        console.warn('Ad container has zero width, not displaying ad');
      }
      setAdError(true);
    }
  };

  // Initialize and display ad
  useEffect(() => {
    let mounted = true;
    let initTimeout = null;
    let observer = null;
    let resizeObserver = null;
    
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
        
        const container = adRef.current;
        
        // Set up a MutationObserver to detect when the container becomes visible
        observer = new MutationObserver((mutations) => {
          if (!mounted || adLoaded) return;
          
          for (const mutation of mutations) {
            if (mutation.type === 'attributes' && 
                (mutation.attributeName === 'class' || 
                 mutation.attributeName === 'style')) {
              
              // Check if element is now visible
              if (container.offsetWidth > 0) {
                initializeAd(container);
              }
            }
          }
        });
        
        observer.observe(container, { 
          attributes: true,
          attributeFilter: ['class', 'style']
        });
        
        // Also add a resize observer to detect dimension changes
        resizeObserver = new ResizeObserver(entries => {
          if (!mounted || adLoaded) return;
          
          for (const entry of entries) {
            if (entry.target.offsetWidth > 0) {
              initializeAd(entry.target);
            }
          }
        });
        
        resizeObserver.observe(container);
        
        // Initial check with delay based on position
        const delay = position === 'sidebar' ? 1500 : 500;
        
        initTimeout = setTimeout(() => {
          if (!mounted) return;
          
          if (container.offsetWidth > 0) {
            initializeAd(container);
          } else {
            // For sidebar ads, try one more time with a longer delay
            if (position === 'sidebar') {
              setTimeout(() => {
                if (!mounted) return;
                if (container.offsetWidth > 0) {
                  initializeAd(container);
                } else {
                  console.warn(`Ad container for ${position} still has no width after extra delay`);
                  setAdError(true);
                }
              }, 2000);
            } else {
              setAdError(true);
            }
          }
        }, delay);
        
      } catch (error) {
        console.error('Error setting up ad:', error);
        if (mounted) setAdError(true);
      }
    };
    
    initAd();
    
    return () => {
      mounted = false;
      if (initTimeout) clearTimeout(initTimeout);
      if (observer) observer.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
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
  // These are the actual ad slots from your AdSense account
  const slots = {
    'top': '5273146000',       // Your top banner ad slot
    'sidebar': '5273146000',   // Your sidebar ad slot 
    'inContent': '2613401062', // Your in-content ad slot
    'footer': '5273146000'     // Your footer ad slot
  };
  
  return slots[position] || slots.sidebar;
}

export default AdBanner;