import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Dumbbell, ChevronRight, ChevronLeft
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { buildSteps } from './buildSteps';
import gymbrosService from '../../services/gymbros.service';
import gymBrosLocationService from '../../services/gymBrosLocation.service';

// Tell Layout component to hide footer when on this route
const FooterHider = () => {
  const location = useLocation();
  
  useEffect(() => {
    // When component mounts, add multiple classes to ensure footer is hidden
    document.body.classList.add('hide-footer');
    document.documentElement.classList.add('hide-footer');
    
    // Prevent body scrolling during setup
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Also set inline styles as fallback
    const footers = document.querySelectorAll('footer, [role="contentinfo"]');
    footers.forEach(footer => {
      if (footer) {
        footer.style.display = 'none';
        footer.style.visibility = 'hidden';
      }
    });
    
    return () => {
      // Cleanup when component unmounts
      document.body.classList.remove('hide-footer');
      document.documentElement.classList.remove('hide-footer');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      // Restore footer visibility
      footers.forEach(footer => {
        if (footer) {
          footer.style.display = '';
          footer.style.visibility = '';
        }
      });
      
      // Dispatch event to notify layout
      const event = new CustomEvent('footerShown', { detail: false });
      window.dispatchEvent(event);
    };
  }, [location.pathname]);
  
  return null;
};

const GymBrosSetup = ({ onProfileCreated }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [profileData, setProfileData] = useState({
    name: '',
    age: '',
    gender: '',
    height: '',
    heightUnit: 'cm',
    interests: [],
    work: '',
    studies: '',
    phone: '',
    workoutTypes: [],
    experienceLevel: '',
    preferredTime: '',
    goals: '',
    location: {
      lat: null,
      lng: null,
      address: '',
    },
    images: [],
    photos: [], // Explicitly add photos array for ImageUploader
    // Location related fields
    hasExistingLocation: false,
    existingLocationMessage: '',
    selectedGyms: [], // Changed from selectedGym to selectedGyms array
    newGym: null
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState(null);
  const [authMode, setAuthMode] = useState('signup'); // 'signup' or 'login'
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const imageUploaderRef = useRef(null);


  useEffect(() => {
    console.log('ImageUploaderRef initialized:', imageUploaderRef.current ? 'YES' : 'NO');
  }, []);

  // Enhanced initialization with location checking
  useEffect(() => {
    const initializeWithLocationCheck = async () => {
      if (user) {
        console.log('Initializing profile data with user info:', user);
        const userData = user.user || user;
        
        // Pre-fill data if user is logged in
        setProfileData(prev => ({
          ...prev,
          name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : prev.name,
          phone: userData.phone || prev.phone,
        }));
        
        // If user has a phone number, consider it verified
        if (userData.phone) {
          setIsPhoneVerified(true);
          console.log('User already has a phone number, marking as verified:', userData.phone);
        }

        // Check for existing location
        try {
          const locationCheck = await gymBrosLocationService.shouldSkipLocationStep(
            userData, 
            userData.phone
          );

          if (locationCheck.skipStep) {
            console.log('📍 Found existing location, can skip location step:', locationCheck);
            setProfileData(prev => ({
              ...prev,
              location: {
                lat: locationCheck.locationData.lat,
                lng: locationCheck.locationData.lng,
                address: locationCheck.locationData.address || locationCheck.locationData.city,
                city: locationCheck.locationData.city,
                state: locationCheck.locationData.state,
                country: locationCheck.locationData.country
              },
              hasExistingLocation: true,
              existingLocationMessage: `Using ${locationCheck.source === 'localStorage' ? 'stored' : 'existing'} location: ${locationCheck.locationData.city}`
            }));
          }

          // NOTE: Removed startAutoLocationSync from here to prevent API spam
          // Auto-sync will be started from the main Gymbros component
          
        } catch (error) {
          console.warn('Failed to check existing location:', error);
        }
      }
    };

    initializeWithLocationCheck();
  }, [user]);


  // Enhanced handleChange function for GymBrosSetup.jsx
  const handleChange = (field, value) => {
    // Special handling for photos to track changes
    if (field === 'photos') {
      console.log(`Photo update: ${value ? value.length : 0} photos`);
      
      // Log detailed info about the photos
      if (value && Array.isArray(value)) {
        const blobCount = value.filter(url => url && url.startsWith('blob:')).length;
        const serverCount = value.filter(url => url && !url.startsWith('blob:')).length;
        
        console.log(`Photos breakdown: ${blobCount} blob URLs, ${serverCount} server URLs`);
        console.log('Photo URLs:', value);
      }
    }
    
    // For age and height, just update the value - validation happens on blur or submit
    if (field === 'age' || field === 'height') {
      setProfileData(prev => ({ ...prev, [field]: value }));
      return;
    }
    
    if (field === 'location') {
      setProfileData(prev => ({
        ...prev,
        location: { ...prev.location, ...value },
      }));
    } else if (field === 'selectedGyms') {
      // Handle multiple gym selections
      console.log('Updating selected gyms:', value);
      setProfileData(prev => ({ ...prev, [field]: value }));
    } else {
      setProfileData(prev => ({ ...prev, [field]: value }));
      
      // If updating photos, also update images field to keep them in sync
      if (field === 'photos') {
        // For images, we only want to include non-blob URLs
        const serverUrls = Array.isArray(value) ? value.filter(url => url && !url.startsWith('blob:')) : [];
        console.log(`Syncing images field with ${serverUrls.length} server URLs from photos`);
        
        // Update the images field in profile data
        setProfileData(prev => ({ 
          ...prev, 
          images: serverUrls
        }));
      }
    }
  };

  const handleInputBlur = (field, value) => {
    // Only validate age and height on blur
    if (field === 'age') {
      const age = parseInt(value);
      if (age < 18 || age > 99) {
        toast.error('Age must be between 18 and 99');
        return;
      }
    }
    
    if (field === 'height') {
      const height = parseFloat(value);
      if (height <= 0 || height > 300) {
        toast.error('Please enter a valid height');
        return;
      }
    }
    
    // Update the value
    handleChange(field, value);
  };

  const handleWorkoutTypeToggle = (type) => {
    setProfileData(prev => ({
      ...prev,
      workoutTypes: prev.workoutTypes.includes(type)
        ? prev.workoutTypes.filter(t => t !== type)
        : [...prev.workoutTypes, type]
    }));
  };

  const handleInterestToggle = (interest) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handlePhoneChange = (phone) => {
    setProfileData(prev => ({ ...prev, phone }));
  };

const handleLoginWithPhone = () => {
  setAuthMode('login');
  setShowPhoneLogin(true);
  
  const phoneVerificationIndex = steps.findIndex(step => step.id === 'phone');
  if (phoneVerificationIndex !== -1) {
    setCurrentStep(phoneVerificationIndex);
  }

};

  const handleExistingAccountFound = (phone) => {
    setAuthMode('login');
    setShowPhoneLogin(true); // Show login button for existing accounts
    
    // Find the phone verification step index
    const phoneVerificationIndex = steps.findIndex(step => step.id === 'phone');
    if (phoneVerificationIndex !== -1) {
      setCurrentStep(phoneVerificationIndex);
    }
    
    toast.info(
      'Account found with this phone number',
      { description: 'Please verify to log in' }
    );
  };
  
  const handleContinueWithNewAccount = (phone, token) => {
    setAuthMode('signup');
    setShowPhoneLogin(false); // Hide the login button for new accounts
    setVerificationToken(token);
    setIsPhoneVerified(true);
    goToNextStep();
  };

const handlePhoneVerified = async (verified, userData = null, token = null, existingProfileData = null) => {
  setIsPhoneVerified(verified);
  
  if (token) {
    setVerificationToken(token);
  }
  
  if (userData) {

    if (userData.firstName) {
      setProfileData(prev => ({
        ...prev,
        name: userData.firstName + (userData.lastName ? ' ' + userData.lastName : '')
      }));
    }
    
    if (existingProfileData && existingProfileData.hasProfile && existingProfileData.profile) {

      onProfileCreated(existingProfileData.profile);
      return;
    }

    goToNextStep();
    return;
  }

  
  try {

    const profileCheckResponse = await gymbrosService.checkProfileWithVerifiedPhone(
      profileData.phone, 
      token
    );

    if (profileCheckResponse.success && profileCheckResponse.hasProfile && profileCheckResponse.profile) {

      onProfileCreated(profileCheckResponse.profile);
      return;
    }

  } catch (profileCheckError) {
    console.warn('⚠️ Profile check failed:', profileCheckError);
    console.log('📝 Continuing with new profile creation');
  }
  
  goToNextStep();
};
  
  const handleSubmit = async () => {
    if (!isPhoneVerified) {
      toast.error('Please verify your phone number before proceeding.');
      return;
    }

    // Validate all required fields before submission
    const requiredFields = {
      name: 'Name',
      age: 'Age', 
      gender: 'Gender',
      height: 'Height',
      experienceLevel: 'Experience Level',
      preferredTime: 'Preferred Time'
    };

    const missingFields = [];
    
    // Check required fields
    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!profileData[field] || profileData[field] === '') {
        missingFields.push(label);
      }
    });

    // Check age range
    const age = parseInt(profileData.age);
    if (age < 18 || age > 99) {
      missingFields.push('Valid Age (18-99)');
    }

    // Check location
    if (!profileData.location || !profileData.location.lat || !profileData.location.lng || !profileData.location.city) {
      missingFields.push('Location');
    }

    // Check workout types
    if (!profileData.workoutTypes || profileData.workoutTypes.length === 0) {
      missingFields.push('Workout Types');
    }

    // Check interests  
    if (!profileData.interests || profileData.interests.length === 0) {
      missingFields.push('Interests');
    }

    // Check photos (at least 2)
    const validPhotos = profileData.photos ? profileData.photos.filter(Boolean) : [];
    if (validPhotos.length < 2) {
      missingFields.push('At least 2 photos');
    }

    if (missingFields.length > 0) {
      toast.error(`Please complete the following fields: ${missingFields.join(', ')}`);
      return;
    }
  
    setLoading(true);
  
    try {
      console.log('=== PROFILE SUBMISSION DEBUG START ===');
      
      // STEP 1: First create the profile WITHOUT images
      // This ensures the profile exists before trying to upload images
      const initialPayload = {
        ...profileData,
        verificationToken, // Include the verification token
        // Exclude photos and images for initial creation
        photos: undefined,
        images: undefined
      };
      
      console.log('Creating initial profile without images');
      const initialResponse = await gymbrosService.createOrUpdateProfile(initialPayload);
      
      if (!initialResponse.success) {
        throw new Error(initialResponse.message || 'Failed to create profile');
      }
      
      console.log('Initial profile created successfully:', initialResponse);
      
      // STEP 2: Now upload images to the newly created profile
      let uploadedImageUrls = [];
      
      // Check if we have images to upload
      const blobUrls = profileData.photos?.filter(url => url && url.startsWith('blob:')) || [];
      
      if (blobUrls.length > 0) {
        console.log(`Found ${blobUrls.length} blob URLs to upload`);
        
        try {
          // Convert blob URLs to files with original filenames when possible
          const files = await Promise.all(blobUrls.map(async (blobUrl, index) => {
            try {
              // Generate a somewhat unique filename using the index
              const fileName = `user_photo_${index+1}_${Date.now()}.jpg`;
              return await gymbrosService.blobUrlToFile(blobUrl, fileName);
            } catch (err) {
              console.error(`Failed to convert blob URL to file: ${blobUrl}`, err);
              return null;
            }
          }));
          
          // Filter out any nulls from failed conversions
          const validFiles = files.filter(Boolean);
   
          console.log(`Converted ${validFiles.length} blob URLs to files successfully`);
          
          if (validFiles.length > 0) {
            // Upload the files to the newly created profile
            const uploadResult = await gymbrosService.uploadProfileImages(validFiles);
            
            if (uploadResult.success) {
              console.log('Image upload successful:', uploadResult);
              uploadedImageUrls = uploadResult.imageUrls || [];
              
              // STEP 3: Update the profile with the image URLs if needed
              if (uploadedImageUrls.length > 0) {
                const updateResponse = await gymbrosService.createOrUpdateProfile({
                  ...initialResponse.profile,
                  images: uploadedImageUrls
                });
                
                console.log('Profile updated with images:', updateResponse);
                
                // STEP 4: Handle gym memberships AFTER profile is complete
                await handleGymMemberships(updateResponse.profile || initialResponse.profile);
                
                // Call the onProfileCreated callback with the final profile
                onProfileCreated(updateResponse.profile || initialResponse.profile);
                toast.success('Profile created successfully!');
              } else {
                // No images were uploaded, still handle gym memberships
                await handleGymMemberships(initialResponse.profile);
                onProfileCreated(initialResponse.profile);
                toast.success('Profile created successfully!');
              }
            } else {
              // Image upload failed, but profile was created, still handle gyms
              console.warn('Profile created but image upload failed:', uploadResult.message);
              await handleGymMemberships(initialResponse.profile);
              onProfileCreated(initialResponse.profile);
              toast.success('Profile created, but image upload failed.');
            }
          } else {
            // No valid files to upload, still handle gym memberships
            console.log('No valid image files to upload');
            await handleGymMemberships(initialResponse.profile);
            onProfileCreated(initialResponse.profile);
            toast.success('Profile created successfully!');
          }
        } catch (imageError) {
          // Image processing failed, but profile was created, still handle gyms
          console.error('Image processing failed:', imageError);
          await handleGymMemberships(initialResponse.profile);
          onProfileCreated(initialResponse.profile);
          toast.success('Profile created, but image processing failed.');
        }
      } else {
        // No blob URLs to process, handle gym memberships
        console.log('No blob URLs found, handling gym memberships');
        await handleGymMemberships(initialResponse.profile);
        onProfileCreated(initialResponse.profile);
        toast.success('Profile created successfully!');
      }
      
      console.log('=== PROFILE SUBMISSION DEBUG END ===');
      
    } catch (error) {
      console.error('=== PROFILE SUBMISSION ERROR ===');
      console.error('Error creating profile:', error);
      toast.error(error.message || 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle gym memberships after profile creation
const handleGymMemberships = async (profile) => {
  try {
    if (profileData.selectedGyms && profileData.selectedGyms.length > 0) {
      console.log('Adding user to selected gyms:', profileData.selectedGyms);
      console.log('Using profile:', profile); // Debug log
      
      // Associate with each selected gym
      for (const gym of profileData.selectedGyms) {
        try {
          const result = await gymBrosLocationService.associateWithGym(
            gym._id,
            false, // Not primary by default
            'member', // Default membership type
            {
              profileId: profile._id, // Pass the profile ID
              userId: profile.userId || user?._id // Pass user ID if available
            }
          );
          console.log(`Successfully associated with gym: ${gym.name}`, result);
        } catch (gymError) {
          console.error(`Failed to associate with gym: ${gym.name}`, gymError);
          // Don't fail the entire process for gym association errors
        }
      }
      
      // Set the first gym as primary if we have any
      if (profileData.selectedGyms.length > 0) {
        try {
          await gymBrosLocationService.setPrimaryGym(
            profileData.selectedGyms[0]._id,
            {
              profileId: profile._id,
              userId: profile.userId || user?._id
            }
          );
          console.log(`Set primary gym: ${profileData.selectedGyms[0].name}`);
        } catch (primaryError) {
          console.error('Failed to set primary gym:', primaryError);
        }
      }
    }
  } catch (error) {
    console.error('Error handling gym memberships:', error);
    // Don't throw error - gym association is not critical for profile creation
  }
};

  // Navigation functions - declare before buildSteps
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

 const steps = buildSteps({
  profileData,
  handleChange,
  handleInputBlur,
  handleWorkoutTypeToggle,
  handleInterestToggle,
  handlePhoneChange,
  handlePhoneVerified,
  handleExistingAccountFound,
  handleContinueWithNewAccount,
  handleLoginWithPhone,
  isPhoneVerified,
  setIsPhoneVerified, // Add this line
  setVerificationToken,
  authMode,
  showPhoneLogin,
  imageUploaderRef,
  goToNextStep,
  user,
  isAuthenticated
});
  // Update progress when step changes
  useEffect(() => {
    setProgress(((currentStep + 1) / steps.length) * 100);
  }, [currentStep, steps.length]);

  const canProceed = () => {
    const currentStepData = steps[currentStep];
    return currentStepData.isValid ? currentStepData.isValid() : true;
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const isWelcomeStep = currentStep === 0;
  
return (
  <>
    <FooterHider />
    <div className={`${
      isWelcomeStep 
        ? 'bg-gradient-to-br from-slate-600 via-gray-700 to-slate-800 text-white' 
        : 'bg-gradient-to-br from-gray-100 via-slate-200 to-gray-300 text-gray-900'
    } gymbros-setup-fullscreen h-screen w-full flex flex-col transition-colors duration-300 relative overflow-hidden`}>
      
      {/* Animated Background Shapes for Welcome Step */}
      {isWelcomeStep && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-1/4 -right-16 w-48 h-48 bg-white/5 rounded-full animate-bounce"></div>
          <div className="absolute bottom-1/4 -left-20 w-40 h-40 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-16 right-1/4 w-56 h-56 bg-white/5 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Progress Bar - Hide on Welcome Step */}
      {!isWelcomeStep && (
        <div className="w-full bg-black/20 h-2 flex-shrink-0">
          <motion.div
            className="h-full bg-gradient-to-r from-slate-500 to-gray-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {/* Step Counter - Hide on Welcome Step */}
      {!isWelcomeStep && (
        <div className="text-center py-4 flex-shrink-0">
          <span className="text-gray-600 text-sm">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
      )}

      {/* Main Content - Flexible */}
      <div className="flex-1 flex flex-col justify-center p-4 min-h-0 relative z-10">
        <div className="w-full max-w-2xl mx-auto h-full flex flex-col justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="w-full flex flex-col justify-center"
            >
              {steps[currentStep].component}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation - Fixed at bottom, hide on welcome step */}
      {!isWelcomeStep && (
        <div className="p-4 md:p-6 flex-shrink-0 bg-gradient-to-t from-black/10 to-transparent">
          <div className="flex justify-between items-center max-w-2xl mx-auto">
            {/* Back Button */}
            <button
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
              className={`
                flex items-center px-4 md:px-6 py-3 rounded-xl font-medium transition-all duration-300
                ${currentStep === 0 
                  ? 'invisible' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300 shadow-lg'
                }
              `}
            >
              <ChevronLeft size={20} className="mr-2" />
              Back
            </button>

            {/* Next/Submit Button */}
            <button
              onClick={goToNextStep}
              disabled={!canProceed() || loading}
              className={`
                flex items-center px-6 md:px-8 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg
                ${canProceed() && !loading
                  ? 'bg-slate-700 text-white hover:bg-slate-800 transform hover:scale-105'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }
              `}
            >
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : currentStep === steps.length - 1 ? (
                'Complete Setup'
              ) : (
                'Continue'
              )}
              {!loading && currentStep < steps.length - 1 && (
                <ChevronRight size={20} className="ml-2" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  </>
);
};

export default GymBrosSetup;