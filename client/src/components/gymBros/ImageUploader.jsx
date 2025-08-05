import React, { useState, useCallback, useEffect, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, X, Crop, Loader } from 'lucide-react';
import gymbrosService from '../../services/gymbros.service';
import { toast } from 'sonner';
import { getPlaceholderUrl, getFallbackAvatarUrl } from '../../utils/imageUtils';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  TouchSensor,
  useSensor, 
  useSensors,
  DragOverlay 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  useSortable, 
  rectSortingStrategy 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableImageItem = ({ url, index, onRemove, onEdit, isPlaceholder, selectFile }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `image-${index}`,
    disabled: isPlaceholder
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 1000 : 1,
    position: 'relative',
    touchAction: 'none',
    opacity: isDragging ? 0.9 : 1,
    scale: isDragging ? 1.15 : 1,
    boxShadow: isDragging
      ? '0 25px 30px -12px rgba(0, 0, 0, 0.25), 0 15px 15px -10px rgba(0, 0, 0, 0.1)'
      : 'none',
  };

  // Base URL for images
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  // Format image URL
  const formatImageUrl = (imageUrl) => {
    if (!imageUrl) return null;

    if (imageUrl.startsWith('blob:') || imageUrl.startsWith('http')) {
      return imageUrl;
    } else {
      // For legacy local files - avoid double slashes
      const separator = baseUrl.endsWith('/') ? '' : '';
      return `${baseUrl}${separator}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
    }
  };

  if (isPlaceholder) {
    return (
      <div
        className="relative aspect-[7/10] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
        ref={setNodeRef}
      >
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
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-[7/10] border-2 border-solid border-gray-200 rounded-lg overflow-hidden"
    >      <img
        src={formatImageUrl(url)}
        alt={`Upload ${index}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = getFallbackAvatarUrl();
        }}
      />
      
      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity duration-200">
        {/* Drag handle that covers the entire item */}
        <div
          {...attributes}
          {...listeners}
          className="absolute inset-0 cursor-grab active:cursor-grabbing z-10 transition-all duration-150"
          style={{ touchAction: 'none' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
            e.currentTarget.style.boxShadow = 'inset 0 0 0 2px rgba(59, 130, 246, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        
        {/* Controls that appear on hover */}
        <div className="absolute top-2 right-2 flex space-x-2 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(index);
            }}
            className="p-1.5 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 transition-opacity shadow-md"
          >
            <Crop size={16} className="text-blue-500" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            className="p-1.5 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 transition-opacity shadow-md"
          >
            <X size={16} className="text-red-500" />
          </button>
        </div>
        
        {/* Primary photo indicator */}
        {index === 0 && (
          <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full z-20">
            Primary
          </div>
        )}
      </div>
    </div>
  );
};

// Drag preview component
const DragPreview = ({ url }) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const formatImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    
    if (imageUrl.startsWith('blob:') || imageUrl.startsWith('http')) {
      return imageUrl;
    } else {
      // For legacy local files - avoid double slashes
      const separator = baseUrl.endsWith('/') ? '' : '';
      return `${baseUrl}${separator}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
    }
  };

  return (
    <div 
      className="relative aspect-[7/10] w-32 border-2 border-blue-500 rounded-lg overflow-hidden shadow-2xl bg-white"
      style={{ 
        transform: 'rotate(-3deg)',
        animation: 'pulse-grow 1.5s infinite'
      }}
    >
      <img 
        src={formatImageUrl(url)}
        alt="Dragged image"
        className="w-full h-full object-cover"        onError={(e) => {
          e.target.onerror = null;
          e.target.src = getFallbackAvatarUrl();
        }}
      />
      <div className="absolute inset-0 bg-blue-500 bg-opacity-10"></div>
    </div>
  );
};

// Image Cropper Modal
const ImageCropperModal = ({ image, onSave, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    
    setLoading(true);
    
    try {
      // Create a canvas for cropping
      const canvas = document.createElement('canvas');
      const img = new Image();
      
      // Set crossOrigin to handle CORS issues with remote images
      img.crossOrigin = "anonymous";
      img.src = image;

      // Wait for image to load
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Set canvas dimensions to match crop area
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext('2d');

      // Draw the cropped image on the canvas
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
      const croppedBlob = await new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.9);
      });

      // Create a File object from the blob
      const croppedFile = new File([croppedBlob], `cropped-image-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      onSave(croppedFile);
    } catch (error) {
      console.error('Error processing cropped image:', error);
      toast.error('Failed to process cropped image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Crop Image</h2>
          <button 
            onClick={onCancel} 
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="relative h-[350px] w-full bg-gray-900 overflow-hidden">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={7/10} // Square crops for consistency
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Zoom</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main ImageUploader Component
const ImageUploader = React.forwardRef(({ images = [], onImagesChange, maxPhotos = 6 }, ref) => {
  const [localImages, setLocalImages] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [cropImage, setCropImage] = useState(null);
  const [cropIndex, setCropIndex] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [activeDragItemIndex, setActiveDragItemIndex] = useState(null);
  const [styleSheet, setStyleSheet] = useState(null);

  // Set up animation keyframes
  useEffect(() => {
    if (!styleSheet) {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse-grow {
          0% { transform: scale(1.1) rotate(-3deg); }
          50% { transform: scale(1.2) rotate(-2deg); }
          100% { transform: scale(1.1) rotate(-3deg); }
        }
      `;
      document.head.appendChild(style);
      setStyleSheet(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [styleSheet]);

  // Initialize with images from props
  useEffect(() => {
    if (images && images.length > 0 && localImages.length === 0) {
      const validImages = images.filter(url => url);
      setLocalImages(validImages);
    }
  }, [images]);

  // Update parent when local images change
  useEffect(() => {
    if (JSON.stringify(localImages) !== JSON.stringify(images)) {
      onImagesChange(localImages);
    }
  }, [localImages, onImagesChange, images]);

  // Configure sensors optimized for both desktop and mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // No distance constraint for mouse users
      activationConstraint: null
    }),
    useSensor(TouchSensor, {
      // Touch-specific settings for mobile
      activationConstraint: {
        delay: 100,
        tolerance: 5
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Drag start handler
  const handleDragStart = (event) => {
    const { active } = event;
    const index = parseInt(active.id.split('-')[1]);
    setActiveDragItemIndex(index);
    setActiveId(active.id);
  };

  // Drag end handler
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveDragItemIndex(null);
    
    if (active && over && active.id !== over.id) {
      const activeIndex = parseInt(active.id.split('-')[1]);
      const overIndex = parseInt(over.id.split('-')[1]);
      
      const newLocalImages = arrayMove(localImages, activeIndex, overIndex);
      setLocalImages(newLocalImages);
      
      // Update photoFiles to maintain mapping
      const newPhotoFiles = [...photoFiles];
      const sortedFiles = newPhotoFiles.map(item => {
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
      
      setPhotoFiles(sortedFiles);
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

  // Handle cropped image
  const handleCropSave = (croppedFile) => {
    // Create blob URL for display
    const blobUrl = URL.createObjectURL(croppedFile);
    
    // Update local images
    const newLocalImages = [...localImages];
    if (cropIndex < newLocalImages.length) {
      // If replacing an existing image
      const oldUrl = newLocalImages[cropIndex];
      
      // Revoke old blob URL if needed
      if (oldUrl && oldUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldUrl);
      }
      
      newLocalImages[cropIndex] = blobUrl;
    } else {
      // Add new image
      newLocalImages.push(blobUrl);
    }
    
    setLocalImages(newLocalImages);
    
    // Track the file for later upload
    setPhotoFiles(prev => {
      const updatedFiles = [...prev];
      
      // Remove any existing file for this index
      const existingIdx = updatedFiles.findIndex(item => item.index === cropIndex);
      if (existingIdx !== -1) {
        updatedFiles.splice(existingIdx, 1);
      }
      
      // Add the new cropped file
      updatedFiles.push({
        index: cropIndex,
        file: croppedFile,
        blobUrl: blobUrl
      });
      
      return updatedFiles;
    });
    
    // Reset cropper
    setCropImage(null);
    setCropIndex(null);
  };

  // Handle remove image
  const handleRemoveImage = (index) => {
    // Get the URL being removed
    const imageUrl = localImages[index];
    
    // Create updated array
    const newLocalImages = [...localImages];
    newLocalImages.splice(index, 1);
    setLocalImages(newLocalImages);
    
    // Revoke blob URL if needed
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
      
      // Also remove from photoFiles
      setPhotoFiles(prev => prev.filter(item => item.blobUrl !== imageUrl));
    }
    
    // Update indexes in photoFiles
    setPhotoFiles(prev => {
      return prev.map(item => {
        if (item.index > index) {
          return { ...item, index: item.index - 1 };
        }
        return item;
      });
    });
  };

  // Handle edit image
  const handleEditImage = (index) => {
    if (index < 0 || index >= localImages.length) return;
    
    setCropImage(localImages[index]);
    setCropIndex(index);
  };

  // Upload all images
  const uploadAllImages = async () => {
    if (photoFiles.length === 0) return { uploadedUrls: [], failedIndices: [] };
    
    setIsUploading(true);
    
    try {
      const filesToUpload = photoFiles.map(item => item.file);
      
      const result = await gymbrosService.uploadProfileImages(filesToUpload);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to upload images');
      }
      
      // Get newly uploaded URLs
      const newUrls = result.imageUrls || [];
      
      // Replace blob URLs with server URLs
      const finalImages = [...localImages];
      
      photoFiles.forEach((item, index) => {
        if (index < newUrls.length) {
          const blobIndex = finalImages.indexOf(item.blobUrl);
          if (blobIndex !== -1) {
            finalImages[blobIndex] = newUrls[index];
          }
        }
      });
      
      // Update local state
      setLocalImages(finalImages);
      setPhotoFiles([]);
      
      return { 
        uploadedUrls: newUrls, 
        failedIndices: [] 
      };
    } catch (error) {
      console.error('Error uploading images:', error);
      return { 
        uploadedUrls: [],
        failedIndices: Array.from({ length: photoFiles.length }, (_, i) => i)
      };
    } finally {
      setIsUploading(false);
    }
  };

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    uploadAllImages,
    getFilesToUpload: () => photoFiles.map(item => item.file),
    getServerUrls: () => localImages.filter(url => !url.startsWith('blob:')),
    getPendingUploadsCount: () => photoFiles.length
  }), [localImages, photoFiles]);

  // Create array with placeholder slots
  const displayImages = [...localImages];
  while (displayImages.length < maxPhotos) {
    displayImages.push(null);
  }

  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={displayImages.map((_, i) => `image-${i}`)} 
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-3 gap-4">
            {displayImages.map((url, index) => (
              <SortableImageItem
                key={`image-${index}`}
                url={url}
                index={index}
                onRemove={handleRemoveImage}
                onEdit={handleEditImage}
                isPlaceholder={!url}
                selectFile={handleFileSelect}
              />
            ))}
          </div>
        </SortableContext>
        
        <DragOverlay>
          {activeId && activeDragItemIndex !== null && localImages[activeDragItemIndex] ? (
            <DragPreview url={localImages[activeDragItemIndex]} />
          ) : null}
        </DragOverlay>
      </DndContext>
      
      {localImages.length < 2 && (
        <p className="text-sm text-red-500 mt-2">Please upload at least 2 images.</p>
      )}
      
      {photoFiles.length > 0 && (
        <p className="text-sm text-blue-500 mt-2">
          {photoFiles.length} image{photoFiles.length !== 1 ? 's' : ''} ready to upload
        </p>
      )}
    
      {cropImage && (
        <ImageCropperModal
          image={cropImage}
          onSave={handleCropSave}
          onCancel={() => {
            setCropImage(null);
            setCropIndex(null);
          }}
        />
      )}
    </div>
  );
});

export default ImageUploader;