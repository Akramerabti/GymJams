import React, { useState, useEffect, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, X, Crop, Loader, Check, Info } from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Key to keeping track of blob URLs vs server URLs
const BLOB_MARKER = 'BLOB_MARKER:';

/**
 * Internal structure for tracking image state properly
 * Each entry is either:
 * 1. A string representing a server URL
 * 2. An object with { blobUrl, file } for images that need uploading
 */
class ImageEntry {
  constructor(source) {
    if (typeof source === 'string') {
      if (source.startsWith('blob:')) {
        // It's a blob URL - create a marked entry that needs to be uploaded
        this.type = 'blob';
        this.displayUrl = source;
        this.serverUrl = null;
        this.needsUpload = true;
        this.file = null; // Will be populated later
      } else {
        // It's already a server URL
        this.type = 'server';
        this.displayUrl = source;
        this.serverUrl = source;
        this.needsUpload = false;
        this.file = null;
      }
    } else if (source && source.file instanceof File) {
      // It's already a file object
      this.type = 'file';
      this.displayUrl = URL.createObjectURL(source.file);
      this.serverUrl = null;
      this.needsUpload = true;
      this.file = source.file;
    } else {
      // Empty or invalid entry
      this.type = 'empty';
      this.displayUrl = null;
      this.serverUrl = null;
      this.needsUpload = false;
      this.file = null;
    }
  }

  // Convert this entry to the final form for server submission
  toServerForm() {
    return this.serverUrl;
  }

  // Convert this entry to the form for internal state
  toStateForm() {
    return this.displayUrl;
  }

  // Create a file from blob URL if needed
  async prepareForUpload() {
    if (this.type === 'blob' && !this.file) {
      try {
        const response = await fetch(this.displayUrl);
        const blob = await response.blob();
        this.file = new File(
          [blob], 
          `photo-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`, 
          { type: blob.type || 'image/jpeg' }
        );
      } catch (error) {
        console.error('Error converting blob to file:', error);
        throw error;
      }
    }
    return this;
  }
}

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

  // Prevent default on dragstart to avoid browser default drag behavior
  const handleDragStart = (e) => {
    e.preventDefault();
  };
  
  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove(index);
  };
  
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(index);
  };

  // Get the display URL for this image
  const displayUrl = photo || null;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative aspect-[7/10] border rounded-lg overflow-hidden ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      onDragStart={handleDragStart}
    >
      {photo ? (
        <>
          <img 
            src={displayUrl}
            alt={`Photo ${index + 1}`}
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
            onError={(e) => {
              console.error(`Image load error for ${displayUrl}`);
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
                <Crop size={16} className="text-gray-700" />
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

// Image Cropper Component
const ImageCropper = ({ image, onCropComplete, onCropCancel, onCropSave }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    
    setLoading(true);
    
    try {
      // Create a canvas to draw the cropped image
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      // Add error handling for image loading
      const imageLoadPromise = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = (err) => {
          console.error('Image load error:', err);
          reject(new Error('Failed to load image for cropping'));
        };
        img.src = image;
      });
      
      await imageLoadPromise;
      
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
      const blobPromise = new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        }, 'image/jpeg', 0.95);
      });
      
      const blob = await blobPromise;
      
      // Create a File object from the blob (will be uploaded later)
      const croppedFile = new File(
        [blob],
        `cropped-image-${Date.now()}.jpg`,
        { type: 'image/jpeg' }
      );
      
      // Create a URL for the blob (for display only)
      const croppedImageUrl = URL.createObjectURL(blob);
      
      // Pass both the URL (for display) and the file (for upload)
      onCropSave(croppedImageUrl, croppedFile);
      
    } catch (error) {
      console.error('Error during image cropping:', error);
      toast.error('Failed to crop image: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b">
          <button onClick={onCropCancel} className="p-2 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
          <h2 className="text-lg font-semibold">Crop Image</h2>
          <button 
            onClick={handleSave} 
            className="p-2 flex items-center rounded-full hover:bg-gray-100"
            disabled={loading}
          >
            {loading ? <Loader size={20} className="animate-spin" /> : <Check size={20} className="text-blue-500" />}
          </button>
        </div>
        
        {/* Cropper */}
        <div className="relative h-[400px] w-full bg-gray-900">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={7/10} // Updated to 7:10 aspect ratio
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>
        
        {/* Zoom Control */}
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
const PhotoEditor = ({ photos = [], onPhotosChange, maxPhotos = 9 }) => {
  // Track actual image entries (combination of server URLs and files to upload)
  const [imageEntries, setImageEntries] = useState([]);
  // Track display URLs for the UI (same as before)
  const [localPhotos, setLocalPhotos] = useState([]);
  
  const [cropImage, setCropImage] = useState(null);
  const [cropIndex, setCropIndex] = useState(null);
  const fileInputRef = useRef(null);
  const uploaderRef = useRef({ 
    pendingUploads: [] 
  });
  
  // Initialize with photos from props
  useEffect(() => {
    if (photos && photos.length > 0 && (localPhotos.length === 0)) {
      console.log('Initializing photo editor with photos:', photos);
      
      // Create proper image entries
      const entries = photos.map(photo => new ImageEntry(photo));
      setImageEntries(entries);
      
      // Create display URLs for the UI
      const displayUrls = entries.map(entry => entry.displayUrl);
      setLocalPhotos(displayUrls);
    }
  }, [photos]);
  
  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle DnD end event
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active && over && active.id !== over.id) {
      // Convert the item IDs to indices
      const activeIndex = parseInt(active.id.toString().split('-')[1]);
      const overIndex = parseInt(over.id.toString().split('-')[1]);
      
      // Ensure both indices are valid
      if (isNaN(activeIndex) || isNaN(overIndex)) {
        console.error('Invalid drag indices:', activeIndex, overIndex);
        return;
      }
      
      // Move the entries in both arrays to maintain synchronization
      setImageEntries(entries => arrayMove(entries, activeIndex, overIndex));
      setLocalPhotos(photos => arrayMove(photos, activeIndex, overIndex));
      
      // Notify parent component with only the display representation
      const newPhotosForParent = arrayMove(localPhotos, activeIndex, overIndex);
      onPhotosChange(newPhotosForParent);
    }
  };
  
  // Handle file selection
  const handleFileSelect = (e, index) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    // Create a URL for the file for display
    const imageUrl = URL.createObjectURL(file);
    
    // Set the image for cropping
    setCropImage(imageUrl);
    setCropIndex(index);
  };
  
  // Handle image removal
  const handleRemoveImage = (index) => {
    setLocalPhotos(prevPhotos => {
      const newPhotos = [...prevPhotos];
      newPhotos.splice(index, 1);
      
      // Also update image entries
      setImageEntries(prevEntries => {
        const newEntries = [...prevEntries];
        newEntries.splice(index, 1);
        return newEntries;
      });
      
      // Notify parent component of the changes
      onPhotosChange(newPhotos);
      
      return newPhotos;
    });
  };
  
  // Handle image editing (cropping)
  const handleEditImage = (index) => {
    if (index >= localPhotos.length) return;
    
    // The URL for cropping is always the display URL
    const cropperUrl = localPhotos[index];
    
    setCropImage(cropperUrl);
    setCropIndex(index);
  };
  
  // Handle save after crop
  const handleCropSave = (croppedImageUrl, croppedFile) => {
    // Update both arrays
    
    // 1. Update local photos array (display URLs)
    setLocalPhotos(prevPhotos => {
      const newPhotos = [...prevPhotos];
      
      if (cropIndex !== null) {
        if (cropIndex < newPhotos.length) {
          // Replace existing photo
          newPhotos[cropIndex] = croppedImageUrl;
        } else {
          // Add new photo
          while (newPhotos.length < cropIndex) {
            newPhotos.push('');
          }
          newPhotos.push(croppedImageUrl);
        }
      }
      
      return newPhotos;
    });
    
    // 2. Update image entries array (for actual upload)
    setImageEntries(prevEntries => {
      const newEntries = [...prevEntries];
      
      // Create an entry with the file directly
      const newEntry = new ImageEntry({ file: croppedFile });
      
      if (cropIndex !== null) {
        if (cropIndex < newEntries.length) {
          // Replace existing entry
          // If the previous entry was a server URL, we need to revoke it
          const prevEntry = newEntries[cropIndex];
          if (prevEntry.type === 'blob' && prevEntry.displayUrl) {
            URL.revokeObjectURL(prevEntry.displayUrl);
          }
          newEntries[cropIndex] = newEntry;
        } else {
          // Add new entry
          while (newEntries.length < cropIndex) {
            newEntries.push(new ImageEntry());
          }
          newEntries.push(newEntry);
        }
      }
      
      return newEntries;
    });
    
    // Notify parent component of the changes
    onPhotosChange(localPhotos);
    
    // Clean up
    setCropImage(null);
    setCropIndex(null);
  };
  
  // Handle crop cancel
  const handleCropCancel = () => {
    setCropImage(null);
    setCropIndex(null);
  };
  
  // Get all files that need to be uploaded
  const getPendingUploads = () => {
    return imageEntries
      .filter(entry => entry.needsUpload)
      .map(entry => entry.file)
      .filter(Boolean);
  };
  
  // Get server URLs that should be preserved
  const getServerUrls = () => {
    return imageEntries
      .filter(entry => !entry.needsUpload && entry.serverUrl)
      .map(entry => entry.serverUrl);
  };
  
  // Prepare all images for upload - convert blob URLs to files
  const prepareForUpload = async () => {
    try {
      // Make a copy of the entries that need preparation
      const entries = [...imageEntries];
      
      // Process each entry that needs uploading
      const preparedEntries = await Promise.all(
        entries.map(async (entry) => {
          if (entry.needsUpload && entry.type === 'blob') {
            return await entry.prepareForUpload();
          }
          return entry;
        })
      );
      
      // Update state with prepared entries
      setImageEntries(preparedEntries);
      
      // Return files that need uploading
      return preparedEntries
        .filter(entry => entry.needsUpload && entry.file)
        .map(entry => entry.file);
    } catch (error) {
      console.error('Error preparing images for upload:', error);
      throw error;
    }
  };
  
  // Expose methods to parent component via ref
  React.useImperativeHandle(
    uploaderRef,
    () => ({
      async getFilesToUpload() {
        return await prepareForUpload();
      },
      getServerUrls() {
        return getServerUrls();
      }
    })
  );
  
  // Fill array with empty strings to maxPhotos length for grid
  const displayPhotos = [...localPhotos];
  while (displayPhotos.length < maxPhotos) {
    displayPhotos.push('');
  }
  
  return (
    <div className="relative">
      {/* Main Photo Grid */}
      <div className="mb-4">
        <div className="mb-2 flex items-center text-gray-500 text-sm">
          <Info size={14} className="mr-1" />
          <span>First photo will be your main profile picture. Drag to reorder.</span>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={displayPhotos.map((_, index) => `photo-${index}`)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-4">
              {displayPhotos.map((photo, index) => (
                <SortableImageItem
                  key={`photo-item-${index}`} // Unique key with index
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
      </div>

      {/* Hidden file input for gallery selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e, localPhotos.filter(Boolean).length);
          }
        }}
        className="hidden"
      />
      
      {/* Image Cropper */}
      {cropImage && (
        <ImageCropper
          image={cropImage}
          onCropSave={handleCropSave}
          onCropCancel={handleCropCancel}
        />
      )}
      
      {localPhotos.filter(Boolean).length < 2 && (
        <p className="text-sm text-red-500 mt-2">Please upload at least 2 images.</p>
      )}
    </div>
  );
};

// Add methods to access from parent component
const PhotoEditorWithRef = React.forwardRef((props, ref) => (
  <PhotoEditor {...props} ref={ref} />
));

export default PhotoEditorWithRef;