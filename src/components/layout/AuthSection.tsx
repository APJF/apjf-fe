import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, Settings, BookOpen, ChevronDown } from 'lucide-react';

interface UserData {
  id: number
  username: string
  avatar?: string
  roles?: string[]
}

export const AuthSection: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Check authentication status on component mount and route changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem("token")
      const userData = localStorage.getItem("user")

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData)
          if (parsedUser?.username) {
            setUser(parsedUser)
            setIsLoggedIn(true)
          } else {
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            setIsLoggedIn(false)
            setUser(null)
          }
        } catch {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          setIsLoggedIn(false)
          setUser(null)
        }
      } else {
        setIsLoggedIn(false)
        setUser(null)
      }
    }

    // Check immediately
    checkAuthStatus()

    // Also check periodically to catch any missed changes
    const interval = setInterval(checkAuthStatus, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [location]) // Re-run when location changes

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setIsLoggedIn(false)
    setUser(null)
    setIsDropdownOpen(false)
    
    // Trigger custom event để cập nhật auth state
    window.dispatchEvent(new Event('authStateChanged'))
    
    navigate("/")
  }

  const getAvatarText = (username: string) => {
    return username?.charAt(0)?.toUpperCase() || 'U'
  }

  if (isLoggedIn && user) {
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
