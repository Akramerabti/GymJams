// src/components/common/LocationRequiredModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, AlertTriangle, Navigation, Settings, RefreshCw } from 'lucide-react';

const LocationRequiredModal = ({ 
  isOpen, 
  onRequestLocation, 
  onClose, 
  permissionStatus,
  isRequesting = false 
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const getModalContent = () => {
    switch (permissionStatus) {
      case 'denied':
        return {
          icon: <AlertTriangle className="w-16 h-16 text-red-500" />,
          title: "Location Access Required",
          description: "GymBros Map needs location access to show you nearby gyms, trainers, and workout partners. Please enable location in your browser settings.",
          primaryAction: "Open Settings",
          primaryHandler: () => setShowSettings(true),
          secondaryAction: "Try Again",
          secondaryHandler: onRequestLocation,
          showRetry: true
        };
      
      case 'prompt':
      default:
        return {
          icon: <MapPin className="w-16 h-16 text-blue-500 animate-pulse" />,
          title: "Find Nearby Gym Partners",
          description: "Share your location to discover the best gyms, trainers, and workout partners in your area. We only show your city, never your exact location.",
          primaryAction: isRequesting ? "Getting Location..." : "Allow Location",
          primaryHandler: onRequestLocation,
          secondaryAction: "Not Now",
          secondaryHandler: onClose,
          showRetry: false
        };
    }
  };

  const content = getModalContent();

  const openDeviceSettings = () => {
    const userAgent = navigator.userAgent;
    let instructions = "Please enable location access in your browser settings.";
    
    if (userAgent.includes('Chrome')) {
      instructions = "Click the location icon in your address bar, or go to Chrome Settings > Privacy and Security > Site Settings > Location";
    } else if (userAgent.includes('Firefox')) {
      instructions = "Click the shield icon in your address bar, or go to Firefox Settings > Privacy & Security > Permissions > Location";
    } else if (userAgent.includes('Safari')) {
      instructions = "Go to Safari > Settings > Websites > Location, or check your device's Privacy settings";
    }
    
    alert(instructions);
    setShowSettings(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full"
          >
            {/* Header */}
            <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-center mb-4">
                {content.icon}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {content.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {content.description}
              </p>
            </div>

            {/* Features Section */}
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Find nearby gyms and fitness centers</span>
                </div>
                
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Connect with local workout partners</span>
                </div>
                
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Get personalized recommendations</span>
                </div>
              </div>

              {/* Privacy Note */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200 text-center">
                  🔒 Your privacy is protected. We never share your exact coordinates - only your city is visible to others.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-0 space-y-3">
              <button
                onClick={content.primaryHandler}
                disabled={isRequesting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isRequesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Getting Location...</span>
                  </>
                ) : permissionStatus === 'denied' ? (
                  <>
                    <Settings className="w-4 h-4" />
                    <span>{content.primaryAction}</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    <span>{content.primaryAction}</span>
                  </>
                )}
              </button>
              
              {content.showRetry && (
                <button
                  onClick={content.secondaryHandler}
                  className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
                >
                  {content.secondaryAction}
                </button>
              )}

              {!content.showRetry && (
                <button
                  onClick={content.secondaryHandler}
                  className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium py-2 transition-colors duration-200"
                >
                  {content.secondaryAction}
                </button>
              )}
            </div>
          </motion.div>
          
          {/* Settings Instructions Modal */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/75 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full"
                >
                  <h3 className="text-lg font-semibold mb-3 text-center">Enable Location Access</h3>
                  
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-start space-x-2">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">1.</span>
                      <span>Look for the location icon 📍 in your address bar</span>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">2.</span>
                      <span>Click on it and select "Allow"</span>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">3.</span>
                      <span>Or go to your browser settings → Privacy → Location</span>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">4.</span>
                      <span>Refresh the page after enabling</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={openDeviceSettings}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm"
                    >
                      Got It
                    </button>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-lg text-sm"
                    >
                      Back
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocationRequiredModal;