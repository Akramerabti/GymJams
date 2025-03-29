// AdBanner.jsx
import React, { useEffect, useRef, useState } from 'react';

const AdBanner = ({ position, adCode, className = '' }) => {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  
  // Initialize ads when the component mounts
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;
    
    // Initialize Google Ad Manager if it doesn't exist
    if (!window.googletag) {
      window.googletag = window.googletag || {};
      window.googletag.cmd = window.googletag.cmd || [];
    }
    
    try {
      // Attempt to render the ad
      window.googletag.cmd.push(function() {
        // Signal that the ad container is ready
        setAdLoaded(true);
      });
    } catch (err) {
      console.error('Ad loading error:', err);
      setAdError(true);
    }
    
    // Clean up
    return () => {
      // Cleanup would go here if needed
    };
  }, []);
  
  // Handle visibility tracking for ads
  useEffect(() => {
    const adElement = adRef.current;
    if (!adElement) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Ad is visible, log impression
            console.log(`Ad in position ${position} is now visible`);
            // Here you would implement impression tracking logic
            
            // Stop observing once it's been seen
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
  }, [adLoaded, position]);
  
  if (adError) {
    return null; // Don't show anything if ad fails
  }
  
  return (
    <div 
      ref={adRef}
      className={`ad-container ad-${position} ${className}`}
      data-ad-position={position}
    >
      <div 
        className="ad-content" 
        dangerouslySetInnerHTML={{ __html: adCode }}
      />
      <div className="text-xs text-gray-400 text-center mt-1">Advertisement</div>
    </div>
  );
};

export default AdBanner;
