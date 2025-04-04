// services/adService.js
class AdService {
  constructor() {
    this.initialized = false;
    this.initializing = false;
    this.adBlocked = false;
    this.slots = {};
    this.initPromise = null;
    this.networkId = '22639388920';
    this.scriptAdded = false; // Track if script was added
    
    // Detect if we're in development or production
    this.isDevelopment = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' ||
       window.location.port === '5173' ||
       window.location.port === '3000');
  }

  // Initialize the Ad Manager (returns a promise that resolves when ready)
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
        console.log('Development mode: Using fallback ads instead of GPT');
        this.initialized = true;
        resolve(true);
        return;
      }

      // Check if googletag is already defined and ready
      if (typeof window.googletag !== 'undefined' && window.googletag.apiReady) {
        console.log('GPT already initialized, using existing instance');
        this.defineAdSlots();
        this.initialized = true;
        resolve(true);
        return;
      }

      // Initialize googletag
      if (typeof window.googletag === 'undefined') {
        window.googletag = { cmd: [] };
      }
      
      // Check if the script is already in the document
      const existingScript = document.querySelector('script[src*="securepubads.g.doubleclick.net"]');
      if (existingScript) {
        // Script already exists, just initialize
        this.scriptAdded = true;
        googletag.cmd.push(() => {
          this.defineAdSlots();
          this.initialized = true;
          resolve(true);
        });
        return;
      }
      
      // Create the GPT script if not already added
      if (!this.scriptAdded) {
        const script = document.createElement('script');
        script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
        script.async = true;
        this.scriptAdded = true;

        script.onload = () => {
          // Initialize googletag
          googletag.cmd.push(() => {
            this.defineAdSlots();
            this.initialized = true;
            resolve(true);
          });
        };

        script.onerror = (error) => {
          console.warn('Failed to load GPT script:', error);
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
          console.warn('GPT initialization timed out');
          this.adBlocked = true;
          this.initialized = true;
          resolve(false);
        }
      }, 5000);
    });
    
    return this.initPromise;
  }

  // Define the ad slots
  defineAdSlots() {
    // Skip in development mode
    if (this.isDevelopment) return;
    
    try {
      googletag.cmd.push(() => {
        // Check if slots are already defined to prevent duplicate definitions
        if (googletag.pubads && googletag.pubads().getSlots) {
          const existingSlots = googletag.pubads().getSlots();
          const slotIds = existingSlots.map(s => s.getSlotElementId());
          
          // Skip if our slots are already defined
          if (slotIds.includes('div-gpt-ad-GymJams_Top') && 
              slotIds.includes('div-gpt-ad-GymJams_Sidebar') && 
              slotIds.includes('div-gpt-ad-GymJams_InContent')) {
            console.log('Ad slots already defined, skipping definition');
            return;
          }
        }

        // Define the top banner ad
        this.slots.top = googletag.defineSlot(
          `/${this.networkId}/GymJams_Top`, 
          [[728, 90], [320, 50], [970, 90]], // Responsive sizes
          'div-gpt-ad-GymJams_Top'
        ).addService(googletag.pubads());

        // Define the sidebar ad
        this.slots.sidebar = googletag.defineSlot(
          `/${this.networkId}/GymJams_Sidebar`, 
          [[300, 250], [300, 600]], // Responsive sizes
          'div-gpt-ad-GymJams_Sidebar'
        ).addService(googletag.pubads());

        // Define the in-content ad
        this.slots.inContent = googletag.defineSlot(
          `/${this.networkId}/GymJams_InContent`, 
          [[300, 250], [336, 280]], // Common in-content sizes
          'div-gpt-ad-GymJams_InContent'
        ).addService(googletag.pubads());
        
        // Basic configuration - keep it simple
        googletag.pubads().enableSingleRequest();
        googletag.enableServices();
      });
    } catch (error) {
      console.error('Error defining ad slots:', error);
    }
  }

  // The rest of your methods remain unchanged
  displayAd(position) {
    // Skip actual ad display in development mode
    if (this.isDevelopment) {
      return true; // Pretend it worked
    }
    
    if (!this.initialized || this.adBlocked) {
      return false;
    }

    const slotMapping = {
      'top': 'div-gpt-ad-GymJams_Top',
      'sidebar': 'div-gpt-ad-GymJams_Sidebar',
      'in-content': 'div-gpt-ad-GymJams_InContent',
      'footer': 'div-gpt-ad-GymJams_Top' // Reuse top ad for footer
    };

    const divId = slotMapping[position];
    if (!divId) {
      console.warn(`No mapping found for position: ${position}`);
      return false;
    }

    // Display the ad, with error handling
    try {
      // Wrap in try-catch since this might be executed before GPT is ready
      googletag.cmd.push(() => {
        try {
          // Make sure the element exists before trying to display an ad in it
          if (document.getElementById(divId)) {
            googletag.display(divId);
          }
        } catch (innerError) {
          console.warn(`Error displaying ad in ${position}:`, innerError);
        }
      });
      return true;
    } catch (error) {
      console.warn(`Error queuing ad display for ${position}:`, error);
      return false;
    }
  }

  // Get the HTML for an ad container
  getAdHtml(position) {
    // In development mode, use fallbacks
    if (this.isDevelopment) {
      return this.getFallbackAdHtml(position);
    }
    
    const slotMapping = {
      'top': 'div-gpt-ad-GymJams_Top',
      'sidebar': 'div-gpt-ad-GymJams_Sidebar',
      'in-content': 'div-gpt-ad-GymJams_InContent',
      'footer': 'div-gpt-ad-GymJams_Top' // Reuse top ad for footer
    };

    const divId = slotMapping[position];
    if (!divId) return '';

    return `<div id="${divId}" style="width:100%; height:100%;"></div>`;
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
      'in-content': {
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

  // Get dimensions for a specific ad position
  getAdDimensions(position) {
    const dimensions = {
      'top': { width: '728px', height: '90px', maxWidth: '100%' },
      'sidebar': { width: '300px', height: '250px' },
      'in-content': { width: '336px', height: '280px', maxWidth: '100%' },
      'footer': { width: '728px', height: '90px', maxWidth: '100%' }
    };

    return dimensions[position] || dimensions['sidebar'];
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
      googletag.cmd.push(() => {
        googletag.pubads().refresh();
      });
      return true;
    } catch (error) {
      console.warn('Error refreshing ads:', error);
      return false;
    }
  }
}

// Create and export singleton instance
const adService = new AdService();
export default adService;