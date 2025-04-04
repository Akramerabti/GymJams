// components/blog/AdBanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import adService from '../../services/adsense.js';

const AD_DIMENSIONS = {
  'top': { width: '100%', height: '90px', maxWidth: '728px' },
  'sidebar': { width: '300px', height: '250px' },
  'in-content': { width: '336px', height: '280px' },
  'footer': { width: '100%', height: '90px', maxWidth: '728px' }
};

const AdBanner = ({ position, adCode, className = '' }) => {
  const adRef = useRef(null);
  const [adId] = useState(() => adService.generateAdId(position));
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const dimensions = AD_DIMENSIONS[position] || AD_DIMENSIONS['sidebar'];
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize ad service and set up ad
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    let retryTimer = null;
    
    // Set up ad with retry mechanism
    const setupAd = async () => {
      try {
        // First, initialize the ad service
        const initialized = await adService.init();
        
        if (!mounted) return;
        
        // Mark as initialized to avoid duplicate initialization
        setHasInitialized(true);
        
        if (!initialized) {
          // AdSense was blocked or failed to initialize
          console.log('Ad service initialization failed, using fallback');
          // We'll still render the element, but with fallback content
          setAdLoaded(true);
          return;
        }
        
        // AdSense script loaded successfully, now create the ad element
        const adContainer = document.getElementById(adId);
        
        if (!adContainer) {
          // Ad container not found, retry if we haven't exhausted retries
          if (retryCount < 3) {
            retryTimer = setTimeout(() => {
              retryCount++;
              setupAd();
            }, 500);
          } else {
            setAdError(true);
          }
          return;
        }
        
        // Mark ad as loaded
        setAdLoaded(true);
        
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
  }, [adId, position, hasInitialized]);
  
  // Track ad visibility for impression tracking
  useEffect(() => {
    // Skip if ad isn't loaded or component isn't mounted
    if (!adLoaded || !adRef.current) return;
    
    let observer;
    
    // Set up intersection observer if it's available
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry && entry.isIntersecting) {
            // Track the impression once ad is visible
            adService.trackImpression(adId, position);
            // Stop observing after first impression
            observer.disconnect();
          }
        },
        { threshold: 0.5 } // 50% visibility required to count an impression
      );
      
      // Start observing the ad container
      observer.observe(adRef.current);
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      adService.trackImpression(adId, position);
    }
    
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [adLoaded, adId, position]);
  
  // Prepare the ad content
  const adContent = adService.getAdCode(position, adCode);
  
  // If there was an error loading the ad, render nothing
  if (adError) {
    return null;
  }
  
  return (
    <div 
      ref={adRef}
      id={adId}
      className={`ad-container ad-${position} ${className}`}
      style={{ 
        width: dimensions.width,
        height: dimensions.height,
        maxWidth: dimensions.maxWidth || '100%',
        margin: '0 auto',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div 
        className="ad-content"
        style={{ 
          width: '100%', 
          height: '100%',
          opacity: adLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
        dangerouslySetInnerHTML={{ __html: adContent }}
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