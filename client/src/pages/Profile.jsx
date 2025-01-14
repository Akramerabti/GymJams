import React, { useState, useEffect } from 'react';
import { useAuth } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { usePoints } from '../hooks/usePoints';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { User, Package, LogOut, Loader2, Coins, Image, BookOpen, Star, Instagram, Twitter, Youtube, Crown } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import ProfileImageUpload from '../components/layout/ProfileImageUpload'; // Import the new component

const Profile = () => {
  const { user, updateProfile, logout, validatePhone } = useAuth();
  const navigate = useNavigate();
  const { balance, fetchPoints } = usePoints();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
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
    }
  });

  const isCoachProfileComplete = () => {
    if (user?.role !== 'coach') return true; // Non-coaches are always considered complete
    return Boolean(
      profileData.profileImage?.trim() &&
      profileData.bio?.trim() &&
      Object.values(profileData.socialLinks).some(link => link?.trim())
    );
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const profileResponse = await api.get('/auth/profile');
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
          }
        });
        
        fetchPoints();

        if (user?.role === 'coach' && !isCoachProfileComplete()) {
          toast.warning('Your profile is incomplete. Your name will not be shown until all fields are filled.');
        }
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          setUser(null);
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
  }, [user, fetchPoints]);

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
      toast.success('Profile updated successfully!');

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

  // Handle successful image upload
  const handleImageUploadSuccess = (imageUrl) => {
    setProfileData((prev) => ({
      ...prev,
      profileImage: imageUrl,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <User className="w-8 h-8 mr-2" />
            My Profile
          </h1>
          <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg">
            <Coins className="w-6 h-6 text-blue-600" />
            <span className="text-lg font-semibold text-blue-600">{balance} points</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">First Name</label>
                      <Input
                        value={profileData.firstName}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          firstName: e.target.value
                        }))}
                        disabled={!editing}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Last Name</label>
                      <Input
                        value={profileData.lastName}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          lastName: e.target.value
                        }))}
                        disabled={!editing}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        email: e.target.value
                      }))}
                      disabled={true}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        phone: e.target.value
                      }))}
                      disabled={!editing}
                      className="w-full"
                    />
                  </div>

                  { (user?.user?.role === 'coach' || user?.role === 'coach') && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center">
                          <Image className="w-4 h-4 mr-2" />
                          Profile Image
                        </label>
                        <ProfileImageUpload
                          currentImage={profileData.profileImage} // Pass the current image URL
                          onUploadSuccess={handleImageUploadSuccess}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Bio
                        </label>
                        <Input
                          value={profileData.bio}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            bio: e.target.value
                          }))}
                          disabled={!editing}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center">
                          <Star className="w-4 h-4 mr-2" />
                          Rating
                        </label>
                        <Input
                          type="number"
                          value={profileData.rating}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            rating: e.target.value
                          }))}
                          disabled={!editing}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Social Links</label>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Instagram className="w-4 h-4 mr-2" />
                            <Input
                              value={profileData.socialLinks.instagram}
                              onChange={(e) => setProfileData(prev => ({
                                ...prev,
                                socialLinks: {
                                  ...prev.socialLinks,
                                  instagram: e.target.value
                                }
                              }))}
                              disabled={!editing}
                              className="w-full"
                              placeholder="Instagram URL"
                            />
                          </div>
                          <div className="flex items-center">
                            <Twitter className="w-4 h-4 mr-2" />
                            <Input
                              value={profileData.socialLinks.twitter}
                              onChange={(e) => setProfileData(prev => ({
                                ...prev,
                                socialLinks: {
                                  ...prev.socialLinks,
                                  twitter: e.target.value
                                }
                              }))}
                              disabled={!editing}
                              className="w-full"
                              placeholder="Twitter URL"
                            />
                          </div>
                          <div className="flex items-center">
                            <Youtube className="w-4 h-4 mr-2" />
                            <Input
                              value={profileData.socialLinks.youtube}
                              onChange={(e) => setProfileData(prev => ({
                                ...prev,
                                socialLinks: {
                                  ...prev.socialLinks,
                                  youtube: e.target.value
                                }
                              }))}
                              disabled={!editing}
                              className="w-full"
                              placeholder="YouTube URL"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end space-x-4 pt-4">
                    {editing ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditing(false)}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                        >
                          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => setEditing(true)}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            { (user?.user?.role !== 'coach' && user?.role !== 'coach') && (
            <Card className="mt-6">
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
                      <p className="text-gray-600 mb-4">
                        Unlock exclusive features with our coaching plans:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Personalized workout plans</li>
                          <li>Nutrition guidance</li>
                          <li>Expert coaching support</li>
                          <li>Premium features access</li>
                        </ul>
                      </p>
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
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/orders')}
                  >
                    <Package className="w-5 h-5 mr-2" />
                    My Orders
                  </Button>

                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;