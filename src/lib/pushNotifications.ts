// Browser Push Notifications for critical errors

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

export const sendPushNotification = (
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    requireInteraction?: boolean;
  }
): boolean => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(title, {
      body: options?.body,
      icon: options?.icon || '/favicon.ico',
      tag: options?.tag,
      requireInteraction: options?.requireInteraction || false,
      silent: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);

    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

// Store sent notification IDs to prevent duplicates
const sentNotifications = new Set<string>();

export const sendCriticalNotification = (
  id: string,
  title: string,
  message: string,
  type: 'error' | 'warning'
): boolean => {
  // Prevent duplicate notifications
  if (sentNotifications.has(id)) {
    return false;
  }

  const icon = type === 'error' ? '🚨' : '⚠️';
  const success = sendPushNotification(`${icon} ${title}`, {
    body: message,
    tag: id,
    requireInteraction: type === 'error',
  });

  if (success) {
    sentNotifications.add(id);
    // Clear from set after 1 hour to allow re-notification
    setTimeout(() => sentNotifications.delete(id), 60 * 60 * 1000);
  }

  return success;
};

export const clearSentNotifications = (): void => {
  sentNotifications.clear();
};
