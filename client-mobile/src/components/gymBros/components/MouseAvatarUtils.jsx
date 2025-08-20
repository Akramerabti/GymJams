import React from 'react';
import L from 'leaflet';
import { Building2, Calendar, Users, MapPin, Activity, Zap, Shield } from 'lucide-react';

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
            stroke={furColor} strokeWidth="3" fill="none" />
      
      {/* Arms */}
      <ellipse cx={size*0.25} cy={size*0.55} rx={size*0.08} ry={size*0.15} fill={furColor} />
      <ellipse cx={size*0.75} cy={size*0.55} rx={size*0.08} ry={size*0.15} fill={furColor} />
      
      {/* Shirt/Clothing */}
      {shirtStyle === 'tshirt' && (
        <>
          <ellipse cx={size/2} cy={size*0.55} rx={size*0.25} ry={size*0.15} fill={shirtColor} />
          <ellipse cx={size/2} cy={size*0.48} rx={size*0.15} ry={size*0.08} fill={shirtColor} />
        </>
      )}
      
      {shirtStyle === 'hoodie' && (
        <>
          <ellipse cx={size/2} cy={size*0.55} rx={size*0.28} ry={size*0.18} fill={shirtColor} />
          <ellipse cx={size/2} cy={size*0.48} rx={size*0.18} ry={size*0.1} fill={shirtColor} />
          <ellipse cx={size/2} cy={size*0.25} rx={size*0.2} ry={size*0.05} fill={shirtColor} />
        </>
      )}
      
      {shirtStyle === 'tank' && (
        <>
          <ellipse cx={size/2} cy={size*0.55} rx={size*0.22} ry={size*0.15} fill={shirtColor} />
          <ellipse cx={size/2} cy={size*0.48} rx={size*0.12} ry={size*0.08} fill={shirtColor} />
        </>
      )}
      
      {/* Accessories */}
      {accessory === 'glasses' && (
        <>
          <circle cx={size*0.42} cy={size*0.32} r={size*0.08} fill="none" stroke="#000" strokeWidth="1" />
          <circle cx={size*0.58} cy={size*0.32} r={size*0.08} fill="none" stroke="#000" strokeWidth="1" />
          <line x1={size*0.5} y1={size*0.32} x2={size*0.5} y2={size*0.32} stroke="#000" strokeWidth="1" />
        </>
      )}
      
      {accessory === 'hat' && (
        <ellipse cx={size/2} cy={size*0.15} rx={size*0.25} ry={size*0.1} fill="#4A90E2" />
      )}
      
      {accessory === 'headphones' && (
        <>
          <ellipse cx={size*0.25} cy={size*0.25} rx={size*0.06} ry={size*0.08} fill="#333" />
          <ellipse cx={size*0.75} cy={size*0.25} rx={size*0.06} ry={size*0.08} fill="#333" />
          <path d={`M${size*0.31},${size*0.2} Q${size/2},${size*0.1} ${size*0.69},${size*0.2}`} 
                stroke="#333" strokeWidth="3" fill="none" />
        </>
      )}
      
      {accessory === 'sunglasses' && (
        <>
          <ellipse cx={size*0.42} cy={size*0.32} rx={size*0.08} ry={size*0.06} fill="#000" />
          <ellipse cx={size*0.58} cy={size*0.32} rx={size*0.08} ry={size*0.06} fill="#000" />
          <line x1={size*0.5} y1={size*0.32} x2={size*0.5} y2={size*0.32} stroke="#000" strokeWidth="1" />
        </>
      )}
      
      {accessory === 'bandana' && (
        <path d={`M${size*0.25},${size*0.25} Q${size/2},${size*0.15} ${size*0.75},${size*0.25} Q${size*0.7},${size*0.35} ${size*0.3},${size*0.35}`} 
              fill="#FF0000" />
      )}
    </g>
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="inline-block">
      {mouseBody}
      
      {/* Real-time indicator */}
      {showRealtimeIndicator && (
        <g>
          <circle cx={size*0.85} cy={size*0.15} r={size*0.08} fill="#3B82F6" opacity="0.9">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
          </circle>
          <text x={size*0.85} y={size*0.18} textAnchor="middle" fontSize={size*0.06} fill="white">⚡</text>
        </g>
      )}
    </svg>
  );
};

export const createMouseIcon = (avatar, isCurrentUser = false, options = {}) => {
  const { 
    isMatch = false, 
    isGymMember = false, 
    isRecommendation = false,
    isRealtime = false 
  } = options;
  
  let size = isCurrentUser ? 50 : 40;
  let borderColor = '#3B82F6'; // Default blue
  let borderWidth = '2px';
  
  if (isCurrentUser) {
    borderColor = '#10B981'; // Green for current user
    borderWidth = '3px';
  } else if (isMatch) {
    borderColor = '#EC4899'; // Pink for matches
    borderWidth = '3px';
  } else if (isGymMember) {
    borderColor = '#F59E0B'; // Orange for gym members
    borderWidth = '2px';
  } else if (isRecommendation) {
    borderColor = '#8B5CF6'; // Purple for recommendations
    borderWidth = '2px';
  }
  
  let mouseHtml;
  
  if (isRecommendation) {
    // Use special waving mouse for recommendations
    mouseHtml = createWavingMouseSVG(size);
  } else {
    // Use regular avatar for matches and gym members
    const avatarSvg = renderMouseAvatar(avatar || {}, size);
    // Convert React element to string for divIcon
    mouseHtml = `<div>${avatarSvg.props.dangerouslySetInnerHTML?.__html || ''}</div>`;
  }
  
  const iconHtml = `
    <div class="relative ${isRealtime ? 'realtime-marker' : ''}" style="width: ${size + 10}px; height: ${size + 10}px;">
      <div style="border: ${borderWidth} solid ${borderColor}; border-radius: 50%; background: white; width: ${size + 4}px; height: ${size + 4}px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); overflow: hidden;">
        ${mouseHtml}
      </div>
      
      ${isCurrentUser ? `
        <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
      ` : ''}
      
      ${isMatch && !isCurrentUser ? `
        <div class="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 border-2 border-white rounded-full flex items-center justify-center">
          <span style="font-size: 10px;">❤️</span>
        </div>
      ` : ''}
      
      ${isGymMember && !isMatch && !isCurrentUser ? `
        <div class="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 border-2 border-white rounded-full flex items-center justify-center">
          <span style="font-size: 10px;">🏋️</span>
        </div>
      ` : ''}
      
      ${isRecommendation && !isMatch && !isGymMember && !isCurrentUser ? `
        <div class="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 border-2 border-white rounded-full flex items-center justify-center">
          <span style="font-size: 10px;">⭐</span>
        </div>
      ` : ''}
      
      ${isRealtime ? `
        <div class="absolute -top-1 -left-1 w-3 h-3 bg-green-400 border border-white rounded-full">
          <div class="w-full h-full bg-green-400 rounded-full animate-ping"></div>
        </div>
      ` : ''}
    </div>
  `;

  try {
    return L.divIcon({
      html: iconHtml,
      className: 'custom-mouse-icon',
      iconSize: [size + 10, size + 10],
      iconAnchor: [(size + 10) / 2, (size + 10) / 2],
      popupAnchor: [0, -(size + 10) / 2]
    });
  } catch (error) {
    console.error('Error creating mouse icon:', error);
    
    // Fallback to a simple div icon
    return L.divIcon({
      html: `<div style="width: ${size}px; height: ${size}px; background: ${borderColor}; border-radius: 50%; border: 2px solid white;"></div>`,
      className: 'custom-mouse-icon-fallback',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  }
};

export const createWavingMouseSVG = (size = 40) => {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="inline-block">
      <defs>
        <!-- Animation for waving arm -->
        <animateTransform id="waveAnimation" 
          attributeName="transform"
          type="rotate"
          values="0 ${size*0.2} ${size*0.55}; -20 ${size*0.2} ${size*0.55}; 0 ${size*0.2} ${size*0.55}"
          dur="1.5s"
          repeatCount="indefinite"/>
      </defs>
      
      <!-- Main body -->
      <ellipse cx="${size/2}" cy="${size*0.6}" rx="${size*0.35}" ry="${size*0.25}" fill="#FFA500" />
      
      <!-- Head -->
      <circle cx="${size/2}" cy="${size*0.35}" r="${size*0.28}" fill="#FFA500" />
      
      <!-- Ears -->
      <circle cx="${size*0.3}" cy="${size*0.2}" r="${size*0.12}" fill="#FFA500" />
      <circle cx="${size*0.7}" cy="${size*0.2}" r="${size*0.12}" fill="#FFA500" />
      <circle cx="${size*0.3}" cy="${size*0.2}" r="${size*0.08}" fill="#FFB6C1" />
      <circle cx="${size*0.7}" cy="${size*0.2}" r="${size*0.08}" fill="#FFB6C1" />
      
      <!-- Eyes - excited/happy -->
      <path d="M${size*0.38},${size*0.29} Q${size*0.42},${size*0.26} ${size*0.46},${size*0.29}" 
            stroke="#000" stroke-width="2" fill="none" />
      <path d="M${size*0.54},${size*0.29} Q${size*0.58},${size*0.26} ${size*0.62},${size*0.29}" 
            stroke="#000" stroke-width="2" fill="none" />
      
      <!-- Nose -->
      <circle cx="${size/2}" cy="${size*0.4}" r="${size*0.03}" fill="#FF69B4" />
      
      <!-- Happy mouth -->
      <path d="M${size*0.46},${size*0.45} Q${size/2},${size*0.5} ${size*0.54},${size*0.45}" 
            stroke="#000" stroke-width="1.5" fill="none" />
      
      <!-- Whiskers -->
      <line x1="${size*0.25}" y1="${size*0.38}" x2="${size*0.35}" y2="${size*0.36}" stroke="#000" stroke-width="1" />
      <line x1="${size*0.25}" y1="${size*0.42}" x2="${size*0.35}" y2="${size*0.42}" stroke="#000" stroke-width="1" />
      <line x1="${size*0.65}" y1="${size*0.36}" x2="${size*0.75}" y2="${size*0.38}" stroke="#000" stroke-width="1" />
      <line x1="${size*0.65}" y1="${size*0.42}" x2="${size*0.75}" y2="${size*0.42}" stroke="#000" stroke-width="1" />
      
      <!-- Tail -->
      <path d="M${size*0.85},${size*0.65} Q${size*0.95},${size*0.5} ${size*0.9},${size*0.35}" 
            stroke="#FFA500" stroke-width="3" fill="none" />
      
      <!-- Non-waving arm -->
      <ellipse cx="${size*0.75}" cy="${size*0.55}" rx="${size*0.08}" ry="${size*0.15}" fill="#FFA500" />
      
      <!-- Waving arm with animation -->
      <g>
        <animateTransform 
          attributeName="transform"
          type="rotate"
          values="0 ${size*0.2} ${size*0.55}; -30 ${size*0.2} ${size*0.55}; 0 ${size*0.2} ${size*0.55}"
          dur="1.5s"
          repeatCount="indefinite"/>
        <ellipse cx="${size*0.2}" cy="${size*0.55}" rx="${size*0.08}" ry="${size*0.15}" fill="#FFA500" />
        <!-- Waving hand -->
        <circle cx="${size*0.15}" cy="${size*0.45}" r="${size*0.06}" fill="#FFA500" />
      </g>
      
      <!-- "Hi!" speech bubble -->
      <g opacity="0.9">
        <!-- Bubble -->
        <ellipse cx="${size*0.8}" cy="${size*0.25}" rx="${size*0.15}" ry="${size*0.1}" fill="#FFFFFF" stroke="#FFA500" stroke-width="1"/>
        <!-- Bubble pointer -->
        <path d="M${size*0.7},${size*0.3} L${size*0.65},${size*0.35} L${size*0.72},${size*0.35} Z" fill="#FFFFFF" stroke="#FFA500" stroke-width="1"/>
        <!-- "Hi!" text -->
        <text x="${size*0.8}" y="${size*0.28}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size*0.08}" font-weight="bold" fill="#FFA500">Hi!</text>
      </g>
    </svg>
  `;
};

// Create enhanced gym icon with type-specific styling
export const createGymIcon = (gym, isRealtime = false) => {
  try {
    const getGymTypeIcon = (type) => {
      switch (type) {
        case 'gym':
          return { icon: '🏋️', color: '#3B82F6', bgColor: '#EBF8FF' };
        case 'community':
          return { icon: '🏘️', color: '#10B981', bgColor: '#ECFDF5' };
        case 'event':
          return { icon: '📅', color: '#F59E0B', bgColor: '#FFFBEB' };
        case 'sport_center':
          return { icon: '⚽', color: '#EF4444', bgColor: '#FEF2F2' };
        case 'other':
          return { icon: '📍', color: '#8B5CF6', bgColor: '#F5F3FF' };
        default:
          return { icon: '🏋️', color: '#3B82F6', bgColor: '#EBF8FF' };
      }
    };

    const typeInfo = getGymTypeIcon(gym.type);
    const verified = gym.verified || gym.isVerified;
    const isNew = gym.isNew;

    const iconHtml = `
      <div class="relative ${isRealtime ? 'realtime-marker' : ''}" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); width: 50px; height: 50px;">
        <div class="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white" 
             style="background-color: ${typeInfo.bgColor}; border-color: ${typeInfo.color};">
          <span style="font-size: 18px; line-height: 1;">${typeInfo.icon}</span>
        </div>
        
        ${verified ? `
          <div class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
              <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" fill="none"/>
            </svg>
          </div>
        ` : ''}
        
        ${isNew ? `
          <div class="absolute -top-2 -left-2 bg-green-500 text-white text-xs px-1 rounded-full" style="font-size: 8px;">
            NEW
          </div>
        ` : ''}
        
        ${isRealtime ? `
          <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-400 border border-white rounded-full">
            <div class="w-full h-full bg-blue-400 rounded-full animate-ping"></div>
          </div>
        ` : ''}
        
        ${gym.memberCount > 0 ? `
          <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 text-xs px-1 rounded-full text-gray-700" style="font-size: 10px;">
            ${gym.memberCount}
          </div>
        ` : ''}
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'custom-gym-icon',
      iconSize: [50, 50],
      iconAnchor: [25, 25],
      popupAnchor: [0, -25]
    });
  } catch (error) {
    console.error('Error creating gym icon:', error);
    
    // Fallback to a simple icon
    return L.divIcon({
      html: `<div style="width: 40px; height: 40px; background: #10B981; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 18px;">🏋️</div>`,
      className: 'custom-gym-icon-fallback',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  }
};

// Create activity indicator for real-time status
export const createActivityIndicator = (status) => {
  const indicators = {
    online: { color: '#10B981', text: 'Online', pulse: true },
    recent: { color: '#F59E0B', text: 'Active', pulse: false },
    today: { color: '#6B7280', text: 'Today', pulse: false },
    offline: { color: '#9CA3AF', text: 'Offline', pulse: false }
  };

  const indicator = indicators[status] || indicators.offline;

  return `
    <div class="flex items-center gap-1">
      <div class="w-2 h-2 rounded-full ${indicator.pulse ? 'animate-pulse' : ''}" 
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