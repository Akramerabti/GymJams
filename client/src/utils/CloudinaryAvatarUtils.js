// utils/CloudinaryAvatarUtils.js
import { getCloudinaryImageUrl } from './cloudinary';

/**
 * Generate avatar image URL using Cloudinary transformations
 * Enhanced with filter-specific styling for different user types
 */
export class CloudinaryAvatarGenerator {
  constructor() {
    this.baseFolder = 'gymtonic/avatars';
    this.components = {
      // Base mouse bodies by fur color
      bodies: {
        brown: 'mouse-body-brown',
        gray: 'mouse-body-gray', 
        white: 'mouse-body-white',
        black: 'mouse-body-black',
        golden: 'mouse-body-golden',
        cream: 'mouse-body-cream',
        pink: 'mouse-body-pink',
        blue: 'mouse-body-blue'
      },
      
      // Facial expressions
      faces: {
        happy: 'face-happy',
        excited: 'face-excited', 
        determined: 'face-determined',
        neutral: 'face-neutral',
        cool: 'face-cool'
      },
      
      // Clothing layers
      shirts: {
        tshirt: {
          blue: 'shirt-tshirt-blue',
          red: 'shirt-tshirt-red',
          green: 'shirt-tshirt-green',
          purple: 'shirt-tshirt-purple',
          pink: 'shirt-tshirt-pink',
          black: 'shirt-tshirt-black',
          white: 'shirt-tshirt-white',
          yellow: 'shirt-tshirt-yellow',
          orange: 'shirt-tshirt-orange',
          teal: 'shirt-tshirt-teal'
        },
        hoodie: {
          blue: 'shirt-hoodie-blue',
          red: 'shirt-hoodie-red',
          green: 'shirt-hoodie-green',
          purple: 'shirt-hoodie-purple',
          pink: 'shirt-hoodie-pink',
          black: 'shirt-hoodie-black',
          white: 'shirt-hoodie-white',
          yellow: 'shirt-hoodie-yellow',
          orange: 'shirt-hoodie-orange',
          teal: 'shirt-hoodie-teal'
        },
        tank: {
          blue: 'shirt-tank-blue',
          red: 'shirt-tank-red',
          green: 'shirt-tank-green',
          purple: 'shirt-tank-purple',
          pink: 'shirt-tank-pink',
          black: 'shirt-tank-black',
          white: 'shirt-tank-white',
          yellow: 'shirt-tank-yellow',
          orange: 'shirt-tank-orange',
          teal: 'shirt-tank-teal'
        }
      },
      
      // Accessories as overlays
      accessories: {
        glasses: 'accessory-glasses',
        hat: 'accessory-cap',
        headphones: 'accessory-headphones',
        sunglasses: 'accessory-sunglasses',
        bandana: 'accessory-bandana',
        workout_band: 'accessory-workout-band'
      },
      
      // Filter-specific effects and borders
      filters: {
        current_user: {
          border: 'filter-current-user-border', // Green border with crown
          glow: 'filter-current-user-glow'
        },
        match: {
          border: 'filter-match-border', // Pink border with heart
          glow: 'filter-match-glow',
          heart: 'filter-match-heart'
        },
        gym_member: {
          border: 'filter-gym-member-border', // Orange border with dumbbell
          glow: 'filter-gym-member-glow',
          badge: 'filter-gym-member-badge'
        },
        recommendation: {
          border: 'filter-recommendation-border', // Purple border with star
          glow: 'filter-recommendation-glow',
          star: 'filter-recommendation-star',
          waving: 'filter-recommendation-waving-arm' // Special waving animation
        },
        realtime: {
          pulse: 'filter-realtime-pulse',
          indicator: 'filter-realtime-indicator'
        }
      },
      
      // Special themed avatars for recommendations
      special_avatars: {
        recommendation_orange: 'special-recommendation-orange-mouse', // Orange mouse for recommendations
        waving_friendly: 'special-waving-friendly-mouse'
      }
    };
  }

  /**
   * Generate avatar image URL with dynamic layering and filter styling
   * @param {Object} avatar - Avatar configuration
   * @param {number} size - Desired image size
   * @param {Object} options - Filter and styling options
   * @returns {string} - Cloudinary image URL
   */
  generateAvatarUrl(avatar, size = 40, options = {}) {
    const {
      isCurrentUser = false,
      isMatch = false,
      isGymMember = false,
      isRecommendation = false,
      showRealtimeIndicator = false
    } = options;

    // Special case: Use themed avatar for recommendations
    let baseImage;
    if (isRecommendation) {
      baseImage = `${this.baseFolder}/special/${this.components.special_avatars.recommendation_orange}`;
    } else {
      // Use regular avatar system
      const furColor = this.mapFurColor(avatar.furColor || '#8B4513');
      baseImage = `${this.baseFolder}/bodies/${this.components.bodies[furColor]}`;
    }
    
    // Build transformation chain
    const transformations = [];
    
    // Resize to target size
    transformations.push(`w_${size},h_${size},c_fit`);
    
    // Add filter-specific border and glow effects FIRST (background layer)
    if (isCurrentUser) {
      transformations.push(
        `l_${this.baseFolder}:filters:${this.components.filters.current_user.glow},w_${Math.round(size*1.2)},h_${Math.round(size*1.2)},c_fit,g_center,fl_layer_apply`
      );
    } else if (isMatch) {
      transformations.push(
        `l_${this.baseFolder}:filters:${this.components.filters.match.glow},w_${Math.round(size*1.2)},h_${Math.round(size*1.2)},c_fit,g_center,fl_layer_apply`
      );
    } else if (isGymMember) {
      transformations.push(
        `l_${this.baseFolder}:filters:${this.components.filters.gym_member.glow},w_${Math.round(size*1.2)},h_${Math.round(size*1.2)},c_fit,g_center,fl_layer_apply`
      );
    } else if (isRecommendation) {
      transformations.push(
        `l_${this.baseFolder}:filters:${this.components.filters.recommendation.glow},w_${Math.round(size*1.2)},h_${Math.round(size*1.2)},c_fit,g_center,fl_layer_apply`
      );
    }
    
    // For non-recommendation avatars, add face, clothing, accessories
    if (!isRecommendation) {
      // Add face expression overlay
      const mood = avatar.mood || 'happy';
      if (this.components.faces[mood]) {
        transformations.push(
          `l_${this.baseFolder}:faces:${this.components.faces[mood]},w_${size},h_${size},c_fit,fl_layer_apply`
        );
      }
      
      // Add shirt if not 'none'
      if (avatar.shirtStyle && avatar.shirtStyle !== 'none') {
        const shirtColor = this.mapShirtColor(avatar.shirtColor || '#3B82F6');
        const shirtComponent = this.components.shirts[avatar.shirtStyle]?.[shirtColor];
        if (shirtComponent) {
          transformations.push(
            `l_${this.baseFolder}:shirts:${shirtComponent},w_${size},h_${size},c_fit,fl_layer_apply`
          );
        }
      }
      
      // Add accessories
      if (avatar.accessory && avatar.accessory !== 'none') {
        const accessoryComponent = this.components.accessories[avatar.accessory];
        if (accessoryComponent) {
          transformations.push(
            `l_${this.baseFolder}:accessories:${accessoryComponent},w_${size},h_${size},c_fit,fl_layer_apply`
          );
        }
      }
    } else {
      // For recommendations, add special waving arm
      transformations.push(
        `l_${this.baseFolder}:filters:${this.components.filters.recommendation.waving},w_${size},h_${size},c_fit,fl_layer_apply`
      );
    }
    
    // Add filter-specific borders (on top)
    if (isCurrentUser) {
      transformations.push(
        `l_${this.baseFolder}:filters:${this.components.filters.current_user.border},w_${Math.round(size*1.1)},h_${Math.round(size*1.1)},c_fit,g_center,fl_layer_apply`
      );
    } else if (isMatch) {
      transformations.push(
        `l_${this.baseFolder}:filters:${this.components.filters.match.border},w_${Math.round(size*1.1)},h_${Math.round(size*1.1)},c_fit,g_center,fl_layer_apply`
      );
    } else if (isGymMember) {
      transformations.push(
        `l_${this.baseFolder}:filters:${this.components.filters.gym_member.border},w_${Math.round(size*1.1)},h_${Math.round(size*1.1)},c_fit,g_center,fl_layer_apply`
      );
    } else if (isRecommendation) {
      transformations.push(
        `l_${this.baseFolder}:filters:${this.components.filters.recommendation.border},w_${Math.round(size*1.1)},h_${Math.round(size*1.1)},c_fit,g_center,fl_layer_apply`
      );
    }
    
    // Add status badges (top layer)
    if (isCurrentUser) {
      // Crown icon for current user
      transformations.push(
        `l_text:Arial_${Math.round(size*0.15)}:👑,g_north_east,x_${Math.round(size*0.05)},y_${Math.round(size*0.05)},fl_layer_apply`
      );
    } else if (isMatch) {
      // Heart for matches
      transformations.push(
        `l_${this.baseFolder}:filters:${this.components.filters.match.heart},w_${Math.round(size*0.25)},g_north_east,x_${Math.round(size*0.05)},y_${Math.round(size*0.05)},fl_layer_apply`
      );
    } else if (isGymMember) {
      // Dumbbell for gym members
      transformations.push(
        `l_${this.baseFolder}:filters:${this.components.filters.gym_member.badge},w_${Math.round(size*0.25)},g_north_east,x_${Math.round(size*0.05)},y_${Math.round(size*0.05)},fl_layer_apply`
      );
    } else if (isRecommendation) {
      // Star for recommendations
      transformations.push(
        `l_${this.baseFolder}:filters:${this.components.filters.recommendation.star},w_${Math.round(size*0.25)},g_north_east,x_${Math.round(size*0.05)},y_${Math.round(size*0.05)},fl_layer_apply`
      );
    }
    
    // Add real-time indicator
    if (showRealtimeIndicator) {
      transformations.push(
        `l_${this.baseFolder}:filters:${this.components.filters.realtime.pulse},w_${Math.round(size*0.3)},g_south_east,x_${Math.round(size*0.05)},y_${Math.round(size*0.05)},fl_layer_apply`
      );
    }
    
    // Final quality and format optimization
    transformations.push('f_auto,q_auto');
    
    // Generate final URL
    return getCloudinaryImageUrl(baseImage, {
      transformation: transformations.join('/')
    });
  }

  /**
   * Generate a simple fallback avatar URL for failed loads
   */
  generateFallbackUrl(size = 40, type = 'default') {
    const fallbackColors = {
      default: '#3B82F6',
      currentUser: '#10B981',
      match: '#EC4899',
      gymMember: '#F59E0B',
      recommendation: '#8B5CF6'
    };

    const color = fallbackColors[type] || fallbackColors.default;
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="${size/2}" y="${size/2+4}" text-anchor="middle" fill="white" font-size="${size*0.4}" font-family="Arial">🐭</text>
      </svg>
    `)}`;
  }

  /**
   * Map hex colors to component names
   */
  mapFurColor(hexColor) {
    const colorMap = {
      '#8B4513': 'brown',
      '#6B7280': 'gray',
      '#F3F4F6': 'white',
      '#1F2937': 'black',
      '#D97706': 'golden',
      '#FEF3C7': 'cream',
      '#FFC0CB': 'pink',
      '#93C5FD': 'blue'
    };
    return colorMap[hexColor] || 'brown';
  }

  mapShirtColor(hexColor) {
    const colorMap = {
      '#3B82F6': 'blue',
      '#EF4444': 'red',
      '#10B981': 'green',
      '#8B5CF6': 'purple',
      '#EC4899': 'pink',
      '#000000': 'black',
      '#FFFFFF': 'white',
      '#FCD34D': 'yellow',
      '#FB923C': 'orange',
      '#14B8A6': 'teal'
    };
    return colorMap[hexColor] || 'blue';
  }

  /**
   * Preload critical avatar variations for better performance
   */
  async preloadAvatarVariations(avatar) {
    const sizes = [40, 50, 80, 120, 180];
    const filterVariations = [
      { isCurrentUser: false },
      { isCurrentUser: true },
      { isMatch: true },
      { isGymMember: true },
      { isRecommendation: true },
      { showRealtimeIndicator: true }
    ];

    const urls = [];
    for (const size of sizes) {
      for (const variation of filterVariations) {
        urls.push(this.generateAvatarUrl(avatar, size, variation));
      }
    }

    // Trigger preload by creating Image objects
    return Promise.all(
      urls.map(url => new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = () => resolve(); // Don't fail if one image fails
        img.src = url;
      }))
    );
  }

  /**
   * Generate special recommendation avatar with animated elements
   */
  generateRecommendationAvatar(size = 40, withAnimation = true) {
    const baseImage = `${this.baseFolder}/special/${this.components.special_avatars.recommendation_orange}`;
    
    const transformations = [
      `w_${size},h_${size},c_fit`,
      `l_${this.baseFolder}:filters:${this.components.filters.recommendation.glow},w_${Math.round(size*1.2)},h_${Math.round(size*1.2)},c_fit,g_center,fl_layer_apply`,
      `l_${this.baseFolder}:filters:${this.components.filters.recommendation.border},w_${Math.round(size*1.1)},h_${Math.round(size*1.1)},c_fit,g_center,fl_layer_apply`,
      `l_${this.baseFolder}:filters:${this.components.filters.recommendation.star},w_${Math.round(size*0.25)},g_north_east,x_${Math.round(size*0.05)},y_${Math.round(size*0.05)},fl_layer_apply`,
      'f_auto,q_auto'
    ];

    if (withAnimation) {
      // Add special waving animation layer
      transformations.splice(-1, 0, 
        `l_${this.baseFolder}:filters:${this.components.filters.recommendation.waving},w_${size},h_${size},c_fit,fl_layer_apply`
      );
    }
    
    return getCloudinaryImageUrl(baseImage, {
      transformation: transformations.join('/')
    });
  }

  /**
   * Get filter type from user data
   */
  getFilterType(user, isCurrentUser = false) {
    if (isCurrentUser) return 'currentUser';
    if (user.source === 'match' || user.isMatch) return 'match';
    if (user.source === 'gym_member' || user.sharedGym) return 'gymMember';
    if (user.source === 'recommendation' || user.isRecommendation) return 'recommendation';
    return 'default';
  }
}

// Singleton instance
export const avatarGenerator = new CloudinaryAvatarGenerator();