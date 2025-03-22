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
  const [formData, setFormData] = useState(userProfile || {});
  const [errors, setErrors] = useState({});
  const [activeSection, setActiveSection] = useState('main');
  const [loading, setLoading] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  
  const photoEditorRef = useRef(null);
  
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

  const handlePhotosChange = (newPhotos) => {
    if (!Array.isArray(newPhotos)) {
      console.error('handlePhotosChange received non-array value:', newPhotos);
      return;
    }
    
    console.log('Received photo update with', newPhotos.length, 'photos');
    
    setFormData(prev => ({
      ...prev,
      photos: newPhotos,
      // First photo is always the primary photo (if it's not a blob URL)
      profileImage: newPhotos.length > 0 && !newPhotos[0].startsWith('blob:') 
        ? newPhotos[0] 
        : prev.profileImage
    }));
    
    setShowSaveButton(true);
  };

const handleSubmit = async () => {
  if (loading) return;
  setLoading(true);
  
  try {
    console.log('Starting profile submission...');
    
    // Validate the form data
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors before saving');
      setLoading(false);
      return;
    }
    
    // 1. Get the current display order of photos
    const currentPhotos = [...formData.photos].filter(url => url);
    console.log('Current display order:', currentPhotos);
    
    // 2. Get files to upload from the PhotoEditor with their positions
    let filesToUpload = [];
    let blobPositions = {};
    if (photoEditorRef.current) {
      filesToUpload = photoEditorRef.current.getFilesToUpload();
      
      // Get mapping of which blob URL is at which position
      const blobUrlMap = photoEditorRef.current.getBlobUrlMap() || {};
      
      // Create a reverse mapping: blobUrl -> position
      Object.entries(blobUrlMap).forEach(([position, blobUrl]) => {
        blobPositions[blobUrl] = parseInt(position);
      });
      
      console.log('Files to upload:', filesToUpload.length);
      console.log('Blob positions map:', blobPositions);
    }
    
    // 3. Identify all URLs that are NOT blobs (server URLs to keep)
    const serverUrls = currentPhotos.filter(url => !url.startsWith('blob:'));
    console.log('Server URLs to preserve:', serverUrls);
    
    // 4. Create a position map for all current photos
    // This maps the URL (blob or server) to its position
    const positionMap = {};
    currentPhotos.forEach((url, index) => {
      positionMap[url] = index;
    });
    console.log('Position map for all photos:', positionMap);
    
    let uploadedImageUrls = [];
    
    // 5. Upload new files if there are any
    if (filesToUpload.length > 0) {
      try {
        console.log('Starting file upload process...');
        const uploadResult = await gymbrosService.uploadProfileImages(filesToUpload);
        
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
    
    // 6. Build the final images array preserving positions
    // Create a temporary array with all positions
    const maxPosition = Math.max(...Object.values(positionMap), 0);
    const tempArray = new Array(maxPosition + 1).fill(null);
    
    // Place server URLs in their original positions
    serverUrls.forEach(url => {
      const pos = positionMap[url];
      if (typeof pos === 'number') {
        tempArray[pos] = url;
      }
    });
    
    // Get positions of blob URLs to replace with uploaded URLs
    const blobUrls = currentPhotos.filter(url => url.startsWith('blob:'));
    
    // Match uploaded URLs to their blob positions
    // If we have same number of uploads as blobs, assume they match in order
    if (uploadedImageUrls.length === blobUrls.length) {
      blobUrls.forEach((blobUrl, index) => {
        const pos = positionMap[blobUrl];
        if (typeof pos === 'number') {
          tempArray[pos] = uploadedImageUrls[index];
        }
      });
    } else {
      // Otherwise just append the uploaded URLs
      uploadedImageUrls.forEach(url => {
        const emptyIndex = tempArray.indexOf(null);
        if (emptyIndex >= 0) {
          tempArray[emptyIndex] = url;
        } else {
          tempArray.push(url);
        }
      });
    }
    
    // Remove any null entries and create final array
    const finalImages = tempArray.filter(url => url !== null);
    console.log('Final images array with preserved positions:', finalImages);
    
    // 7. Prepare final data for saving
    const finalData = {
      ...formData,
      images: finalImages,
      profileImage: finalImages.length > 0 ? finalImages[0] : null,
      photos: undefined // Remove the photos field
    };
    
    console.log('Saving profile with final data:', {
      ...finalData,
      images: `${finalData.images.length} images with preserved positions`
    });
    
    const response = await gymbrosService.createOrUpdateProfile(finalData);
    
    if (response.success) {
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
    
    // Filter out blob URLs before validating photos count
    const validPhotos = data.photos ? data.photos.filter(p => p && !p.startsWith('blob:')) : [];
    const pendingPhotos = photoEditorRef.current ? photoEditorRef.current.getPendingUploadsCount() || 0 : 0;
    
    if (validPhotos.length + pendingPhotos < 2) {
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

  const renderMainProfile = () => {
    // Function to extract just city, province and country from full address
    const getLocationSummary = (address) => {
      if (!address) return '';
      
      // Split by commas and take the last 2-3 parts, which are typically city, province, country
      const parts = address.split(',').map(part => part.trim());
      
      if (parts.length <= 3) return address; // If it's already short, return as is
      
      return parts.slice(-3).join(', '); // Take the last 3 parts
    };
    
    // Calculate profile completeness percentage for the progress ring
    const calculateProfileCompleteness = () => {
      // Required fields to consider for completeness
      const requiredFields = [
        'name', 'age', 'gender', 'height', 'bio', 
        'workoutTypes', 'experienceLevel', 'preferredTime', 
        'goals', 'photos', 'location'
      ];
      
      // Custom validations for arrays and objects (need at least one item)
      const isCompleteWorkoutTypes = formData.workoutTypes && formData.workoutTypes.length > 0;
      const isCompletePhotos = formData.photos && formData.photos.length >= 2;
      const isCompleteLocation = formData.location && formData.location.address;
      const isCompleteBio = formData.bio && formData.bio.trim().length > 0;
      const isCompleteGoals = formData.goals && formData.goals.trim().length > 0;
      
      // Count completed fields
      let completedFields = 0;
      requiredFields.forEach(field => {
        if (field === 'workoutTypes' && isCompleteWorkoutTypes) {
          completedFields++;
        } else if (field === 'photos' && isCompletePhotos) {
          completedFields++;
        } else if (field === 'location' && isCompleteLocation) {
          completedFields++;
        } else if (field === 'bio' && isCompleteBio) {
          completedFields++;
        } else if (field === 'goals' && isCompleteGoals) {
          completedFields++;
        } else if (formData[field]) {
          completedFields++;
        }
      });
      
      // Calculate percentage
      return Math.round((completedFields / requiredFields.length) * 100);
    };
    
    const completeness = calculateProfileCompleteness();
    
    // Calculate circle progress parameters
    const radius = 70; // Size of the circle
    const strokeWidth = 4; // Width of the progress ring
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (completeness / 100) * circumference;
    
    return (
      <>
        {/* Profile Picture Section - Circular Design */}
        <div className="flex flex-col items-center mt-6 mb-8">
          {/* Progress Circle and Profile Image */}
          <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
            {/* SVG Progress Ring */}
            <svg
              height={radius * 2}
              width={radius * 2}
              className="absolute inset-0"
            >
              {/* Background circle */}
              <circle
                stroke="#e5e7eb" // Light gray background
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              {/* Progress circle - more vibrant blue with increased opacity for visibility */}
              <circle
                stroke="#4f46e5" // Indigo progress indicator (more vibrant)
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                transform={`rotate(-90 ${radius} ${radius})`}
                className="drop-shadow"
              />
            </svg>
  
            {/* Circular Profile Image */}
            <div 
              className="absolute inset-0 m-2 rounded-full overflow-hidden border-2 border-white cursor-pointer bg-gray-100"
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
                    e.target.src = "/api/placeholder/400/400";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={42} className="text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Camera Button - positioned OUTSIDE the profile image div to ensure proper stacking */}
            <div className="absolute bottom-3 right-3" style={{ pointerEvents: 'all' }}>
              <button 
                className="bg-white shadow-lg text-blue-500 rounded-full p-2 border border-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSection('photos');
                }}
              >
                <Camera size={18} />
              </button>
            </div>
          </div>
          
          {/* Completeness percentage */}
          <div className="text-sm text-gray-500 mt-1">
            {completeness}% Complete
          </div>
          
          {/* Profile Information - Below the Image */}
          <div className="text-center mt-3">
            <h1 className="text-2xl font-bold">{formData.name || 'Your Name'}, {formData.age || '?'}</h1>
            {formData.location?.address && (
              <div className="flex items-center justify-center text-gray-600 mt-1">
                <MapPin size={16} className="mr-1" />
                <span>{getLocationSummary(formData.location.address)}</span>
              </div>
            )}
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
  };
  
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