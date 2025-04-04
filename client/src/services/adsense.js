class AdService {
  constructor() {
    this.initialized = false;
    this.adBlocked = false;
    this.adsLoaded = false;
    this.publisherId = process.env.NODE_ENV === 'production' 
      ? 'ca-pub-2652838159140308' // Replace with your actual AdSense publisher ID
      : null;
  }

  init() {
    // If already initialized or in development mode, return immediately
    if (this.initialized || process.env.NODE_ENV !== 'production' || !this.publisherId) {
      return Promise.resolve(false);
    }

    return new Promise((resolve, reject) => {
      // Check if AdSense script is already loaded
      if (document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
        this.initialized = true;
        this.adsLoaded = true;
        resolve(true);
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.publisherId}`;
      script.async = true;
      script.crossOrigin = "anonymous";

      // Prevent multiple ad initialization
      script.setAttribute('data-ad-client', this.publisherId);

      script.onload = () => {
        try {
          // Use try-catch to handle potential push errors
          if (window.adsbygoogle) {
            // Only push if there are ads to render
            const adElements = document.querySelectorAll('.adsbygoogle:not(.adsbygoogle-processed)');
            if (adElements.length > 0) {
              window.adsbygoogle.push({});
              adElements.forEach(el => el.classList.add('adsbygoogle-processed'));
            }
          }

          this.initialized = true;
          this.adsLoaded = true;
          resolve(true);
        } catch (pushError) {
          console.warn('AdSense push error:', pushError);
          this.adBlocked = true;
          resolve(false);
        }
      };

      script.onerror = (error) => {
        console.warn('AdSense load error:', error);
        this.adBlocked = true;
        this.initialized = true;
        resolve(false);
      };

      // Append script to document
      document.head.appendChild(script);

      // Timeout to handle cases where script doesn't load
      setTimeout(() => {
        if (!this.adsLoaded) {
          console.warn('AdSense load timeout');
          this.adBlocked = true;
          this.initialized = true;
          resolve(false);
        }
      }, 8000);
    });
  }

  // Rest of the existing methods...
  getAdCode(position, customCode = null) {
    // If ads are blocked or in development, return fallback
    if (this.adBlocked || process.env.NODE_ENV !== 'production') {
      return this.getFallbackAdHtml(position);
    }
    
    // Return the custom ad code if provided, or generic AdSense code
    return customCode || this.getGenericAdCode(position);
  }
  
  getGenericAdCode(position) {
    // Existing method...
    const sizeMap = {
      'top': 'data-ad-format="auto" data-full-width-responsive="true"',
      'sidebar': 'style="display:block" data-ad-format="rectangle"',
      'in-content': 'style="display:block" data-ad-format="fluid" data-ad-layout="in-article"'
    };
    
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
         // Check for existing processed ads
         if (window.adsbygoogle) {
           const adElement = document.currentScript.previousElementSibling;
           if (!adElement.classList.contains('adsbygoogle-processed')) {
             (window.adsbygoogle = window.adsbygoogle || []).push({});
             adElement.classList.add('adsbygoogle-processed');
           }
         }
      </script>
    `;
  }

  // Existing fallback and other methods...
  getFallbackAdHtml(position) {
    const fallbackAds = {
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

    const ad = fallbackAds[position] || fallbackAds['sidebar'];
    
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