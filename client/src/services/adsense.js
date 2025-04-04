class AdService {
  constructor() {
    this.initialized = false;
    this.adBlocked = false;
    this.adsLoaded = false;
    this.processedAds = new Set();
    this.publisherId = process.env.NODE_ENV === 'production' 
      ? 'ca-pub-2652838159140308' 
      : null;
  }

  // Static method to generate ad ID
  static generateAdId(position) {
    return `ad-${position}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Static method for getting ad code
  static getAdCode(position, customCode = null, publisherId = 'ca-pub-2652838159140308') {
    // Development or ad-blocked mode fallback
    if (process.env.NODE_ENV !== 'production' || !publisherId) {
      return AdService.getFallbackAdHtml(position);
    }
    
    const sizeMap = {
      'top': {
        format: 'data-ad-format="auto" data-full-width-responsive="true"',
        slot: '5273146000'
      },
      'sidebar': {
        format: 'style="display:block; width:300px; height:250px;" data-ad-format="rectangle"',
        slot: '5273146000'
      },
      'in-content': {
        format: 'style="display:block; width:336px; height:280px;" data-ad-format="fluid" data-ad-layout="in-article"',
        slot: '2613401062'
      }
    };
    
    const adConfig = sizeMap[position] || sizeMap['sidebar'];
    
    // Generate a unique ad ID
    const adId = AdService.generateAdId(position);
    
    return `
      <ins class="adsbygoogle ${adId}"
           id="${adId}"
           ${adConfig.format}
           data-ad-client="${publisherId}"
           data-ad-slot="${adConfig.slot}"></ins>
      <script>
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      </script>
    `;
  }

  // Fallback HTML for ads
  static getFallbackAdHtml(position) {
    const fallbackAds = {
      'sidebar': {
        imageUrl: '/images/ads/sidebar-fallback.jpg',
        linkUrl: '/shop?source=ad_fallback',
        altText: 'Special Offer',
        width: '300px',
        height: '250px'
      },
      'in-content': {
        imageUrl: '/images/ads/content-fallback.jpg',
        linkUrl: '/coaching?source=ad_fallback',
        altText: 'Coaching Special',
        width: '336px',
        height: '280px'
      },
      'top': {
        imageUrl: '/images/ads/banner-fallback.jpg',
        linkUrl: '/subscription?source=ad_fallback',
        altText: 'Premium Subscription',
        width: '100%',
        height: '250px'
      }
    };

    const ad = fallbackAds[position] || fallbackAds['sidebar'];
    
    // Generate a unique ad ID for fallback ads
    const adId = AdService.generateAdId(position);
    
    return `
      <div id="${adId}" class="fallback-ad" style="width:${ad.width}; height:${ad.height};">
        <a href="${ad.linkUrl}" target="_blank" rel="noopener noreferrer">
          <img src="${ad.imageUrl}" alt="${ad.altText}" style="width:100%; height:100%; object-fit:cover;" />
        </a>
      </div>
    `;
  }

  // Initialize AdSense
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
        resolve(true);
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.publisherId}`;
      script.async = true;
      script.crossOrigin = "anonymous";

      script.onload = () => {
        try {
          if (window.adsbygoogle) {
            this.initialized = true;
            this.adsLoaded = true;
            resolve(true);
          } else {
            console.warn('AdSense script loaded but adsbygoogle is not available');
            this.adBlocked = true;
            resolve(false);
          }
        } catch (pushError) {
          console.warn('AdSense initialization error:', pushError);
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

  processAds(adId = null) {
    if (!window.adsbygoogle) {
      console.warn('adsbygoogle not available');
      return false;
    }

    try {
      // If a specific ad ID is provided
      if (adId) {
        const adElement = document.getElementById(adId);
        if (!adElement) {
          console.warn(`Ad element not found: ${adId}`);
          return false;
        }

        // Skip if already processed
        if (this.processedAds.has(adId)) {
          return true;
        }

        // Ensure element is visible and has dimensions
        const rect = adElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          console.warn(`Ad element has zero dimensions: ${adId}`);
          return false;
        }

        // Process the ad
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        this.processedAds.add(adId);
        return true;
      }

      // Process all unprocessed ads
      const adElements = Array.from(document.querySelectorAll('.adsbygoogle:not(.adsbygoogle-processed)'));
      
      if (adElements.length === 0) return false;

      // Filter out elements with zero dimensions
      const validAds = adElements.filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      if (validAds.length === 0) return false;

      // Process valid ads
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      
      validAds.forEach(el => {
        if (!el.id) {
          el.id = `ad-${Math.random().toString(36).substr(2, 9)}`;
        }
        el.classList.add('adsbygoogle-processed');
        this.processedAds.add(el.id);
      });

      return true;
    } catch (error) {
      console.warn('Error processing ads:', error);
      return false;
    }
  }

  // Track impressions
  trackImpression(adUnitId, position) {
    if (!adUnitId || typeof adUnitId !== 'string') {
      console.warn('Invalid adUnitId provided to trackImpression', adUnitId);
      return;
    }

    // Optional logging in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Tracked impression for ${adUnitId} at ${position}`);
    }
  }

  // Detect ad blocker (for debugging)
  isAdBlockerDetected() {
    return this.adBlocked;
  }
}

// Create a singleton instance
const adService = new AdService();

// Automatically process ads when possible
window.addEventListener('load', () => {
  adService.processAds();
});

// Export the singleton and static methods
export default adService;
export const { generateAdId, getAdCode, isAdBlockerDetected } = AdService;