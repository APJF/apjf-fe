import { useState, useRef } from "react"
import { Link } from 'react-router-dom';
import { Menu, X, BookOpen, Bell, Globe, Package, MessageCircle, Settings } from "lucide-react"
import { AuthSection } from "./AuthSection";
import { Button } from "../ui/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/DropdownMenu";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";
import { Badge } from "../ui/Badge";
import { Separator } from "../ui/Separator";
import { Avatar, AvatarFallback } from "../ui/Avatar";
import { useNotifications } from "../../hooks/useNotifications";
import { useLanguage } from "../../contexts/LanguageContext";
import type { Notification } from "../../types/notification";

// Enhanced Flag component with detailed designs
const Flag = ({ country }: { country: string }) => {
  const flags = {
    vi: (
      <div className="w-7 h-5 bg-red-600 rounded-sm border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" className="text-yellow-400">
            <path
              fill="currentColor"
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
        </div>
      </div>
    ),
    en: (
      <div className="w-7 h-5 rounded-sm border border-gray-200 shadow-sm relative overflow-hidden">
        {/* Blue canton */}
        <div className="absolute top-0 left-0 w-3 h-3 bg-blue-800"></div>
        {/* Red and white stripes */}
        <div className="absolute top-0 right-0 w-4 h-full">
          <div className="h-full flex flex-col">
            <div className="flex-1 bg-red-600"></div>
            <div className="flex-1 bg-white"></div>
            <div className="flex-1 bg-red-600"></div>
            <div className="flex-1 bg-white"></div>
            <div className="flex-1 bg-red-600"></div>
          </div>
        </div>
        {/* Stars in canton */}
        <div className="absolute top-0.5 left-0.5 w-2 h-2 flex flex-wrap">
          <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
          <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
          <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
          <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
        </div>
      </div>
    ),
    ja: (
      <div className="w-7 h-5 bg-white rounded-sm border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-red-600 rounded-full shadow-sm"></div>
        </div>
      </div>
    )
  }

  return flags[country as keyof typeof flags] || null
}



// Helper function to get icon for notification type
const getNotificationIcon = (type: string, icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>) => {
  if (icon) return icon;
  
  switch (type) {
    case 'success': return Package;
    case 'error': return Settings;
    case 'warning': return MessageCircle;
    default: return Bell;
  }
}

// Helper function to get color for notification type
const getNotificationColor = (type: string, color?: string) => {
  if (color) return color;
  
  switch (type) {
    case 'success': return 'bg-gradient-to-br from-green-400 to-green-600';
    case 'error': return 'bg-gradient-to-br from-red-400 to-red-600';
    case 'warning': return 'bg-gradient-to-br from-yellow-400 to-yellow-600';
    default: return 'bg-gradient-to-br from-blue-400 to-blue-600';
  }
}

// Helper function to format time ago with i18n
const formatTimeAgoWithI18n = (dateString: string, t: (key: string) => string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return t('notifications.justNow');
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} ${t('notifications.minutesAgo')}`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ${t('notifications.hoursAgo')}`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ${t('notifications.daysAgo')}`;
  return date.toLocaleDateString('vi-VN');
};

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const refreshRef = useRef<(() => void) | null>(null)
  
  // Use language hook
  const { currentLanguage, availableLanguages, changeLanguage, t } = useLanguage();
  
  // Use the notifications hook - it will handle authentication internally
  const notificationsData = useNotifications();
  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;
  
  // Store refresh function in ref to avoid dependency issues
  refreshRef.current = notificationsData?.refresh || null;

  const navItems = [
    { href: "/", label: t('header.home') },
    { href: "/courses", label: t('header.courses') },
    { href: "/learning-path", label: t('header.learningPath') },
    { href: "/forum", label: t('header.community') },
    { href: "/chatbox", label: t('header.aiChat') },
  ]

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode as 'vi' | 'en' | 'ja');
  }

  const markAsRead = (id: string | number) => {
    console.log('Mark notification as read:', id)
    if (notificationsData?.markAsRead) {
      notificationsData.markAsRead(id.toString());
    }
  }

  const markAllAsRead = () => {
    console.log('Mark all notifications as read')
    if (notificationsData?.markAllAsRead) {
      notificationsData.markAllAsRead();
    }
  }

  // Helper function to get notification display properties
  const getNotificationProps = (notification: Notification) => {
    return {
      icon: getNotificationIcon(notification.type),
      color: getNotificationColor(notification.type),
      time: formatTimeAgoWithI18n(notification.createdAt, t),
      unread: !notification.isRead,
      title: getTranslatedNotificationTitle(notification.title, t),
      message: getTranslatedNotificationMessage(notification.message, t)
    };
  };

  // Helper function to translate notification title
  const getTranslatedNotificationTitle = (title: string, t: (key: string) => string): string => {
    const titleMap: { [key: string]: string } = {
      "Khóa học mới": t('notifications.newCourse'),
      "Cập nhật hệ thống": t('notifications.systemUpdate'),
      "Tin nhắn từ giáo viên": t('notifications.teacherMessage'),
      "Báo cáo học tập tuần": t('notifications.weeklyReport'),
    };
    return titleMap[title] || title;
  };

  // Helper function to translate notification message
  const getTranslatedNotificationMessage = (message: string, t: (key: string) => string): string => {
    const messageMap: { [key: string]: string } = {
      "Khóa học 'Ngữ pháp N5' đã được cập nhật với bài học mới": t('notifications.courseUpdated'),
      "Phiên bản 2.1.0 đã được triển khai với nhiều tính năng mới": t('notifications.systemUpdated'),
      "Sensei Yamada đã gửi phản hồi về bài tập của bạn": t('notifications.teacherFeedback'),
      "Báo cáo tiến độ học tập tuần từ 01/01 - 07/01 đã sẵn sàng": t('notifications.reportReady'),
    };
    return messageMap[message] || message;
  };

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-red-600" />
            <span className="text-xl font-bold">
              <span className="text-red-600">日本語</span>
              <span className="text-gray-900">Learning</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href} className="text-sm font-medium transition-colors hover:text-red-600">
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side - Language & Notifications */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Language Switcher - Globe Icon */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative h-11 w-11 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-105"
                >
                  <Globe className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 p-1">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-semibold text-gray-900">{t('header.selectLanguage')}</p>
                </div>
                {availableLanguages.map((language) => (
                  <DropdownMenuItem
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className={`flex items-center justify-between cursor-pointer py-3 px-3 mx-1 my-1 rounded-lg transition-all duration-200 ${
                      currentLanguage === language.code 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 shadow-md border border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{language.name}</span>
                    <Flag country={language.country} />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications - Bell Icon with Subtle Badge */}
            <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative h-11 w-11 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-105"
                >
                  <Bell className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0 shadow-2xl border-0 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{t('header.notifications')}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {unreadCount > 0 ? (
                          <span className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                            {unreadCount} {t('header.newNotifications')}
                          </span>
                        ) : (
                          t('header.noNewNotifications')
                        )}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 text-xs font-medium px-3 py-1.5 rounded-lg"
                      >
                        {t('header.markAllRead')}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
                      <p className="text-gray-500">{t('header.noNotifications')}</p>
                    </div>
                  ) : (
                    notifications.map((notification, index) => {
                      const props = getNotificationProps(notification);
                      const IconComponent = props.icon;
                      
                      // Type guard to ensure IconComponent is valid
                      if (!IconComponent) return null;
                      
                      return (
                        <div key={notification.id}>
                          <button 
                            className={`w-full text-left p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                              props.unread ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border-l-4 border-l-blue-500' : ''
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex items-start space-x-3">
                              {/* Enhanced Icon Avatar */}
                              <Avatar className="h-11 w-11 shadow-md">
                                <AvatarFallback className={`${props.color} text-white shadow-inner`}>
                                  <IconComponent className="h-5 w-5" strokeWidth={2} />
                                </AvatarFallback>
                              </Avatar>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <p className="font-semibold text-gray-900 text-sm">
                                    {props.title}
                                  </p>
                                  {props.unread && (
                                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                                  {props.message}
                                </p>
                                <div className="flex items-center justify-between mt-3">
                                  <p className="text-xs text-gray-400 font-medium">
                                    {props.time}
                                  </p>
                                  <Badge 
                                    variant="secondary" 
                                    className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 font-medium rounded-full"
                                  >
                                    {notification.type}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </button>
                          {index < notifications.length - 1 && <Separator className="mx-4" />}
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-100 font-semibold py-2.5 rounded-lg transition-all duration-200"
                  >
                    {t('header.viewAllNotifications')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <AuthSection />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative h-9 w-9 rounded-full hover:bg-gray-100"
                >
                  <Globe className="h-5 w-5 text-gray-700" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                {availableLanguages.map((language) => (
                  <DropdownMenuItem
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{language.name}</span>
                    <Flag country={language.country} />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Mobile Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative h-9 w-9 rounded-full hover:bg-gray-100"
                >
                  <Bell className="h-5 w-5 text-gray-700" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 shadow-2xl border-0 rounded-2xl overflow-hidden">
                {/* Mobile notification content - simplified version */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <h3 className="font-bold text-gray-900">{t('header.notifications')}</h3>
                  <p className="text-sm text-gray-600">
                    {unreadCount > 0 ? `${unreadCount} ${t('header.newNotifications')}` : t('header.noNewNotifications')}
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.slice(0, 3).map((notification) => {
                    const props = getNotificationProps(notification);
                    const IconComponent = props.icon;
                    
                    if (!IconComponent) return null;
                    
                    return (
                      <div key={notification.id} className="p-3 border-b last:border-b-0">
                        <div className="flex items-start space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className={`${props.color} text-white`}>
                              <IconComponent className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{props.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{props.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{props.time}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
            
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="block text-sm font-medium transition-colors hover:text-red-600"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="px-2 pt-2">
              <AuthSection />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
