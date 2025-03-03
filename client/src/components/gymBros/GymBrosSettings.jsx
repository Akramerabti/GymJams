import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Sliders, Globe, Bell, Eye, Shield, LogOut, Trash2 } from 'lucide-react';
import { Switch } from '../ui/Switch';
import  Slider from '../ui/Slider';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import api from '../../services/api';

const GymBrosSettings = ({ isOpen, onClose, userProfile, onProfileUpdated }) => {
  const [settings, setSettings] = useState({
    maxDistance: 50,
    ageRange: [18, 60],
    showMe: true,
    notifications: {
      matches: true,
      messages: true,
      profileUpdates: true
    },
    // Privacy settings
    showWorkoutTypes: true,
    showExperienceLevel: true,
    showGoals: true,
    profileVisibility: 'everyone', // 'everyone', 'matches', 'nobody'
  });
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen && userProfile) {
      // Load user settings from profile
      setSettings(prev => ({
        ...prev,
        ...(userProfile.settings || {}),
      }));
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  const handleSettingChange = (path, value) => {
    if (path.includes('.')) {
      const [parent, child] = path.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [path]: value
      }));
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const response = await api.put('/gym-bros/settings', settings);
      toast.success('Settings updated successfully');
      if (onProfileUpdated) {
        onProfileUpdated(response.data);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setLoading(true);
    try {
      await api.delete('/gym-bros/profile');
      toast.success('Profile deleted successfully');
      window.location.reload(); // Refresh to show setup again
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Failed to delete profile');
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  const resetConfirmDelete = () => {
    if (confirmDelete) {
      setConfirmDelete(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={resetConfirmDelete}
    >
      <motion.div
        className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Settings</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Discovery Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Globe className="mr-2 h-5 w-5 text-blue-500" />
              Discovery
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Show Me on GymBros</p>
                  <p className="text-sm text-gray-500">Toggle off to hide your profile</p>
                </div>
                <Switch 
                  checked={settings.showMe} 
                  onCheckedChange={(value) => handleSettingChange('showMe', value)}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <p className="font-medium">Maximum Distance</p>
                  <p className="text-sm font-semibold">{settings.maxDistance} miles</p>
                </div>
                <Slider
                  value={[settings.maxDistance]}
                  min={1}
                  max={100}
                  step={1}
                  onValueChange={(value) => handleSettingChange('maxDistance', value[0])}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <p className="font-medium">Age Range</p>
                  <p className="text-sm font-semibold">{settings.ageRange[0]}-{settings.ageRange[1]}</p>
                </div>
                <Slider
                  value={settings.ageRange}
                  min={18}
                  max={99}
                  step={1}
                  onValueChange={(value) => handleSettingChange('ageRange', value)}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
          
          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Bell className="mr-2 h-5 w-5 text-blue-500" />
              Notifications
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="font-medium">New Matches</p>
                <Switch 
                  checked={settings.notifications.matches} 
                  onCheckedChange={(value) => handleSettingChange('notifications.matches', value)}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <p className="font-medium">Messages</p>
                <Switch 
                  checked={settings.notifications.messages} 
                  onCheckedChange={(value) => handleSettingChange('notifications.messages', value)}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <p className="font-medium">Profile Updates</p>
                <Switch 
                  checked={settings.notifications.profileUpdates} 
                  onCheckedChange={(value) => handleSettingChange('notifications.profileUpdates', value)}
                />
              </div>
            </div>
          </div>
          
          {/* Privacy Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Shield className="mr-2 h-5 w-5 text-blue-500" />
              Privacy
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="font-medium">Show Workout Types</p>
                <Switch 
                  checked={settings.showWorkoutTypes} 
                  onCheckedChange={(value) => handleSettingChange('showWorkoutTypes', value)}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <p className="font-medium">Show Experience Level</p>
                <Switch 
                  checked={settings.showExperienceLevel} 
                  onCheckedChange={(value) => handleSettingChange('showExperienceLevel', value)}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <p className="font-medium">Show Fitness Goals</p>
                <Switch 
                  checked={settings.showGoals} 
                  onCheckedChange={(value) => handleSettingChange('showGoals', value)}
                />
              </div>
              
              <div>
                <p className="font-medium mb-2">Profile Visibility</p>
                <div className="space-y-2">
                  {['everyone', 'matches', 'nobody'].map((option) => (
                    <div 
                      key={option}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        settings.profileVisibility === option 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSettingChange('profileVisibility', option)}
                    >
                      <p className="font-medium capitalize">{option}</p>
                      <p className="text-xs text-gray-500">
                        {option === 'everyone' && 'Anyone can see your profile'}
                        {option === 'matches' && 'Only mutual matches can see your profile'}
                        {option === 'nobody' && 'Your profile is hidden from everyone'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Account Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Sliders className="mr-2 h-5 w-5 text-blue-500" />
              Account
            </h3>
            
            <Button 
              onClick={handleDeleteProfile} 
              variant={confirmDelete ? "destructive" : "outline"}
              className="w-full justify-start"
            >
              <Trash2 className="mr-2 h-5 w-5" />
              {confirmDelete ? "Are you sure? Click again to confirm" : "Delete GymBros Profile"}
            </Button>
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-white p-4 border-t">
          <Button 
            onClick={handleSaveSettings}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Settings"}
            <Save className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GymBrosSettings;