import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Camera, ChevronLeft, Plus, Trash2, Share2, Link, User,
  PauseCircle, LogOut, MapPin, Calendar, Award, X, Save,
  Loader, Edit, Pencil
} from 'lucide-react';
import api from '../../services/api';
import gymbrosService from '../../services/gymbros.service';
import ImageUploader from './ImageUploader';

const EnhancedGymBrosProfile = ({ userProfile, onProfileUpdated, isGuest = false }) => {
  const [formData, setFormData] = useState(userProfile || {});
  const [errors, setErrors] = useState({});
  const [activeSection, setActiveSection] = useState('main');
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    if (userProfile) {
      // Ensure images array is properly initialized
      const initialData = {
        ...userProfile,
        photos: userProfile.images || [],
        profileImage: userProfile.profileImage || (userProfile.images && userProfile.images.length > 0 ? userProfile.images[0] : null)
      };
      setFormData(initialData);
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
            blobPhotos.map(async (blobUrl, index) => {
              // Convert the blob URL to a File object
              try {
                const response = await fetch(blobUrl);
                const blob = await response.blob();
                return new File([blob], `image-${index}.jpg`, { type: blob.type || 'image/jpeg' });
              } catch (error) {
                console.error('Error converting blob to file:', error);
                throw new Error('Failed to process image');
              }
            })
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
              profileImage,
              images: updatedPhotos // Ensure images are synced with photos
            }));
            
            // Prepare data for saving to server
            const dataToSend = {
              ...formData,
              photos: updatedPhotos,
              profileImage,
              images: updatedPhotos
            };
            
            // Save the profile with server URLs
            const response = await gymbrosService.createOrUpdateProfile(dataToSend);
            
            if (response.success) {
              onProfileUpdated(response.profile);
              toast.success('Profile updated successfully');
              setShowSaveButton(false);
            } else {
              throw new Error(response.message || 'Failed to update profile');
            }
          } else {
            throw new Error('Failed to upload images');
          }
        } catch (uploadError) {
          console.error('Error uploading blob images:', uploadError);
          toast.error('Failed to upload some images');
          throw uploadError;
        }
      } else {
        // No blob URLs to upload, just save the profile data
        // Ensure images array is synced with photos
        const dataToSend = {
          ...formData,
          images: formData.photos // Sync images with photos
        };
        
        const response = await gymbrosService.createOrUpdateProfile(dataToSend);
        
        if (response.success) {
          onProfileUpdated(response.profile);
          toast.success('Profile updated successfully');
          setShowSaveButton(false);
        } else {
          throw new Error(response.message || 'Failed to update profile');
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Photo management functions
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
        const response = await gymbrosService.deleteProfile();
        if (response.success) {
          toast.success('Profile deleted successfully');
          window.location.reload(); // Force reload to show profile creation
        } else {
          throw new Error(response.message || 'Failed to delete profile');
        }
      } catch (error) {
        console.error('Error deleting profile:', error);
        toast.error('Failed to delete profile');
      }
    }
  };

  const handlePauseAccount = async () => {
    try {
      const response = await gymbrosService.updateUserSettings({
        ...formData.settings,
        showMe: !formData.settings?.showMe
      });
      
      if (response) {
        setFormData(prev => ({ 
          ...prev, 
          settings: {
            ...prev.settings,
            showMe: !prev.settings?.showMe
          }
        }));
        
        toast.success(formData.settings?.showMe ? 'Profile paused' : 'Profile activated');
        setShowSaveButton(true);
      }
    } catch (error) {
      console.error('Error toggling profile status:', error);
      toast.error('Failed to update profile status');
    }
  };

  const handleShareProfile = () => {
    // Generate a shareable link with the user's ID
    const profileId = userProfile._id || userProfile.id;
    const shareUrl = `${window.location.origin}/gymbros/profile/${profileId}`;
    
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
    'Strength Training', 'Cardio', 'HIIT', 'CrossFit', 'Bodybuilding',
    'Yoga', 'Pilates', 'Calisthenics', 'Powerlifting', 'Olympic Lifting',
    'Functional Training', 'Group Classes', 'Running', 'Swimming', 'Cycling'
  ];
  
  // Experience level options
  const experienceLevels = ['Beginner', 'Intermediate', 'Advanced'];
  
  // Preferred time options
  const preferredTimes = ['Morning', 'Afternoon', 'Evening', 'Late Night', 'Weekends Only', 'Flexible'];

  // Editable text field
  const EditableField = ({ label, name, value, placeholder, textarea = false }) => {
    const [fieldValue, setFieldValue] = useState(value || '');
    const [isEditing, setIsEditing] = useState(false);
    
    useEffect(() => {
      setFieldValue(value || '');
    }, [value]);
    
    const handleSave = () => {
      // Update the parent form data
      handleChange({ target: { name, value: fieldValue } });
      setIsEditing(false);
    };
    
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          {!isEditing && (
            <button 
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-blue-500 p-1 rounded-full hover:bg-blue-50"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
        
        {!isEditing ? (
          <div className="mt-1 p-3 border border-gray-300 rounded-md bg-gray-50 min-h-[40px]">
            {fieldValue || <span className="text-gray-400">{placeholder}</span>}
          </div>
        ) : (
          <div>
            {textarea ? (
              <textarea
                name={name}
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
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
                placeholder={placeholder}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            )}
            
            <div className="flex justify-end mt-2 space-x-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
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
            src={formData.profileImage.startsWith('blob:') 
              ? formData.profileImage 
              : (formData.profileImage.startsWith('http') 
                  ? formData.profileImage 
                  : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${formData.profileImage}`)} 
            alt="Profile" 
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
            onError={(e) => {
              console.error('Image load error:', formData.profileImage);
              e.target.onerror = null;
              e.target.src = "/api/placeholder/400/600";
            }}
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
            <button 
              className="bg-white/20 backdrop-blur-sm rounded-full p-2"
              onClick={(e) => {
                e.stopPropagation();
                setActiveSection('photos');
              }}
            >
              <Camera size={24} className="text-white" />
            </button>
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
          name="goals" 
          value={formData.goals} 
          placeholder="What are your fitness goals?"
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
              <span>{formData.settings?.showMe === false ? 'Activate Profile' : 'Pause Profile'}</span>
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
                src={formData.profileImage.startsWith('blob:') 
                  ? formData.profileImage 
                  : (formData.profileImage.startsWith('http') 
                      ? formData.profileImage 
                      : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${formData.profileImage}`)} 
                alt="Profile" 
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                onError={(e) => {
                  console.error('Image load error:', formData.profileImage);
                  e.target.onerror = null;
                  e.target.src = "/api/placeholder/400/600";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User size={32} className="text-gray-400" />
              </div>
            )}
          </div>
          <p className="text-sm text-center text-gray-500 mb-4">
            Your main profile picture
          </p>
          
          {/* Add select main photo button if there are multiple photos */}
          {formData.photos && formData.photos.length > 1 && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setActiveSection('choosePrimary')}
                className="px-4 py-2 bg-blue-500 text-white rounded-md inline-flex items-center"
              >
                <Edit size={16} className="mr-2" />
                Choose Primary Photo
              </button>
            </div>
          )}
        </div>

        <h3 className="text-lg font-semibold mb-4">Your Photos</h3>
        
        {/* Use the ImageUploader component */}
        <ImageUploader 
          images={formData.photos || []} 
          onImagesChange={handleImagesChange} 
        />
        
        <div className="mt-4 text-sm text-gray-500 text-center">
          Add 2-6 photos to showcase your fitness journey.
        </div>
      </div>
    </>
  );

  // Choose primary photo section
  const renderChoosePrimaryPhoto = () => (
    <>
      <div className="sticky top-0 z-10 bg-white p-4 border-b flex items-center">
        <button 
          className="p-2 rounded-full bg-gray-100"
          onClick={() => setActiveSection('photos')}
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="ml-4 text-xl font-semibold">Choose Primary Photo</h2>
      </div>
      
      <div className="p-4">
        <p className="text-gray-600 mb-4">
          Tap on the photo you'd like to use as your main profile picture.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          {(formData.photos || []).map((photoUrl, index) => (
            <div 
              key={index}
              className={`relative aspect-[7/10] rounded-lg overflow-hidden border-2 ${
                photoUrl === formData.profileImage ? 'border-blue-500' : 'border-transparent'
              }`}
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  profileImage: photoUrl
                }));
                setShowSaveButton(true);
              }}
            >
              <img
                src={photoUrl}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/api/placeholder/400/600";
                }}
              />
              
              {photoUrl === formData.profileImage && (
                <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                  <div className="bg-white p-2 rounded-full">
                    <Check size={20} className="text-blue-500" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setActiveSection('photos')}
            className="px-4 py-2 bg-blue-500 text-white rounded-full"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
  
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
          {activeSection === 'main' ? renderMainProfile() : 
           activeSection === 'photos' ? renderPhotoGallery() : 
           renderChoosePrimaryPhoto()}
        </motion.div>
      </AnimatePresence>
      
      {/* Floating save button - appears when changes are made */}
      <AnimatePresence>
        {showSaveButton && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-4 z-50"
          >
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader size={18} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedGymBrosProfile;