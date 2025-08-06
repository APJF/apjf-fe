import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Users, UserCheck, UserX, Shield, Activity, TrendingUp } from 'lucide-react'
import AdminNavigation from '../components/layout/AdminNavigation'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  totalAdmins: number
  recentActivity: number
  growthRate: number
}

interface RecentActivity {
  id: string
  action: string
  user: string
  timestamp: string
  type: "role_change" | "account_status" | "login" | "registration"
}

export const AdminDashboardPage: React.FC = () => {
  const [stats] = useState<DashboardStats>({
    totalUsers: 1247,
    activeUsers: 1156,
    inactiveUsers: 91,
    totalAdmins: 12,
    recentActivity: 45,
    growthRate: 12.5,
  })

  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: "1",
      action: "Role changed from User to Staff",
      user: "john.doe@example.com",
      timestamp: "2 minutes ago",
      type: "role_change",
    },
    {
      id: "2",
      action: "Account deactivated",
      user: "jane.smith@example.com",
      timestamp: "15 minutes ago",
      type: "account_status",
    },
    {
      id: "3",
      action: "New user registered",
      user: "mike.wilson@example.com",
      timestamp: "1 hour ago",
      type: "registration",
    },
    {
      id: "4",
      action: "Role changed from Staff to Manager",
      user: "sarah.johnson@example.com",
      timestamp: "2 hours ago",
      type: "role_change",
    },
    {
      id: "5",
      action: "Admin login",
      user: "admin@example.com",
      timestamp: "3 hours ago",
      type: "login",
    },
  ])

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "role_change":
        return <Shield className="h-4 w-4 text-blue-500" />
      case "account_status":
        return <UserX className="h-4 w-4 text-red-500" />
      case "login":
        return <Activity className="h-4 w-4 text-green-500" />
      case "registration":
        return <UserCheck className="h-4 w-4 text-purple-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityBadge = (type: RecentActivity["type"]) => {
    switch (type) {
      case "role_change":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            Role Change
          </Badge>
        )
      case "account_status":
        return (
          <Badge variant="outline" className="text-red-600 border-red-200">
            Account Status
          </Badge>
        )
      case "login":
        return (
          <Badge variant="outline" className="text-green-600 border-green-200">
            Login
          </Badge>
        )
      case "registration":
        return (
          <Badge variant="outline" className="text-purple-600 border-purple-200">
            Registration
          </Badge>
        )
      default:
        return <Badge variant="outline">Activity</Badge>
    }
  }

  return (
    <AdminNavigation currentPage="dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users, roles, and system overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />+{stats.growthRate}% from last month
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% of total users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.inactiveUsers}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.inactiveUsers / stats.totalUsers) * 100).toFixed(1)}% of total users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalAdmins}</div>
              <p className="text-xs text-muted-foreground">Including managers and staff</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <p className="text-sm text-muted-foreground">Latest user management activities</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                    <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{activity.user}</p>
                        {getActivityBadge(activity.type)}
                      </div>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <p className="text-sm text-muted-foreground">Key metrics and system health</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Server Status</p>
                    <p className="text-xs text-gray-600">All systems operational</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Database</p>
                    <p className="text-xs text-gray-600">Connection healthy</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Active Sessions</p>
                    <p className="text-xs text-gray-600">Current user sessions</p>
                  </div>
                  <Badge variant="outline">342</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Storage Usage</p>
                    <p className="text-xs text-gray-600">Database and files</p>
                  </div>
                  <Badge variant="outline">67%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <p className="text-sm text-muted-foreground">Common administrative tasks</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <Users className="h-8 w-8 text-blue-500 mb-2" />
                <h3 className="font-medium">Manage Users</h3>
                <p className="text-sm text-gray-600">Add, edit, or remove user accounts</p>
              </div>

              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <Shield className="h-8 w-8 text-green-500 mb-2" />
                <h3 className="font-medium">Role Management</h3>
                <p className="text-sm text-gray-600">Assign and modify user roles</p>
              </div>

              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <Activity className="h-8 w-8 text-purple-500 mb-2" />
                <h3 className="font-medium">System Logs</h3>
                <p className="text-sm text-gray-600">View detailed activity logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminNavigation>
  )
}

export default AdminDashboardPage
