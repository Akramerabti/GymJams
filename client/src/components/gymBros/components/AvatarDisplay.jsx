// components/gymBros/components/AvatarDisplay.jsx
import React, { useState } from 'react';
import { Loader } from 'lucide-react';
import { ImageService } from './ImageUtils';

const AvatarDisplay = ({ 
  avatar, 
  userGender, 
  userId = null,
  size = 90, 
  className = "",
  shouldMirror = false, // Allow manual override
  showLoadingSpinner = true,
  fallbackIcon = null
}) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Determine if image should be mirrored
  const autoMirror = userId ? ImageService.shouldMirrorUser(userId) : false;
  const finalMirror = shouldMirror || autoMirror;
  
  const avatarUrl = ImageService.getAvatarUrl(avatar, userGender, size);
  const fallbackUrl = ImageService.getDefaultAvatar(userGender, size);

  const containerStyle = {
    width: size,
    height: size,
    position: 'relative',
    transform: finalMirror ? 'scaleX(-1)' : 'scaleX(1)'
  };

  const imageStyle = {
    width: size,
    height: size,
    objectFit: 'contain',
    borderRadius: '0',
    background: 'transparent',
    display: loading ? 'none' : 'block'
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setLoading(false);
  };

  return (
    <div className={`relative ${className}`} style={containerStyle}>
      {/* Loading spinner */}
      {loading && showLoadingSpinner && (
        <div className="absolute inset-0 bg-gray-200 rounded-full flex items-center justify-center">
          <Loader className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      )}
      
      {/* Fallback icon for when image fails and no fallback URL */}
      {imageError && !fallbackUrl && fallbackIcon && (
        <div className="absolute inset-0 bg-gray-100 rounded-full flex items-center justify-center">
          {fallbackIcon}
        </div>
      )}
      
      {/* Main avatar image */}
      <img
        src={imageError ? fallbackUrl : avatarUrl}
        alt="Avatar"
        style={imageStyle}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};

export default AvatarDisplay;