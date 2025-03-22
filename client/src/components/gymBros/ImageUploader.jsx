import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  
  // Track local image state - separate blob URLs (for display) from actual files (for upload)
  const [localImages, setLocalImages] = useState([]);
  
  // Track actual file objects that need to be uploaded
  const [pendingUploads, setPendingUploads] = useState([]);

  // Explicitly track mapping between blob URLs and files
  const [blobToFileMap, setBlobToFileMap] = useState({});

  const [fileNameMap, setFileNameMap] = useState({});
  
  // Define the base URL for images
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Debug logging
  console.log('ImageUploader render with props:', {
    initialImages: images?.length || 0,
    pendingUploads: pendingUploads?.length || 0,
    localImages: localImages?.length || 0
  });

  // Initialize local images from props
  useEffect(() => {
    if (images && images.length > 0) {
      // Filter out any nulls or empty strings
      const validImages = images.filter(url => url);
      console.log('Initializing localImages with', validImages.length, 'images');
      setLocalImages(validImages);
    }
  }, []);

  // Update parent when local images change
  useEffect(() => {
    if (JSON.stringify(localImages) !== JSON.stringify(images)) {
      console.log('Updating parent with', localImages.length, 'images');
      onImagesChange(localImages);
    }
  }, [localImages, onImagesChange, images]);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const isServerUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    
    // Check if it's a blob URL (client-side only)
    if (url.startsWith('blob:')) return false;
    
    // Valid server URLs
    return (
      url.startsWith('http') || 
      url.startsWith('/') ||  // Relative URLs from the server
      url.includes('/uploads/') ||
      url.includes('/api/')
    );
  };

  const uploadAllImages = async () => {
    try {
      console.log('Starting upload of all pending images...', pendingUploads.length);
      
      // Log what we're trying to upload
      console.log('Pending uploads:', pendingUploads.map(f => ({ 
        name: f.name, 
        type: f.type, 
        size: f.size 
      })));
      
      // Log the localImages array
      console.log('localImages before upload:', localImages);
      
      // Exit early if no files to upload
      if (pendingUploads.length === 0) {
        console.log('No pending images to upload');
        
        // Just return existing server URLs
        const serverUrls = localImages.filter(url => isServerUrl(url));
        console.log('Returning existing server URLs:', serverUrls);
        
        return { uploadedUrls: serverUrls, failedIndices: [] };
      }
      
      setIsUploading(true);
      
      // Upload all files at once
      console.log('Uploading', pendingUploads.length, 'files...');
      const result = await gymbrosService.uploadProfileImages(pendingUploads);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to upload images');
      }
      
      // Get newly uploaded URLs
      const newUrls = result.imageUrls || [];
      console.log('Upload success, server returned:', newUrls);
      
      // Collect existing server URLs
      const existingServerUrls = localImages.filter(url => isServerUrl(url));
      console.log('Existing server URLs:', existingServerUrls);
      
      // Combine existing server URLs with new ones
      const allServerUrls = [...existingServerUrls, ...newUrls];
      console.log('All server URLs:', allServerUrls);
      
      // Update localImages to include both existing server URLs and newly uploaded URLs
      // Replace blob URLs with their corresponding server URLs
      const updatedImages = [...localImages];
      
      // For each blob URL in localImages, replace with the corresponding server URL
      const blobUrls = Object.keys(blobToFileMap);
      blobUrls.forEach((blobUrl, index) => {
        if (index < newUrls.length) {
          // Find this blob URL in the localImages array
          const blobIndex = updatedImages.indexOf(blobUrl);
          if (blobIndex !== -1) {
            // Replace the blob URL with the server URL
            updatedImages[blobIndex] = newUrls[index];
            console.log(`Replaced blob URL at index ${blobIndex} with ${newUrls[index]}`);
          }
        }
      });
      
      // Filter out any remaining blob URLs
      const finalImages = updatedImages.filter(url => isServerUrl(url));
      console.log('Final images after replacement:', finalImages);
      
      // Update the localImages state
      setLocalImages(finalImages);
      
      // Clear pending uploads and blob to file map
      setPendingUploads([]);
      setBlobToFileMap({});
      
      return { 
        uploadedUrls: allServerUrls, 
        failedIndices: [] 
      };
    } catch (error) {
      console.error('Error uploading images:', error);
      return { 
        uploadedUrls: localImages.filter(url => isServerUrl(url)),
        failedIndices: Array.from({ length: pendingUploads.length }, (_, i) => i)
      };
    } finally {
      setIsUploading(false);
    }
  };
 
  // Handle file upload with preserved original filenames
const handleImageUpload = async (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  console.log('Files selected:', files.length);

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
  const newBlobUrls = [];
  const newBlobMap = { ...blobToFileMap };
  
  // Also track the original filenames for each blob URL
  const newFileNameMap = { ...fileNameMap };

  validFiles.forEach(file => {
    const blobUrl = URL.createObjectURL(file);
    newBlobUrls.push(blobUrl);
    
    // Store both the file and its original filename
    newBlobMap[blobUrl] = file;
    newFileNameMap[blobUrl] = file.name;
    
    console.log(`Created blob URL ${blobUrl} for file "${file.name}"`);
  });

  // Store the mapping between blob URLs and files
  setBlobToFileMap(newBlobMap);
  
  // Store the mapping between blob URLs and original filenames
  setFileNameMap(newFileNameMap);

  // Add blob URLs to local images for immediate preview
  const updatedImages = [...localImages, ...newBlobUrls];
  setLocalImages(updatedImages);
  
  // Store files for later upload
  setPendingUploads(prev => [...prev, ...validFiles]);
  
  console.log('Added', validFiles.length, 'files to pendingUploads (total:', pendingUploads.length + validFiles.length, ')');
  console.log('Added', newBlobUrls.length, 'blob URLs to localImages (total:', updatedImages.length, ')');
};

  // Handle image removal
  const handleRemoveImage = async (index) => {
    if (index < 0 || index >= localImages.length) return;
    
    const imageUrl = localImages[index];
    console.log('Removing image at index', index, imageUrl);

    // If it's a server URL, try to delete it from the server
    if (isServerUrl(imageUrl)) {
      try {
        const imageId = imageUrl.split('/').pop();
        if (imageId) {
          await gymbrosService.deleteProfileImage(imageId);
          toast.success('Image deleted from server');
        }
      } catch (error) {
        console.error('Error deleting image from server:', error);
        toast.error('Failed to delete image from server');
      }
    } else if (imageUrl.startsWith('blob:')) {
      // If it's a blob URL, release it
      URL.revokeObjectURL(imageUrl);
      
      // Remove the corresponding file from pendingUploads
      const file = blobToFileMap[imageUrl];
      if (file) {
        setPendingUploads(prev => prev.filter(f => f !== file));
        
        // Remove from blob to file map
        const newBlobMap = { ...blobToFileMap };
        delete newBlobMap[imageUrl];
        setBlobToFileMap(newBlobMap);
      }
    }

    // Update local state
    const updatedImages = localImages.filter((_, i) => i !== index);
    setLocalImages(updatedImages);
    
    console.log('Updated localImages to', updatedImages.length, 'items');
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

      // Draw the cropped image on the canvas
      ctx.drawImage(
        image,
        croppedArea.x,
        croppedArea.y,
        croppedArea.width,
        croppedArea.height,
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
        // If we're editing an existing server URL, remove it from localImages
        if (isServerUrl(updatedImages[currentImageIndex])) {
          // Try to delete the old server URL
          try {
            const imageId = updatedImages[currentImageIndex].split('/').pop();
            if (imageId) {
              await gymbrosService.deleteProfileImage(imageId);
            }
          } catch (error) {
            console.error('Error deleting old image from server:', error);
          }
        } else if (updatedImages[currentImageIndex].startsWith('blob:')) {
          // Remove the old blob URL from blobToFileMap
          const oldBlobUrl = updatedImages[currentImageIndex];
          const newBlobMap = { ...blobToFileMap };
          delete newBlobMap[oldBlobUrl];
          setBlobToFileMap(newBlobMap);
          
          // Release the old blob URL
          URL.revokeObjectURL(oldBlobUrl);
        }
        
        // Replace with the new blob URL
        updatedImages[currentImageIndex] = croppedBlobUrl;
      } else {
        // Shouldn't happen, but handle the case anyway
        updatedImages.push(croppedBlobUrl);
      }
      
      // Update local state
      setLocalImages(updatedImages);
      
      // Update the blob to file map
      setBlobToFileMap(prev => ({
        ...prev,
        [croppedBlobUrl]: croppedFile
      }));
      
      // Add the cropped file to pendingUploads
      setPendingUploads(prev => [...prev, croppedFile]);
      
      toast.success('Image cropped successfully');
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

  React.useImperativeHandle(ref, () => ({
    uploadAllImages,
    getCurrentFiles: () => pendingUploads,
    getCurrentUrls: () => localImages.filter(url => isServerUrl(url)),
    getPendingUploadsCount: () => pendingUploads.length,
    
    // Add debugging methods
    debug: {
      getLocalImages: () => localImages,
      getPendingUploads: () => pendingUploads,
      getBlobToFileMap: () => blobToFileMap
    }
  }), [pendingUploads, localImages, blobToFileMap]);

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
                        e.target.src = `/api/placeholder/400/600`; // Fallback image
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
          {pendingUploads.length} image(s) ready for upload.
        </p>
      )}
    </div>
  );
});

export default ImageUploader;