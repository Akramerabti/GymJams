import { motion } from 'framer-motion';

const Schedule = ({ sessions }) => (
  <div className="space-y-4">
    {sessions.map((session) => (
      <motion.div
        key={session.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="p-4 bg-white rounded-lg shadow-sm"
      >
        <div className="flex justify-between items-start mb-2">
          <p className="font-medium">{session.clientName}</p>
          <span className="text-sm text-gray-500">{session.time}</span>
        </div>
        <p className="text-sm text-gray-600">{session.duration}</p>
      </motion.div>
    ))}
  </div>
);

export default Schedule;