import React, { useState, useCallback, useEffect, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, X, Crop, Loader } from 'lucide-react';
import gymbrosService from '../../services/gymbros.service';
import { toast } from 'sonner';

const ImageUploader = ({ images, onImagesChange }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Track local image state - these can be blob URLs or server URLs
  const [localImages, setLocalImages] = useState([]);
  
  // Initialize local images from props
  useEffect(() => {
    setLocalImages(images || []);
  }, []);

  // Update parent when local images change
  useEffect(() => {
    onImagesChange(localImages);
  }, [localImages, onImagesChange]);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  // Convert image to blob for cropping
  const convertToBlob = async (imageUrl) => {
    // Skip conversion for blob URLs
    if (imageUrl.startsWith('blob:')) {
      return imageUrl;
    }

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error converting image to blob:', error);
      return imageUrl;
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    if (files.length + localImages.length > 6) {
      toast.error('You can only upload up to 6 images.');
      return;
    }

    setIsUploading(true);
    
    try {
      // Process each file
      const uploadPromises = files.map(async (file) => {
        // Create a local blob URL for preview
        const localUrl = URL.createObjectURL(file);
        
        // Create a FormData object for the file
        const formData = new FormData();
        formData.append('images', file);
        
        // Upload to server
        try {
          const response = await gymbrosService.uploadProfileImages([file]);
          
          if (response.success && response.imageUrls && response.imageUrls.length > 0) {
            // Return the server URL (for persistence) but keep a reference to the blob URL for display
            return {
              localUrl, // For display
              serverUrl: response.imageUrls[0], // For storage
              file // Keep reference to original file
            };
          } else {
            throw new Error('Upload failed');
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          toast.error(`Failed to upload ${file.name}`);
          // Return just the local URL in case of error
          return { localUrl, file };
        }
      });
      
      // Wait for all uploads to complete
      const uploadedImages = await Promise.all(uploadPromises);
      
      // Add new images to the existing ones
      const newImages = [
        ...localImages, 
        ...uploadedImages.map(img => img.serverUrl || img.localUrl)
      ];
      
      setLocalImages(newImages);
      onImagesChange(newImages);
      
      toast.success(`${uploadedImages.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Error handling image upload:', error);
      toast.error('Failed to process uploads');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropSave = async () => {
    if (!croppedArea || currentImageIndex === null) return;
    
    try {
      // Get the current image URL (could be blob or server URL)
      const imageUrl = localImages[currentImageIndex];
      
      // Convert to blob if it's a server URL
      const blobUrl = await convertToBlob(imageUrl);
      
      // Create a canvas for cropping
      const canvas = document.createElement('canvas');
      const image = new Image();
      
      // Set crossOrigin to handle CORS issues with remote images
      image.crossOrigin = "anonymous";
      image.src = blobUrl;
      
      // Wait for image to load
      await new Promise((resolve) => {
        image.onload = resolve;
      });
      
      // Set canvas dimensions to match crop area
      canvas.width = croppedArea.width;
      canvas.height = croppedArea.height;
      const ctx = canvas.getContext('2d');
      
      // Calculate scale factors
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      // Draw the cropped image on the canvas
      ctx.drawImage(
        image,
        croppedArea.x * scaleX,
        croppedArea.y * scaleY,
        croppedArea.width * scaleX,
        croppedArea.height * scaleY,
        0,
        0,
        croppedArea.width,
        croppedArea.height
      );
      
      // Convert canvas to blob
      const croppedBlob = await new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/jpeg');
      });
      
      // Create a File object from the blob
      const croppedFile = new File([croppedBlob], `cropped-image-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });
      
      // Upload cropped image to server
      setIsUploading(true);
      
      try {
        // Upload the cropped image
        const response = await gymbrosService.uploadProfileImages([croppedFile]);
        
        if (response.success && response.imageUrls && response.imageUrls.length > 0) {
          // Replace the image in the local array
          const updatedImages = [...localImages];
          updatedImages[currentImageIndex] = response.imageUrls[0];
          
          setLocalImages(updatedImages);
          onImagesChange(updatedImages);
          
          toast.success('Image cropped and saved successfully');
        } else {
          throw new Error('Failed to upload cropped image');
        }
      } catch (error) {
        console.error('Error uploading cropped image:', error);
        toast.error('Failed to save cropped image');
      } finally {
        setIsUploading(false);
      }
      
      // Clean up and reset state
      setCurrentImageIndex(null);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error saving cropped image:', error);
      toast.error('Failed to save cropped image');
    }
  };

  const handleRemoveImage = async (index) => {
    // Get the image URL
    const imageUrl = localImages[index];
    
    // Don't attempt to delete blob URLs from server
    if (!imageUrl.startsWith('blob:')) {
      try {
        // Extract the image ID from the URL
        const imageId = imageUrl.split('/').pop();
        
        // Call the API to delete the image
        await gymbrosService.deleteProfileImage(imageId);
        toast.success('Image deleted successfully');
      } catch (error) {
        console.error('Error deleting image:', error);
        toast.error('Failed to delete image from server');
      }
    }
    
    // Update local state regardless of server operation result
    const updatedImages = localImages.filter((_, i) => i !== index);
    setLocalImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const handleEditImage = async (index) => {
    // Convert server URL to blob if needed for editing
    const imageUrl = localImages[index];
    try {
      const blobUrl = await convertToBlob(imageUrl);
      setCurrentImageIndex(index);
      setIsEditing(true);
    } catch (error) {
      console.error('Error preparing image for editing:', error);
      toast.error('Failed to prepare image for editing');
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {isEditing && currentImageIndex !== null ? (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg h-full max-h-[90vh] flex flex-col relative">
            <div className="h-[80%] relative">
              <Cropper
                image={localImages[currentImageIndex]}
                crop={crop}
                zoom={zoom}
                aspect={7 / 10}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                style={{ containerStyle: { height: '100%', width: '100%' } }}
              />
            </div>
            
            {/* Controls positioned at the bottom */}
            <div className="p-4 bg-white flex flex-col">
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Zoom</p>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropSave}
                  disabled={isUploading}
                  className="bg-primary text-white px-4 py-2 bg-blue-700 rounded-lg disabled:opacity-50 flex items-center justify-center"
                >
                  {isUploading ? (
                    <>
                      <Loader className="animate-spin w-4 h-4 mr-2" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 w-full">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="relative aspect-[7/10] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
              {index < localImages.length ? (
                <>
                  <div className="w-full h-full relative">
                    {/* Image with error handling */}
                    <img
                      src={localImages[index]}
                      alt={`Uploaded ${index}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // If image fails to load, show a fallback
                        e.target.onerror = null; // Prevent infinite error loop
                        e.target.src = "/api/placeholder/400/600"; // Fallback image
                      }}
                    />
                    
                    {/* Image controls overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 hover:opacity-100 flex flex-col justify-between p-2 transition-opacity">
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="self-end bg-white p-1 rounded-full shadow-sm"
                      >
                        <X size={16} className="text-red-500" />
                      </button>
                      <button
                        onClick={() => handleEditImage(index)}
                        className="self-center mt-auto bg-white p-2 rounded-full shadow-sm"
                      >
                        <Crop size={16} className="text-primary" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer h-full">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center">
                      <Loader className="animate-spin h-6 w-6 text-blue-500 mb-2" />
                      <span className="text-sm text-blue-500">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={24} className="text-gray-400 mb-2" />
                      <span className="text-sm text-gray-400">Add Photo</span>
                    </>
                  )}
                </label>
              )}
            </div>
          ))}
        </div>
      )}
      {localImages.length < 2 && (
        <p className="text-sm text-red-500 mt-2">Please upload at least 2 images.</p>
      )}
    </div>
  );
};

export default ImageUploader;