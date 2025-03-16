import { motion } from 'framer-motion';
import { Users, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ClientList = ({ clients, onClientClick, onChatClick }) => (
  <motion.div
    className="space-y-4"
    initial="hidden"
    animate="visible"
    variants={{
      visible: { transition: { staggerChildren: 0.1 } },
      hidden: {},
    }}
  >
    {clients.map((client) => (
      <motion.div
        key={client.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md"
        onClick={() => onClientClick(client)}
      >
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-700">
              {client.firstName} {client.lastName || client.email}
            </p>
            <p className="text-sm text-gray-500">Last active: {client.lastActive}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onChatClick(client);
            }}
            className="relative"
          >
            <MessageSquare className="h-5 w-5" />
            {client.unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {client.unreadMessages}
              </span>
            )}
          </Button>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </div>
      </motion.div>
    ))}
  </motion.div>
);

export default ClientList;