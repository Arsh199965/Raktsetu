import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from './AuthContext';
import { 
  registerForPushNotifications, 
  addNotificationListeners, 
  removeNotificationListeners,
  scheduleLocalNotification
} from '@/utils/notificationHelper';

interface NotificationContextType {
  expoPushToken: string | null;
  notificationCount: number;
  sendLocalNotification: (title: string, body: string, data?: any) => Promise<string>;
  clearNotificationCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const { token, userRole } = useAuth();

  // Register for push notifications when the component mounts
  useEffect(() => {
    if (token) {
      registerForPushNotificationsAsync();
    }
  }, [token]);

  // Set up notification listeners
  useEffect(() => {
    if (!token) return;

    const listeners = addNotificationListeners(
      // This runs when a notification is received while the app is in the foreground
      (notification) => {
        console.log('Notification received in the foreground:', notification);
        setNotificationCount((prev) => prev + 1);
      },
      // This runs when the user interacts with a notification
      (response) => {
        console.log('User interacted with notification:', response);
        // You can handle navigation or other actions based on the notification
      }
    );

    // Clean up listeners on unmount
    return () => {
      if (listeners) {
        removeNotificationListeners(listeners);
      }
    };
  }, [token]);

  const registerForPushNotificationsAsync = async () => {
    try {
      const token = await registerForPushNotifications();
      if (token) {
        setExpoPushToken(token);
        console.log('Push token:', token);
        
        // In a real app, you would send this token to your server
        // along with the user ID for storing in the database
        // sendPushTokenToServer(token, userId);
      }
    } catch (error) {
      console.log('Error registering for push notifications:', error);
    }
  };

  const sendLocalNotification = async (title: string, body: string, data: any = {}): Promise<string> => {
    try {
      const notificationId = await scheduleLocalNotification({ title, body, data });
      setNotificationCount((prev) => prev + 1);
      return notificationId;
    } catch (error) {
      console.error('Error sending local notification:', error);
      throw error;
    }
  };

  const clearNotificationCount = () => {
    setNotificationCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notificationCount,
        sendLocalNotification,
        clearNotificationCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
