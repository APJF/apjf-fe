import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, BookOpen, ChevronDown, History, Shield, Users, Crown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const AuthSection: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [dropdownAvatarError, setDropdownAvatarError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Debug log để kiểm tra user data và reset avatar error khi user thay đổi
  useEffect(() => {
    // Reset avatar error states when user changes
    setAvatarError(false);
    setDropdownAvatarError(false);
    
    // Only log on significant changes or errors
    if (!user && localStorage.getItem('userInfo')) {
      console.log('AuthSection: User is null but localStorage has data');
    }
    if (user?.avatar) {
      console.log('AuthSection: User avatar URL:', user.avatar);
    }
    
    // Debug roles/authorities
    if (user) {
      console.log('AuthSection: User roles:', user.roles);
      console.log('AuthSection: User authorities:', user.authorities);
      console.log('AuthSection: hasStaffRole:', hasStaffRole());
      console.log('AuthSection: hasManagerRole:', hasManagerRole());
      console.log('AuthSection: hasAdminRole:', hasAdminRole());
    }
  }, [user]); // Track user changes including avatar

  // Function để check Staff role - sử dụng authorities từ user profile
  const hasStaffRole = () => {
    if (!user?.roles) return false;
    return user.roles.some(role => 
      role && ['ROLE_STAFF', 'ROLE_ADMIN'].includes(role)
    );
  };

  // Function để check Manager role - sử dụng authorities từ user profile
  const hasManagerRole = () => {
    if (!user?.roles) return false;
    return user.roles.some(role => 
      role && ['ROLE_MANAGER', 'ROLE_ADMIN'].includes(role)
    );
  };

  // Function để check Admin role
  const hasAdminRole = () => {
    if (!user?.roles) return false;
    return user.roles.some(role => 
      role && role === 'ROLE_ADMIN'
    );
  };

  // Debug roles sau khi user thay đổi
  useEffect(() => {
    if (user) {
      console.log('🔍 AuthSection Debug:');
      console.log('- User roles:', user.roles);
      console.log('- User authorities:', user.authorities);
      console.log('- hasStaffRole:', hasStaffRole());
      console.log('- hasManagerRole:', hasManagerRole());
      console.log('- hasAdminRole:', hasAdminRole());
    }
  }, [user]);

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

  if (user) {
    return (
      <div className="relative" ref={dropdownRef}>
        {/* User Avatar Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          {/* Avatar */}
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-medium text-sm overflow-hidden">
            {user?.avatar && !avatarError ? (
              <img
                key={user.avatar} // Force re-render when avatar changes
                src={user.avatar}
                alt={user?.username || 'User'}
                className="w-full h-full rounded-full object-cover"
                onError={() => {
                  console.error('Header avatar failed to load:', user.avatar);
                  setAvatarError(true);
                }}
                onLoad={() => {
                  console.log('Header avatar loaded successfully:', user.avatar);
                  setAvatarError(false);
                }}
              />
            ) : (
              <span className="flex items-center justify-center w-full h-full">
                {getAvatarText(user?.username || 'User')}
              </span>
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
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-medium overflow-hidden">
                  {user?.avatar && !dropdownAvatarError ? (
                    <img
                      key={user.avatar} // Force re-render when avatar changes
                      src={user.avatar}
                      alt={user?.username || 'User'}
                      className="w-full h-full rounded-full object-cover"
                      onError={() => {
                        console.error('Dropdown avatar failed to load:', user.avatar);
                        setDropdownAvatarError(true);
                      }}
                      onLoad={() => {
                        console.log('Dropdown avatar loaded successfully:', user.avatar);
                        setDropdownAvatarError(false);
                      }}
                    />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full">
                      {getAvatarText(user?.username || 'User')}
                    </span>
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

              {/* Staff Dashboard Link - chỉ hiển thị cho ROLE_STAFF và ROLE_ADMIN */}
              {hasStaffRole() && (
                <Link
                  to="/staff/dashboard"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Shield className="w-4 h-4" />
                  Staff Dashboard
                </Link>
              )}

              {/* Manager Dashboard Link - chỉ hiển thị cho ROLE_MANAGER và ROLE_ADMIN */}
              {hasManagerRole() && (
                <Link
                  to="/manager/dashboard"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Users className="w-4 h-4" />
                  Manager Dashboard
                </Link>
              )}

              {/* Admin Dashboard Link - chỉ hiển thị cho ROLE_ADMIN */}
              {hasAdminRole() && (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Crown className="w-4 h-4" />
                  Admin Dashboard
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
