import api from '../api/axios';
import type { 
  Notification, 
  NotificationResponse, 
  NotificationAPIItem, 
  NotificationsAPIResponse 
} from '../types/notification';

// Helper function to convert API notification to UI format
const convertAPINotificationToUI = (apiNotification: NotificationAPIItem): Notification => {
  // Generate title based on content and context
  let title = 'Thông báo';
  let type: 'info' | 'success' | 'warning' | 'error' = 'info';
  let actionUrl: string | undefined;

  // Try to determine notification type and generate appropriate title
  if (apiNotification.postId && apiNotification.postTitle) {
    title = 'Hoạt động trong diễn đàn';
    actionUrl = `/forum?post=${apiNotification.postId}`;
  } else if (apiNotification.content.includes('like') || apiNotification.content.includes('thích')) {
    title = 'Lượt thích mới';
    type = 'success';
  } else if (apiNotification.content.includes('comment') || apiNotification.content.includes('bình luận')) {
    title = 'Bình luận mới';
    // type remains 'info'
  }

  return {
    id: apiNotification.id.toString(),
    title,
    message: apiNotification.content,
    type,
    isRead: apiNotification.read, // API trả về 'read' property
    createdAt: apiNotification.createdAt,
    senderUsername: apiNotification.senderUsername,
    postId: apiNotification.postId?.toString(),
    actionUrl,
    avatar: `/img/default-avatar.svg` // Default avatar, could be enhanced with sender avatar
  };
};

export class NotificationService {
  private static readonly PAGE_SIZE = 10;

  /**
   * Get notifications from API
   */
  static async getNotifications(page: number = 1): Promise<NotificationResponse> {
    try {
      console.log('🔔 Fetching notifications from API...');
      
      const response = await api.get<NotificationsAPIResponse>('/notifications');
      
      console.log('✅ Notifications API response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch notifications');
      }

      const apiNotifications = response.data.data || [];
      
      // Convert API notifications to UI format
      const notifications = apiNotifications.map(convertAPINotificationToUI);
      
      // Sort by creation date (newest first)
      notifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Apply pagination
      const startIndex = (page - 1) * this.PAGE_SIZE;
      const endIndex = startIndex + this.PAGE_SIZE;
      const paginatedNotifications = notifications.slice(startIndex, endIndex);

      // Calculate metrics
      const unreadCount = notifications.filter(n => !n.isRead).length;
      const hasMore = endIndex < notifications.length;

      console.log('📊 Notification stats:', {
        total: notifications.length,
        unread: unreadCount,
        page,
        showing: paginatedNotifications.length,
        hasMore
      });

      return {
        notifications: paginatedNotifications,
        totalCount: notifications.length,
        unreadCount,
        hasMore
      };
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      
      // Handle 401 errors gracefully - return empty result instead of throwing
      if (error && typeof error === 'object' && 'response' in error && 
          (error as { response?: { status?: number } }).response?.status === 401) {
        console.log('🔐 User not authenticated, returning empty notifications');
        return {
          notifications: [],
          totalCount: 0,
          unreadCount: 0,
          hasMore: false
        };
      }
      
      // For other errors, still throw to handle properly
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      console.log('📖 Marking notification as read:', notificationId);
      
      const response = await api.patch(`/notifications/${notificationId}`);
      
      console.log('✅ Mark as read response:', response.data);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<void> {
    try {
      console.log('📖 Marking all notifications as read...');
      
      // Get all unread notifications first
      const notificationResponse = await this.getNotifications(1);
      const unreadNotifications = notificationResponse.notifications.filter(n => !n.isRead);
      
      // Mark each unread notification as read
      const markPromises = unreadNotifications.map(notification => 
        this.markAsRead(notification.id)
      );
      
      await Promise.all(markPromises);
      
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread count from latest notifications
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const response = await this.getNotifications(1);
      return response.unreadCount;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return 0;
    }
  }
}
