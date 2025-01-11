import React, { useState, useEffect } from 'react';
import { useAuth } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { usePoints } from '../hooks/usePoints';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { User, Package, LogOut, Loader2, Coins, Crown, Settings } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

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
  });

  const fetchSubscriptionDetails = async () => {
    try {
      const response = await api.get('/subscription/current');
      if (response.data) {
        setSubscriptionDetails(response.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('No active subscription found');
      } else {
        console.error('Error fetching subscription details:', error);
        toast.error('Failed to load subscription details');
      }
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [profileResponse, subscriptionResponse] = await Promise.all([
          api.get('/auth/profile'),
          api.get('/subscription/current')
        ]);
  
        const userData = profileResponse.data;
        setProfileData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
        });
  
        if (subscriptionResponse.data) {
          console.log('Subscription Details:', subscriptionResponse.data); // Debugging
          setSubscriptionDetails(subscriptionResponse.data);
        }
  
        fetchPoints();
        
      } catch (error) {
        if (error.response?.status === 404 && error.response?.config.url.includes('/subscription/current')) {
          console.log('No active subscription found');
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
      });

      setEditing(false);
      toast.success('Profile updated successfully!');
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

  const formatSubscriptionType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-50 text-green-700',
      cancelled: 'bg-yellow-50 text-yellow-700',
      expired: 'bg-red-50 text-red-700'
    };
    return colors[status] || 'bg-gray-50 text-gray-700';
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