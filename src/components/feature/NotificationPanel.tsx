import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleNotificationClick = (notifId: string, marketId?: string) => {
    markAsRead(notifId);
    if (marketId) {
      window.REACT_APP_NAVIGATE(`/market/${marketId}`);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bet': return '💰';
      case 'market_created': return '🎯';
      case 'market_resolved': return '✅';
      case 'win': return '🏆';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'bet': return 'bg-[#00ff00]';
      case 'market_created': return 'bg-[#ffff00]';
      case 'market_resolved': return 'bg-[#c0c0c0]';
      case 'win': return 'bg-[#00ff00]';
      default: return 'bg-white';
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative px-4 py-2 bg-black border-2 border-[#00ff00] text-[#00ff00] text-sm font-black uppercase hover:bg-[#00ff00] hover:text-black transition-all cursor-pointer whitespace-nowrap"
      >
        🔔 NOTIFS
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#ff0000] border-2 border-white text-white text-xs font-black flex items-center justify-center rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[600px] border-4 border-white bg-[#c0c0c0] shadow-2xl z-50">
          {/* Title Bar */}
          <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 flex items-center justify-between">
            <span className="text-white text-xs font-bold">🔔 NOTIFICATIONS</span>
            <div className="flex gap-1">
              <button
                onClick={markAllAsRead}
                className="w-auto px-2 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] font-bold hover:bg-white cursor-pointer whitespace-nowrap"
                title="Mark all as read"
              >
                ✓ ALL
              </button>
              <button
                onClick={clearNotifications}
                className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] hover:bg-[#ff0000] hover:text-white cursor-pointer"
                title="Clear all"
              >
                ×
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white text-black max-h-[500px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-bold text-gray-600 mb-2">No notifications yet</p>
                <p className="text-xs text-gray-500">You'll be notified about bets, wins, and new markets!</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-black">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.id, notif.marketId)}
                    className={`p-3 transition-all cursor-pointer ${
                      notif.read ? 'bg-white hover:bg-[#f0f0f0]' : `${getNotificationColor(notif.type)} hover:opacity-90`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black uppercase mb-1">
                          {notif.title}
                          {!notif.read && (
                            <span className="ml-2 inline-block w-2 h-2 bg-[#ff0000] rounded-full"></span>
                          )}
                        </p>
                        <p className="text-sm font-medium break-words">
                          {notif.message}
                        </p>
                        <p className="text-[10px] font-bold text-gray-600 mt-1">
                          {new Date(notif.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="bg-[#c0c0c0] border-t-2 border-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-gray-600">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''} total
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
