// components/GymBros/MouseAvatarDesigner.jsx
import React, { useState, useRef } from 'react';
import { X, Palette, Shirt, Upload, Camera, Trash2, Loader, Image as ImageIcon } from 'lucide-react';
import { renderMouseAvatar } from './MouseAvatarUtils';
import AvatarService from '../../../services/avatarService';
import { toast } from 'sonner';

const MouseAvatarDesigner = ({ currentAvatar, userGender = 'Male', onSave, onClose }) => {
  // Avatar customization state
  const [avatar, setAvatar] = useState(currentAvatar || {
    furColor: '#8B4513', // brown
    shirtColor: '#3B82F6', // blue
    shirtStyle: 'tshirt', // tshirt, hoodie, tank, none
    accessory: 'none', // none, glasses, hat, headphones
    eyes: 'normal', // normal, wink, closed
    mood: 'happy' // happy, neutral, excited
  });

  // Image upload state
  const [uploadingCustom, setUploadingCustom] = useState(false);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [avatarMode, setAvatarMode] = useState('mouse'); // 'mouse', 'custom', 'upload'
  const [customImagePreview, setCustomImagePreview] = useState(null);
  const [hasCustomAvatar, setHasCustomAvatar] = useState(!!currentAvatar?.customAvatarUrl);
  
  const fileInputRef = useRef(null);

  // Avatar options
  const furColors = [
    { name: 'Brown', value: '#8B4513' },
    { name: 'Gray', value: '#6B7280' },
    { name: 'White', value: '#F3F4F6' },
    { name: 'Black', value: '#1F2937' },
    { name: 'Golden', value: '#D97706' },
    { name: 'Cream', value: '#FEF3C7' },
    { name: 'Pink', value: '#FFC0CB' },
    { name: 'Blue', value: '#93C5FD' }
  ];

  const shirtColors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Yellow', value: '#FCD34D' },
    { name: 'Orange', value: '#FB923C' },
    { name: 'Teal', value: '#14B8A6' }
  ];

  const shirtStyles = [
    { name: 'T-Shirt', value: 'tshirt', icon: '👕' },
    { name: 'Hoodie', value: 'hoodie', icon: '🧥' },
    { name: 'Tank Top', value: 'tank', icon: '🎽' },
    { name: 'No Shirt', value: 'none', icon: '❌' }
  ];

  const accessories = [
    { name: 'None', value: 'none', icon: '❌' },
    { name: 'Glasses', value: 'glasses', icon: '👓' },
    { name: 'Cap', value: 'hat', icon: '🧢' },
    { name: 'Headphones', value: 'headphones', icon: '🎧' },
    { name: 'Sunglasses', value: 'sunglasses', icon: '🕶️' },
    { name: 'Bandana', value: 'bandana', icon: '🏴‍☠️' }
  ];

  const moods = [
    { name: 'Happy', value: 'happy', icon: '😊' },
    { name: 'Excited', value: 'excited', icon: '🤩' },
    { name: 'Neutral', value: 'neutral', icon: '😐' },
    { name: 'Cool', value: 'cool', icon: '😎' },
    { name: 'Determined', value: 'determined', icon: '💪' }
  ];

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploadingCustom(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setCustomImagePreview(previewUrl);
      setAvatarMode('upload');

      // Upload to backend
      const result = await AvatarService.uploadCustomAvatar(file);
      
      if (result.success) {
        const newAvatar = {
          ...avatar,
          customAvatarUrl: result.url,
          generatedImageUrl: null // Clear generated image when custom is uploaded
        };
        
        setAvatar(newAvatar);
        setHasCustomAvatar(true);
        toast.success('Custom avatar uploaded successfully!');
      }

    } catch (error) {
      console.error('Error uploading custom avatar:', error);
      toast.error('Failed to upload custom avatar');
      setCustomImagePreview(null);
      setAvatarMode('mouse');
    } finally {
      setUploadingCustom(false);
    }
  };

  // Handle mouse avatar generation
  const handleGenerateMouseAvatar = async () => {
    setGeneratingAvatar(true);
    setAvatarMode('mouse');

    try {
      const result = await AvatarService.generateAvatarFromConfig(avatar, userGender);
      
      if (result.success) {
        const newAvatar = {
          ...result.avatar,
          customAvatarUrl: null // Clear custom image when mouse is generated
        };
        
        setAvatar(newAvatar);
        setHasCustomAvatar(false);
        toast.success('Mouse avatar generated successfully!');
      }

    } catch (error) {
      console.error('Error generating mouse avatar:', error);
      toast.error('Failed to generate mouse avatar');
    } finally {
      setGeneratingAvatar(false);
    }
  };

  // Handle delete custom avatar
  const handleDeleteCustomAvatar = async () => {
    try {
      await AvatarService.deleteCustomAvatar();
      
      const newAvatar = {
        ...avatar,
        customAvatarUrl: null
      };
      
      setAvatar(newAvatar);
      setHasCustomAvatar(false);
      setCustomImagePreview(null);
      setAvatarMode('mouse');
      
      toast.success('Custom avatar deleted');
      
    } catch (error) {
      console.error('Error deleting custom avatar:', error);
      toast.error('Failed to delete custom avatar');
    }
  };

  // Handle save avatar
  const handleSave = async () => {
    try {
      let finalAvatar = avatar;

      // If user made changes to mouse avatar, generate it first
      if (avatarMode === 'mouse' && !avatar.generatedImageUrl) {
        await handleGenerateMouseAvatar();
        finalAvatar = avatar; // Use the updated avatar after generation
      }

      // Save configuration to profile
      await AvatarService.saveAvatarConfig(finalAvatar);
      
      onSave(finalAvatar);
      toast.success('Avatar saved successfully!');
      
    } catch (error) {
      console.error('Error saving avatar:', error);
      toast.error('Failed to save avatar');
    }
  };

  // Get current avatar URL for preview
  const getPreviewAvatarUrl = () => {
    if (avatarMode === 'upload' && customImagePreview) {
      return customImagePreview;
    }
    return AvatarService.getAvatarUrl(avatar, userGender, 180);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                🐭 Design Your Avatar
              </h2>
              <p className="text-blue-100 text-sm mt-1">Customize or upload your avatar for the map</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row h-[calc(90vh-120px)]">
          {/* Preview Section */}
          <div className="lg:w-2/5 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center">
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-8 shadow-lg">
              <div className="transform hover:scale-105 transition-transform">
                {avatarMode === 'mouse' ? (
                  // Show mouse avatar preview
                  renderMouseAvatar(avatar, 180)
                ) : (
                  // Show image avatar preview
                  <div className="w-45 h-45 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {(customImagePreview || avatar.customAvatarUrl) ? (
                      <img
                        src={getPreviewAvatarUrl()}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover"
                        onError={() => setAvatarMode('mouse')}
                      />
                    ) : (
                      <ImageIcon className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {avatarMode === 'mouse' ? 'Your Gym Mouse' : 'Your Custom Avatar'}
                </p>
                {avatarMode === 'mouse' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Mood: {avatar.mood} {moods.find(m => m.value === avatar.mood)?.icon}
                  </p>
                )}
              </div>
            </div>

            {/* Avatar Type Selection */}
            <div className="mt-6 flex gap-2 w-full max-w-sm">
              <button
                onClick={() => setAvatarMode('mouse')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  avatarMode === 'mouse'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                    : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="text-2xl mb-1">🐭</div>
                <div className="text-xs font-medium">Mouse Avatar</div>
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingCustom}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  avatarMode === 'upload' || hasCustomAvatar
                    ? 'border-green-500 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300' 
                    : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {uploadingCustom ? (
                  <Loader className="h-6 w-6 animate-spin mx-auto mb-1" />
                ) : (
                  <div className="text-2xl mb-1">📷</div>
                )}
                <div className="text-xs font-medium">Upload Photo</div>
              </button>
            </div>

            {/* Delete Custom Avatar Button */}
            {hasCustomAvatar && (
              <button
                onClick={handleDeleteCustomAvatar}
                className="mt-3 flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-sm">Delete Custom Photo</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Customization Options - Only show for mouse avatar mode */}
          {avatarMode === 'mouse' && (
            <div className="lg:w-3/5 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Fur Color */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200">
                    🎨 Fur Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {furColors.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setAvatar({...avatar, furColor: color.value})}
                        className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                          avatar.furColor === color.value 
                            ? 'border-blue-500 shadow-lg' 
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div 
                          className="w-8 h-8 rounded-full mx-auto shadow-inner" 
                          style={{ backgroundColor: color.value }} 
                        />
                        <span className="text-xs mt-1 block text-gray-600 dark:text-gray-300">
                          {color.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Mood */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200">
                    😊 Mood
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {moods.map(mood => (
                      <button
                        key={mood.value}
                        onClick={() => setAvatar({...avatar, mood: mood.value})}
                        className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
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
                
                {/* Shirt Style */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200">
                    👕 Shirt Style
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {shirtStyles.map(style => (
                      <button
                        key={style.value}
                        onClick={() => setAvatar({...avatar, shirtStyle: style.value})}
                        className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
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
                
                {/* Shirt Color */}
                {avatar.shirtStyle !== 'none' && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 animate-slideIn">
                    <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200">
                      🎨 Shirt Color
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {shirtColors.map(color => (
                        <button
                          key={color.value}
                          onClick={() => setAvatar({...avatar, shirtColor: color.value})}
                          className={`p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                            avatar.shirtColor === color.value 
                              ? 'border-blue-500 shadow-lg' 
                              : 'border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <div 
                            className="w-10 h-10 rounded shadow-inner" 
                            style={{ backgroundColor: color.value }} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Accessories */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200">
                    🎩 Accessory
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {accessories.map(acc => (
                      <button
                        key={acc.value}
                        onClick={() => setAvatar({...avatar, accessory: acc.value})}
                        className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
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
                    {generatingAvatar ? 'Generating...' : 'Generate Mouse Avatar'}
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Create a high-quality image from your mouse customization
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Instructions - Show when in upload mode */}
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