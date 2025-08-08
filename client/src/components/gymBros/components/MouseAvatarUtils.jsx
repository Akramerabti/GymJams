import L from 'leaflet';
import React from 'react';

export const renderMouseAvatar = (avatar, size = 120) => {
  const mood = avatar?.mood || 'happy';
  const eyeType = avatar?.eyes || 'normal';
  
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-lg">
      {/* Shadow */}
      <ellipse cx="50" cy="95" rx="20" ry="3" fill="#000" opacity="0.2" />
      
      {/* Tail */}
      <path 
        d="M 25 75 Q 10 70 5 80 Q 0 85 10 85 Q 15 82 20 78" 
        stroke={avatar?.furColor || '#8B4513'} 
        strokeWidth="6" 
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Mouse Body */}
      <ellipse cx="50" cy="65" rx="25" ry="30" fill={avatar?.furColor || '#8B4513'} />
      
      {/* Body highlight */}
      <ellipse cx="45" cy="60" rx="12" ry="15" fill={avatar?.furColor || '#8B4513'} opacity="0.3" />
      
      {/* Mouse Head */}
      <circle cx="50" cy="35" r="20" fill={avatar?.furColor || '#8B4513'} />
      
      {/* Head highlight */}
      <ellipse cx="45" cy="30" rx="8" ry="10" fill={avatar?.furColor || '#8B4513'} opacity="0.3" />
      
      {/* Ears */}
      <circle cx="35" cy="25" r="10" fill={avatar?.furColor || '#8B4513'} />
      <circle cx="65" cy="25" r="10" fill={avatar?.furColor || '#8B4513'} />
      
      {/* Inner ears */}
      <circle cx="35" cy="25" r="6" fill="#FFC0CB" />
      <circle cx="65" cy="25" r="6" fill="#FFC0CB" />
      
      {/* Eyes based on mood */}
      {renderEyes(mood, eyeType)}
      
      {/* Nose */}
      <ellipse cx="50" cy="42" rx="3" ry="2" fill="#FF69B4" />
      
      {/* Mouth based on mood */}
      {renderMouth(mood)}
      
      {/* Whiskers */}
      <line x1="30" y1="40" x2="20" y2="38" stroke="#000" strokeWidth="0.5" opacity="0.5" />
      <line x1="30" y1="43" x2="20" y2="43" stroke="#000" strokeWidth="0.5" opacity="0.5" />
      <line x1="70" y1="40" x2="80" y2="38" stroke="#000" strokeWidth="0.5" opacity="0.5" />
      <line x1="70" y1="43" x2="80" y2="43" stroke="#000" strokeWidth="0.5" opacity="0.5" />
      
      {/* Shirt */}
      {avatar?.shirtStyle !== 'none' && renderShirt(avatar?.shirtStyle, avatar?.shirtColor)}
      
      {/* Pants */}
      <path 
        d="M 32 72 L 32 87 L 40 87 L 42 78 L 50 78 L 58 78 L 60 87 L 68 87 L 68 72 Z" 
        fill={avatar?.pants || '#1F2937'} 
      />
      
      {/* Arms */}
      <ellipse cx="28" cy="60" rx="5" ry="12" fill={avatar?.furColor || '#8B4513'} transform="rotate(-20 28 60)" />
      <ellipse cx="72" cy="60" rx="5" ry="12" fill={avatar?.furColor || '#8B4513'} transform="rotate(20 72 60)" />
      
      {/* Paws */}
      <circle cx="26" cy="70" r="4" fill={avatar?.furColor || '#8B4513'} />
      <circle cx="74" cy="70" r="4" fill={avatar?.furColor || '#8B4513'} />
      
      {/* Feet */}
      <ellipse cx="40" cy="90" rx="6" ry="4" fill={avatar?.furColor || '#8B4513'} />
      <ellipse cx="60" cy="90" rx="6" ry="4" fill={avatar?.furColor || '#8B4513'} />
      
      {/* Accessories */}
      {renderAccessory(avatar?.accessory, avatar?.shirtColor)}
    </svg>
  );
};

const renderEyes = (mood, eyeType) => {
  switch(mood) {
    case 'excited':
      return (
        <>
          <circle cx="43" cy="35" r="4" fill="#000" />
          <circle cx="57" cy="35" r="4" fill="#000" />
          <circle cx="44" cy="33" r="2" fill="#FFF" />
          <circle cx="58" cy="33" r="2" fill="#FFF" />
          {/* Sparkles */}
          <circle cx="41" cy="32" r="1" fill="#FFF" opacity="0.8" />
          <circle cx="59" cy="32" r="1" fill="#FFF" opacity="0.8" />
        </>
      );
    case 'cool':
      return (
        <>
          {/* Sunglasses handled in accessories */}
          <circle cx="43" cy="35" r="3" fill="#000" />
          <circle cx="57" cy="35" r="3" fill="#000" />
        </>
      );
    case 'determined':
      return (
        <>
          <path d="M 40 33 L 46 35 L 40 37" fill="#000" />
          <path d="M 60 33 L 54 35 L 60 37" fill="#000" />
        </>
      );
    case 'neutral':
      return (
        <>
          <ellipse cx="43" cy="35" rx="2" ry="3" fill="#000" />
          <ellipse cx="57" cy="35" rx="2" ry="3" fill="#000" />
        </>
      );
    default: // happy
      return (
        <>
          <circle cx="43" cy="35" r="3" fill="#000" />
          <circle cx="57" cy="35" r="3" fill="#000" />
          <circle cx="44" cy="34" r="1" fill="#FFF" />
          <circle cx="58" cy="34" r="1" fill="#FFF" />
        </>
      );
  }
};

const renderMouth = (mood) => {
  switch(mood) {
    case 'excited':
      return <path d="M 42 45 Q 50 50 58 45" stroke="#000" strokeWidth="1.5" fill="none" />;
    case 'determined':
      return <line x1="45" y1="46" x2="55" y2="46" stroke="#000" strokeWidth="1.5" />;
    case 'neutral':
      return <line x1="46" y1="45" x2="54" y2="45" stroke="#000" strokeWidth="1" />;
    default: // happy
      return <path d="M 44 44 Q 50 47 56 44" stroke="#000" strokeWidth="1" fill="none" />;
  }
};

const renderShirt = (style, color) => {
  switch(style) {
    case 'hoodie':
      return (
        <>
          <rect x="28" y="48" width="44" height="28" rx="3" fill={color} />
          <path d="M 40 25 Q 50 20 60 25" stroke={color} strokeWidth="3" fill="none" />
          {/* Hood strings */}
          <line x1="45" y1="50" x2="45" y2="55" stroke="#FFF" strokeWidth="1" opacity="0.5" />
          <line x1="55" y1="50" x2="55" y2="55" stroke="#FFF" strokeWidth="1" opacity="0.5" />
          {/* Pocket */}
          <rect x="42" y="62" width="16" height="8" rx="1" fill="#000" opacity="0.2" />
        </>
      );
    case 'tank':
      return (
        <>
          <rect x="35" y="52" width="30" height="23" rx="2" fill={color} />
          {/* Tank straps */}
          <rect x="35" y="48" width="4" height="6" fill={color} />
          <rect x="61" y="48" width="4" height="6" fill={color} />
        </>
      );
    case 'tshirt':
    default:
      return (
        <>
          <rect x="30" y="50" width="40" height="25" rx="3" fill={color} />
          {/* Sleeves */}
          <ellipse cx="28" cy="55" rx="6" ry="8" fill={color} />
          <ellipse cx="72" cy="55" rx="6" ry="8" fill={color} />
        </>
      );
  }
};

const renderAccessory = (accessory, shirtColor) => {
  switch(accessory) {
    case 'glasses':
      return (
        <>
          <circle cx="43" cy="35" r="6" fill="none" stroke="#000" strokeWidth="1.5" />
          <circle cx="57" cy="35" r="6" fill="none" stroke="#000" strokeWidth="1.5" />
          <line x1="49" y1="35" x2="51" y2="35" stroke="#000" strokeWidth="1.5" />
          <line x1="37" y1="35" x2="30" y2="33" stroke="#000" strokeWidth="1.5" />
          <line x1="63" y1="35" x2="70" y2="33" stroke="#000" strokeWidth="1.5" />
        </>
      );
    case 'sunglasses':
      return (
        <>
          <ellipse cx="43" cy="35" rx="7" ry="6" fill="#000" />
          <ellipse cx="57" cy="35" rx="7" ry="6" fill="#000" />
          <line x1="50" y1="35" x2="50" y2="35" stroke="#000" strokeWidth="2" />
          <line x1="36" y1="35" x2="30" y2="33" stroke="#000" strokeWidth="1.5" />
          <line x1="64" y1="35" x2="70" y2="33" stroke="#000" strokeWidth="1.5" />
        </>
      );
    case 'hat':
      return (
        <>
          <ellipse cx="50" cy="20" rx="22" ry="8" fill="#FF0000" />
          <rect x="35" y="15" width="30" height="8" fill="#FF0000" />
          <rect x="45" y="19" width="10" height="2" fill="#FFF" opacity="0.5" />
        </>
      );
    case 'headphones':
      return (
        <>
          <rect x="28" y="30" width="8" height="12" rx="4" fill="#000" />
          <rect x="64" y="30" width="8" height="12" rx="4" fill="#000" />
          <path d="M 35 30 Q 50 15 65 30" stroke="#000" strokeWidth="3" fill="none" />
          <circle cx="32" cy="36" r="1" fill="#FFF" opacity="0.5" />
          <circle cx="68" cy="36" r="1" fill="#FFF" opacity="0.5" />
        </>
      );
    case 'bandana':
      return (
        <>
          <path d="M 30 22 Q 50 18 70 22 L 70 28 Q 50 30 30 28 Z" fill="#FF0000" />
          <circle cx="40" cy="24" r="1" fill="#FFF" />
          <circle cx="50" cy="23" r="1" fill="#FFF" />
          <circle cx="60" cy="24" r="1" fill="#FFF" />
        </>
      );
    default:
      return null;
  }
};

export const createMouseIcon = (avatar, isCurrentUser = false) => {
  const size = isCurrentUser ? 50 : 40;
  const svgString = `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      ${isCurrentUser ? `
        <circle cx="50" cy="50" r="48" fill="#3B82F6" opacity="0.2" />
        <circle cx="50" cy="50" r="48" fill="none" stroke="#3B82F6" stroke-width="2" opacity="0.5" stroke-dasharray="5,5">
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="10s"
            repeatCount="indefinite"/>
        </circle>
      ` : ''}
      
      <!-- Shadow -->
      <ellipse cx="50" cy="95" rx="15" ry="2" fill="#000" opacity="0.15" />
      
      <!-- Tail -->
      <path d="M 25 75 Q 10 70 5 80 Q 0 85 10 85 Q 15 82 20 78" 
            stroke="${avatar?.furColor || '#8B4513'}" 
            stroke-width="4" 
            fill="none"
            stroke-linecap="round" />
      
      <!-- Body -->
      <ellipse cx="50" cy="65" rx="18" ry="22" fill="${avatar?.furColor || '#8B4513'}" />
      
      <!-- Head -->
      <circle cx="50" cy="35" r="15" fill="${avatar?.furColor || '#8B4513'}" />
      
      <!-- Ears -->
      <circle cx="38" cy="27" r="7" fill="${avatar?.furColor || '#8B4513'}" />
      <circle cx="62" cy="27" r="7" fill="${avatar?.furColor || '#8B4513'}" />
      <circle cx="38" cy="27" r="4" fill="#FFC0CB" />
      <circle cx="62" cy="27" r="4" fill="#FFC0CB" />
      
      <!-- Eyes -->
      <circle cx="45" cy="35" r="2" fill="#000" />
      <circle cx="55" cy="35" r="2" fill="#000" />
      <circle cx="46" cy="34" r="0.5" fill="#FFF" />
      <circle cx="56" cy="34" r="0.5" fill="#FFF" />
      
      <!-- Nose -->
      <ellipse cx="50" cy="40" rx="2" ry="1.5" fill="#FF69B4" />
      
      <!-- Shirt -->
      ${avatar?.shirtStyle !== 'none' ? `
        <rect x="38" y="50" width="24" height="18" rx="2" fill="${avatar?.shirtColor || '#3B82F6'}" />
      ` : ''}
      
      <!-- Pants -->
      <path d="M 40 65 L 40 75 L 44 75 L 46 70 L 50 70 L 54 70 L 56 75 L 60 75 L 60 65 Z" 
            fill="${avatar?.pants || '#1F2937'}" />
      
      <!-- Arms -->
      <ellipse cx="33" cy="55" rx="3" ry="8" fill="${avatar?.furColor || '#8B4513'}" transform="rotate(-15 33 55)" />
      <ellipse cx="67" cy="55" rx="3" ry="8" fill="${avatar?.furColor || '#8B4513'}" transform="rotate(15 67 55)" />
      
      <!-- Accessories -->
      ${avatar?.accessory === 'glasses' ? `
        <circle cx="45" cy="35" r="4" fill="none" stroke="#000" stroke-width="1" />
        <circle cx="55" cy="35" r="4" fill="none" stroke="#000" stroke-width="1" />
        <line x1="49" y1="35" x2="51" y2="35" stroke="#000" stroke-width="1" />
      ` : ''}
      
      ${avatar?.accessory === 'hat' ? `
        <ellipse cx="50" cy="22" rx="16" ry="6" fill="#FF0000" />
        <rect x="38" y="18" width="24" height="6" fill="#FF0000" />
      ` : ''}
      
      ${avatar?.accessory === 'sunglasses' ? `
        <ellipse cx="45" cy="35" rx="5" ry="4" fill="#000" />
        <ellipse cx="55" cy="35" rx="5" ry="4" fill="#000" />
        <line x1="50" y1="35" x2="50" y2="35" stroke="#000" stroke-width="1" />
      ` : ''}
    </svg>
  `;

  return L.divIcon({
    html: svgString,
    className: 'custom-mouse-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 5], // Bottom center anchor
    popupAnchor: [0, -size + 5]
  });
};

// Create gym building icon
export const createGymIcon = (gym) => {
  const svgString = `
    <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- Building shadow -->
      <ellipse cx="50" cy="90" rx="25" ry="4" fill="#000" opacity="0.2" />
      
      <!-- Main building -->
      <rect x="25" y="40" width="50" height="50" fill="#4A5568" stroke="#2D3748" stroke-width="2" />
      
      <!-- Roof -->
      <polygon points="20,40 50,25 80,40" fill="#E53E3E" stroke="#C53030" stroke-width="1" />
      
      <!-- Windows -->
      <rect x="30" y="50" width="8" height="8" fill="#FED7D7" />
      <rect x="42" y="50" width="8" height="8" fill="#FED7D7" />
      <rect x="54" y="50" width="8" height="8" fill="#FED7D7" />
      <rect x="66" y="50" width="8" height="8" fill="#FED7D7" />
      
      <!-- Door -->
      <rect x="45" y="70" width="10" height="20" fill="#8B4513" />
      <circle cx="52" cy="80" r="1" fill="#FFD700" />
      
      <!-- Gym sign -->
      <rect x="35" y="30" width="30" height="8" fill="#3182CE" />
      <text x="50" y="36" text-anchor="middle" fill="white" font-size="6" font-weight="bold">GYM</text>
      
      <!-- Dumbbell icon -->
      <g transform="translate(50,75) scale(0.3)">
        <rect x="-15" y="-2" width="30" height="4" fill="#2D3748" />
        <rect x="-18" y="-6" width="6" height="12" fill="#4A5568" />
        <rect x="12" y="-6" width="6" height="12" fill="#4A5568" />
      </g>
      
      <!-- Activity radius indicator -->
      <circle cx="50" cy="50" r="35" fill="none" stroke="#3182CE" stroke-width="1" opacity="0.3" stroke-dasharray="3,3" />
    </svg>
  `;

  return L.divIcon({
    html: svgString,
    className: 'custom-gym-icon',
    iconSize: [60, 60],
    iconAnchor: [30, 60], // Bottom center
    popupAnchor: [0, -60]
  });
};

// Helper function to generate random avatar
export const generateRandomAvatar = () => {
  const furColors = ['#8B4513', '#6B7280', '#F3F4F6', '#1F2937', '#D97706', '#FEF3C7'];
  const shirtColors = ['#3B82F6', '#EF4444', '#10B981', '#8B5CF6', '#EC4899', '#000000'];
  const shirtStyles = ['tshirt', 'hoodie', 'tank', 'none'];
  const accessories = ['none', 'glasses', 'hat', 'headphones', 'sunglasses', 'bandana'];
  const pantsColors = ['#1F2937', '#3B82F6', '#000000', '#D2B48C', '#DC2626', '#059669'];
  const moods = ['happy', 'excited', 'neutral', 'cool', 'determined'];

  return {
    furColor: furColors[Math.floor(Math.random() * furColors.length)],
    shirtColor: shirtColors[Math.floor(Math.random() * shirtColors.length)],
    shirtStyle: shirtStyles[Math.floor(Math.random() * shirtStyles.length)],
    accessory: accessories[Math.floor(Math.random() * accessories.length)],
    pants: pantsColors[Math.floor(Math.random() * pantsColors.length)],
    mood: moods[Math.floor(Math.random() * moods.length)],
    eyes: 'normal'
  };
};

// Helper function to validate avatar data
export const validateAvatar = (avatar) => {
  const defaults = {
    furColor: '#8B4513',
    shirtColor: '#3B82F6',
    shirtStyle: 'tshirt',
    accessory: 'none',
    pants: '#1F2937',
    mood: 'happy',
    eyes: 'normal'
  };

  return {
    ...defaults,
    ...avatar
  };
};