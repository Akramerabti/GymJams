import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const workoutTypes = [
  'Strength Training', 'Cardio', 'HIIT', 'CrossFit', 'Bodybuilding',
  'Yoga', 'Pilates', 'Calisthenics', 'Powerlifting', 'Olympic Lifting',
  'Functional Training', 'Group Classes'
];

const experienceLevels = ['Beginner', 'Intermediate', 'Advanced'];
const timePreferences = ['Morning', 'Afternoon', 'Evening', 'Late Night', 'Weekends Only', 'Flexible'];

const GymBrosFilters = ({ isOpen, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  if (!isOpen) return null;

  const handleFilterChange = (type, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg w-full max-w-md p-6"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Filters</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-2">Workout Types</h3>
            <div className="flex flex-wrap gap-2">
              {workoutTypes.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleFilterChange('workoutTypes', type)}
                  className={`px-3 py-2 rounded-full text-sm ${
                    localFilters.workoutTypes.includes(type)
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-2">Experience Level</h3>
            <div className="flex gap-2">
              {experienceLevels.map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleFilterChange('experienceLevel', level)}
                  className={`px-4 py-2 rounded-lg text-sm flex-1 ${
                    localFilters.experienceLevel === level
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-2">Preferred Time</h3>
            <div className="grid grid-cols-2 gap-2">
              {timePreferences.map(time => (
                <button
                  key={time}
                  type="button"
                  onClick={() => handleFilterChange('preferredTime', time)}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    localFilters.preferredTime === time
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-2">Max Distance (miles)</h3>
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={localFilters.maxDistance} 
              onChange={(e) => handleFilterChange('maxDistance', e.target.value)}
              className="w-full"
            />
            <span className="text-sm text-gray-500">{localFilters.maxDistance} miles</span>
          </div>
        </div>
        
        <button 
          onClick={handleApply}
          className="w-full bg-primary text-white px-4 py-2 rounded-lg mt-6"
        >
          Apply Filters
        </button>
      </motion.div>
    </motion.div>
  );
};

export default GymBrosFilters;