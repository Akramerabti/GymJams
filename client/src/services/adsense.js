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
      'top': 'data-ad-format="auto" data-full-width-responsive="true"',
      'sidebar': 'style="display:block; min-height: 250px;" data-ad-format="rectangle"',
      'in-content': 'style="display:block; min-height: 250px;" data-ad-format="fluid" data-ad-layout="in-article"'
    };
    
    const slotMap = {
      'top': '5273146000',
      'sidebar': '5273146000',
      'in-content': '2613401062'
    };
    
    const size = sizeMap[position] || sizeMap['sidebar'];
    const slot = slotMap[position] || slotMap['sidebar'];
    
    // Generate a unique ad ID
    const adId = AdService.generateAdId(position);
    
    return `
      <ins class="adsbygoogle ${adId}"
           id="${adId}"
           ${size}
           data-ad-client="${publisherId}"
           data-ad-slot="${slot}"></ins>
    `;
  }

  // Fallback HTML for ads
  static getFallbackAdHtml(position) {
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
    
    // Generate a unique ad ID for fallback ads
    const adId = AdService.generateAdId(position);
    
    return `
      <div id="${adId}" class="fallback-ad">
        <a href="${ad.linkUrl}" target="_blank" rel="noopener noreferrer">
          <img src="${ad.imageUrl}" alt="${ad.altText}" style="width:100%; height:auto;" />
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

  // Process ads
  processAds(adId = null) {
    if (!window.adsbygoogle) return false;

    try {
      // If a specific ad ID is provided, only process that ad
      if (adId) {
        const adElement = document.getElementById(adId);
        if (adElement && !this.processedAds.has(adId)) {
          window.adsbygoogle.push({});
          this.processedAds.add(adId);
          return true;
        }
        return false;
      }

      // Find all unprocessed AdSense elements
      const adElements = document.querySelectorAll('.adsbygoogle:not(.adsbygoogle-processed)');
      
      if (adElements.length === 0) return false;

      // Try to push ads only to visible elements with non-zero width
      const visibleAdElements = Array.from(adElements).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && 
               window.getComputedStyle(el).display !== 'none';
      });

      if (visibleAdElements.length === 0) return false;

      // Push ads and mark as processed
      window.adsbygoogle.push({});
      
      visibleAdElements.forEach(el => {
        el.classList.add('adsbygoogle-processed');
        
        // Ensure the ad has an ID for tracking
        if (!el.id) {
          el.id = `ad-${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Add to processed set
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
}

// Create a singleton instance
const adService = new AdService();

// Automatically process ads when possible
window.addEventListener('load', () => {
  adService.processAds();
});

// Export the singleton and static methods
export default adService;
export const { generateAdId, getAdCode } = AdService;