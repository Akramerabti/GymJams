import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sliders, Users, MapPin, Calendar } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import RangeSlider from '../ui/RangeSlider';

const workoutTypes = [
  'Strength Training', 'Cardio', 'HIIT', 'CrossFit', 'Bodybuilding',
  'Yoga', 'Pilates', 'Calisthenics', 'Powerlifting', 'Olympic Lifting',
  'Functional Training', 'Group Classes'
];

const experienceLevels = ['Beginner', 'Intermediate', 'Advanced', 'Any'];
const timePreferences = ['Morning', 'Afternoon', 'Evening', 'Late Night', 'Weekends Only', 'Flexible', 'Any'];
const genderPreferences = ['Male', 'Female', 'Other', 'All'];

// Normalize preferences to ensure consistency
const normalizePreferences = (preferences = {}) => {
  return {
    workoutTypes: preferences.workoutTypes || [],
    experienceLevel: preferences.experienceLevel || 'Any',
    preferredTime: preferences.preferredTime || 'Any',
    genderPreference: preferences.genderPreference || 'All',
    ageRange: preferences.ageRange || { min: 18, max: 99 },
    maxDistance: preferences.maxDistance || 50
  };
};

const GymBrosFilters = ({ isOpen, onClose, onApply }) => {
  const [loading, setLoading] = useState(true);
  const [localFilters, setLocalFilters] = useState({
    workoutTypes: [],
    experienceLevel: 'Any',
    preferredTime: 'Any',
    genderPreference: 'All',
    ageRange: { min: 18, max: 99 },
    maxDistance: 50
  });
  
  const [distanceUnit, setDistanceUnit] = useState('miles');

  // Fetch user preferences when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUserPreferences();
    }
  }, [isOpen]);

  // Fetch user's current filter preferences
  const fetchUserPreferences = async () => {
    setLoading(true);
    try {
      // First try to get user preferences
      const response = await api.get('/gym-bros/preferences');
      if (response.data) {
        setLocalFilters(normalizePreferences(response.data));
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      try {
        // If preferences endpoint fails, try settings endpoint
        const settingsResponse = await api.get('/gym-bros/settings');
        if (settingsResponse.data) {
          const { maxDistance, ageRange } = settingsResponse.data;
          setLocalFilters(prev => ({
            ...prev,
            maxDistance: maxDistance || prev.maxDistance,
            ageRange: ageRange || prev.ageRange
          }));
        }
      } catch (settingsError) {
        console.error('Error fetching settings:', settingsError);
        toast.error('Failed to load your preferences');
      }
    } finally {
      setLoading(false);
    }
  };

  // Convert distance units when switching between miles and km
  useEffect(() => {
    if (distanceUnit === 'km' && localFilters.maxDistance) {
      // Convert miles to kilometers (1 mile ≈ 1.60934 km)
      setLocalFilters(prev => ({
        ...prev,
        maxDistance: Math.round(prev.maxDistance * 1.60934)
      }));
    } else if (distanceUnit === 'miles' && localFilters.maxDistance) {
      // Convert kilometers to miles (1 km ≈ 0.621371 miles)
      setLocalFilters(prev => ({
        ...prev,
        maxDistance: Math.round(prev.maxDistance * 0.621371)
      }));
    }
  }, [distanceUnit]);

  if (!isOpen) return null;

  const handleFilterChange = (type, value) => {
    if (type === 'workoutTypes') {
      // Toggle workout type
      const updatedWorkoutTypes = localFilters.workoutTypes.includes(value)
        ? localFilters.workoutTypes.filter(t => t !== value)
        : [...localFilters.workoutTypes, value];
      
      setLocalFilters(prev => ({
        ...prev,
        workoutTypes: updatedWorkoutTypes
      }));
    } else {
      // Handle other filters
      setLocalFilters(prev => ({
        ...prev,
        [type]: value
      }));
    }
  };

  const handleAgeRangeChange = (range) => {
    setLocalFilters(prev => ({
      ...prev,
      ageRange: range
    }));
  };

  const handleApply = async () => {
    // If using km, convert back to miles for API
    let finalFilters = {...localFilters};
    if (distanceUnit === 'km') {
      finalFilters.maxDistance = Math.round(finalFilters.maxDistance * 0.621371);
    }
    
    // Try to save preferences to server
    try {
      await api.put('/gym-bros/preferences', finalFilters);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      // Continue even if save fails - don't block the user
    }
    
    onApply(finalFilters);
    onClose(); // Close the filter modal after applying
  };

  const handleReset = () => {
    const resetFilters = {
      workoutTypes: [],
      experienceLevel: 'Any',
      preferredTime: 'Any',
      genderPreference: 'All',
      ageRange: { min: 18, max: 99 },
      maxDistance: distanceUnit === 'km' ? 80 : 50 // ~50 miles in km
    };
    setLocalFilters(resetFilters);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg w-full max-w-md max-h-[100vh] overflow-y-auto"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 flex justify-between items-center p-4 z-10">
          <h2 className="text-xl font-bold flex items-center">
            <Sliders size={20} className="mr-2" />
            Filters
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading your preferences...</p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Gender Preference */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center">
                <Users size={16} className="mr-1" />
                I'm looking for
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {genderPreferences.map(gender => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => handleFilterChange('genderPreference', gender)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      localFilters.genderPreference === gender
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Age Range Slider - Custom Component */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold">Age Range</h3>
                <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
                  {localFilters.ageRange.min} - {localFilters.ageRange.max}
                </span>
              </div>
              
              <div className="px-2 mb-6">
                <RangeSlider 
                  min={18}
                  max={99}
                  minValue={localFilters.ageRange.min}
                  maxValue={localFilters.ageRange.max}
                  step={1}
                  onChange={handleAgeRangeChange}
                  trackColor="bg-blue-600"
                  thumbColor="bg-white border-blue-600"
                />
                
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>18</span>
                  <span>40</span>
                  <span>60</span>
                  <span>80</span>
                  <span>99</span>
                </div>
              </div>
              
          
            </div>
            
            {/* Workout Types */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Workout Types</h3>
              <div className="flex flex-wrap gap-2">
                {workoutTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleFilterChange('workoutTypes', type)}
                    className={`px-3 py-2 rounded-full text-sm ${
                      (localFilters.workoutTypes || []).includes(type)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Experience Level */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Experience Level</h3>
              <div className="flex flex-wrap gap-2">
                {experienceLevels.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleFilterChange('experienceLevel', level)}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      localFilters.experienceLevel === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Preferred Time */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center">
                <Calendar size={16} className="mr-1" />
                Preferred Workout Time
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {timePreferences.map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleFilterChange('preferredTime', time)}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      localFilters.preferredTime === time
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Max Distance with unit toggle */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold flex items-center">
                  <MapPin size={16} className="mr-1" />
                  Maximum Distance
                </h3>
                
                <div className="flex rounded-lg overflow-hidden border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setDistanceUnit('miles')}
                    className={`px-3 py-1 text-xs ${
                      distanceUnit === 'miles'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700'
                    }`}
                  >
                    Miles
                  </button>
                  <button
                    type="button"
                    onClick={() => setDistanceUnit('km')}
                    className={`px-3 py-1 text-xs ${
                      distanceUnit === 'km'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700'
                    }`}
                  >
                    Km
                  </button>
                </div>
              </div>
              
              <input 
                type="range" 
                min={distanceUnit === 'km' ? 5 : 3}
                max={distanceUnit === 'km' ? 160 : 100}
                step={distanceUnit === 'km' ? 5 : 3}
                value={localFilters.maxDistance} 
                onChange={(e) => handleFilterChange('maxDistance', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{distanceUnit === 'km' ? '5 km' : '3 miles'}</span>
                <span>{localFilters.maxDistance} {distanceUnit}</span>
                <span>{distanceUnit === 'km' ? '160 km' : '100 miles'}</span>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-3 mt-6 pb-4">
              <button 
                onClick={handleReset}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Reset All
              </button>
              <button 
                onClick={handleApply}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default GymBrosFilters;