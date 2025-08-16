import { useState, useEffect, useCallback } from 'react';
import { NotificationService } from '../services/notificationService';
import { useAuth } from './useAuth';
import type { Notification } from '../types/notification';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  // Check if user is authenticated
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Load notifications - memoize để tránh tạo function mới liên tục
  const loadNotifications = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    // Don't make API calls if user is not authenticated
    if (!isAuthenticated) {
      console.log('🔐 User not authenticated, skipping notifications load');
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await NotificationService.getNotifications(pageNum);
      
      if (reset) {
        setNotifications(response.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.notifications]);
      }
      
      setUnreadCount(response.unreadCount);
      setHasMore(response.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      
      // Handle authentication error gracefully - don't throw, just set empty state
      if (error && typeof error === 'object' && 'response' in error && 
          (error as { response?: { status?: number } }).response?.status === 401) {
        console.log('🔐 User not authenticated, skipping notifications load');
        setNotifications([]);
        setUnreadCount(0);
        setHasMore(false);
        return; // Don't throw, just return silently
      }
      
      // For other errors, also don't throw to prevent app crash
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    loadNotifications(1, true);
  }, [loadNotifications]);

  // Load more notifications
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadNotifications(page + 1, false);
    }
  }, [loading, hasMore, page, loadNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!isAuthenticated) {
      console.log('🔐 User not authenticated, cannot mark notification as read');
      return;
    }
    
    try {
      // Optimistically update local state first for instant UI feedback
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      await NotificationService.markAsRead(notificationId);
      
      // ✅ KHÔNG refresh nữa - trust optimistic update vì API đã thành công
      console.log('✅ Notification marked as read successfully');
      
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      // Chỉ khi API call thất bại mới refresh để revert optimistic update
      loadNotifications(1, true);
    }
  }, [isAuthenticated, loadNotifications]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('🔐 User not authenticated, cannot mark all notifications as read');
      return;
    }
    
    try {
      // Optimistically update local state first for instant UI feedback
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      
      await NotificationService.markAllAsRead();
      
      // ✅ KHÔNG refresh nữa - trust optimistic update vì API đã thành công
      console.log('✅ All notifications marked as read successfully');
      
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      // Chỉ khi API call thất bại mới refresh để revert
      loadNotifications(1, true);
    }
  }, [isAuthenticated, loadNotifications]);

  // Refresh notifications
  const refresh = useCallback(() => {
    if (!isAuthenticated) {
      console.log('🔐 User not authenticated, skipping refresh');
      return;
    }
    console.log('🔄 Refreshing notifications...');
    loadNotifications(1, true);
  }, [isAuthenticated, loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    refresh
  };
}
