import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  type: 'bet' | 'market_created' | 'market_resolved' | 'win';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  marketId?: string;
  amount?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`notifications_${user.id}`);
      if (stored) {
        try {
          setNotifications(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse notifications:', e);
        }
      }
    }
  }, [user]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (user && notifications.length > 0) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user]);

  // Real-time subscription for bets on user's markets
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bets',
        },
        async (payload) => {
          const bet = payload.new as any;
          
          // Check if this bet is on one of user's markets
          const { data: market } = await supabase
            .from('markets')
            .select('id, title, created_by')
            .eq('id', bet.market_id)
            .single();

          if (market && market.created_by === user.id && bet.user_id !== user.id) {
            addNotification({
              type: 'bet',
              title: '💰 New Bet!',
              message: `@${bet.username} bet ${parseFloat(bet.amount).toFixed(2)} SOL on ${bet.bet_type.toUpperCase()} in "${market.title}"`,
              marketId: market.id,
              amount: parseFloat(bet.amount)
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'markets',
        },
        (payload) => {
          const market = payload.new as any;
          
          // Notify all users about new market (except creator)
          if (market.created_by !== user.id) {
            addNotification({
              type: 'market_created',
              title: '🎯 New Market!',
              message: `@${market.created_by} created: "${market.title}"`,
              marketId: market.id
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'markets',
        },
        async (payload) => {
          const market = payload.new as any;
          
          // Check if market was just resolved
          if (market.status === 'resolved' && payload.old && (payload.old as any).status === 'active') {
            // Check if user has bets on this market
            const { data: userBets } = await supabase
              .from('bets')
              .select('*')
              .eq('market_id', market.id)
              .eq('user_id', user.id);

            if (userBets && userBets.length > 0) {
              const wonBets = userBets.filter(bet => bet.bet_type === market.winning_side);
              
              if (wonBets.length > 0) {
                const totalWon = wonBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
                addNotification({
                  type: 'win',
                  title: '🏆 YOU WON!',
                  message: `You won ${totalWon.toFixed(2)} SOL in "${market.title}"!`,
                  marketId: market.id,
                  amount: totalWon
                });
              } else {
                addNotification({
                  type: 'market_resolved',
                  title: '❌ Market Resolved',
                  message: `"${market.title}" was resolved. ${market.winning_side.toUpperCase()} won.`,
                  marketId: market.id
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only last 50

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
    if (user) {
      localStorage.removeItem(`notifications_${user.id}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications
      }}
    >
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
