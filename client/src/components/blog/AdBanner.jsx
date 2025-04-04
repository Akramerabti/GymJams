import React, { useEffect, useRef, useState } from 'react';
import adService, { generateAdId, getAdCode } from '../../services/adsense.js';

// Define fixed dimensions for different ad positions
const AD_DIMENSIONS = {
  'top': { width: '100%', height: '250px', minWidth: '728px' },
  'sidebar': { width: '300px', height: '250px' },
  'in-content': { width: '336px', height: '280px' }
};

const AdBanner = ({ position, adCode, className = '' }) => {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [adId] = useState(() => generateAdId(position));

  // Get fixed dimensions for the ad
  const dimensions = AD_DIMENSIONS[position] || AD_DIMENSIONS['sidebar'];

  // Initialize ads when the component mounts
  useEffect(() => {
    // Initialize ad service if not already done
    const initAds = async () => {
      try {
        await adService.init();
        
        // Ensure ad is processed with fixed dimensions
        const processAd = () => {
          const adElement = document.getElementById(adId);
          if (adElement) {
            // Force dimensions
            adElement.style.width = dimensions.width;
            adElement.style.height = dimensions.height;
            adElement.style.minWidth = dimensions.minWidth || dimensions.width;
            
            const processed = adService.processAds(adId);
            setAdLoaded(processed);
          }
        };

        // Multiple processing attempts
        window.requestAnimationFrame(processAd);
        setTimeout(processAd, 500);
        setTimeout(processAd, 1500);
      } catch (err) {
        console.warn('Ad loading error:', err);
        setAdError(true);
        setAdLoaded(false);
      }
    };
    
    initAds();
  }, [adId, dimensions]);
  
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
        width: dimensions.width,
        height: dimensions.height,
        minWidth: dimensions.minWidth || dimensions.width,
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        overflow: 'hidden'
      }}
    >
      <div 
        className="ad-content relative" 
        style={{ 
          width: '100%', 
          height: '100%' 
        }}
        dangerouslySetInnerHTML={{ __html: finalAdCode }}
      />
      <div className="text-xs text-gray-400 text-center mt-1">Advertisement</div>
    </div>
  );
};

export default AdBanner;