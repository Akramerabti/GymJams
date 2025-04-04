
class AdService {
  constructor() {
    this.initialized = false;
    this.adBlocked = false;
    this.adsLoaded = false;
    this.impressions = {};
    this.viewabilityTrackers = {};
    this.publisherId = process.env.NODE_ENV === 'production' 
      ? 'ca-pub-2652838159140308' // Replace with your actual AdSense publisher ID in production
      : null;
    this.fallbackAds = {
      'sidebar': {
        imageUrl: '/images/ads/sidebar-fallback.jpg',
        linkUrl: '/shop?source=ad_fallback',
        altText: 'Special Offer'
      },
      'in-content': {
        imageUrl: '/images/ads/content-fallback.jpg',
        linkUrl: '/coaching?source=ad_fallback',
        altText: 'Coaching Special'
      },
      'top': {
        imageUrl: '/images/ads/banner-fallback.jpg',
        linkUrl: '/subscription?source=ad_fallback',
        altText: 'Premium Subscription'
      }
    };
  }

  init() {
    if (this.initialized) return Promise.resolve(true);
    
    // Skip in development mode if needed
    if (process.env.NODE_ENV !== 'production' || !this.publisherId) {
      console.log('AdSense disabled in development mode');
      this.initialized = true;
      return Promise.resolve(false);
    }
  
    return new Promise((resolve) => {
      try {
        // Check if AdSense is already loaded
        if (window.adsbygoogle) {
          this.initialized = true;
          this.adsLoaded = true;
          resolve(true);
          return;
        }
  
        // IMPORTANT: First check if the script already exists to avoid duplicates
        const existingScript = document.querySelector('script[src*="pagead2.googlesyndication.com"]');
        if (existingScript) {
          console.log('AdSense script already exists in the document');
          this.initialized = true;
          this.adsLoaded = true;
          
          // Still resolve with true even if it exists
          resolve(true);
          return;
        }
  
        // Create the AdSense script element
        const script = document.createElement('script');
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.publisherId}`;
        script.async = true;
        script.crossOrigin = "anonymous";
        
        // Add event listeners
        script.onload = () => {
          console.log('AdSense script loaded successfully');
          this.initialized = true;
          this.adsLoaded = true;
          
          // Initialize adsbygoogle if needed
          if (window.adsbygoogle) {
            try {
              window.adsbygoogle.push({});
            } catch (error) {
              console.warn('AdSense push error:', error);
            }
          }
          
          resolve(true);
        };
        
        script.onerror = (error) => {
          console.warn('AdSense load error - using fallbacks:', error);
          this.adBlocked = true;
          this.initialized = true; // Still mark as initialized
          resolve(false);
        };
        
        // Set a longer timeout (8 seconds)
        setTimeout(() => {
          if (!this.adsLoaded) {
            console.warn('AdSense load timeout - using fallbacks');
            this.adBlocked = true;
            resolve(false);
          }
        }, 8000);
        
        // Append the script to the document
        document.head.appendChild(script);
      } catch (error) {
        console.warn('AdSense initialization error:', error);
        this.adBlocked = true;
        this.initialized = true; // Still mark as initialized
        resolve(false);
      }
    });
  }

  /**
   * Get appropriate ad code based on availability
   */
  getAdCode(position, customCode = null) {
    // If ads are blocked or in development, return fallback
    if (this.adBlocked || process.env.NODE_ENV !== 'production') {
      return this.getFallbackAdHtml(position);
    }
    
    // Return the custom ad code if provided, or generic AdSense code
    return customCode || this.getGenericAdCode(position);
  }
  
  /**
   * Generate generic AdSense ad code
   */
  getGenericAdCode(position) {
    // Map positions to sizes
    const sizeMap = {
      'top': 'data-ad-format="auto" data-full-width-responsive="true"',
      'sidebar': 'style="display:block" data-ad-format="rectangle"',
      'in-content': 'style="display:block" data-ad-format="fluid" data-ad-layout="in-article"'
    };
    
    // Map positions to slot IDs (replace with actual slot IDs)
    const slotMap = {
      'top': '5273146000',
      'sidebar': '5273146000',
      'in-content': '2613401062'
    };
    
    const size = sizeMap[position] || sizeMap['sidebar'];
    const slot = slotMap[position] || slotMap['sidebar'];
    
    return `
      <ins class="adsbygoogle"
           ${size}
           data-ad-client="${this.publisherId}"
           data-ad-slot="${slot}"></ins>
      <script>
         (adsbygoogle = window.adsbygoogle || []).push({});
      </script>
    `;
  }
  
  /**
   * Get HTML for fallback ads
   */
  getFallbackAdHtml(position) {
    const ad = this.fallbackAds[position] || this.fallbackAds['sidebar'];
    
    return `
      <div class="fallback-ad">
        <a href="${ad.linkUrl}" target="_blank" rel="noopener noreferrer">
          <img src="${ad.imageUrl}" alt="${ad.altText}" style="width:100%; height:auto;" />
        </a>
      </div>
    `;
  }

  /**
   * Track ad impressions for reporting
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
    
 
  }

  /**
   * Track ad visibility
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

  isAdBlockerDetected() {
    return this.adBlocked;
  }

  getImpressionData() {
    return this.impressions;
  }
}

// Create a singleton instance
const adService = new AdService();

// Export the singleton
export default adService;