import React, { useEffect, useRef, useState } from 'react';
import adService, { generateAdId, getAdCode } from '../../services/adsense.js';

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
  const [retryCount, setRetryCount] = useState(0);
  const dimensions = AD_DIMENSIONS[position] || AD_DIMENSIONS['sidebar'];

  // Initialize ads when the component mounts
  useEffect(() => {
    let mounted = true;
    let retryTimer;
    
    const initAds = async () => {
      try {
        await adService.init();
        
        const processAd = () => {
          if (!mounted) return;
          
          const adElement = document.getElementById(adId);
          if (!adElement) {
            if (retryCount < 3) {
              retryTimer = setTimeout(() => {
                setRetryCount(prev => prev + 1);
                processAd();
              }, 500);
            }
            return;
          }
          
          // Ensure element is visible and has dimensions
          adElement.style.display = 'block';
          adElement.style.width = dimensions.width;
          adElement.style.height = dimensions.height;
          adElement.style.minWidth = dimensions.minWidth || dimensions.width;
          
          // Check if element is in viewport
          const rect = adElement.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const processed = adService.processAds(adId);
            if (processed) {
              setAdLoaded(true);
            } else if (retryCount < 3) {
              retryTimer = setTimeout(() => {
                setRetryCount(prev => prev + 1);
                processAd();
              }, 500);
            }
          }
        };

        // Initial processing attempt
        processAd();
      } catch (err) {
        if (mounted) {
          console.warn('Ad loading error:', err);
          setAdError(true);
          setAdLoaded(false);
        }
      }
    };
    
    initAds();
    
    return () => {
      mounted = false;
      clearTimeout(retryTimer);
    };
  }, [adId, dimensions, retryCount]);
  
  // Handle visibility tracking for ads
  useEffect(() => {
    if (!adLoaded) return;
    
    const adElement = adRef.current;
    if (!adElement) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            adService.trackImpression(adId, position);
            observer.unobserve(adElement);
          }
        });
      }, 
      { threshold: 0.5 }
    );
    
    observer.observe(adElement);
    
    return () => {
      if (adElement) observer.unobserve(adElement);
    };
  }, [adLoaded, position, adId]);
  
  if (adError) {
    return null;
  }
  
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
        overflow: 'hidden',
        visibility: adLoaded ? 'visible' : 'hidden'
      }}
    >
      <div 
        className="ad-content relative" 
        style={{ width: '100%', height: '100%' }}
        dangerouslySetInnerHTML={{ __html: finalAdCode }}
      />
      <div className="text-xs text-gray-400 text-center mt-1">Advertisement</div>
    </div>
  );
};

export default AdBanner;