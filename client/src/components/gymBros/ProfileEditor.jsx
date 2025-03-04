import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { 
  PlusCircle, Camera, MapPin, Award, Clock, 
  Calendar, Target, ArrowLeft, ArrowRight, 
  User, Trash2, Upload, Dumbbell, Sun, Moon
} from 'lucide-react';
import api from '../../services/api';
import debounce from 'lodash/debounce';

// Define workout types, experience levels, and preferred times
const workoutTypes = [
  'Weightlifting', 'Cardio', 'Yoga', 'CrossFit', 'Pilates',
  'HIIT', 'Calisthenics', 'Running', 'Swimming', 'Cycling'
];

const experienceLevels = ['Beginner', 'Intermediate', 'Advanced'];
const timePreferences = ['Morning', 'Afternoon', 'Evening', 'Late Night', 'Weekends Only', 'Flexible'];

const GymBrosEnhancedProfile = ({ userProfile, onProfileUpdated }) => {
  const [profileData, setProfileData] = useState({
    name: '',
    age: '',
    bio: '',
    workoutTypes: [],
    experienceLevel: '',
    preferredTime: '',
    goals: '',
    location: {
      address: '',
    },
    images: []
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize profile data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setProfileData({
        name: userProfile.name || '',
        age: userProfile.age || '',
        bio: userProfile.bio || '',
        workoutTypes: userProfile.workoutTypes || [],
        experienceLevel: userProfile.experienceLevel || '',
        preferredTime: userProfile.preferredTime || '',
        goals: userProfile.goals || '',
        location: {
          address: userProfile.location?.address || '',
        },
        images: userProfile.images || []
      });
    }

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('gymBrosDarkMode');
    if (savedTheme) {
      setDarkMode(savedTheme === 'true');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, [userProfile]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('gymBrosDarkMode', newMode.toString());
  };

  // Create a debounced save function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce(async (data) => {
      setIsSaving(true);
      try {
        const response = await api.put('/gym-bros/profile', data);
        
        // Only show toast after successful save
        toast.success('Profile updated', {
          duration: 2000,
          position: 'bottom-right',
        });
        
        if (onProfileUpdated) {
          onProfileUpdated(response.data);
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile', {
          description: error.message || 'Please try again',
        });
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    []
  );

  // Handle input changes
  const handleChange = (field, value) => {
    let updatedData;
    
    if (field === 'location') {
      updatedData = {
        ...profileData,
        location: {
          ...profileData.location,
          ...value,
        },
      };
    } else {
      updatedData = {
        ...profileData,
        [field]: value,
      };
    }
    
    setProfileData(updatedData);
    debouncedSave(updatedData);
  };

  // Toggle workout type selection
  const handleWorkoutTypeToggle = (type) => {
    const updatedWorkoutTypes = profileData.workoutTypes.includes(type)
      ? profileData.workoutTypes.filter(t => t !== type)
      : [...profileData.workoutTypes, type];
      
    handleChange('workoutTypes', updatedWorkoutTypes);
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    // Check if adding these files would exceed the 6 image limit
    if (profileData.images.length + files.length > 6) {
      toast.error('Maximum 6 images allowed', {
        description: `You can only upload ${6 - profileData.images.length} more images`
      });
      return;
    }
    
    // Check file types
    for (const file of files) {
      if (!file.type.match('image.*')) {
        toast.error('Invalid file type', {
          description: 'Please select only image files'
        });
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large', {
          description: 'Image size should be less than 5MB'
        });
        return;
      }
    }
    
    setIsImageUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });
      
      const response = await api.post('/gym-bros/profile-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update profile with new images
      const updatedImages = [...profileData.images, ...response.data.imageUrls];
      handleChange('images', updatedImages);
      
      toast.success(`${files.length > 1 ? 'Images' : 'Image'} uploaded successfully`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setIsImageUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle image deletion
  const handleDeleteImage = async (index) => {
    if (profileData.images.length <= 1) {
      toast.error('You must keep at least one profile image');
      return;
    }
    
    try {
      const imageUrl = profileData.images[index];
      const imageId = imageUrl.split('/').pop().split('.')[0]; // Extract ID from URL
      
      await api.delete(`/gym-bros/profile-image/${imageId}`);
      
      const updatedImages = profileData.images.filter((_, i) => i !== index);
      handleChange('images', updatedImages);
      
      // Update current index if needed
      if (currentImageIndex >= updatedImages.length) {
        setCurrentImageIndex(updatedImages.length - 1);
      }
      
      toast.success('Image deleted');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  // Navigation for image carousel
  const nextImage = () => {
    if (currentImageIndex < profileData.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      setCurrentImageIndex(0); // Loop back to the first image
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else {
      setCurrentImageIndex(profileData.images.length - 1); // Loop to the last image
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const darkModeClasses = {
    bg: darkMode ? 'bg-gray-900' : 'bg-white',
    text: darkMode ? 'text-gray-200' : 'text-gray-900',
    label: darkMode ? 'text-gray-300' : 'text-gray-700',
    border: darkMode ? 'border-gray-700' : 'border-gray-300',
    input: darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-800 border-gray-300',
    workoutTypeActive: darkMode ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white',
    workoutTypeInactive: darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  };

  return (
    <div className={`${darkModeClasses.bg} ${darkModeClasses.text} rounded-lg shadow-lg overflow-hidden transition-colors duration-300`}>
      {/* Dark Mode Toggle */}
      <button 
        onClick={toggleDarkMode}
        className={`absolute top-4 left-4 z-10 p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-blue-900'} transition-colors`}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Images Carousel Header */}
      <div className="relative h-80 overflow-hidden">
        {profileData.images.length > 0 ? (
          <>
            {/* Main Image */}
            <img 
              src={profileData.images[currentImageIndex]} 
              alt={`Profile ${currentImageIndex + 1}`} 
              className="w-full h-full object-cover"
            />
            
            {/* Image Counter Indicator */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {profileData.images.length}
            </div>
            
            {/* Navigation Arrows */}
            <button 
              onClick={prevImage}
              className="absolute top-1/2 left-4 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <button 
              onClick={nextImage}
              className="absolute top-1/2 right-4 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            >
              <ArrowRight size={20} />
            </button>
            
            {/* Delete Current Image Button */}
            <button 
              onClick={() => handleDeleteImage(currentImageIndex)}
              className="absolute bottom-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all"
            >
              <Trash2 size={20} />
            </button>
          </>
        ) : (
          <div className={`w-full h-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} flex flex-col items-center justify-center transition-colors`}>
            <Camera size={48} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No profile images yet</p>
          </div>
        )}
        
        {/* Upload New Image Button */}
        <button 
          onClick={triggerFileInput}
          disabled={isImageUploading}
          className="absolute bottom-4 left-4 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-all flex items-center space-x-2"
        >
          {isImageUploading ? (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <PlusCircle size={20} />
          )}
        </button>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          multiple
        />
      </div>
      
      {/* Thumbnail Navigation */}
      <div className={`flex justify-center space-x-2 py-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} transition-colors`}>
        {profileData.images.map((image, index) => (
          <button 
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-10 h-10 rounded-md overflow-hidden border-2 transition-all ${
              currentImageIndex === index ? 'border-blue-500 scale-110' : 'border-transparent opacity-70'
            }`}
          >
            <img 
              src={image} 
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
        {profileData.images.length < 6 && (
          <button 
            onClick={triggerFileInput}
            className={`w-10 h-10 rounded-md flex items-center justify-center transition-all ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-500'
            }`}
          >
            <Upload size={16} />
          </button>
        )}
      </div>
      
      {/* Profile Content */}
      <div className="p-6 space-y-6">
        {/* Name and Age (inline editing) */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <User className={darkMode ? 'w-5 h-5 text-gray-400' : 'w-5 h-5 text-gray-500'} />
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Your Name"
              className={`flex-1 text-xl font-bold border-b ${darkMode ? 'bg-gray-900 border-transparent hover:border-gray-600 focus:border-blue-700' : 'bg-white border-transparent hover:border-gray-300 focus:border-blue-500'} focus:outline-none px-1 py-1 transition-colors`}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className={darkMode ? 'w-5 h-5 text-gray-400' : 'w-5 h-5 text-gray-500'} />
            <input
              type="number"
              value={profileData.age}
              onChange={(e) => handleChange('age', e.target.value)}
              placeholder="Your Age"
              min="18"
              max="99"
              className={`w-20 border-b ${darkMode ? 'bg-gray-900 border-transparent hover:border-gray-600 focus:border-blue-700' : 'bg-white border-transparent hover:border-gray-300 focus:border-blue-500'} focus:outline-none px-1 py-1 transition-colors`}
            />
            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>years old</span>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className={`flex items-center text-sm font-medium ${darkModeClasses.label}`}>
            About Me
          </label>
          <textarea
            value={profileData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder="Tell potential gym partners a bit about yourself..."
            rows="3"
            className={`w-full rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${darkModeClasses.input} ${darkMode ? 'hover:border-gray-600' : 'hover:border-gray-400'}`}
          />
        </div>

        {/* Workout Types */}
        <div className="space-y-2">
          <label className={`flex items-center text-sm font-medium ${darkModeClasses.label}`}>
            <Dumbbell className={darkMode ? 'w-5 h-5 text-gray-400 mr-2' : 'w-5 h-5 text-gray-500 mr-2'} />
            Workout Types
          </label>
          <div className="flex flex-wrap gap-2">
            {workoutTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleWorkoutTypeToggle(type)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  profileData.workoutTypes.includes(type)
                    ? darkModeClasses.workoutTypeActive
                    : darkModeClasses.workoutTypeInactive
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Experience Level */}
        <div className="space-y-2">
          <label className={`flex items-center text-sm font-medium ${darkModeClasses.label}`}>
            <Award className={darkMode ? 'w-5 h-5 text-gray-400 mr-2' : 'w-5 h-5 text-gray-500 mr-2'} />
            Experience Level
          </label>
          <select
            value={profileData.experienceLevel}
            onChange={(e) => handleChange('experienceLevel', e.target.value)}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${darkModeClasses.input} ${darkMode ? 'hover:border-gray-600' : 'hover:border-gray-400'}`}
          >
            <option value="">Select Experience Level</option>
            {experienceLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        {/* Preferred Time */}
        <div className="space-y-2">
          <label className={`flex items-center text-sm font-medium ${darkModeClasses.label}`}>
            <Clock className={darkMode ? 'w-5 h-5 text-gray-400 mr-2' : 'w-5 h-5 text-gray-500 mr-2'} />
            Preferred Workout Time
          </label>
          <select
            value={profileData.preferredTime}
            onChange={(e) => handleChange('preferredTime', e.target.value)}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${darkModeClasses.input} ${darkMode ? 'hover:border-gray-600' : 'hover:border-gray-400'}`}
          >
            <option value="">Select Preferred Time</option>
            {timePreferences.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        {/* Goals */}
        <div className="space-y-2">
          <label className={`flex items-center text-sm font-medium ${darkModeClasses.label}`}>
            <Target className={darkMode ? 'w-5 h-5 text-gray-400 mr-2' : 'w-5 h-5 text-gray-500 mr-2'} />
            Fitness Goals
          </label>
          <textarea
            value={profileData.goals}
            onChange={(e) => handleChange('goals', e.target.value)}
            placeholder="What are your fitness goals?"
            rows="3"
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${darkModeClasses.input} ${darkMode ? 'hover:border-gray-600' : 'hover:border-gray-400'}`}
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className={`flex items-center text-sm font-medium ${darkModeClasses.label}`}>
            <MapPin className={darkMode ? 'w-5 h-5 text-gray-400 mr-2' : 'w-5 h-5 text-gray-500 mr-2'} />
            Location
          </label>
          <input
            type="text"
            value={profileData.location.address}
            onChange={(e) => handleChange('location', { address: e.target.value })}
            placeholder="Your location"
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${darkModeClasses.input} ${darkMode ? 'hover:border-gray-600' : 'hover:border-gray-400'}`}
          />
        </div>
      </div>

      {/* Saving indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white py-2 px-4 rounded-lg shadow-lg flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
          <span>Saving changes...</span>
        </div>
      )}
    </div>
  );
};

export default GymBrosEnhancedProfile;