import React from 'react';
import { motion } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';

const GymBrosMatches = ({ isOpen, onClose, matches }) => {
  if (!isOpen) return null;

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
          <h2 className="text-xl font-bold">Your Matches</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          {matches.length > 0 ? (
            matches.map(match => (
              <div key={match._id} className="flex items-center space-x-4">
                <img 
                  src={match.profileImage || "/api/placeholder/100/100"} 
                  alt={match.name} 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-medium">{match.name}, {match.age}</h3>
                  <p className="text-sm text-gray-500">{match.bio}</p>
                </div>
                <button className="ml-auto p-2 hover:bg-gray-100 rounded-full">
                  <MessageCircle size={20} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No matches yet. Keep swiping!</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GymBrosMatches;