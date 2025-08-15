// app/components/shared/NotificationBell.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../firebase/auth-context';
import NotificationService from '../../services/NotificationService';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    let unsubscribe;
    setIsLoading(true);
    setError(null);
    
    try {
      // Get all notifications
      unsubscribe = NotificationService.getAllNotifications(user.uid, (notifications) => {
        setNotifications(notifications || []);
        setTotalCount((notifications || []).length);
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error setting up notifications:', error);
      setError(error.message);
      setNotifications([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }

    // Fallback: if no unsubscribe function is returned, create a dummy one
    if (!unsubscribe || typeof unsubscribe !== 'function') {
      console.warn('Notification service did not return unsubscribe function, using fallback');
      unsubscribe = () => {};
    }

    // Listen for messageRead events to refresh notifications
    const handleMessageRead = () => {
      // Refresh notifications when a message is marked as read
      if (user?.uid) {
        NotificationService.getAllNotifications(user.uid, (notifications) => {
          setNotifications(notifications || []);
          setTotalCount((notifications || []).length);
        });
      }
    };

    // Listen for unreadCountChanged events to update count immediately
    const handleUnreadCountChanged = (event) => {
      if (event.detail && event.detail.userId === user?.email) {
        // Update count immediately for better UX
        setTotalCount(Math.max(0, event.detail.unreadCount));
      }
    };

    window.addEventListener('messageRead', handleMessageRead);
    window.addEventListener('unreadCountChanged', handleUnreadCountChanged);

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error cleaning up notifications:', error);
        }
      }
      window.removeEventListener('messageRead', handleMessageRead);
      window.removeEventListener('unreadCountChanged', handleUnreadCountChanged);
    };
  }, [user?.uid]);

  // Removed demo mode - now only shows real notifications

  const handleNotificationClick = async (notification) => {
    try {
      if (notification.type === 'message') {
        // Mark message as read
        await NotificationService.markMessageAsRead(notification.id);
        
        // Navigate to messages page based on user role
        if (notification.title === 'New Message from Admin') {
          // Parent user - navigate to parent messages
          window.location.href = '/parent/messages';
        } else {
          // Admin user - navigate to admin messages
          window.location.href = '/admin/messages';
        }
      } else if (notification.type === 'event') {
        // Navigate to schedules page
        window.location.href = '/admin/schedules';
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
      // Still close the dropdown even if there's an error
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (user?.uid) {
      await NotificationService.markAllMessagesAsRead(user.uid);
      setIsOpen(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
            </svg>
          </div>
        );
      case 'event':
        return (
          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-circle relative hover:scale-110 transition-transform duration-200 group"
        aria-label="Notifications"
        disabled={isLoading}
      >
        <div className="w-10 h-10 rounded-full gradient-warning flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
          {isLoading ? (
            <div className="loading loading-spinner loading-sm text-warning-content"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning-content" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
            </svg>
          )}
        </div>
        
        {/* Notification Badge */}
        {!isLoading && totalCount > 0 && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-error text-error-content rounded-full flex items-center justify-center text-xs font-bold notification-pulse shadow-lg">
            {totalCount > 9 ? '9+' : totalCount}
          </div>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 notification-dropdown bg-gradient-to-br from-base-100 to-base-200 rounded-xl shadow-2xl border border-base-300 z-50">
          {/* Header */}
          <div className="p-4 border-b border-base-300">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-base-content">Notifications</h3>
              {totalCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-primary hover:text-primary-focus font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">⚙️</div>
                <p className="text-base-content/70 text-sm">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">🚫</div>
                <p className="text-base-content/70 text-sm">Error: {error}</p>
                <p className="text-base-content/50 text-xs mt-1">Please try again later.</p>
              </div>
            ) : notifications.length > 0 ? (
              <div className="p-2">
                {notifications.map((notification, index) => (
                  <div
                    key={`${notification.id}-${index}`}
                    onClick={() => handleNotificationClick(notification)}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-base-200/50 cursor-pointer transition-all duration-200 border-b border-base-200 last:border-b-0 notification-item"
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-base-content truncate">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-base-content/60">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-base-content/70 line-clamp-2 notification-content">
                        {notification.message || notification.content}
                      </p>
                      {notification.type === 'message' && (
                        <p className="text-xs text-primary mt-1">
                          {notification.senderName || (notification.title === 'New Message from Admin' ? 'From: Admin' : 'From: Parent')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-base-content/70 text-sm">No new notifications</p>
                <p className="text-base-content/50 text-xs mt-1">You're all caught up!</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-base-300 bg-base-200/30 rounded-b-xl">
              <div className="flex justify-between items-center">
                <span className="text-xs text-base-content/60">
                  {totalCount} notification{totalCount !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => {
                    // Navigate to messages page based on user role
                    const isParent = notifications.some(n => n.title === 'New Message from Admin');
                    if (isParent) {
                      window.location.href = '/parent/messages';
                    } else {
                      window.location.href = '/admin/messages';
                    }
                  }}
                  className="text-xs text-primary hover:text-primary-focus font-medium"
                >
                  View all
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
