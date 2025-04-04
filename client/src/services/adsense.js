// services/adService.js
class AdService {
  constructor() {
    this.initialized = false;
    this.initializing = false;
    this.adBlocked = false;
    this.adsLoaded = false;
    this.processedAds = new Set();
    
    // Use a real publisher ID for production
    this.publisherId = process.env.NODE_ENV === 'production' 
      ? 'ca-pub-2652838159140308' 
      : 'ca-pub-2652838159140308'; // Use same ID for development to test properly
    
    // Keep track of initialization promise
    this.initPromise = null;
  }

  // Initialize AdSense (returns a promise that resolves when ready)
  init() {
    // If already initialized, return resolved promise
    if (this.initialized) {
      return Promise.resolve(this.adsLoaded);
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
        this.adsLoaded = false;
        resolve(false);
        return;
      }

      // Check if AdSense is already blocked by an ad blocker
      if (window.canRunAds === false) {
        console.warn('Ad blocker detected');
        this.adBlocked = true;
        this.initialized = true;
        resolve(false);
        return;
      }
      
      // Check if AdSense script is already loaded
      if (window.adsbygoogle) {
        console.log('AdSense already loaded');
        this.initialized = true;
        this.adsLoaded = true;
        resolve(true);
        return;
      }

      // Use a small test to detect ad blockers before loading the script
      const testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox';
      testAd.style.position = 'absolute';
      testAd.style.fontSize = '0px';
      testAd.style.height = '1px';
      testAd.style.width = '1px';
      testAd.style.top = '-10px';
      testAd.style.left = '-10px';
      document.body.appendChild(testAd);

      // Check if ad blocker removed the test element
      setTimeout(() => {
        const isBlocked = testAd.offsetHeight === 0;
        document.body.removeChild(testAd);
        
        if (isBlocked) {
          console.warn('Ad blocker detected via test div');
          this.adBlocked = true;
          this.initialized = true;
          resolve(false);
          return;
        }
        
        // Proceed with loading the AdSense script
        this.loadAdSenseScript(resolve);
      }, 100);
    });
    
    return this.initPromise;
  }
  
  // Load the AdSense script
  loadAdSenseScript(resolve) {
    // Don't proceed if we don't have a publisher ID
    if (!this.publisherId) {
      console.warn('No AdSense publisher ID provided');
      this.initialized = true;
      resolve(false);
      return;
    }
    
    // Create script element
    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.publisherId}`;
    script.async = true;
    script.crossOrigin = "anonymous";

    // Handle successful script load
    script.onload = () => {
      // Make sure adsbygoogle is defined
      if (window.adsbygoogle) {
        console.log('AdSense script loaded successfully');
        
        // Push adsbygoogle command to confirm it's working
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          this.initialized = true;
          this.adsLoaded = true;
          resolve(true);
        } catch (pushError) {
          console.warn('AdSense initialization error:', pushError);
          this.adBlocked = true;
          this.initialized = true;
          resolve(false);
        }
      } else {
        console.warn('AdSense script loaded but adsbygoogle is not available');
        this.adBlocked = true;
        this.initialized = true;
        resolve(false);
      }
    };

    // Handle script load failure
    script.onerror = (error) => {
      console.warn('AdSense load error:', error);
      this.adBlocked = true;
      this.initialized = true;
      resolve(false);
    };

    // Add script to document
    document.head.appendChild(script);

    // Timeout to handle cases where script doesn't load or initialize
    setTimeout(() => {
      if (!this.initialized) {
        console.warn('AdSense load timeout');
        this.adBlocked = true;
        this.initialized = true;
        resolve(false);
      }
    }, 5000);
  }

  // Get ad code suitable for the position
  getAdCode(position, customCode = null) {
    // If ad blocking is detected or we're in development, use fallback
    if (this.adBlocked || process.env.NODE_ENV !== 'production') {
      return this.getFallbackAdHtml(position);
    }
    
    // If custom code is provided, use it
    if (customCode) {
      return customCode;
    }
    
    // Otherwise, generate standard ad code
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
      },
      'footer': {
        format: 'data-ad-format="auto" data-full-width-responsive="true"',
        slot: '5273146000'
      }
    };
    
    const adConfig = sizeMap[position] || sizeMap['sidebar'];
    
    // Generate a unique ad ID
    const adId = this.generateAdId(position);
    
    return `
      <ins class="adsbygoogle ${adId}"
           id="${adId}"
           ${adConfig.format}
           data-ad-client="${this.publisherId}"
           data-ad-slot="${adConfig.slot}"></ins>
      <script>
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch(e) {
          console.warn("Ad push error:", e);
        }
      </script>
    `;
  }

  // Generate a unique ad ID
  generateAdId(position) {
    return `ad-${position}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Provide fallback ad content when AdSense isn't available
  getFallbackAdHtml(position) {
    const fallbackAds = {
      'sidebar': {
        imageUrl: '/api/placeholder/300/250',
        linkUrl: '/shop?source=ad_fallback',
        altText: 'Special Offer',
        width: '300px',
        height: '250px'
      },
      'in-content': {
        imageUrl: '/api/placeholder/336/280',
        linkUrl: '/coaching?source=ad_fallback',
        altText: 'Coaching Special',
        width: '336px',
        height: '280px'
      },
      'top': {
        imageUrl: '/api/placeholder/728/90',
        linkUrl: '/subscription?source=ad_fallback',
        altText: 'Premium Subscription',
        width: '100%',
        height: '90px'
      },
      'footer': {
        imageUrl: '/api/placeholder/728/90',
        linkUrl: '/subscription?source=ad_fallback',
        altText: 'Premium Subscription',
        width: '100%',
        height: '90px'
      }
    };

    const ad = fallbackAds[position] || fallbackAds['sidebar'];
    
    // Generate a unique ad ID for fallback ads
    const adId = this.generateAdId(position);
    
    return `
      <div id="${adId}" class="fallback-ad" style="width:${ad.width}; height:${ad.height};">
        <a href="${ad.linkUrl}" target="_blank" rel="noopener noreferrer">
          <img src="${ad.imageUrl}" alt="${ad.altText}" style="width:100%; height:100%; object-fit:cover;" />
        </a>
      </div>
    `;
  }

  // Process ads (can be called with a specific adId or for all pending ads)
  processAds(adId = null) {
    // Check if adsbygoogle is available
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

        // Process the ad
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          this.processedAds.add(adId);
          return true;
        } catch (error) {
          console.warn(`Error processing ad ${adId}:`, error);
          return false;
        }
      }

      // Process all unprocessed ads
      const adElements = document.querySelectorAll('.adsbygoogle:not(.adsbygoogle-processed)');
      if (adElements.length === 0) return false;

      // Process each ad
      adElements.forEach(el => {
        const id = el.id || `ad-auto-${Math.random().toString(36).substring(2, 9)}`;
        if (!el.id) el.id = id;
        
        // Skip if already processed
        if (this.processedAds.has(id)) return;
        
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          el.classList.add('adsbygoogle-processed');
          this.processedAds.add(id);
        } catch (error) {
          console.warn(`Error processing ad ${id}:`, error);
        }
      });

      return true;
    } catch (error) {
      console.warn('Error processing ads:', error);
      return false;
    }
  }

  // Track ad impressions (for analytics)
  trackImpression(adUnitId, position) {
    if (!adUnitId) return;
    
    // In non-production environments, just log
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Ad impression tracked: ${adUnitId} (${position})`);
      return;
    }
    
    // In production, you could implement real tracking here
    // This is a placeholder for your own analytics implementation
  }

  // Check if ad blocker is detected
  isAdBlockerDetected() {
    return this.adBlocked;
  }
}

// Create and export singleton instance
const adService = new AdService();
export default adService;