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
    selectedGym: null,
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

  // Handle login with existing phone
  const handleLoginWithPhone = () => {
    // Go directly to phone verification step for login
    setShowPhoneLogin(true);
    
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

  const handlePhoneVerified = async (verified, userData = null, token = null, profileData = null) => {
    setIsPhoneVerified(verified);
    
    if (token) {
      setVerificationToken(token);
    }
    
    // If we received user data, we've successfully logged in
    if (userData) {
      console.log('Phone verification successful - user logged in:', userData);
      
      // Update profile data with user information
      if (userData.firstName) {
        setProfileData(prev => ({
          ...prev,
          name: userData.firstName + (userData.lastName ? ' ' + userData.lastName : '')
        }));
      }
      
      // Check if user has a COMPLETE profile
      if (profileData && profileData.hasProfile && profileData.profile) {
        const profile = profileData.profile;
        
        // Verify the profile has all required fields for GymBros
        const hasRequiredFields = profile.age && 
                                 profile.gender && 
                                 profile.height && 
                                 profile.experienceLevel && 
                                 profile.preferredTime && 
                                 profile.location && 
                                 profile.location.lat && 
                                 profile.location.lng && 
                                 profile.location.address;
        
        if (hasRequiredFields) {
          console.log('User has a complete profile:', profile);
          onProfileCreated(profile);
          return; // Exit early as we're done
        } else {
          console.log('User has incomplete profile, continuing with setup');
          // Pre-fill any existing data
          if (profile.name) setProfileData(prev => ({ ...prev, name: profile.name }));
          if (profile.age) setProfileData(prev => ({ ...prev, age: profile.age }));
          if (profile.gender) setProfileData(prev => ({ ...prev, gender: profile.gender }));
          if (profile.height) setProfileData(prev => ({ ...prev, height: profile.height }));
          if (profile.experienceLevel) setProfileData(prev => ({ ...prev, experienceLevel: profile.experienceLevel }));
          if (profile.preferredTime) setProfileData(prev => ({ ...prev, preferredTime: profile.preferredTime }));
          if (profile.location) setProfileData(prev => ({ ...prev, location: profile.location }));
          if (profile.workoutTypes) setProfileData(prev => ({ ...prev, workoutTypes: profile.workoutTypes }));
          if (profile.interests) setProfileData(prev => ({ ...prev, interests: profile.interests }));
          if (profile.goals) setProfileData(prev => ({ ...prev, goals: profile.goals }));
          if (profile.work) setProfileData(prev => ({ ...prev, work: profile.work }));
          if (profile.studies) setProfileData(prev => ({ ...prev, studies: profile.studies }));
        }
      }
    
      // Continue with setup process
      goToNextStep();
    } else {
      // Guest user verification - just move to next step
      goToNextStep();
    }
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
    if (!profileData.location || !profileData.location.lat || !profileData.location.lng || !profileData.location.address) {
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
                
                // Call the onProfileCreated callback with the final profile
                onProfileCreated(updateResponse.profile || initialResponse.profile);
                toast.success('Profile created successfully!');
              } else {
                // No images were uploaded, still consider it a success
                onProfileCreated(initialResponse.profile);
                toast.success('Profile created successfully!');
              }
            } else {
              // Image upload failed, but profile was created
              console.warn('Profile created but image upload failed:', uploadResult.message);
              onProfileCreated(initialResponse.profile);
              toast.success('Profile created, but image upload failed.');
            }
          } else {
            // No valid files to upload, still consider it a success
            console.log('No valid image files to upload');
            onProfileCreated(initialResponse.profile);
            toast.success('Profile created successfully!');
          }
        } catch (imageError) {
          // Image processing failed, but profile was created
          console.error('Image processing failed:', imageError);
          onProfileCreated(initialResponse.profile);
          toast.success('Profile created, but image processing failed.');
        }
      } else {
        // No blob URLs to process
        console.log('No blob URLs found, profile creation complete');
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

  // Build steps with handlers
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
    authMode,
    showPhoneLogin,
    imageUploaderRef,
    goToNextStep,  // ← This was missing!
    user,          // ← This was missing!
    isAuthenticated // ← This was missing!
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
          ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white' 
          : 'bg-gradient-to-br from-slate-600 via-purple-400 to-indigo-500 text-white'
      } gymbros-setup-fullscreen h-screen w-full flex flex-col transition-colors duration-300 relative overflow-hidden`}
      >
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
          <div className="w-full bg-black/20 h-2">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col relative z-10">
          {/* Step Counter - Hide on Welcome Step */}
          {!isWelcomeStep && (
            <div className="text-center py-4">
              <span className="text-white/80 text-sm">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
          )}

          {/* Animated Step Content */}
          <div className="flex-1 flex flex-col justify-center p-4 min-h-0">
            <div className="w-full max-w-2xl mx-auto h-full flex flex-col">
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
                  className="w-full h-full flex flex-col"
                >
                  {steps[currentStep].component}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-6">
            <div className="flex justify-between items-center max-w-2xl mx-auto">
              {/* Back Button */}
              <button
                onClick={goToPreviousStep}
                disabled={currentStep === 0}
                className={`
                  flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300
                  ${currentStep === 0 
                    ? 'invisible' 
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
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
                  flex items-center px-8 py-3 rounded-xl font-medium transition-all duration-300
                  ${canProceed() && !loading
                    ? 'bg-white text-gray-900 hover:bg-gray-100 shadow-lg transform hover:scale-105'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
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
        </div>
      </div>
    </>
  );
};

export default GymBrosSetup;
