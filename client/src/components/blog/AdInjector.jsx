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
      
      // Generate unique ID for the in-content ad
      const adId = 'div-gpt-ad-GymJams_InContent';
      setAdIdsInjected([adId]);
      
      // Calculate best position for the ad (after intro paragraphs)
      const insertPos = Math.min(Math.max(2, Math.floor(contentParts.length * 0.2)), contentParts.length - 1);
      
      // Create ad HTML - different approach for development vs production
      let adHTML;
      if (isDevelopment) {
        // In development, use fallback HTML directly
        const fallbackHtml = adService.getFallbackAdHtml('in-content');
        adHTML = `
          </p>
          <div class="ad-container in-content-ad my-6 py-4 px-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} text-center">
            <div class="text-xs text-gray-500 mb-2">Advertisement (Dev Mode)</div>
            ${fallbackHtml}
          </div>
        `;
      } else {
        // In production, use the actual ad container
        adHTML = `
          </p>
          <div class="ad-container in-content-ad my-6 py-4 px-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} text-center">
            <div class="text-xs text-gray-500 mb-2">Advertisement</div>
            <div id="${adId}" style="width:336px; height:280px; max-width:100%; margin:0 auto;"></div>
          </div>
        `;
      }
      
      // Insert the ad at the calculated position
      contentParts[insertPos] = contentParts[insertPos] + adHTML;
      
      // Reunite the content
      setProcessedContent(contentParts.join('</p>'));
      
      // After a brief delay to allow DOM update, display the ad (in production only)
      if (!isDevelopment) {
        setTimeout(() => {
          adService.displayAd('in-content');
          
          // Track as viewed for analytics
          if (setAdViewEvents) {
            setAdViewEvents(prev => ({ ...prev, [adId]: true }));
          }
        }, 500);
      } else {
        // In development, just mark it as viewed for analytics testing
        if (setAdViewEvents) {
          setAdViewEvents(prev => ({ ...prev, [adId]: true }));
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