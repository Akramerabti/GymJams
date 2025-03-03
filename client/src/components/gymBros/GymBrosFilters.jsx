// client/src/components/gymBros/GymBrosFilters.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sliders, Users, MapPin, Calendar } from 'lucide-react';

const workoutTypes = [
  'Strength Training', 'Cardio', 'HIIT', 'CrossFit', 'Bodybuilding',
  'Yoga', 'Pilates', 'Calisthenics', 'Powerlifting', 'Olympic Lifting',
  'Functional Training', 'Group Classes'
];

const experienceLevels = ['Beginner', 'Intermediate', 'Advanced', 'Any'];
const timePreferences = ['Morning', 'Afternoon', 'Evening', 'Late Night', 'Weekends Only', 'Flexible', 'Any'];
const genderPreferences = ['Male', 'Female', 'Other', 'All'];

const GymBrosFilters = ({ isOpen, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [distanceUnit, setDistanceUnit] = useState('miles');

  // Convert miles to km or vice versa
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

  const handleAgeRangeChange = (bound, value) => {
    setLocalFilters(prev => ({
      ...prev,
      ageRange: {
        ...prev.ageRange,
        [bound]: parseInt(value)
      }
    }));
  };

  const handleApply = () => {
    console.log('Filter settings applied:', localFilters);
    
    // If using km, convert back to miles for API
    let finalFilters = {...localFilters};
    if (distanceUnit === 'km') {
      finalFilters.maxDistance = Math.round(finalFilters.maxDistance * 0.621371);
    }
    
    onApply(finalFilters);
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
        className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
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
          
          {/* Age Range Slider */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Age Range</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-500">Minimum Age</span>
                  <span className="text-xs font-medium">{localFilters.ageRange?.min || 18}</span>
                </div>
                <input 
                  type="range" 
                  min="18" 
                  max="99" 
                  step="1"
                  value={localFilters.ageRange?.min || 18} 
                  onChange={(e) => handleAgeRangeChange('min', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-500">Maximum Age</span>
                  <span className="text-xs font-medium">{localFilters.ageRange?.max || 99}</span>
                </div>
                <input 
                  type="range" 
                  min="18" 
                  max="99" 
                  step="1"
                  value={localFilters.ageRange?.max || 99} 
                  onChange={(e) => handleAgeRangeChange('max', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="px-2 py-1 bg-gray-50 rounded-lg text-sm text-gray-600 text-center">
                Looking for ages {localFilters.ageRange?.min || 18} to {localFilters.ageRange?.max || 99}
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
              value={localFilters.maxDistance || (distanceUnit === 'km' ? 80 : 50)} 
              onChange={(e) => handleFilterChange('maxDistance', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{distanceUnit === 'km' ? '5 km' : '3 miles'}</span>
              <span>{localFilters.maxDistance || (distanceUnit === 'km' ? 80 : 50)} {distanceUnit}</span>
              <span>{distanceUnit === 'km' ? '160 km' : '100 miles'}</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3 mt-6">
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
      </motion.div>
    </motion.div>
  );
};

export default GymBrosFilters;