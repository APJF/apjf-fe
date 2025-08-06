import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { cn } from '../../lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Shield, 
  Activity, 
  FileText, 
  Menu, 
  X, 
  LogOut, 
  User,
  Home
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
  },
  {
    id: "activity",
    label: "Activity Logs",
    icon: Activity,
    href: "/admin/activity",
    description: "System activity and audit trail",
  },
  {
    id: "reports",
    label: "Reports",
    icon: FileText,
    href: "/admin/reports",
    description: "Generate system reports",
  },
  {
    id: "settings",
    label: "System Settings",
    icon: Settings,
    href: "/admin/settings",
    description: "Configure system settings",
  },
]

const AdminNavigation: React.FC<AdminNavigationProps> = ({ children, currentPage }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-red-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
              <p className="text-xs text-gray-500">System Management</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Admin Info */}
        <div className="p-4 border-b bg-red-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{user?.username || 'Admin User'}</p>
              <p className="text-sm text-gray-600">{user?.email || 'admin@example.com'}</p>
            </div>
          </div>
          <div className="mt-2">
            <Badge className="bg-red-100 text-red-800 border-red-200">Admin</Badge>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.href)}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left",
                  isActive 
                    ? "bg-red-100 text-red-700 border border-red-200" 
                    : "text-gray-700 hover:bg-gray-100",
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

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start bg-transparent"
            onClick={handleGoHome}
          >
            <Home className="h-4 w-4 mr-2" />
            Homepage
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start bg-transparent"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn("transition-all duration-200 ease-in-out", isSidebarOpen ? "lg:ml-64" : "ml-0")}>
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                <Menu className="h-4 w-4" />
              </Button>

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

            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                System Online
              </Badge>
              <div className="text-sm text-gray-600">Last updated: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <button 
          type="button"
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsSidebarOpen(false)
            }
          }}
          aria-label="Close sidebar"
        />
      )}
    </div>
  )
}

export default AdminNavigation
