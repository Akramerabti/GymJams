import React, { useEffect, useRef, useState } from 'react';
import adService, { generateAdId, getAdCode } from '../../services/adsense.js';

const AdBanner = ({ position, adCode, className = '' }) => {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [adId] = useState(() => generateAdId(position));
  const [containerWidth, setContainerWidth] = useState('100%');

  // Ensure container has a width and track size changes
  useEffect(() => {
    const updateWidth = () => {
      if (adRef.current) {
        const width = adRef.current.getBoundingClientRect().width;
        setContainerWidth(width > 0 ? `${width}px` : '100%');
      }
    };

    // Initial width check
    updateWidth();

    // Resize observer to track width changes
    const resizeObserver = new ResizeObserver(updateWidth);
    if (adRef.current) {
      resizeObserver.observe(adRef.current);
    }

    return () => {
      if (adRef.current) {
        resizeObserver.unobserve(adRef.current);
      }
    };
  }, []);

  // Initialize ads when the component mounts
  useEffect(() => {
    // Initialize ad service if not already done
    const initAds = async () => {
      try {
        await adService.init();
        
        // Defer ad processing to ensure DOM is ready and has width
        const processAd = () => {
          // Only process if container has a width
          const adElement = document.getElementById(adId);
          if (adElement) {
            const rect = adElement.getBoundingClientRect();
            if (rect.width > 0) {
              const processed = adService.processAds(adId);
              setAdLoaded(processed);
            } else {
              // Retry processing with a delay
              setTimeout(() => {
                const retryProcessed = adService.processAds(adId);
                setAdLoaded(retryProcessed);
              }, 2000);
            }
          }
        };

        // Use multiple techniques to ensure processing
        window.requestAnimationFrame(processAd);
        setTimeout(processAd, 1000);
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
        width: containerWidth,
        minWidth: '300px',
        minHeight: '250px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        overflow: 'hidden'
      }}
    >
      <div 
        className="ad-content relative w-full" 
        style={{ width: '100%' }}
        dangerouslySetInnerHTML={{ __html: finalAdCode }}
      />
    </div>
  );
};

export default AdBanner;