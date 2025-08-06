import React, { useState, useEffect } from 'react'
import AdminNavigation from '../components/layout/AdminNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Shield, 
  User, 
  Users,
  Edit3, 
  Trash2,
  Eye,
  Plus,
  Download,
  Upload
} from 'lucide-react'

interface UserAccount {
  id: number
  email: string
  name?: string
  username?: string
  enabled: boolean
  roles: string[]
  createdAt: string
  lastLogin?: string
  avatar?: string
}

interface FilterOptions {
  status: 'all' | 'active' | 'inactive'
  role: 'all' | 'user' | 'staff' | 'admin'
  search: string
}

export const AdminManageAccountPage: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([
    {
      id: 1,
      email: "admin@example.com",
      name: "System Admin",
      username: "admin",
      enabled: true,
      roles: ["ROLE_ADMIN"],
      createdAt: "2024-01-01T00:00:00Z",
      lastLogin: "2024-01-15T10:30:00Z"
    },
    {
      id: 2,
      email: "staff@example.com",
      name: "Staff User",
      username: "staff01",
      enabled: true,
      roles: ["ROLE_STAFF"],
      createdAt: "2024-01-02T00:00:00Z",
      lastLogin: "2024-01-14T15:20:00Z"
    },
    {
      id: 3,
      email: "user@example.com",
      name: "Regular User",
      username: "user01",
      enabled: false,
      roles: ["ROLE_USER"],
      createdAt: "2024-01-03T00:00:00Z",
      lastLogin: "2024-01-10T09:15:00Z"
    },
    {
      id: 4,
      email: "manager@example.com",
      name: "Manager User",
      username: "manager01",
      enabled: true,
      roles: ["ROLE_MANAGER"],
      createdAt: "2024-01-04T00:00:00Z",
      lastLogin: "2024-01-13T14:45:00Z"
    }
  ])

  const [filteredUsers, setFilteredUsers] = useState<UserAccount[]>(users)
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    role: 'all',
    search: ''
  })
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Filter users based on current filters
  useEffect(() => {
    let filtered = users.filter(user => {
      // Status filter
      if (filters.status === 'active' && !user.enabled) return false
      if (filters.status === 'inactive' && user.enabled) return false

      // Role filter
      if (filters.role !== 'all') {
        const roleMap: Record<string, string> = {
          user: 'ROLE_USER',
          staff: 'ROLE_STAFF', 
          admin: 'ROLE_ADMIN'
        }
        if (!user.roles.includes(roleMap[filters.role])) return false
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        return (
          user.email.toLowerCase().includes(searchLower) ||
          user.name?.toLowerCase().includes(searchLower) ||
          user.username?.toLowerCase().includes(searchLower)
        )
      }

      return true
    })

    setFilteredUsers(filtered)
  }, [users, filters])

  const handleToggleUserStatus = (userId: number) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, enabled: !user.enabled }
        : user
    ))
  }

  const handleDeleteUser = (userId: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      setUsers(prev => prev.filter(user => user.id !== userId))
    }
  }

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id))
    }
  }

  const getRoleBadge = (roles: string[]) => {
    const role = roles[0] // Take first role
    switch (role) {
      case 'ROLE_ADMIN':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Admin</Badge>
      case 'ROLE_MANAGER': 
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Manager</Badge>
      case 'ROLE_STAFF':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Staff</Badge>
      case 'ROLE_USER':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">User</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusBadge = (userStatus: boolean) => {
    switch (userStatus) {
      case true:
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
      case false:
        return <Badge className="bg-red-100 text-red-800 border-red-200">Inactive</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unknown</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <AdminNavigation currentPage="accounts">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Account Management</h1>
            <p className="text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </Button>
            <Button className="flex items-center space-x-2 bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4" />
              <span>Add User</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-green-600">{users.filter(u => u.enabled).length}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive Users</p>
                  <p className="text-2xl font-bold text-red-600">{users.filter(u => !u.enabled).length}</p>
                </div>
                <UserX className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {users.filter(u => u.roles.includes('ROLE_ADMIN')).length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>User Accounts</CardTitle>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by email, name, or username..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    id="status-filter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as FilterOptions['status'] }))}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    id="role-filter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={filters.role}
                    onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value as FilterOptions['role'] }))}
                  >
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            )}

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-blue-800 font-medium">
                  {selectedUsers.length} user(s) selected
                </span>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">Enable</Button>
                  <Button size="sm" variant="outline">Disable</Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                    Delete
                  </Button>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </th>
                    <th className="text-left p-4 font-medium text-gray-900">User</th>
                    <th className="text-left p-4 font-medium text-gray-900">Status</th>
                    <th className="text-left p-4 font-medium text-gray-900">Role</th>
                    <th className="text-left p-4 font-medium text-gray-900">Created</th>
                    <th className="text-left p-4 font-medium text-gray-900">Last Login</th>
                    <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.name || user.username}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(user.enabled)}</td>
                      <td className="p-4">{getRoleBadge(user.roles)}</td>
                      <td className="p-4 text-sm text-gray-600">{formatDate(user.createdAt)}</td>
                      <td className="p-4 text-sm text-gray-600">
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="ghost" className="p-1">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="p-1">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="p-1"
                            onClick={() => handleToggleUserStatus(user.id)}
                          >
                            {user.enabled ? <UserX className="h-4 w-4 text-red-600" /> : <UserCheck className="h-4 w-4 text-green-600" />}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="p-1 text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminNavigation>
  )
}

export default AdminManageAccountPage
