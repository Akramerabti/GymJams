// client/src/components/SimpleAvatarDesigner.js
import React, { useState, useEffect } from 'react';
import { X, Upload, RefreshCw, Download, Palette, User, Camera } from 'lucide-react';

const SimpleAvatarDesigner = ({ currentAvatar, userGender = 'Male', onSave, onClose }) => {
  const [avatar, setAvatar] = useState({
    baseCharacter: 'gym_mouse',
    furColor: '#8B4513',
    mood: 'happy',
    pose: 'standing',
    type: 'mouse',
    ...currentAvatar
  });

  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customFile, setCustomFile] = useState(null);
  const [activeTab, setActiveTab] = useState('customize'); // 'customize' or 'upload'

  // Available options
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

  const moods = [
    { name: 'Happy', value: 'happy', emoji: '😊' },
    { name: 'Excited', value: 'excited', emoji: '🤩' },
    { name: 'Determined', value: 'determined', emoji: '😤' },
    { name: 'Cool', value: 'cool', emoji: '😎' },
    { name: 'Pumped', value: 'pumped', emoji: '💪' }
  ];

  const poses = [
    { name: 'Standing', value: 'standing', emoji: '🧍' },
    { name: 'Flexing', value: 'flexing', emoji: '💪' },
    { name: 'Running', value: 'running', emoji: '🏃' },
    { name: 'Lifting', value: 'lifting', emoji: '🏋️' },
    { name: 'Waving', value: 'waving', emoji: '👋' }
  ];

  // Generate preview when avatar changes
  useEffect(() => {
    generatePreview();
  }, [avatar]);

  const generatePreview = async () => {
    if (avatar.customAvatarUrl) {
      setPreviewUrl(avatar.customAvatarUrl);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/avatar/generate-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatarConfig: avatar,
          userGender: userGender,
          size: 256
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPreviewUrl(data.url);
      } else {
        console.error('Failed to generate preview:', data.error);
        // Use fallback URL based on gender
        setPreviewUrl(getFallbackAvatarUrl(userGender));
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreviewUrl(getFallbackAvatarUrl(userGender));
    } finally {
      setIsGenerating(false);
    }
  };

  const getFallbackAvatarUrl = (gender) => {
    const genderFolder = gender.toLowerCase();
    const baseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
    return `${baseUrl}/storage/v1/object/public/gym-bros/avatar-assets/fallback/default_mouse_${genderFolder}.png`;
  };

  const handleAvatarChange = (field, value) => {
    setAvatar(prev => ({
      ...prev,
      [field]: value,
      customAvatarUrl: null, // Clear custom avatar when changing generated avatar
      version: (prev.version || 1) + 1
    }));
  };

  const handleCustomFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setCustomFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
      
      // Update avatar config
      setAvatar(prev => ({
        ...prev,
        customAvatarUrl: previewUrl,
        version: (prev.version || 1) + 1
      }));
    }
  };

  const handleSave = async () => {
    setIsGenerating(true);
    try {
      if (customFile) {
        // Upload custom avatar
        const formData = new FormData();
        formData.append('customAvatar', customFile);

        const response = await fetch('/api/avatar/upload-custom', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });

        const data = await response.json();
        if (data.success) {
          const finalAvatar = {
            ...avatar,
            customAvatarUrl: data.url,
            generatedImageUrl: null
          };
          onSave(finalAvatar);
        } else {
          throw new Error(data.error || 'Failed to upload custom avatar');
        }
      } else {
        // Generate and save avatar
        const response = await fetch('/api/avatar/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            avatarConfig: avatar
          }),
        });

        const data = await response.json();
        if (data.success) {
          onSave(data.avatar);
        } else {
          throw new Error(data.error || 'Failed to generate avatar');
        }
      }
    } catch (error) {
      console.error('Error saving avatar:', error);
      alert('Failed to save avatar. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAvatar = () => {
    if (previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = `gym-mouse-avatar-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Customize Your Gym Mouse</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex mt-4 border-b">
            <button
              onClick={() => setActiveTab('customize')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'customize'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Palette className="inline h-4 w-4 mr-2" />
              Customize Mouse
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload className="inline h-4 w-4 mr-2" />
              Upload Custom
            </button>
          </div>
        </div>

        <div className="flex max-h-[calc(90vh-140px)]">
          {/* Preview Panel */}
          <div className="w-1/3 p-6 border-r border-gray-200 flex flex-col items-center">
            <div className="relative">
              <div className="w-64 h-64 rounded-full border-4 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                {isGenerating ? (
                  <div className="flex flex-col items-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                    <span className="text-sm text-gray-600">Generating...</span>
                  </div>
                ) : previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = getFallbackAvatarUrl(userGender);
                    }}
                  />
                ) : (
                  <div className="text-gray-400">
                    <User className="h-16 w-16" />
                  </div>
                )}
              </div>
              
              {/* Gender indicator */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {userGender}
                </span>
              </div>
            </div>

            {/* Preview actions */}
            <div className="mt-6 space-y-2">
              <button
                onClick={downloadAvatar}
                disabled={!previewUrl || isGenerating}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
              
              <div className="text-center text-sm text-gray-500">
                Preview updates automatically
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'customize' ? (
              <div className="space-y-6">
                {/* Fur Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Fur Color
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {furColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleAvatarChange('furColor', color.value)}
                        className={`relative w-16 h-16 rounded-full border-4 transition-all ${
                          avatar.furColor === color.value
                            ? 'border-blue-500 scale-110'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {avatar.furColor === color.value && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mood */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Mood
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {moods.map((mood) => (
                      <button
                        key={mood.value}
                        onClick={() => handleAvatarChange('mood', mood.value)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          avatar.mood === mood.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{mood.emoji}</span>
                          <span className="font-medium">{mood.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Pose
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {poses.map((pose) => (
                      <button
                        key={pose.value}
                        onClick={() => handleAvatarChange('pose', pose.value)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          avatar.pose === pose.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{pose.emoji}</span>
                          <span className="font-medium">{pose.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset button */}
                <div className="pt-4 border-t">
                  <button
                    onClick={() => {
                      setAvatar({
                        baseCharacter: 'gym_mouse',
                        furColor: userGender === 'Female' ? '#FFC0CB' : userGender === 'Other' ? '#93C5FD' : '#8B4513',
                        mood: 'happy',
                        pose: 'standing',
                        type: 'mouse',
                        version: 1
                      });
                      setCustomFile(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw className="inline h-4 w-4 mr-2" />
                    Reset to Default
                  </button>
                </div>
              </div>
            ) : (
              /* Upload Tab */
              <div className="space-y-6">
                <div className="text-center">
                  <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Upload Custom Avatar
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Upload your own image to use as your avatar. Best results with square images.
                  </p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomFileChange}
                    className="hidden"
                    id="custom-avatar-upload"
                  />
                  <label
                    htmlFor="custom-avatar-upload"
                    className="cursor-pointer"
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <span className="text-lg font-medium text-gray-700">
                      Click to upload image
                    </span>
                    <p className="text-sm text-gray-500 mt-2">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </label>
                </div>

                {customFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Camera className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-green-800">
                          File Selected
                        </h4>
                        <p className="text-sm text-green-700">
                          {customFile.name} ({Math.round(customFile.size / 1024)}KB)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Tips for best results:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Use square images (1:1 aspect ratio)</li>
                    <li>• Minimum size: 256x256 pixels</li>
                    <li>• Clear, well-lit photos work best</li>
                    <li>• Face should be centered and visible</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isGenerating}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="inline h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Avatar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleAvatarDesigner;