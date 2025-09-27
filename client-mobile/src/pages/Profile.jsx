import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { usePoints } from '../hooks/usePoints';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { 
  User, Package, LogOut, Loader2, Coins, AlertCircle, CheckCircle, 
  Clock, Star, Instagram, Twitter, Youtube, Crown, Settings, 
  Trash2, MapPin, Navigation, RotateCcw, Shield, Edit, Save, X
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import ProfileImageUpload from '../components/layout/ProfileImageUpload';
import locationService from '../services/location.service';
import ImageCropModal from '../components/layout/ImageCropModal';
import LocationRequestModal from '../components/common/LocationRequestModal';
import subscriptionService from '../services/subscription.service';
import StripeOnboardingForm from '../pages/StripeOnboardingForm';

const Profile = () => {
  const { user, updateProfile, logout, validatePhone } = useAuth();
  const navigate = useNavigate();
  const { balance, fetchPoints } = usePoints();
  const [loading, setLoading] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [showStripeOnboarding, setShowStripeOnboarding] = useState(false);
  const [verificationSessionId, setVerificationSessionId] = useState(null);
  const [cropModalProps, setCropModalProps] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);

  // State for tracking which fields are being edited
  const [editingField, setEditingField] = useState(null);
  const [tempValues, setTempValues] = useState({});
  const inputRefs = useRef({});

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profileImage: '',
    bio: '',
    rating: 0,
    socialLinks: {
      instagram: '',
      twitter: '',
      youtube: ''
    },
    specialties: [],
    stripeAccountId: null,
    payoutSetupComplete: false,
    location: null
  });

  const isCoach = user?.user?.role === 'coach' || user?.role === 'coach';
  const isAffiliate = user?.user?.role === 'affiliate' || user?.role === 'affiliate';
  const isTaskforce = user?.user?.role === 'taskforce' || user?.role === 'taskforce';
  
  // FIXED: All three roles can receive payouts and need payout setup
  const canReceivePayouts = isCoach || isAffiliate || isTaskforce;

  // Get role display name and icon
  const getRoleDisplay = () => {
    if (isCoach) return { name: 'Coach', icon: <User className="w-8 h-8 text-blue-500 mb-2" /> };
    if (isAffiliate) return { name: 'Affiliate', icon: <Crown className="w-8 h-8 text-purple-500 mb-2" /> };
    if (isTaskforce) return { name: 'Taskforce', icon: <Shield className="w-8 h-8 text-green-500 mb-2" /> };
    return { name: 'Member', icon: <User className="w-8 h-8 text-blue-500 mb-2" /> };
  };

  const { name: roleName, icon: roleIcon } = getRoleDisplay();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [profileResponse, subscriptionResponse, payoutSetupResponse] = await Promise.all([
          api.get('/auth/profile'),
          api.get('/subscription/current'),
          canReceivePayouts ? api.get('/stripe/check-payout-setup') : Promise.resolve({ data: { payoutSetupComplete: false } })
        ]);
  
        const userData = profileResponse.data;
  
        setProfileData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          profileImage: userData.profileImage || '',
          bio: userData.bio || '',
          rating: userData.rating || 0,
          socialLinks: userData.socialLinks || {
            instagram: '',
            twitter: '',
            youtube: ''
          },
          specialties: userData.specialties || [],
          stripeAccountId: userData.stripeAccountId || null,
          payoutSetupComplete: payoutSetupResponse.data.payoutSetupComplete || false,
          pendingVerification: payoutSetupResponse.data.pendingVerification || [],
          location: userData.location || null
        });
  
        if (subscriptionResponse.data) {
          setSubscriptionDetails(subscriptionResponse.data);
        }
  
        fetchPoints();

        if (isCoach && userData.location?.isVisible) {
          setTimeout(checkAndUpdateLocation, 1000); 
        }
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          console.error('❌ Profile.jsx: Error fetching user data:', error);
          toast.error('Failed to load profile data');
        }
      }
    };
  
    if (user) {
      fetchUserData();
    }
  }, [user, fetchPoints, navigate, canReceivePayouts]);

  // Handle click outside to save
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editingField && inputRefs.current[editingField]) {
        if (!inputRefs.current[editingField].contains(event.target)) {
          handleSaveField(editingField);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingField, tempValues]);

  const handleEditField = (fieldName, value) => {
    setEditingField(fieldName);
    setTempValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Focus the input field after a short delay
    setTimeout(() => {
      if (inputRefs.current[fieldName]) {
        inputRefs.current[fieldName].focus();
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setTempValues({});
  };

  const handleSaveField = async (fieldName) => {
    if (!tempValues[fieldName] && tempValues[fieldName] !== '') return;
    
    const newValue = tempValues[fieldName];
    const currentValue = getFieldValue(profileData, fieldName);
    
    // Don't save if value hasn't changed
    if (newValue === currentValue) {
      setEditingField(null);
      setTempValues({});
      return;
    }

    setLoading(true);
    try {
      // Special handling for phone validation
      if (fieldName === 'phone') {
        const isPhoneValid = await validatePhone({
          phone: newValue,
        });

        if (!isPhoneValid) {
          throw new Error('Phone number already in use');
        }
      }

      // Special handling for nested fields like socialLinks
      let updatedData;
      if (fieldName.includes('.')) {
        const [parent, child] = fieldName.split('.');
        updatedData = {
          ...profileData,
          [parent]: {
            ...profileData[parent],
            [child]: newValue
          }
        };
      } else {
        updatedData = {
          ...profileData,
          [fieldName]: newValue
        };
      }

      const updatedUser = await updateProfile(updatedData);
      setProfileData(updatedUser);
      
      setEditingField(null);
      setTempValues({});
      
      toast.success(`${getFieldDisplayName(fieldName)} updated successfully`);
      
    } catch (error) {
      console.error(`Failed to update ${fieldName}:`, error);
      toast.error(error.message || `Failed to update ${getFieldDisplayName(fieldName)}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const getFieldValue = (data, fieldName) => {
    if (fieldName.includes('.')) {
      const [parent, child] = fieldName.split('.');
      return data[parent]?.[child] || '';
    }
    return data[fieldName] || '';
  };

  const getFieldDisplayName = (fieldName) => {
    const names = {
      firstName: 'First name',
      lastName: 'Last name',
      phone: 'Phone number',
      bio: 'Bio',
      'socialLinks.instagram': 'Instagram URL',
      'socialLinks.twitter': 'Twitter URL',
      'socialLinks.youtube': 'YouTube URL'
    };
    return names[fieldName] || fieldName;
  };

  const handleKeyPress = (e, fieldName) => {
    if (e.key === 'Enter') {
      handleSaveField(fieldName);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone. All your data, including subscriptions and coaching information, will be permanently removed.'
    );
  
    if (!confirmed) return;
  
    const secondConfirmation = window.confirm(
      'This is your final warning. Deleting your account will remove all your data permanently. Are you absolutely sure?'
    );
  
    if (!secondConfirmation) return;
  
    try {
      setLoading(true);
      const response = await api.delete('/auth/delete-account');
      if (response.status === 200) {
        toast.success('Account deleted successfully');
        await logout();
        navigate('/login');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-50 text-green-700',
      cancelled: 'bg-yellow-50 text-yellow-700',
      expired: 'bg-red-50 text-red-700'
    };
    return colors[status] || 'bg-gray-50 text-gray-700';
  };

  const formatSubscriptionType = (type) => {
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : '';
  };

  const handleImageUploadSuccess = (imageUrl) => {
    setProfileData((prev) => ({
      ...prev,
      profileImage: imageUrl,
    }));
  };

  const handleShowCropModal = (cropModalProps) => {
    setCropModalProps(cropModalProps);
  };

  const handleCloseCropModal = () => {
    if (cropModalProps && cropModalProps.onClose) {
      cropModalProps.onClose();
    }
    setCropModalProps(null);
  };

  const isCoachProfileComplete = () => {
    const hasBasicInfo = profileData.firstName && profileData.lastName;
    const hasBio = profileData.bio && profileData.bio.trim().length >= 50;
    const hasProfileImage = profileData.profileImage && 
      profileData.profileImage !== '/fallback-avatar.jpg' && 
      !profileData.profileImage.includes('fallback');
    const hasSpecialties = profileData.specialties && profileData.specialties.length > 0;
    
    const locationComplete = !profileData.location?.isVisible || 
      (profileData.location?.lat && profileData.location?.lng && profileData.location?.city);

    return hasBasicInfo && hasBio && hasProfileImage && hasSpecialties && locationComplete;
  };

  const handleActivateLocation = () => {
    setShowLocationModal(true);
  };

  const handleRefreshLocation = async () => {
    setIsRefreshingLocation(true);
    
    try {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser');
        return;
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      });

      const { latitude, longitude } = position.coords;
      
      const cityName = await locationService.reverseGeocode(latitude, longitude);

      const locationData = {
        lat: latitude,
        lng: longitude,
        city: cityName,
        address: '',
        source: 'manual-refresh'
      };

      const updateResponse = await api.put('/user/location', locationData);
      
      if (updateResponse.data) {
        setProfileData(prev => ({
          ...prev,
          location: updateResponse.data.location || locationData
        }));
        toast.success(`Location updated to ${updateResponse.data.location?.city || cityName}!`);
      }

    } catch (error) {
      if (error.code === 1) {
        toast.error('Location access denied. Please enable location permissions.');
      } else if (error.code === 2) {
        toast.error('Location unavailable. Please try again.');
      } else if (error.code === 3) {
        toast.error('Location request timed out. Please try again.');
      } else {
        toast.error('Failed to refresh location. Please try again.');
      }
    } finally {
      setIsRefreshingLocation(false);
    }
  };

  const handleLocationSet = async (locationData) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const updateResponse = await api.put('/user/location', locationData);      
        
        if (updateResponse.data) {
          setProfileData(prev => ({
            ...prev,
            location: updateResponse.data.location || locationData
          }));

          toast.success(`Location updated to ${updateResponse.data.location?.city || locationData.city}!`);
        }
      } else {
        console.error('❌ No auth token found');
      }
    } catch (error) {
      console.error('❌ Error updating user location:', error);
      toast.error('Failed to save location');
    } finally {
      setShowLocationModal(false);
    }
  };

  const checkAndUpdateLocation = async () => {
    if (!isCoach || !profileData.location?.isVisible) {
      return;
    }

    if (!profileData.location?.lat || !profileData.location?.lng) {
      try {
        if (!navigator.geolocation) {
          return;
        }

        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true, 
              timeout: 10000,
              maximumAge: 60000 
            }
          );
        });

        const { latitude, longitude } = position.coords;
        
        const cityName = await locationService.reverseGeocode(latitude, longitude);

        const locationData = {
          lat: latitude,
          lng: longitude,
          city: cityName,
          address: '',
          source: 'login-update'
        };
        
        const updateResponse = await api.put('/user/location', locationData);
        
        if (updateResponse.data) {
          setProfileData(prev => ({
            ...prev,
            location: updateResponse.data.location || locationData
          }));
        }

      } catch (error) {
        // Silent fail for background location update
      }
    }
  };

  const handlePayoutSetup = async (onboardingData) => {
    try {
      setRedirecting(true);

      const { accountId, verificationUrl } = await subscriptionService.createStripeAccount(onboardingData);

      setProfileData((prev) => ({
        ...prev,
        stripeAccountId: accountId,
      }));

      window.location.href = verificationUrl;
    } catch (error) {
      console.error('Error setting up payout:', error);
    } finally {
      setRedirecting(false);
    }
  };

  const handleCompletePayoutSetup = async () => {
    try {
      setRedirecting(true);
  
      const { url } = await subscriptionService.initiateVerification(
        profileData.stripeAccountId,
        `${window.location.origin}/profile`,
        `${window.location.origin}/profile`
      );

      setVerificationSessionId(verificationSessionId);
  
      window.location.href = url;
    } catch (error) {
      console.error('Error completing setup:', error);
      toast.error('Failed to initiate verification. Please try again.');
    } finally {
      setRedirecting(false);
    }
  };
  
  const handleViewPayoutDashboard = async () => {
    try {
      setRedirecting(true);
  
      const { url } = await subscriptionService.createStripeDashboardLink(
        profileData.stripeAccountId
      );
  
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error accessing dashboard:', error);
      toast.error('Failed to access dashboard. Please try again.');
    } finally {
      setRedirecting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Render input field with edit icon inside the input
  const renderEditableField = (fieldName, label, type = 'text', options = {}) => {
    const isEditing = editingField === fieldName;
    const currentValue = getFieldValue(profileData, fieldName);
    const displayValue = isEditing ? (tempValues[fieldName] !== undefined ? tempValues[fieldName] : currentValue) : currentValue;

    return (
      <div className="relative">
        <label className={`block text-sm font-medium mb-1`}>{label}</label>
        <div className="relative">
          <Input
            ref={el => inputRefs.current[fieldName] = el}
            type={type}
            value={displayValue}
            onChange={(e) => {
              if (isEditing) {
                setTempValues(prev => ({
                  ...prev,
                  [fieldName]: e.target.value
                }));
              }
            }}
            onKeyDown={(e) => handleKeyPress(e, fieldName)}
            disabled={!isEditing}
            className={`pr-10 ${isEditing ? 'border-blue-300' : ''}`}
            {...options}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {!isEditing ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleEditField(fieldName, currentValue)}
                className="h-7 w-7 p-0 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                title={`Edit ${label}`}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <div className="flex space-x-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSaveField(fieldName)}
                  disabled={loading}
                  className="h-7 w-7 p-0 hover:bg-green-50 text-green-600"
                  title="Save"
                >
                  <Save className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="h-7 w-7 p-0 hover:bg-red-50 text-red-600"
                  title="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
        {options.maxLength && (
          <div className={`text-xs mt-1 text-right ${
            displayValue.length > options.maxLength - 10 
              ? 'text-red-500' 
              : 'text-gray-500'
          }`}>
            {displayValue.length}/{options.maxLength} characters
          </div>
        )}
      </div>
    );
  };

  // Render social link field with edit icon inside the input
  const renderSocialField = (platform, icon, fieldName) => {
    const isEditing = editingField === fieldName;
    const currentValue = getFieldValue(profileData, fieldName);
    const displayValue = isEditing ? (tempValues[fieldName] !== undefined ? tempValues[fieldName] : currentValue) : currentValue;

    return (
      <div className="relative">
        <div className="flex items-center space-x-2">
          {icon}
          <div className="relative flex-1">
            <Input
              ref={el => inputRefs.current[fieldName] = el}
              placeholder={`${platform} URL`}
              value={displayValue}
              onChange={(e) => {
                if (isEditing) {
                  setTempValues(prev => ({
                    ...prev,
                    [fieldName]: e.target.value
                  }));
                }
              }}
              onKeyDown={(e) => handleKeyPress(e, fieldName)}
              disabled={!isEditing}
              className={`pr-10 ${isEditing ? 'border-blue-300' : ''}`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {!isEditing ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditField(fieldName, currentValue)}
                  className="h-7 w-7 p-0 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  title={`Edit ${platform} URL`}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <div className="flex space-x-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSaveField(fieldName)}
                    disabled={loading}
                    className="h-7 w-7 p-0 hover:bg-green-50 text-green-600"
                    title="Save"
                  >
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="h-7 w-7 p-0 hover:bg-red-50 text-red-600"
                    title="Cancel"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8 mt-20">
      <div className="container mx-auto py-4 md:py-8 max-w-7xl">
        <div className="space-y-4 md:space-y-6">
          
          {/* Mobile Header for Coach */}
          {isCoach ? (
            <div className="relative">
              {/* Header Background */}
              <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 h-32 md:h-48 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-purple-500/30 to-indigo-600/20"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-white/5 to-black/20"></div>
              </div>
              
              {/* Profile Image Upload - Positioned to overlap */}
              <div className="absolute -bottom-16 md:-bottom-20 left-1/2 transform -translate-x-1/2 z-10">
                <ProfileImageUpload
                  currentImage={profileData.profileImage}
                  onUploadSuccess={handleImageUploadSuccess}
                  onShowCropModal={handleShowCropModal}
                />
              </div>
            </div>
          ) : (
            /* Mobile Header for Member */
            <div className='bg-white rounded-xl shadow-sm p-4 md:p-6 mt-10'>
              <div className="flex items-center justify-between">
                <h1 className="text-xl md:text-2xl font-bold flex items-center">
                  <User className="w-6 h-6 md:w-8 md:h-8 mr-2" />
                  Profile
                </h1>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            
            {/* Stats Cards */}
            <div className={`grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8 ${isCoach ? 'mt-20 md:mt-28' : ''}`}>
              <Card className='bg-gradient-to-br from-blue-50 to-white'>
                <CardContent className="flex flex-col items-center p-3 md:p-4">
                  {roleIcon}
                  <p className="text-xs md:text-sm font-semibold text-gray-600">{roleName}</p>
                  <p className="text-sm md:text-lg font-semibold text-black text-center">
                    {`${profileData.firstName} ${profileData.lastName}`}
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-gradient-to-br from-purple-50 to-white'>
                <CardContent className="flex flex-col items-center p-3 md:p-4">
                  <Coins className="w-6 h-6 md:w-8 md:h-8 text-purple-500 mb-1 md:mb-2" /> 
                  <p className="text-xs md:text-sm font-semibold text-gray-600">Points</p>
                  <p className="text-sm md:text-lg font-semibold text-black">{balance}</p>
                </CardContent>
              </Card>
            </div>

            {/* Location Button for Coach */}
            {isCoach && (
              <div className="mb-4 md:mb-6 flex justify-center">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleActivateLocation}
                    variant="outline"
                    size="sm"
                    className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm text-xs md:text-sm"
                    disabled={profileData.location?.lat && profileData.location?.lng && profileData.location?.city}
                  >
                    {(profileData.location?.lat && profileData.location?.lng && profileData.location?.city) ? (
                      <>
                        <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-green-600" />
                        <span className="text-green-600">
                          {profileData.location.city}
                        </span>
                      </>
                    ) : profileData.location?.isVisible ? (
                      <>
                        <Navigation className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-orange-500" />
                        <span className="text-orange-500">Set Location</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                        Activate Location
                      </>
                    )}
                  </Button>
                  
                  {(profileData.location?.lat && profileData.location?.lng && profileData.location?.city) && (
                    <Button
                      onClick={handleRefreshLocation}
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-gray-50 text-black border-gray-200 shadow-sm p-1.5 md:p-2"
                      disabled={isRefreshingLocation}
                      title="Refresh location"
                    >
                      <RotateCcw className={`w-3 h-3 text-black ${isRefreshingLocation ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Personal Information Card */}
            <Card className='shadow-sm md:shadow-lg mb-4 md:mb-8'>
              <CardHeader className='border-b border-gray-100 p-4 md:p-6'>
                <div className="flex justify-between items-center">
                  <CardTitle className='text-lg md:text-xl'>Personal Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-4 md:space-y-6">
                  
                  {/* Name Fields - Using new editable fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {renderEditableField('firstName', 'First Name')}
                    {renderEditableField('lastName', 'Last Name')}
                  </div>

                  {/* Email - Read only */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input
                      type="email"
                      value={profileData.email}
                      disabled={true}
                      className="text-sm md:text-base pr-10"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Phone - Editable */}
                  {renderEditableField('phone', 'Phone', 'tel')}

                  {/* Payout Setup */}
                  {canReceivePayouts && (
                    <div className="mt-4 md:mt-6">
                      <label className="block text-sm font-medium mb-2">
                        Payout Setup
                        <span className="ml-2 text-xs text-gray-500">
                          ({roleName} Account)
                        </span>
                      </label>
                      
                      {!profileData.stripeAccountId ? (
                        <div className='bg-yellow-50 p-4 rounded-lg border border-yellow-200'>
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <AlertCircle className="h-5 w-5 text-yellow-400" />
                            </div>
                            <div className="ml-3">
                              <h3 className={`text-sm font-medium text-yellow-500`}>
                                Payout Setup Required
                              </h3>
                              <div className={`mt-2 text-sm text-yellow-500`}>
                                <p>
                                  To receive {
                                    isCoach ? 'payments from your clients' : 
                                    isAffiliate ? 'affiliate commissions' : 
                                    'taskforce rewards and commissions'
                                  }, you need to set up your payout information.
                                </p>
                                {isTaskforce && (
                                  <p className="mt-1 text-xs">
                                    <strong>Note:</strong> Payout setup is required before you can create ambassador codes.
                                  </p>
                                )}
                              </div>
                              <div className="mt-4">
                                <Button
                                  type="button"
                                  onClick={() => setShowStripeOnboarding(true)}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                  disabled={redirecting}
                                >
                                  {redirecting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : (
                                    'Set Up Payouts'
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : profileData.pendingVerification && profileData.pendingVerification.length > 0 ? (
                        <div className='bg-purple-50 p-4 rounded-lg border border-purple-200'>
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <Clock className="h-5 w-5 text-purple-400" />
                            </div>
                            <div className="ml-3">
                              <h3 className={`text-sm font-medium text-purple-500`}>
                                Pending Verification
                              </h3>
                              <div className={`mt-2 text-sm text-purple-500`}>
                                <p>Your account is under review. The following documents are pending verification:</p>
                                <ul className="list-disc list-inside mt-2">
                                  {profileData.pendingVerification.map((requirement, index) => (
                                    <li key={index}>{requirement}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : !profileData.payoutSetupComplete ? (
                        <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <Clock className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="ml-3">
                              <h3 className={`text-sm font-medium text-blue-500`}>
                                Payout Setup In Progress
                              </h3>
                              <div className={`mt-2 text-sm text-blue-500`}>
                                <p>Your payout setup is in progress. Please complete the onboarding process.</p>
                              </div>
                              <div className="mt-4">
                                <Button
                                  onClick={handleCompletePayoutSetup}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                  disabled={redirecting}
                                >
                                  {redirecting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : (
                                    'Complete Setup'
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="ml-3">
                              <h3 className={`text-sm font-medium text-green-500`}>
                                Payout Setup Complete
                              </h3>
                              <div className={`mt-2 text-sm text-green-500`}>
                                <p>
                                  Your payout information has been set up successfully. You can now receive {
                                    isCoach ? 'payments from your clients' : 
                                    isAffiliate ? 'affiliate commissions' : 
                                    'taskforce rewards and commissions'
                                  }.
                                </p>
                                {isTaskforce && (
                                  <p className="mt-1 text-xs">
                                    You can now create ambassador codes and earn commissions.
                                  </p>
                                )}
                              </div>
                              <div className="mt-4">
                                <Button
                                  onClick={handleViewPayoutDashboard}
                                  variant="outline"
                                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-green-700 bg-green-100 hover:bg-green-200`}
                                  disabled={redirecting}
                                >
                                  {redirecting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : (
                                    'View Payout Dashboard'
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Coach-Specific Fields */}
                  {isCoach && (
                    <>
                      {/* Bio */}
                      {renderEditableField('bio', 'Bio', 'text', { 
                        maxLength: 100,
                        placeholder: "Tell us about yourself..." 
                      })}

                      {/* Rating - Read-only */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Rating</label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={profileData.rating}
                            disabled={true}
                            className="bg-gray-100 cursor-not-allowed text-sm md:text-base pr-10"
                            step="0.1"
                            min="0"
                            max="5"
                          />
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-xs md:text-sm text-gray-600 ml-1">System managed</span>
                          </div>
                        </div>
                      </div>

                      {/* Social Links - Using new editable fields */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Social Links</label>
                        <div className="space-y-3">
                          {renderSocialField('Instagram', <Instagram className="w-4 h-4 md:w-5 md:h-5 text-pink-600 flex-shrink-0" />, 'socialLinks.instagram')}
                          {renderSocialField('Twitter', <Twitter className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" />, 'socialLinks.twitter')}
                          {renderSocialField('YouTube', <Youtube className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0" />, 'socialLinks.youtube')}
                        </div>
                      </div>

                      {/* Profile Completion Status */}
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-blue-900 text-sm md:text-base">Profile Completion</h4>
                            <p className="text-xs md:text-sm text-blue-700">
                              {isCoachProfileComplete() ? '🎉 Your profile is complete!' : 'Complete your profile to attract more clients'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl md:text-2xl font-bold text-blue-900">
                              {Math.round(
                                ([
                                  profileData.firstName && profileData.lastName,
                                  profileData.bio && profileData.bio.trim().length >= 50,
                                  profileData.profileImage && !profileData.profileImage.includes('fallback'),
                                  profileData.specialties && profileData.specialties.length > 0,
                                  !profileData.location?.isVisible || (profileData.location?.lat && profileData.location?.lng && profileData.location?.city)
                                ].filter(Boolean).length / 5) * 100
                              )}%
                            </div>
                            <div className="text-xs text-blue-700">Complete</div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Subscription Details */}
            {subscriptionDetails && (
              <Card className='shadow-sm md:shadow-lg mb-4 md:mb-8'>
                <CardHeader className='border-b border-gray-100 p-4 md:p-6'>
                  <CardTitle className='flex items-center text-lg md:text-xl'>
                    <Package className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    Subscription Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm md:text-base">Plan</span>
                      <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium ${getStatusColor(subscriptionDetails.status)}`}>
                        {formatSubscriptionType(subscriptionDetails.type)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm md:text-base">Status</span>
                      <span className="text-gray-600 text-sm md:text-base">{subscriptionDetails.status}</span>
                    </div>
                    {subscriptionDetails.expiresAt && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm md:text-base">Expires</span>
                        <span className="text-gray-600 text-sm md:text-base">
                          {new Date(subscriptionDetails.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Account Actions */}
            <Card className='shadow-sm md:shadow-lg'>
              <CardHeader className='border-b border-gray-100 p-4 md:p-6'>
                <CardTitle className='flex items-center text-lg md:text-xl'>
                  <Settings className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Account Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-3">
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full justify-start text-sm md:text-base"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                  
                  <Button
                    onClick={handleDeleteAccount}
                    variant="outline"
                    className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 text-sm md:text-base"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showStripeOnboarding && (
        <StripeOnboardingForm
          onClose={() => setShowStripeOnboarding(false)}
          onSuccess={handlePayoutSetup}
        />
      )}

      {cropModalProps && (
        <ImageCropModal
          {...cropModalProps}
          onClose={handleCloseCropModal}
        />
      )}

      {showLocationModal && (
        <LocationRequestModal
          onClose={() => setShowLocationModal(false)}
          onLocationSet={handleLocationSet}
        />
      )}
    </div>
  );
};

export default Profile;