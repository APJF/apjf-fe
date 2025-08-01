import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, BookOpen, ChevronDown, BarChart3, History } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const AuthSection: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Debug log để kiểm tra user data
  useEffect(() => {
    console.log('Current user in AuthSection:', user);
    console.log('User roles:', user?.roles);
    if (user?.roles) {
      const hasStaffRole = user.roles.some(role => role && ['STAFF', 'ADMIN'].includes(role.toUpperCase()));
      console.log('Has staff/admin role:', hasStaffRole);
    }
  }, [user]);

  // Temporary function để test role checking
  const hasRequiredRole = () => {
    if (!user?.roles) return false;
    const result = user.roles.some(role => role && ['STAFF', 'ADMIN'].includes(role.toUpperCase()));
    console.log('Role check result:', result, 'Roles:', user.roles);
    return result;
  };

  // Function để check Manager role
  const hasManagerRole = () => {
    if (!user?.roles) return false;
    const result = user.roles.some(role => role && ['MANAGER', 'ADMIN'].includes(role.toUpperCase()));
    console.log('Manager role check result:', result, 'Roles:', user.roles);
    return result;
  };

  // Temporary function to add mock roles for testing
  const addMockStaffRole = () => {
    if (user) {
      const updatedUser = { ...user, roles: ['STAFF'] };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('authStateChanged'));
      console.log('Added mock STAFF role');
    }
  };

  // Function to add mock Manager role for testing
  const addMockManagerRole = () => {
    if (user) {
      const updatedUser = { ...user, roles: ['MANAGER'] };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('authStateChanged'));
      console.log('Added mock MANAGER role');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/');
  };

  const getAvatarText = (username: string) => {
    return username?.charAt(0)?.toUpperCase() || 'U'
  }

  if (user) {
    return (
      <div className="relative" ref={dropdownRef}>
        {/* User Avatar Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          {/* Avatar */}
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.username || 'User'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getAvatarText(user?.username || 'User')
            )}
          </div>

          {/* Username (hidden on mobile) */}
          <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-24 truncate">
            {user?.username || 'User'}
          </span>

          {/* Dropdown Arrow */}
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${
            isDropdownOpen ? "rotate-180" : ""
          }`} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-medium">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user?.username || 'User'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getAvatarText(user?.username || 'User')
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.username || 'User'}</p>
                  {user?.roles && user.roles.length > 0 && (
                    <p className="text-xs text-gray-500 truncate">{user.roles.join(', ')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                <User className="w-4 h-4" />
                Hồ sơ cá nhân
              </Link>

              <Link
                to="/courses"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                <BookOpen className="w-4 h-4" />
                Khóa học của tôi
              </Link>

              <Link
                to="/exam-history"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                <History className="w-4 h-4" />
                Lịch sử thi
              </Link>

              {/* Staff Dashboard Link - chỉ hiển thị cho STAFF và ADMIN */}
              {hasRequiredRole() && (
                <Link
                  to="/staff/dashboard"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <BarChart3 className="w-4 h-4" />
                  Staff Dashboard
                </Link>
              )}

              {/* Manager Dashboard Link - chỉ hiển thị cho MANAGER và ADMIN */}
              {hasManagerRole() && (
                <Link
                  to="/manager/dashboard"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <BarChart3 className="w-4 h-4" />
                  Manager Dashboard
                </Link>
              )}

              <Link
                to="/settings"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                <Settings className="w-4 h-4" />
                Cài đặt
              </Link>

              {/* Temporary debug button to test staff role */}
              <button
                onClick={() => {
                  addMockStaffRole();
                  setIsDropdownOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors w-full text-left"
              >
                <User className="w-4 h-4" />
                [Debug] Add Staff Role
              </button>

              {/* Temporary debug button to test manager role */}
              <button
                onClick={() => {
                  addMockManagerRole();
                  setIsDropdownOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 transition-colors w-full text-left"
              >
                <User className="w-4 h-4" />
                [Debug] Add Manager Role
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 pt-1">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>

            {/* Japanese Motivation */}
            <div className="border-t border-gray-100 pt-2 pb-1">
              <div className="px-4 py-2 text-center">
                <div className="text-lg mb-1">🎌</div>
                <p className="text-xs text-gray-600">
                  <span className="font-medium text-red-600">頑張って!</span> (Ganbatte!)
                </p>
                <p className="text-xs text-gray-500 mt-1">Cố lên nhé!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Not logged in - show login/register buttons
  return (
    <div className="flex items-center gap-3">
      <Link 
        to="/login" 
        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
      >
        Đăng nhập
      </Link>

      <Link
        to="/register"
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        Đăng ký
      </Link>
    </div>
  )
};
