import React, { useState, useEffect, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, X, Crop, Loader, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getFallbackAvatarUrl } from '../../../utils/imageUtils';
import { usePermissions } from '../../../contexts/PermissionContext';
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
        <>          <img 
            src={getDisplayUrl(photo)}
            alt={`Photo ${index + 1}`}
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
            onError={(e) => {
              console.error(`Image load error for ${photo}`);
              e.target.onerror = null;
              e.target.src = getFallbackAvatarUrl();
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
    >      <img 
        src={getDisplayUrl(url)}
        alt="Dragged item"
        className="w-full h-full object-cover"
        crossOrigin="anonymous"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = getFallbackAvatarUrl();
        }}
      />
      <div className="absolute inset-0 bg-blue-500 bg-opacity-10"></div>
    </div>
  );
};

// Image Cropper Modal Component with improved UI and image handling
const ImageCropperModal = ({ image, onCropComplete, onCropCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ imageType: null, imageLength: null, error: null });
  const [formattedImageUrl, setFormattedImageUrl] = useState(null);
  
  // Format the image URL based on its type - improved to handle more cases
  useEffect(() => {
    if (!image) return;
    
    let formattedUrl = image;
    
    //('Formatting image URL:', image);
    
    // Case 1: If it's a blob URL, use it directly
    if (typeof image === 'string' && image.startsWith('blob:')) {
      // No change needed for blob URLs
      //('Using blob URL directly:', image);
      setFormattedImageUrl(image);
      return;
    }
      // Case 2: If it's a server path starting with /uploads/, add the API base URL
    // Note: This is legacy support - new uploads use Supabase URLs directly
    if (typeof image === 'string' && image.startsWith('/uploads/')) {
      // Construct the full URL to the API server where the actual file is
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      formattedUrl = `${apiBaseUrl}${image}`;
      //('Formatted legacy server path to API URL:', formattedUrl);
      setFormattedImageUrl(formattedUrl);
      return;
    }
    
    // Case 3: Any other URL format (http, https, etc.)
    //('Using image URL as-is:', image);
    setFormattedImageUrl(image);
  }, [image]);
  
  // Log what image value we're receiving to help with debugging
  useEffect(() => {
    if (formattedImageUrl) {
      //('Final formatted image URL:', formattedImageUrl);
    }
  }, [formattedImageUrl]);

  // Handle image load error better
  useEffect(() => {
    // Don't try to load if we don't have the formatted URL yet
    if (!formattedImageUrl) return;
    
    const preloadImage = async () => {
      try {
        //('Attempting to preload image:', formattedImageUrl);
        
        // Early validation
        if (!formattedImageUrl) {
          throw new Error('No image provided to cropper');
        }
        
        if (typeof formattedImageUrl !== 'string') {
          throw new Error(`Invalid image type: ${typeof formattedImageUrl}. Expected string URL`);
        }
        
        setDebugInfo({
          imageType: typeof formattedImageUrl,
          imageLength: typeof formattedImageUrl === 'string' ? formattedImageUrl.length : null,
          error: null
        });
        
        await new Promise((resolve, reject) => {
          const img = new Image();
          
          // Only set crossOrigin for remote URLs, not for blob URLs
          if ((formattedImageUrl.startsWith('http://') || formattedImageUrl.startsWith('https://')) && 
              !formattedImageUrl.startsWith('blob:')) {
            img.crossOrigin = "anonymous";
            //('Setting crossOrigin for remote URL');
          }
          
          img.onload = () => {
            setImageLoaded(true);
            resolve();
          };
          
          img.onerror = (e) => {
            console.error('Failed to preload image:', e);
            setDebugInfo(prev => ({ 
              ...prev, 
              error: `Image load error: ${e.type || 'Unknown error'}`
            }));
            reject(new Error('Failed to load image'));
          };
          
          img.src = formattedImageUrl;
          //('Image src assigned:', img.src);
        });
      } catch (error) {
        console.error('Image preload error:', error);
        setDebugInfo(prev => ({ ...prev, error: error.message }));
        toast.error(`Error loading image: ${error.message}`);
        onCropCancel();
      }
    };

    preloadImage();
  }, [formattedImageUrl, onCropCancel]);

  const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Alternative approach for handling the crop operation - use Image.decode()
const handleSave = async () => {
  if (!croppedAreaPixels) return;
  
  setLoading(true);
  
  try {

    const canvas = document.createElement('canvas');
    const img = new Image();
    
    // Use the formatted URL for the image source
    const imageSource = formattedImageUrl || image;

    if (!imageSource.startsWith('blob:')) {
      img.crossOrigin = "anonymous";
      //('Setting crossOrigin for cropping');
    }
      // WORKAROUND: For server-side images, try to pre-fetch the image with fetch API
    // This can help with CORS issues in some cases
    // Note: Legacy support for /uploads/ paths - new uploads use Supabase URLs
    if (imageSource.includes('/uploads/') && !imageSource.startsWith('blob:')) {
      try {
        //('Attempting to pre-fetch image with fetch API...');
        const response = await fetch(imageSource, { 
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        //('Created object URL from fetched image:', objectUrl);
        
        // Use the object URL instead
        img.src = objectUrl;
        
        // Clean up the object URL when done
        const cleanup = () => {
          setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
            //('Revoked object URL after cropping');
          }, 1000);
        };
        
        try {
          // Modern browsers support Image.decode() which ensures image is fully loaded
          if (typeof img.decode === 'function') {
            await img.decode();
            //('Image decoded successfully');
          } else {
            // Fallback for browsers that don't support decode()
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
          }
          
          // Continue with drawing to canvas
          setupCanvasAndDraw();
          cleanup();
          
        } catch (decodeError) {
          console.error('Image decode failed:', decodeError);
          cleanup();
          throw decodeError;
        }
      } catch (fetchError) {
        console.error('Failed to pre-fetch image:', fetchError);
        // Fall back to regular loading
        regularImageLoading();
      }
    } else {
      // For blob URLs or other URLs, use regular loading
      regularImageLoading();
    }
    
    // Regular image loading function
    async function regularImageLoading() {
      try {
        // Set up src and wait for load
        await new Promise((resolve, reject) => {
          img.onload = () => {
            resolve();
          };
          img.onerror = (e) => {
            console.error('Error loading image normally:', e);
            reject(new Error('Failed to load image for cropping'));
          };
          
          img.src = imageSource;
        });
        
        // Continue with drawing to canvas
        setupCanvasAndDraw();
      } catch (error) {
        throw error;
      }
    }
    
    // Function to set up canvas and draw the cropped image
    function setupCanvasAndDraw() {
      // Set canvas dimensions to cropped dimensions
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      //('Canvas dimensions set:', canvas.width, 'x', canvas.height);
      
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
      
      //('Image drawn to canvas, converting to blob...');
      
      // Convert canvas to blob and create file
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create blob from canvas');
        }
        
        //('Blob created, size:', blob.size, 'bytes');
        
        // Create a File object from the blob
        const croppedFile = new File(
          [blob],
          `cropped-${Date.now()}.jpg`,
          { type: 'image/jpeg' }
        );
        
        //('File created, calling onCropComplete');
        onCropComplete(croppedFile);
        setLoading(false);
      }, 'image/jpeg', 0.95);
    }
    
  } catch (error) {
    console.error('Detailed crop error:', error);
    toast.error('Failed to crop image: ' + error.message);
    setLoading(false);
  }
};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-xl"
      >
        <div className="p-3 flex items-center justify-between border-b">
          <button 
            onClick={onCropCancel} 
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Cancel"
          >
            <X size={20} />
          </button>
          <button 
            onClick={handleSave}
            disabled={loading || !imageLoaded}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center"
          >
            {loading ? <Loader size={16} className="animate-spin mr-2" /> : null}
            Save
          </button>
        </div>
        
        <div className="relative h-[420px] w-full bg-gray-900 flex items-center justify-center">
          {!imageLoaded ? (
            <div className="flex flex-col items-center justify-center text-white p-4">
              <Loader size={32} className="animate-spin mb-2" />
              <span className="text-sm mb-2">Loading image...</span>
              
              {/* Debug information */}
              {debugInfo.error && (
                <div className="mt-4 p-3 bg-red-900/40 rounded-lg text-white text-xs max-w-xs overflow-auto">
                  <p className="font-bold mb-1">Image Error:</p>
                  <p>{debugInfo.error}</p>
                  <p className="mt-2 font-bold mb-1">Image Details:</p>
                  <p>Type: {debugInfo.imageType}</p>
                  <p>Length: {debugInfo.imageLength}</p>
                  <p className="mt-2 opacity-70 text-xs">Original URL: {typeof image === 'string' ? image.substring(0, 40) + '...' : 'N/A'}</p>
                  <p className="opacity-70 text-xs">Formatted URL: {formattedImageUrl ? formattedImageUrl.substring(0, 40) + '...' : 'N/A'}</p>
                </div>
              )}
            </div>
          ) : (
            <Cropper
              image={formattedImageUrl || image}
              crop={crop}
              zoom={zoom}
              aspect={7/10}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
              objectFit="contain"
              showGrid={true}
              cropShape="rect"
              classes={{
                containerClassName: 'h-full w-full'
              }}
            />
          )}
        </div>
        
        <div className="p-4 pb-5 bg-white">
          <div className="flex justify-center">
            <div className="w-5/6">
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.05}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-blue-500"
                aria-label="Zoom"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
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

   const { 
    hasCameraPermission, 
    requestCameraPermission,
    hasFileSystemPermission,
    requestFileSystemPermission 
  } = usePermissions();
  
  // State for active drag item
  const [activeId, setActiveId] = useState(null);
  const [activeDragItemIndex, setActiveDragItemIndex] = useState(null);
  
  // Add this effect to the PhotoEditor component for proper blob URL cleanup
useEffect(() => {
  // Cleanup function to revoke blob URLs when component unmounts or when cropImage changes
  return () => {
    if (cropImage && typeof cropImage === 'string' && cropImage.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(cropImage);
        //('Cleaned up blob URL on unmount or cropImage change:', cropImage);
      } catch (error) {
        console.error('Error revoking blob URL:', error);
      }
    }
  };
}, [cropImage]);
  
  // Initialize with photos from props
  useEffect(() => {
    if (photos && photos.length > 0 && displayPhotos.length === 0) {
      // Filter out any blob URLs from initialization - these should never come from the backend
      const filteredPhotos = photos.filter(url => !url || !url.startsWith('blob:'));
      //("Initializing displayPhotos with filtered photos:", filteredPhotos);
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
  
   const handleFileSelect = async (e, index) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // Check camera permission first
    if (!hasCameraPermission) {
      const granted = await requestCameraPermission();
      if (!granted) {
        toast.error('Camera permission is required to upload photos');
        return;
      }
    }

    // Check file system permission
    if (!hasFileSystemPermission) {
      const granted = await requestFileSystemPermission();
      if (!granted) {
        toast.error('File access permission is required to upload photos');
        return;
      }
    }
    
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
    //(`Created blob URL for display: ${blobUrl}`);
    
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
      
      //("Updated photoFiles:", updatedFiles);
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

      return files;
    },
    
    // Get server URLs that should be preserved
    getServerUrls: () => {
      const serverUrls = displayPhotos.filter(url => 
        url && !url.startsWith('blob:')
      );
      
      //("Getting server URLs to preserve:", serverUrls);
      return serverUrls;
    },
    
    // Get count of pending uploads
    getPendingUploadsCount: () => photoFiles.length,
    

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
      //("Generated blob URL map:", map);
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