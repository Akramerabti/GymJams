// components/GymBros/MouseAvatarDesigner.jsx
import React, { useState } from 'react';
import { X, Palette, Shirt } from 'lucide-react';
import { renderMouseAvatar } from './MouseAvatarUtils';

const MouseAvatarDesigner = ({ currentAvatar, onSave, onClose }) => {
  const [avatar, setAvatar] = useState(currentAvatar || {
    furColor: '#8B4513', // brown
    shirtColor: '#3B82F6', // blue
    shirtStyle: 'tshirt', // tshirt, hoodie, tank, none
    accessory: 'none', // none, glasses, hat, headphones
    pants: '#1F2937', // dark gray
    eyes: 'normal', // normal, wink, closed
    mood: 'happy' // happy, neutral, excited
  });

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

  const pantsColors = [
    { name: 'Dark Gray', value: '#1F2937' },
    { name: 'Blue Jeans', value: '#3B82F6' },
    { name: 'Black', value: '#000000' },
    { name: 'Khaki', value: '#D2B48C' },
    { name: 'Red', value: '#DC2626' },
    { name: 'Green', value: '#059669' }
  ];

  const moods = [
    { name: 'Happy', value: 'happy', icon: '😊' },
    { name: 'Excited', value: 'excited', icon: '🤩' },
    { name: 'Neutral', value: 'neutral', icon: '😐' },
    { name: 'Cool', value: 'cool', icon: '😎' },
    { name: 'Determined', value: 'determined', icon: '💪' }
  ];

  const handleSave = () => {
    // Validate and save
    onSave(avatar);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                🐭 Design Your Gym Rat
              </h2>
              <p className="text-blue-100 text-sm mt-1">Customize your avatar to represent you on the map</p>
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
                {renderMouseAvatar(avatar, 180)}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">Your Gym Mouse</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Mood: {avatar.mood} {moods.find(m => m.value === avatar.mood)?.icon}
                </p>
              </div>
            </div>
          </div>

          {/* Customization Options */}
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

              {/* Pants Color */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200">
                  👖 Pants Color
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {pantsColors.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setAvatar({...avatar, pants: color.value})}
                      className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                        avatar.pants === color.value 
                          ? 'border-blue-500 shadow-lg' 
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div 
                        className="w-12 h-6 rounded shadow-inner mx-auto" 
                        style={{ backgroundColor: color.value }} 
                      />
                      <span className="text-xs mt-1 block text-gray-600 dark:text-gray-300">
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
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
            </div>
          </div>
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
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Save My Rat 🐭
          </button>
        </div>
      </div>
    </div>
  );
};

export default MouseAvatarDesigner;