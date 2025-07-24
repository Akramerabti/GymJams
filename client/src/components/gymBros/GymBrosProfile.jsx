import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Dumbbell, Award } from 'lucide-react';

const GymBrosProfile = ({ profile, onLike, onDislike }) => {
  return (
    <motion.div 
      className="bg-white rounded-xl overflow-hidden shadow-lg max-w-md w-full"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
    >
      <div className="relative">
        <img 
          src={profile.profileImage || "/api/placeholder/400/300"} 
          alt={profile.name} 
          className="w-full h-64 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <h2 className="text-2xl font-bold text-white">{profile.name}, {profile.age}</h2>
          <div className="flex items-center text-white">
            <MapPin size={16} className="mr-1" />
            <span className="text-sm">{profile.location.distance} miles away</span>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-1">ABOUT ME</h3>
          <p className="text-sm">{profile.bio}</p>
        </div>
        
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-1">WORKOUT PREFERENCES</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            {profile.workoutTypes.map(type => (
              <span 
                key={type} 
                className="bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-full text-xs"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">EXPERIENCE</h3>
            <div className="flex items-center">
              <Award size={16} className="mr-1 text-gray-500" />
              <span className="text-sm">{profile.experienceLevel}</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">SCHEDULE</h3>
            <div className="flex items-center">
              <Calendar size={16} className="mr-1 text-gray-500" />
              <span className="text-sm">{profile.preferredTime}</span>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-1">GOALS</h3>
          <p className="text-sm">{profile.goals}</p>
        </div>
        
        {/* Action buttons */}
        {onLike && onDislike && (
          <div className="flex justify-center space-x-4 mt-4">
            <button 
              onClick={onDislike}
              className="bg-white border border-gray-300 rounded-full p-3 shadow hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <button 
              onClick={onLike}
              className="bg-white border border-gray-300 rounded-full p-3 shadow hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GymBrosProfile;