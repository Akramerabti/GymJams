import React, { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, X, Crop, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const BlobUrlWarning = ({ count }) => {
  if (count === 0) return null;
  
  return (
    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
      <div className="flex items-start">
        <Info size={16} className="text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
        <div className="text-xs text-yellow-700">
          <p className="font-medium">Unsaved image{count > 1 ? 's' : ''} detected</p>
          <p>
            {count} image{count > 1 ? 's' : ''} {count > 1 ? 'are' : 'is'} in preview mode but not prepared for upload.
            Please use the edit button to process {count > 1 ? 'these images' : 'this image'}.
          </p>
        </div>
      </div>
    </div>
  );
};


// Sortable Image Item Component
const SortableImageItem = ({ photo, index, onRemove, onEdit, selectFile }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `photo-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: 'relative',
  };

  // Handle remove and edit events
  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove(index);
  };
  
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(index);
  };

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // Determine the display URL for image
  const getDisplayUrl = (url) => {
    if (!url) return null;
    
    if (url.startsWith('blob:')) {
      return url;
    } else if (url.startsWith('http')) {
      return url;
    } else {
      return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative aspect-[7/10] border-2 ${photo ? 'border-solid border-gray-200' : 'border-dashed border-gray-300'} rounded-lg overflow-hidden ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      {photo ? (
        <>
          <img 
            src={getDisplayUrl(photo)}
            alt={`Photo ${index + 1}`}
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
            onError={(e) => {
              console.error(`Image load error for ${photo}`);
              e.target.onerror = null;
              e.target.src = "/api/placeholder/400/600";
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity duration-200 flex items-center justify-center">
            <div {...attributes} {...listeners} className="absolute inset-0 cursor-move" />
            <div className="absolute top-2 right-2 flex space-x-2">
              <button 
                onClick={handleEdit}
                className="p-1.5 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 transition-opacity"
              >
                <Crop size={16} className="text-blue-500" />
              </button>
              <button 
                onClick={handleRemove}
                className="p-1.5 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 transition-opacity"
              >
                <X size={16} className="text-red-500" />
              </button>
            </div>
          </div>
          
          {/* Primary photo badge for the first photo */}
          {index === 0 && (
            <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              Primary
            </div>
          )}
        </>
      ) : (
        <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => selectFile(e, index)}
            className="hidden"
          />
          <Upload size={32} className="text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">Add Photo</span>
        </label>
      )}
    </div>
  );
};

// Image Cropper Modal Component
const ImageCropperModal = ({ image, onCropComplete, onCropCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    
    setLoading(true);
    
    try {
      // Create a canvas to draw the cropped image
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      // Load the image
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = image;
      });
      
      // Set canvas dimensions to cropped dimensions
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      
      const ctx = canvas.getContext('2d');
      
      // Draw the cropped area
      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );
      
      // Convert canvas to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });
      
      // Create a File object from the blob
      const croppedFile = new File(
        [blob],
        `cropped-${Date.now()}.jpg`,
        { type: 'image/jpeg' }
      );
      
      onCropComplete(croppedFile);
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Failed to crop image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b">
          <button onClick={onCropCancel} className="p-2">
            <X size={20} />
          </button>
          <h2 className="text-lg font-semibold">Crop Image</h2>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="p-2 text-blue-500 disabled:text-gray-400"
          >
            {loading ? <Loader size={20} className="animate-spin" /> : 'Save'}
          </button>
        </div>
        
        <div className="relative h-[400px] w-full bg-gray-900">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={7/10}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>
        
        <div className="p-4 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 mx-4"
            />
            <span className="text-sm text-gray-500">{zoom.toFixed(1)}x</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main PhotoEditor Component
const PhotoEditor = React.forwardRef(({ photos = [], onPhotosChange, maxPhotos = 6 }, ref) => {
  // State to track photos to display
  const [displayPhotos, setDisplayPhotos] = useState([...photos]);
  
  const [unprocessedBlobUrls, setUnprocessedBlobUrls] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  
  // State for the cropper
  const [cropImage, setCropImage] = useState(null);
  const [cropIndex, setCropIndex] = useState(null);
  
  // Debug: log when photos prop changes
  useEffect(() => {
    console.log("PhotoEditor received photos:", photos);
  }, [photos]);
  
  // Initialize with photos from props
  useEffect(() => {
    if (photos && photos.length > 0 && displayPhotos.length === 0) {
      // Filter out any blob URLs from initialization - these should never come from the backend
      const filteredPhotos = photos.filter(url => !url || !url.startsWith('blob:'));
      console.log("Initializing displayPhotos with filtered photos:", filteredPhotos);
      setDisplayPhotos([...filteredPhotos]);
    }
  }, [photos]);
  
  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active && over && active.id !== over.id) {
      // Extract indices from IDs
      const activeIndex = parseInt(active.id.toString().split('-')[1]);
      const overIndex = parseInt(over.id.toString().split('-')[1]);
      
      // Update display photos
      const newDisplayPhotos = arrayMove(displayPhotos, activeIndex, overIndex);
      setDisplayPhotos(newDisplayPhotos);
      
      // Update photo files - adjust indexes to match the new order
      // Use safer method with filter to avoid undefined items
      const newPhotoFiles = photoFiles
        .filter(item => item && typeof item.index === 'number') // Add safety check
        .map(item => {
          if (item.index === activeIndex) {
            return { ...item, index: overIndex };
          } else if (item.index === overIndex) {
            return { ...item, index: activeIndex };
          } else if (item.index > activeIndex && item.index <= overIndex) {
            return { ...item, index: item.index - 1 };
          } else if (item.index < activeIndex && item.index >= overIndex) {
            return { ...item, index: item.index + 1 };
          }
          return item;
        });
      
      setPhotoFiles(newPhotoFiles);
      
      // Notify parent
      onPhotosChange(newDisplayPhotos);
    }
  };
  
  // Handle file selection
  const handleFileSelect = (e, index) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }
    
    // Set up cropping
    const imageUrl = URL.createObjectURL(file);
    setCropImage(imageUrl);
    setCropIndex(index);
  };
  
  // Handle crop completion
  const handleCropComplete = (croppedFile) => {
    // Create blob URL for display only
    const blobUrl = URL.createObjectURL(croppedFile);
    console.log(`Created blob URL for display: ${blobUrl}`);
    
    // Update display photos with the blob URL for immediate visual feedback
    const newDisplayPhotos = [...displayPhotos];
    if (cropIndex < newDisplayPhotos.length) {
      // If replacing an existing image
      const oldUrl = newDisplayPhotos[cropIndex];
      
      // If old URL was a blob, revoke it to prevent memory leaks
      if (oldUrl && oldUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldUrl);
      }
      
      newDisplayPhotos[cropIndex] = blobUrl;
    } else {
      // Fill any gaps with empty strings
      while (newDisplayPhotos.length < cropIndex) {
        newDisplayPhotos.push('');
      }
      newDisplayPhotos.push(blobUrl);
    }
    setDisplayPhotos(newDisplayPhotos);
    
    // Track the file that needs to be uploaded with its current index and blob URL
    setPhotoFiles(prev => {
      const updatedFiles = [...prev];
      
      // Remove any existing file reference for this index
      const existingFileIndex = updatedFiles.findIndex(item => item && item.index === cropIndex);
      if (existingFileIndex !== -1) {
        updatedFiles.splice(existingFileIndex, 1);
      }
      
      // Add the new file reference
      updatedFiles.push({
        index: cropIndex,
        file: croppedFile,
        blobUrl: blobUrl
      });
      
      console.log("Updated photoFiles:", updatedFiles);
      return updatedFiles;
    });
    
    // Reset cropper
    setCropImage(null);
    setCropIndex(null);
    
    // Notify parent
    onPhotosChange(newDisplayPhotos);
  };
  
  const handleRemoveImage = (index) => {
    // Update display photos
    const newDisplayPhotos = [...displayPhotos];
    
    // If it's a blob URL, release it
    if (newDisplayPhotos[index]?.startsWith('blob:')) {
      const blobUrl = newDisplayPhotos[index];
      URL.revokeObjectURL(blobUrl);
      
      // Also remove from photoFiles array
      setPhotoFiles(prev => prev.filter(item => item.blobUrl !== blobUrl));
      
      // Remove from unprocessed blobs if present
      setUnprocessedBlobUrls(prev => prev.filter(url => url !== blobUrl));
    }
    
    newDisplayPhotos.splice(index, 1);
    setDisplayPhotos(newDisplayPhotos);
    
    // After removing, adjust indexes in photoFiles
    setPhotoFiles(prev => {
      return prev.map(item => {
        if (item.index > index) {
          // Shift down indexes above the removed one
          return { ...item, index: item.index - 1 };
        }
        return item;
      });
    });
    
    // Notify parent
    onPhotosChange(newDisplayPhotos);
  };
  
  // Handle editing an image
  const handleEditImage = (index) => {
    const imageUrl = displayPhotos[index];
    if (!imageUrl) return;
    
    setCropImage(imageUrl);
    setCropIndex(index);
  };
  
  React.useImperativeHandle(ref, () => ({
    // Get all files that need uploading
    getFilesToUpload: () => {
      // Filter to make sure we only have valid items with files
      const validItems = photoFiles.filter(item => item && item.file);
      const files = validItems.map(item => item.file);
      
      console.log("Getting files to upload:", files.length, "files", 
        files.map(f => f ? {name: f.name, size: f.size} : "invalid file"));
      return files;
    },
    
    // Get server URLs that should be preserved
    getServerUrls: () => {
      const serverUrls = displayPhotos.filter(url => 
        url && !url.startsWith('blob:')
      );
      
      console.log("Getting server URLs to preserve:", serverUrls);
      return serverUrls;
    },
    
    // Get count of pending uploads
    getPendingUploadsCount: () => photoFiles.length,
    
    // Get information about which blob URLs correspond to which files
    // This helps with replacing blobs with server URLs after upload
    getBlobUrlMapping: () => {
      // Add safety check to filter out invalid items
      return photoFiles
        .filter(item => item && typeof item.index === 'number' && item.blobUrl)
        .map(item => ({
          index: item.index,
          blobUrl: item.blobUrl
        }));
    },
    
    getBlobUrlMap: () => {
      const map = {};
      // Only process valid items
      photoFiles.filter(item => item && typeof item.index === 'number' && item.blobUrl)
        .forEach(item => {
          map[item.index] = item.blobUrl;
        });
      console.log("Generated blob URL map:", map);
      return map;
    }
  }));
  
  
  // Fill display array to maxPhotos
  const displayArray = [...displayPhotos];
  while (displayArray.length < maxPhotos) {
    displayArray.push('');
  }
  
  // Count unprocessed blob URLs
  const unprocessedCount = unprocessedBlobUrls.length;
  
  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={displayArray.map((_, i) => `photo-${i}`)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-4">
            {displayArray.map((photo, index) => (
              <SortableImageItem
                key={`photo-${index}`}
                photo={photo}
                index={index}
                onRemove={handleRemoveImage}
                onEdit={handleEditImage}
                selectFile={handleFileSelect}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      {cropImage && (
        <ImageCropperModal
          image={cropImage}
          onCropComplete={handleCropComplete}
          onCropCancel={() => {
            setCropImage(null);
            setCropIndex(null);
          }}
        />
      )}
      
      {displayPhotos.filter(Boolean).length < 2 && (
        <p className="text-sm text-red-500 mt-2">Please upload at least 2 images.</p>
      )}
    </div>
  );
});

export default PhotoEditor;