import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Cropper from 'react-easy-crop';
import { Camera, X, ChevronLeft, ChevronRight, Trash2, Pencil, ImagePlus, Save, Check, Info } from 'lucide-react';
import { toast } from 'sonner';
import gymbrosService from '../../../services/gymbros.service';

// Base URL for images
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative aspect-[7/10] border rounded-lg overflow-hidden ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      onDragStart={handleDragStart}
    >
      {/* Image with the file input on empty slots */}
      {photo ? (
        <>
          <img 
            src={photo.startsWith('blob:') ? photo : photo.startsWith('http') ? photo : `${baseUrl}${photo}`}
            alt={`Photo ${index + 1}`}
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
            onError={(e) => {
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
                <Pencil size={16} className="text-gray-700" />
              </button>
              <button 
                onClick={handleRemove}
                className="p-1.5 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 transition-opacity"
              >
                <Trash2 size={16} className="text-red-500" />
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
          <ImagePlus size={32} className="text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">Add Photo</span>
        </label>
      )}
    </div>
  );
};

// Empty Cell Component
const EmptyCell = ({ index, selectFile }) => {
  return (
    <div className="relative aspect-[7/10] border-2 border-dashed border-gray-300 rounded-lg">
      <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => selectFile(e, index)}
          className="hidden"
        />
        <ImagePlus size={32} className="text-gray-400 mb-2" />
        <span className="text-sm text-gray-500">Add Photo</span>
      </label>
    </div>
  );
};

// Preview Carousel Component
const ImageCarousel = ({ photos, currentIndex, setCurrentIndex, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between text-white">
        <button onClick={onClose} className="p-2">
          <X size={24} />
        </button>
        <div className="text-center">
          <span>{currentIndex + 1}/{photos.length}</span>
        </div>
        <button onClick={() => onEdit(currentIndex)} className="p-2">
          <Pencil size={24} />
        </button>
      </div>
      
      {/* Main Carousel */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <img 
              src={photos[currentIndex].startsWith('blob:') ? photos[currentIndex] : photos[currentIndex].startsWith('http') ? photos[currentIndex] : `${baseUrl}${photos[currentIndex]}`}
              alt={`Preview ${currentIndex + 1}`}
              className="max-h-full max-w-full object-contain"
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button 
              onClick={() => setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))} 
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black bg-opacity-50 text-white"
              disabled={photos.length <= 1}
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))} 
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black bg-opacity-50 text-white"
              disabled={photos.length <= 1}
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>
      
      {/* Thumbnail Navigation */}
      <div className="p-4">
        <div className="flex overflow-x-auto space-x-2 pb-2">
          {photos.map((photo, idx) => (
            <div 
              key={`thumb-${idx}`} 
              className={`w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${currentIndex === idx ? 'border-blue-500 scale-105' : 'border-transparent opacity-70'}`}
              onClick={() => setCurrentIndex(idx)}
            >
              <img 
                src={photo.startsWith('blob:') ? photo : photo.startsWith('http') ? photo : `${baseUrl}${photo}`}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
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
      
      // Create a URL for the blob
      const croppedImageUrl = URL.createObjectURL(blob);
      
      // Pass the cropped image URL back
      onCropSave(croppedImageUrl, blob);
      
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
            {loading ? 'Processing...' : <Check size={20} className="text-blue-500" />}
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

// Source Selection Modal (Camera or Gallery)
const SourceSelectionModal = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-sm w-full p-4">
        <h3 className="text-lg font-semibold mb-4 text-center">Add Photo</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onSelect('camera')}
            className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-gray-100"
          >
            <Camera size={32} className="mb-2 text-blue-500" />
            <span>Camera</span>
          </button>
          <button
            onClick={() => onSelect('gallery')}
            className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-gray-100"
          >
            <ImagePlus size={32} className="mb-2 text-blue-500" />
            <span>Gallery</span>
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 p-2 text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

  // Main PhotoEditor Component
const PhotoEditor = ({ photos = [], onPhotosChange, maxPhotos = 9 }) => {
  const [localPhotos, setLocalPhotos] = useState([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(null);
  const [sourceSelectionIndex, setSourceSelectionIndex] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [cropImage, setCropImage] = useState(null);
  const [cropIndex, setCropIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef(null);
  
  // Initialize with photos from props
  useEffect(() => {
    if (photos && photos.length > 0 && (localPhotos.length === 0 || JSON.stringify(photos) !== JSON.stringify(localPhotos))) {
      console.log('Initializing localPhotos with photos from props:', photos);
      setLocalPhotos([...photos]);
    }
  }, [photos]);
  
  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle DnD end event
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active && over && active.id !== over.id) {
      setLocalPhotos((photos) => {
        // Convert the item IDs to indices
        const activeIndex = parseInt(active.id.toString().split('-')[1]);
        const overIndex = parseInt(over.id.toString().split('-')[1]);
        
        // Ensure both indices are valid
        if (isNaN(activeIndex) || isNaN(overIndex)) {
          console.error('Invalid drag indices:', activeIndex, overIndex);
          return photos;
        }
        
        // Move the item
        const newPhotos = [...photos];
        const [movedItem] = newPhotos.splice(activeIndex, 1);
        newPhotos.splice(overIndex, 0, movedItem);
        
        setHasChanges(true);
        return newPhotos;
      });
    }
  };
  
  // Handle file selection
  const handleFileSelect = (e, index) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setSelectedFileIndex(index);
    
    // Show source selection modal first
    setSourceSelectionIndex(index);
  };
  
  // Handle source selection (camera or gallery)
  const handleSourceSelect = async (source) => {
    // Get the file input element
    const fileInput = fileInputRef.current;
    
    // For gallery, we just continue with the file
    if (source === 'gallery') {
      // Trigger file selection dialog
      if (fileInput) {
        fileInput.click();
      }
    } else {
      // For camera, we need to request camera access
      try {
        // Check if MediaDevices API is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera not supported on this device');
        }
        
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Stop the stream immediately (we'll handle the actual camera in another component)
        stream.getTracks().forEach(track => track.stop());
        
        // For now, just fallback to file selection
        if (fileInput) {
          fileInput.click();
        }
      } catch (error) {
        console.error('Camera access error:', error);
        toast.error('Failed to access camera. Please use gallery instead.');
        
        // Fallback to gallery
        if (fileInput) {
          fileInput.click();
        }
      }
    }
    
    // Close the source selection modal
    setSourceSelectionIndex(null);
  };
  
  // Process the selected file
  const processFile = (file) => {
    if (!file) return;
    
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
    
    // Create a URL for the file
    const imageUrl = URL.createObjectURL(file);
    
    // Set the image for cropping
    setCropImage(imageUrl);
    setCropIndex(selectedFileIndex);
  };
  
  // Handle image removal
  const handleRemoveImage = (index) => {
    setLocalPhotos(prevPhotos => {
      const newPhotos = [...prevPhotos];
      
      // Remove the photo at the specified index
      newPhotos.splice(index, 1);
      
      // Mark that changes have been made
      setHasChanges(true);
      
      // Return the updated array
      return newPhotos;
    });
  };
  
  // Handle image editing (cropping)
  const handleEditImage = (index) => {
    setCropImage(localPhotos[index]);
    setCropIndex(index);
    
    // If we're in preview mode, close it first
    if (showPreview) {
      setShowPreview(false);
    }
  };
  
  // Handle save after crop
  const handleCropSave = (croppedImageUrl, blob) => {
    const newPhotos = [...localPhotos];
    
    // Update or add the cropped image
    if (cropIndex !== null) {
      if (cropIndex < newPhotos.length) {
        newPhotos[cropIndex] = croppedImageUrl;
      } else {
        // Add at the specified index, filling any gaps with empty strings
        while (newPhotos.length < cropIndex) {
          newPhotos.push('');
        }
        newPhotos.push(croppedImageUrl);
      }
    }
    
    setLocalPhotos(newPhotos);
    setCropImage(null);
    setCropIndex(null);
    setHasChanges(true);
    
    // If we were in preview, go back to it
    if (previewIndex !== null) {
      setShowPreview(true);
    }
  };
  
  // Handle crop cancel
  const handleCropCancel = () => {
    setCropImage(null);
    setCropIndex(null);
    
    // If we were in preview, go back to it
    if (previewIndex !== null) {
      setShowPreview(true);
    }
  };
  
  // Handle save changes
  const handleSaveChanges = async () => {
    // If no changes, just return
    if (!hasChanges) return;
    
    setIsSaving(true);
    
    try {
      // Convert blob URLs to files for upload
      const filesToUpload = [];
      const uploadIndices = [];
      
      // Collect blob URLs that need to be uploaded
      for (let i = 0; i < localPhotos.length; i++) {
        const photo = localPhotos[i];
        if (photo && photo.startsWith('blob:')) {
          try {
            // Fetch the blob data
            const response = await fetch(photo);
            const blob = await response.blob();
            
            // Create a File object from the blob
            const file = new File([blob], `photo-${i}.jpg`, { type: blob.type || 'image/jpeg' });
            filesToUpload.push(file);
            uploadIndices.push(i);
          } catch (error) {
            console.error(`Error converting blob to file at index ${i}:`, error);
            toast.error('Failed to process image. Please try again.');
            // Skip this file and continue with others
          }
        }
      }
      
      // Upload the new files if any
      if (filesToUpload.length > 0) {
        const uploadResult = await gymbrosService.uploadProfileImages(filesToUpload);
        
        if (uploadResult.success && uploadResult.imageUrls) {
          // Create a copy of the photos array
          const updatedPhotos = [...localPhotos];
          
          // Replace blob URLs with server URLs
          uploadIndices.forEach((index, i) => {
            if (uploadResult.imageUrls[i]) {
              updatedPhotos[index] = uploadResult.imageUrls[i];
            }
          });
          
          // Update state with new URLs
          setLocalPhotos(updatedPhotos);
          
          // Notify parent component of the changes
          onPhotosChange(updatedPhotos);
          
          toast.success('Photos saved successfully');
          setHasChanges(false);
        } else {
          throw new Error('Failed to upload images');
        }
      } else {
        // No new images to upload, just update the order
        console.log('No new images to upload, just updating order with:', localPhotos);
        onPhotosChange([...localPhotos]);
        toast.success('Photo order updated');
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error saving photos:', error);
      toast.error('Failed to save photos: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };
  
  // Fill array with empty strings to maxPhotos length for grid
  const displayPhotos = [...localPhotos];
  while (displayPhotos.length < maxPhotos) {
    displayPhotos.push('');
  }
  
  // Filter out empty strings for preview
  const previewPhotos = localPhotos.filter(photo => photo);
  
  return (
    <div className="relative">
      {/* Main Photo Grid */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Your Photos</h3>
          <div className="flex space-x-2">
            {previewPhotos.length > 0 && (
              <button
                onClick={() => {
                  setShowPreview(true);
                  setPreviewIndex(0);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Preview
              </button>
            )}
            {hasChanges && (
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save
                  </>
                )}
              </button>
            )}
          </div>
        </div>
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
                  key={`${photo}-${index}`}
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
            processFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />
      
      {/* Modal for source selection */}
      <AnimatePresence>
        {sourceSelectionIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SourceSelectionModal
              onSelect={handleSourceSelect}
              onClose={() => setSourceSelectionIndex(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Preview Carousel */}
      <AnimatePresence>
        {showPreview && previewPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ImageCarousel
              photos={previewPhotos}
              currentIndex={previewIndex}
              setCurrentIndex={setPreviewIndex}
              onClose={() => setShowPreview(false)}
              onEdit={(index) => {
                setShowPreview(false);
                handleEditImage(index);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Image Cropper */}
      <AnimatePresence>
        {cropImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ImageCropper
              image={cropImage}
              onCropSave={handleCropSave}
              onCropCancel={handleCropCancel}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotoEditor;