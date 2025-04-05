// components/blog/AdBanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import adService from '../../services/adsense.js';

const AdBanner = ({ position, className = '' }) => {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const isDevelopment = adService.isInDevelopmentMode();
  
  // FIXED DIMENSIONS - NO FLEXIBILITY
  const fixedDimensions = {
    'top': { width: '728px', height: '90px' },
    'sidebar': { width: '300px', height: '250px' },
    'inContent': { width: '336px', height: '280px' },
    'footer': { width: '728px', height: '90px' }
  };
  
  // Get the dimensions for this position
  const dims = fixedDimensions[position] || fixedDimensions.sidebar;

  // Initialize ad service and display ad
  useEffect(() => {
    let mounted = true;
    
    const initAd = async () => {
      try {
        // Initialize the ad service first
        await adService.init();
        
        // In development mode, don't try to load real ads
        if (isDevelopment) {
          setAdLoaded(true);
          return;
        }
        
        // Force dimensions immediately after rendering
        if (adRef.current) {
          // FORCE DIMENSIONS WITH !IMPORTANT
          adRef.current.style.cssText = `
            display: block !important;
            width: ${dims.width} !important;
            height: ${dims.height} !important;
            min-width: ${dims.width} !important;
            min-height: ${dims.height} !important;
            visibility: visible !important;
            position: relative !important;
            margin: 0 auto !important;
            overflow: hidden !important;
          `;
          
          // Log that we're forcing dimensions
          console.log(`FORCING dimensions for ${position} ad:`, {
            width: dims.width,
            height: dims.height,
            element: adRef.current
          });
          
          // Delay to ensure DOM is updated
          setTimeout(() => {
            if (!mounted) return;
            
            // Initialize AdSense
            try {
              // Get the AdSense element
              const adElement = adRef.current.querySelector('.adsbygoogle');
              
              if (adElement) {
                // Force dimensions on the AdSense element too
                adElement.style.cssText = `
                  display: block !important;
                  width: ${dims.width} !important;
                  height: ${dims.height} !important;
                  min-width: ${dims.width} !important;
                  min-height: ${dims.height} !important;
                `;
                
                // Push to AdSense
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                setAdLoaded(true);
              } else {
                console.error(`AdSense element not found in ${position} container`);
                setAdError(true);
              }
            } catch (error) {
              console.error(`Error initializing AdSense for ${position}:`, error);
              setAdError(true);
            }
          }, 200);
        } else {
          console.error(`Ad container ref not found for ${position}`);
          setAdError(true);
        }
      } catch (error) {
        console.error(`Error in ad setup for ${position}:`, error);
        if (mounted) setAdError(true);
      }
    };
    
    initAd();
    
    return () => {
      mounted = false;
    };
  }, [position, isDevelopment, dims.width, dims.height]);

  // Show fallback ad in development
  if (isDevelopment) {
    return (
      <div 
        className={`ad-container ad-${position} ${className}`}
        style={{ 
          width: dims.width,
          height: dims.height,
          margin: '0 auto',
          display: 'block'
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: adService.getFallbackAdHtml(position) }} />
        <div style={{ fontSize: '10px', color: '#999', textAlign: 'center' }}>
          Advertisement (Dev)
        </div>
      </div>
    );
  }

  // Show fallback on error
  if (adError) {
    return (
      <div 
        className={`ad-container ad-${position} ${className}`}
        style={{ 
          width: dims.width,
          height: dims.height,
          margin: '0 auto',
          display: 'block'
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: adService.getFallbackAdHtml(position) }} />
        <div style={{ fontSize: '10px', color: '#999', textAlign: 'center' }}>
          Advertisement (Fallback)
        </div>
      </div>
    );
  }

  // Return the AdSense container with FIXED dimensions
  return (
    <div 
      ref={adRef}
      className={`ad-container ad-${position} ${className}`}
      style={{ 
        display: 'block',
        width: dims.width,
        height: dims.height,
        minWidth: dims.width,
        minHeight: dims.height,
        margin: '0 auto',
        position: 'relative',
        visibility: 'visible',
        overflow: 'hidden'
      }}
    >
      {/* AdSense ad with FIXED dimensions */}
      <ins 
        className="adsbygoogle"
        style={{ 
          display: 'block',
          width: dims.width,
          height: dims.height,
          minWidth: dims.width,
          minHeight: dims.height
        }}
        data-ad-client="ca-pub-2652838159140308"
        data-ad-slot={getAdSlot(position)}
        data-ad-format="rectangle"
        data-full-width-responsive="false"
      ></ins>
      
      {/* Ad label */}
      <div style={{ fontSize: '10px', color: '#999', textAlign: 'center' }}>
        Advertisement
      </div>
    </div>
  );
};

// Get the correct ad slot ID for each position
function getAdSlot(position) {
  const slots = {
    'top': '5273146000',
    'sidebar': '5273146000',
    'inContent': '2613401062',
    'footer': '5273146000'
  };
  
  return slots[position] || slots.sidebar;
}

export default AdBanner;