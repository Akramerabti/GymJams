// src/services/notificationService.js
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import api from './api';

class NotificationService {
  constructor() {
    this.fcmToken = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only work on native platforms');
      return false;
    }

    try {
      // Check current permission status
      const permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        // Request permissions
        const result = await PushNotifications.requestPermissions();
        
        if (result.receive !== 'granted') {
          console.log('Push notification permission denied');
          return false;
        }
      } else if (permStatus.receive === 'denied') {
        console.log('Push notification permission denied');
        return false;
      }

      // Register with FCM
      await PushNotifications.register();
      
      // Set up listeners for handling incoming notifications
      this.setupListeners();
      
      this.isInitialized = true;
      console.log('Push notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  setupListeners() {
    // FCM token registration successful
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
      this.fcmToken = token.value;
      
      // Send token to backend for storage
      this.registerTokenWithBackend(token.value);
    });

    // FCM registration failed
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ' + JSON.stringify(notification));
      
      this.showForegroundNotification(notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));

      this.handleNotificationTap(notification.notification.data);
    });
  }

  async registerTokenWithBackend(token) {
    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        console.log('No auth token available, will register token when user logs in');
        // Store token locally for later registration
        localStorage.setItem('pending_fcm_token', token);
        return;
      }

      const response = await api.post('/notifications/register-token', {
        fcmToken: token,
        platform: Capacitor.getPlatform()
      });
      
      if (response.status === 200) {
        console.log('FCM token registered with backend successfully');
        // Clear any pending token since we successfully registered
        localStorage.removeItem('pending_fcm_token');
      }
    } catch (error) {
      console.error('Error registering token with backend:', error);
      // Store token for retry later
      localStorage.setItem('pending_fcm_token', token);
    }
  }

  // Call this when user logs in to register any pending FCM token
  async registerPendingToken() {
    try {
      const pendingToken = localStorage.getItem('pending_fcm_token');
      if (pendingToken && this.isInitialized) {
        await this.registerTokenWithBackend(pendingToken);
      } else if (this.fcmToken && this.isInitialized) {
        await this.registerTokenWithBackend(this.fcmToken);
      }
    } catch (error) {
      console.error('Error registering pending token:', error);
    }
  }

  showForegroundNotification(notification) {
    const { title, body, data } = notification;
    
    // Create appropriate toast based on notification type
    switch (data?.type) {
      case 'match':
        toast.success(title || '🎉 New Match!', {
          description: body,
          duration: 6000,
          action: {
            label: 'View',
            onClick: () => this.navigateToRoute('/gym-bros')
          }
        });
        break;
      
      case 'message':
        toast.info(title || '💬 New Message', {
          description: body,
          duration: 5000,
          action: {
            label: 'Reply',
            onClick: () => this.navigateToRoute(data.chatId ? `/chat/${data.chatId}` : '/messages')
          }
        });
        break;
      
      case 'workout_invite':
        toast('🏋️ Workout Invitation', {
          description: body,
          duration: 8000,
          action: {
            label: 'View',
            onClick: () => this.navigateToRoute(data.inviteId ? `/workout-invite/${data.inviteId}` : '/workouts')
          }
        });
        break;

      case 'profile_update':
        toast.info('👤 Profile Update', {
          description: body,
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => this.navigateToRoute('/profile')
          }
        });
        break;
      
      case 'boost_activated':
        toast('🚀 Boost Active!', {
          description: body,
          duration: 6000,
          action: {
            label: 'View',
            onClick: () => this.navigateToRoute('/boosts')
          }
        });
        break;
      
      default:
        toast(title, {
          description: body,
          duration: 5000
        });
    }
  }

  handleNotificationTap(data) {
    if (!data) return;

    console.log('Notification tapped:', data);

    // Handle navigation based on notification type
    switch (data.type) {
      case 'match':
        this.navigateToRoute('/gym-bros');
        break;
      
      case 'message':
        if (data.chatId) {
          this.navigateToRoute(`/chat/${data.chatId}`);
        } else {
          this.navigateToRoute('/messages');
        }
        break;
      
      case 'workout_invite':
        if (data.inviteId) {
          this.navigateToRoute(`/workout-invite/${data.inviteId}`);
        } else if (data.gymId) {
          this.navigateToRoute(`/gym/${data.gymId}`);
        } else {
          this.navigateToRoute('/workouts');
        }
        break;
      
      case 'profile_update':
        this.navigateToRoute('/profile');
        break;
      
      case 'boost_activated':
        this.navigateToRoute('/boosts');
        break;
      
      default:
        // Default navigation for unknown types
        this.navigateToRoute('/');
    }
  }

  navigateToRoute(route) {
    // Use your app's navigation system
    // This example assumes you're using React Router
    if (window.location.pathname !== route) {
      window.location.href = route;
    }
  }

  // Update user's notification preferences
  async updateNotificationPreferences(preferences) {
    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) return false;

      const response = await api.put('/notifications/preferences', preferences);
      return response.status === 200;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  // Get delivered notifications from the device
  async getDeliveredNotifications() {
    try {
      const notificationList = await PushNotifications.getDeliveredNotifications();
      return notificationList.notifications;
    } catch (error) {
      console.error('Error getting delivered notifications:', error);
      return [];
    }
  }

  // Clear all delivered notifications from device
  async clearAllNotifications() {
    try {
      await PushNotifications.removeAllDeliveredNotifications();
      console.log('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Unregister from push notifications
  async unregister() {
    try {
      // Remove all listeners
      await PushNotifications.removeAllListeners();
      
      // Inform backend that user unregistered
      const authToken = localStorage.getItem('token');
      if (authToken && this.fcmToken) {
        try {
          await api.post('/notifications/unregister-token', {
            fcmToken: this.fcmToken
          });
        } catch (error) {
          console.error('Error informing backend of token unregistration:', error);
        }
      }
      
      this.fcmToken = null;
      this.isInitialized = false;
      
      // Clear stored tokens
      localStorage.removeItem('pending_fcm_token');
      
      console.log('Push notifications unregistered');
    } catch (error) {
      console.error('Error unregistering push notifications:', error);
    }
  }

  // Check if notifications are properly set up
  isReady() {
    return this.isInitialized && this.fcmToken;
  }

  // Get current FCM token
  getFCMToken() {
    return this.fcmToken;
  }

  // Check permission status
  async getPermissionStatus() {
    try {
      if (!Capacitor.isNativePlatform()) {
        return { receive: 'granted' }; // Web doesn't have the same permission model
      }
      return await PushNotifications.checkPermissions();
    } catch (error) {
      console.error('Error checking permissions:', error);
      return { receive: 'denied' };
    }
  }
}

export default new NotificationService();