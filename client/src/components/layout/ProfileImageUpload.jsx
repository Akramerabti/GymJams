import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Image } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const ProfileImageUpload = ({ currentImage, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // Function to ensure full URL
  const getFullImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${path}`;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log("Fetching profile..."); // Debug log 1
        const response = await api.get('/auth/profile');
        console.log("Profile response:", response.data); // Debug log 2
        
        if (response.data.profileImage) {
          console.log("Setting image URL to:", response.data.profileImage); // Debug log 3
          setImageUrl(response.data.profileImage);
        } else {
          console.log("No profile image found in response"); // Debug log 4
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
        const fullUrl = getFullImageUrl(response.data.profileImage);
        setImageUrl(fullUrl);
        onUploadSuccess(fullUrl);
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
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
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
              crossOrigin="anonymous"  // Add this line
              onError={(e) => {
                console.error('Image load error:', imageUrl);
                e.target.onerror = null; 
                e.target.src = '/fallback-avatar.png'; // Add a fallback image
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Image className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="profileImageUpload"
          />
          <label
            htmlFor="profileImageUpload"
            className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="flex items-center">
              <Image className="w-4 h-4 mr-2" />
              {file ? 'Change Image' : 'Upload Image'}
            </span>
          </label>
        </div>
      </div>

      {file && (
        <Button
          onClick={handleUpload}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Uploading...' : 'Save Image'}
        </Button>
      )}
    </div>
  );
};

export default ProfileImageUpload;