import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function handleRegistrationError(errorMessage: string) {
  console.error('Push notification error:', errorMessage);
  throw new Error(errorMessage);
}

export const notificationService = {
  /**
   * Register for push notifications and get Expo Push Token
   */
  async registerForPushNotificationsAsync(): Promise<string | undefined> {
    // Setup Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Water Monitor Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
        sound: 'default',
      });

      // Warning channel
      await Notifications.setNotificationChannelAsync('warnings', {
        name: 'Water Warnings',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F59E0B',
        sound: 'default',
      });

      // Critical alerts channel
      await Notifications.setNotificationChannelAsync('critical', {
        name: 'Critical Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#EF4444',
        sound: 'default',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        handleRegistrationError('Permission not granted to get push token for push notification!');
        return;
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

      if (!projectId) {
        handleRegistrationError('Project ID not found');
        return;
      }

      try {
        const pushTokenString = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
        
        console.log('✅ Expo Push Token:', pushTokenString);
        return pushTokenString;
      } catch (e: unknown) {
        handleRegistrationError(`${e}`);
      }
    } else {
      handleRegistrationError('Must use physical device for push notifications');
    }
  },

  /**
   * Send push notification via Expo Push Service
   */
  async sendPushNotification(
    expoPushToken: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
    };

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      console.log('Push notification sent successfully');
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  },

  /**
   * Schedule a local notification immediately
   */
  async scheduleNotification(
    title: string,
    body: string,
    data?: any,
    channelId: string = 'default'
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // null means immediate
    });
  },

  /**
   * Schedule a warning notification
   */
  async scheduleWarningNotification(duration: number): Promise<string> {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    return await this.scheduleNotification(
      'Warning: Water Running Long',
      `Water has been running for ${minutes}m ${seconds}s`,
      { 
        type: 'warning',
        duration,
        screen: 'dashboard',
      },
      'warnings'
    );
  },

  /**
   * Schedule an auto shutoff notification
   */
  async scheduleShutoffNotification(): Promise<string> {
    return await this.scheduleNotification(
      'Water Auto Shutoff',
      'Water was automatically shut off due to extended usage time',
      { 
        type: 'shutoff',
        screen: 'history',
      },
      'critical'
    );
  },

  /**
   * Schedule a daily summary notification
   */
  async scheduleDailySummary(eventCount: number, totalMinutes: number): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Daily Water Summary',
        body: `${eventCount} event${eventCount !== 1 ? 's' : ''} today, ${totalMinutes} minutes total`,
        data: { 
          type: 'summary',
          screen: 'history',
        },
        sound: 'default',
      },
      trigger: {
        hour: 20,
        minute: 0,
        repeats: true,
      },
    });
  },

  /**
   * Send a test notification
   */
  async sendTestNotification(): Promise<string> {
    return await this.scheduleNotification(
      '💧 Test Notification',
      'Push notifications are working correctly!',
      { type: 'test' }
    );
  },

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  /**
   * Cancel a specific notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  },

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(callback);
  },

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  /**
   * Save push token to backend
   */
  async savePushTokenToBackend(token: string, userId: string): Promise<void> {
    try {
      const { supabase } = await import('../api/supabase');
      
      const { error } = await supabase
        .from('user_settings')
        .update({
          push_token: token,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
      console.log('Push token saved to backend');
    } catch (error) {
      console.error('Failed to save push token:', error);
    }
  },
};