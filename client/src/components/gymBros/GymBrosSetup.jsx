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
  
  // Swipe/drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartRef = useRef(null);
  const dragConstraints = useRef({ left: 0, right: 0 });

  useEffect(() => {
    //('ImageUploaderRef initialized:', imageUploaderRef.current ? 'YES' : 'NO');
  }, []);

  // If user is authenticated, initialize profile data with user info
  useEffect(() => {
    if (user) {
      //('Initializing profile data with user info:', user);
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
        //('User already has a phone number, marking as verified:', userData.phone);
      }
    }
  }, [user]);

  // Enhanced handleChange function for GymBrosSetup.jsx
  const handleChange = (field, value) => {
    // Special handling for photos to track changes
    if (field === 'photos') {
      //(`Photo update: ${value ? value.length : 0} photos`);
      
      // Log detailed info about the photos
      if (value && Array.isArray(value)) {
        const blobCount = value.filter(url => url && url.startsWith('blob:')).length;
        const serverCount = value.filter(url => url && !url.startsWith('blob:')).length;
        
        //(`Photos breakdown: ${blobCount} blob URLs, ${serverCount} server URLs`);
        //('Photo URLs:', value);
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
        //(`Syncing images field with ${serverUrls.length} server URLs from photos`);
        
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
        //('User has a profile:', profileData.profile);
        
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
      //('=== PROFILE SUBMISSION DEBUG START ===');
      
      // STEP 1: First create the profile WITHOUT images
      // This ensures the profile exists before trying to upload images
      const initialPayload = {
        ...profileData,
        verificationToken, // Include the verification token
        // Exclude photos and images for initial creation
        photos: undefined,
        images: undefined
      };
      
      //('Creating initial profile without images');
      const initialResponse = await gymbrosService.createOrUpdateProfile(initialPayload);
      
      if (!initialResponse.success) {
        throw new Error(initialResponse.message || 'Failed to create profile');
      }
      
      
      // STEP 2: Now upload images to the newly created profile
      let uploadedImageUrls = [];
      
      // Check if we have images to upload
      const blobUrls = profileData.photos?.filter(url => url && url.startsWith('blob:')) || [];
      
      if (blobUrls.length > 0) {
        
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
   
          
          if (validFiles.length > 0) {
            // Upload the files to the newly created profile
            const uploadResult = await gymbrosService.uploadProfileImages(validFiles);
            
            if (uploadResult.success) {
              uploadedImageUrls = uploadResult.imageUrls || [];
              
              // STEP 3: Update the profile with the image URLs if needed
              if (uploadedImageUrls.length > 0) {
                const updateResponse = await gymbrosService.createOrUpdateProfile({
                  ...initialResponse.profile,
                  images: uploadedImageUrls
                });
                
                //('Profile updated with images:', updateResponse);
                
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

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
      
      // If we're going back to the first step, ensure the login button is shown if it was previously shown
      if (currentStep - 1 === 0 && !isAuthenticated) {
        setShowPhoneLogin(false);
      }
    }
  };  // Enhanced navigation functions with proper validation for swiping
  const goToNextStepSwipe = () => {
    const currentStepConfig = steps[currentStep];

    // Provide haptic feedback for attempted navigation
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }

    // Check validation and block forward navigation if invalid
    if (!currentStepConfig.isValid()) {
      toast.error(`Please complete the "${currentStepConfig.title}" step`);
      return; // Block forward navigation
    }

    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else if (currentStep === steps.length - 1) {
      handleSubmit();
    }
  };

  const goToPrevStepSwipe = () => {
    // Provide haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }

    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
      
      // If we're going back to the first step, ensure the login button is shown if it was previously shown
      if (currentStep - 1 === 0 && !isAuthenticated) {
        setShowPhoneLogin(false);
      }
    }
  };

  // Touch/swipe handlers
  const handleTouchStart = (e) => {
    // Skip if touching interactive elements
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('a')) {
      return;
    }
    
    setIsDragging(true);
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !touchStartRef.current) return;
    
    // Skip if touching interactive elements
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('a')) {
      return;
    }
    
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - touchStartRef.current.x;
    const maxDrag = window.innerWidth * 0.3;
    
    // Apply resistance at boundaries
    let boundedDelta = deltaX;
    if (currentStep === 0 && deltaX > 0) {
      boundedDelta = Math.min(maxDrag * 0.3, deltaX * 0.3);
    } else if (currentStep === steps.length - 1 && deltaX < 0) {
      boundedDelta = Math.max(-maxDrag * 0.3, deltaX * 0.3);
    } else {
      boundedDelta = Math.max(-maxDrag, Math.min(maxDrag, deltaX));
    }
    
    setDragOffset(boundedDelta);
  };
  const handleTouchEnd = (e) => {
    if (!isDragging || !touchStartRef.current) return;
    
    setIsDragging(false);
    
    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - touchStartRef.current.x;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(deltaX) / deltaTime;
    
    // Thresholds for swipe detection
    const threshold = window.innerWidth * 0.15;
    const velocityThreshold = 0.3;
    
    let targetStep = currentStep;
    
    // Fast swipe - immediate response
    if (velocity > velocityThreshold && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && currentStep > 0) {
        // Swiped right - go to previous step (always allowed)
        targetStep = currentStep - 1;
      } else if (deltaX < 0 && currentStep < steps.length - 1) {
        // Swiped left - go to next step (check validation)
        const currentStepConfig = steps[currentStep];
        if (currentStepConfig.isValid()) {
          targetStep = currentStep + 1;
        } else {
          // Show error and prevent navigation
          toast.error(`Please complete the "${currentStepConfig.title}" step`);
          setDragOffset(0);
          return;
        }
      }
    } 
    // Slow drag - distance threshold
    else if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && currentStep > 0) {
        // Dragged right - go to previous step (always allowed)
        targetStep = currentStep - 1;
      } else if (deltaX < 0 && currentStep < steps.length - 1) {
        // Dragged left - go to next step (check validation)
        const currentStepConfig = steps[currentStep];
        if (currentStepConfig.isValid()) {
          targetStep = currentStep + 1;
        } else {
          // Show error and prevent navigation
          toast.error(`Please complete the "${currentStepConfig.title}" step`);
          setDragOffset(0);
          return;
        }
      }
    }
    
    setDragOffset(0);
    
    if (targetStep !== currentStep) {
      if (targetStep > currentStep) {
        goToNextStepSwipe();
      } else {
        goToPrevStepSwipe();
      }
    }
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    
    // Skip if clicking interactive elements
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('a')) {
      return;
    }
    
    e.preventDefault();
    setIsDragging(true);
    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
    setDragOffset(0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !touchStartRef.current) return;
    
    const deltaX = e.clientX - touchStartRef.current.x;
    const maxDrag = window.innerWidth * 0.3;
    
    // Apply resistance at boundaries
    let boundedDelta = deltaX;
    if (currentStep === 0 && deltaX > 0) {
      boundedDelta = Math.min(maxDrag * 0.3, deltaX * 0.3);
    } else if (currentStep === steps.length - 1 && deltaX < 0) {
      boundedDelta = Math.max(-maxDrag * 0.3, deltaX * 0.3);
    } else {
      boundedDelta = Math.max(-maxDrag, Math.min(maxDrag, deltaX));
    }
    
    setDragOffset(boundedDelta);
  };
  const handleMouseUp = (e) => {
    if (!isDragging || !touchStartRef.current) return;
    
    setIsDragging(false);
    
    const deltaX = e.clientX - touchStartRef.current.x;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(deltaX) / deltaTime;
    
    // Thresholds for swipe detection
    const threshold = window.innerWidth * 0.15;
    const velocityThreshold = 0.3;
    
    let targetStep = currentStep;
    
    // Fast swipe - immediate response
    if (velocity > velocityThreshold && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && currentStep > 0) {
        // Swiped right - go to previous step (always allowed)
        targetStep = currentStep - 1;
      } else if (deltaX < 0 && currentStep < steps.length - 1) {
        // Swiped left - go to next step (check validation)
        const currentStepConfig = steps[currentStep];
        if (currentStepConfig.isValid()) {
          targetStep = currentStep + 1;
        } else {
          // Show error and prevent navigation
          toast.error(`Please complete the "${currentStepConfig.title}" step`);
          setDragOffset(0);
          return;
        }
      }
    } 
    // Slow drag - distance threshold
    else if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && currentStep > 0) {
        // Dragged right - go to previous step (always allowed)
        targetStep = currentStep - 1;
      } else if (deltaX < 0 && currentStep < steps.length - 1) {
        // Dragged left - go to next step (check validation)
        const currentStepConfig = steps[currentStep];
        if (currentStepConfig.isValid()) {
          targetStep = currentStep + 1;        } else {
          // Show error and prevent navigation
          toast.error(`Please complete the "${currentStepConfig.title}" step`);
          setDragOffset(0);
          return;
        }
      }
    }
    
    setDragOffset(0);
    
    if (targetStep !== currentStep) {
      if (targetStep > currentStep) {
        goToNextStepSwipe();
      } else {
        goToPrevStepSwipe();
      }
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
        // Add arrow key navigation
      if (e.key === 'ArrowLeft' && currentStep > 0) {
        e.preventDefault();
        goToPrevStepSwipe();
      } else if (e.key === 'ArrowRight' && currentStep < steps.length - 1) {
        e.preventDefault();
        // Check validation before allowing forward navigation
        const currentStepConfig = steps[currentStep];
        if (currentStepConfig.isValid()) {
          goToNextStepSwipe();
        } else {
          toast.error(`Please complete the "${currentStepConfig.title}" step`);
        }
      }
    };
  
    // Add event listener for keydown
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentStep, steps.length]);

  // Mouse event cleanup for desktop dragging
  useEffect(() => {
    const handleMouseUpGlobal = (e) => handleMouseUp(e);
    const handleMouseMoveGlobal = (e) => handleMouseMove(e);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMoveGlobal);
      document.addEventListener('mouseup', handleMouseUpGlobal);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveGlobal);
      document.removeEventListener('mouseup', handleMouseUpGlobal);
    };
  }, [isDragging, currentStep, steps.length]);
  // Update progress bar based on current step
  useEffect(() => {
    setProgress(((currentStep + 1) / steps.length) * 100);
  }, [currentStep, steps.length]);
  // Animation variants for smoother transitions with drag support
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
      } gymbros-setup-fullscreen h-screen w-full flex flex-col transition-colors duration-300 relative overflow-hidden`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{
          touchAction: 'pan-y', // Allow vertical scrolling but prevent horizontal
          userSelect: 'none' // Prevent text selection during drag
        }}
      >
          {/* Animated Background Shapes for Welcome Step */}
        {isWelcomeStep && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
            <div className="absolute top-1/4 -right-16 w-48 h-48 bg-white/5 rounded-full animate-bounce"></div>
            <div className="absolute bottom-16 left-1/4 w-24 h-24 bg-white/10 rounded-full animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full animate-bounce"></div>
          </div>
        )}        {/* Swipe boundary indicators */}
        {isDragging && (
          <>
            {/* Left boundary indicator - always available for going back */}
            {currentStep > 0 && (
              <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-20 bg-gradient-to-r from-blue-400 to-transparent rounded-r-full transition-opacity duration-200 ${
                dragOffset > 50 ? 'opacity-100' : 'opacity-30'
              }`} />
            )}
            
            {/* Right boundary indicator - shows validation status */}
            {currentStep < steps.length - 1 && (
              <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-20 rounded-l-full transition-opacity duration-200 ${
                steps[currentStep].isValid() 
                  ? `bg-gradient-to-l from-blue-400 to-transparent ${dragOffset < -50 ? 'opacity-100' : 'opacity-30'}`
                  : `bg-gradient-to-l from-red-400 to-transparent ${dragOffset < -50 ? 'opacity-100' : 'opacity-50'}`
              }`} />
            )}
          </>
        )}        {/* Main content container - optimized for viewport */}
        <div className="h-full flex flex-col p-2 sm:p-3 pb-6">
          <div className="w-full max-w-md mx-auto flex flex-col h-full">
              {/* Progress bar - minimal height with more top spacing */}
            <div className="w-full h-1.5 bg-white/20 rounded-full mb-2 flex-shrink-0 mt-8">
              <div
                className="h-full bg-white/80 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>{/* Swipe indicator */}
            {isDragging && (
              <div className="w-full flex justify-center mb-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                  <p className="text-white text-xs font-medium">
                    {Math.abs(dragOffset) > 20 ? 
                      (dragOffset > 0 ? '← Release to go back' : 
                        // Check if forward navigation is valid
                        (steps[currentStep].isValid() ? 'Release to continue →' : '⚠️ Complete this step first')
                      ) : 
                      'Drag to navigate steps'
                    }
                  </p>
                </div>
              </div>
            )}            {/* Main content area - flexibly sized to fit available space */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden mt-10"
                 style={{ maxHeight: 'calc(100vh - 240px)' }}>
              <AnimatePresence mode="wait" custom={direction}>                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ 
                    duration: isDragging ? 0 : 0.3, 
                    ease: "easeInOut" 
                  }}
                  drag="x"
                  dragConstraints={dragConstraints.current}
                  dragElastic={0.1}
                  dragMomentum={false}
                  onDragStart={() => setIsDragging(true)}                  onDragEnd={(event, info) => {
                    setIsDragging(false);
                    const { offset } = info;
                    
                    // Handle drag end with validation
                    const threshold = 100;
                    if (Math.abs(offset.x) > threshold) {
                      if (offset.x > 0 && currentStep > 0) {
                        // Dragged right - go to previous step (always allowed)
                        goToPrevStepSwipe();
                      } else if (offset.x < 0 && currentStep < steps.length - 1) {
                        // Dragged left - go to next step (check validation)
                        const currentStepConfig = steps[currentStep];
                        if (currentStepConfig.isValid()) {
                          goToNextStepSwipe();
                        } else {
                          // Show error and prevent navigation
                          toast.error(`Please complete the "${currentStepConfig.title}" step`);
                        }
                      }
                    }
                  }}
                  className="w-full flex-1 flex flex-col min-h-0"
                  style={{ 
                    x: isDragging && !dragConstraints.current ? dragOffset : 0,
                    cursor: isDragging ? 'grabbing' : 'grab'
                  }}                >{/* Step title and subtitle - Only show for non-welcome steps */}
                  {!isWelcomeStep && (
                    <div className="mb-6 flex-shrink-0 mt-4">
                      <div className="flex items-center mb-2">
                        {steps[currentStep].icon}
                        <h2 className="text-base sm:text-lg font-bold ml-2 text-white drop-shadow-lg">{steps[currentStep].title}</h2>
                      </div>
                      <p className="text-sm text-blue-100/80">{steps[currentStep].subtitle}</p>
                    </div>
                  )}                  {/* Step component - flexible height with scroll if needed */}
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className="w-full h-full flex items-center justify-center py-4">
                      {steps[currentStep].component}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>            {/* Navigation buttons - always visible at bottom with safe margin */}
            <div className="navigation-container flex justify-between items-center mt-8 pt-4 mb-6 relative z-10 flex-shrink-0 border-t border-white/10">
              <button
                onClick={goToPrevStepSwipe}
                disabled={currentStep === 0}
                className={`p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all ${currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ChevronLeft size={20} />
              </button>

              <div className="text-xs text-white/60 flex flex-col items-center gap-1">
                <span>{currentStep + 1} / {steps.length}</span>
                {isDragging && (
                  <span className="text-blue-200 text-[10px] animate-pulse">
                    {dragOffset > 20 ? '← Release to go back' : dragOffset < -20 ? 'Release to continue →' : 'Drag to navigate'}
                  </span>
                )}
                {!isDragging && !isWelcomeStep && (
                  <span className="text-white/40 text-[10px]">
                    Swipe or use arrow keys
                  </span>
                )}
              </div>              <button
                onClick={goToNextStep}
                className={`p-3 rounded-full transition-all ${
                  loading 
                    ? 'bg-white/20 text-white cursor-not-allowed' 
                    : steps[currentStep].isValid()
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'bg-red-500/30 text-red-200 hover:bg-red-500/40 border border-red-400/30'
                }`}
                disabled={loading}
                title={!steps[currentStep].isValid() ? `Please complete the "${steps[currentStep].title}" step` : ''}
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
