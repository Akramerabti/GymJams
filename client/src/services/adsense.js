const ADSENSE_PUBLISHER_ID = 'pub-2652838159140308';

class AdSenseService {
  constructor() {
    this.initialized = false;
    this.adBlocked = false;
    this.adsLoaded = false;
    this.impressions = {};
    this.viewabilityTrackers = {};
  }

  /**
   * Initialize AdSense script
   * Should be called once when the application loads
   */
  init() {
    // Skip if already initialized
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      try {
        // Check if AdSense is already loaded
        if (window.adsbygoogle) {
          this.initialized = true;
          this.adsLoaded = true;
          resolve(true);
          return;
        }

        // Create the AdSense script element
        const script = document.createElement('script');
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        
        // Add event listeners
        script.onload = () => {
          this.initialized = true;
          this.adsLoaded = true;
          
          // Detect ad blocking - look for window.adsbygoogle
          if (!window.adsbygoogle) {
            this.adBlocked = true;
            console.warn('AdSense appears to be blocked by an ad blocker');
          }
          
          resolve(true);
        };
        
        script.onerror = (error) => {
          this.adBlocked = true;
          console.error('Failed to load AdSense script:', error);
          reject(error);
        };
        
        // Append the script to the document
        document.head.appendChild(script);
        
        // Set initialized flag
        this.initialized = true;
      } catch (error) {
        console.error('Error initializing AdSense:', error);
        reject(error);
      }
    });
  }

  /**
   * Track ad impressions for reporting
   * @param {string} adUnitId - The ad unit ID
   * @param {string} position - The position of the ad (e.g., 'top', 'sidebar')
   */
  trackImpression(adUnitId, position) {
    if (!this.impressions[adUnitId]) {
      this.impressions[adUnitId] = {
        count: 0,
        positions: {}
      };
    }
    
    this.impressions[adUnitId].count++;
    
    if (!this.impressions[adUnitId].positions[position]) {
      this.impressions[adUnitId].positions[position] = 0;
    }
    
    this.impressions[adUnitId].positions[position]++;
    
    // Optional: Send impression data to your analytics server
    this.sendImpressionToAnalytics(adUnitId, position);
  }

  /**
   * Track when ads become viewable
   * @param {string} adElementId - The DOM element ID of the ad container
   * @param {string} adUnitId - The ad unit ID
   * @param {string} position - The position of the ad
   */
  trackViewability(adElementId, adUnitId, position) {
    // Skip if browser doesn't support IntersectionObserver
    if (!('IntersectionObserver' in window)) return;
    
    // Skip if already tracking this element
    if (this.viewabilityTrackers[adElementId]) return;
    
    const element = document.getElementById(adElementId);
    if (!element) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Ad is viewable
            this.trackImpression(adUnitId, position);
            
            // Stop observing once tracked
            observer.unobserve(element);
            delete this.viewabilityTrackers[adElementId];
          }
        });
      },
      { threshold: 0.5 } // Ad is considered viewable when 50% is visible
    );
    
    // Start observing the element
    observer.observe(element);
    
    // Store the observer reference
    this.viewabilityTrackers[adElementId] = observer;
  }


  sendImpressionToAnalytics(adUnitId, position) {
    // In a real implementation, you would send this data to your analytics server
    // This is just a mock implementation
    console.log(`Ad impression tracked: ${adUnitId} at position ${position}`);
    
    // Example of sending data to your server:
    /*
    fetch('/api/analytics/ad-impression', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adUnitId,
        position,
        timestamp: new Date().toISOString(),
        page: window.location.pathname
      })
    }).catch(error => {
      console.error('Failed to send impression data:', error);
    });
    */
  }

  isAdBlockerDetected() {
    return this.adBlocked;
  }

  getImpressionData() {
    return this.impressions;
  }

  showAdBlockerMessage(containerId) {
    if (!this.adBlocked) return;
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
      <div class="ad-blocker-message">
        <h3>Ad Blocker Detected</h3>
        <p>We notice you're using an ad blocker. We rely on advertising to help fund our site.</p>
        <p>Please consider supporting us by disabling your ad blocker for this site.</p>
      </div>
    `;
  }
}

export default new AdSenseService();