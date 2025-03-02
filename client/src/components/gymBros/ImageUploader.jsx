import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, X, Crop } from 'lucide-react';

const ImageUploader = ({ images, onImagesChange }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 6) {
      alert('You can only upload up to 6 images.');
      return;
    }

    const newImages = files.map((file) => URL.createObjectURL(file));
    onImagesChange([...images, ...newImages]);
  };

  const handleCropSave = () => {
    if (croppedArea && currentImageIndex !== null) {
      const canvas = document.createElement('canvas');
      const image = new Image();
      image.src = images[currentImageIndex];

      image.onload = () => {
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        canvas.width = croppedArea.width;
        canvas.height = croppedArea.height;
        const ctx = canvas.getContext('2d');

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

        canvas.toBlob((blob) => {
          const croppedImageUrl = URL.createObjectURL(blob);
          const updatedImages = [...images];
          updatedImages[currentImageIndex] = croppedImageUrl;
          onImagesChange(updatedImages);
          setCurrentImageIndex(null);
          setIsEditing(false);
        }, 'image/jpeg');
      };
    }
  };

  const handleRemoveImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
  };

  const handleEditImage = (index) => {
    setCurrentImageIndex(index);
    setIsEditing(true);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {isEditing && currentImageIndex !== null ? (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg h-full max-h-[90vh] flex flex-col relative">
            <div className="h-[80%] relative">
              <Cropper
                image={images[currentImageIndex]}
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
                  className="bg-primary text-white px-4 py-2 bg-blue-700 rounded-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 w-full">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="relative aspect-[7/10] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
              {index < images.length ? (
                <>
                  <img
                    src={images[index]}
                    alt={`Uploaded ${index}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 opacity-100 flex flex-col justify-between p-2">
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
                </>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer h-full">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Upload size={24} className="text-gray-400 mb-2" />
                </label>
              )}
            </div>
          ))}
        </div>
      )}
      {images.length < 2 && (
        <p className="text-sm text-red-500 mt-2">Please upload at least 2 images.</p>
      )}
    </div>
  );
};

export default ImageUploader;