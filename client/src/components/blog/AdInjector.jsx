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
      const adId = `adsense-in-content-${Date.now()}`;
      setAdIdsInjected([adId]);
      
      // Calculate best position for the ad (after intro paragraphs)
      const insertPos = Math.min(Math.max(2, Math.floor(contentParts.length * 0.2)), contentParts.length - 1);
      
      // Create ad HTML - different approach for development vs production
      let adHTML;
      if (isDevelopment) {
        // In development, use fallback HTML directly
        const fallbackHtml = adService.getFallbackAdHtml('inContent');
        adHTML = `
          </p>
          <div class="ad-container in-content-ad my-6 py-4 px-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} text-center">
            <div class="text-xs text-gray-500 mb-2">Advertisement (Dev Mode)</div>
            ${fallbackHtml}
          </div>
        `;
      } else {
        // In production, use the proper AdSense code
        adHTML = `
          </p>
          <div class="ad-container in-content-ad my-6 py-4 px-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} text-center" id="${adId}" style="min-width:336px; min-height:280px;">
            <div class="text-xs text-gray-500 mb-2">Advertisement</div>
            <ins class="adsbygoogle"
                 style="display:block; min-width:300px; min-height:250px; max-width:100%; margin:0 auto;"
                 data-ad-client="ca-pub-2652838159140308"
                 data-ad-slot="2613401062"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
          </div>
        `;
      }
      
      // Insert the ad at the calculated position
      contentParts[insertPos] = contentParts[insertPos] + adHTML;
      
      // Reunite the content
      setProcessedContent(contentParts.join('</p>'));
      
      // After a brief delay to allow DOM update, initialize the ad (in production only)
      if (!isDevelopment) {
        // Use a longer delay to ensure DOM is ready and any layout shifts have settled
        setTimeout(() => {
          // Using try-catch to handle potential errors
          try {
            // Find the AdSense element by ID
            const adElement = document.querySelector(`#${adId} .adsbygoogle`);
            
            if (adElement) {
              // Check if element has dimensions before initializing
              if (adElement.offsetWidth > 0 && adElement.offsetHeight > 0) {
                console.log(`In-content ad element ready with dimensions: ${adElement.offsetWidth}x${adElement.offsetHeight}`);
                
                // Initialize AdSense ad
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                
                // Track as viewed for analytics
                if (setAdViewEvents) {
                  setAdViewEvents(prev => ({ ...prev, [adId]: true }));
                }
              } else {
                // If the element has no dimensions, try again once more after a longer delay
                console.log(`In-content ad element has no dimensions yet, retrying...`);
                
                setTimeout(() => {
                  if (adElement.offsetWidth > 0 && adElement.offsetHeight > 0) {
                    console.log(`In-content ad element now has dimensions: ${adElement.offsetWidth}x${adElement.offsetHeight}`);
                    
                    // Initialize AdSense ad
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                    
                    // Track as viewed for analytics
                    if (setAdViewEvents) {
                      setAdViewEvents(prev => ({ ...prev, [adId]: true }));
                    }
                  } else {
                    console.warn(`In-content ad element still has no dimensions after retry`);
                  }
                }, 1500);
              }
            } else {
              console.warn(`AdSense element not found for ID: ${adId}`);
            }
          } catch (error) {
            console.warn('Error displaying in-content AdSense ad:', error);
          }
        }, 1000);
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