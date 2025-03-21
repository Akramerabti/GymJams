import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, X, Crop, Loader } from 'lucide-react';
import gymbrosService from '../../services/gymbros.service';
import { toast } from 'sonner';

const ImageUploader = React.forwardRef(({ images = [], onImagesChange, uploadAfterCompletion = true }, ref) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  
  // Track local image state
  const [localImages, setLocalImages] = useState([]);
  
  // Track images that need to be uploaded after completion
  const [pendingUploads, setPendingUploads] = useState([]);

  // Define the base URL for images
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Initialize local images from props
  useEffect(() => {
    if (images && images.length > 0) {
      setLocalImages(images);
    }
  }, [images]);

  // Update parent when local images change
  useEffect(() => {
    if (JSON.stringify(localImages) !== JSON.stringify(images)) {
      onImagesChange(localImages);
    }
  }, [localImages, onImagesChange, images]);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  // Helper to check if a URL is a server URL
  const isServerUrl = (url) => {
    return !url.startsWith('blob:') && (
      url.startsWith('http') || 
      url.startsWith('/api/') || 
      url.startsWith('/uploads/')
    );
  };

  // Helper to extract image ID from server URL
  const getImageIdFromUrl = (url) => {
    if (!isServerUrl(url)) return null;
    return url.split('/').pop();
  };

  // Upload all pending images
  const uploadPendingImages = async () => {
    if (pendingUploads.length === 0) return [];

    setIsUploading(true);
    const uploadedUrls = [];
    const failedIndices = [];

    try {
      // Upload all pending files
      const uploadResult = await gymbrosService.uploadProfileImages(pendingUploads);

      if (uploadResult.success && uploadResult.imageUrls?.length > 0) {
        // Store the uploaded URLs
        uploadedUrls.push(...uploadResult.imageUrls);
        toast.success(`${uploadResult.imageUrls.length} image(s) uploaded successfully`);
      } else {
        // Mark all as failed
        pendingUploads.forEach((_, index) => failedIndices.push(index));
        toast.error('Failed to upload images to server.');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images. Please try again.');
      // Mark all as failed
      pendingUploads.forEach((_, index) => failedIndices.push(index));
    } finally {
      setIsUploading(false);
      setPendingUploads([]); // Clear pending uploads
    }

    return { uploadedUrls, failedIndices };
  };

  // Public method to upload all pending images
  const uploadAllImages = async () => {
    return await uploadPendingImages();
  };

  // Handle file upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    // Validate file count
    if (files.length + localImages.length > 6) {
      toast.error(`You can only have 6 images total. You can add ${6 - localImages.length} more.`);
      return;
    }

    // Validate file size and type
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }

      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image.`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    // Create blob URLs for preview
    const newImageBlobs = validFiles.map(file => URL.createObjectURL(file));

    // Add blob URLs to local images for immediate preview
    const updatedImages = [...localImages, ...newImageBlobs];
    setLocalImages(updatedImages);
    
    if (uploadAfterCompletion) {
      // Store files for later upload
      setPendingUploads(prev => [...prev, ...validFiles]);
    } else {
      // Upload immediately
      setIsUploading(true);
      
      try {
        // Upload files to the server
        const uploadResult = await gymbrosService.uploadProfileImages(validFiles);

        if (uploadResult.success && uploadResult.imageUrls?.length > 0) {
          // Replace blob URLs with actual server URLs
          const finalImages = [...localImages];

          // Replace the blob URLs with the server URLs (maintaining the order)
          newImageBlobs.forEach((blobUrl, index) => {
            const serverUrl = uploadResult.imageUrls[index];
            if (serverUrl) {
              const blobIndex = finalImages.indexOf(blobUrl);
              if (blobIndex !== -1) {
                finalImages[blobIndex] = serverUrl;
              }
            }
          });

          setLocalImages(finalImages);
          toast.success(`${uploadResult.imageUrls.length} image(s) uploaded successfully`);
        } else {
          // Upload failed but we already have the blob URLs in the UI
          toast.error('Failed to upload images to server. Changes not saved yet.');
        }
      } catch (error) {
        console.error('Error uploading images:', error);
        toast.error('Failed to upload images. Please try again.');

        // Remove the blob URLs that couldn't be uploaded
        setLocalImages(prevImages => prevImages.filter(url => !newImageBlobs.includes(url)));
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Handle image removal
  const handleRemoveImage = async (index) => {
    const imageUrl = localImages[index];

    // If it's a server URL, try to delete it from the server
    if (isServerUrl(imageUrl)) {
      try {
        const imageId = getImageIdFromUrl(imageUrl);
        if (imageId) {
          await gymbrosService.deleteProfileImage(imageId);
          toast.success('Image deleted from server');
        }
      } catch (error) {
        console.error('Error deleting image from server:', error);
        toast.error('Failed to delete image from server');
      }
    } else if (imageUrl.startsWith('blob:')) {
      // If it's a blob URL, also remove it from pending uploads if it exists
      URL.revokeObjectURL(imageUrl); // Free up memory
      
      // Remove the corresponding file from pendingUploads if it exists
      // This is an approximation since we can't directly map blob URLs to files
      if (index < pendingUploads.length) {
        setPendingUploads(prev => prev.filter((_, i) => i !== index));
      }
    }

    // Update local state
    const updatedImages = localImages.filter((_, i) => i !== index);
    setLocalImages(updatedImages);
  };

  // Handle image editing
  const handleEditImage = async (index) => {
    if (index < 0 || index >= localImages.length) return;

    const imageUrl = localImages[index];
    setCurrentImageIndex(index);

    try {
      // For server URLs or blob URLs, fetch and convert to blob for editing
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      setEditingImage(blobUrl);
      setIsEditing(true);

      // Reset crop and zoom
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (error) {
      console.error('Error preparing image for editing:', error);
      toast.error('Failed to prepare image for editing');
    }
  };

  // Handle crop save
  const handleCropSave = async () => {
    if (!croppedArea || editingImage === null) return;

    try {
      setIsUploading(true);

      // Create a canvas for cropping
      const canvas = document.createElement('canvas');
      const image = new Image();

      // Set crossOrigin to handle CORS issues with remote images
      image.crossOrigin = "anonymous";
      image.src = editingImage;

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
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.9);
      });

      // Create a File object from the blob
      const croppedFile = new File([croppedBlob], `cropped-image-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      // Create a local blob URL for immediate preview
      const croppedBlobUrl = URL.createObjectURL(croppedBlob);

      // Replace the image being edited with the cropped version in local state
      const updatedImages = [...localImages];
      if (currentImageIndex !== null && currentImageIndex < updatedImages.length) {
        updatedImages[currentImageIndex] = croppedBlobUrl;
        setLocalImages(updatedImages);
      }

      if (uploadAfterCompletion) {
        // Store the cropped file for later upload
        // Replace the corresponding file in pendingUploads if it exists
        if (currentImageIndex < pendingUploads.length) {
          const newPendingUploads = [...pendingUploads];
          newPendingUploads[currentImageIndex] = croppedFile;
          setPendingUploads(newPendingUploads);
        } else {
          setPendingUploads(prev => [...prev, croppedFile]);
        }
        toast.success('Image cropped successfully');
      } else {
        // Try to upload the cropped image to server immediately
        const uploadResult = await gymbrosService.uploadProfileImages([croppedFile]);

        if (uploadResult.success && uploadResult.imageUrls && uploadResult.imageUrls.length > 0) {
          // Replace blob URL with server URL
          const serverUrl = uploadResult.imageUrls[0];

          const finalImages = [...localImages];
          const blobIndex = finalImages.indexOf(croppedBlobUrl);
          if (blobIndex !== -1) {
            finalImages[blobIndex] = serverUrl;
            setLocalImages(finalImages);
          }

          toast.success('Image cropped and saved successfully');
        } else {
          // Keep the blob URL for now, user can retry save later
          toast.warning('Image cropped but not saved to server yet');
        }
      }
    } catch (error) {
      console.error('Error processing cropped image:', error);
      toast.error('Failed to process cropped image');
    } finally {
      setIsUploading(false);
      setIsEditing(false);
      setEditingImage(null);
      setCurrentImageIndex(null);
    }
  };

  // Expose the uploadAllImages method to parent components
  React.useImperativeHandle(
    ref,
    () => ({
      uploadAllImages
    }),
    [pendingUploads]
  );

  return (
    <div className="w-full h-full flex flex-col">
      {isEditing && editingImage ? (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg h-full max-h-[90vh] flex flex-col relative">
            <div className="h-[80%] relative">
              <Cropper
                image={editingImage}
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
                  onClick={() => {
                    setIsEditing(false);
                    setEditingImage(null);
                    setCurrentImageIndex(null);
                  }}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropSave}
                  disabled={isUploading}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center justify-center"
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
                      src={localImages[index].startsWith('blob:') 
                        ? localImages[index] 
                        : (localImages[index].startsWith('http') 
                            ? localImages[index] 
                            : `${baseUrl}${localImages[index]}`)}
                      alt={`Uploaded ${index}`}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        // If image fails to load, show a fallback
                        console.error('Image load error:', localImages[index]);
                        e.target.onerror = null; // Prevent infinite error loop
                        e.target.src = `${baseUrl}/uploads/fallback-avatar.jpg`; // Fallback image
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
                        <Crop size={16} className="text-blue-500" />
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
      {pendingUploads.length > 0 && (
        <p className="text-sm text-blue-500 mt-2">
          {pendingUploads.length} image(s) will be uploaded when you complete your profile.
        </p>
      )}
    </div>
  );
});
// Wrap the component with forwardRef to expose the uploadAllImages method
const ImageUploaderWithRef = React.forwardRef(ImageUploader);

export default ImageUploaderWithRef;