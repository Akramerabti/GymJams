import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Image } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const ProfileImageUpload = ({ currentImage, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(false);
  
    // Debug: Log the currentImage prop
    useEffect(() => {
      console.log('Current Image URL:', currentImage);
    }, [currentImage]);
  
    const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
        // Debug: Log the selected file
        console.log('Selected File:', selectedFile);
  
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
        setPreviewUrl(URL.createObjectURL(selectedFile)); // Preview the image
  
        // Debug: Log the preview URL
        console.log('Preview URL:', URL.createObjectURL(selectedFile));
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
        formData.append('profileImage', file); // Append the file to FormData
  
        // Debug: Log the FormData
        console.log('FormData:', formData);
  
        // Upload the file
        const response = await api.put('/auth/profile', formData, {
          headers: {
            'Content-Type': 'multipart/form-data', // Required for file uploads
          },
        });
  
        // Debug: Log the response
        console.log('Upload Response:', response);
  
        // Notify parent component of successful upload
        onUploadSuccess(response.data.profileImage);
  
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
          {/* Circular Profile Image */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
            ) : currentImage ? (
              <img
                src={currentImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <Image className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
  
          {/* Upload Button */}
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
  
        {/* Save Button */}
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