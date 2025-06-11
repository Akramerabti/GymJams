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
      footer.style.display = 'none';
      footer.style.visibility = 'hidden';
      footer.style.height = '0';
      footer.style.overflow = 'hidden';
      footer.style.opacity = '0';
      footer.style.pointerEvents = 'none';
    });
    
    // Force a re-render of the layout
    const event = new CustomEvent('footerHidden', { detail: true });
    window.dispatchEvent(event);
    
    // When component unmounts, remove the classes and restore styles
    return () => {
      document.body.classList.remove('hide-footer');
      document.documentElement.classList.remove('hide-footer');
      
      // Restore body scrolling
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      // Restore footer styles
      const footers = document.querySelectorAll('footer, [role="contentinfo"]');
      footers.forEach(footer => {
        footer.style.display = '';
        footer.style.visibility = '';
        footer.style.height = '';
        footer.style.overflow = '';
        footer.style.opacity = '';
        footer.style.pointerEvents = '';
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

  // If user is authenticated, initialize profile data with user info
  useEffect(() => {
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
    }
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
          [field]: value,
          images: serverUrls
        }));
      }
    }
  };
    
  const handleWorkoutTypeToggle = (type) => {
    setProfileData(prev => {
      if (prev.workoutTypes.includes(type)) {
        return {
          ...prev,
          workoutTypes: prev.workoutTypes.filter(t => t !== type),
        };
      } else {
        return {
          ...prev,
          workoutTypes: [...prev.workoutTypes, type],
        };
      }
    });
  };

  const handleInterestToggle = (interest) => {
    setProfileData(prev => {
      if (prev.interests.includes(interest)) {
        return {
          ...prev,
          interests: prev.interests.filter(i => i !== interest),
        };
      } else {
        return {
          ...prev,
          interests: [...prev.interests, interest],
        };
      }
    });
  };

  const handlePhoneChange = (phone) => {
    // Don't allow changing the phone if the user is logged in and has a phone
    if (isAuthenticated && user && (user.phone || (user.user && user.user.phone))) {
      toast.error("You can't change your phone number when logged in");
      return;
    }
    
    setProfileData(prev => ({ ...prev, phone }));
    // Reset verification status when phone number changes
    setIsPhoneVerified(false);
    setVerificationToken(null);
  };
  
  const handleLoginWithPhone = () => {
    setAuthMode('login');
    setShowPhoneLogin(true);
    
    // Go to phone verification step
    const phoneVerificationIndex = steps.findIndex(step => step.id === 'phone');
    if (phoneVerificationIndex !== -1) {
      setDirection(1);
      setCurrentStep(phoneVerificationIndex);
    }
  };
  
  const handleExistingAccountFound = (phone) => {
    // Set auth mode to login
    setAuthMode('login');
    
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
      // Update profile data with user information
      if (userData.firstName) {
        setProfileData(prev => ({
          ...prev,
          name: userData.firstName + (userData.lastName ? ' ' + userData.lastName : '')
        }));
      }
      
      if (profileData && profileData.hasProfile) {
        console.log('User has a profile:', profileData.profile);
        
        onProfileCreated(profileData.profile);
        return; // Exit early as we're done
      }
    
      // No existing profile, move to next step in setup
      goToNextStep();
    } else {
      if (profileData && profileData.hasProfile) {
        onProfileCreated(profileData.profile);
        return; 
      }
    }
  };
  
  const handleSubmit = async () => {
    if (!isPhoneVerified) {
      toast.error('Please verify your phone number before proceeding.');
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
      
      console.log('Initial profile created successfully:', initialResponse.profile);
      
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
          console.log(`Successfully converted ${validFiles.length} blob URLs to files`);
          
          if (validFiles.length > 0) {
            // Upload the files to the newly created profile
            const uploadResult = await gymbrosService.uploadProfileImages(validFiles);
            
            if (uploadResult.success) {
              uploadedImageUrls = uploadResult.imageUrls || [];
              console.log(`Successfully uploaded ${uploadedImageUrls.length} images:`, uploadedImageUrls);
              
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
            onProfileCreated(initialResponse.profile);
            toast.success('Profile created successfully!');
          }
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
          // Profile was created but images failed, still consider it a partial success
          onProfileCreated(initialResponse.profile);
          toast.success('Profile created, but there was an error uploading images.');
        }
      } else {
        // No images to upload, still consider it a success
        onProfileCreated(initialResponse.profile);
        toast.success('Profile created successfully!');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const goToNextStep = () => {
    const currentStepConfig = steps[currentStep];

    // Validate current step
    if (!currentStepConfig.isValid()) {
      toast.error(`Please complete the "${currentStepConfig.title}" step`);
      return;
    }

    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else if (currentStep === steps.length - 1) {
      handleSubmit();
    }
  };

  // Use the buildSteps function to create the steps
  const steps = buildSteps({
    isAuthenticated,
    user,
    profileData,
    authMode,
    showPhoneLogin,
    isPhoneVerified,
    handleChange,
    handleLoginWithPhone,
    handlePhoneChange,
    handlePhoneVerified,
    handleExistingAccountFound,
    handleContinueWithNewAccount,
    handleInterestToggle,
    handleWorkoutTypeToggle,
    goToNextStep,
    imageUploaderRef, // Pass the ref here
  });

  // Add keyboard event listener for Enter key
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if Enter key was pressed and not in a form input that should submit normally
      if (e.key === 'Enter' && 
          e.target.tagName !== 'TEXTAREA' && 
          !e.target.matches('input[type="text"], input[type="number"]')) {
        e.preventDefault();
        goToNextStep();
      }
    };
  
    // Add event listener for keydown
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentStep]);

  // Update progress bar based on current step
  useEffect(() => {
    setProgress(((currentStep + 1) / steps.length) * 100);
  }, [currentStep, steps.length]);

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
      
      // If we're going back to the first step, ensure the login button is shown if it was previously shown
      if (currentStep - 1 === 0 && !isAuthenticated) {
        setShowPhoneLogin(false);
      }
    }
  };

  // Animation variants for smoother transitions
  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  const isWelcomeStep = currentStep === 0;
  
  return (
    <>
      <FooterHider />      <div className={`${
        isWelcomeStep 
          ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white' 
          : 'bg-gradient-to-br from-slate-600 via-purple-400 to-indigo-500 text-white'
      } gymbros-setup-fullscreen h-screen w-full flex flex-col transition-colors duration-300 relative overflow-hidden`}>
        
        {/* Animated Background Shapes for Welcome Step */}
        {isWelcomeStep && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
            <div className="absolute top-1/4 -right-16 w-48 h-48 bg-white/5 rounded-full animate-bounce"></div>
            <div className="absolute bottom-16 left-1/4 w-24 h-24 bg-white/10 rounded-full animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full animate-bounce"></div>
          </div>
        )}        {/* Main content container - optimized for viewport */}
        <div className="h-full flex flex-col p-2 sm:p-3 pb-6">
          <div className="w-full max-w-md mx-auto flex flex-col h-full">
            
            {/* Progress bar - minimal height */}
            <div className="w-full h-1.5 bg-white/20 rounded-full mb-2 flex-shrink-0">
              <div
                className="h-full bg-white/80 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>            {/* Main content area - flexibly sized to fit available space */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden"
                 style={{ maxHeight: 'calc(100vh - 160px)' }}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full flex-1 flex flex-col min-h-0"
                >                  {/* Step title and subtitle - Only show for non-welcome steps */}
                  {!isWelcomeStep && (
                    <div className="mb-2 flex-shrink-0">
                      <div className="flex items-center mb-1">
                        {steps[currentStep].icon}
                        <h2 className="text-base sm:text-lg font-bold ml-2 text-white drop-shadow-lg">{steps[currentStep].title}</h2>
                      </div>
                      <p className="text-xs text-blue-100/80">{steps[currentStep].subtitle}</p>
                    </div>
                  )}

                  {/* Step component - flexible height with scroll if needed */}
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className="w-full h-full flex items-center justify-center py-2">
                      {steps[currentStep].component}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>            {/* Navigation buttons - always visible at bottom with safe margin */}
            <div className="navigation-container flex justify-between items-center mt-4 pt-3 mb-4 relative z-10 flex-shrink-0 border-t border-white/10">
              <button
                onClick={goToPrevStep}
                disabled={currentStep === 0}
                className={`p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all ${currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ChevronLeft size={20} />
              </button>

              <div className="text-xs text-white/60">
                {currentStep + 1} / {steps.length}
              </div>

              <button
                onClick={goToNextStep}
                className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <ChevronRight size={20} />
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
