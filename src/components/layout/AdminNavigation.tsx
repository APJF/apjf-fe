import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn, getAvatarText } from '../../lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Menu, 
  X, 
  LogOut, 
  Home,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface AdminNavigationProps {
  children: React.ReactNode
  currentPage: "dashboard" | "accounts" | "settings" | "activity" | "reports"
}

const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
    description: "Overview and statistics",
  },
  {
    id: "accounts",
    label: "Account Management",
    icon: Users,
    href: "/admin/accounts",
    description: "Manage user accounts and roles",
  }//,
  // {
  //   id: "activity",
  //   label: "Activity Logs",
  //   icon: Activity,
  //   href: "/admin/activity",
  //   description: "System activity and audit trail",
  // },
  // {
  //   id: "reports",
  //   label: "Reports",
  //   icon: FileText,
  //   href: "/admin/reports",
  //   description: "Generate system reports",
  // },
  // {
  //   id: "settings",
  //   label: "System Settings",
  //   icon: Settings,
  //   href: "/admin/settings",
  //   description: "Configure system settings",
  // },
]

const AdminNavigation: React.FC<AdminNavigationProps> = ({ children, currentPage }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="flex w-full">
        {/* Desktop Sidebar */}
        <div className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-50 transition-all duration-300",
          isCollapsed ? "lg:w-16" : "lg:w-64"
        )}>
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
                  <p className="text-xs text-gray-500">System Management</p>
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
                      alt={user?.username || 'Admin'}
                      className="w-full h-full rounded-full object-cover"
                      onError={() => setAvatarError(true)}
                      onLoad={() => setAvatarError(false)}
                    />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full">
                      {getAvatarText(user?.username || 'Admin')}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{user?.username || 'Admin User'}</p>
                  <p className="text-sm text-gray-600 truncate">{user?.email || 'admin@example.com'}</p>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Admin
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            

            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                    isActive 
                      ? "bg-red-50 text-red-700 border border-red-200" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5" />
                  {!isCollapsed && (
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  )}
                </button>
              )
            })}
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
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
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
                        alt={user?.username || 'Admin'}
                        className="w-full h-full rounded-full object-cover"
                        onError={() => setAvatarError(true)}
                        onLoad={() => setAvatarError(false)}
                      />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full">
                        {getAvatarText(user?.username || 'Admin')}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user?.username || 'Admin User'}</p>
                    <p className="text-sm text-gray-600 truncate">{user?.email || 'admin@example.com'}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                      Admin
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <button
                  onClick={handleGoHome}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  ← Back to Main Site
                </button>
              </div>

              <nav className="space-y-2 mb-6">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(item.href)
                        setIsMobileMenuOpen(false)
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                        isActive 
                          ? "bg-red-50 text-red-700 border border-red-200" 
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </button>
                  )
                })}
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
        <div className={cn("w-full transition-all duration-300", 
          isCollapsed ? "lg:ml-16" : "lg:ml-64"
        )}>
          <div className="pt-16 lg:pt-0 min-h-screen w-full">
            {/* Top Bar */}
            <div className="bg-white shadow-sm border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {isCollapsed && (
                    <button onClick={() => setIsCollapsed(false)} className="lg:hidden">
                      <Menu className="h-4 w-4" />
                    </button>
                  )}

                  <div className="hidden md:block">
                    <nav className="flex space-x-1">
                      <span className="text-gray-500">Admin</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-900 font-medium">
                        {navigationItems.find((item) => item.id === currentPage)?.label}
                      </span>
                    </nav>
                  </div>
                </div>

                {/* User Info - Right side */}
                <div className="flex items-center space-x-4">
                  {/* Remove System Online badge and Last updated time */}
                </div>
              </div>
            </div>

            {/* Page Content */}
            <main className="p-6 w-full">{children}</main>
          </div>
        </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <button 
          type="button"
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsMobileMenuOpen(false)
            }
          }}
          aria-label="Close sidebar"
        />
      )}
      </div>
    </div>
  )
}

export default AdminNavigation
