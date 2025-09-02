// src/services/notificationService.js
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { toast } from 'sonner';
import api from './api';

class NotificationService {
  constructor() {
    this.fcmToken = null;
    this.isInitialized = false;
    this.isAppActive = true; // Track if app is in foreground
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
        const result = await PushNotifications.requestPermissions();
        if (result.receive !== 'granted') {
          console.log('Push notification permission denied');
          return false;
        }
      } else if (permStatus.receive === 'denied') {
        console.log('Push notification permission denied');
        return false;
      }

      // Also request local notification permissions for background notifications
      const localPermStatus = await LocalNotifications.checkPermissions();
      if (localPermStatus.display === 'prompt') {
        await LocalNotifications.requestPermissions();
      }

      // Register with FCM
      await PushNotifications.register();
      
      // Set up listeners
      this.setupListeners();
      this.setupAppStateListeners();
      
      this.isInitialized = true;
      console.log('Push notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  setupAppStateListeners() {
    // Track app state to determine if we should show local notifications
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed:', isActive ? 'foreground' : 'background');
      this.isAppActive = isActive;
    });

    // Handle app resume - clear any pending notifications
    App.addListener('resume', () => {
      console.log('App resumed');
      this.isAppActive = true;
      // Optional: Clear all local notifications when app is opened
      this.clearNotificationsOnResume();
    });
  }

  setupListeners() {
    // FCM token registration successful
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
      this.fcmToken = token.value;
      this.registerTokenWithBackend(token.value);
    });

    // FCM registration failed
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Handle data-only FCM messages
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received (data-only): ' + JSON.stringify(notification));
      
      // Since we're sending data-only messages, notification.data contains everything
      const notificationData = notification.data;
      
      if (this.isAppActive) {
        // App is in foreground - show toast
        console.log('App in foreground, showing toast');
        this.showForegroundNotification(notificationData);
      } else {
        // App is in background - show local notification
        console.log('App in background, showing local notification');
        this.showBackgroundNotification(notificationData);
      }
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
      this.handleNotificationTap(notification.notification.data);
    });

    // Handle local notification taps
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Local notification tapped:', notification);
      this.handleNotificationTap(notification.notification.extra);
    });
  }

  showForegroundNotification(data) {
    const { title, body, type } = data;
    
    // Create appropriate toast based on notification type
    switch (type) {
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

  async showBackgroundNotification(data) {
    try {
      const { title, body, type, icon, color } = data;
      
      // Generate unique notification ID
      const notificationId = Math.floor(Math.random() * 10000);
      
      // Schedule local notification with the data
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: title || 'GymTonic',
            body: body || '',
            largeIcon: icon || 'https://www.gymtonic.ca/Picture2.png',
            smallIcon: 'ic_notification', // Your app's notification icon
            iconColor: color || '#3B82F6',
            extra: data, // Pass all data for tap handling
            schedule: { at: new Date(Date.now() + 1000) }, // Schedule immediately
            sound: 'default',
            attachments: icon ? [{ id: 'icon', url: icon }] : undefined,
          }
        ]
      });
      
      console.log(`Local notification scheduled: ${title}`);
    } catch (error) {
      console.error('Error showing background notification:', error);
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
        this.navigateToRoute('/');
    }
  }

  async registerTokenWithBackend(token) {
    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        console.log('No auth token available, will register token when user logs in');
        localStorage.setItem('pending_fcm_token', token);
        return;
      }

      const response = await api.post('/notifications/register-token', {
        fcmToken: token,
        platform: Capacitor.getPlatform()
      });
      
      if (response.status === 200) {
        console.log('FCM token registered with backend successfully');
        localStorage.removeItem('pending_fcm_token');
      }
    } catch (error) {
      console.error('Error registering token with backend:', error);
      localStorage.setItem('pending_fcm_token', token);
    }
  }

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

  navigateToRoute(route) {
    if (window.location.pathname !== route) {
      window.location.href = route;
    }
  }

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

  async getDeliveredNotifications() {
    try {
      const notificationList = await PushNotifications.getDeliveredNotifications();
      return notificationList.notifications;
    } catch (error) {
      console.error('Error getting delivered notifications:', error);
      return [];
    }
  }

  async clearNotificationsOnResume() {
    try {
      // Clear all delivered local notifications when app is resumed
      await LocalNotifications.removeAllDeliveredNotifications();
      console.log('Cleared notifications on resume');
    } catch (error) {
      console.error('Error clearing notifications on resume:', error);
    }
  }

  async clearAllNotifications() {
    try {
      await PushNotifications.removeAllDeliveredNotifications();
      await LocalNotifications.removeAllDeliveredNotifications();
      console.log('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  async unregister() {
    try {
      await PushNotifications.removeAllListeners();
      await App.removeAllListeners();
      
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
      localStorage.removeItem('pending_fcm_token');
      
      console.log('Push notifications unregistered');
    } catch (error) {
      console.error('Error unregistering push notifications:', error);
    }
  }

  isReady() {
    return this.isInitialized && this.fcmToken;
  }

  getFCMToken() {
    return this.fcmToken;
  }

  async getPermissionStatus() {
    try {
      if (!Capacitor.isNativePlatform()) {
        return { receive: 'granted' };
      }
      return await PushNotifications.checkPermissions();
    } catch (error) {
      console.error('Error checking permissions:', error);
      return { receive: 'denied' };
    }
  }
}

export default new NotificationService();