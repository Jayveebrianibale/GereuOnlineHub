// Safe notification wrapper that prevents expo-notifications import in Expo Go
import Constants from 'expo-constants';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Cache for loaded notifications
let NotificationsCache: any = null;
let isLoading = false;

// Safe notification functions that work in both Expo Go and development builds
export const safeNotificationHandler = {
  async ensureLoaded() {
    if (NotificationsCache || isLoading) {
      return NotificationsCache;
    }
    
    isLoading = true;
    try {
      if (!isExpoGo) {
        NotificationsCache = await import('expo-notifications');
      }
    } catch (error) {
      console.warn('Failed to load expo-notifications:', error);
    } finally {
      isLoading = false;
    }
    
    return NotificationsCache;
  },

  async setNotificationHandler(handler: any) {
    if (isExpoGo) {
      console.log('⚠️ Running in Expo Go - Notification handler not available');
      return;
    }
    
    try {
      const Notifications = await this.ensureLoaded();
      if (Notifications) {
        Notifications.setNotificationHandler(handler);
      }
    } catch (error) {
      console.warn('Failed to set notification handler:', error);
    }
  },

  async getPermissionsAsync() {
    if (isExpoGo) {
      console.log('⚠️ Running in Expo Go - Permissions check not available');
      return { status: 'denied' };
    }
    
    try {
      const Notifications = await this.ensureLoaded();
      if (Notifications) {
        return await Notifications.getPermissionsAsync();
      }
    } catch (error) {
      console.warn('Failed to get permissions:', error);
    }
    return { status: 'denied' };
  },

  async requestPermissionsAsync() {
    if (isExpoGo) {
      console.log('⚠️ Running in Expo Go - Permission request not available');
      return { status: 'denied' };
    }
    
    try {
      const Notifications = await this.ensureLoaded();
      if (Notifications) {
        return await Notifications.requestPermissionsAsync();
      }
    } catch (error) {
      console.warn('Failed to request permissions:', error);
    }
    return { status: 'denied' };
  },

  async setNotificationChannelAsync(channelId: string, channel: any) {
    if (isExpoGo) {
      console.log('⚠️ Running in Expo Go - Notification channels not available');
      return;
    }
    
    try {
      const Notifications = await this.ensureLoaded();
      if (Notifications) {
        await Notifications.setNotificationChannelAsync(channelId, channel);
      }
    } catch (error) {
      console.warn('Failed to set notification channel:', error);
    }
  },

  async getExpoPushTokenAsync(options: any) {
    if (isExpoGo) {
      console.log('⚠️ Running in Expo Go - Push token generation not available');
      return { data: null };
    }
    
    try {
      const Notifications = await this.ensureLoaded();
      if (Notifications) {
        return await Notifications.getExpoPushTokenAsync(options);
      }
    } catch (error) {
      console.warn('Failed to get Expo push token:', error);
    }
    return { data: null };
  },

  addNotificationReceivedListener(listener: any) {
    if (isExpoGo) {
      console.log('⚠️ Running in Expo Go - Notification listeners not available');
      return { remove: () => {} };
    }
    
    try {
      // Import dynamically to avoid the error
      this.ensureLoaded().then(Notifications => {
        if (Notifications) {
          return Notifications.addNotificationReceivedListener(listener);
        }
      }).catch(error => {
        console.warn('Failed to add notification listener:', error);
      });
      
      return { remove: () => {} };
    } catch (error) {
      console.warn('Failed to add notification listener:', error);
      return { remove: () => {} };
    }
  },

  addNotificationResponseReceivedListener(listener: any) {
    if (isExpoGo) {
      console.log('⚠️ Running in Expo Go - Notification response listeners not available');
      return { remove: () => {} };
    }
    
    try {
      // Import dynamically to avoid the error
      this.ensureLoaded().then(Notifications => {
        if (Notifications) {
          return Notifications.addNotificationResponseReceivedListener(listener);
        }
      }).catch(error => {
        console.warn('Failed to add notification response listener:', error);
      });
      
      return { remove: () => {} };
    } catch (error) {
      console.warn('Failed to add notification response listener:', error);
      return { remove: () => {} };
    }
  },

  async scheduleNotificationAsync(options: any) {
    if (isExpoGo) {
      console.log('⚠️ Running in Expo Go - Notification scheduling not available');
      return;
    }
    
    try {
      const Notifications = await this.ensureLoaded();
      if (Notifications) {
        return await Notifications.scheduleNotificationAsync(options);
      }
    } catch (error) {
      console.warn('Failed to schedule notification:', error);
    }
  }
};

export default safeNotificationHandler;
