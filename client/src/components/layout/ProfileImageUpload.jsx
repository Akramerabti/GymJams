import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Image, Camera } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { getPlaceholderUrl, getFallbackAvatarUrl } from '../../utils/imageUtils';

const ProfileImageUpload = ({ currentImage, onUploadSuccess, onShowCropModal }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  // Define the base URL
  const baseUrl = import.meta.env.VITE_API_URL || 'https://gymtonic.onrender.com';
  // Get fallback image URL from centralized function
  const fallbackAvatarUrl = getFallbackAvatarUrl();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        if (response.data.profileImage) {
          setImageUrl(response.data.profileImage);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Only image files (JPEG, PNG, GIF, WEBP) are allowed.');
        return;
      }

      // Validate file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB.');
        return;
      }

      // Create URL for cropping modal and pass to parent
      const imageUrl = URL.createObjectURL(selectedFile);
      
      if (onShowCropModal) {
        onShowCropModal({
          image: imageUrl,
          onCropComplete: (croppedImageBlob) => handleCropComplete(croppedImageBlob, imageUrl),
          onClose: () => handleCropCancel(imageUrl)
        });
      }
    }
  };

  const handleCropComplete = (croppedImageBlob, originalImageUrl) => {
    // Convert blob to file
    const croppedFile = new File([croppedImageBlob], 'cropped-image.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
    
    setFile(croppedFile);
    setPreviewUrl(URL.createObjectURL(croppedImageBlob));
    
    // Clean up the temporary URL
    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl);
    }
  };

  const handleCropCancel = (originalImageUrl) => {
    // Clean up the temporary URL
    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first!');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await api.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.profileImage) {
        // Construct the full URL if it's a relative path
        const fullImageUrl = response.data.profileImage.startsWith('http')
          ? response.data.profileImage
          : `${baseUrl}${response.data.profileImage}`;

        setImageUrl(fullImageUrl);
        onUploadSuccess(fullImageUrl);
      }

      setFile(null);
      setPreviewUrl('');
      toast.success('Profile image uploaded successfully!');
    } catch (error) {
      console.error('❌ Upload failed:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Gradient background effects - reduced size for mobile */}
        <div className="absolute -inset-3 md:-inset-4 bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 rounded-full blur-md opacity-75 animate-pulse"></div>
        <div className="absolute -inset-1.5 md:-inset-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 rounded-full blur-sm opacity-60"></div>
        
        {/* Main profile image container - responsive sizing */}
        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={imageUrl || fallbackAvatarUrl}
              alt="Profile"
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              onError={(e) => {
                console.error('❌ Image load error:', e.target.src);
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = fallbackAvatarUrl; // Use fallback image URL
                
                // If this is a Supabase URL that failed, clear it from state
                if (e.target.src.includes('supabase.co')) {
                  setImageUrl('');
                }
              }}
            />
          )}
        </div>

        {/* Camera Icon - responsive sizing and positioning */}
        <label
          htmlFor="profileImageUpload"
          className="absolute -bottom-1 -right-1 md:bottom-0 md:right-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-2 md:p-3 cursor-pointer hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
          style={{ touchAction: 'manipulation' }}
          onClick={() => {
            // Clear the file input value to allow selecting the same file again
            const input = document.getElementById('profileImageUpload');
            if (input) {
              input.value = '';
            }
            // Clean up previous preview URL to prevent memory leaks
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
            }
            // Clear current file and preview when clicking to change image
            setFile(null);
            setPreviewUrl('');
          }}
        >
          <Camera className="w-4 h-4 md:w-5 md:h-5 text-white" />
          <input
            id="profileImageUpload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {file && (
        <Button
          onClick={handleUpload}
          disabled={loading}
          className="mt-3 md:mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium text-sm md:text-base px-4 md:px-6 py-2 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          style={{ touchAction: 'manipulation' }}
        >
          {loading ? 'Uploading...' : 'Save Image'}
        </Button>
      )}
    </div>
  );
};

export default ProfileImageUpload;