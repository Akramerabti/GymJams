import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { User, Package, CreditCard, LogOut } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(profileData);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
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
        <h1 className="text-3xl font-bold mb-8 flex items-center">
          <User className="w-8 h-8 mr-2" />
          My Profile
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        firstName: e.target.value
                      }))}
                      disabled={!editing}
                    />
                    <Input
                      label="Last Name"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        lastName: e.target.value
                      }))}
                      disabled={!editing}
                    />
                  </div>

                  <Input
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      email: e.target.value
                    }))}
                    disabled={!editing}
                  />

                  <Input
                    label="Phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      phone: e.target.value
                    }))}
                    disabled={!editing}
                  />

                  <div className="flex justify-end space-x-4">
                    {editing ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditing(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                        >
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

          {/* Quick Actions */}
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
        </div>

        {/* Order History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Order history table or list would go here */}
            <div className="text-center text-gray-500 py-8">
              No recent orders found.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;