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
  Trash2, MapPin, Navigation, RotateCcw, Shield
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
    navigate('/login');
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

  return (
    <div className="min-h-[100dvh] mt-10 bg-gray-50 relative p-4">
      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {isCoach ? (
            <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 h-48">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-purple-500/30 to-indigo-600/20"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-white/5 to-black/20"></div>
              
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
                <div className="absolute top-12 right-8 w-16 h-16 bg-purple-300/30 rounded-full blur-lg"></div>
                <div className="absolute bottom-8 left-1/3 w-24 h-24 bg-blue-300/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-4 right-4 w-12 h-12 bg-indigo-300/40 rounded-full blur-md"></div>
              </div>
              
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                <ProfileImageUpload
                  currentImage={profileData.profileImage}
                  onUploadSuccess={handleImageUploadSuccess}
                  onShowCropModal={handleShowCropModal}
                />
              </div>
              
              {isCoach && (
                <div className="absolute -bottom-28 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleActivateLocation}
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-md"
                      disabled={profileData.location?.lat && profileData.location?.lng && profileData.location?.city}
                    >
                      {(profileData.location?.lat && profileData.location?.lng && profileData.location?.city) ? (
                        <>
                          <MapPin className="w-4 h-4 mr-2 text-green-600" />
                          <span className="text-green-600">
                            {profileData.location.city}
                          </span>
                        </>
                      ) : profileData.location?.isVisible ? (
                        <>
                          <Navigation className="w-4 h-4 mr-2 text-orange-500" />
                          <span className="text-orange-500">Set Location</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-4 h-4 mr-2" />
                          Activate Location
                        </>
                      )}
                    </Button>
                    
                    {(profileData.location?.lat && profileData.location?.lng && profileData.location?.city) && (
                      <Button
                        onClick={handleRefreshLocation}
                        variant="outline"
                        size="sm"
                        className="bg-white hover:bg-gray-50 text-black border-gray-200 shadow-md p-2"
                        disabled={isRefreshingLocation}
                        title="Refresh location"
                      >
                        <RotateCcw className={`w-3 h-3 text-black ${isRefreshingLocation ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
          ) : (
            <div className='bg-white border-b'>
              <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center">
                  <h1 className={`text-2xl font-bold flex items-center`}>
                    <User className="w-8 h-8 mr-2" />
                    Profile
                  </h1>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-4xl mx-auto">
            <div className={`grid grid-cols-2 gap-4 mb-8 ${isCoach ? 'mt-32' : ''}`}>
              <Card className='bg-gradient-to-br from-blue-50 to-white p-4'>
                <CardContent className="flex flex-col items-center p-4">
                  {roleIcon}
                  <p className="text-sm font-semibold text-black">{roleName}</p>
                  <p className="text-lg font-semibold text-black">{`${profileData.firstName} ${profileData.lastName}`}</p>
                </CardContent>
              </Card>

              <Card className='bg-gradient-to-br from-purple-50 to-white p-4'>
                <CardContent className="flex flex-col items-center p-4">
                  <Coins className="w-8 h-8 text-purple-500 mb-2" /> 
                  <p className="text-sm font-semibold text-black">Points</p>
                  <p className="text-lg font-semibold text-black">{balance}</p>
                </CardContent>
              </Card>
            </div>

            <Card className='shadow-lg mb-8'>
              <CardHeader className='border-b border-gray-100'>
                <div className="flex justify-between items-center">
                  <CardTitle className=''>Personal Information</CardTitle>
                  {!editing ? (
                    <Button
                      onClick={() => setEditing(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Edit Profile
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* First Name and Last Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-1`}>First Name</label>
                      <Input
                        value={profileData.firstName}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          firstName: e.target.value
                        }))}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1`}>Last Name</label>
                      <Input
                        value={profileData.lastName}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          lastName: e.target.value
                        }))}
                        disabled={!editing}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className={`block text-sm font-medium mb-1`}>Email</label>
                    <Input
                      type="email"
                      value={profileData.email}
                      disabled={true}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className={`block text-sm font-medium mb-1`}>Phone</label>
                    <Input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        phone: e.target.value
                      }))}
                      disabled={!editing}
                    />
                  </div>

                  {/* Payout Setup Section - Now visible for coaches, affiliates, AND taskforce */}
                  {canReceivePayouts && (
                    <div className="mt-6 mb-6">
                      <label className={`block text-sm font-medium mb-1`}>
                        {isCoach ? 'Coach Payout Setup' : isAffiliate ? 'Affiliate Payout Setup' : 'Taskforce Payout Setup'}
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
                      <div>
                        <label className={`block text-sm font-medium mb-1`}>Bio</label>
                        <div className="relative">
                          <Input
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
                      
                      {/* Rating - Read-only for coaches */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Rating</label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={profileData.rating}
                            disabled={true}
                            className="bg-gray-100 cursor-not-allowed"
                            step="0.1"
                            min="0"
                            max="5"
                          />
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600 ml-1">System managed</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Your rating is calculated based on client feedback and cannot be edited manually.
                        </p>
                      </div>

                      {/* Social Links */}
                      <div>
                        <label className={`block text-sm font-medium mb-1`}>Social Links</label>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Instagram className="w-5 h-5 text-pink-600" />
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
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Twitter className="w-5 h-5 text-blue-500" />
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
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Youtube className="w-5 h-5 text-red-600" />
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
                            />
                          </div>
                        </div>
                      </div>

                      {/* Specialties */}
                      <div>
                        <label className={`block text-sm font-medium mb-3`}>Specialties</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            <div
                              key={specialty}
                              className={`
                                flex items-center space-x-3 p-4 rounded-lg transition-all
                                ${profileData.specialties.includes(specialty)
                                  ? 'bg-blue-50 border border-blue-200 shadow-sm'
                                  : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md'
                                }
                                ${editing ? 'cursor-pointer' : 'cursor-not-allowed'}
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
                                className={`
                                  w-5 h-5 rounded border-2 transition-all
                                  ${profileData.specialties.includes(specialty)
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-300 bg-white'
                                  }
                                  ${editing ? 'cursor-pointer' : 'cursor-not-allowed'}
                                `}
                              />
                              <span
                                className={`
                                  text-sm font-medium
                                  ${profileData.specialties.includes(specialty)
                                    ? 'text-blue-700'
                                    : 'text-gray-700'
                                  }
                                `}
                              >
                                {specialty}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Save Button (Visible Only in Edit Mode) */}
                {editing && (
                  <div className="mt-6">
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Membership Status - Only for regular users */}
            {!canReceivePayouts && (
              <Card className='shadow-lg mb-8'>
                <CardHeader>
                  <CardTitle className={`flex items-center`}>
                    <Crown className="w-6 h-6 mr-2 text-yellow-500" />
                    Membership Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subscriptionDetails ? (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg ${getStatusColor(subscriptionDetails.status)}`}>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className={`text-lg font-semibold`}>
                            {formatSubscriptionType(subscriptionDetails.subscription)} Plan
                          </h3>
                          <span className={`px-3 py-1 rounded-full bg-opacity-25 capitalize`}>
                            {subscriptionDetails.status}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p>Start Date: {new Date(subscriptionDetails.startDate).toLocaleDateString()}</p>
                          {subscriptionDetails.endDate && (
                            <p>End Date: {new Date(subscriptionDetails.endDate).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className={`w-full justify-start`}
                        onClick={() => navigate('/subscription-management')}
                      >
                        <Settings className="w-5 h-5 mr-2" />
                        Manage Membership
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className='bg-blue-50 p-4 rounded-lg'>
                        <div className='text-gray-600 mb-4'>
                          Unlock exclusive features with our coaching plans:
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Personalized workout plans</li>
                            <li>Nutrition guidance</li>
                            <li>Expert coaching support</li>
                            <li>Premium features access</li>
                          </ul>
                        </div>
                        <Button
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
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

            <div className="grid grid-cols-2 gap-4 pb-8">
              <Button
                variant="outline"
                className={`flex items-center justify-center space-x-2 py-6`}
                onClick={() => navigate('/orders')}
              >
                <Package className="w-5 h-5" />
                <span>My Orders</span>
              </Button>
              <Button
                variant="destructive"
                className="flex items-center justify-center space-x-2 py-6"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </Button>
              <Button
                variant="destructive"
                className="flex items-center justify-center space-x-2 py-6 col-span-2"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                <Trash2 className="w-5 h-5" />
                <span>Delete Account</span>
              </Button>
            </div>
          </div>
        </form>
        
        {showStripeOnboarding && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className='bg-white p-6 rounded-lg w-full max-w-2xl'>
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