import React, { useState, useEffect } from 'react'
import AdminNavigation from '../../components/layout/AdminNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { AdminService, type AdminUser, type Authority } from '../../services/adminService'
import { useToast } from '../../hooks/useToast'
import { 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Shield, 
  User, 
  Users,
  Eye,
  X,
  Settings
} from 'lucide-react'

interface FilterOptions {
  status: 'all' | 'active' | 'inactive'
  role: 'all' | 'ROLE_USER' | 'ROLE_STAFF' | 'ROLE_MANAGER' | 'ROLE_ADMIN'
  search: string
}

interface EditUserModalProps {
  user: AdminUser
  authorities: Authority[]
  onSave: (userId: number, authorities: string[]) => void
  onCancel: () => void
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, authorities, onSave, onCancel }) => {
  const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>(user.authorities)

  const handleAuthorityToggle = (authorityId: string) => {
    setSelectedAuthorities(prev => 
      prev.includes(authorityId)
        ? prev.filter(id => id !== authorityId)
        : [...prev, authorityId]
    )
  }

  const handleSave = () => {
    onSave(user.id, selectedAuthorities)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Chỉnh sửa quyền hạn</h3>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <div className="font-medium">{user.username}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quyền hạn:
          </label>
          <div className="space-y-2">
            {authorities.map(authority => (
              <label key={authority.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedAuthorities.includes(authority.authority)}
                  onChange={() => handleAuthorityToggle(authority.authority)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500 mr-2"
                />
                <span className="text-sm">
                  {authority.authority === 'ROLE_USER' ? 'Người dùng' :
                   authority.authority === 'ROLE_STAFF' ? 'Nhân viên' :
                   authority.authority === 'ROLE_MANAGER' ? 'Quản lý' :
                   authority.authority === 'ROLE_ADMIN' ? 'Quản trị viên' :
                   authority.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700">
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  )
}

export const AdminManageAccountPage: React.FC = () => {
  const { showToast } = useToast()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [authorities, setAuthorities] = useState<Authority[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([])
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    role: 'all',
    search: ''
  })
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersData, authoritiesData] = await Promise.all([
        AdminService.getAllUsers(),
        AdminService.getAllAuthorities()
      ])
      setUsers(usersData)
      setAuthorities(authoritiesData)
    } catch (error: any) {
      console.error('Error loading data:', error)
      showToast('error', 'Lỗi khi tải dữ liệu: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  // Filter users based on current filters
  useEffect(() => {
    const filtered = users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
                          user.email.toLowerCase().includes(filters.search.toLowerCase())
      const matchesStatus = filters.status === 'all' || 
                           (filters.status === 'active' && user.enabled) ||
                           (filters.status === 'inactive' && !user.enabled)
      const matchesRole = filters.role === 'all' || user.authorities.includes(filters.role)
      return matchesSearch && matchesStatus && matchesRole
    })

    setFilteredUsers(filtered)
  }, [users, filters])

  const handleToggleUserStatus = async (user: AdminUser) => {
    try {
      const reason = user.enabled ? 'Tạm khóa tài khoản' : 'Mở khóa tài khoản'
      await AdminService.updateUserStatus({
        userId: user.id,
        enabled: !user.enabled,
        reason
      })
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === user.id 
          ? { ...u, enabled: !u.enabled }
          : u
      ))
      
      showToast('success', user.enabled ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản')
    } catch (error: any) {
      console.error('Error updating user status:', error)
      showToast('error', 'Lỗi khi cập nhật trạng thái: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user)
    setShowEditModal(true)
  }

  const handleUpdateUserAuthorities = async (userId: number, newAuthorities: string[]) => {
    try {
      await AdminService.updateUserAuthorities({
        userId,
        authorityIds: newAuthorities
      })
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, authorities: newAuthorities }
          : u
      ))
      
      showToast('success', 'Đã cập nhật quyền hạn thành công')
      setShowEditModal(false)
      setEditingUser(null)
    } catch (error: any) {
      console.error('Error updating user authorities:', error)
      showToast('error', 'Lỗi khi cập nhật quyền hạn: ' + (error.response?.data?.message || error.message))
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

  const handleBulkStatusUpdate = async (enabled: boolean) => {
    try {
      const reason = enabled ? 'Mở khóa hàng loạt' : 'Khóa hàng loạt'
      
      await Promise.all(
        selectedUsers.map(userId => 
          AdminService.updateUserStatus({ userId, enabled, reason })
        )
      )
      
      // Update local state
      setUsers(prev => prev.map(user => 
        selectedUsers.includes(user.id)
          ? { ...user, enabled }
          : user
      ))
      
      setSelectedUsers([])
      showToast('success', `Đã ${enabled ? 'mở khóa' : 'khóa'} ${selectedUsers.length} tài khoản`)
    } catch (error: any) {
      console.error('Error bulk updating user status:', error)
      showToast('error', 'Lỗi khi cập nhật hàng loạt: ' + (error.response?.data?.message || error.message))
    }
  }

  const getRoleBadge = (authorities: string[]) => {
    if (authorities.includes('ROLE_ADMIN')) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Admin</Badge>
    } else if (authorities.includes('ROLE_MANAGER')) {
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Manager</Badge>
    } else if (authorities.includes('ROLE_STAFF')) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Staff</Badge>
    } else if (authorities.includes('ROLE_USER')) {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">User</Badge>
    } else {
      return <Badge variant="outline">No Role</Badge>
    }
  }

  const getStatusBadge = (enabled: boolean, emailVerified: boolean) => {
    if (!enabled) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Bị khóa</Badge>
    } else if (!emailVerified) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Chưa xác thực</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Hoạt động</Badge>
    }
  }

  if (loading) {
    return (
      <AdminNavigation currentPage="accounts">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Đang tải dữ liệu...</div>
        </div>
      </AdminNavigation>
    )
  }

  return (
    <AdminNavigation currentPage="accounts">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý tài khoản</h1>
            <p className="text-gray-600 mt-1">Quản lý tài khoản người dùng, quyền hạn và trạng thái</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng số người dùng</p>
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
                  <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
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
                  <p className="text-sm font-medium text-gray-600">Bị khóa</p>
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
                  <p className="text-sm font-medium text-gray-600">Quản trị viên</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {users.filter(u => u.authorities.includes('ROLE_ADMIN')).length}
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
              <CardTitle>Danh sách tài khoản</CardTitle>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Bộ lọc</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Tìm kiếm theo email hoặc tên người dùng..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                  <select
                    id="status-filter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as FilterOptions['status'] }))}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Bị khóa</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-2">Quyền hạn</label>
                  <select
                    id="role-filter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={filters.role}
                    onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value as FilterOptions['role'] }))}
                  >
                    <option value="all">Tất cả quyền hạn</option>
                    <option value="ROLE_USER">Người dùng</option>
                    <option value="ROLE_STAFF">Nhân viên</option>
                    <option value="ROLE_MANAGER">Quản lý</option>
                    <option value="ROLE_ADMIN">Quản trị viên</option>
                  </select>
                </div>
              </div>
            )}

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-blue-800 font-medium">
                  Đã chọn {selectedUsers.length} người dùng
                </span>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkStatusUpdate(true)}
                  >
                    Mở khóa
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkStatusUpdate(false)}
                  >
                    Khóa
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
                    <th className="text-left p-4 font-medium text-gray-900">Người dùng</th>
                    <th className="text-left p-4 font-medium text-gray-900">Trạng thái</th>
                    <th className="text-left p-4 font-medium text-gray-900">Quyền hạn</th>
                    <th className="text-left p-4 font-medium text-gray-900">Xác thực email</th>
                    <th className="text-left p-4 font-medium text-gray-900">Thao tác</th>
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
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                            {user.avatar && user.avatar !== 'https://engineering.usask.ca/images/no_avatar.jpg' ? (
                              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <User className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.username}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.phone && (
                              <div className="text-sm text-gray-500">{user.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(user.enabled, user.emailVerified)}</td>
                      <td className="p-4">{getRoleBadge(user.authorities)}</td>
                      <td className="p-4">
                        {user.emailVerified ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Đã xác thực</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Chưa xác thực</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="ghost" className="p-1">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="p-1"
                            onClick={() => handleEditUser(user)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="p-1"
                            onClick={() => handleToggleUserStatus(user)}
                          >
                            {user.enabled ? <UserX className="h-4 w-4 text-red-600" /> : <UserCheck className="h-4 w-4 text-green-600" />}
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy người dùng nào</h3>
                  <p className="text-gray-500">Thử điều chỉnh tiêu chí tìm kiếm hoặc bộ lọc của bạn.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <EditUserModal
            user={editingUser}
            authorities={authorities}
            onSave={handleUpdateUserAuthorities}
            onCancel={() => {
              setShowEditModal(false)
              setEditingUser(null)
            }}
          />
        )}
      </div>
    </AdminNavigation>
  )
}

export default AdminManageAccountPage
