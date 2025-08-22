import React, { useState, useEffect } from 'react';
import { useAuth } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { usePoints } from '../hooks/usePoints';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { 
  User, Package, LogOut, Loader2, Coins, AlertCircle, CheckCircle, 
  Clock, Star, Instagram, Twitter, Youtube, Crown, Settings, 
  Trash2, MapPin, Navigation, RotateCcw, Edit2, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import ProfileImageUpload from '../components/layout/ProfileImageUpload';
import ImageCropModal from '../components/layout/ImageCropModal';
import LocationRequestModal from '../components/common/LocationRequestModal';
import subscriptionService from '../services/subscription.service';
import StripeOnboardingForm from '../pages/StripeOnboardingForm';

const Profile = () => {
  const { user, updateProfile, logout, validatePhone } = useAuth();
  const navigate = useNavigate();
  const { balance, fetchPoints } = usePoints();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [showStripeOnboarding, setShowStripeOnboarding] = useState(false);
  const [verificationSessionId, setVerificationSessionId] = useState(null);
  const [cropModalProps, setCropModalProps] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);

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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [profileResponse, subscriptionResponse, payoutSetupResponse] = await Promise.all([
          api.get('/auth/profile'),
          api.get('/subscription/current'),
          isCoach ? api.get('/stripe/check-payout-setup') : Promise.resolve({ data: { payoutSetupComplete: false } })
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
  }, [user, fetchPoints, navigate, isCoach]);

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
  
        window.dispatchEvent(new Event('user-logout'));
        
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) {
          navigate('/login');
        }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isPhoneValid = await validatePhone({
        phone: profileData.phone,
      });

      if (!isPhoneValid) {
        throw new Error('Phone number already in use');
      }

      const updatedUser = await updateProfile(profileData);
      setProfileData({
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        profileImage: updatedUser.profileImage,
        bio: updatedUser.bio,
        rating: updatedUser.rating,
        socialLinks: updatedUser.socialLinks
      });

      setEditing(false);

      if (user?.role === 'coach' && !isCoachProfileComplete()) {
        toast.warning('Your profile is incomplete. Complete your bio, photo, specialties, and location to start receiving coaching requests.');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    
    // Dispatch custom logout event for mobile gatekeeper
    window.dispatchEvent(new Event('user-logout'));
    
    // For mobile, the gatekeeper will handle the redirect
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
      navigate('/login');
    }
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
      
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      
      let cityName = 'Unknown City';
      if (response.ok) {
        const data = await response.json();
        cityName = data.city || data.locality || data.principalSubdivision || 'Unknown City';
      }

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
          location: locationData
        }));
        toast.success(`Location updated to ${cityName}!`);
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
            location: locationData
          }));

          toast.success(`Location updated to ${locationData.city}!`);
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
        
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        
        let cityName = 'Unknown City';
        if (response.ok) {
          const data = await response.json();
          cityName = data.city || data.locality || data.principalSubdivision || 'Unknown City';
        }

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
            location: locationData
          }));
        }

      } catch (error) {
        // Silent fail for automatic location updates
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8 mt-10">
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-7xl">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          
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
                {!editing && (
                  <Button
                    onClick={() => setEditing(true)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 md:hidden"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            
            {/* Stats Cards - Mobile Optimized with proper spacing for coach */}
            <div className={`grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8 ${isCoach ? 'mt-20 md:mt-28' : ''}`}>
              <Card className='bg-gradient-to-br from-blue-50 to-white'>
                <CardContent className="flex flex-col items-center p-3 md:p-4">
                  <User className="w-6 h-6 md:w-8 md:h-8 text-blue-500 mb-1 md:mb-2" />
                  <p className="text-xs md:text-sm font-semibold text-gray-600">{isCoach ? 'Coach' : 'Member'}</p>
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

            {/* Location Button for Coach - Mobile Optimized */}
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
                  {!editing ? (
                    <Button
                      onClick={() => setEditing(true)}
                      className="bg-blue-600 hover:bg-blue-700 hidden md:flex"
                    >
                      Edit Profile
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-4 md:space-y-6">
                  
                  {/* Name Fields - Stack on mobile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-1">First Name</label>
                      <Input
                        value={profileData.firstName}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          firstName: e.target.value
                        }))}
                        disabled={!editing}
                        className="text-sm md:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name</label>
                      <Input
                        value={profileData.lastName}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          lastName: e.target.value
                        }))}
                        disabled={!editing}
                        className="text-sm md:text-base"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input
                      type="email"
                      value={profileData.email}
                      disabled={true}
                      className="text-sm md:text-base"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <Input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        phone: e.target.value
                      }))}
                      disabled={!editing}
                      className="text-sm md:text-base"
                    />
                  </div>

                  {/* Coach-Specific Fields */}
                  {isCoach && (
                    <>
                      {/* Bio */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Bio</label>
                        <div className="relative">
                          <textarea
                            value={profileData.bio}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value.length <= 100) {
                                setProfileData(prev => ({
                                  ...prev,
                                  bio: value
                                }));
                              }
                            }}
                            disabled={!editing}
                            maxLength={100}
                            placeholder="Tell us about yourself..."
                            className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md resize-none h-20 md:h-24"
                          />
                          <div className={`text-xs mt-1 text-right ${
                            profileData.bio.length > 90 
                              ? 'text-red-500' 
                              : 'text-gray-500'
                          }`}>
                            {profileData.bio.length}/100 characters
                          </div>
                        </div>
                      </div>

                      {/* Rating */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Rating</label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={profileData.rating}
                            disabled={true}
                            className="bg-gray-100 cursor-not-allowed text-sm md:text-base"
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

                      {/* Social Links - Mobile Optimized */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Social Links</label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Instagram className="w-4 h-4 md:w-5 md:h-5 text-pink-600 flex-shrink-0" />
                            <Input
                              placeholder="Instagram URL"
                              value={profileData.socialLinks.instagram}
                              onChange={(e) => setProfileData(prev => ({
                                ...prev,
                                socialLinks: {
                                  ...prev.socialLinks,
                                  instagram: e.target.value
                                }
                              }))}
                              disabled={!editing}
                              className="text-sm md:text-base"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Twitter className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" />
                            <Input
                              placeholder="Twitter URL"
                              value={profileData.socialLinks.twitter}
                              onChange={(e) => setProfileData(prev => ({
                                ...prev,
                                socialLinks: {
                                  ...prev.socialLinks,
                                  twitter: e.target.value
                                }
                              }))}
                              disabled={!editing}
                              className="text-sm md:text-base"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Youtube className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0" />
                            <Input
                              placeholder="YouTube URL"
                              value={profileData.socialLinks.youtube}
                              onChange={(e) => setProfileData(prev => ({
                                ...prev,
                                socialLinks: {
                                  ...prev.socialLinks,
                                  youtube: e.target.value
                                }
                              }))}
                              disabled={!editing}
                              className="text-sm md:text-base"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Payout Setup - Mobile Optimized */}
                      {isCoach && (
                        <div className="mt-4 md:mt-6">
                          <label className="block text-sm font-medium mb-2">Payout Setup</label>
                          {!profileData.stripeAccountId ? (
                            <div className='bg-yellow-50 p-3 md:p-4 rounded-lg border border-yellow-200'>
                              <div className="flex items-start">
                                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div className="ml-2 md:ml-3">
                                  <h3 className="text-sm font-medium text-yellow-500">
                                    Payout Setup Required
                                  </h3>
                                  <p className="mt-1 text-xs md:text-sm text-yellow-500">
                                    To receive payments from your clients, you need to set up your payout information.
                                  </p>
                                  <Button
                                    type="button"
                                    onClick={() => setShowStripeOnboarding(true)}
                                    className="mt-3 text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2"
                                    size="sm"
                                    disabled={redirecting}
                                  >
                                    {redirecting ? (
                                      <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                                    ) : (
                                      'Set Up Payouts'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : profileData.pendingVerification && profileData.pendingVerification.length > 0 ? (
                            <div className='bg-purple-50 p-3 md:p-4 rounded-lg border border-purple-200'>
                              <div className="flex items-start">
                                <Clock className="h-4 w-4 md:h-5 md:w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                <div className="ml-2 md:ml-3">
                                  <h3 className="text-sm font-medium text-purple-500">
                                    Pending Verification
                                  </h3>
                                  <p className="mt-1 text-xs md:text-smtext-purple-500 text-gray-600">
                                    Your account is under review.
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : !profileData.payoutSetupComplete ? (
                            <div className='bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200'>
                              <div className="flex items-start">
                                <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="ml-2 md:ml-3">
                                  <h3 className="text-sm font-medium text-blue-500">
                                    Payout Setup In Progress
                                  </h3>
                                  <p className="mt-1 text-xs md:text-sm text-gray-600 text-blue-500">
                                    Your payout setup is in progress. Please complete the onboarding process.
                                  </p>
                                  <Button
                                    onClick={handleCompletePayoutSetup}
                                    className="mt-3 text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2"
                                    size="sm"
                                    disabled={redirecting}
                                  >
                                    {redirecting ? (
                                      <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                                    ) : (
                                      'Complete Setup'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className='bg-green-50 p-3 md:p-4 rounded-lg border border-green-200'>
                              <div className="flex items-start">
                                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                <div className="ml-2 md:ml-3">
                                  <h3 className="text-sm font-medium text-green-500">
                                    Payout Setup Complete
                                  </h3>
                                  <p className="mt-1 text-xs md:text-sm text-green-500">
                                    Your payout information has been set up successfully.
                                  </p>
                                  <Button
                                    onClick={handleViewPayoutDashboard}
                                    variant="outline"
                                    className="mt-3 text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 text-green-700 bg-green-100 hover:bg-green-200"
                                    size="sm"
                                    disabled={redirecting}
                                  >
                                    {redirecting ? (
                                      <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                                    ) : (
                                      'View Dashboard'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Specialties - Mobile Grid */}
                      <div>
                        <label className="block text-sm font-medium mb-3">Specialties</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[
                            'Weight Training',
                            'Cardio',
                            'CrossFit',
                            'Yoga',
                            'Nutrition',
                            'Powerlifting',
                            'Bodybuilding',
                            'HIIT',
                            'Sports Performance',
                            'Weight Loss'
                          ].map((specialty) => (
                            <label
                              key={specialty}
                              className={`
                                flex items-center space-x-2 p-3 rounded-lg transition-all cursor-pointer
                                ${profileData.specialties.includes(specialty)
                                  ? 'bg-blue-50 border border-blue-200 shadow-sm'
                                  : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md'
                                }
                                ${!editing ? 'opacity-60 cursor-not-allowed' : ''}
                              `}
                            >
                              <input
                                type="checkbox"
                                checked={profileData.specialties.includes(specialty)}
                                onChange={(e) => {
                                  if (editing) {
                                    setProfileData(prev => ({
                                      ...prev,
                                      specialties: e.target.checked
                                        ? [...prev.specialties, specialty]
                                        : prev.specialties.filter(s => s !== specialty)
                                    }));
                                  }
                                }}
                                disabled={!editing}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span
                                className={`
                                  text-xs md:text-sm font-medium
                                  ${profileData.specialties.includes(specialty)
                                    ? 'text-blue-700'
                                    : 'text-gray-700'
                                  }
                                `}
                              >
                                {specialty}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Save/Cancel Buttons - Mobile Optimized */}
                {editing && (
                  <div className="mt-6 flex space-x-3">
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm md:text-base"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin mx-auto" />
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 text-sm md:text-base"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Membership Status - Mobile Optimized */}
            {!isCoach && (
              <Card className='shadow-sm md:shadow-lg mb-4 md:mb-8'>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center text-lg md:text-xl">
                    <Crown className="w-5 h-5 md:w-6 md:h-6 mr-2 text-yellow-500" />
                    Membership Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  {subscriptionDetails ? (
                    <div className="space-y-4">
                      <div className={`p-3 md:p-4 rounded-lg ${getStatusColor(subscriptionDetails.status)}`}>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-base md:text-lg font-semibold">
                            {formatSubscriptionType(subscriptionDetails.subscription)} Plan
                          </h3>
                          <span className="px-2 py-1 text-xs md:text-sm rounded-full bg-opacity-25 capitalize">
                            {subscriptionDetails.status}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs md:text-sm">
                          <p>Start: {new Date(subscriptionDetails.startDate).toLocaleDateString()}</p>
                          {subscriptionDetails.endDate && (
                            <p>End: {new Date(subscriptionDetails.endDate).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full justify-start text-sm md:text-base"
                        onClick={() => navigate('/subscription-management')}
                      >
                        <Settings className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        Manage Membership
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className='bg-blue-50 p-3 md:p-4 rounded-lg'>
                        <div className='text-gray-600 mb-3 text-sm md:text-base'>
                          Unlock exclusive features:
                          <ul className="list-disc list-inside mt-2 space-y-1 text-xs md:text-sm">
                            <li>Personalized workout plans</li>
                            <li>Nutrition guidance</li>
                            <li>Expert coaching support</li>
                            <li>Premium features access</li>
                          </ul>
                        </div>
                        <Button
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-sm md:text-base"
                          onClick={() => navigate('/coaching')}
                        >
                          Explore Coaching Plans
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons - Mobile Optimized */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center space-x-2 py-5 md:py-6 text-sm md:text-base"
                onClick={() => navigate('/orders')}
              >
                <Package className="w-4 h-4 md:w-5 md:h-5" />
                <span>My Orders</span>
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 ml-auto" />
              </Button>
              
              <Button
                variant="destructive"
                className="w-full flex items-center justify-center space-x-2 py-5 md:py-6 text-sm md:text-base"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                <span>Logout</span>
              </Button>
              
              <Button
                variant="destructive"
                className="w-full flex items-center justify-center space-x-2 py-5 md:py-6 bg-red-600 hover:bg-red-700 text-sm md:text-base"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                <span>Delete Account</span>
              </Button>
            </div>
          </div>
        </form>

        {/* Stripe Onboarding Modal - Mobile Optimized */}
        {showStripeOnboarding && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className='bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
              <div className="p-4 md:p-6">
                <StripeOnboardingForm
                  initialData={{
                    email: profileData.email,
                    firstName: profileData.firstName,
                    lastName: profileData.lastName,
                    phone: profileData.phone,
                  }}
                  onSubmit={handlePayoutSetup}
                  onClose={() => setShowStripeOnboarding(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Crop Modal */}
        {cropModalProps && (
          <ImageCropModal
            image={cropModalProps.image}
            onCropComplete={cropModalProps.onCropComplete}
            onClose={handleCloseCropModal}
            aspectRatio={1}
          />
        )}

        {/* Location Request Modal */}
        <LocationRequestModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onLocationSet={handleLocationSet}
          title="Activate Coach Location"
        />
      </div>
    </div>
  );
};

export default Profile;