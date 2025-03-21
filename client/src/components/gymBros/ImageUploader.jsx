
import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Loader, Camera, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import gymbrosService from '../../services/gymbros.service';

const ImageUploader = React.forwardRef(({ images = [], onImagesChange, maxPhotos = 6 }, ref) => {
  const [localImages, setLocalImages] = useState([]);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  // Initialize localImages from props
  useEffect(() => {
    if (images && images.length > 0) {
      // Filter out any blob URLs from the server data
      const serverUrls = images.filter(url => url && !url.startsWith('blob:'));
      setLocalImages(serverUrls);
    }
  }, [images]);

  // Update parent when localImages change
  useEffect(() => {
    if (JSON.stringify(localImages) !== JSON.stringify(images)) {
      onImagesChange(localImages);
    }
  }, [localImages, onImagesChange, images]);

  // Helper to format display URL
  const getDisplayUrl = (url) => {
    if (!url) return null;
    
    if (url.startsWith('blob:')) {
      return url;
    } else if (url.startsWith('http')) {
      return url;
    } else {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    
    // Check if adding would exceed the max
    if (localImages.length + files.length > maxPhotos) {
      toast.error(`You can only have ${maxPhotos} photos max`);
      return;
    }
    
    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    // Create blob URLs for preview
    const newBlobUrls = validFiles.map(file => URL.createObjectURL(file));
    
    // Update local state with blob URLs for immediate display
    setLocalImages(prev => [...prev, ...newBlobUrls]);
    
    // Store the actual files for later upload
    setPendingUploads(prev => [...prev, ...validFiles]);
  };

  // Handle image removal
  const handleRemoveImage = (index) => {
    const updatedImages = [...localImages];
    const removedUrl = updatedImages[index];
    
    // If it's a blob URL, revoke it to free up memory
    if (removedUrl && removedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(removedUrl);
      
      // Also remove from pending uploads if it exists
      // This is approximate since we don't have a direct mapping
      if (index < pendingUploads.length) {
        setPendingUploads(prev => prev.filter((_, i) => i !== index));
      }
    }
    
    // Remove from local state
    updatedImages.splice(index, 1);
    setLocalImages(updatedImages);
  };

  // Expose uploadAllImages method via ref
  React.useImperativeHandle(ref, () => ({
    uploadAllImages: async () => {
      try {
        console.log('Starting upload of all pending images...');
        
        // Only proceed if there are files to upload
        if (pendingUploads.length === 0) {
          console.log('No pending images to upload');
          return { uploadedUrls: [], failedIndices: [] };
        }
        
        console.log(`Uploading ${pendingUploads.length} images...`);
        setIsUploading(true);
        
        // Upload all files at once
        const result = await gymbrosService.uploadProfileImages(pendingUploads);
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to upload images');
        }
        
        console.log('Upload success, server returned:', result.imageUrls);
        
        // Get all non-blob server URLs from localImages
        const existingServerUrls = localImages.filter(url => url && !url.startsWith('blob:'));
        
        // Combine existing server URLs with newly uploaded ones
        const allServerUrls = [...existingServerUrls, ...result.imageUrls];
        
        // Update local state to replace blob URLs with server URLs
        setLocalImages(allServerUrls);
        
        // Reset pending uploads since they're now processed
        setPendingUploads([]);
        
        return { 
          uploadedUrls: allServerUrls,
          failedIndices: [] 
        };
      } catch (error) {
        console.error('Error uploading images:', error);
        // Mark all as failed
        const failedIndices = pendingUploads.map((_, index) => index);
        return { 
          uploadedUrls: localImages.filter(url => url && !url.startsWith('blob:')), 
          failedIndices 
        };
      } finally {
        setIsUploading(false);
      }
    },
    
    // Method to check if there are pending uploads
    hasPendingUploads: () => pendingUploads.length > 0
  }));

  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Display current images */}
        {localImages.map((image, index) => (
          <div 
            key={index}
            className="relative aspect-[7/10] border border-gray-300 rounded-lg overflow-hidden bg-gray-100"
          >
            <img 
              src={getDisplayUrl(image)}
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error(`Image load error: ${image}`);
                e.target.src = "/api/placeholder/400/600";
              }}
            />
            
            {/* Remove button */}
            <button
              onClick={() => handleRemoveImage(index)}
              className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
            >
              <X size={16} className="text-red-500" />
            </button>
            
            {/* Primary image badge for first image */}
            {index === 0 && (
              <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                Primary
              </div>
            )}
          </div>
        ))}
        
        {/* Add photo button if under limit */}
        {localImages.length < maxPhotos && (
          <label className="aspect-[7/10] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            {isUploading ? (
              <div className="flex flex-col items-center text-gray-400">
                <Loader size={32} className="mb-2 animate-spin" />
                <span className="text-sm">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <Upload size={32} className="mb-2" />
                <span className="text-sm">Add Photo</span>
              </div>
            )}
          </label>
        )}
      </div>
      
      {/* Show requirements message */}
      {localImages.length < 2 && (
        <p className="text-sm text-red-500 mb-2">Please upload at least 2 images</p>
      )}
      
      {/* Show pending uploads notice */}
      {pendingUploads.length > 0 && (
        <p className="text-sm text-blue-500 mb-2">
          {pendingUploads.length} image(s) will be uploaded when you complete your profile
        </p>
      )}
    </div>
  );
});

export default ImageUploader;