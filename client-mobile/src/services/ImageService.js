// client/src/services/ImageService.js - Centralized Image and Avatar Management (Pure JS)
import L from 'leaflet';

class ImageService {
  static getSupabaseBaseUrl() {
    return 'https://qqfdpetawucteqzrlzyn.supabase.co/storage/v1/object/public/uploads';
  }
  
  // Avatar URL resolution with priority hierarchy
  static getAvatarUrl(avatar, userGender = 'Male', size = 256) {
    // 1. Custom uploaded avatar (highest priority)
    if (avatar?.customAvatarUrl) {
      return avatar.customAvatarUrl;
    }

    // 2. Generated avatar image
    if (avatar?.generatedImageUrl) {
      return avatar.generatedImageUrl;
    }
    
    // 3. Fallback to default avatar
    return this.getDefaultAvatar(userGender, size);
  }

  static getDefaultAvatar(userGender = 'Male', size = 256) {
    const genderFolder = userGender.toLowerCase();
    const baseUrl = this.getSupabaseBaseUrl();
    return `${baseUrl}/gym-bros/avatar-assets/fallback/default_mouse_${genderFolder}.png`;
  }

  // Gym image resolution
  static getGymImage(gym) {
    if (gym.images && gym.images.length > 0) {
      return gym.images[0]; 
    }

    if (gym.profileImage) {
      return gym.profileImage;
    }

    return this.getDefaultGymImage(gym.type || 'gym');
  }

  static getDefaultGymImage(gymType = 'gym') {
    const baseUrl = this.getSupabaseBaseUrl();
    const typeImages = {
      'gym': `${baseUrl}/gym-bros/gym-assets/defaults/default_gym.png`,
      'community': `${baseUrl}/gym-bros/gym-assets/defaults/default_community.png`,
      'event': `${baseUrl}/gym-bros/gym-assets/defaults/default_event.png`,
      'sport_center': `${baseUrl}/gym-bros/gym-assets/defaults/default_sport_center.png`,
      'other': `${baseUrl}/gym-bros/gym-assets/defaults/default_other.png`
    };
    
    return typeImages[gymType] || typeImages['gym'];
  }

  // Create random mirror hash for consistent random mirroring per user
  static getRandomMirrorHash(userId) {
    if (!userId) return false;
    
    // Create a simple hash from userId to ensure same user always gets same mirror state
    let hash = 0;
    const str = userId.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Return true for mirroring ~50% of the time based on hash
    return Math.abs(hash) % 2 === 0;
  }
  
  // Create enhanced avatar icon with image fallback and random mirroring
  static createImageIcon(avatar, userGender, userId, isCurrentUser = false, userType = {}) {
    const avatarUrl = this.getAvatarUrl(avatar, userGender, 256);
    const size = isCurrentUser ? 90 : 75;
    const shouldMirror = !isCurrentUser && this.getRandomMirrorHash(userId);

    return L.divIcon({
      html: `
        <div class="relative" style="width: ${size}px; height: ${size}px;">
          <img 
            src="${avatarUrl}" 
            style="
              width: ${size}px; 
              height: ${size}px; 
              object-fit: contain; 
              border-radius: 0;
              background: transparent;
              box-shadow: none;
              border: none;
              display: block;
              position: relative;
              z-index: 1020;
              ${shouldMirror ? 'transform: scaleX(-1);' : ''}
            "
            onerror="this.src='${this.getDefaultAvatar(userGender)}'"
          />
          ${userType.isMatch && !isCurrentUser ? `
            <div class="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 border-2 border-white rounded-full flex items-center justify-center">
              <div style="font-size: 12px; line-height: 1;">❤️</div>
            </div>
          ` : ''}
          ${userType.isGymMember && !userType.isMatch && !isCurrentUser ? `
            <div class="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 border-2 border-white rounded-full flex items-center justify-center">
              <div style="color: white; font-size: 10px; line-height: 1;">🏋️</div>
            </div>
          ` : ''}
          ${userType.isRecommendation && !userType.isMatch && !userType.isGymMember && !isCurrentUser ? `
            <div class="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 border-2 border-white rounded-full flex items-center justify-center">
              <div style="color: white; font-size: 10px; line-height: 1;">⭐</div>
            </div>
          ` : ''}
        </div>
      `,
      className: `custom-avatar-icon ${isCurrentUser ? 'current-user' : ''}`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
    });
  }

  // Create enhanced gym icon with images
  static createGymImageIcon(gym, isRealtime = false) {
    const gymImage = this.getGymImage(gym);
    const typeInfo = this.getGymTypeInfo(gym.type);
    const size = 50;

    return L.divIcon({
      html: `
        <div class="relative" style="width: ${size}px; height: ${size}px;">
          <img 
            src="${gymImage}" 
            style="
              width: ${size}px; 
              height: ${size}px; 
              object-fit: cover; 
              border-radius: 0;
              background: transparent;
              display: block;
              position: relative;
              z-index: 1000;
            "
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
          />
          <div style="
            display: none;
            width: ${size}px; 
            height: ${size}px; 
            background: transparent;
            border-radius: 0;
            align-items: center; 
            justify-content: center;
            font-size: 24px;
            position: absolute;
            top: 0;
            left: 0;
          ">${typeInfo.icon}</div>
          ${gym.isNew ? `
            <div class="absolute -top-2 -left-2 bg-green-500 text-white text-xs px-1 rounded-full" style="font-size: 8px; line-height: 1.2; padding: 2px 4px;">
              NEW
            </div>
          ` : ''}
          ${isRealtime ? `
            <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-400 border-2 border-white rounded-full">
              <div class="w-full h-full bg-blue-400 rounded-full animate-ping"></div>
            </div>
          ` : ''}
        </div>
      `,
      className: 'custom-gym-icon',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  }
  
  static getGymTypeInfo(type) {
    const types = {
      'gym': { icon: '🏋️', color: '#3B82F6', bgColor: '#EBF8FF' },
      'community': { icon: '🏘️', color: '#10B981', bgColor: '#ECFDF5' },
      'event': { icon: '📅', color: '#F59E0B', bgColor: '#FFFBEB' },
      'sport_center': { icon: '⚽', color: '#EF4444', bgColor: '#FEF2F2' },
      'other': { icon: '📍', color: '#8B5CF6', bgColor: '#F5F3FF' }
    };
    return types[type] || types.gym;
  }
}

// Utility functions for filtering
export const FilterUtils = {
  // Calculate distance between two points using Haversine formula
  calculateDistance: (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  // Filter users by distance from current location
  filterUsersByDistance: (users, currentLocation, maxDistance) => {
    if (!currentLocation || !maxDistance) return users;
    
    return users.filter(user => {
      if (!user.lat || !user.lng) return false;
      
      const distance = FilterUtils.calculateDistance(
        currentLocation.lat, 
        currentLocation.lng, 
        user.lat, 
        user.lng
      );
      
      return distance <= maxDistance;
    });
  },

  // Filter gyms by distance from current location
  filterGymsByDistance: (gyms, currentLocation, maxDistance) => {
    if (!currentLocation || !maxDistance) return gyms;
    
    return gyms.filter(gym => {
      let lat, lng;
      
      if (gym.location?.coordinates && Array.isArray(gym.location.coordinates)) {
        [lng, lat] = gym.location.coordinates;
      } else {
        lat = gym.lat || gym.location?.lat;
        lng = gym.lng || gym.location?.lng;
      }
      
      if (!lat || !lng) return false;
      
      const distance = FilterUtils.calculateDistance(
        currentLocation.lat, 
        currentLocation.lng, 
        lat, 
        lng
      );
      
      return distance <= maxDistance;
    });
  },

  // Filter users and gyms by search query
  filterBySearch: (items, searchQuery, type = 'user') => {
    if (!searchQuery || !searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase().trim();
    
    return items.filter(item => {
      if (type === 'user') {
        return (
          item.name?.toLowerCase().includes(query) ||
          item.workoutTypes?.some(workout => workout.toLowerCase().includes(query)) ||
          item.experienceLevel?.toLowerCase().includes(query)
        );
      } else if (type === 'gym') {
        return (
          item.name?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.type?.toLowerCase().includes(query)
        );
      }
      
      return false;
    });
  },

  // Apply all filters to users
  applyUserFilters: (users, filters, currentLocation, searchQuery) => {
    let filteredUsers = [...users];
    
    // Apply search filter
    if (searchQuery) {
      filteredUsers = FilterUtils.filterBySearch(filteredUsers, searchQuery, 'user');
    }
    
    // Apply distance filter
    if (filters.maxDistance && currentLocation) {
      filteredUsers = FilterUtils.filterUsersByDistance(
        filteredUsers, 
        currentLocation, 
        filters.maxDistance
      );
    }
    
    return filteredUsers;
  },

  // Apply all filters to gyms
  applyGymFilters: (gyms, filters, currentLocation, searchQuery) => {
    let filteredGyms = [...gyms];
    
    // Apply search filter
    if (searchQuery) {
      filteredGyms = FilterUtils.filterBySearch(filteredGyms, searchQuery, 'gym');
    }
    
    // Apply distance filter
    if (filters.maxDistance && currentLocation) {
      filteredGyms = FilterUtils.filterGymsByDistance(
        filteredGyms, 
        currentLocation, 
        filters.maxDistance
      );
    }
    
    // Apply type filters
    if (!filters.showGyms) {
      filteredGyms = filteredGyms.filter(gym => gym.type !== 'gym');
    }
    if (!filters.showCommunity) {
      filteredGyms = filteredGyms.filter(gym => gym.type !== 'community');
    }
    if (!filters.showSportCenters) {
      filteredGyms = filteredGyms.filter(gym => gym.type !== 'sport_center');
    }
    if (!filters.showOther) {
      filteredGyms = filteredGyms.filter(gym => gym.type !== 'other');
    }
    if (!filters.showEvents) {
      filteredGyms = filteredGyms.filter(gym => gym.type !== 'event');
    }
    
    return filteredGyms;
  }
};

export default ImageService;