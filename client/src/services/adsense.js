// services/adsense.js
class AdSenseService {
  constructor() {
    this.initialized = false;
    this.initializing = false;
    this.adBlocked = false;
    this.initPromise = null;
    this.adUnits = {
      // Replace with your actual AdSense ad units from your AdSense dashboard
      top: 'ca-pub-2652838159140308',     // Replace with your AdSense publisher ID
      sidebar: 'ca-pub-2652838159140308',  // Replace with your AdSense publisher ID
      inContent: 'ca-pub-2652838159140308' // Replace with your AdSense publisher ID
    };
    this.scriptAdded = false;
    this.adSlots = {
      'top': '5273146000',
      'sidebar': '5273146000',
      'inContent': '2613401062',
      'footer': '5273146000'
    };
    
    // Detect if we're in development or production environment
    this.isDevelopment = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' ||
       window.location.port === '5173' ||
       window.location.port === '3000');
       
    // Track which ads were checked for visibility
    this.checkedAds = new Set();
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
        //('Development mode: Using fallback ads instead of AdSense');
        this.initialized = true;
        resolve(true);
        return;
      }

      // Check if adsbygoogle is already defined
      if (window.adsbygoogle && window.adsbygoogle.loaded) {
        //('AdSense already initialized, using existing instance');
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

  // Get the HTML for an AdSense ad with improved error handling
  getAdHtml(position, containerId = null) {
    // In development mode, use fallbacks
    if (this.isDevelopment) {
      return this.getFallbackAdHtml(position);
    }
    
    // Get the appropriate ad unit size based on position
    const adSize = this.getAdSize(position);
    const id = containerId || `ad-${position}-${Date.now()}`;
    
    // Generate the AdSense ad code
    return `
      <ins id="${id}"
           class="adsbygoogle"
           style="display:block; width:${adSize.width}; height:${adSize.height}; max-width:100%;"
           data-ad-client="${this.adUnits[position] || this.adUnits.top}"
           data-ad-slot="${this.getAdSlot(position)}"
           data-ad-format="${adSize.format || 'auto'}"
           ${adSize.width ? `data-full-width-responsive="true"` : ''}></ins>
    `;
  }

  // Helper to get appropriate ad slot based on position
  getAdSlot(position) {
    return this.adSlots[position] || this.adSlots.sidebar;
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
  getAdDimensions(position, isMobile = false) {
    const dimensions = {
      'top': { 
        width: isMobile ? '320px' : '728px', 
        height: isMobile ? '100px' : '90px',
        maxWidth: '100%' 
      },
      'sidebar': { 
        width: '300px', 
        height: '250px'
      },
      'inContent': { 
        width: isMobile ? '300px' : '336px', 
        height: isMobile ? '250px' : '280px', 
        maxWidth: '100%' 
      },
      'footer': { 
        width: isMobile ? '320px' : '728px', 
        height: isMobile ? '100px' : '90px', 
        maxWidth: '100%' 
      }
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

  // Get premium content promo HTML as a better fallback
  getPremiumPromoHtml(position) {
    const isWideFormat = ['top', 'footer'].includes(position);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const dimensions = this.getAdDimensions(position, isMobile);
    
    // Choose appropriate promo based on ad position
    const promos = {
      'top': {
        title: 'Premium Coaching',
        description: 'Transform your fitness journey with expert guidance',
        cta: 'Try Now',
        link: '/coaching'
      },
      'sidebar': {
        title: 'Join Premium',
        description: 'Get exclusive workout plans and nutrition guides',
        cta: 'Learn More',
        link: '/subscription'
      },
      'inContent': {
        title: 'Premium Equipment',
        description: 'Shop our best-selling fitness gear',
        cta: 'Shop Now',
        link: '/shop'
      },
      'footer': {
        title: 'Download Our App',
        description: 'Track workouts and nutrition on the go',
        cta: 'Get Started',
        link: '/app'
      }
    };
    
    const promo = promos[position] || promos.sidebar;
    
    // Wide format (banner style) for top and footer
    if (isWideFormat) {
      return `
        <div style="width:${dimensions.width};height:${dimensions.height};max-width:100%;overflow:hidden;display:flex;background:linear-gradient(135deg,#3b82f6,#1e40af);border-radius:8px;color:white;padding:12px;">
          <div style="display:flex;flex-direction:column;justify-content:center;flex:1;">
            <h3 style="font-size:16px;font-weight:bold;margin:0 0 4px 0;">${promo.title}</h3>
            <p style="font-size:12px;margin:0 0 8px 0;opacity:0.9;">${promo.description}</p>
            <a href="${promo.link}" style="font-size:12px;padding:4px 12px;background:white;color:#1e40af;border-radius:4px;text-decoration:none;font-weight:bold;display:inline-block;text-align:center;margin-top:auto;max-width:120px;">
              ${promo.cta}
            </a>
          </div>
          <div style="width:80px;display:flex;align-items:center;justify-content:center;">
            <div style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,0.2);position:relative;">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:20px;">💪</div>
            </div>
          </div>
        </div>
      `;
    }
    
    // Tall format (box style) for sidebar and in-content
    return `
      <div style="width:${dimensions.width};height:${dimensions.height};max-width:100%;overflow:hidden;display:flex;flex-direction:column;background:linear-gradient(135deg,#3b82f6,#1e40af);border-radius:8px;color:white;padding:16px;text-align:center;">
        <div style="font-size:24px;margin:8px 0;">💪</div>
        <h3 style="font-size:18px;font-weight:bold;margin:8px 0;">${promo.title}</h3>
        <p style="font-size:14px;margin:8px 0 16px;flex:1;">${promo.description}</p>
        <a href="${promo.link}" style="font-size:14px;padding:8px 16px;background:white;color:#1e40af;border-radius:4px;text-decoration:none;font-weight:bold;display:block;text-align:center;margin-top:auto;">
          ${promo.cta}
        </a>
      </div>
    `;
  }

  // Check if an ad is visible and filled
  checkAdVisibility(domElement, position, adId) {
    if (!domElement || this.checkedAds.has(adId)) return false;
    
    // Mark this ad as checked
    this.checkedAds.add(adId);
    
    try {
      // Get the AdSense ins element
      const adElement = domElement.querySelector('.adsbygoogle');
      if (!adElement) return false;
      
      // Check if ad has been filled
      const adStatus = adElement.getAttribute('data-ad-status');
      const hasUnfilled = adStatus === 'unfilled';
      const hasLoaded = adElement.dataset.adsbygoogleStatus === 'done' && !hasUnfilled;
      
      // If ad is unfilled, replace with premium promo
      if (hasUnfilled && domElement.parentNode) {
        //(`Ad ${adId} in position ${position} is unfilled, replacing with promo`);
        
        // Create a temporary container
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = this.getPremiumPromoHtml(position);
        
        // Replace the ad with the promo
        domElement.innerHTML = tempContainer.innerHTML;
        domElement.querySelector('ins')?.remove();
        
        // Add the sponsored label
        const sponsoredLabel = document.createElement('div');
        sponsoredLabel.style.fontSize = '10px';
        sponsoredLabel.style.color = '#999';
        sponsoredLabel.style.textAlign = 'center';
        sponsoredLabel.textContent = 'Sponsored Content';
        domElement.appendChild(sponsoredLabel);
        
        return true;
      }
      
      return hasLoaded;
    } catch (error) {
      console.warn('Error checking ad visibility:', error);
      return false;
    }
  }

  displayAd(domElement, position = 'sidebar', containerId = null) {
    // Debug information
    //('Displaying ad in:', domElement);
    //('Position:', position);
    //('Container ID:', containerId);
    
    // Skip in development mode
    if (this.isDevelopment) {
      //('Development mode detected, showing mock ad');
      return true; // Pretend it worked
    }
  
    if (!this.initialized || this.adBlocked) {
      //('Cannot display ad: AdSense not initialized or blocked');
      return false;
    }
  
    try {
      const adId = containerId || `ad-${position}-${Date.now()}`;
      //('Pushing ad to adsbygoogle with ID:', adId);
      
      // Use AdSense's push method to display ads
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      
      // Set a timeout to check if the ad was filled
      setTimeout(() => {
        const result = this.checkAdVisibility(domElement, position, adId);
        //('Ad visibility check result:', result);
      }, 2000);
      
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
      // Clear the set of checked ads
      this.checkedAds.clear();
      
      // Find all ad containers and check their status
      document.querySelectorAll('.ad-container').forEach(container => {
        const position = Array.from(container.classList)
          .find(cls => cls.startsWith('ad-'))
          ?.replace('ad-', '');
          
        if (position) {
          const adId = container.id || `ad-${position}-${Date.now()}`;
          this.checkAdVisibility(container, position, adId);
        }
      });
      
      // For AdSense, we need to recreate the ads that weren't checked yet
      document.querySelectorAll('.adsbygoogle').forEach(adElement => {
        // Only push new ads for elements that weren't checked
        const adId = adElement.id;
        if (adId && !this.checkedAds.has(adId)) {
          try {
            // Try to push a new ad to this element
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          } catch (err) {
            console.warn(`Error refreshing ad ${adId}:`, err);
          }
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