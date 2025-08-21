// API Response Types
export interface NotificationAPIItem {
  id: number;
  content: string;
  read: boolean; // API trả về 'read' chứ không phải 'isRead'
  createdAt: string;
  senderId: number;
  senderUsername: string;
  postId?: number;
  postTitle?: string;
}

export interface NotificationsAPIResponse {
  success: boolean;
  message: string;
  data: NotificationAPIItem[];
  timestamp: number;
}

// UI Types - keeping existing for compatibility
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  avatar?: string;
  actionUrl?: string;
  postId?: string;
  senderUsername?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  hasMore: boolean;
}
