import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  BookOpen,
  Menu,
  X,
  Home,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getAvatarText } from '../../lib/utils';

interface ManagerNavItemProps {
  to?: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  isCollapsed: boolean;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  to?: string;
}

const ManagerNavItem: React.FC<ManagerNavItemProps> = ({
  to,
  icon,
  label,
  isActive,
  onClick,
  isCollapsed
}) => {
  if (to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
          isActive
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        title={isCollapsed ? label : undefined}
      >
        <div className={`transition-colors ${
          isActive ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-600'
        }`}>
          {icon}
        </div>
        {!isCollapsed && (
          <span className="font-medium">{label}</span>
        )}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
        isActive
          ? 'bg-red-50 text-red-700 border border-red-200'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
      title={isCollapsed ? label : undefined}
    >
      <div className={`transition-colors ${
        isActive ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-600'
      }`}>
        {icon}
      </div>
      {!isCollapsed && (
        <span className="font-medium">{label}</span>
      )}
    </button>
  );
};

interface ManagerNavigationProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const ManagerNavigation: React.FC<ManagerNavigationProps> = ({ 
  children, 
  activeTab,
  onTabChange 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navigationItems = [
    {
      id: 'overview',
      label: 'Tổng quan',
      icon: <TrendingUp className="h-5 w-5" />,
      to: '/manager/dashboard'
    },
    // {
    //   id: 'users',
    //   label: 'Quản lý người dùng',
    //   icon: <Users className="h-5 w-5" />
    // },
    {
      id: 'approval-requests',
      label: 'Phê duyệt yêu cầu',
      icon: <BookOpen className="h-5 w-5" />,
      to: '/manager/approval-requests'
    }//,
    // {
    //   id: 'revenue',
    //   label: 'Doanh thu',
    //   icon: <DollarSign className="h-5 w-5" />
    // },
    // {
    //   id: 'instructors',
    //   label: 'Giảng viên',
    //   icon: <Award className="h-5 w-5" />
    // },
    // {
    //   id: 'schedule',
    //   label: 'Lịch trình',
    //   icon: <Calendar className="h-5 w-5" />
    // },
    // {
    //   id: 'feedback',
    //   label: 'Phản hồi',
    //   icon: <MessageSquare className="h-5 w-5" />
    // },
    // {
    //   id: 'settings',
    //   label: 'Cài đặt',
    //   icon: <Settings className="h-5 w-5" />
    // }
  ];

  const isActive = (itemId: string) => {
    if (activeTab) {
      return activeTab === itemId;
    }
    // Fallback for route-based navigation
    if (itemId === 'overview') {
      return location.pathname === '/manager/dashboard';
    }
    if (itemId === 'approval-requests') {
      return location.pathname === '/manager/approval-requests';
    }
    return false;
  };

  const handleItemClick = (item: NavigationItem) => {
    if (item.to) {
      navigate(item.to);
    } else if (onTabChange) {
      onTabChange(item.id);
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 transition-all duration-300 ${
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      }`}>
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Manager Panel</h1>
                  <p className="text-xs text-gray-500">管理パネル</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>

          {/* User Info */}
          {!isCollapsed && (
            <div className="p-4 border-b border-gray-200 bg-red-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-medium overflow-hidden">
                  {user?.avatar && !avatarError ? (
                    <img
                      src={user.avatar}
                      alt={user?.username || 'Manager'}
                      className="w-full h-full rounded-full object-cover"
                      onError={() => setAvatarError(true)}
                      onLoad={() => setAvatarError(false)}
                    />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full">
                      {getAvatarText(user?.username || 'Manager')}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{user?.username || 'Manager'}</p>
                  <p className="text-sm text-gray-600 truncate">{user?.email || 'manager@example.com'}</p>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Manager
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            

            {navigationItems.map((item) => (
              <ManagerNavItem
                key={item.id}
                to={item.to}
                icon={item.icon}
                label={item.label}
                isActive={isActive(item.id)}
                onClick={() => handleItemClick(item)}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <button
              onClick={handleGoHome}
              className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors rounded-lg"
              title={isCollapsed ? "Trang chủ" : undefined}
            >
              <Home className="h-4 w-4" />
              {!isCollapsed && <span className="font-medium">Homepage</span>}
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors rounded-lg"
              title={isCollapsed ? "Đăng xuất" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="font-medium">Sign Out</span>}
            </button>

            
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Manager Panel</h1>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30">
          <button
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setIsMobileMenuOpen(false)}
            aria-label="Close mobile menu"
          />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white">
            <div className="pt-16 px-4 py-6">
              {/* Mobile User Info */}
              <div className="mb-6 p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-medium overflow-hidden">
                    {user?.avatar && !avatarError ? (
                      <img
                        src={user.avatar}
                        alt={user?.username || 'Manager'}
                        className="w-full h-full rounded-full object-cover"
                        onError={() => setAvatarError(true)}
                        onLoad={() => setAvatarError(false)}
                      />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full">
                        {getAvatarText(user?.username || 'Manager')}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user?.username || 'Manager'}</p>
                    <p className="text-sm text-gray-600 truncate">{user?.email || 'manager@example.com'}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                      Manager
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <Link
                  to="/"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home className="h-4 w-4" />
                  ← Back to Main Site
                </Link>
              </div>

              <nav className="space-y-2 mb-6">
                {navigationItems.map((item) => (
                  <ManagerNavItem
                    key={item.id}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive(item.id)}
                    onClick={() => handleItemClick(item)}
                    isCollapsed={false}
                  />
                ))}
              </nav>

              {/* Mobile Footer */}
              <div className="space-y-2 border-t border-gray-200 pt-4">
                <button
                  onClick={handleGoHome}
                  className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors rounded-lg"
                >
                  <Home className="h-4 w-4" />
                  <span className="font-medium">Homepage</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${
        isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      } flex-1`}>
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
};
