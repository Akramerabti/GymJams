import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, User, MapPin, Calendar, Dumbbell, Award } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const ProfileEditor = ({ isOpen, onClose, userProfile, onProfileUpdated }) => {
  const [profileData, setProfileData] = useState({
    name: '',
    age: '',
    bio: '',
    workoutTypes: [],
    experienceLevel: '',
    preferredTime: '',
    goals: '',
    location: {
      address: '',
    },
  });

  useEffect(() => {
    if (isOpen && userProfile) {
      setProfileData({
        name: userProfile.name || '',
        age: userProfile.age || '',
        bio: userProfile.bio || '',
        workoutTypes: userProfile.workoutTypes || [],
        experienceLevel: userProfile.experienceLevel || '',
        preferredTime: userProfile.preferredTime || '',
        goals: userProfile.goals || '',
        location: {
          address: userProfile.location?.address || '',
        },
      });
    }
  }, [isOpen, userProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleWorkoutTypesChange = (e) => {
    const { value, checked } = e.target;
    setProfileData((prev) => ({
      ...prev,
      workoutTypes: checked
        ? [...prev.workoutTypes, value]
        : prev.workoutTypes.filter((type) => type !== value),
    }));
  };

  const handleSave = async () => {
    try {
      const response = await api.put('/gym-bros/profile', profileData);
      toast.success('Profile updated successfully');
      onProfileUpdated(response.data);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
      >
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input
                type="number"
                name="age"
                value={profileData.age}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                name="bio"
                value={profileData.bio}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Workout Types</label>
              <div className="mt-2 space-y-2">
                {['Weightlifting', 'Cardio', 'Yoga', 'CrossFit', 'Pilates'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      value={type}
                      checked={profileData.workoutTypes.includes(type)}
                      onChange={handleWorkoutTypesChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Experience Level</label>
              <select
                name="experienceLevel"
                value={profileData.experienceLevel}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Preferred Time</label>
              <select
                name="preferredTime"
                value={profileData.preferredTime}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Late Night">Late Night</option>
                <option value="Weekends Only">Weekends Only</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Goals</label>
              <textarea
                name="goals"
                value={profileData.goals}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                name="location.address"
                value={profileData.location.address}
                onChange={(e) =>
                  setProfileData((prev) => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      address: e.target.value,
                    },
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="sticky bottom-0 bg-white p-4 border-t">
            <button
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Save Changes
              <Save className="ml-2 h-4 w-4 inline-block" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfileEditor;