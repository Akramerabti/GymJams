import React, { useState, useEffect } from 'react';
import { useAuth } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { usePoints } from '../hooks/usePoints';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { User, Package, LogOut, Loader2, Coins, AlertCircle, CheckCircle, Clock, Star, Instagram, Twitter, Youtube, Crown, Settings } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import ProfileImageUpload from '../components/layout/ProfileImageUpload';
import subscriptionService from '../services/subscription.service';
import StripeOnboardingForm from '../pages/StripeOnboardingForm'; // Import the StripeOnboardingForm

const Profile = () => {
  const { user, updateProfile, logout, validatePhone } = useAuth();
  const navigate = useNavigate();
  const { balance, fetchPoints } = usePoints();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [showStripeOnboarding, setShowStripeOnboarding] = useState(false); // State to control StripeOnboardingForm visibility
  const [verificationSessionId, setVerificationSessionId] = useState(null);
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
    payoutSetupComplete: false
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
          payoutSetupComplete: payoutSetupResponse.data.payoutSetupComplete || false
        });

        if (subscriptionResponse.data) {
          setSubscriptionDetails(subscriptionResponse.data);
        }

        fetchPoints();
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          console.error('Error fetching user data:', error);
          toast.error('Failed to load profile data');
        }
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user, fetchPoints, navigate]);

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
        toast.warning('Your profile is incomplete. Your name will not be shown until all fields are filled.');
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

  const isCoachProfileComplete = () => {
    // Implement your logic to check if the coach profile is complete
    return profileData.firstName && profileData.lastName && profileData.bio && profileData.profileImage;
  };

  const handlePayoutSetup = async (onboardingData) => {
    try {
      setRedirecting(true); // Start loading

      // Call the createStripeAccount function with the onboarding data
      const { accountId, verificationUrl } = await subscriptionService.createStripeAccount(onboardingData);

      // Update the user's Stripe account ID in the profile data
      setProfileData((prev) => ({
        ...prev,
        stripeAccountId: accountId,
      }));

      // Redirect the coach to complete identity verification
      window.location.href = verificationUrl;
    } catch (error) {
      console.error('Error setting up payout:', error);
    } finally {
      setRedirecting(false); // Stop loading
    }
  };

  const handleCompletePayoutSetup = async () => {
    try {
      setRedirecting(true); // Start loading
  
      // Call the initiateVerification function with the account ID
      const { url } = await subscriptionService.initiateVerification(
        profileData.stripeAccountId,
        `${window.location.origin}/profile`, // Use the new route
        `${window.location.origin}/profile`  // Use the new route
      );
      
      console.log('Verification URL:', url);

      // Store the verification session ID
      setVerificationSessionId(verificationSessionId);
  
      window.location.href = url;
    } catch (error) {
      console.error('Error completing setup:', error);
      toast.error('Failed to initiate verification. Please try again.');
    } finally {
      setRedirecting(false); // Stop loading
    }
  };
  

  const handleViewPayoutDashboard = async () => {
    try {
      setRedirecting(true); // Start loading
  
      // Call the Stripe API to generate a dashboard link
      const { url } = await subscriptionService.createStripeDashboardLink(
        profileData.stripeAccountId
      );
  
      // Open the Stripe dashboard in a new tab
      window.open(url, '_blank'); // Opens the URL in a new tab
    } catch (error) {
      console.error('Error accessing dashboard:', error);
      toast.error('Failed to access dashboard. Please try again.');
    } finally {
      setRedirecting(false); // Stop loading
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {isCoach ? (
            <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 h-48">
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                <ProfileImageUpload
                  currentImage={profileData.profileImage}
                  onUploadSuccess={handleImageUploadSuccess}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white border-b">
              <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold flex items-center">
                    <User className="w-8 h-8 mr-2" />
                    Profile
                  </h1>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-4xl mx-auto">
            <div className={`grid grid-cols-2 gap-4 mb-8 ${isCoach ? 'mt-20' : ''}`}>
              <Card className="bg-gradient-to-br from-blue-50 to-white p-4">
                <CardContent className="flex flex-col items-center p-4">
                  <User className="w-8 h-8 text-blue-500 mb-2" />
                  <p className="text-sm text-black font-semibold">{isCoach ? 'Coach' : 'Member'}</p>
                  <p className="text-lg text-gray-500 font-semibold">{`${profileData.firstName} ${profileData.lastName}`}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-white p-4">
                <CardContent className="flex flex-col items-center p-4">
                  <Coins className="w-8 h-8 text-purple-500 mb-2" /> 
                  <p className="text-sm text-black font-semibold">Points</p>
                  <p className="text-lg text-gray-500 font-semibold">{balance}</p>
                
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg mb-8">
  <CardHeader className="border-b border-gray-100">
    <div className="flex justify-between items-center">
      <CardTitle>Personal Information</CardTitle>
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
          <label className="block text-sm font-medium mb-1">First Name</label>
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
          <label className="block text-sm font-medium mb-1">Last Name</label>
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
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input
          type="email"
          value={profileData.email}
          disabled={true}
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
        />
      </div>

      {/* Coach-Specific Fields */}
      {isCoach && (
        <>
          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <Input
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                bio: e.target.value
              }))}
              disabled={!editing}
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <Input
              type="number"
              value={profileData.rating}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                rating: e.target.value
              }))}
              disabled={!editing}
            />
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-sm font-medium mb-1">Social Links</label>
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

            
          {/* Payout Setup Section */}
          {isCoach && (
              <div className="mt-6 mb-6">
                <label className="block text-sm font-medium mb-1">Payout Setup</label>
                {!profileData.stripeAccountId ? (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Payout Setup Required
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>To receive payments from your clients, you need to set up your payout information.</p>
                        </div>
                        <div className="mt-4">
                          <Button
                            type="button"
                            onClick={() => setShowStripeOnboarding(true)} // Show the StripeOnboardingForm
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                            disabled={redirecting} // Disable button during redirect
                          >
                            {redirecting ? (
                              <Loader2 className="w-5 h-5 animate-spin" /> // Show spinner
                            ) : (
                              'Set Up Payouts'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : !profileData.payoutSetupComplete ? (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <Clock className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Payout Setup In Progress
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>Your payout setup is in progress. Please complete the onboarding process.</p>
                        </div>
                        <div className="mt-4">
                          <Button
                            onClick={handleCompletePayoutSetup}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                            disabled={redirecting} // Disable button during redirect
                          >
                            {redirecting ? (
                              <Loader2 className="w-5 h-5 animate-spin" /> // Show spinner
                            ) : (
                              'Complete Setup'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          Payout Setup Complete
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>Your payout information has been set up successfully. You can now receive payments from your clients.</p>
                        </div>
                        <div className="mt-4">
                          <Button
                            onClick={handleViewPayoutDashboard}
                            variant="outline"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-green-700 bg-green-100 hover:bg-green-200"
                            disabled={redirecting} // Disable button during redirect
                          >
                            {redirecting ? (
                              <Loader2 className="w-5 h-5 animate-spin" /> // Show spinner
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


            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium mb-3 ">Specialties</label>
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

            {!isCoach && (
              <Card className="shadow-lg mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="w-6 h-6 mr-2 text-yellow-500" />
                    Membership Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subscriptionDetails ? (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg ${getStatusColor(subscriptionDetails.status)}`}>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold">
                            {formatSubscriptionType(subscriptionDetails.subscription)} Plan
                          </h3>
                          <span className="px-3 py-1 rounded-full bg-opacity-25 capitalize">
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
                        className="w-full justify-start"
                        onClick={() => navigate('/subscription-management')}
                      >
                        <Settings className="w-5 h-5 mr-2" />
                        Manage Membership
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-gray-600 mb-4">
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

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="flex items-center justify-center space-x-2 py-6"
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
            </div>
          </div>
        </form>
        {showStripeOnboarding && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
              <StripeOnboardingForm
                initialData={{
                  email: profileData.email,
                  firstName: profileData.firstName,
                  lastName: profileData.lastName,
                  phone: profileData.phone,
                }}
                onSubmit={handlePayoutSetup} // Pass the handlePayoutSetup function
                onClose={() => setShowStripeOnboarding(false)} // Close the modal
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;