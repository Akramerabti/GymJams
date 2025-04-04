// components/blog/AdInjector.jsx
import React, { useEffect, useState } from 'react';
import adService from '../../services/adService';

const AdInjector = ({ content, adPlacements, readingProgress, isDarkMode, setAdViewEvents }) => {
  const [processedContent, setProcessedContent] = useState('');
  const [processedAdIds, setProcessedAdIds] = useState([]);
  
  // Process content and inject ads
  useEffect(() => {
    // If we have no content or no ad placements, just return the content as-is
    if (!content || !adPlacements || adPlacements.length === 0) {
      setProcessedContent(content);
      return;
    }
    
    // Initialize ad service first
    adService.init().then(() => {
      // First filter the ad placements by position and active status
      const inContentAds = adPlacements
        .filter(ad => ad.position === 'in-content' && ad.isActive)
        .filter(ad => {
          // Check for device compatibility (exclude if not compatible)
          if (ad.displayCondition?.deviceTypes) {
            const isMobile = window.innerWidth <= 768;
            const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
            const isDesktop = window.innerWidth > 1024;
            
            // Skip if the device isn't included
            const deviceTypes = ad.displayCondition.deviceTypes;
            if (deviceTypes.includes('all')) {
              return true;
            }
            
            if (isMobile && !deviceTypes.includes('mobile')) {
              return false;
            }
            if (isTablet && !deviceTypes.includes('tablet')) {
              return false;
            }
            if (isDesktop && !deviceTypes.includes('desktop')) {
              return false;
            }
          }
          
          // Check for minimum reading time
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
      
      // Generate unique IDs for each ad and keep track of them
      const adIds = inContentAds.map(() => adService.generateAdId('in-content'));
      setProcessedAdIds(adIds);
      
      // Split content on paragraph tags
      let contentParts = content.split('</p>');
      
      // Determine where to insert each ad
      inContentAds.forEach((ad, index) => {
        const adId = adIds[index];
        
        // Get appropriate ad code
        const adCode = adService.getAdCode('in-content', ad.adCode);
        
        // Calculate position - spread out ads evenly after the minReadTime threshold
        let insertPos = 0;
        
        if (ad.displayCondition?.minReadTime) {
          // Convert min read time to paragraph position (rough estimate)
          insertPos = Math.floor((contentParts.length * ad.displayCondition.minReadTime) / 10);
        } else {
          // Distribute evenly
          insertPos = Math.floor((index + 1) * contentParts.length / (inContentAds.length + 1));
        }
        
        // Ensure position is within valid range
        insertPos = Math.max(1, Math.min(insertPos, contentParts.length - 1));
        
        // Create ad HTML
        const adHTML = `
          </p>
          <div id="${adId}" class="ad-container in-content-ad my-6 py-4 px-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}">
            <div class="text-center text-xs text-gray-500 mb-2">Advertisement</div>
            <div class="ad-content flex items-center justify-center">
              ${adCode}
            </div>
          </div>
        `;
        
        // Insert the ad
        contentParts[insertPos] = contentParts[insertPos] + adHTML;
      });
      
      // Reunite the content
      setProcessedContent(contentParts.join('</p>'));
      
      // After a short delay (to let the DOM update), actually process the ads
      setTimeout(() => {
        adIds.forEach(adId => {
          try {
            const adElement = document.getElementById(adId);
            if (adElement) {
              adService.processAds(adId);
              
              // Track visibility for analytics
              const observer = new IntersectionObserver(
                (entries) => {
                  entries.forEach(entry => {
                    if (entry.isIntersecting) {
                      // Mark this ad as viewed
                      setAdViewEvents(prev => ({ ...prev, [adId]: true }));
                      // Track impression
                      adService.trackImpression(adId, 'in-content');
                      // Stop observing
                      observer.unobserve(entry.target);
                    }
                  });
                },
                { threshold: 0.5 } // 50% visibility
              );
              
              observer.observe(adElement);
            }
          } catch (error) {
            console.warn(`Error processing ad ${adId}:`, error);
          }
        });
      }, 500);
    }).catch(err => {
      console.warn('Failed to initialize ad service:', err);
      setProcessedContent(content);
    });
  }, [content, adPlacements, readingProgress, isDarkMode, setAdViewEvents]);
  
  // Render the content with injected ads
  return <div dangerouslySetInnerHTML={{ __html: processedContent }} />;
};

export default AdInjector;