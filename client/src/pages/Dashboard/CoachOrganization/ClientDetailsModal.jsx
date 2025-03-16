import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const ClientDetailsModal = ({ client, onClose, onSave, onOpenWork }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
  >
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0.9 }}
      className="bg-white rounded-xl p-6 max-w-lg w-full shadow-lg"
    >
      <h2 className="text-2xl font-bold mb-4">
        {client.firstName} {client.lastName || client.email}
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Workouts Completed</label>
          <input
            name="workoutsCompleted"
            type="number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            defaultValue={client.stats.workoutsCompleted}
          />
        </div>
        {/* Add other input fields here */}
      </div>
      <div className="flex justify-end space-x-4 mt-6">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onSave}>Save Changes</Button>
        <Button variant="primary" onClick={onOpenWork}>
          Open Client Work
        </Button>
      </div>
    </motion.div>
  </motion.div>
);

export default ClientDetailsModal;