import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, User, MapPin, Award, FileText, X, ChevronRight, CreditCard } from 'lucide-react';
import { useAuth } from '../../stores/authStore';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../services/api';

const CoachProfileCompletionModal = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [isDismissed, setIsDismissed] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Fetch fresh profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      // Handle both possible user structures: user.role or user.user.role
      const userRole = user?.user?.role || user?.role;
      if (!user || userRole !== 'coach') {
        setIsLoadingProfile(false);
        return;
      }

      try {
        console.log('🔄 CoachProfileCompletionModal: Fetching fresh profile data...');
        const response = await api.get('/auth/profile');
        setProfileData(response.data);
        console.log('✅ CoachProfileCompletionModal: Fresh profile data loaded');
      } catch (error) {
        console.error('❌ CoachProfileCompletionModal: Error fetching profile data:', error);
        // Fallback to auth store user data
        const actualUser = user?.user || user;
        setProfileData(actualUser);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfileData();
  }, [user]);

  useEffect(() => {
    console.log('🚀 CoachProfileCompletionModal: Checking modal visibility conditions...', {
      isLoadingProfile,
      hasProfileData: !!profileData,
      currentPath: location.pathname,
      userRole: user?.user?.role || user?.role,
      hasUser: !!user
    });

    // Don't check until profile data is loaded
    if (isLoadingProfile || !profileData) {
      console.log('⏳ CoachProfileCompletionModal: Waiting for profile data to load...');
      return;
    }

    // Don't show on profile page
    if (location.pathname === '/profile') {
      console.log('🚫 CoachProfileCompletionModal: On profile page, not showing modal');
      return;
    }

    // Handle both possible user structures: user.role or user.user.role
    const userRole = user?.user?.role || user?.role;
    
    // Only show for coaches
    if (!user || userRole !== 'coach') {
      console.log('🚫 CoachProfileCompletionModal: User is not a coach, not showing modal', { userRole });
      return;
    }
    
    // Check if user has dismissed this warning recently
    const dismissedUntil = localStorage.getItem('coachWarningDismissed');
    console.log('🔍 CoachProfileCompletionModal: Checking dismissal status...', {
      dismissedUntil,
      currentTime: new Date().toISOString(),
      isDismissed: dismissedUntil && new Date() < new Date(dismissedUntil)
    });
    
    if (dismissedUntil && new Date() < new Date(dismissedUntil)) {
      console.log('⏰ CoachProfileCompletionModal: Modal was dismissed until:', dismissedUntil);
      return;
    }

    // Check which fields are missing using fresh profile data
    const missing = [];
    
    console.log('🔍 CoachProfileCompletionModal: Checking profile completion with fresh data:', {
      userId: profileData._id || profileData.id,
      bio: profileData.bio ? `"${profileData.bio.substring(0, 50)}..."` : 'MISSING',
      bioLength: profileData.bio?.length || 0,
      specialties: profileData.specialties?.length || 0,
      location: profileData.location ? 
        { lat: profileData.location.lat, lng: profileData.location.lng, city: profileData.location.city } : 
        'MISSING',
      profileImage: profileData.profileImage ? 'HAS_IMAGE' : 'MISSING',
      profileImageUrl: profileData.profileImage,
      payoutSetupComplete: profileData.payoutSetupComplete,
      stripeAccountId: profileData.stripeAccountId ? 'HAS_STRIPE_ID' : 'MISSING'
    });
    
    if (!profileData.bio || profileData.bio.trim().length < 50) {
      missing.push({
        field: 'bio',
        label: 'Professional Bio',
        description: 'Tell clients about your experience and approach (minimum 50 characters)',
        icon: FileText,
        severity: 'high'
      });
      console.log('❌ Missing: Professional Bio');
    }

    if (!profileData.specialties || profileData.specialties.length === 0) {
      missing.push({
        field: 'specialties',
        label: 'Training Specialties',  
        description: 'Select your areas of expertise to help clients find you',
        icon: Award,
        severity: 'high'
      });
      console.log('❌ Missing: Training Specialties');
    }

    if (!profileData.location || !profileData.location.lat || !profileData.location.lng || !profileData.location.city) {
      missing.push({
        field: 'location',
        label: 'Location',
        description: 'Add your location to connect with nearby clients',
        icon: MapPin,
        severity: 'critical'
      });
      console.log('❌ Missing: Location');
    }

    if (!profileData.profileImage || profileData.profileImage === '/fallback-avatar.jpg' || profileData.profileImage.includes('fallback')) {
      missing.push({
        field: 'profileImage',
        label: 'Profile Photo',
        description: 'Upload a professional photo to build trust with clients',
        icon: User,
        severity: 'medium'
      });
      console.log('❌ Missing: Profile Photo');
    }

    // Check payout setup completion
    if (profileData.payoutSetupComplete === false || !profileData.stripeAccountId) {
      missing.push({
        field: 'payoutSetup',
        label: 'Payout Setup',
        description: 'Set up your payment information to receive earnings from clients',
        icon: CreditCard,
        severity: 'critical'
      });
      console.log('❌ Missing: Payout Setup');
    }

    console.log('📊 CoachProfileCompletionModal: Missing fields summary:', {
      totalMissing: missing.length,
      missingFields: missing.map(f => f.field),
      currentModalState: { isVisible, isDismissed }
    });

    // NOTE: Certifications are no longer required for profile completion
    // If all main fields are complete, the profile is considered complete

    if (missing.length > 0) {
      console.log('⚠️ CoachProfileCompletionModal: Profile incomplete, preparing to show modal...');
      setMissingFields(missing);
      // Show modal after a brief delay
      setTimeout(() => {
        console.log('🎯 CoachProfileCompletionModal: Setting modal visible to true');
        setIsVisible(true);
      }, 1500);
    } else {
      console.log('✅ CoachProfileCompletionModal: Profile is complete, no modal needed');
    }
  }, [user, location.pathname, isLoadingProfile, profileData]);

  const handleDismiss = (duration = '1day') => {
    console.log('🚫 CoachProfileCompletionModal: Dismissing modal for:', duration);
    setIsVisible(false);
    setIsDismissed(true);
    
    // Set dismissal time based on duration
    const dismissUntil = new Date();
    switch (duration) {
      case '5minutes':
        dismissUntil.setMinutes(dismissUntil.getMinutes() + 5);
        break;
      case '1hour':
        dismissUntil.setHours(dismissUntil.getHours() + 1);
        break;
      case '1day':
        dismissUntil.setDate(dismissUntil.getDate() + 1);
        break;
      case '1week':
        dismissUntil.setDate(dismissUntil.getDate() + 7);
        break;
      default:
        dismissUntil.setDate(dismissUntil.getDate() + 1);
    }
    
    console.log('⏰ CoachProfileCompletionModal: Modal dismissed until:', dismissUntil.toISOString());
    localStorage.setItem('coachWarningDismissed', dismissUntil.toISOString());
  };

  const handleCompleteProfile = () => {
    console.log('🔄 CoachProfileCompletionModal: Redirecting to profile page...');
    setIsVisible(false);
    // Navigate to profile page
    window.location.href = '/profile';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityText = (severity) => {
    switch (severity) {
      case 'critical':
        return 'Required';
      case 'high':
        return 'Important';
      case 'medium':
        return 'Recommended';
      default:
        return 'Optional';
    }
  };

  const criticalMissing = missingFields.filter(f => f.severity === 'critical').length;

  console.log('🎨 CoachProfileCompletionModal: Render decision...', {
    isVisible,
    missingFieldsCount: missingFields.length,
    shouldRender: isVisible && missingFields.length > 0
  });

  if (!isVisible || missingFields.length === 0) {
    if (!isVisible && missingFields.length > 0) {
      console.log('👻 CoachProfileCompletionModal: Modal not visible but has missing fields');
    }
    if (isVisible && missingFields.length === 0) {
      console.log('🔄 CoachProfileCompletionModal: Modal visible but no missing fields');
    }
    return null;
  }

  console.log('🎪 CoachProfileCompletionModal: Rendering modal with', missingFields.length, 'missing fields');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-sm text-white">Complete Your Profile</h3>
              </div>
              <button
                onClick={() => handleDismiss('5minutes')}
                className="text-white hover:text-gray-200 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Status message */}
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p className="mb-2">
                <span className="font-medium">{missingFields.length} required field{missingFields.length > 1 ? 's' : ''} missing</span>
              </p>
              <p className="text-xs">
                Complete these fields to show yourself in our coaching sysyem:
              </p>
            </div>

            {/* Missing fields list */}
            <div className="space-y-2">
              {missingFields.map((field, index) => (
                <div
                  key={field.field}
                  className={`p-2 rounded-lg border ${getSeverityColor(field.severity)} flex items-start space-x-2`}
                >
                  <field.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{field.label}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-current text-white opacity-80">
                        {getSeverityText(field.severity)}
                      </span>
                    </div>
                    <p className="text-xs opacity-75 mt-0.5">{field.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleCompleteProfile}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center space-x-1 hover:from-blue-700 hover:to-purple-700 transition-colors"
              >
                <span>Complete Profile</span>
                <ChevronRight className="w-3 h-3" />
              </button>
              
              <button
                onClick={() => handleDismiss('1day')}
                className="w-full py-2 px-3 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Remind me tomorrow
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CoachProfileCompletionModal;
