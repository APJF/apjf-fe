import React, { useState, useEffect } from 'react'
import { Badge } from '../../components/ui/Badge'
import { AdminService } from '../../services/adminService'
import type { AdminUser } from '../../services/adminService'
import { useToast } from '../../hooks/useToast'
import AdminNavigation from '../../components/layout/AdminNavigation'

// Types
interface FilterOptions {
  search: string
  status: 'all' | 'active' | 'inactive' | 'unverified'
  role: 'all' | 'ROLE_USER' | 'ROLE_STAFF' | 'ROLE_MANAGER' | 'ROLE_ADMIN'
}

interface UserDetailModalProps {
  user: AdminUser
  onClose: () => void
}

interface EditUserModalProps {
  user: AdminUser
  authorities: string[]
  onSave: (userId: number, newAuthorities: string[]) => void
  onCancel: () => void
}

// User Detail Modal Component
const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose }) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Chi tiết tài khoản</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-1 rounded"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Avatar section */}
          <div className="flex flex-col items-center mb-6 pb-6 border-b border-gray-200">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-purple-200 overflow-hidden bg-gray-100">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mt-3">{user.username}</h3>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex gap-2 mt-2">
              {user.authorities.map((auth) => (
                <Badge key={auth} variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700">
                  {auth.replace('ROLE_', '')}
                </Badge>
              ))}
            </div>
          </div>

          {/* User details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">ID</div>
                <p className="text-sm text-gray-900 font-semibold">{user.id}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">Username</div>
                <p className="text-sm text-gray-900 font-semibold">{user.username}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">Email</div>
                <p className="text-sm text-gray-900 font-semibold">{user.email}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">Số điện thoại</div>
                <p className="text-sm text-gray-900 font-semibold">{user.phone || 'Chưa cập nhật'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                <div className="text-sm font-medium text-gray-700 mb-2">Trạng thái</div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={user.enabled ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}>
                    {user.enabled ? 'Đang hoạt động' : 'Đã khóa'}
                  </Badge>
                  <Badge className={user.emailVerified ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-yellow-100 text-yellow-800 border-yellow-200"}>
                    {user.emailVerified ? 'Email đã xác thực' : 'Email chưa xác thực'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

// Edit User Modal Component
const EditUserModal: React.FC<EditUserModalProps> = ({ user, authorities, onSave, onCancel }) => {
  const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>(authorities)
  
  const availableRoles = [
    { value: 'ROLE_STAFF', label: 'Staff' },
    { value: 'ROLE_MANAGER', label: 'Manager' }
  ]

  // Kiểm tra xem user có được cấp quyền bằng tay trong database không
  const hasManualPermissions = authorities.includes('ROLE_MANAGER') && authorities.includes('ROLE_STAFF')

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  const handleSave = () => {
    // Luôn đảm bảo có ROLE_USER
    const finalAuthorities = ['ROLE_USER', ...selectedAuthorities.filter(auth => auth !== 'ROLE_USER')]
    onSave(user.id, finalAuthorities)
  }

  const handleRoleChange = (role: string, checked: boolean) => {
    if (!hasManualPermissions) {
      // Logic cho account thường: chỉ cho phép 1 trong 2 (STAFF hoặc MANAGER)
      if (checked) {
        // Nếu chọn role này, bỏ chọn role kia
        setSelectedAuthorities(prev => {
          const filtered = prev.filter(auth => !['ROLE_STAFF', 'ROLE_MANAGER'].includes(auth))
          return [...filtered, role]
        })
      } else {
        // Nếu bỏ chọn role này
        setSelectedAuthorities(prev => prev.filter(auth => auth !== role))
      }
    } else {
      // Logic cho account có quyền bằng tay: cho phép tích cả 2
      setSelectedAuthorities(prev => 
        checked 
          ? [...prev, role]
          : prev.filter(auth => auth !== role)
      )
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Chỉnh sửa quyền hạn</h2>
            <button
              onClick={onCancel}
              className="text-white hover:bg-white/20 p-1 rounded"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-200 overflow-hidden bg-gray-100">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-lg font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-lg font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user.username}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="text-sm font-medium text-gray-700 mb-3">Quyền hạn:</div>
            
            {/* USER role - always selected, disabled */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <label className="flex items-center cursor-not-allowed">
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  className="rounded border-gray-300 text-indigo-600 opacity-50 cursor-not-allowed"
                />
                <span className="ml-3 text-sm text-gray-500">User (Mặc định)</span>
              </label>
            </div>

            {/* Available roles */}
            {availableRoles.map((role) => (
              <div key={role.value} className="bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAuthorities.includes(role.value)}
                    onChange={(e) => handleRoleChange(role.value, e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  <span className="ml-3 text-sm text-gray-700 font-medium">{role.label}</span>
                </label>
              </div>
            ))}

            {hasManualPermissions && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p className="text-xs text-yellow-700">
                  ⚠️ Tài khoản này có quyền được cấp sẵn trong hệ thống
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  )
}

export const AdminManageAccountPage: React.FC = () => {
  const { showToast } = useToast()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([])
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: 'all',
    role: 'all'
  })
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users based on current filters
  useEffect(() => {
    const filtered = users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
                          user.email.toLowerCase().includes(filters.search.toLowerCase())
      
      let matchesStatus = false
      switch(filters.status) {
        case 'all':
          matchesStatus = true
          break
        case 'active':
          matchesStatus = user.enabled && user.emailVerified
          break
        case 'inactive':
          matchesStatus = !user.enabled
          break
        case 'unverified':
          matchesStatus = !user.emailVerified
          break
        default:
          matchesStatus = true
      }
      
      const matchesRole = filters.role === 'all' || user.authorities.includes(filters.role)
      return matchesSearch && matchesStatus && matchesRole
    })

    setFilteredUsers(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [users, filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await AdminService.getAllUsers()
      setUsers(data)
    } catch (error: any) {
      console.error('Error fetching users:', error)
      showToast('error', 'Lỗi khi tải danh sách người dùng: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleViewUser = (user: AdminUser) => {
    setViewingUser(user)
    setShowDetailModal(true)
  }

  const handleUpdateUserStatus = async (userId: number, enabled: boolean) => {
    try {
      const reason = enabled ? 'Mở khóa tài khoản' : 'Khóa tài khoản'
      await AdminService.updateUserStatus({ userId, enabled, reason })
      
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, enabled }
          : user
      ))
      
      showToast('success', `Đã ${enabled ? 'mở khóa' : 'khóa'} tài khoản thành công`)
    } catch (error: any) {
      console.error('Error updating user status:', error)
      showToast('error', 'Lỗi khi cập nhật trạng thái: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleUpdateUserAuthorities = async (userId: number, newAuthorities: string[]) => {
    try {
      // Chuyển đổi từ role strings sang role IDs
      const authorityIds = newAuthorities.map(roleString => getRoleIdFromString(roleString))
      
      await AdminService.updateUserAuthorities({ userId, authorityIds })
      
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, authorities: newAuthorities }
          : user
      ))
      
      showToast('success', 'Cập nhật quyền hạn thành công')
      setShowEditModal(false)
      setEditingUser(null)
    } catch (error: any) {
      console.error('Error updating user authorities:', error)
      showToast('error', 'Lỗi khi cập nhật quyền hạn: ' + (error.response?.data?.message || error.message))
    }
  }

  // Helper functions
  const getRoleIdFromString = (roleString: string): number => {
    switch (roleString) {
      case 'ROLE_USER': return 1
      case 'ROLE_STAFF': return 2
      case 'ROLE_MANAGER': return 3
      case 'ROLE_ADMIN': return 4
      default: return 1 // Default to USER role
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

  const getStatusBadge = (user: AdminUser) => {
    if (!user.emailVerified) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Chưa xác thực email</Badge>
    } else if (user.enabled) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Đang hoạt động</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Đã khóa</Badge>
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  if (loading) {
    return (
      <AdminNavigation currentPage="accounts">
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      </AdminNavigation>
    )
  }

  return (
    <AdminNavigation currentPage="accounts">
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-xl shadow-lg">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-blue-900">Quản Lý Tài Khoản</h1>
                  <p className="text-blue-600 font-medium mt-1">
                    Quản lý người dùng và phân quyền hệ thống
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {/* Filters */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border-0 mb-8">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-lg">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-blue-900">Bộ lọc và tìm kiếm</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo username hoặc email..."
                    className="w-full pl-10 p-3 border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>

                {/* Status filter */}
                <div>
                  <select
                    className="w-full p-3 border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as FilterOptions['status'] }))}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Đã khóa</option>
                    <option value="unverified">Chưa xác thực email</option>
                  </select>
                </div>

                {/* Role filter */}
                <div>
                  <select
                    className="w-full p-3 border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                    value={filters.role}
                    onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value as FilterOptions['role'] }))}
                  >
                    <option value="all">Tất cả quyền hạn</option>
                    <option value="ROLE_USER">User</option>
                    <option value="ROLE_STAFF">Staff</option>
                    <option value="ROLE_MANAGER">Manager</option>
                    <option value="ROLE_ADMIN">Admin</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Users table */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border-0 overflow-hidden">
            <div className="overflow-x-auto">
              {/* Table Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <div className="grid grid-cols-10 gap-4 px-6 py-4 text-sm font-medium">
                  <div className="col-span-4">Người dùng</div>
                  <div className="col-span-2">Quyền hạn</div>
                  <div className="col-span-2">Trạng thái</div>
                  <div className="col-span-2">Thao tác</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-blue-100">
                {currentUsers.map((user) => (
                  <div key={user.id} className="grid grid-cols-10 gap-4 px-6 py-4 hover:bg-blue-50/50 transition-colors">
                    <div className="col-span-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-full border-2 border-purple-200 overflow-hidden bg-gray-100">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.username}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg font-bold">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="hidden w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center">
                      {getRoleBadge(user.authorities)}
                    </div>
                    <div className="col-span-2 flex items-center">
                      {getStatusBadge(user)}
                    </div>
                    <div className="col-span-2 flex items-center space-x-3">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 transition-colors"
                        title="Xem chi tiết"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {!user.authorities.includes('ROLE_ADMIN') && (
                        <>
                          <button
                            onClick={() => {
                              setEditingUser(user)
                              setShowEditModal(true)
                            }}
                            className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-100 transition-colors"
                            title="Chỉnh sửa quyền"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleUpdateUserStatus(user.id, !user.enabled)}
                            className={`p-2 rounded-full transition-colors ${
                              user.enabled 
                                ? 'text-red-600 hover:text-red-900 hover:bg-red-100' 
                                : 'text-green-600 hover:text-green-900 hover:bg-green-100'
                            }`}
                            title={user.enabled ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {user.enabled ? (
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-blue-50/50 border-t border-blue-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Sau
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Hiển thị <span className="font-medium">{startIndex + 1}</span> đến{' '}
                        <span className="font-medium">{Math.min(endIndex, filteredUsers.length)}</span> trong tổng số{' '}
                        <span className="font-medium">{filteredUsers.length}</span> kết quả
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Trước
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Sau
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {showDetailModal && viewingUser && (
        <UserDetailModal
          user={viewingUser}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          authorities={editingUser.authorities}
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
