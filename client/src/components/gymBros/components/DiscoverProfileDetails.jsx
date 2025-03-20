import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Share2, ChevronLeft, ChevronRight, MapPin, Award, Calendar } from 'lucide-react';

const ProfileDetailModal = ({ profile, isVisible, onClose, currentImageIndex, setCurrentImageIndex }) => {
  if (!profile) return null;
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white w-full max-w-md h-[90vh] rounded-2xl overflow-hidden relative flex flex-col"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
          >
            <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between">
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white"
              >
                <ArrowLeft size={20} />
              </button>
              
              <div className="flex gap-2">
                <button className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white">
                  <Share2 size={20} />
                </button>
              </div>
            </div>
            
            <div className="relative h-[60%] bg-gray-100">
              <img 
                src={profile.images?.[currentImageIndex] || profile.profileImage || "/api/placeholder/400/600"}
                alt={profile.name} 
                className="w-full h-full object-cover"
              />
              
              <div className="absolute top-2 left-0 right-0 flex justify-center gap-1 px-2">
                {(profile.images || [profile.profileImage]).map((_, index) => (
                  <div 
                    key={index}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      index === currentImageIndex 
                        ? 'bg-white w-6' 
                        : 'bg-white/40 w-2'
                    }`}
                  />
                ))}
              </div>
              
              {(profile.images?.length > 1 || (profile.images?.length === 0 && profile.profileImage)) && (
                <>
                  <button 
                    onClick={() => currentImageIndex > 0 && setCurrentImageIndex(currentImageIndex - 1)}
                    className={`absolute top-1/2 left-2 transform -translate-y-1/2 p-2 rounded-full bg-white/30 backdrop-blur-sm text-white ${
                      currentImageIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
                    }`}
                    disabled={currentImageIndex === 0}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={() => {
                      const maxIndex = profile.images?.length ? profile.images.length - 1 : 0;
                      currentImageIndex < maxIndex && setCurrentImageIndex(currentImageIndex + 1);
                    }}
                    className={`absolute top-1/2 right-2 transform -translate-y-1/2 p-2 rounded-full bg-white/30 backdrop-blur-sm text-white ${
                      currentImageIndex === (profile.images?.length || 1) - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
                    }`}
                    disabled={currentImageIndex === (profile.images?.length || 1) - 1}
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4">
                <h2 className="text-2xl font-bold flex items-center">
                  {profile.name}, {profile.age}
                  {profile.verified && <div className="ml-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">✓</div>}
                </h2>
                
                <div className="flex items-center mt-1 text-gray-600">
                  <MapPin size={16} className="mr-1" />
                  <span>{profile.location?.distance || 0} miles away</span>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1">About</h3>
                <p className="text-gray-700">
                  {profile.bio || 'No bio provided'}
                </p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1">Workout Types</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.workoutTypes?.map(type => (
                    <span key={type} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {type}
                    </span>
                  ))}
                  {(!profile.workoutTypes || profile.workoutTypes.length === 0) && (
                    <span className="text-gray-500 text-sm">No workout types specified</span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Experience</h3>
                  <div className="flex items-center text-gray-700">
                    <Award size={16} className="mr-1 text-blue-500" />
                    <span>{profile.experienceLevel || 'Not specified'}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-1">Schedule</h3>
                  <div className="flex items-center text-gray-700">
                    <Calendar size={16} className="mr-1 text-blue-500" />
                    <span>{profile.preferredTime || 'Not specified'}</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1">Goals</h3>
                <p className="text-gray-700">
                  {profile.goals || 'No goals specified'}
                </p>
              </div>
              
              {profile.interests && profile.interests.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-1">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map(interest => (
                      <span key={interest} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileDetailModal;