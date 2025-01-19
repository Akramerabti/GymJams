import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Image, Camera } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const ProfileImageUpload = ({ currentImage, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        if (response.data.profileImage) {
        console.log('Profile image:', response.data.profileImage);
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
      const formData = new FormData();
      formData.append('profileImage', file);
  
      const response = await api.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      if (response.data.profileImage) {
        // Construct the full URL if it's a relative path
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
      console.error('Upload failed:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile Preview"
              className="w-full h-full object-cover"
            />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Profile"
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              onError={(e) => {
                console.error('Image load error:', imageUrl);
                e.target.onerror = null;
                e.target.src = '/fallback-avatar.png';
              }}
            />
          ) : (
            <div className="w-full h-full bg-blue-50 flex items-center justify-center">
              <Image className="w-8 h-8 text-blue-300" />
            </div>
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