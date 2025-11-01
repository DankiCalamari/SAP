import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import api from './api';

/**
 * Request notification permissions
 * iOS requires explicit permission, Android automatically granted
 */
export const requestPermissions = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Notification permission granted');
      return true;
    } else {
      console.log('Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Get FCM token and register with backend
 */
export const initializeNotifications = async (userId) => {
  try {
    // Request permissions
    const permissionGranted = await requestPermissions();
    if (!permissionGranted) {
      console.log('Notifications not enabled - permission denied');
      return null;
    }

    // Get FCM token
    const fcmToken = await messaging().getToken();
    console.log('FCM Token:', fcmToken);

    // Register device with backend
    try {
      await api.registerDevice({
        token: fcmToken,
        platform: Platform.OS,
        user_id: userId,
      });
      console.log('Device registered with backend');
    } catch (error) {
      console.error('Failed to register device with backend:', error);
    }

    return fcmToken;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return null;
  }
};

/**
 * Handle foreground notifications
 * Called when app is open and active
 */
export const onNotificationReceived = (navigation, dispatch) => {
  return messaging().onMessage(async (remoteMessage) => {
    console.log('Foreground notification:', remoteMessage);

    const { notification, data } = remoteMessage;

    // Display in-app notification banner (could use a custom component)
    // For now, just log it
    console.log('Notification title:', notification?.title);
    console.log('Notification body:', notification?.body);

    // Handle notification based on type
    if (data?.type) {
      handleNotificationAction(data.type, data, navigation, dispatch);
    }
  });
};

/**
 * Handle notification tap (background/quit state)
 * Called when user taps notification
 */
export const onNotificationOpened = (navigation, dispatch) => {
  // Background state - app is in background but not killed
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Notification opened app from background:', remoteMessage);

    if (remoteMessage.data?.type) {
      handleNotificationAction(remoteMessage.data.type, remoteMessage.data, navigation, dispatch);
    }
  });

  // Quit state - app was killed and opened from notification
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('Notification opened app from quit state:', remoteMessage);

        if (remoteMessage.data?.type) {
          handleNotificationAction(
            remoteMessage.data.type,
            remoteMessage.data,
            navigation,
            dispatch
          );
        }
      }
    });
};

/**
 * Handle notification actions based on type
 */
const handleNotificationAction = (type, data, navigation, dispatch) => {
  switch (type) {
    case 'low_stock':
      // Navigate to ProductDetail for low stock item
      if (data.product_id) {
        navigation.navigate('ProductDetail', { productId: data.product_id });
      }
      break;

    case 'new_product':
      // Navigate to ProductList or ProductDetail
      if (data.product_id) {
        navigation.navigate('ProductDetail', { productId: data.product_id });
      } else {
        navigation.navigate('ProductList');
      }
      break;

    case 'inventory_update':
      // Refresh inventory data
      if (dispatch) {
        // Could dispatch a Redux action to refresh inventory
        console.log('Refreshing inventory data...');
      }
      break;

    case 'inventory_alert':
      // Navigate to inventory screen
      navigation.navigate('Inventory');
      break;

    default:
      console.log('Unknown notification type:', type);
  }
};

/**
 * Subscribe to notification topic
 */
export const subscribeToTopic = async (topic) => {
  try {
    await messaging().subscribeToTopic(topic);
    console.log(`Subscribed to topic: ${topic}`);
  } catch (error) {
    console.error('Error subscribing to topic:', error);
  }
};

/**
 * Unsubscribe from notification topic
 */
export const unsubscribeFromTopic = async (topic) => {
  try {
    await messaging().unsubscribeFromTopic(topic);
    console.log(`Unsubscribed from topic: ${topic}`);
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
  }
};

/**
 * Delete FCM token (on logout)
 */
export const deleteToken = async () => {
  try {
    await messaging().deleteToken();
    console.log('FCM token deleted');
  } catch (error) {
    console.error('Error deleting FCM token:', error);
  }
};

export default {
  requestPermissions,
  initializeNotifications,
  onNotificationReceived,
  onNotificationOpened,
  subscribeToTopic,
  unsubscribeFromTopic,
  deleteToken,
};
