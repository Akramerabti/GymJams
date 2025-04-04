// components/blog/AdDebugger.jsx
import React, { useEffect, useState } from 'react';
import adService from '../../services/adsense.js';

const AdDebugger = () => {
  const [isGptLoaded, setIsGptLoaded] = useState(false);
  const [adBlockerDetected, setAdBlockerDetected] = useState(false);
  const [slots, setSlots] = useState([]);
  const [events, setEvents] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Check if GPT is loaded
    const checkGPT = () => {
      const isLoaded = 
        typeof window.googletag !== 'undefined' && 
        typeof window.googletag.apiReady !== 'undefined' && 
        window.googletag.apiReady === true;
      
      setIsGptLoaded(isLoaded);
      setAdBlockerDetected(adService.isAdBlockerDetected());
      
      // If GPT is loaded, get slot information
      if (isLoaded && window.googletag.pubads && window.googletag.pubads().getSlots) {
        try {
          const adSlots = window.googletag.pubads().getSlots();
          setSlots(adSlots.map(slot => ({
            id: slot.getSlotElementId(),
            path: slot.getAdUnitPath(),
            sizes: slot.getSizes().map(size => 
              typeof size === 'string' ? size : `${size.getWidth()}x${size.getHeight()}`
            ).join(', ')
          })));
        } catch (error) {
          console.warn('Error getting slot information:', error);
        }
      }
    };

    // Set up event logging
    const setupEventLogger = () => {
      if (typeof window.googletag !== 'undefined') {
        window.googletag.cmd.push(() => {
          // Log impression viewable events
          googletag.pubads().addEventListener('impressionViewable', event => {
            const slot = event.slot;
            const id = slot.getSlotElementId();
            const path = slot.getAdUnitPath();
            
            setEvents(prev => [
              { type: 'Impression Viewable', id, path, time: new Date().toLocaleTimeString() },
              ...prev.slice(0, 9) // Keep last 10 events
            ]);
          });
          
          // Log slot render ended events
          googletag.pubads().addEventListener('slotRenderEnded', event => {
            const slot = event.slot;
            const id = slot.getSlotElementId();
            const path = slot.getAdUnitPath();
            const isEmpty = event.isEmpty;
            
            setEvents(prev => [
              { 
                type: 'Slot Render Ended', 
                id, 
                path, 
                isEmpty,
                time: new Date().toLocaleTimeString() 
              },
              ...prev.slice(0, 9)
            ]);
          });
        });
      }
    };

    // Initialize checks
    adService.init().then(() => {
      checkGPT();
      setupEventLogger();
      
      // Recheck periodically
      const interval = setInterval(checkGPT, 2000);
      return () => clearInterval(interval);
    });
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 max-w-md bg-white p-4 border rounded shadow-lg"
      style={{ maxHeight: expanded ? '500px' : '200px', overflow: 'auto', transition: 'max-height 0.3s ease-in-out' }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Google Ad Manager Debug</h3>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-sm bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      
      <div className="text-sm divide-y">
        <div className="py-1">
          <p>GPT Loaded: {isGptLoaded ? '✅ Yes' : '❌ No'}</p>
          <p>Ad Blocker: {adBlockerDetected ? '🚫 Detected' : '✅ Not Detected'}</p>
        </div>
        
        {expanded && (
          <>
            <div className="py-1">
              <p className="font-semibold my-1">Ad Slots:</p>
              {slots.length === 0 ? (
                <p className="text-gray-500 italic">No ad slots defined</p>
              ) : (
                <ul className="list-disc list-inside">
                  {slots.map((slot, index) => (
                    <li key={index} className="text-xs mb-1">
                      <span className="font-mono">{slot.id}</span>: {slot.path} ({slot.sizes})
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="py-1">
              <p className="font-semibold my-1">Recent Events:</p>
              {events.length === 0 ? (
                <p className="text-gray-500 italic">No events logged</p>
              ) : (
                <ul className="list-disc list-inside">
                  {events.map((event, index) => (
                    <li key={index} className="text-xs mb-1">
                      <span className="text-gray-500">{event.time}</span>: {event.type} - {event.id}
                      {event.isEmpty !== undefined && ` (${event.isEmpty ? 'Empty' : 'Filled'})`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="py-1 text-xs">
              <button 
                onClick={() => adService.refreshAds()}
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