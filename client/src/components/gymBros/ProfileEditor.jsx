import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Camera, ChevronLeft, Trash2, Share2, User,
  PauseCircle, MapPin, Save, Loader, Pencil
} from 'lucide-react';
import gymbrosService from '../../services/gymbros.service';
import PhotoEditor from './components/PhotoEditor'; // Import the fixed PhotoEditor

const EnhancedGymBrosProfile = ({ userProfile, onProfileUpdated, isGuest = false }) => {
  // Component state
  const [formData, setFormData] = useState(userProfile || {});
  const [errors, setErrors] = useState({});
  const [activeSection, setActiveSection] = useState('main');
  const [loading, setLoading] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  
  // Reference to the photo editor component
  const photoEditorRef = useRef(null);
  
  // Initialize form data from userProfile
  useEffect(() => {
    if (userProfile) {
      const initialData = {
        ...userProfile,
        photos: userProfile.images || [],
      };
      setFormData(initialData);
    }
  }, [userProfile]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setShowSaveButton(true);
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Toggle selection for multi-select fields
  const toggleSelection = (field, item) => {
    const currentValues = formData[field] || [];
    const newValues = currentValues.includes(item)
      ? currentValues.filter(val => val !== item)
      : [...currentValues, item];
    
    setFormData(prev => ({ ...prev, [field]: newValues }));
    setShowSaveButton(true);
  };

  // Handle photos changes from PhotoEditor
  const handlePhotosChange = (newPhotos) => {
    setFormData(prev => ({
      ...prev,
      photos: newPhotos,
      // First photo is always the primary photo
      profileImage: newPhotos.length > 0 ? newPhotos[0] : null
    }));
    
    setShowSaveButton(true);
  };

const handleSubmit = async () => {
  if (loading) return;
  setLoading(true);
  
  try {
    // This will actually log the submit action to make debugging easier
    console.log('Starting profile submission...');
    
    // Validate the form data
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors before saving');
      setLoading(false);
      return;
    }
    
    // 1. Get files to upload from the PhotoEditor
    let filesToUpload = [];
    if (photoEditorRef.current) {
      filesToUpload = photoEditorRef.current.getFilesToUpload();
      console.log('Files to upload from PhotoEditor:', filesToUpload);
    }
    
    // 2. Get existing server URLs that should be preserved
    let serverUrls = [];
    if (photoEditorRef.current) {
      serverUrls = photoEditorRef.current.getServerUrls();
      console.log('Server URLs to preserve:', serverUrls);
    }
    
    console.log(`Will upload ${filesToUpload.length} new files and keep ${serverUrls.length} existing images`);
    
    let uploadedImageUrls = [];
    
    // 3. Upload new files if there are any
    if (filesToUpload.length > 0) {
      try {
        console.log('Starting file upload process...');
        const uploadResult = await gymbrosService.uploadProfileImages(filesToUpload);
        
        console.log('Upload result:', uploadResult);
        
        if (uploadResult.success && uploadResult.imageUrls) {
          uploadedImageUrls = uploadResult.imageUrls;
          console.log('Upload successful, received URLs:', uploadedImageUrls);
        } else {
          throw new Error(uploadResult.message || 'Failed to upload images');
        }
      } catch (error) {
        console.error('Error uploading images:', error);
        toast.error('Failed to upload images. Please try again.');
        setLoading(false);
        return;
      }
    }
    
    // 4. Combine existing server URLs with newly uploaded URLs
    const finalImages = [
      ...serverUrls,
      ...uploadedImageUrls
    ];
    
    // 5. Prepare final data for saving - IMPORTANT: NEVER include blob URLs here
    const finalData = {
      ...formData,
      // Make sure to ONLY include server URLs, no blob URLs
      images: finalImages,
      // Set the first image as the profile image if we have any
      profileImage: finalImages.length > 0 ? finalImages[0] : null,
      // IMPORTANT: Remove the photos field which might contain blob URLs
      photos: undefined
    };
    
    console.log('Saving profile with data:', {
      ...finalData,
      images: `${finalData.images.length} images (${serverUrls.length} existing, ${uploadedImageUrls.length} new)`
    });
    
    const response = await gymbrosService.createOrUpdateProfile(finalData);
    
    if (response.success) {
      // Update parent component with the server response
      onProfileUpdated(response.profile);
      toast.success('Profile updated successfully');
      
      // Update local form data
      setFormData(prev => ({
        ...prev,
        photos: finalImages,
        profileImage: finalImages.length > 0 ? finalImages[0] : null
      }));
      
      setShowSaveButton(false);
    } else {
      throw new Error(response.message || 'Failed to update profile');
    }
    
  } catch (error) {
    console.error('Error updating profile:', error);
    toast.error(error.message || 'Failed to update profile');
  } finally {
    setLoading(false);
  }
};

  // Validate form data
  const validateForm = (data) => {
    const errors = {};
    
    if (!data.name) {
      errors.name = 'Name is required';
    }
    
    if (!data.age || data.age < 18) {
      errors.age = 'Age must be at least 18';
    }
    
    if (!data.gender) {
      errors.gender = 'Gender is required';
    }
    
    if (!data.height) {
      errors.height = 'Height is required';
    }
    
    if (!data.workoutTypes || data.workoutTypes.length === 0) {
      errors.workoutTypes = 'Select at least one workout type';
    }
    
    if (!data.experienceLevel) {
      errors.experienceLevel = 'Experience level is required';
    }
    
    if (!data.preferredTime) {
      errors.preferredTime = 'Preferred time is required';
    }
    
    if (!data.photos || data.photos.filter(p => p).length < 2) {
      errors.photos = 'At least 2 photos are required';
    }
    
    return errors;
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

  // Helper to get proper image URL for display
  const getImageUrl = (url) => {
    if (!url) return null;
    
    if (url.startsWith('blob:')) {
      return url;
    }
    
    if (url.startsWith('http')) {
      return url;
    }
    
    // Make sure the URL has a leading slash
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  // Main profile view
  const renderMainProfile = () => (
    <>
      {/* Profile Picture Section */}
      <div 
        className="relative w-full aspect-square bg-gray-100 mb-4 cursor-pointer"
        onClick={() => setActiveSection('photos')}
      >
        {formData.photos && formData.photos.length > 0 ? (
          <img 
            src={getImageUrl(formData.photos[0])}
            alt="Profile" 
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
            onError={(e) => {
              console.error('Image load error:', formData.photos[0]);
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
          onChange={handleChange}
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
          {errors.workoutTypes && <p className="text-red-500 text-sm mt-1">{errors.workoutTypes}</p>}
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
            {errors.experienceLevel && <p className="text-red-500 text-sm mt-1">{errors.experienceLevel}</p>}
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
            {errors.preferredTime && <p className="text-red-500 text-sm mt-1">{errors.preferredTime}</p>}
          </div>
        </div>

        <EditableField 
          label="Fitness Goals" 
          name="goals" 
          value={formData.goals} 
          placeholder="What are your fitness goals?"
          textarea={true}
          onChange={handleChange}
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
  
  const workoutTypes = [
    'Strength Training', 'Cardio', 'HIIT', 'CrossFit', 'Bodybuilding',
    'Yoga', 'Pilates', 'Calisthenics', 'Powerlifting', 'Olympic Lifting',
    'Functional Training', 'Group Classes', 'Running', 'Swimming', 'Cycling'
  ];
  
  // Experience level options
  const experienceLevels = ['Beginner', 'Intermediate', 'Advanced'];
  
  // Preferred time options
  const preferredTimes = ['Morning', 'Afternoon', 'Evening', 'Late Night', 'Weekends Only', 'Flexible'];

  const EditableField = ({ label, name, value, placeholder, textarea = false, onChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [fieldValue, setFieldValue] = useState(value || '');
    
    useEffect(() => {
      setFieldValue(value || '');
    }, [value]);
    
    const handleSave = () => {
      // Update the parent form data
      onChange({ target: { name, value: fieldValue } });
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
        {errors[name] && <p className="text-red-500 text-sm mt-1">{errors[name]}</p>}
      </div>
    );
  };

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
      
      <div className="p-4 pb-20">
        {/* Debug info - helpful for troubleshooting */}
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <p>Current photos: {JSON.stringify(formData.photos?.length || 0)} items</p>
          <p>Server photos: {formData.photos?.filter(p => p && !p.startsWith('blob:')).length || 0} items</p>
          <p>Blob photos: {formData.photos?.filter(p => p && p.startsWith('blob:')).length || 0} items</p>
        </div>
        
        <PhotoEditor 
          ref={photoEditorRef}
          photos={formData.photos || []}
          onPhotosChange={handlePhotosChange}
          maxPhotos={6}
        />
        {errors.photos && <p className="text-red-500 text-sm mt-1">{errors.photos}</p>}
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