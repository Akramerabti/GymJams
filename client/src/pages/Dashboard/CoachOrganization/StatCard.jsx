import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm p-3 text-white cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className="p-1.5 bg-white/20 rounded-md mr-3">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div>
          <p className="text-xs font-medium opacity-90 mb-0.5">{title}</p>
          <p className="text-lg sm:text-xl font-bold">{value}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;