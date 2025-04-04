import React, { useEffect, useRef, useState } from 'react';
import adService, { generateAdId, getAdCode } from '../../services/adsense.js';

const AdBanner = ({ position, adCode, className = '' }) => {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [adId] = useState(() => generateAdId(position));

  // Initialize ads when the component mounts
  useEffect(() => {
    // Initialize ad service if not already done
    const initAds = async () => {
      try {
        await adService.init();
        
        // Defer ad processing to ensure DOM is ready
        const processAd = () => {
          const processed = adService.processAds(adId);
          setAdLoaded(processed);
          
          // If not processed, try again after a short delay
          if (!processed) {
            setTimeout(() => {
              const retryProcessed = adService.processAds(adId);
              setAdLoaded(retryProcessed);
            }, 1000);
          }
        };

        // Use requestAnimationFrame to process after render
        window.requestAnimationFrame(processAd);
      } catch (err) {
        console.warn('Ad loading error:', err);
        setAdError(true);
        setAdLoaded(false);
      }
    };
    
    initAds();
  }, [adId]);
  
  // Handle visibility tracking for ads
  useEffect(() => {
    const adElement = adRef.current;
    if (!adElement || !adLoaded) return;
    
    // Track viewability and impressions
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Track impression for this specific ad
            try {
              // Only track if ad is visible and has sufficient width
              const rect = entry.boundingClientRect;
              if (rect.width > 0 && rect.height > 0) {
                adService.trackImpression(adId, position);
              }
            } catch (error) {
              console.error('Impression tracking error:', error);
            }
            
            // Stop observing once seen
            observer.unobserve(adElement);
          }
        });
      }, 
      { threshold: 0.5 } // 50% of the ad must be visible
    );
    
    observer.observe(adElement);
    
    return () => {
      if (adElement) observer.unobserve(adElement);
    };
  }, [adLoaded, position, adId]);
  
  // Don't render anything if there's an error loading the ad service
  if (adError) {
    return null;
  }
  
  // Get the appropriate ad code using the exported static method
  const finalAdCode = getAdCode(position, adCode);
  
  return (
    <div 
      ref={adRef}
      id={adId}
      className={`ad-container ad-${position} ${className}`}
      data-ad-position={position}
      style={{ 
        minHeight: '250px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}
    >
      <div 
        className="ad-content relative w-full" 
        dangerouslySetInnerHTML={{ __html: finalAdCode }}
      />
      <div className="text-xs text-gray-400 text-center mt-1">Advertisement</div>
    </div>
  );
};

export default AdBanner;