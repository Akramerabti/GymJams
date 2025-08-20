import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, User, MapPin, Award, FileText, X, ChevronRight, CreditCard } from 'lucide-react';
import { useAuth } from '../../stores/authStore';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../services/api';

const CoachProfileCompletionModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [missingFields, setMissingFields] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Fetch fresh profile data
  useEffect(() => {
    if (!isOpen) return;
    const fetchProfileData = async () => {
      const userRole = user?.user?.role || user?.role;
      if (!user || userRole !== 'coach') {
        setIsLoadingProfile(false);
        return;
      }
      try {
        const response = await api.get('/auth/profile');
        setProfileData(response.data);
      } catch (error) {
        console.error('❌ CoachProfileCompletionModal: Error fetching profile data:', error);
        // Fallback to auth store user data
        const actualUser = user?.user || user;
        setProfileData(actualUser);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    setIsLoadingProfile(true);
    fetchProfileData();
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (isLoadingProfile || !profileData) return;
    // Only show for coaches, not on /profile
    const userRole = user?.user?.role || user?.role;
    if (!user || userRole !== 'coach') return;
    if (location.pathname === '/profile') return;
    // Check which fields are missing using fresh profile data
    const missing = [];
    if (!profileData.bio || profileData.bio.trim().length < 50) {
      missing.push({
        field: 'bio',
        label: 'Professional Bio',
        description: 'Tell clients about your experience and approach (minimum 50 characters)',
        icon: FileText,
        severity: 'high'
      });
    }
    if (!profileData.specialties || profileData.specialties.length === 0) {
      missing.push({
        field: 'specialties',
        label: 'Training Specialties',  
        description: 'Select your areas of expertise to help clients find you',
        icon: Award,
        severity: 'high'
      });
    }
    if (!profileData.location || !profileData.location.lat || !profileData.location.lng || !profileData.location.city) {
      missing.push({
        field: 'location',
        label: 'Location',
        description: 'Add your location to connect with nearby clients',
        icon: MapPin,
        severity: 'critical'
      });
    }
    if (!profileData.profileImage || profileData.profileImage === '/fallback-avatar.jpg' || profileData.profileImage.includes('fallback')) {
      missing.push({
        field: 'profileImage',
        label: 'Profile Photo',
        description: 'Upload a professional photo to build trust with clients',
        icon: User,
        severity: 'medium'
      });
    }
    if (profileData.payoutSetupComplete === false || !profileData.stripeAccountId) {
      missing.push({
        field: 'payoutSetup',
        label: 'Payout Setup',
        description: 'Set up your payment information to receive earnings from clients',
        icon: CreditCard,
        severity: 'critical'
      });
    }
    setMissingFields(missing);
  }, [user, location.pathname, isLoadingProfile, profileData, isOpen]);

  const handleDismiss = () => {
    onClose?.();
  };

  const handleCompleteProfile = () => {
    onClose?.();
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

  if (!isOpen || missingFields.length === 0) return null;

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
                onClick={handleDismiss}
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
                onClick={handleDismiss}
                className="w-full py-2 px-3 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CoachProfileCompletionModal;
