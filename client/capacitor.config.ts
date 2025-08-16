import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gymtonic.app',
  appName: 'GymTonic',
  webDir: 'dist', // This should match your Vite build output
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1f2937", // Match your app's theme
      showSpinner: false
    },
    StatusBar: {
      style: 'dark'
    }
  }
};

export default config;