// components/gymBros/utils/ImageUtils.js
import React from 'react';
import L from 'leaflet';
import { Building2, Calendar, Users, MapPin, Activity, Zap, Shield } from 'lucide-react';

// Centralized Supabase configuration
const SUPABASE_CONFIG = {
  baseUrl: 'https://qqfdpetawucteqzrlzyn.supabase.co/storage/v1/object/public/uploads',
  paths: {
    avatarAssets: 'gym-bros/avatar-assets',
    gymAssets: 'gym-bros/gym-assets',
    fallbackAvatars: 'gym-bros/avatar-assets/fallback',
    defaultGyms: 'gym-bros/gym-assets/defaults'
  }
};

// Enhanced Image Service with random mirroring and fallbacks
export class ImageService {
  static getSupabaseBaseUrl() {
    return SUPABASE_CONFIG.baseUrl;
  }
  
  // Generate a consistent random seed based on user ID for deterministic mirroring
  static getUserSeed(userId) {
    if (!userId) return 0;
    let hash = 0;
    const str = userId.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  
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
    return `${baseUrl}/${SUPABASE_CONFIG.paths.fallbackAvatars}/default_mouse_${genderFolder}.png`;
  }

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
      'gym': `${baseUrl}/${SUPABASE_CONFIG.paths.defaultGyms}/default_gym.png`,
      'community': `${baseUrl}/${SUPABASE_CONFIG.paths.defaultGyms}/default_community.png`,
      'event': `${baseUrl}/${SUPABASE_CONFIG.paths.defaultGyms}/default_event.png`,
      'sport_center': `${baseUrl}/${SUPABASE_CONFIG.paths.defaultGyms}/default_sport_center.png`,
      'other': `${baseUrl}/${SUPABASE_CONFIG.paths.defaultGyms}/default_other.png`
    };
    
    return typeImages[gymType] || typeImages['gym'];
  }
  
// Create enhanced avatar icon with image fallback and random mirroring
static createImageIcon(avatar, userGender, isCurrentUser = false, userType = {}, userId = null) {
  const avatarUrl = this.getAvatarUrl(avatar, userGender, 256);
  const size = isCurrentUser ? 80 : 65;
  // TRUE RANDOM 50% CHANCE - CHANGES EVERY RELOAD
  const shouldMirror = Math.random() < 0.5;

  // Create a unique ID for this specific icon to avoid CSS conflicts
  const iconId = `avatar-${userId || 'default'}-${Date.now()}`;

  // Debug logging
  console.log('createImageIcon debug:', {
    userId,
    isCurrentUser,
    shouldMirror,
    randomValue: 'TRUE RANDOM EVERY TIME'
  });

  return L.divIcon({
    html: `
      <style>
        .${iconId} .avatar-image {
          width: ${size}px !important; 
          height: ${size}px !important; 
          object-fit: contain !important; 
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
          display: block !important;
          position: relative !important;
          z-index: 1020 !important;
          ${shouldMirror ? 'transform: scaleX(-1) !important;' : '/* no mirror */'}
        }
      </style>
      <div class="relative ${iconId}" style="width: ${size}px; height: ${size}px;">
        <img 
          src="${avatarUrl}" 
          class="avatar-image"
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
    const size = 60;

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
  
  static getBorderColor(isCurrentUser, userType) {
    if (isCurrentUser) return '#10B981'; // Green for current user
    if (userType.isMatch) return '#EC4899'; // Pink for matches
    if (userType.isGymMember) return '#F59E0B'; // Orange for gym members
    if (userType.isRecommendation) return '#8B5CF6'; // Purple for recommendations
    return '#3B82F6'; // Blue default
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

// Utility functions for distance calculations
export const DistanceUtils = {
  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.degToRad(lat2 - lat1);
    const dLng = this.degToRad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  degToRad(deg) {
    return deg * (Math.PI/180);
  },

  // Filter items by distance from current location
  filterByDistance(items, currentLocation, maxDistance) {
    if (!currentLocation || !maxDistance) return items;
    
    return items.filter(item => {
      if (!item.lat || !item.lng) return false;
      const distance = this.calculateDistance(
        currentLocation.lat, 
        currentLocation.lng, 
        item.lat, 
        item.lng
      );
      return distance <= maxDistance;
    });
  }
};

// Search and filter utilities
export const FilterUtils = {
  // Search functionality for users and gyms
  searchItems(items, query, searchFields = ['name']) {
    if (!query || !query.trim()) return items;
    
    const searchTerm = query.toLowerCase().trim();
    
    return items.filter(item => {
      return searchFields.some(field => {
        const value = this.getNestedValue(item, field);
        
        // Handle different value types
        if (value === null || value === undefined) return false;
        
        // If it's an array (like workoutTypes), search within the array
        if (Array.isArray(value)) {
          return value.some(arrayItem => {
            if (typeof arrayItem === 'string') {
              return arrayItem.toLowerCase().includes(searchTerm);
            }
            return false;
          });
        }
        
        // If it's a string, search normally
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm);
        }
        
        // If it's a number, convert to string and search
        if (typeof value === 'number') {
          return value.toString().includes(searchTerm);
        }
        
        return false;
      });
    });
  },

  // Filter users by various criteria
  filterUsers(users, filters) {
    let filtered = [...users];

    // Age range filter
    if (filters.ageRange?.min || filters.ageRange?.max) {
      filtered = filtered.filter(user => {
        const age = user.age || 0;
        if (filters.ageRange.min && age < filters.ageRange.min) return false;
        if (filters.ageRange.max && age > filters.ageRange.max) return false;
        return true;
      });
    }

    // Experience level filter
    if (filters.experienceLevel && filters.experienceLevel !== 'Any') {
      filtered = filtered.filter(user => 
        user.experienceLevel === filters.experienceLevel
      );
    }

    // Gender filter
    if (filters.genderPreference && filters.genderPreference !== 'All') {
      filtered = filtered.filter(user => 
        user.gender === filters.genderPreference
      );
    }

    // Workout types filter
    if (filters.workoutTypes?.length) {
      filtered = filtered.filter(user => 
        user.workoutTypes?.some(type => 
          filters.workoutTypes.includes(type)
        )
      );
    }

    // User type visibility filters - filter based on what's toggled on/off
    filtered = filtered.filter(user => {
      const isMatch = user.source === 'match' || user.isMatch;
      const isRecommendation = user.source === 'recommendation' || user.isRecommendation;
      const isGymMember = user.source === 'gym_member' || user.sharedGym;
      
      // If user is a match and matches are enabled, show them
      if (isMatch && filters.showMatches) return true;
      
      // If user is recommended and recommendations are enabled, show them
      if (isRecommendation && filters.showRecommended) return true;
      
      // If user is a gym member and gym members are enabled, show them
      if (isGymMember && filters.showGymMembers) return true;
      
      // If user doesn't fall into any specific category, show them if at least one toggle is on
      // (for users that might not have a specific source type)
      if (!isMatch && !isRecommendation && !isGymMember) {
        return filters.showMatches || filters.showRecommended || filters.showGymMembers;
      }
      
      // Don't show if none of the relevant toggles are enabled
      return false;
    });

    return filtered;
  },

  // Filter gyms by type and other criteria
  filterGyms(gyms, filters) {
    let filtered = [...gyms];

    // Type filters
    if (!filters.showGyms) {
      filtered = filtered.filter(gym => gym.type !== 'gym');
    }
    if (!filters.showCommunity) {
      filtered = filtered.filter(gym => gym.type !== 'community');
    }
    if (!filters.showSportCenters) {
      filtered = filtered.filter(gym => gym.type !== 'sport_center');
    }
    if (!filters.showEvents) {
      filtered = filtered.filter(gym => gym.type !== 'event');
    }
    if (!filters.showOther) {
      filtered = filtered.filter(gym => !['other'].includes(gym.type));
    }

    // Rating filter
    if (filters.minRating && filters.minRating > 0) {
      filtered = filtered.filter(gym => 
        gym.rating && gym.rating >= filters.minRating
      );
    }

    return filtered;
  },

  // Helper to get nested object values
  getNestedValue(obj, path) {
    if (!obj || !path) return null;
    
    return path.split('.').reduce((current, key) => {
      if (current === null || current === undefined) return null;
      return current[key];
    }, obj);
  }
};

// Enhanced mouse avatar rendering with real-time indicators
export const renderMouseAvatar = (avatar, size = 40, showRealtimeIndicator = false) => {
  const furColor = avatar?.furColor || '#8B4513';
  const shirtColor = avatar?.shirtColor || '#3B82F6';
  const shirtStyle = avatar?.shirtStyle || 'tshirt';
  const accessory = avatar?.accessory || 'none';
  const mood = avatar?.mood || 'happy';
  const eyes = avatar?.eyes || 'normal';
  
  // Mouse body paths
  const mouseBody = (
    <g>
      {/* Main body */}
      <ellipse cx={size/2} cy={size*0.6} rx={size*0.35} ry={size*0.25} fill={furColor} />
      
      {/* Head */}
      <circle cx={size/2} cy={size*0.35} r={size*0.28} fill={furColor} />
      
      {/* Ears */}
      <circle cx={size*0.3} cy={size*0.2} r={size*0.12} fill={furColor} />
      <circle cx={size*0.7} cy={size*0.2} r={size*0.12} fill={furColor} />
      <circle cx={size*0.3} cy={size*0.2} r={size*0.08} fill="#FFB6C1" />
      <circle cx={size*0.7} cy={size*0.2} r={size*0.08} fill="#FFB6C1" />
      
      {/* Eyes */}
      {eyes === 'normal' && (
        <>
          <circle cx={size*0.42} cy={size*0.32} r={size*0.06} fill="#000" />
          <circle cx={size*0.58} cy={size*0.32} r={size*0.06} fill="#000" />
          <circle cx={size*0.44} cy={size*0.30} r={size*0.02} fill="#FFF" />
          <circle cx={size*0.60} cy={size*0.30} r={size*0.02} fill="#FFF" />
        </>
      )}
      
      {eyes === 'excited' && (
        <>
          <path d={`M${size*0.38},${size*0.29} Q${size*0.42},${size*0.26} ${size*0.46},${size*0.29}`} 
                stroke="#000" strokeWidth="2" fill="none" />
          <path d={`M${size*0.54},${size*0.29} Q${size*0.58},${size*0.26} ${size*0.62},${size*0.29}`} 
                stroke="#000" strokeWidth="2" fill="none" />
        </>
      )}
      
      {/* Nose */}
      <circle cx={size/2} cy={size*0.4} r={size*0.03} fill="#FF69B4" />
      
      {/* Mouth based on mood */}
      {mood === 'happy' && (
        <path d={`M${size*0.46},${size*0.45} Q${size/2},${size*0.5} ${size*0.54},${size*0.45}`} 
              stroke="#000" strokeWidth="1.5" fill="none" />
      )}
      
      {mood === 'excited' && (
        <ellipse cx={size/2} cy={size*0.47} rx={size*0.05} ry={size*0.03} fill="#000" />
      )}
      
      {mood === 'determined' && (
        <line x1={size*0.46} y1={size*0.46} x2={size*0.54} y2={size*0.46} 
              stroke="#000" strokeWidth="2" />
      )}
      
      {mood === 'neutral' && (
        <line x1={size*0.46} y1={size*0.46} x2={size*0.54} y2={size*0.46} 
              stroke="#000" strokeWidth="1" />
      )}
      
      {mood === 'cool' && (
        <path d={`M${size*0.46},${size*0.47} Q${size/2},${size*0.44} ${size*0.54},${size*0.47}`} 
              stroke="#000" strokeWidth="1.5" fill="none" />
      )}
      
      {/* Whiskers */}
      <line x1={size*0.25} y1={size*0.38} x2={size*0.35} y2={size*0.36} stroke="#000" strokeWidth="1" />
      <line x1={size*0.25} y1={size*0.42} x2={size*0.35} y2={size*0.42} stroke="#000" strokeWidth="1" />
      <line x1={size*0.65} y1={size*0.36} x2={size*0.75} y2={size*0.38} stroke="#000" strokeWidth="1" />
      <line x1={size*0.65} y1={size*0.42} x2={size*0.75} y2={size*0.42} stroke="#000" strokeWidth="1" />
      
      {/* Tail */}
      <path d={`M${size*0.85},${size*0.65} Q${size*0.95},${size*0.5} ${size*0.9},${size*0.35}`} 
            stroke={furColor} strokeWidth="8" fill="none" strokeLinecap="round" />
      
      {/* Shirt based on style */}
      {shirtStyle !== 'none' && (
        <ellipse cx={size/2} cy={size*0.65} rx={size*0.25} ry={size*0.15} fill={shirtColor} />
      )}
      
      {/* Accessories */}
      {accessory === 'glasses' && (
        <>
          <circle cx={size*0.42} cy={size*0.32} r={size*0.08} fill="none" stroke="#000" strokeWidth="2" />
          <circle cx={size*0.58} cy={size*0.32} r={size*0.08} fill="none" stroke="#000" strokeWidth="2" />
          <line x1={size*0.5} y1={size*0.32} x2={size*0.5} y2={size*0.32} stroke="#000" strokeWidth="2" />
        </>
      )}
      
      {accessory === 'hat' && (
        <ellipse cx={size/2} cy={size*0.15} rx={size*0.4} ry={size*0.1} fill="#8B4513" />
      )}
      
      {accessory === 'headphones' && (
        <>
          <circle cx={size*0.25} cy={size*0.25} r={size*0.06} fill="#333" />
          <circle cx={size*0.75} cy={size*0.25} r={size*0.06} fill="#333" />
          <path d={`M${size*0.31},${size*0.2} Q${size/2},${size*0.15} ${size*0.69},${size*0.2}`} 
                stroke="#333" strokeWidth="3" fill="none" />
        </>
      )}
      
      {/* Real-time indicator */}
      {showRealtimeIndicator && (
        <circle cx={size*0.85} cy={size*0.15} r={size*0.08} fill="#10B981">
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {mouseBody}
    </svg>
  );
};

// Create enhanced status indicator
export const createStatusIndicator = (status, isActive = false) => {
  const indicators = {
    online: { color: '#10B981', text: 'Online', icon: '🟢' },
    offline: { color: '#6B7280', text: 'Offline', icon: '⚪' },
    workout: { color: '#F59E0B', text: 'Working Out', icon: '💪' },
    available: { color: '#3B82F6', text: 'Available', icon: '🔵' },
    busy: { color: '#EF4444', text: 'Busy', icon: '🔴' }
  };

  const indicator = indicators[status] || indicators.offline;

  return `
    <div class="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium" 
         style="background-color: ${indicator.color}20; color: ${indicator.color}">
      <div class="w-2 h-2 rounded-full ${isActive ? 'animate-pulse' : ''}" 
           style="background-color: ${indicator.color}"></div>
      <span class="text-xs" style="color: ${indicator.color}">${indicator.text}</span>
    </div>
  `;
};

// Enhanced marker cluster icon
export const createClusterIcon = (cluster, type = 'mixed') => {
  const count = cluster.getChildCount();
  const size = count < 10 ? 30 : count < 100 ? 40 : 50;
  
  const getClusterStyle = (type) => {
    switch (type) {
      case 'users':
        return { bg: '#3B82F6', border: '#1E40AF', icon: '👥' };
      case 'gyms':
        return { bg: '#10B981', border: '#047857', icon: '🏋️' };
      case 'mixed':
      default:
        return { bg: '#8B5CF6', border: '#6D28D9', icon: '📍' };
    }
  };

  const style = getClusterStyle(type);

  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-${size} h-${size} rounded-full border-2 border-white shadow-lg"
           style="background-color: ${style.bg}; border-color: ${style.border}; width: ${size}px; height: ${size}px;">
        <div class="flex flex-col items-center text-white">
          <span style="font-size: ${size > 40 ? '14px' : '12px'};">${style.icon}</span>
          <span style="font-size: ${size > 40 ? '12px' : '10px'}; font-weight: bold;">${count}</span>
        </div>
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};