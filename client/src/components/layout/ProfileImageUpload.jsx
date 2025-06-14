import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Image, Camera } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { getPlaceholderUrl, getFallbackAvatarUrl } from '../../utils/imageUtils';

const ProfileImageUpload = ({ currentImage, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);  const [imageUrl, setImageUrl] = useState('');
  // Define the base URL
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  // Get fallback image URL from centralized function
  const fallbackAvatarUrl = getFallbackAvatarUrl();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        console.log('Full profile response:', response.data);
        if (response.data.profileImage) {
          console.log('Profile image URL received:', response.data.profileImage);
          console.log('Profile image URL length:', response.data.profileImage.length);
          console.log('Profile image URL type:', typeof response.data.profileImage);
          setImageUrl(response.data.profileImage);
        } else {
          console.log('No profile image in response');
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

      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };
  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first!');
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Starting profile image upload...');
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await api.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Upload response:', response.data);

      if (response.data.profileImage) {
        // Construct the full URL if it's a relative path
        const fullImageUrl = response.data.profileImage.startsWith('http')
          ? response.data.profileImage
          : `${baseUrl}${response.data.profileImage}`;

        console.log('🎯 New profile image URL:', fullImageUrl);
        setImageUrl(fullImageUrl);
        onUploadSuccess(fullImageUrl);
      }

      setFile(null);
      setPreviewUrl('');
      toast.success('Profile image uploaded successfully!');
    } catch (error) {
      console.error('❌ Upload failed:', error);
      console.error('❌ Upload error details:', error.response?.data);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile preview"
              className="w-full h-full object-cover"
            />          ) : (
            <img
              src={imageUrl || fallbackAvatarUrl}
              alt="Profile"
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              onLoad={(e) => {
                console.log('✅ Image loaded successfully:', e.target.src);
              }}
              onError={(e) => {
                console.error('❌ Image load error:', e.target.src);
                console.error('❌ This likely means the file doesn\'t exist in Supabase storage');
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = fallbackAvatarUrl; // Use fallback image URL
                
                // If this is a Supabase URL that failed, clear it from state
                if (e.target.src.includes('supabase.co')) {
                  console.log('🧹 Clearing broken Supabase URL from state');
                  setImageUrl('');
                }
              }}
            />
          )}
        </div>

        {/* Camera Icon for Mobile */}
        <label
          htmlFor="profileImageUpload"
          className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-3 cursor-pointer hover:bg-blue-600 transition-colors shadow-md"
          style={{ touchAction: 'manipulation' }} // Ensure touch events work properly
        >
          <Camera className="w-5 h-5 text-white" />
          <input
            id="profileImageUpload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            style={{ display: 'none' }} // Ensure the input is hidden but accessible
          />
        </label>
      </div>

      {file && (
        <Button
          onClick={handleUpload}
          disabled={loading}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
          style={{ touchAction: 'manipulation' }} // Ensure touch events work properly
        >
          {loading ? 'Uploading...' : 'Save Image'}
        </Button>
      )}
    </div>
  );
};

export default ProfileImageUpload;