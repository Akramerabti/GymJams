import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.akram.gymtonic',
  appName: 'GymTonic',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1f2937",
      showSpinner: false
    },
    StatusBar: {
      style: 'dark'
    },
    // Location plugin configuration
    Geolocation: {
      // Request permissions on plugin load
      requestPermissions: true,
      // Enable high accuracy by default
      enableHighAccuracy: true
    },
    // Camera plugin configuration
    Camera: {
      // Request permissions on plugin load
      requestPermissions: true,
      // Enable selection from gallery
      allowGallerySelection: true,
      // Default camera quality
      quality: 90
    },
    // Filesystem plugin configuration
    Filesystem: {
      // Request permissions on plugin load  
      requestPermissions: true
    },
    // Preferences for secure storage
    Preferences: {
      // Use secure storage when available
      secure: true
    }
  }
};

export default config;