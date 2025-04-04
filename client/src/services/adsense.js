class AdService {
  constructor() {
    this.initialized = false;
    this.adBlocked = false;
    this.adsLoaded = false;
    this.impressions = {};
    this.publisherId = process.env.NODE_ENV === 'production' 
      ? 'ca-pub-2652838159140308' // Replace with your actual AdSense publisher ID
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
    // If already initialized or in development mode, return immediately
    if (this.initialized || process.env.NODE_ENV !== 'production' || !this.publisherId) {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      // Check if AdSense script is already loaded
      if (document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
        this.initialized = true;
        this.adsLoaded = true;
        this.processAds();
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
            this.initialized = true;
            this.adsLoaded = true;
            this.processAds();
            resolve(true);
          } else {
            console.warn('AdSense script loaded but adsbygoogle is not available');
            this.adBlocked = true;
            resolve(false);
          }
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

  // Process and push ads
  processAds() {
    if (!window.adsbygoogle) return;

    // Find all unprocessed AdSense elements
    const adElements = document.querySelectorAll('.adsbygoogle:not(.adsbygoogle-processed)');
    
    if (adElements.length === 0) return;

    try {
      // Push ads
      window.adsbygoogle.push({});

      // Mark as processed
      adElements.forEach(el => {
        el.classList.add('adsbygoogle-processed');
        
        // Ensure the ad has an ID for tracking
        if (!el.id) {
          el.id = `ad-${Math.random().toString(36).substr(2, 9)}`;
        }
      });
    } catch (error) {
      console.warn('Error processing ads:', error);
    }
  }

  // Robust implementation of trackImpression
  trackImpression(adUnitId, position) {
    // Validate inputs
    if (!adUnitId || typeof adUnitId !== 'string') {
      console.warn('Invalid adUnitId provided to trackImpression', adUnitId);
      return;
    }

    // Initialize impressions for this ad unit if it doesn't exist
    if (!this.impressions[adUnitId]) {
      this.impressions[adUnitId] = {
        count: 0,
        positions: {}
      };
    }
    
    // Increment total impressions
    this.impressions[adUnitId].count++;
    
    // Track impressions by position
    if (!this.impressions[adUnitId].positions[position]) {
      this.impressions[adUnitId].positions[position] = 0;
    }
    
    this.impressions[adUnitId].positions[position]++;
    
    // Optional: Log tracking (can be removed in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Tracked impression for ${adUnitId} at ${position}:`, this.impressions[adUnitId]);
    }
  }

  // Robust getAdCode method
  getAdCode(position, customCode = null) {
    // If ads are blocked or in development, return fallback
    if (this.adBlocked || process.env.NODE_ENV !== 'production') {
      return this.getFallbackAdHtml(position);
    }
    
    // Return the custom ad code if provided, or generic AdSense code
    return customCode || this.getGenericAdCode(position);
  }
  
  // Generate a unique ad ID
  generateAdId(position) {
    return `ad-${position}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getGenericAdCode(position) {
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
    
    // Generate a unique ad ID
    const adId = this.generateAdId(position);
    
    return `
      <ins class="adsbygoogle ${adId}"
           id="${adId}"
           ${size}
           data-ad-client="${this.publisherId}"
           data-ad-slot="${slot}"></ins>
      <script>
        (adsbygoogle = window.adsbygoogle || []).push({});
      </script>
    `;
  }

  getFallbackAdHtml(position) {
    const ad = this.fallbackAds[position] || this.fallbackAds['sidebar'];
    
    // Generate a unique ad ID for fallback ads
    const adId = this.generateAdId(position);
    
    return `
      <div id="${adId}" class="fallback-ad">
        <a href="${ad.linkUrl}" target="_blank" rel="noopener noreferrer">
          <img src="${ad.imageUrl}" alt="${ad.altText}" style="width:100%; height:auto;" />
        </a>
      </div>
    `;
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

// Automatically process ads when possible
window.addEventListener('load', () => {
  adService.processAds();
});

// Export the singleton
export default adService;