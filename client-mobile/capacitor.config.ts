import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.akram.gymtonic',
  appName: 'GymTonic',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // iOS also uses https by default, but you can specify if needed
    iosScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1f2937",
      showSpinner: false,
      // iOS-specific splash screen settings
      launchAutoHide: true,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      // iOS-specific status bar settings
      overlaysWebView: true,
      backgroundColor: '#1f2937'
    },
    // Location plugin configuration
    Geolocation: {
      requestPermissions: true,
      enableHighAccuracy: true
    },
    // Camera plugin configuration
    Camera: {
      requestPermissions: true,
      allowGallerySelection: true,
      quality: 90
    },
    // Filesystem plugin configuration
    Filesystem: {
      requestPermissions: true
    },
    // Preferences for secure storage
    Preferences: {
      secure: true
    },
     PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  },
  // iOS-specific configuration
  ios: {
    // Custom scheme if needed (optional)
    scheme: 'GymTonic',
    // Webview configuration
    webContentsDebuggingEnabled: true, // Enable for development
    // Handle safe area insets
    contentInset: 'automatic'
  }
};

export default config;