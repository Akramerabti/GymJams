// components/blog/AdInjector.jsx
import React, { useEffect, useState } from 'react';
import adService from '../../services/adsense.js';

const AdInjector = ({ content, adPlacements, readingProgress, isDarkMode, setAdViewEvents }) => {
  const [processedContent, setProcessedContent] = useState('');
  const [adIdsInjected, setAdIdsInjected] = useState([]);
  const isDevelopment = adService.isInDevelopmentMode();

  // Process content and inject ads
  useEffect(() => {
    // If we have no content or no ad placements, just return the content as-is
    if (!content || !adPlacements || adPlacements.length === 0) {
      setProcessedContent(content);
      return;
    }
    
    // Initialize ad service first
    adService.init().then(() => {
      // Filter the ad placements to only include in-content ads that are active
      const inContentAds = adPlacements
        .filter(ad => ad.position === 'in-content' && ad.isActive)
        .filter(ad => {
          // Check for minimum reading time condition
          if (ad.displayCondition?.minReadTime) {
            return readingProgress >= (ad.displayCondition.minReadTime * 20); // Rough conversion to %
          }
          return true;
        })
        .sort((a, b) => {
          // Sort by minReadTime in descending order
          const aReadTime = a.displayCondition?.minReadTime || 0;
          const bReadTime = b.displayCondition?.minReadTime || 0;
          return bReadTime - aReadTime;
        });
      
      // If no ads to insert, just return content
      if (inContentAds.length === 0) {
        setProcessedContent(content);
        return;
      }
      
      // Split content on paragraph tags to find insertion points
      let contentParts = content.split('</p>');
      
      // Use safer positions for ad insertion (avoid first and last paragraphs)
      const possiblePositions = [];
      for (let i = 2; i < contentParts.length - 1; i += 3) {
        possiblePositions.push(i);
      }
      
      // Cap the number of ads to insert at 2 or fewer
      const numAdsToInsert = Math.min(2, inContentAds.length, possiblePositions.length);
      const adIds = [];
      
      for (let i = 0; i < numAdsToInsert; i++) {
        // Generate unique ID for each in-content ad
        const adId = `adsense-in-content-${Date.now()}-${i}`;
        adIds.push(adId);
        
        // Get insertion position
        const insertPos = possiblePositions[i];
        
        // Create ad HTML - different approach for development vs production
        let adHTML;
        if (isDevelopment) {
          // In development, use fallback HTML directly
          const fallbackHtml = adService.getFallbackAdHtml('inContent');
          adHTML = `
            </p>
            <div class="ad-container in-content-ad my-6 py-4 px-4 rounded-lg text-center" id="${adId}">
              <div class="text-xs text-gray-500 mb-2">Advertisement (Dev Mode)</div>
              ${fallbackHtml}
            </div>
          `;
        } else {
          // In production, use the proper AdSense code with improved responsive settings
          adHTML = `
            </p>
            <div class="ad-container in-content-ad my-6 py-4 px-4 rounded-lg text-center" id="${adId}">
              <div class="text-xs text-gray-500 mb-2">Advertisement</div>
              <ins class="adsbygoogle"
                   style="display:block; min-width:300px; min-height:250px; width:336px; height:280px; max-width:100%; margin:0 auto;"
                   data-ad-client="ca-pub-2652838159140308"
                   data-ad-slot="2613401062"
                   data-ad-format="rectangle"
                   data-full-width-responsive="true"></ins>
            </div>
          `;
        }
        
        // Insert the ad at the calculated position
        contentParts[insertPos] = contentParts[insertPos] + adHTML;
      }
      
      // Reunite the content
      setProcessedContent(contentParts.join('</p>'));
      setAdIdsInjected(adIds);
      
      // After a brief delay to allow DOM update, initialize the ads (in production only)
      if (!isDevelopment) {
        setTimeout(() => {
          adIds.forEach(adId => {
            try {
              // Find the adElement and initialize
              const adElement = document.querySelector(`#${adId} .adsbygoogle`);
              
              if (adElement) {
                // Initialize AdSense ad
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                
                // Track as viewed for analytics
                if (setAdViewEvents) {
                  setAdViewEvents(prev => ({ ...prev, [adId]: true }));
                }
              }
            } catch (error) {
              console.warn(`Error initializing AdSense ad ${adId}:`, error);
            }
          });
        }, 500);
      } else {
        // In development, just mark ads as viewed for analytics testing
        if (setAdViewEvents) {
          adIds.forEach(adId => {
            setAdViewEvents(prev => ({ ...prev, [adId]: true }));
          });
        }
      }
    }).catch(err => {
      console.warn('Failed to initialize ad service:', err);
      setProcessedContent(content);
    });
  }, [content, adPlacements, readingProgress, isDarkMode, setAdViewEvents, isDevelopment]);
  
  // Render the content with injected ads
  return <div dangerouslySetInnerHTML={{ __html: processedContent }} />;
};

export default AdInjector;