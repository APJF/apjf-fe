import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Users, UserPlus, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import AdminNavigation from '../../components/layout/AdminNavigation'
import { AdminService, type AdminStatsData, type AdminUser } from '../../services/adminService'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'

interface DashboardStats {
  totalUsers: number
  newUsersThisMonth: number
  newUsersLastMonth: number
  registrationGrowthRate: number
}

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    newUsersThisMonth: 0,
    newUsersLastMonth: 0,
    registrationGrowthRate: 0,
  })
  
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [statsData, setStatsData] = useState<AdminStatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(2025)

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch both users and stats in parallel
        const [usersData, statsResponse] = await Promise.all([
          AdminService.getAllUsers(),
          AdminService.getUserStats()
        ])
        
        setAllUsers(usersData)
        setStatsData(statsResponse)
        
        // Calculate dashboard stats from API data only
        const currentDate = new Date()
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
        const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
        const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
        
        const currentMonthData = statsResponse.userMonth.find(item => item.month === currentMonth)
        const lastMonthData = statsResponse.userMonth.find(item => item.month === lastMonthStr)
        
        // Calculate ratio of enabled vs total users for estimation
        const enabledUsers = usersData.filter(user => user.enabled).length
        const totalUsersFromList = usersData.length
        const enabledRatio = enabledUsers > 0 ? enabledUsers / totalUsersFromList : 1
        
        // Use totalUsers (includes all users) instead of totalEnabledUsers (only enabled users)
        // If totalUsers is not available, estimate it from totalEnabledUsers
        const newUsersThisMonth = currentMonthData?.totalUsers ?? 
          (currentMonthData?.totalEnabledUsers ? Math.round(currentMonthData.totalEnabledUsers / enabledRatio) : 0)
        const newUsersLastMonth = lastMonthData?.totalUsers ?? 
          (lastMonthData?.totalEnabledUsers ? Math.round(lastMonthData.totalEnabledUsers / enabledRatio) : 0)
        
        const growthRate = newUsersLastMonth > 0 
          ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100 
          : 0
        
        setStats({
          // Use total from allUsers.length if it's more accurate than API stats
          // This includes both enabled and disabled users
          totalUsers: Math.max(statsResponse.totalUser, usersData.length) + 1,
          newUsersThisMonth,
          newUsersLastMonth,
          registrationGrowthRate: parseFloat(growthRate.toFixed(1))
        })
        
        console.debug('API statsResponse:', statsResponse)
        console.debug('Fetched allUsers:', usersData)
        console.debug('Total users from API vs fetched users:', statsResponse.totalUser, usersData.length)
        console.debug('Enabled/Disabled ratio:', {
          enabled: enabledUsers,
          total: totalUsersFromList,
          ratio: enabledRatio
        })
        console.debug('Current month data:', currentMonthData)
        console.debug('New users this month calculation:', {
          totalUsers: currentMonthData?.totalUsers,
          totalEnabledUsers: currentMonthData?.totalEnabledUsers,
          estimated: currentMonthData?.totalEnabledUsers ? Math.round(currentMonthData.totalEnabledUsers / enabledRatio) : 0,
          using: newUsersThisMonth
        })
        
      } catch (err) {
        console.error('Error fetching admin data:', err)
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Prepare monthly registration data for chart
  const monthlyRegistrationData = useMemo(() => {
    if (!statsData || !allUsers.length) return []
    
    // Calculate ratio of enabled vs total users for estimation
    const enabledUsers = allUsers.filter(user => user.enabled).length
    const totalUsersFromList = allUsers.length
    const enabledRatio = enabledUsers > 0 ? enabledUsers / totalUsersFromList : 1
    
    return statsData.userMonth
      .filter(item => item.month.startsWith(selectedYear.toString()))
      .map(item => {
        const [, month] = item.month.split('-')
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return {
          month: monthNames[parseInt(month) - 1],
          // Use totalUsers or estimate from totalEnabledUsers
          registrations: item.totalUsers ?? Math.round(item.totalEnabledUsers / enabledRatio),
          fullMonth: item.month
        }
      })
  }, [statsData, selectedYear, allUsers])

  // Calculate cumulative growth trend data
  const growthTrendData = useMemo(() => {
    if (!statsData || !allUsers.length) return []
    
    // Calculate ratio of enabled vs total users for estimation
    const enabledUsers = allUsers.filter(user => user.enabled).length
    const totalUsersFromList = allUsers.length
    const enabledRatio = enabledUsers > 0 ? enabledUsers / totalUsersFromList : 1
    
    const yearData = statsData.userMonth
      .filter(item => item.month.startsWith(selectedYear.toString()))
      .sort((a, b) => a.month.localeCompare(b.month))
    
    let cumulative = 0
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    return yearData.map(item => {
      // Use totalUsers or estimate from totalEnabledUsers
      cumulative += item.totalUsers ?? Math.round(item.totalEnabledUsers / enabledRatio)
      const [, month] = item.month.split('-')
      return {
        month: monthNames[parseInt(month) - 1],
        total: cumulative,
        fullMonth: item.month
      }
    })
  }, [statsData, selectedYear, allUsers])

  // User type distribution
  const userTypeData = useMemo(() => {
    if (!allUsers.length) return []
    
    // Remove duplicates by id
    const uniqueUsersMap = new Map<number, AdminUser>()
    allUsers.forEach(user => {
      if (user?.id != null) uniqueUsersMap.set(user.id, user)
    })
    const uniqueUsers = Array.from(uniqueUsersMap.values())
    
    // Determine highest role for each user (Admin > Manager > Staff > User)
    const distribution = uniqueUsers.reduce((acc, user) => {
      const roles = (user.authorities || []).map(role => 
        typeof role === 'string' ? role.replace(/^ROLE_/, '').toUpperCase() : role
      )
      
      // Priority: Admin > Manager > Staff > User (default)
      if (roles.includes('ADMIN')) {
        acc.admin += 1
      } else if (roles.includes('MANAGER')) {
        acc.manager += 1
      } else if (roles.includes('STAFF')) {
        acc.staff += 1
      } else {
        acc.student += 1 // Default role (USER/student)
      }
      return acc
    }, { student: 0, staff: 0, manager: 0, admin: 0 })
    
    // Add +1 to admin count for current logged-in admin (not listed in getAllUsers)
    distribution.admin += 1
    
    console.debug('User role distribution:', distribution)
    console.debug('Sample user authorities:', uniqueUsers.slice(0, 3).map(u => ({ id: u.id, authorities: u.authorities })))
    
    return [
      { name: 'Học sinh', value: distribution.student, color: '#8B5CF6' }, // Purple
      { name: 'Nhân viên', value: distribution.staff, color: '#06B6D4' }, // Cyan  
      { name: 'Quản lý', value: distribution.manager, color: '#F59E0B' }, // Amber
      { name: 'Admin', value: distribution.admin, color: '#EF4444' }, // Red
    ].filter(item => item.value > 0)
  }, [allUsers])

  // Available years for selection
  const availableYears = useMemo(() => {
    if (!statsData) return [2025]
    
    const years = new Set(
      statsData.userMonth.map(item => parseInt(item.month.split('-')[0]))
    )
    return Array.from(years).sort((a, b) => b - a)
  }, [statsData])

  const isGrowthPositive = stats.registrationGrowthRate > 0

  if (isLoading) {
    return (
      <AdminNavigation currentPage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </AdminNavigation>
    )
  }

  if (error) {
    return (
      <AdminNavigation currentPage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </AdminNavigation>
    )
  }

  return (
    <AdminNavigation currentPage="dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Tổng quan về người dùng và thống kê hệ thống</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Tổng số người dùng</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-purple-600">Tổng số tài khoản trong hệ thống</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800">Đăng ký mới tháng này</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900">{stats.newUsersThisMonth}</div>
              <p className="text-xs text-emerald-600">So với tháng trước: {stats.newUsersLastMonth} người</p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${isGrowthPositive ? 'from-blue-50 to-indigo-50 border-blue-200' : 'from-red-50 to-rose-50 border-red-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isGrowthPositive ? 'text-blue-800' : 'text-red-800'}`}>Tỷ lệ tăng trưởng</CardTitle>
              <div className={`w-8 h-8 bg-gradient-to-br ${isGrowthPositive ? 'from-blue-500 to-indigo-500' : 'from-red-500 to-rose-500'} rounded-lg flex items-center justify-center`}>
                {isGrowthPositive ? (
                  <TrendingUp className="h-4 w-4 text-white" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-white" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isGrowthPositive ? "text-blue-900" : "text-red-900"}`}>
                {isGrowthPositive ? "+" : ""}
                {stats.registrationGrowthRate}%
              </div>
              <p className={`text-xs ${isGrowthPositive ? 'text-blue-600' : 'text-red-600'}`}>So với tháng trước</p>
            </CardContent>
          </Card>
        </div>

        {/* Year Selection */}
        <div className="flex items-center gap-4 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
          <Calendar className="h-5 w-5 text-purple-600" />
          <label htmlFor="year-select" className="text-sm font-medium text-gray-700">Chọn năm xem thống kê:</label>
          <select 
            id="year-select"
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Registration Chart */}
          <Card className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-sm"></div>
                </div>
                Biểu đồ đăng ký theo tháng ({selectedYear})
              </CardTitle>
              <p className="text-blue-100 text-sm">Số lượng người dùng đăng ký mới mỗi tháng</p>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRegistrationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis dataKey="month" stroke="#6366f1" />
                  <YAxis stroke="#6366f1" />
                  <Tooltip 
                    formatter={(value) => [value, "Đăng ký mới"]} 
                    labelFormatter={(label) => `Tháng ${label}`}
                    contentStyle={{ 
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="registrations" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Type Distribution */}
          <Card className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="h-3 w-3 text-white" />
                </div>
                Phân bố loại người dùng
              </CardTitle>
              <p className="text-purple-100 text-sm">Tỷ lệ các loại tài khoản trong hệ thống</p>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {userTypeData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [value, "Người dùng"]}
                    contentStyle={{ 
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* User Growth Trend */}
        <Card className="bg-gradient-to-br from-emerald-50/50 to-cyan-50/50 border-emerald-200">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-white" />
              </div>
              Xu hướng tăng trưởng người dùng ({selectedYear})
            </CardTitle>
            <p className="text-emerald-100 text-sm">Tổng số người dùng tích lũy theo thời gian</p>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                <XAxis dataKey="month" stroke="#059669" />
                <YAxis stroke="#059669" />
                <Tooltip 
                  formatter={(value) => [value, "Tổng người dùng"]} 
                  labelFormatter={(label) => `Tháng ${label}`}
                  contentStyle={{ 
                    backgroundColor: '#f0fdfa',
                    border: '1px solid #a7f3d0',
                    borderRadius: '8px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="url(#lineGradient)"
                  strokeWidth={4}
                  dot={{ fill: "#10b981", strokeWidth: 3, r: 6, stroke: "#ffffff" }}
                  activeDot={{ r: 8, stroke: "#10b981", strokeWidth: 2, fill: "#ffffff" }}
                />
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AdminNavigation>
  )
}

export default AdminDashboardPage
