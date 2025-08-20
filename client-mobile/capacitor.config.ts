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
      backgroundColor: "#1f2937", // Match your app's theme
      showSpinner: false
    },
    StatusBar: {
      style: 'dark'
    }
  }
};

export default config;