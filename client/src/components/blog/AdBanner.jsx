import React, { useEffect, useRef, useState } from 'react';
import adService from '../../services/adsense.js';

const AdBanner = ({ position, adCode, className = '' }) => {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [adId] = useState(() => adService.generateAdId(position));

  // Initialize ads when the component mounts
  useEffect(() => {
    // Initialize ad service if not already done
    const initAds = async () => {
      try {
        await adService.init();
        setAdLoaded(true);
      } catch (err) {
        console.warn('Ad loading error:', err);
        setAdError(true);
        // Still mark as loaded so we can show fallbacks
        setAdLoaded(true);
      }
    };
    
    initAds();
  }, []);
  
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
              adService.trackImpression(adId, position);
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
  if (adError && !adService.adBlocked) {
    return null;
  }
  
  // Get the appropriate ad code
  const finalAdCode = adService.getAdCode(position, adCode);
  
  return (
    <div 
      ref={adRef}
      id={adId}
      className={`ad-container ad-${position} ${className}`}
      data-ad-position={position}
    >
      <div 
        className="ad-content relative" 
        dangerouslySetInnerHTML={{ __html: finalAdCode }}
      />
      <div className="text-xs text-gray-400 text-center mt-1">Advertisement</div>
    </div>
  );
};

export default AdBanner;