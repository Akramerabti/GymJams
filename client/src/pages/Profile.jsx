import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { usePoints } from '../hooks/usePoints';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { User, Package, CreditCard, LogOut, Loader2, Coins } from 'lucide-react';
import { toast } from 'sonner'; // Import Sonner toast

const Profile = () => {
  const { user, updateProfile, logout, validatePhone } = useAuth();
  const navigate = useNavigate();
  const { balance } = usePoints();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Debugging: Log the user object
  useEffect(() => {
    console.log('User:', user);
  }, [user]);

  // Initialize profileData with user data
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.user.firstName || '',
        lastName: user.user.lastName || '',
        email: user.user.email || '',
        phone: user.user.phone || '',
      });
    }
  }, [user]);

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

      // Show success toast
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);

      // Show error toast
      toast.error(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/payment-methods')}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Methods
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