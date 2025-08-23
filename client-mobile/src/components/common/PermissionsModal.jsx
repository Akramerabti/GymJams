import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Camera, Folder, Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const PermissionsModal = ({ isOpen, onRequestPermissions, onSkip, permissions }) => {
  const getPermissionIcon = (type) => {
    switch (type) {
      case 'location':
        return <MapPin className="w-6 h-6" />;
      case 'camera':
        return <Camera className="w-6 h-6" />;
      case 'fileSystem':
        return <Folder className="w-6 h-6" />;
      default:
        return <Shield className="w-6 h-6" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'granted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'denied':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      case 'prompt':
        return 'Required';
      default:
        return 'Unknown';
    }
  };

  const permissionDescriptions = {
    location: {
      title: 'Location Access',
      description: 'Find gyms, trainers, and fitness events near you'
    },
    camera: {
      title: 'Camera Access',
      description: 'Take photos for your profile and share workout progress'
    },
    fileSystem: {
      title: 'File Access',
      description: 'Save and upload photos, documents, and workout data'
    }
  };

  const hasPermissionsToRequest = Object.values(permissions).some(
    perm => perm.status === 'prompt' || (perm.status === 'denied' && !perm.requested)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && onSkip()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                App Permissions
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                GymTonic needs these permissions to provide you with the best experience
              </p>
            </div>

            {/* Permissions List */}
            <div className="p-6 space-y-4">
              {Object.entries(permissions).map(([type, permission]) => {
                const description = permissionDescriptions[type];
                if (!description) return null;

                return (
                  <div
                    key={type}
                    className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-sm">
                      {getPermissionIcon(type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {description.title}
                        </h3>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(permission.status)}
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {getStatusText(permission.status)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        {description.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Benefits Section */}
            <div className="px-6 pb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Why we need these permissions:
                </h4>
                <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
                  <li>• Personalized fitness recommendations based on your location</li>
                  <li>• Easy profile setup and progress sharing</li>
                  <li>• Offline access to your workout data and plans</li>
                  <li>• Enhanced security and data backup</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-0 space-y-3">
              {hasPermissionsToRequest && (
                <button
                  onClick={onRequestPermissions}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  Grant Permissions
                </button>
              )}
              
              <button
                onClick={onSkip}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
              >
                {hasPermissionsToRequest ? 'Skip for Now' : 'Continue'}
              </button>
            </div>

            {/* Footer Note */}
            <div className="px-6 pb-6">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                You can change these permissions later in your device settings. 
                Some features may be limited without the required permissions.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PermissionsModal;