// components/gymBros/components/MouseAvatarDesigner.jsx
import React, { useState, useRef } from 'react';
import { X, Palette, Shirt, Upload, Camera, Trash2, Loader, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { renderMouseAvatar, ImageService } from './ImageUtils';
import AvatarService from '../../../services/avatarService';
import { toast } from 'sonner';

// Avatar generation service
class AvatarGenerationService {
  static generateRandomAvatar(userGender = 'Male') {
    const furColors = [
      '#8B4513', '#D2691E', '#A0522D', '#CD853F', '#DEB887',
      '#F4A460', '#D2B48C', '#BC8F8F', '#F5DEB3', '#FFE4B5'
    ];
    
    const shirtColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    const shirtStyles = ['tshirt', 'hoodie', 'tank', 'none'];
    const accessories = ['none', 'glasses', 'hat', 'headphones'];
    const moods = ['happy', 'excited', 'determined', 'neutral', 'cool'];
    const eyeTypes = ['normal', 'excited', 'closed'];

    return {
      furColor: furColors[Math.floor(Math.random() * furColors.length)],
      shirtColor: shirtColors[Math.floor(Math.random() * shirtColors.length)],
      shirtStyle: shirtStyles[Math.floor(Math.random() * shirtStyles.length)],
      accessory: accessories[Math.floor(Math.random() * accessories.length)],
      mood: moods[Math.floor(Math.random() * moods.length)],
      eyes: eyeTypes[Math.floor(Math.random() * eyeTypes.length)]
    };
  }

  static async generateAvatarImage(avatarConfig, size = 512) {
    try {
      // Generate SVG avatar
      const svgElement = renderMouseAvatar(avatarConfig, size, false);
      
      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Create canvas and convert to PNG
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          
          // Fill background with transparent
          ctx.clearRect(0, 0, size, size);
          
          // Draw image
          ctx.drawImage(img, 0, 0, size, size);
          
          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/png');
          URL.revokeObjectURL(svgUrl);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = svgUrl;
      });
    } catch (error) {
      console.error('Error generating avatar image:', error);
      throw error;
    }
  }
}

const MouseAvatarDesigner = ({ currentAvatar, userGender = 'Male', onSave, onClose }) => {
  // Avatar customization state
  const [avatar, setAvatar] = useState(currentAvatar || {
    furColor: '#8B4513',
    shirtColor: '#3B82F6',
    shirtStyle: 'tshirt',
    accessory: 'none',
    eyes: 'normal',
    mood: 'happy'
  });

  // Image upload state
  const [uploadingCustom, setUploadingCustom] = useState(false);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [avatarMode, setAvatarMode] = useState('mouse'); // 'mouse', 'custom', 'upload'
  const [customImagePreview, setCustomImagePreview] = useState(null);
  const [hasCustomAvatar, setHasCustomAvatar] = useState(
    !!(currentAvatar?.customAvatarUrl || currentAvatar?.generatedImageUrl)
  );

  const fileInputRef = useRef(null);

  // Color options
  const furColors = [
    '#8B4513', '#D2691E', '#A0522D', '#CD853F', '#DEB887',
    '#F4A460', '#D2B48C', '#BC8F8F', '#F5DEB3', '#FFE4B5'
  ];
  
  const shirtColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  // Style options
  const shirtStyles = [
    { value: 'tshirt', name: 'T-Shirt', icon: '👕' },
    { value: 'hoodie', name: 'Hoodie', icon: '🧥' },
    { value: 'tank', name: 'Tank Top', icon: '👔' },
    { value: 'none', name: 'None', icon: '🚫' }
  ];

  const accessories = [
    { value: 'none', name: 'None', icon: '🚫' },
    { value: 'glasses', name: 'Glasses', icon: '👓' },
    { value: 'hat', name: 'Hat', icon: '👒' },
    { value: 'headphones', name: 'Headphones', icon: '🎧' }
  ];

  const moods = [
    { value: 'happy', name: 'Happy', icon: '😊' },
    { value: 'excited', name: 'Excited', icon: '🤩' },
    { value: 'determined', name: 'Determined', icon: '😤' },
    { value: 'neutral', name: 'Neutral', icon: '😐' },
    { value: 'cool', name: 'Cool', icon: '😎' }
  ];

  const eyeTypes = [
    { value: 'normal', name: 'Normal', icon: '👁️' },
    { value: 'excited', name: 'Excited', icon: '✨' },
    { value: 'closed', name: 'Closed', icon: '😌' }
  ];

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingCustom(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Upload to service
      const uploadedUrl = await AvatarService.uploadCustomAvatar(file);
      
      setAvatar(prev => ({
        ...prev,
        customAvatarUrl: uploadedUrl
      }));
      
      setAvatarMode('custom');
      setHasCustomAvatar(true);
      toast.success('Avatar uploaded successfully!');

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload avatar');
      setCustomImagePreview(null);
    } finally {
      setUploadingCustom(false);
    }
  };

  // Generate mouse avatar image
  const handleGenerateMouseAvatar = async () => {
    setGeneratingAvatar(true);
    try {
      const generatedImageUrl = await AvatarGenerationService.generateAvatarImage(avatar, 512);
      
      // Upload the generated image
      const uploadedUrl = await AvatarService.uploadGeneratedAvatar(generatedImageUrl, 'mouse-avatar.png');
      
      setAvatar(prev => ({
        ...prev,
        generatedImageUrl: uploadedUrl
      }));
      
      setAvatarMode('custom');
      setHasCustomAvatar(true);
      toast.success('Mouse avatar generated!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate avatar');
    } finally {
      setGeneratingAvatar(false);
    }
  };

  // Generate random avatar
  const handleRandomize = () => {
    const randomAvatar = AvatarGenerationService.generateRandomAvatar(userGender);
    setAvatar(randomAvatar);
    setAvatarMode('mouse');
    toast.success('Random avatar generated!');
  };

  // Remove custom avatar
  const handleRemoveCustom = () => {
    setAvatar(prev => ({
      ...prev,
      customAvatarUrl: null,
      generatedImageUrl: null
    }));
    setCustomImagePreview(null);
    setAvatarMode('mouse');
    setHasCustomAvatar(false);
    toast.success('Custom avatar removed');
  };

  // Save avatar
  const handleSave = async () => {
    try {
      await onSave(avatar);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save avatar');
    }
  };

  // Get current avatar preview
  const getCurrentAvatarPreview = () => {
    if (avatarMode === 'custom' && (avatar.customAvatarUrl || avatar.generatedImageUrl)) {
      const url = avatar.customAvatarUrl || avatar.generatedImageUrl;
      return (
        <img 
          src={url}
          alt="Avatar Preview"
          className="w-full h-full object-contain"
        />
      );
    }
    
    if (customImagePreview && avatarMode === 'upload') {
      return (
        <img 
          src={customImagePreview}
          alt="Upload Preview"
          className="w-full h-full object-contain"
        />
      );
    }
    
    // Default to mouse avatar
    return renderMouseAvatar(avatar, 200);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Design Your Avatar</h2>
              <p className="text-blue-100 mt-1">Customize your gym buddy appearance</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Preview Section */}
          <div className="lg:w-2/5 p-6 bg-gray-50 dark:bg-gray-900 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Preview
            </h3>
            
            {/* Avatar Preview */}
            <div className="flex-1 flex items-center justify-center mb-6">
              <div className="w-48 h-48 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center overflow-hidden">
                {getCurrentAvatarPreview()}
              </div>
            </div>

            {/* Mode Selector */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAvatarMode('mouse')}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                    avatarMode === 'mouse'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border'
                  }`}
                >
                  🐭 Mouse Avatar
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCustom}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                    avatarMode === 'upload'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border'
                  } disabled:opacity-50`}
                >
                  {uploadingCustom ? (
                    <Loader className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    <>📷 Upload Photo</>
                  )}
                </button>
              </div>

              {hasCustomAvatar && (
                <button
                  onClick={handleRemoveCustom}
                  className="w-full p-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4 inline mr-1" />
                  Remove Custom Avatar
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Customization Section */}
          {avatarMode === 'mouse' && (
            <div className="lg:w-3/5 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleRandomize}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Randomize
                  </button>
                </div>

                {/* Fur Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Fur Color
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {furColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setAvatar({...avatar, furColor: color})}
                        className={`w-12 h-12 rounded-full border-2 transition-transform hover:scale-110 ${
                          avatar.furColor === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Shirt Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Shirt Color
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {shirtColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setAvatar({...avatar, shirtColor: color})}
                        className={`w-12 h-12 rounded-full border-2 transition-transform hover:scale-110 ${
                          avatar.shirtColor === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Shirt Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Shirt Style
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {shirtStyles.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setAvatar({...avatar, shirtStyle: style.value})}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          avatar.shirtStyle === style.value
                            ? 'border-blue-500 shadow-lg bg-blue-50 dark:bg-blue-900'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="text-2xl">{style.icon}</div>
                        <span className="text-xs mt-1 block text-gray-600 dark:text-gray-300">
                          {style.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mood */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Mood
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {moods.map((mood) => (
                      <button
                        key={mood.value}
                        onClick={() => setAvatar({...avatar, mood: mood.value})}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          avatar.mood === mood.value
                            ? 'border-blue-500 shadow-lg bg-blue-50 dark:bg-blue-900'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="text-2xl">{mood.icon}</div>
                        <span className="text-xs mt-1 block text-gray-600 dark:text-gray-300">
                          {mood.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Eyes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Eyes
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {eyeTypes.map((eye) => (
                      <button
                        key={eye.value}
                        onClick={() => setAvatar({...avatar, eyes: eye.value})}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          avatar.eyes === eye.value
                            ? 'border-blue-500 shadow-lg bg-blue-50 dark:bg-blue-900'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="text-2xl">{eye.icon}</div>
                        <span className="text-xs mt-1 block text-gray-600 dark:text-gray-300">
                          {eye.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accessories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Accessories
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {accessories.map((acc) => (
                      <button
                        key={acc.value}
                        onClick={() => setAvatar({...avatar, accessory: acc.value})}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          avatar.accessory === acc.value
                            ? 'border-blue-500 shadow-lg bg-blue-50 dark:bg-blue-900'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="text-2xl">{acc.icon}</div>
                        <span className="text-xs mt-1 block text-gray-600 dark:text-gray-300">
                          {acc.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Mouse Avatar Button */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <button
                    onClick={handleGenerateMouseAvatar}
                    disabled={generatingAvatar}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded-lg transition-colors font-medium"
                  >
                    {generatingAvatar ? (
                      <Loader className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                    {generatingAvatar ? 'Generating...' : 'Generate High-Quality Image'}
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Create a high-resolution image from your mouse customization
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Instructions */}
          {avatarMode === 'upload' && !customImagePreview && !hasCustomAvatar && (
            <div className="lg:w-3/5 p-6 flex items-center justify-center">
              <div className="text-center max-w-md">
                <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Upload Your Photo
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Choose a clear photo of yourself for your avatar. It will be used on the map and in your profile.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• JPG, PNG, or WebP format</p>
                  <p>• Maximum file size: 5MB</p>
                  <p>• Square images work best</p>
                </div>
              </div>
            </div>
          )}

          {/* Custom Avatar Display */}
          {(avatarMode === 'custom' || (avatarMode === 'upload' && customImagePreview)) && (
            <div className="lg:w-3/5 p-6 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-64 h-64 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                  {getCurrentAvatarPreview()}
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {avatarMode === 'custom' ? 'Your Custom Avatar' : 'Upload Preview'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {avatarMode === 'custom' 
                    ? 'This avatar will be displayed on the map and in your profile.'
                    : 'This is how your uploaded photo will look as your avatar.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={uploadingCustom || generatingAvatar}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
          >
            {uploadingCustom || generatingAvatar ? (
              <div className="flex items-center justify-center gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                Processing...
              </div>
            ) : (
              'Save Avatar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MouseAvatarDesigner;