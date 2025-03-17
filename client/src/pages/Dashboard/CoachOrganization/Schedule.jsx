import React from 'react';
import { motion } from 'framer-motion';
import { Clock, VideoIcon, User, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Schedule = ({ sessions, onEditSession, onDeleteSession, onStartSession }) => {
  // Animation variants for list items
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: i => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    }),
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="space-y-4">
      {sessions.length > 0 ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { 
              transition: { staggerChildren: 0.1 } 
            }
          }}
          className="space-y-4"
        >
          {sessions.map((session, index) => (
            <motion.div
              key={session.id}
              custom={index}
              variants={itemVariants}
              whileHover="hover"
              className="p-4 bg-white rounded-lg shadow-sm border border-gray-100"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-3 md:mb-0">
                  <h3 className="font-medium text-gray-800">{session.clientName}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{session.time}</span>
                    <span className="mx-2">•</span>
                    <span>{session.duration}</span>
                  </div>
                  {session.type && (
                    <div className="mt-2">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                        {session.type}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {onStartSession && (
                    <Button
                      onClick={() => onStartSession(session)}
                      className="bg-green-500 hover:bg-green-600 text-white"
                      size="sm"
                    >
                      <VideoIcon className="w-4 h-4 mr-1" />
                      Start
                    </Button>
                  )}
                  
                  {onEditSession && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditSession(session)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {onDeleteSession && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => onDeleteSession(session)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500">No sessions scheduled</p>
        </div>
      )}
    </div>
  );
};

export default Schedule;