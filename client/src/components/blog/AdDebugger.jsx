// components/blog/AdDebugger.jsx
import React, { useEffect, useState } from 'react';
import adSenseService from '../../services/adsense.js';

const AdDebugger = () => {
  const [isAdSenseLoaded, setIsAdSenseLoaded] = useState(false);
  const [adBlockerDetected, setAdBlockerDetected] = useState(false);
  const [adSlots, setAdSlots] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Check if AdSense is loaded
    const checkAdSense = () => {
      const isLoaded = 
        typeof window.adsbygoogle !== 'undefined' && 
        typeof window.adsbygoogle.loaded !== 'undefined' && 
        window.adsbygoogle.loaded === true;
      
      setIsAdSenseLoaded(isLoaded);
      setAdBlockerDetected(adSenseService.isAdBlockerDetected());
      
      // Identify ad units on the page
      try {
        const adElements = document.querySelectorAll('.adsbygoogle');
        const adInfo = Array.from(adElements).map((el, index) => ({
          id: el.id || `ad-unit-${index}`,
          position: getPositionFromClasses(el.className) || 'unknown',
          adClient: el.getAttribute('data-ad-client') || 'unknown',
          adSlot: el.getAttribute('data-ad-slot') || 'unknown'
        }));
        
        setAdSlots(adInfo);
      } catch (error) {
        console.warn('Error getting ad information:', error);
      }
    };

    // Helper to determine position from class names
    const getPositionFromClasses = (className) => {
      if (className.includes('ad-top')) return 'top';
      if (className.includes('ad-sidebar')) return 'sidebar';
      if (className.includes('in-content-ad')) return 'in-content';
      if (className.includes('ad-footer')) return 'footer';
      return null;
    };

    // Initialize checks
    adSenseService.init().then(() => {
      checkAdSense();
      
      // Recheck periodically
      const interval = setInterval(checkAdSense, 2000);
      return () => clearInterval(interval);
    });
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development' || process.env.NODE_ENV !== 'production') return null;

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 max-w-md bg-white p-4 border rounded shadow-lg"
      style={{ maxHeight: expanded ? '500px' : '200px', overflow: 'auto', transition: 'max-height 0.3s ease-in-out' }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">AdSense Debug</h3>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-sm bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      
      <div className="text-sm divide-y">
        <div className="py-1">
          <p>AdSense Loaded: {isAdSenseLoaded ? '✅ Yes' : '❌ No'}</p>
          <p>Ad Blocker: {adBlockerDetected ? '🚫 Detected' : '✅ Not Detected'}</p>
        </div>
        
        {expanded && (
          <>
            <div className="py-1">
              <p className="font-semibold my-1">Ad Units on Page:</p>
              {adSlots.length === 0 ? (
                <p className="text-gray-500 italic">No ad units found</p>
              ) : (
                <ul className="list-disc list-inside">
                  {adSlots.map((ad, index) => (
                    <li key={index} className="text-xs mb-1">
                      <span className="font-mono">{ad.id}</span>: 
                      Position: {ad.position}, 
                      Client: {ad.adClient}, 
                      Slot: {ad.adSlot}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="py-1 text-xs">
              <button 
                onClick={() => adSenseService.refreshAds()}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
              >
                Refresh All Ads
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdDebugger;