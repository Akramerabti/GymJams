// src/components/AdDebugger.jsx
import React, { useEffect, useState } from 'react';
import adSenseService from '../../services/adsense'; // Adjust the import path as necessary

const AdDebugger = () => {
  const [adBlockerDetected, setAdBlockerDetected] = useState(false);
  const [adsenseLoaded, setAdsenseLoaded] = useState(false);

  useEffect(() => {
    const checkAdSense = async () => {
      try {
        await adSenseService.init();
        setAdsenseLoaded(!!window.adsbygoogle);
        setAdBlockerDetected(adSenseService.isAdBlockerDetected());
      } catch (error) {
        console.error('AdSense check failed', error);
      }
    };

    checkAdSense();
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 border rounded shadow-lg z-50">
      <h3 className="font-bold mb-2">AdSense Debug Info</h3>
      <p>AdSense Loaded: {adsenseLoaded ? '✅ Yes' : '❌ No'}</p>
      <p>Ad Blocker: {adBlockerDetected ? '🚫 Detected' : '✅ Not Detected'}</p>
    </div>
  );
};

export default AdDebugger;