import React, { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, X, Crop, Loader, Info } from 'lucide-react';
import { toast } from 'sonner';
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

// Sortable Image Item Component
const SortableImageItem = ({ photo, index, onRemove, onEdit, selectFile }) => {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging,
    active 
  } = useSortable({
    id: `photo-${index}`,
  });

  
// Update the style object in SortableImageItem component
const style = {
  transform: CSS.Transform.toString(transform),
  transition: isDragging ? 'none' : transition, // Remove transition during active drag for smoother feel
  zIndex: isDragging ? 10 : 1,
  position: 'relative',
  touchAction: 'none',
  opacity: isDragging ? 0.9 : 1,
  // Make the item significantly larger when being dragged
  scale: isDragging ? 1.15 : 1,
  boxShadow: isDragging 
    ? '0 25px 30px -12px rgba(0, 0, 0, 0.25), 0 15px 15px -10px rgba(0, 0, 0, 0.1)' 
    : 'none',
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
            {/* The drag handle spans the entire item for better experience across all devices */}
            <div 
              {...attributes} 
              {...listeners} 
              className="absolute inset-0 cursor-grab active:cursor-grabbing z-10 transition-all duration-150"
              style={{ 
                touchAction: 'none',
                background: 'rgba(0, 0, 0, 0)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                e.currentTarget.style.boxShadow = 'inset 0 0 0 2px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <div className="absolute top-2 right-2 flex space-x-2 z-20">
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
            <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full z-20">
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

const DragPreview = ({ url }) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
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
      className="relative aspect-[7/10] w-40 border-3 border-blue-500 rounded-lg overflow-hidden shadow-2xl bg-white"
      style={{
        animation: 'pulse-grow 1.5s infinite',
        transform: 'rotate(-3deg)',
      }}
    >
      <img 
        src={getDisplayUrl(url)}
        alt="Dragged item"
        className="w-full h-full object-cover"
        crossOrigin="anonymous"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/api/placeholder/400/600";
        }}
      />
      <div className="absolute inset-0 bg-blue-500 bg-opacity-10"></div>
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
  const [styleSheet, setStyleSheet] = useState(null);
  const [unprocessedBlobUrls, setUnprocessedBlobUrls] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  
  // State for the cropper
  const [cropImage, setCropImage] = useState(null);
  const [cropIndex, setCropIndex] = useState(null);
  
  // State for active drag item
  const [activeId, setActiveId] = useState(null);
  const [activeDragItemIndex, setActiveDragItemIndex] = useState(null);
  
  
  
  // Initialize with photos from props
  useEffect(() => {
    if (photos && photos.length > 0 && displayPhotos.length === 0) {
      // Filter out any blob URLs from initialization - these should never come from the backend
      const filteredPhotos = photos.filter(url => !url || !url.startsWith('blob:'));
      console.log("Initializing displayPhotos with filtered photos:", filteredPhotos);
      setDisplayPhotos([...filteredPhotos]);
    }
  }, [photos]);

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
  
  // Configure DnD sensors with proper support for both mouse and touch
  const sensors = useSensors(
    // Primary pointer sensor (mouse/trackpad) with default behavior
    useSensor(PointerSensor, {
      // Don't use a distance constraint for mouse - it feels unnatural
      activationConstraint: null
    }),
    // Touch-specific sensor with custom constraints for mobile devices
    useSensor(TouchSensor, {
      // Add specific touch sensor with custom activation constraints
      activationConstraint: {
        delay: 100, // Short delay to distinguish taps from drags
        tolerance: 5  // Add tolerance for small finger movements
      }
    }),
    // Keyboard support for accessibility
    useSensor(KeyboardSensor, { 
      coordinateGetter: sortableKeyboardCoordinates 
    })
  );
  
  const handleDragStart = (event) => {
    const { active } = event;
    // Get the index from the active ID string (format: "photo-X")
    const index = parseInt(active.id.split('-')[1]);
    setActiveDragItemIndex(index);
    setActiveId(active.id);
  };
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveDragItemIndex(null);
    
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
  }), [photoFiles, displayPhotos]);
  
  
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
        onDragStart={handleDragStart}
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
        
        {/* Add drag overlay for better visual feedback */}
        <DragOverlay>
          {activeId && activeDragItemIndex !== null && displayPhotos[activeDragItemIndex] ? (
            <DragPreview url={displayPhotos[activeDragItemIndex]} />
          ) : null}
        </DragOverlay>
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
      
      {/* Add helper text for dragging on both desktop and mobile */}
      <p className="text-xs text-gray-500 mt-2 text-center">
        Drag images to reorder • On mobile: press and hold to drag
      </p>
    </div>
  );
});

export default PhotoEditor;