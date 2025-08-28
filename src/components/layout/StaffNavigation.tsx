import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Plus,
  Menu,
  X,
  Home,
  ChevronRight,
  FileText,
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getAvatarText } from '../../lib/utils';

interface StaffNavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  isCollapsed: boolean;
}

const StaffNavItem: React.FC<StaffNavItemProps> = ({
  to,
  icon,
  label,
  isActive,
  onClick,
  isCollapsed
}) => {
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
      {isActive && !isCollapsed && <ChevronRight className="h-4 w-4 ml-auto text-red-500" />}
    </Link>
  );
};

interface StaffNavigationProps {
  children: React.ReactNode;
}

export const StaffNavigation: React.FC<StaffNavigationProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navigationItems = [
    // {
    //   to: '/staff/dashboard',
    //   icon: <BarChart3 className="h-5 w-5" />,
    //   label: 'Trang tổng quan'
    // },
    {
      to: '/staff/courses',
      icon: <BookOpen className="h-5 w-5" />,
      label: 'Quản lý khóa học'
    },
    {
      to: '/staff/create-course',
      icon: <Plus className="h-5 w-5" />,
      label: 'Tạo khóa học'
    },
    {
      to: '/staff/create-question',
      icon: <FileText className="h-5 w-5" />,
      label: 'Quản lý câu hỏi'
    },
    {
      to: '/staff/manager-feedback',
      icon: <FileText className="h-5 w-5" />,
      label: "Quản lý yêu cầu"
     }//,
    // {
    //   to: '/staff/student-feedback',
    //   icon: <Users className="h-5 w-5" />,
    //   label: "Student's Feedback"
    // }
  ];

  const isActive = (path: string) => location.pathname === path;

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
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Bảng điều khiển</h1>
                  <p className="text-xs text-gray-500">Quản lý tài liệu học</p>
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
                      alt={user?.username || 'Staff'}
                      className="w-full h-full rounded-full object-cover"
                      onError={() => setAvatarError(true)}
                      onLoad={() => setAvatarError(false)}
                    />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full">
                      {getAvatarText(user?.username || 'Staff')}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{user?.username || 'Staff'}</p>
                  <p className="text-sm text-gray-600 truncate">{user?.email || 'staff@example.com'}</p>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Staff
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            

            {navigationItems.map((item) => (
              <StaffNavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                isActive={isActive(item.to)}
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
              {!isCollapsed && <span className="font-medium">Trang chủ</span>}
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors rounded-lg"
              title={isCollapsed ? "Đăng xuất" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="font-medium">Đăng xuất</span>}
            </button>

            
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Staff Panel</h1>
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
                        alt={user?.username || 'Staff'}
                        className="w-full h-full rounded-full object-cover"
                        onError={() => setAvatarError(true)}
                        onLoad={() => setAvatarError(false)}
                      />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full">
                        {getAvatarText(user?.username || 'Staff')}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user?.username || 'Staff'}</p>
                    <p className="text-sm text-gray-600 truncate">{user?.email || 'staff@example.com'}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                      Staff
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
                  <StaffNavItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive(item.to)}
                    onClick={() => setIsMobileMenuOpen(false)}
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
