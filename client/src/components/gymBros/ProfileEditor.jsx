import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Camera, ChevronLeft, Plus, Trash2, Share2, Link, User,
  PauseCircle, LogOut, MapPin, Calendar, Award, X, Save
} from 'lucide-react';
import api from '../../services/api';
import ImageUploader from './ImageUploader';

const EnhancedGymBrosProfile = ({ userProfile, onProfileUpdated }) => {
  const [formData, setFormData] = useState(userProfile || {});
  const [errors, setErrors] = useState({});
  const [activeSection, setActiveSection] = useState('main');
  const [isUploading, setIsUploading] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    if (userProfile) {
      setFormData(userProfile);
    }
  }, [userProfile]);

  // Update form data for any field
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setShowSaveButton(true);
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Special handler for nested objects
  const handleNestedChange = (objectName, propertyName, value) => {
    setFormData(prev => ({
      ...prev,
      [objectName]: {
        ...(prev[objectName] || {}),
        [propertyName]: value
      }
    }));
    setShowSaveButton(true);
  };

  // Handle multi-select changes like workout types
  const handleMultiSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setShowSaveButton(true);
    
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Toggle the selection of an item in a multi-select
  const toggleSelection = (field, item) => {
    const currentValues = formData[field] || [];
    const newValues = currentValues.includes(item)
      ? currentValues.filter(val => val !== item)
      : [...currentValues, item];
    
    handleMultiSelectChange(field, newValues);
  };

  // Save all changes at once
  const handleSaveAll = async () => {
    try {
      const response = await api.post('/gym-bros/profile', formData);
      onProfileUpdated(response.data);
      toast.success('Profile updated successfully');
      setShowSaveButton(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  // Photo upload handling
  const handleAddPhoto = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Upload using the service
      const result = await gymbrosService.uploadProfileImages([file]);
      
      if (result.success && result.imageUrls && result.imageUrls.length > 0) {
        const newImageUrl = result.imageUrls[0];
        
        // Update form data with the new image URL
        setFormData(prev => {
          // Add to photos array if it exists
          const updatedPhotos = [...(prev.photos || []), newImageUrl];
          
          // Also set as main profile image if none exists
          const updatedData = { 
            ...prev, 
            photos: updatedPhotos 
          };
          
          if (!prev.profileImage) {
            updatedData.profileImage = newImageUrl;
          }
          
          return updatedData;
        });
        
        toast.success('Photo added');
        setShowSaveButton(true);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photoUrl) => {
    try {
      // Extract the image ID from the URL
      const imageId = photoUrl.split('/').pop();
      
      // Delete using the service
      const result = await gymbrosService.deleteProfileImage(imageId);
      
      if (result.success) {
        // Update photos list
        const updatedPhotos = formData.photos.filter(url => url !== photoUrl);
        
        // Update form data
        setFormData(prev => {
          const updatedData = { ...prev, photos: updatedPhotos };
          
          // If main profile pic is deleted, set to next available
          if (prev.profileImage === photoUrl && updatedPhotos.length > 0) {
            updatedData.profileImage = updatedPhotos[0];
          } else if (prev.profileImage === photoUrl) {
            updatedData.profileImage = null;
          }
          
          return updatedData;
        });
        
        toast.success('Photo deleted');
        setShowSaveButton(true);
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    }
  };

  const handleSetMainPhoto = (photoUrl) => {
    if (!photoUrl) return;
    
    setFormData(prev => ({
      ...prev,
      profileImage: photoUrl
    }));
    
    setShowSaveButton(true);
    toast.success('Main profile picture updated');
  };

  const handleImagesChange = (newImages) => {
    setFormData(prev => ({ 
      ...prev, 
      photos: newImages,
      // If no profile image is set, use the first image
      profileImage: prev.profileImage || (newImages.length > 0 ? newImages[0] : null)
    }));
    
    setShowSaveButton(true);
  };

  // Specialized action handlers
  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your GymBros profile? This action cannot be undone.')) {
      try {
        await api.delete('/gym-bros/profile');
        toast.success('Profile deleted successfully');
        window.location.reload(); // Force reload to show profile creation
      } catch (error) {
        console.error('Error deleting profile:', error);
        toast.error('Failed to delete profile');
      }
    }
  };

  const handlePauseAccount = async () => {
    try {
      await api.post('/gym-bros/profile/pause');
      setFormData(prev => ({ ...prev, paused: !prev.paused }));
      toast.success(formData.paused ? 'Profile activated' : 'Profile paused');
      setShowSaveButton(true); // Show save button after pausing/unpausing
    } catch (error) {
      console.error('Error toggling profile status:', error);
      toast.error('Failed to update profile status');
    }
  };

  const handleShareProfile = () => {
    // Generate a shareable link with the user's ID
    const shareUrl = `${window.location.origin}/gymbros/profile/${userProfile._id}`;
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: 'Check out my GymBros profile',
        text: `Connect with me on GymBros!`,
        url: shareUrl,
      })
      .catch(err => {
        console.error('Error sharing:', err);
        // Fallback to copying to clipboard
        copyToClipboard(shareUrl);
      });
    } else {
      // Fallback to copying to clipboard
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Link copied to clipboard'))
      .catch(err => {
        console.error('Failed to copy:', err);
        toast.error('Failed to copy link');
      });
  };

  // Workout types options
  const workoutTypes = [
    'Weightlifting', 'Cardio', 'CrossFit', 'Yoga', 'Pilates', 
    'Running', 'Swimming', 'Cycling', 'HIIT', 'Boxing',
    'Martial Arts', 'Bodyweight', 'Powerlifting', 'Functional Training'
  ];
  
  // Experience level options
  const experienceLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
  
  // Preferred time options
  const preferredTimes = ['Morning', 'Afternoon', 'Evening', 'Night', 'Flexible'];

  // Editable text field
  const EditableField = ({ label, name, value, placeholder, textarea = false }) => {
    const [fieldValue, setFieldValue] = useState(value || '');
    const [isEditing, setIsEditing] = useState(false);
    
    useEffect(() => {
      setFieldValue(value || '');
    }, [value]);
    
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {!isEditing ? (
          <div 
            className="mt-1 p-3 border border-gray-300 rounded-md bg-gray-50 min-h-[40px] cursor-text"
            onClick={() => setIsEditing(true)}
          >
            {fieldValue || placeholder}
          </div>
        ) : (
          textarea ? (
            <textarea
              name={name}
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              onBlur={() => setIsEditing(false)}
              placeholder={placeholder}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              autoFocus
            />
          ) : (
            <input
              type="text"
              name={name}
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              onBlur={() => setIsEditing(false)}
              placeholder={placeholder}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          )
        )}
      </div>
    );
  };

  // Main profile view
  const renderMainProfile = () => (
    <>
      {/* Profile Picture Section */}
      <div 
        className="relative w-full aspect-square bg-gray-100 mb-4 cursor-pointer"
        onClick={() => setActiveSection('photos')}
      >
        {formData.profileImage ? (
          <img 
            src={formData.profileImage} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User size={64} className="text-gray-400" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex items-end">
            <div className="flex-1 text-white">
              <h1 className="text-2xl font-bold">{formData.name || 'Your Name'}, {formData.age || '?'}</h1>
              {formData.location?.address && (
                <div className="flex items-center text-white/80">
                  <MapPin size={16} className="mr-1" />
                  <span>{formData.location.address}</span>
                </div>
              )}
            </div>
            <div className="bg-white/20 rounded-full p-2 mr-2">
              <Camera size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Basic Info Section */}
      <div className="px-4 space-y-6 pb-20">
        <EditableField 
          label="About Me" 
          name="bio" 
          value={formData.bio} 
          placeholder="Tell others about yourself and your fitness journey..."
          textarea={true}
        />

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Workout Types</h3>
          <div className="flex flex-wrap gap-2">
            {workoutTypes.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => toggleSelection('workoutTypes', type)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  (formData.workoutTypes || []).includes(type)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Experience Level</label>
            <select
              name="experienceLevel"
              value={formData.experienceLevel || ''}
              onChange={handleChange}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md"
            >
              <option value="">Select Level</option>
              {experienceLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Preferred Time</label>
            <select
              name="preferredTime"
              value={formData.preferredTime || ''}
              onChange={handleChange}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md"
            >
              <option value="">Select Time</option>
              {preferredTimes.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>

        <EditableField 
          label="Fitness Goals" 
          name="fitnessGoals" 
          value={formData.fitnessGoals} 
          placeholder="What are your fitness goals?"
          textarea={true}
        />

        <EditableField 
          label="Achievements" 
          name="achievements" 
          value={formData.achievements} 
          placeholder="Any certifications or fitness achievements?"
          textarea={true}
        />

        {/* Settings */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          
          <div className="space-y-3">
            <button 
              onClick={handleShareProfile}
              className="w-full flex items-center p-3 rounded-md bg-gray-100 hover:bg-gray-200"
            >
              <Share2 size={20} className="mr-3 text-gray-600" />
              <span>Share Profile</span>
            </button>
            
            <button 
              onClick={handlePauseAccount}
              className="w-full flex items-center p-3 rounded-md bg-gray-100 hover:bg-gray-200"
            >
              <PauseCircle size={20} className="mr-3 text-gray-600" />
              <span>{formData.paused ? 'Activate Profile' : 'Pause Profile'}</span>
            </button>
            
            <button 
              onClick={handleDeleteAccount}
              className="w-full flex items-center p-3 rounded-md bg-red-50 hover:bg-red-100 text-red-600"
            >
              <Trash2 size={20} className="mr-3" />
              <span>Delete Profile</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // Photo gallery section
  const renderPhotoGallery = () => (
  <>
    <div className="sticky top-0 z-10 bg-white p-4 border-b flex items-center">
      <button 
        className="p-2 rounded-full bg-gray-100"
        onClick={() => setActiveSection('main')}
      >
        <ChevronLeft size={20} />
      </button>
      <h2 className="ml-4 text-xl font-semibold">Edit Photos</h2>
    </div>
    
    <div className="p-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Profile Picture</h3>
        <div className="bg-gray-100 w-32 h-32 rounded-full overflow-hidden mx-auto mb-2">
          {formData.profileImage ? (
            <img 
              src={formData.profileImage} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={32} className="text-gray-400" />
            </div>
          )}
        </div>
        <p className="text-sm text-center text-gray-500">
          Your main profile picture
        </p>
      </div>

      <h3 className="text-lg font-semibold mb-2">Your Photos</h3>
      
      {/* Use the enhanced ImageUploader component */}
      <ImageUploader 
        images={formData.photos || []} 
        onImagesChange={handleImagesChange} 
      />
      
      <div className="mt-4 text-sm text-gray-500 text-center">
        Add up to 6 photos to showcase your fitness journey.
      </div>
    </div>
  </>
);

const handleSubmit = async () => {
  if (loading) return;
  
  setLoading(true);
  
  try {
    // Check if we have blob URLs that need to be uploaded
    const photos = formData.photos || [];
    const blobPhotos = photos.filter(url => url.startsWith('blob:'));
    
    // If we have blob URLs, upload them first
    if (blobPhotos.length > 0) {
      try {
        // Convert blob URLs to Files
        const imageFiles = await Promise.all(
          blobPhotos.map((blobUrl, index) => 
            gymbrosService.blobUrlToFile(blobUrl, `image-${index}.jpg`)
          )
        );
        
        // Upload the files
        const uploadResult = await gymbrosService.uploadProfileImages(imageFiles);
        
        // Replace blob URLs with server URLs in formData
        if (uploadResult.success && uploadResult.imageUrls?.length) {
          // Create a mapping of indices to new URLs
          const urlMapping = {};
          blobPhotos.forEach((blobUrl, index) => {
            if (index < uploadResult.imageUrls.length) {
              urlMapping[blobUrl] = uploadResult.imageUrls[index];
            }
          });
          
          // Update photos array
          const updatedPhotos = photos.map(url => 
            urlMapping[url] || url
          );
          
          // Also update profile image if it's a blob URL
          let profileImage = formData.profileImage;
          if (profileImage?.startsWith('blob:') && urlMapping[profileImage]) {
            profileImage = urlMapping[profileImage];
          }
          
          // Update formData with new URLs
          setFormData(prev => ({
            ...prev,
            photos: updatedPhotos,
            profileImage
          }));
        }
      } catch (uploadError) {
        console.error('Error uploading blob images:', uploadError);
        toast.error('Failed to upload some images');
        // Continue with save anyway
      }
    }
    
    // Now save the profile with server URLs
    const response = await api.post('/gym-bros/profile', formData);
    onProfileUpdated(response.data);
    toast.success('Profile updated successfully');
    setShowSaveButton(false);
  } catch (error) {
    console.error('Error updating profile:', error);
    toast.error('Failed to update profile');
  } finally {
    setLoading(false);
  }
};
  
  return (
    <div className="h-full overflow-y-auto relative bg-white rounded-lg">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: activeSection === 'main' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeSection === 'main' ? 20 : -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeSection === 'main' ? renderMainProfile() : renderPhotoGallery()}
        </motion.div>
      </AnimatePresence>
      
      {/* Floating save button - appears when changes are made */}
      <AnimatePresence>
        {showSaveButton && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-16 right-4 z-50"
          >
            <button
              onClick={handleSaveAll}
              className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg"
            >
              <Save size={18} className="mr-2" />
              Save Changes
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedGymBrosProfile;