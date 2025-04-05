// components/blog/AdBanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import adSenseService from '../../services/adsense.js';

const AdBanner = ({ position, className = '' }) => {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const isDevelopment = adSenseService.isInDevelopmentMode();

  // Get dimensions based on position
  const dimensions = adSenseService.getAdDimensions(position);

  // Initialize AdSense service and display ad
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    let retryTimer = null;
    
    const setupAd = async () => {
      try {
        // Initialize the ad service first
        const initialized = await adSenseService.init();
        
        if (!mounted) return;
        
        // Mark as initialized to avoid duplicate initialization
        setHasInitialized(true);
        
        // In development mode, always show fallbacks and mark as loaded
        if (isDevelopment) {
          setAdLoaded(true);
          return;
        }
        
        if (!initialized) {
          // Ad service failed to initialize (likely blocked)
          console.log('AdSense initialization failed, using fallback if available');
          setAdError(adSenseService.isAdBlockerDetected());
          setAdLoaded(true); // Still mark as loaded to display fallback
          return;
        }
        
        // Service initialized successfully, now display the ad
        const adContainer = adRef.current;
        
        if (!adContainer) {
          // Ad container ref not found, retry if we haven't exhausted retries
          if (retryCount < 3) {
            retryTimer = setTimeout(() => {
              retryCount++;
              setupAd();
            }, 300);
          } else {
            setAdError(true);
          }
          return;
        }
        
        // AdSense requires a short delay to ensure DOM is ready
        setTimeout(() => {
          // Display the ad using AdSense's method
          const success = adSenseService.displayAd(adContainer);
          if (mounted) {
            setAdLoaded(success);
            setAdError(!success);
          }
        }, 100);
        
      } catch (error) {
        console.error('Error setting up ad:', error);
        if (mounted) {
          setAdError(true);
        }
      }
    };
    
    // Only run setup if not already initialized
    if (!hasInitialized) {
      setupAd();
    }
    
    return () => {
      mounted = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [position, hasInitialized, isDevelopment]);

  // In development mode, always show fallback content
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
          dangerouslySetInnerHTML={{ __html: adSenseService.getFallbackAdHtml(position) }}
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

  // If there was an error loading the ad, try to show a fallback
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
          dangerouslySetInnerHTML={{ __html: adSenseService.getFallbackAdHtml(position) }}
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

  return (
    <div 
      ref={adRef}
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
      {/* AdSense ad container */}
      <div 
        style={{ 
          width: '100%', 
          height: '100%',
          opacity: adLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
        dangerouslySetInnerHTML={{ __html: adSenseService.getAdHtml(position) }}
      />
      
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

export default AdBanner;