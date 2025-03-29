// AdInjector.jsx
import React, { useEffect, useState, useRef } from 'react';

const AdInjector = ({ content, adPlacements, readingProgress, isDarkMode, setAdViewEvents }) => {
  const [processedContent, setProcessedContent] = useState('');
  const [visibleAds, setVisibleAds] = useState({});
  const adRefs = useRef({});
  
  // Process content and inject ads
  useEffect(() => {
    if (!content || !adPlacements || adPlacements.length === 0) {
      setProcessedContent(content);
      return;
    }
    
    // Place ads within the content
    let result = content;
    
    // Sort adPlacements to insert from bottom to top (to avoid index shifting)
    const sortedPlacements = [...adPlacements]
      .filter(ad => ad.position === 'in-content' && ad.isActive)
      .sort((a, b) => b.displayCondition?.minReadTime - a.displayCondition?.minReadTime);
    
    // Create refs for each ad
    const newAdRefs = {};
    
    // Insert each ad at the appropriate position
    sortedPlacements.forEach((ad, index) => {
      const adId = `ad-${ad._id}`;
      newAdRefs[adId] = React.createRef();
      
      // For simplicity, we'll insert ads after paragraphs
      const paragraphs = result.split('</p>');
      
      // Calculate position based on minReadTime
      // Basic heuristic: insert after paragraph that corresponds to the minReadTime
      const targetParagraphIndex = Math.min(
        Math.floor((ad.displayCondition?.minReadTime / 5) * paragraphs.length),
        paragraphs.length - 1
      );
      
      // Insert the ad after the target paragraph
      if (paragraphs[targetParagraphIndex]) {
        const adHtml = `
          </p>
          <div class="ad-container my-6 py-4 px-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}" id="${adId}">
            <div class="text-center text-sm text-gray-500 mb-2">Advertisement</div>
            <div class="ad-content min-h-[250px] flex items-center justify-center">
              ${ad.adCode}
            </div>
          </div>
        `;
        
        paragraphs[targetParagraphIndex] += adHtml;
      }
      
      result = paragraphs.join('</p>');
    });
    
    adRefs.current = newAdRefs;
    setProcessedContent(result);
  }, [content, adPlacements, isDarkMode]);
  
  // Set up intersection observers for ad visibility tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const adId = entry.target.id;
          
          if (entry.isIntersecting && !visibleAds[adId]) {
            // Ad became visible
            setVisibleAds(prev => ({ ...prev, [adId]: true }));
            setAdViewEvents(prev => ({ ...prev, [adId]: true }));
            console.log(`Ad ${adId} is now visible`);
            
            // Here you would implement ad impression tracking
          }
        });
      },
      { threshold: 0.5 } // 50% of the ad must be visible
    );
    
    // Observe all ad containers
    Object.keys(adRefs.current).forEach(adId => {
      const el = document.getElementById(adId);
      if (el) observer.observe(el);
    });
    
    return () => {
      // Clean up observers
      Object.keys(adRefs.current).forEach(adId => {
        const el = document.getElementById(adId);
        if (el) observer.unobserve(el);
      });
    };
  }, [processedContent, visibleAds, setAdViewEvents]);
  
  return <div dangerouslySetInnerHTML={{ __html: processedContent }} />;
};

export default AdInjector;