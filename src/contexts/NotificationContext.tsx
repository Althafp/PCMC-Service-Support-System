import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  data?: any;
  created_at: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  createNotification: (notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'is_read'>) => Promise<void>;
  sendNotification: (userId: string, notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'is_read'>) => Promise<void>;
  sendBulkNotification: (userIds: string[], notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'is_read'>) => Promise<void>;
  retryFailedNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedNotifications, setFailedNotifications] = useState<Array<{
    userId: string;
    notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'is_read'>;
    retryCount: number;
    lastError: string;
  }>>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Retry after 5 seconds
      setTimeout(() => {
        if (user) fetchNotifications();
      }, 5000);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const setupRealtimeSubscription = useCallback(() => {
    if (!user) return;

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            
            // Show browser notification if supported
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(newNotification.title, {
                body: newNotification.message,
                icon: '/favicon.ico',
                tag: newNotification.id,
                requireInteraction: newNotification.priority === 'urgent',
              });
            }
            
            // Play notification sound for urgent notifications
            if (newNotification.priority === 'urgent') {
              playNotificationSound();
            }
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(notif =>
                notif.id === payload.new.id ? { ...notif, ...payload.new } : notif
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev =>
              prev.filter(notif => notif.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Notifications subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Notifications subscription error, retrying...');
          setTimeout(() => {
            if (user) setupRealtimeSubscription();
          }, 5000);
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Fallback: create a simple beep sound
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.setValueAtTime(800, context.currentTime);
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.1);
      });
    } catch (error) {
      console.log('Could not play notification sound');
    }
  };

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Browser notifications enabled');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      setupRealtimeSubscription();
      requestNotificationPermission();
    }
  }, [user, fetchNotifications, setupRealtimeSubscription, requestNotificationPermission]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setNotifications(prev =>
        prev.filter(notif => notif.id !== id)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const createNotification = async (notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'is_read'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          user_id: user.id,
          is_read: false,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
      // Add to failed notifications for retry
      setFailedNotifications(prev => [...prev, {
        userId: user.id,
        notification,
        retryCount: 0,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
  };

  const sendNotification = async (userId: string, notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'is_read'>) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          user_id: userId,
          is_read: false,
        });

      if (error) throw error;
      
      console.log(`Notification sent to user ${userId}:`, notification.title);
    } catch (error) {
      console.error('Error sending notification:', error);
      // Add to failed notifications for retry
      setFailedNotifications(prev => [...prev, {
        userId,
        notification,
        retryCount: 0,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
  };

  const sendBulkNotification = async (userIds: string[], notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'is_read'>) => {
    const results = await Promise.allSettled(
      userIds.map(userId => sendNotification(userId, notification))
    );
    
    const failed = results.filter(result => result.status === 'rejected');
    if (failed.length > 0) {
      console.warn(`${failed.length} notifications failed to send`);
    }
    
    return results;
  };

  const retryFailedNotifications = async () => {
    if (failedNotifications.length === 0) return;

    const notificationsToRetry = [...failedNotifications];
    setFailedNotifications([]);

    for (const failed of notificationsToRetry) {
      if (failed.retryCount < 3) {
        try {
          await sendNotification(failed.userId, failed.notification);
        } catch (error) {
          // Add back to failed notifications with incremented retry count
          setFailedNotifications(prev => [...prev, {
            ...failed,
            retryCount: failed.retryCount + 1,
            lastError: error instanceof Error ? error.message : 'Unknown error'
          }]);
        }
      } else {
        console.error(`Notification failed permanently after 3 retries:`, failed);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    sendNotification,
    sendBulkNotification,
    retryFailedNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
