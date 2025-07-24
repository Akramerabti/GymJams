import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Camera, ChevronLeft, Trash2, Share2, User,
  PauseCircle, MapPin, Save, Loader, Pencil, Info
} from 'lucide-react';
import gymbrosService from '../../services/gymbros.service';
import PhotoEditor from './components/PhotoEditor'; // Import the fixed PhotoEditor

// Reusable Button component for consistency
const CustomButton = ({ onClick, children, className = '', variant = 'primary', disabled = false, icon: Icon = null }) => {
  const baseStyle = "flex items-center justify-center px-4 py-2 rounded-lg text-sm transition-all duration-200 ease-in-out font-medium";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-md",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
    >
      {Icon && <Icon size={16} className={children ? "mr-2" : ""} />}
      {children}
    </button>
  );
};

const EnhancedGymBrosProfile = ({ userProfile, onProfileUpdated, isGuest = false }) => {
  const [formData, setFormData] = useState(userProfile || {});
  const [errors, setErrors] = useState({});
  const [activeSection, setActiveSection] = useState('main');
  const [loading, setLoading] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [showDeleteConfirmationDialog, setShowDeleteConfirmationDialog] = useState(false); // New state for delete confirmation

  const photoEditorRef = useRef(null);

  useEffect(() => {
    if (userProfile) {
      const initialData = {
        ...userProfile,
        photos: userProfile.images || [],
      };
      setFormData(initialData);
      // Reset showSaveButton when userProfile changes (e.g., on initial load or successful update)
      setShowSaveButton(false);
    }
  }, [userProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));
    setShowSaveButton(true);

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }

    // Only auto-save for dropdown selects for a smoother UX
    if (['experienceLevel', 'preferredTime', 'gender'].includes(name)) {
      const dataToSubmit = {
        ...formData,
        [name]: value,
        images: formData.photos?.filter(url => !url.startsWith('blob:')) || []
      };

      delete dataToSubmit.photos; // Remove UI-specific field

      gymbrosService.createOrUpdateProfile(dataToSubmit)
        .then(response => {
          if (!response.success) {
            console.error('Failed to update profile:', response.message);
            toast.error(response.message || 'Failed to auto-save dropdown change');
          }
        })
        .catch(error => {
          console.error('Error auto-saving profile:', error);
          toast.error('Error auto-saving dropdown change');
        });
    }
  };

  const toggleSelection = (field, item) => {
    const currentValues = formData[field] || [];
    const newValues = currentValues.includes(item)
      ? currentValues.filter(val => val !== item)
      : [...currentValues, item];

    setFormData(prev => ({ ...prev, [field]: newValues }));
    setShowSaveButton(true);

    const dataToSubmit = {
      ...formData,
      [field]: newValues,
      images: formData.photos?.filter(url => !url.startsWith('blob:')) || []
    };

    delete dataToSubmit.photos; // Remove UI-specific field

    gymbrosService.createOrUpdateProfile(dataToSubmit)
      .then(response => {
        if (!response.success) {
          console.error('Failed to update profile:', response.message);
          toast.error(response.message || 'Failed to auto-save selection');
        }
      })
      .catch(error => {
        console.error('Error auto-saving selection:', error);
        toast.error('Error auto-saving selection');
      });
  };

  const handlePhotosChange = (newPhotos) => {
    if (!Array.isArray(newPhotos)) {
      console.error('handlePhotosChange received non-array value:', newPhotos);
      return;
    }

    setFormData(prev => ({
      ...prev,
      photos: newPhotos,
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
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        toast.error('Please fix the errors before saving.');
        setLoading(false);
        return;
      }

      const currentPhotos = [...formData.photos].filter(url => url);
      let filesToUpload = [];
      if (photoEditorRef.current) {
        filesToUpload = photoEditorRef.current.getFilesToUpload();
      }

      const serverUrls = currentPhotos.filter(url => !url.startsWith('blob:'));

      let uploadedImageUrls = [];
      if (filesToUpload.length > 0) {
        try {
          const uploadResult = await gymbrosService.uploadProfileImages(filesToUpload);

          if (uploadResult.success && uploadResult.imageUrls) {
            uploadedImageUrls = uploadResult.imageUrls;
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

      // Preserve order: Map blob URLs to their new uploaded URLs
      const finalImages = [];
      let uploadedIndex = 0;
      for (const url of currentPhotos) {
        if (url.startsWith('blob:')) {
          if (uploadedIndex < uploadedImageUrls.length) {
            finalImages.push(uploadedImageUrls[uploadedIndex]);
            uploadedIndex++;
          } else {
            // Fallback for unexpected case where blob exists but no corresponding upload URL
            finalImages.push(url);
          }
        } else {
          finalImages.push(url);
        }
      }

      // Add any remaining uploaded URLs that didn't correspond to a blob
      while (uploadedIndex < uploadedImageUrls.length) {
        finalImages.push(uploadedImageUrls[uploadedIndex]);
        uploadedIndex++;
      }

      const finalData = {
        ...formData,
        images: finalImages,
        profileImage: finalImages.length > 0 ? finalImages[0] : null,
        photos: undefined // Remove the photos field used for UI
      };

      const response = await gymbrosService.createOrUpdateProfile(finalData);

      if (response.success) {
        if (typeof onProfileUpdated === 'function') {
          onProfileUpdated(response.profile);
        }
        toast.success('Profile updated successfully!');
        setFormData(prev => ({
          ...prev,
          photos: finalImages,
          profileImage: finalImages.length > 0 ? finalImages[0] : null
        }));
        setShowSaveButton(false);
        setActiveSection('main'); // Go back to main profile view after saving photos
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }

    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (data) => {
    const errors = {};

    if (!data.name || data.name.trim().length < 2) {
      errors.name = 'Name is required and must be at least 2 characters.';
    }

    if (!data.age || data.age < 18 || data.age > 99) {
      errors.age = 'Age must be between 18 and 99.';
    }

    if (!data.gender) {
      errors.gender = 'Gender is required.';
    }

    if (!data.height || data.height < 100 || data.height > 250) { // Assuming height in cm
      errors.height = 'Height is required and must be realistic (e.g., 100-250 cm).';
    }

    if (!data.workoutTypes || data.workoutTypes.length === 0) {
      errors.workoutTypes = 'Select at least one workout type.';
    }

    if (!data.experienceLevel) {
      errors.experienceLevel = 'Experience level is required.';
    }

    if (!data.preferredTime) {
      errors.preferredTime = 'Preferred time is required.';
    }

    const validPhotos = data.photos ? data.photos.filter(p => p && !p.startsWith('blob:')) : [];
    const pendingPhotos = photoEditorRef.current ? photoEditorRef.current.getPendingUploadsCount() || 0 : 0;

    if (validPhotos.length + pendingPhotos < 2) {
      errors.photos = 'At least 2 photos are required.';
    }

    // Optional fields validation (can be empty, but if present, should meet criteria)
    if (data.bio && data.bio.trim().length > 500) {
      errors.bio = 'Bio cannot exceed 500 characters.';
    }
    if (data.goals && data.goals.trim().length > 200) {
      errors.goals = 'Goals cannot exceed 200 characters.';
    }

    return errors;
  };

  const confirmDeleteAccount = async () => {
    setShowDeleteConfirmationDialog(false); // Close dialog immediately
    try {
      const response = await gymbrosService.deleteProfile();
      if (response.success) {
        toast.success('Profile deleted successfully!');
        window.location.reload(); // Force reload to show profile creation/onboarding
      } else {
        throw new Error(response.message || 'Failed to delete profile');
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Failed to delete profile.');
    }
  };

  const handlePauseAccount = async () => {
    try {
      const newShowMeStatus = !formData.settings?.showMe;
      const response = await gymbrosService.updateUserSettings({
        ...formData.settings,
        showMe: newShowMeStatus
      });

      if (response) {
        setFormData(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            showMe: newShowMeStatus
          }
        }));
        toast.success(newShowMeStatus ? 'Profile activated' : 'Profile paused');
        setShowSaveButton(true);
      }
    } catch (error) {
      console.error('Error toggling profile status:', error);
      toast.error('Failed to update profile status.');
    }
  };

  const handleShareProfile = () => {
    const profileId = userProfile._id || userProfile.id;
    const shareUrl = `${window.location.origin}/gymbros/profile/${profileId}`;

    if (navigator.share) {
      navigator.share({
        title: 'Check out my GymBros profile',
        text: `Connect with me on GymBros!`,
        url: shareUrl,
      })
        .catch(err => {
          console.error('Error sharing:', err);
          copyToClipboard(shareUrl);
        });
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Link copied to clipboard!'))
      .catch(err => {
        console.error('Failed to copy:', err);
        toast.error('Failed to copy link.');
      });
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('blob:') || url.startsWith('http')) {
      return url;
    }
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const renderMainProfile = () => {
    const getLocationSummary = (address) => {
      if (!address) return '';
      const parts = address.split(',').map(part => part.trim());
      if (parts.length <= 3) return address;
      return parts.slice(-3).join(', ');
    };

    const calculateProfileCompleteness = () => {
      const requiredFields = [
        'name', 'age', 'gender', 'height', 'bio',
        'workoutTypes', 'experienceLevel', 'preferredTime',
        'goals', 'photos', 'location',
      ];
      // Optional fields for completeness bonus
      const optionalFields = [
        'religion', 'politicalStance', 'sexualOrientation'
      ];

      let completedFields = 0;
      requiredFields.forEach(field => {
        if (field === 'workoutTypes') {
          if (formData.workoutTypes && formData.workoutTypes.length > 0) completedFields++;
        } else if (field === 'photos') {
          if (formData.photos && formData.photos.length >= 2) completedFields++;
        } else if (field === 'location') {
          if (formData.location && formData.location.address) completedFields++;
        } else if (field === 'bio' || field === 'goals') {
          if (formData[field] && formData[field].trim().length > 0) completedFields++;
        } else if (formData[field]) {
          completedFields++;
        }
      });

      let optionalCompleted = 0;
      optionalFields.forEach(field => {
        if (formData[field] && formData[field].trim().length > 0) {
          optionalCompleted++;
        }
      });

      const totalFields = requiredFields.length + optionalFields.length;
      const currentCompleted = completedFields + optionalCompleted;

      return Math.round((currentCompleted / totalFields) * 100);
    };

    const completeness = calculateProfileCompleteness();

    const radius = 70;
    const strokeWidth = 5; // Slightly thicker for better visibility
    const normalizedRadius = radius - strokeWidth / 2; // Adjust for stroke inside/outside
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (completeness / 100) * circumference;

    return (
      <>
        {/* Profile Picture Section - Circular Design */}
        <div className="flex flex-col items-center mt-8 mb-10 p-4"> {/* Increased top margin */}
          <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
            <svg
              height={radius * 2}
              width={radius * 2}
              className="absolute inset-0"
            >
              <circle
                stroke="#e0e0e0" // Softer gray background
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke="#6366f1" // Vibrant indigo for progress
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                transform={`rotate(-90 ${radius} ${radius})`}
                className="drop-shadow-sm" // Subtle shadow for depth
              />
            </svg>

            <div
              className="absolute inset-0 m-1.5 rounded-full overflow-hidden border-2 border-white shadow-lg cursor-pointer bg-gray-100 flex items-center justify-center"
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
                    e.target.src = "/api/placeholder/400/400"; // Fallback placeholder
                  }}
                />
              ) : (
                <User size={50} className="text-gray-400" />
              )}
            </div>

            <div className="absolute bottom-2 text-gray-700  right-2 z-10"> {/* Adjusted position and added z-index */}
              <CustomButton
  onClick={(e) => {
    e.stopPropagation();
    setActiveSection('photos');
  }}
  variant="primary"
  className="p-2 w-auto h-auto rounded-full bg-white text-gray-400 shadow-lg border border-gray-200 hover:bg-gray-50"
  icon={(props) => <Camera {...props} className="w-5 h-5 text-gray-400" />} // Ensure gray color
/>
            </div>
          </div>

          <div className="text-sm text-gray-600 mt-2 font-medium">
            Profile {completeness}% Complete
          </div>

          <div className="text-center mt-4">
            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">{formData.name || 'Your Name'}{formData.age ? `, ${formData.age}` : ''}</h1>
            {formData.location?.address && (
              <div className="flex items-center justify-center text-gray-600 mt-2">
                <MapPin size={18} className="mr-1.5 text-gray-500" />
                <span className="text-lg">{getLocationSummary(formData.location.address)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Details Sections */}
        <div className="px-6 space-y-8 pb-20"> {/* Increased padding and spacing */}
          <section className="bg-gray-50 p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><Info size={20} className="mr-2 text-blue-600" /> About Me</h2>
            <EditableField
              label="Biography"
              name="bio"
              value={formData.bio}
              placeholder="Tell others about yourself and your fitness journey..."
              textarea={true}
              onChange={handleChange}
              error={errors.bio}
            />
          </section>

          <section className="bg-gray-50 p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><User size={20} className="mr-2 text-blue-600" /> My Fitness Journey</h2>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Workout Types</label>
              <div className="flex flex-wrap gap-2">
                {workoutTypes.map(type => (
                  <CustomButton
                    key={type}
                    onClick={() => toggleSelection('workoutTypes', type)}
                    variant={(formData.workoutTypes || []).includes(type) ? 'primary' : 'secondary'}
                    className="flex-grow-0"
                  >
                    {type}
                  </CustomButton>
                ))}
              </div>
              {errors.workoutTypes && <p className="text-red-500 text-sm mt-2">{errors.workoutTypes}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Experience Level</label>
                <select
                  name="experienceLevel"
                  value={formData.experienceLevel || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Level</option>
                  {experienceLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                {errors.experienceLevel && <p className="text-red-500 text-sm mt-2">{errors.experienceLevel}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Time</label>
                <select
                  name="preferredTime"
                  value={formData.preferredTime || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Time</option>
                  {preferredTimes.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                {errors.preferredTime && <p className="text-red-500 text-sm mt-2">{errors.preferredTime}</p>}
              </div>
            </div>

            <EditableField
              label="Fitness Goals"
              name="goals"
              value={formData.goals}
              placeholder="What are your primary fitness goals? (e.g., build muscle, lose weight, improve endurance)"
              textarea={true}
              onChange={handleChange}
              error={errors.goals}
            />
          </section>

          <section className="bg-gray-50 p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><Info size={20} className="mr-2 text-blue-600" /> Personal Details (Optional)</h2>
            <EditableField
              label="Religion"
              name="religion"
              value={formData.religion}
              placeholder="Your religious beliefs (optional)"
              onChange={handleChange}
              error={errors.religion}
            />

            <EditableField
              label="Political Views"
              name="politicalStance"
              value={formData.politicalStance}
              placeholder="Your political views (optional)"
              onChange={handleChange}
              error={errors.politicalStance}
            />

            <EditableField
              label="Sexual Orientation"
              name="sexualOrientation"
              value={formData.sexualOrientation}
              placeholder="Your sexual orientation (optional)"
              onChange={handleChange}
              error={errors.sexualOrientation}
            />
          </section>

          {/* Settings Section */}
          <section className="bg-gray-50 p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Account Settings</h2>

            <div className="space-y-4"> {/* Increased spacing */}
              <CustomButton
                onClick={handleShareProfile}
                variant="outline"
                className="w-full"
                icon={Share2}
              >
                Share Profile
              </CustomButton>

              <CustomButton
                onClick={handlePauseAccount}
                variant="outline"
                className="w-full"
                icon={PauseCircle}
              >
                {formData.settings?.showMe === false ? 'Activate Profile' : 'Pause Profile'}
              </CustomButton>

              <CustomButton
                onClick={() => setShowDeleteConfirmationDialog(true)} // Open custom dialog
                variant="danger"
                className="w-full"
                icon={Trash2}
              >
                Delete Profile
              </CustomButton>
            </div>
          </section>
        </div>
      </>
    );
  };

  const workoutTypes = [
    'Strength Training', 'Cardio', 'HIIT', 'CrossFit', 'Bodybuilding',
    'Yoga', 'Pilates', 'Calisthenics', 'Powerlifting', 'Olympic Lifting',
    'Functional Training', 'Group Classes', 'Running', 'Swimming', 'Cycling'
  ];

  const experienceLevels = ['Beginner', 'Intermediate', 'Advanced'];
  const preferredTimes = ['Morning', 'Afternoon', 'Evening', 'Late Night', 'Weekends Only', 'Flexible'];

  const EditableField = ({ label, name, value, placeholder, textarea = false, onChange, error }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [fieldValue, setFieldValue] = useState(value || '');

    useEffect(() => {
      setFieldValue(value || '');
    }, [value]);

    const handleSave = () => {
      onChange({ target: { name, value: fieldValue } });
      const dataToSubmit = {
        ...formData,
        [name]: fieldValue,
        images: formData.photos?.filter(url => !url.startsWith('blob:')) || []
      };
      delete dataToSubmit.photos;

      gymbrosService.createOrUpdateProfile(dataToSubmit)
        .then(response => {
          if (!response.success) {
            console.error('Failed to update field:', response.message);
            toast.error(`Failed to save ${label.toLowerCase()}.`);
          } else {
            toast.success(`${label} updated!`);
          }
        })
        .catch(error => {
          console.error('Error updating field:', error);
          toast.error(`Error saving ${label.toLowerCase()}.`);
        });

      setIsEditing(false);
    };

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-semibold text-gray-700">{label}</label>
          {!isEditing && (
            <CustomButton
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="p-1 w-auto h-auto rounded-full"
              icon={Pencil}
            />
          )}
        </div>

        {!isEditing ? (
          <div className={`mt-1 p-3 border rounded-md bg-white min-h-[44px] text-gray-800 ${error ? 'border-red-400' : 'border-gray-200'}`}>
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
                className={`mt-1 block w-full p-3 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-400' : 'border-gray-300'}`}
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
                className={`mt-1 block w-full p-3 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-400' : 'border-gray-300'}`}
                autoFocus
              />
            )}

            <div className="flex justify-end mt-3 space-x-2">
              <CustomButton
                type="button"
                onClick={() => { setIsEditing(false); setFieldValue(value || ''); }} // Revert on cancel
                variant="outline"
              >
                Cancel
              </CustomButton>
              <CustomButton
                type="button"
                onClick={handleSave}
                variant="primary"
              >
                Save
              </CustomButton>
            </div>
          </div>
        )}
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  };

  const renderPhotoGallery = () => {
    return (
      <>
        <div className="sticky top-0 z-20 bg-white p-4 border-b border-gray-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <CustomButton
              onClick={() => {
                if (showSaveButton) {
                  setShowUnsavedChangesDialog(true);
                } else {
                  setActiveSection('main');
                }
              }}
              variant="outline"
              className="p-2 w-auto h-auto rounded-full"
              icon={ChevronLeft}
            />
            <h2 className="ml-4 text-2xl font-bold text-gray-800">Edit Photos</h2>
          </div>

          {showSaveButton && (
            <CustomButton
              onClick={handleSubmit}
              disabled={loading}
              variant="primary"
              icon={loading ? Loader : Save}
              className={loading ? "animate-pulse" : ""}
            >
              {loading ? 'Saving...' : 'Save Photos'}
            </CustomButton>
          )}
        </div>

        <div className="p-6 pb-20">
          {/* Debug info - helpful for troubleshooting */}
          <div className="mb-6 p-3 bg-blue-50 rounded text-xs text-blue-700 border border-blue-200">
            <p><strong>Total Photos:</strong> {formData.photos?.length || 0} items</p>
            <p><strong>Server Stored:</strong> {formData.photos?.filter(p => p && !p.startsWith('blob:')).length || 0} items</p>
            <p><strong>Pending Uploads:</strong> {formData.photos?.filter(p => p && p.startsWith('blob:')).length || 0} items</p>
          </div>

          <PhotoEditor
            ref={photoEditorRef}
            photos={formData.photos || []}
            onPhotosChange={handlePhotosChange}
            maxPhotos={6}
          />
          {errors.photos && <p className="text-red-500 text-sm mt-2">{errors.photos}</p>}
        </div>
      </>
    );
  };


  return (
    <div className="h-full overflow-y-auto relative bg-gray-50 rounded-lg custom-scrollbar"> {/* Added custom-scrollbar class */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: activeSection === 'main' ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeSection === 'main' ? 50 : -50 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {activeSection === 'main' ? renderMainProfile() : renderPhotoGallery()}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showUnsavedChangesDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8 mx-auto transform"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Unsaved Changes</h3>
              <p className="text-gray-700 mb-6">
                You have unsaved changes. Would you like to save them before going back?
              </p>
              <div className="flex justify-end gap-3">
                <CustomButton
                  onClick={() => {
                    if (userProfile && userProfile.images) {
                      setFormData(prev => ({
                        ...prev,
                        photos: [...userProfile.images]
                      }));
                    }
                    setShowSaveButton(false);
                    setShowUnsavedChangesDialog(false);
                    setActiveSection('main');
                  }}
                  variant="outline"
                >
                  Discard Changes
                </CustomButton>
                <CustomButton
                  onClick={() => {
                    handleSubmit();
                    setShowUnsavedChangesDialog(false);
                  }}
                  variant="primary"
                  disabled={loading}
                  icon={loading ? Loader : Save}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </CustomButton>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showDeleteConfirmationDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8 mx-auto transform"
            >
              <h3 className="text-xl font-bold text-red-700 mb-4">Delete Profile?</h3>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete your GymBros profile? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <CustomButton
                  onClick={() => setShowDeleteConfirmationDialog(false)}
                  variant="outline"
                >
                  Cancel
                </CustomButton>
                <CustomButton
                  onClick={confirmDeleteAccount}
                  variant="danger"
                  disabled={loading}
                  icon={loading ? Loader : Trash2}
                >
                  {loading ? 'Deleting...' : 'Delete Forever'}
                </CustomButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedGymBrosProfile;