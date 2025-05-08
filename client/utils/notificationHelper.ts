import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export async function registerForPushNotifications() {
  let token;
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
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
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

// Schedule a local notification
export async function scheduleLocalNotification({
  title,
  body,
  data = {},
  trigger = null,
}: {
  title: string;
  body: string;
  data?: any;
  trigger?: any;
}) {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: trigger || { seconds: 1 }, // Default to showing immediately
  });
}

// Send push notification (would typically be done from the server)
// This is a mock function to simulate how server-to-client notifications would work
export async function mockSendPushNotification(expoPushToken: string, title: string, body: string, data: any = {}) {
  console.log(`Would send push notification to ${expoPushToken} with title: ${title} and body: ${body}`);
  
  // In a real app, you would make a request to Expo's push notification service:
  // const message = {
  //   to: expoPushToken,
  //   sound: 'default',
  //   title: title,
  //   body: body,
  //   data: data,
  // };
  // 
  // await fetch('https://exp.host/--/api/v2/push/send', {
  //   method: 'POST',
  //   headers: {
  //     Accept: 'application/json',
  //     'Accept-encoding': 'gzip, deflate',
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify(message),
  // });
  
  // For demo purposes, we'll just schedule a local notification
  return await scheduleLocalNotification({ title, body, data });
}

// Add listeners for receiving notifications
export function addNotificationListeners(
  onReceive: (notification: Notifications.Notification) => void,
  onResponse: (response: Notifications.NotificationResponse) => void
) {
  const receiveListener = Notifications.addNotificationReceivedListener(onReceive);
  const responseListener = Notifications.addNotificationResponseReceivedListener(onResponse);

  return { receiveListener, responseListener };
}

// Remove notification listeners
export function removeNotificationListeners(listeners: { 
  receiveListener: Notifications.Subscription, 
  responseListener: Notifications.Subscription 
}) {
  Notifications.removeNotificationSubscription(listeners.receiveListener);
  Notifications.removeNotificationSubscription(listeners.responseListener);
}
