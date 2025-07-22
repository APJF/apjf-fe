import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Plus,
  MessageSquare,
  Users,
  Menu,
  X,
  Home,
  ChevronRight
} from 'lucide-react';

interface StaffNavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

const StaffNavItem: React.FC<StaffNavItemProps> = ({
  to,
  icon,
  label,
  isActive,
  onClick
}) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        isActive
          ? 'bg-red-50 text-red-700 border border-red-200'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <div className={`transition-colors ${
        isActive ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-600'
      }`}>
        {icon}
      </div>
      <span className="font-medium">{label}</span>
      {isActive && <ChevronRight className="h-4 w-4 ml-auto text-red-500" />}
    </Link>
  );
};

interface StaffNavigationProps {
  children: React.ReactNode;
}

export const StaffNavigation: React.FC<StaffNavigationProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    {
      to: '/staff/dashboard',
      icon: <BarChart3 className="h-5 w-5" />,
      label: 'Dashboard'
    },
    {
      to: '/staff/courses',
      icon: <BookOpen className="h-5 w-5" />,
      label: 'Courses'
    },
    {
      to: '/staff/create-course',
      icon: <Plus className="h-5 w-5" />,
      label: 'Create Course'
    },
    {
      to: '/staff/manager-feedback',
      icon: <MessageSquare className="h-5 w-5" />,
      label: "Manager's Feedback"
    },
    {
      to: '/staff/student-feedback',
      icon: <Users className="h-5 w-5" />,
      label: "Student's Feedback"
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Staff Panel</h1>
              <p className="text-xs text-gray-500">管理パネル</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <div className="mb-6">
              <Link
                to="/"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
              >
                <Home className="h-4 w-4" />
                ← Back to Main Site
              </Link>
            </div>

            {navigationItems.map((item) => (
              <StaffNavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                isActive={isActive(item.to)}
              />
            ))}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-lg mb-1">🎌</div>
              <p className="text-xs text-gray-600">
                <span className="font-medium text-red-600">頑張って!</span>
              </p>
              <p className="text-xs text-gray-400">Staff Mode</p>
            </div>
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

              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <StaffNavItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive(item.to)}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:pl-64 flex-1">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
};
