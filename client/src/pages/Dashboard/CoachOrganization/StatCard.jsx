import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, trend, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.05 }}
    transition={{ type: 'spring', stiffness: 300 }}
    className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-white/20 rounded-lg">
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <div className="flex items-center space-x-1">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm">{trend}</span>
        </div>
      )}
    </div>
    <h3 className="text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold">{value}</p>
  </motion.div>
);

export default StatCard;