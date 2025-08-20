import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '../ui/button';
import { X, RotateCw, RotateCcw, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { toast } from 'sonner';

const ImageCropModal = ({ image, onCropComplete, onClose, aspectRatio = 1 }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);
  const cropperRef = useRef(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.classList.add('crop-modal-open');
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.classList.remove('crop-modal-open');
      document.body.style.overflow = 'unset';
    };
  }, []);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onRotationChange = (rotation) => {
    setRotation(rotation);
  };

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => {
        console.error('Image load error:', error);
        reject(error);
      });
      // Only set crossOrigin for external URLs
      if (url.startsWith('http') && !url.startsWith(window.location.origin)) {
        image.setAttribute('crossOrigin', 'anonymous');
      }
      image.src = url;
    });

  const getRadianAngle = (degreeValue) => {
    return (degreeValue * Math.PI) / 180;
  };

  const rotateSize = (width, height, rotation) => {
    const rotRad = getRadianAngle(rotation);
    return {
      width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0, flip = { horizontal: false, vertical: false }) => {
    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      const rotRad = getRadianAngle(rotation);
      const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

      canvas.width = bBoxWidth;
      canvas.height = bBoxHeight;

      ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
      ctx.rotate(rotRad);
      ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
      ctx.translate(-image.width / 2, -image.height / 2);

      ctx.drawImage(image, 0, 0);

      const croppedCanvas = document.createElement('canvas');
      const croppedCtx = croppedCanvas.getContext('2d');

      if (!croppedCtx) {
        throw new Error('Failed to get cropped canvas context');
      }

      croppedCanvas.width = pixelCrop.width;
      croppedCanvas.height = pixelCrop.height;

      croppedCtx.drawImage(
        canvas,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      return new Promise((resolve, reject) => {
        croppedCanvas.toBlob((file) => {
          if (file) {
            resolve(file);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/jpeg', 0.9);
      });
    } catch (error) {
      console.error('Error in getCroppedImg:', error);
      throw error;
    }
  };

  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels) {
      toast.error('Please select an area to crop');
      return;
    }

    try {
      setLoading(true);
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
      if (croppedImage) {
        onCropComplete(croppedImage);
        onClose();
      } else {
        throw new Error('Failed to create cropped image');
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error(`Failed to crop image: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [image, croppedAreaPixels, rotation, onCropComplete, onClose]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Enter' && croppedAreaPixels) {
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, croppedAreaPixels, handleSave]);

  const handleRotateLeft = () => {
    setRotation((prev) => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation((prev) => prev + 90);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 1));
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-95 flex flex-col"
      style={{ 
        zIndex: 9999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-50 backdrop-blur-sm">
        <h2 className="text-white text-xl font-semibold">Crop Image</h2>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white hover:bg-opacity-10"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Crop Area */}
      <div className="flex-1 relative">
        <Cropper
          ref={cropperRef}
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspectRatio}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onRotationChange={onRotationChange}
          onCropComplete={onCropCompleteHandler}
          style={{
            containerStyle: {
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent',
            },
            mediaStyle: {
              maxHeight: '100%',
              maxWidth: '100%',
            },
          }}
          cropShape="round"
          showGrid={false}
        />
      </div>

      {/* Controls */}
      <div className="bg-black bg-opacity-50 backdrop-blur-sm p-4">
        {/* Zoom Control */}
        <div className="flex items-center justify-center mb-4">
          <Button
            onClick={handleZoomOut}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white hover:bg-opacity-10 mr-2"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="flex-1 max-w-xs mx-4">
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
          <Button
            onClick={handleZoomIn}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white hover:bg-opacity-10 ml-2"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={handleRotateLeft}
            variant="outline"
            size="sm"
            className="bg-transparent border-white text-white hover:bg-white hover:bg-opacity-10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Rotate Left
          </Button>
          
          <Button
            onClick={handleRotateRight}
            variant="outline"
            size="sm"
            className="bg-transparent border-white text-white hover:bg-white hover:bg-opacity-10"
          >
            <RotateCw className="w-4 h-4 mr-2" />
            Rotate Right
          </Button>

          <Button
            onClick={handleSave}
            disabled={loading || !croppedAreaPixels}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Cropping...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Save Crop
              </>
            )}
          </Button>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-sizing: border-box;
        }

        /* Ensure the crop modal takes full screen */
        body.crop-modal-open {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ImageCropModal;
