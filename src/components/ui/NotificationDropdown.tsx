import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className = '' }: Readonly<NotificationDropdownProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead
  } = useNotifications();
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || loading || !hasMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      loadMore();
    }
  }, [loading, hasMore, loadMore]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // Get notification icon color
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-500'; // Keep for distinct status colors
      case 'error': return 'text-destructive';
      case 'warning': return 'text-yellow-500'; // Keep for distinct status colors
      default: return 'text-primary';
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
      >
        <Bell className="h-6 w-6" />
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-background rounded-lg shadow-lg border z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-foreground">Thông báo</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary hover:text-primary/80 flex items-center space-x-1"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Đánh dấu tất cả</span>
                  <span className="sm:hidden">Tất cả</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-background"
            onScroll={handleScroll}
          >
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 text-border" />
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              <div className="py-2">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    className={`w-full text-left px-4 py-3 hover:bg-accent border-l-4 cursor-pointer ${
                      !notification.isRead
                        ? 'bg-primary/10 border-l-primary'
                        : 'border-l-transparent'
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                    }}
                  >
                    <div className="flex space-x-3">
                      {/* Avatar or Icon */}
                      <div className="flex-shrink-0">
                        {notification.avatar ? (
                          <img
                            src={notification.avatar}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)} bg-secondary`}>
                            <Bell className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm ${!notification.isRead ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>

                          {/* Mark as read button */}
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="text-primary hover:text-primary/80 ml-2 flex-shrink-0"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex justify-center py-4">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-border border-t-primary"></div>
                      <span className="text-sm">Đang tải...</span>
                    </div>
                  </div>
                )}

                {/* No more data */}
                {!hasMore && notifications.length > 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Đã hiển thị tất cả thông báo
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
