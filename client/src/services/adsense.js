// services/adService.js
class AdService {
  constructor() {
    this.initialized = false;
    this.initializing = false;
    this.adBlocked = false;
    this.slots = {};
    this.initPromise = null;
    this.networkId = '22639388920'; // Your network ID from the console output
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

      // Create the GPT script
      const script = document.createElement('script');
      script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
      script.async = true;

      script.onload = () => {
        // Initialize googletag
        window.googletag = window.googletag || { cmd: [] };
        
        // Configure the ad slots
        googletag.cmd.push(() => {
          // Define common slots
          this.defineAdSlots();
          
          // Enable Single Request Architecture
          googletag.pubads().enableSingleRequest();
          
          // Enable services
          googletag.enableServices();
          
          console.log('Google Publisher Tags initialized successfully');
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
    try {
      googletag.cmd.push(() => {
        // Clear any existing slots first
        if (googletag.pubads && googletag.pubads().getSlots) {
          const existingSlots = googletag.pubads().getSlots();
          if (existingSlots && existingSlots.length > 0) {
            googletag.destroySlots();
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

        // Set any global targeting parameters
        // googletag.pubads().setTargeting('site', 'gymjams');
        
        // Set safe-frame config
        googletag.pubads().setSafeFrameConfig({
          allowOverlayExpansion: true,
          allowPushExpansion: true,
          sandbox: true
        });
        
        // Enable lazy loading (optional)
        googletag.pubads().enableLazyLoad({
          fetchMarginPercent: 200,  // Fetch slots within 2 viewports
          renderMarginPercent: 100,  // Render slots within 1 viewport
          mobileScaling: 2.0  // Double the fetch margin on mobile
        });
      });
    } catch (error) {
      console.error('Error defining ad slots:', error);
    }
  }

  // Display an ad in the specified position
  displayAd(position) {
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

    // Display the ad
    try {
      googletag.cmd.push(() => {
        googletag.display(divId);
      });
      return true;
    } catch (error) {
      console.warn(`Error displaying ad in ${position}:`, error);
      return false;
    }
  }

  // Get the HTML for an ad container
  getAdHtml(position) {
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

  // Get fallback ad HTML if ads are blocked
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

  // Refresh all ads on the page
  refreshAds() {
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