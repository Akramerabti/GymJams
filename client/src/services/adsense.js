// services/adsense.js
class AdSenseService {
  constructor() {
    this.initialized = false;
    this.initializing = false;
    this.adBlocked = false;
    this.initPromise = null;
    this.adUnits = {
      // These should already be your actual AdSense publisher ID
      top: 'ca-pub-2652838159140308',
      sidebar: 'ca-pub-2652838159140308',
      inContent: 'ca-pub-2652838159140308'
    };
    this.scriptAdded = false;
    
    // Detect if we're in development or production environment
    this.isDevelopment = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' ||
       window.location.port === '5173' ||
       window.location.port === '3000');
  }

  // Initialize AdSense script and configuration
  init() {
    // If already initialized, return resolved promise
    if (this.initialized) {
      return Promise.resolve(true);
    }
    
    // If initialization is in progress, return the existing promise
    if (this.initializing && this.initPromise) {
      return this.initPromise;
    }
    
    this.initializing = true;
    
    // Create a new promise for initialization
    this.initPromise = new Promise((resolve) => {
      // Check if window is available (for SSR compatibility)
      if (typeof window === 'undefined') {
        this.initialized = true;
        resolve(false);
        return;
      }

      // Skip actual ad loading in development mode to avoid CORS issues
      if (this.isDevelopment) {
        console.log('Development mode: Using fallback ads instead of AdSense');
        this.initialized = true;
        resolve(true);
        return;
      }

      // Check if adsbygoogle is already defined
      if (window.adsbygoogle && window.adsbygoogle.loaded) {
        console.log('AdSense already initialized, using existing instance');
        this.initialized = true;
        resolve(true);
        return;
      }

      // Initialize adsbygoogle array if not defined
      if (!window.adsbygoogle) {
        window.adsbygoogle = [];
      }
      
      // Check if the script is already in the document
      const existingScript = document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
      if (existingScript) {
        // Script already exists, just initialize
        this.scriptAdded = true;
        this.initialized = true;
        resolve(true);
        return;
      }
      
      // Create the AdSense script if not already added
      if (!this.scriptAdded) {
        const script = document.createElement('script');
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        script.async = true;
        script.crossOrigin = "anonymous";
        script.setAttribute('data-ad-client', this.adUnits.top); // Your publisher ID
        this.scriptAdded = true;

        script.onload = () => {
          this.initialized = true;
          resolve(true);
        };

        script.onerror = (error) => {
          console.warn('Failed to load AdSense script:', error);
          this.adBlocked = true;
          this.initialized = true;
          resolve(false);
        };

        // Add the script to the page
        document.head.appendChild(script);
      }
      
      // Set a timeout in case script hangs
      setTimeout(() => {
        if (!this.initialized) {
          console.warn('AdSense initialization timed out');
          this.adBlocked = true;
          this.initialized = true;
          resolve(false);
        }
      }, 5000);
    });
    
    return this.initPromise;
  }

  // Get the HTML for an AdSense ad
  getAdHtml(position) {
    // In development mode, use fallbacks
    if (this.isDevelopment) {
      return this.getFallbackAdHtml(position);
    }
    
    // Get the appropriate ad unit size based on position
    const adSize = this.getAdSize(position);
    
    // Generate the AdSense ad code
    return `
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="${this.adUnits[position] || this.adUnits.top}"
           data-ad-slot="${this.getAdSlot(position)}"
           data-ad-format="${adSize.format || 'auto'}"
           ${adSize.width ? `data-full-width-responsive="true"` : ''}></ins>
    `;
  }

  // Helper to get appropriate ad slot based on position
  getAdSlot(position) {
    // These are your actual ad slots from AdSense dashboard
    const adSlots = {
      'top': '5273146000',       // Your top banner ad slot
      'sidebar': '5273146000',   // Your sidebar ad slot
      'inContent': '2613401062', // Your in-content ad slot
      'footer': '5273146000'     // Your footer ad slot
    };
    
    return adSlots[position] || adSlots.sidebar;
  }
  
  // Helper to determine ad size based on position
  getAdSize(position) {
    const sizes = {
      'top': { format: 'horizontal', width: '100%', height: '90px' },
      'sidebar': { format: 'rectangle', width: '300px', height: '250px' },
      'inContent': { format: 'rectangle', width: '336px', height: '280px' },
      'footer': { format: 'horizontal', width: '100%', height: '90px' }
    };
    
    return sizes[position] || sizes.sidebar;
  }
  
  // Get dimensions for a specific ad position
  getAdDimensions(position) {
    const dimensions = {
      'top': { width: '100%', height: '90px', maxWidth: '100%' },
      'sidebar': { width: '300px', height: '250px' },
      'inContent': { width: '336px', height: '280px', maxWidth: '100%' },
      'footer': { width: '100%', height: '90px', maxWidth: '100%' }
    };

    return dimensions[position] || dimensions.sidebar;
  }

  // Get fallback ad HTML if ads are blocked or in development
  getFallbackAdHtml(position) {
    const fallbackAds = {
      'top': {
        imageUrl: '/api/placeholder/728/90',
        linkUrl: '/shop?source=ad_fallback',
        altText: 'Special Offer',
        width: '728px',
        height: '90px'
      },
      'sidebar': {
        imageUrl: '/api/placeholder/300/250',
        linkUrl: '/coaching?source=ad_fallback',
        altText: 'Coaching Special',
        width: '300px',
        height: '250px'
      },
      'inContent': {
        imageUrl: '/api/placeholder/336/280',
        linkUrl: '/subscription?source=ad_fallback',
        altText: 'Premium Subscription',
        width: '336px',
        height: '280px'
      },
      'footer': {
        imageUrl: '/api/placeholder/728/90', 
        linkUrl: '/subscription?source=ad_fallback',
        altText: 'Premium Subscription',
        width: '728px',
        height: '90px'
      }
    };

    const ad = fallbackAds[position] || fallbackAds['sidebar'];
    
    return `
      <div class="fallback-ad" style="width:${ad.width}; height:${ad.height};">
        <a href="${ad.linkUrl}" target="_blank" rel="noopener noreferrer">
          <img src="${ad.imageUrl}" alt="${ad.altText}" style="width:100%; height:100%; object-fit:cover;" />
        </a>
      </div>
    `;
  }

  // Display an AdSense ad
  displayAd(domElement) {
    // Skip in development mode
    if (this.isDevelopment) {
      return true; // Pretend it worked
    }
    
    if (!this.initialized || this.adBlocked) {
      return false;
    }

    try {
      // Use AdSense's push method to display ads
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      return true;
    } catch (error) {
      console.warn('Error displaying AdSense ad:', error);
      return false;
    }
  }

  // Check if ad blocker is detected
  isAdBlockerDetected() {
    return this.adBlocked;
  }

  // Check if we're in development mode
  isInDevelopmentMode() {
    return this.isDevelopment;
  }

  // Refresh all ads on the page
  refreshAds() {
    // Skip in development mode
    if (this.isDevelopment) {
      return true;
    }
    
    if (!this.initialized || this.adBlocked) {
      return false;
    }

    try {
      // Find all AdSense ads and reinitialize them
      const adElements = document.querySelectorAll('.adsbygoogle');
      console.log(`Refreshing ${adElements.length} AdSense ads`);
      
      // Try to refresh each ad
      adElements.forEach((adElement, index) => {
        try {
          // Only refresh if it has dimensions
          if (adElement.offsetWidth > 0 && adElement.offsetHeight > 0) {
            // Create a new AdSense ad
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          } else {
            console.warn(`Skipping refresh for ad #${index} with zero dimensions`);
          }
        } catch (error) {
          console.warn(`Error refreshing ad #${index}:`, error);
        }
      });
      
      return true;
    } catch (error) {
      console.warn('Error refreshing ads:', error);
      return false;
    }
  }
}

// Create and export singleton instance
const adSenseService = new AdSenseService();
export default adSenseService;