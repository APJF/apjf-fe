import type { Notification, NotificationResponse } from '../types/notification';

// Mock data - comment API calls
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Chào mừng đến với khóa học',
    message: 'Bạn đã đăng ký thành công khóa học "Tiếng Nhật N5 cơ bản"',
    type: 'success',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    avatar: '/img/course-avatar.jpg',
    actionUrl: '/courses/n5-basic'
  },
  {
    id: '2',
    title: 'Bài kiểm tra mới',
    message: 'Có bài kiểm tra mới cho chương "Hiragana cơ bản"',
    type: 'info',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    avatar: '/img/exam-avatar.jpg',
    actionUrl: '/exam/hiragana-basic'
  },
  {
    id: '3',
    title: 'Cập nhật profile thành công',
    message: 'Thông tin cá nhân của bạn đã được cập nhật',
    type: 'success',
    isRead: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    actionUrl: '/profile'
  },
  {
    id: '4',
    title: 'Lỗi thanh toán',
    message: 'Không thể xử lý thanh toán cho khóa học premium',
    type: 'error',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    actionUrl: '/billing'
  },
  {
    id: '5',
    title: 'Chúc mừng!',
    message: 'Bạn đã hoàn thành 50% khóa học N5',
    type: 'success',
    isRead: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    avatar: '/img/achievement.jpg',
    actionUrl: '/courses/n5-basic/progress'
  },
  {
    id: '6',
    title: 'Nhắc nhở học tập',
    message: 'Bạn chưa học bài nào hôm nay. Hãy tiếp tục học để duy trì streak!',
    type: 'warning',
    isRead: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    actionUrl: '/courses'
  },
  {
    id: '7',
    title: 'Thông báo hệ thống',
    message: 'Hệ thống sẽ bảo trì từ 2:00 - 4:00 sáng ngày mai',
    type: 'info',
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
  {
    id: '8',
    title: 'Khóa học mới',
    message: 'Khóa học "Kanji N4" đã được thêm vào thư viện',
    type: 'info',
    isRead: false,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    avatar: '/img/kanji-course.jpg',
    actionUrl: '/courses/kanji-n4'
  },
  {
    id: '9',
    title: 'Cộng đồng',
    message: 'Có người mới trả lời câu hỏi của bạn trong diễn đàn',
    type: 'info',
    isRead: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    actionUrl: '/community/questions/123'
  },
  {
    id: '10',
    title: 'Streak 7 ngày!',
    message: 'Chúc mừng! Bạn đã học liên tục 7 ngày',
    type: 'success',
    isRead: true,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    avatar: '/img/streak.jpg'
  }
];

export class NotificationService {
  private static readonly PAGE_SIZE = 5;

  // Mock API - get notifications with pagination
  static async getNotifications(page: number = 1): Promise<NotificationResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const startIndex = (page - 1) * this.PAGE_SIZE;
    const endIndex = startIndex + this.PAGE_SIZE;
    
    const sortedNotifications = [...mockNotifications].sort((a: Notification, b: Notification) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const notifications = sortedNotifications.slice(startIndex, endIndex);

    const unreadCount = mockNotifications.filter(n => !n.isRead).length;
    const hasMore = endIndex < mockNotifications.length;

    return {
      notifications,
      totalCount: mockNotifications.length,
      unreadCount,
      hasMore
    };
  }

  // Mock API - mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const notification = mockNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  // Mock API - mark all notifications as read
  static async markAllAsRead(): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    mockNotifications.forEach(n => n.isRead = true);
  }

  // Get unread count
  static getUnreadCount(): number {
    return mockNotifications.filter(n => !n.isRead).length;
  }
}
