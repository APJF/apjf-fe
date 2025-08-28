import { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  Award,
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  FileText,
  Target,
  BarChart3,
  Activity,
  Layers,
  File,
  ClipboardCheck,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { ManagerNavigation } from '../../components/layout/ManagerNavigation';
import ManagerApprovalRequestsPage from './ManagerApprovalRequestsPage';
import { ManagerDashboardService, type DashboardStats } from '../../services/managerDashboardService';
import { CourseService } from '../../services/courseService';
import type { Course } from '../../types/course';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

// Helper function to render stars
const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`h-4 w-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
  ))
}

// Overview Tab Component - Updated with real data
function OverviewTab() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [topRatedCourses, setTopRatedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2025);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard stats and courses in parallel
      const [dashboardResponse, coursesResponse] = await Promise.all([
        ManagerDashboardService.getDashboardStats(),
        CourseService.getCourses({})
      ]);

      if (dashboardResponse.success) {
        setDashboardStats(dashboardResponse.data);
      } else {
        throw new Error(dashboardResponse.message);
      }

      if (coursesResponse.success) {
        // Get top 5 courses with highest rating, filter out courses with no rating
        const coursesWithRating = coursesResponse.data
          .filter(course => course.averageRating && course.averageRating > 0)
          .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
          .slice(0, 5);
        setTopRatedCourses(coursesWithRating);
      } else {
        console.warn('Failed to fetch courses:', coursesResponse.message);
        setTopRatedCourses([]);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Đang tải dữ liệu dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !dashboardStats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Không thể tải dữ liệu dashboard'}</p>
        <Button onClick={fetchDashboardData} variant="outline">
          Thử lại
        </Button>
      </div>
    );
  }

  // Calculate completion rate from monthly activity
  const totalEnrollments = dashboardStats.courseMonthlyActivity.reduce((sum, month) => sum + month.totalEnrolled, 0);
  const totalCompletions = dashboardStats.courseMonthlyActivity.reduce((sum, month) => sum + month.totalCompleted, 0);
  const completionRate = totalEnrollments > 0 ? Math.round((totalCompletions / totalEnrollments) * 100) : 0;

  // Calculate average rating from top rated courses
  const avgRating = topRatedCourses.length > 0 
    ? topRatedCourses.reduce((sum, course) => sum + (course.averageRating || 0), 0) / topRatedCourses.length 
    : 0;

  // Updated styles for Manager Dashboard
  const stats = [
    { title: 'Tổng khóa học', value: dashboardStats.totalCourse.toString(), change: `${dashboardStats.totalActiveCourse} đang hoạt động`, icon: BookOpen, color: 'text-blue-600', bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100' },
    { title: 'Tổng chương', value: dashboardStats.totalChapter.toString(), change: `${dashboardStats.totalActiveChapter} đang hoạt động`, icon: Layers, color: 'text-green-600', bgColor: 'bg-gradient-to-br from-green-50 to-green-100' },
    { title: 'Tổng bài học', value: dashboardStats.totalUnit.toString(), change: `${dashboardStats.totalActiveUnit} đang hoạt động`, icon: FileText, color: 'text-purple-600', bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100' },
    { title: 'Tổng tài liệu', value: dashboardStats.totalMaterial.toString(), change: 'PDF, MP3', icon: File, color: 'text-orange-600', bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100' },
    { title: 'Tổng số exam', value: dashboardStats.totalExam.toString(), change: 'Tests', icon: ClipboardCheck, color: 'text-red-600', bgColor: 'bg-gradient-to-br from-red-50 to-red-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-0 shadow-md bg-white rounded-lg hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-sm mt-1 text-gray-600">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center shadow-inner`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tổng quan hệ thống */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Tổng quan hệ thống</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {/* Courses Chart */}
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Khóa học</h4>
                <div className="relative w-24 h-24 mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Hoạt động', value: dashboardStats.totalActiveCourse, color: '#34D399' },
                          { name: 'Tạm dừng', value: dashboardStats.totalInactiveCourse, color: '#E5E7EB' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        dataKey="value"
                        startAngle={90}
                        endAngle={450}
                      >
                        <Cell fill="#34D399" />
                        <Cell fill="#E5E7EB" />
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">{dashboardStats.totalCourse}</span>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-center space-x-2 text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{dashboardStats.totalActiveCourse} hoạt động</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-xs">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>{dashboardStats.totalInactiveCourse} tạm dừng</span>
                  </div>
                </div>
              </div>

              {/* Chapters Chart */}
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Chương</h4>
                <div className="relative w-24 h-24 mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Hoạt động', value: dashboardStats.totalActiveChapter, color: '#3B82F6' },
                          { name: 'Tạm dừng', value: dashboardStats.totalInactiveChapter, color: '#E5E7EB' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        dataKey="value"
                        startAngle={90}
                        endAngle={450}
                      >
                        <Cell fill="#3B82F6" />
                        <Cell fill="#E5E7EB" />
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">{dashboardStats.totalChapter}</span>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-center space-x-2 text-xs">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{dashboardStats.totalActiveChapter} hoạt động</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-xs">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>{dashboardStats.totalInactiveChapter} tạm dừng</span>
                  </div>
                </div>
              </div>

              {/* Units Chart */}
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Bài học</h4>
                <div className="relative w-24 h-24 mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Hoạt động', value: dashboardStats.totalActiveUnit, color: '#8B5CF6' },
                          { name: 'Tạm dừng', value: dashboardStats.totalInactiveUnit, color: '#E5E7EB' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        dataKey="value"
                        startAngle={90}
                        endAngle={450}
                      >
                        <Cell fill="#8B5CF6" />
                        <Cell fill="#E5E7EB" />
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">{dashboardStats.totalUnit}</span>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-center space-x-2 text-xs">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>{dashboardStats.totalActiveUnit} hoạt động</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-xs">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>{dashboardStats.totalInactiveUnit} tạm dừng</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Khóa học hiệu quả nhất */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Khóa học hiệu quả nhất</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {dashboardStats.coursesTotalCompletedPercent.map((course, index) => {
                const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-yellow-500", "bg-red-500"];
                const colorMap = {
                  "bg-blue-500": "#3B82F6",
                  "bg-green-500": "#10B981", 
                  "bg-purple-500": "#8B5CF6",
                  "bg-yellow-500": "#F59E0B",
                  "bg-red-500": "#EF4444"
                };

                return (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-l-4"
                    style={{
                      borderLeftColor: colorMap[colors[index] as keyof typeof colorMap],
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 ${colors[index]} rounded-full`}></div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                          <span className="text-sm font-medium">{course.title}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">{course.level}</span>
                          <span className="text-xs text-gray-600">
                            {course.totalCompleted}/{course.totalEnrolled} hoàn thành
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{course.percent.toFixed(1)}%</div>
                      <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${course.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thống kê theo thời gian */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Hoạt động theo tháng</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Chart Legend */}
              <div className="flex justify-center space-x-6 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-600">Số Lượt Đăng ký</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">Số Lượt Hoàn thành</span>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="flex items-end justify-between h-64 px-4">
                {dashboardStats.courseMonthlyActivity.map((month) => {
                  const maxValue = Math.max(...dashboardStats.courseMonthlyActivity.map((m) => m.totalEnrolled));
                  const enrollmentHeight = maxValue > 0 ? (month.totalEnrolled / maxValue) * 200 : 0;
                  const completionHeight = maxValue > 0 ? (month.totalCompleted / maxValue) * 200 : 0;

                  return (
                    <div key={month.month} className="flex flex-col items-center space-y-2">
                      <div className="flex items-end space-x-1 h-52">
                        {/* Enrollment Bar */}
                        <div className="relative group">
                          <div
                            className="w-8 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t hover:from-blue-600 hover:to-blue-400 transition-colors cursor-pointer"
                            style={{ height: `${enrollmentHeight}px` }}
                          ></div>
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {month.totalEnrolled} đăng ký
                          </div>
                        </div>

                        {/* Completion Bar */}
                        <div className="relative group">
                          <div
                            className="w-8 bg-gradient-to-t from-green-500 to-green-300 rounded-t hover:from-green-600 hover:to-green-400 transition-colors cursor-pointer"
                            style={{ height: `${completionHeight}px` }}
                          ></div>
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {month.totalCompleted} hoàn thành
                          </div>
                        </div>
                      </div>

                      {/* Month Label */}
                      <span className="text-xs text-gray-600 text-center transform -rotate-45 origin-center">
                        {month.month}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {totalEnrollments.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Tổng số lượt đăng ký khóa học </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {totalCompletions.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Tổng số lượt hoàn thành khóa học</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {completionRate}%
                  </div>
                  <div className="text-sm text-gray-600">Tỷ lệ hoàn thành khóa học</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Đánh giá xuất sắc */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Đánh giá xuất sắc</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-yellow-600 mb-2">{avgRating.toFixed(1)}/5.0</div>
              <div className="flex justify-center mb-2">{renderStars(avgRating)}</div>
              <p className="text-gray-600">{topRatedCourses.length} khóa học được đánh giá</p>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <h4 className="font-semibold text-gray-900 mb-3">Khóa học được đánh giá cao</h4>
              {topRatedCourses.map((course, index) => (
                <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                      <span className="text-sm font-medium">{course.title}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1">
                        {renderStars(course.averageRating || 0)}
                        <span className="text-xs text-gray-600">({course.totalEnrolled || 0})</span>
                      </div>
                      <span className="text-xs text-gray-600">{course.level}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-yellow-600">{(course.averageRating || 0).toFixed(1)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Users Management Tab
function UsersTab() {
  const [searchTerm, setSearchTerm] = useState('');

  const users = [
    { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@email.com', role: 'Học viên', status: 'Hoạt động', joinDate: '15/06/2024', courses: 3 },
    { id: 2, name: 'Trần Thị B', email: 'tranthib@email.com', role: 'Giảng viên', status: 'Hoạt động', joinDate: '22/05/2024', courses: 8 },
    { id: 3, name: 'Lê Văn C', email: 'levanc@email.com', role: 'Học viên', status: 'Tạm khóa', joinDate: '10/07/2024', courses: 1 },
    { id: 4, name: 'Phạm Thị D', email: 'phamthid@email.com', role: 'Học viên', status: 'Hoạt động', joinDate: '03/06/2024', courses: 5 },
    { id: 5, name: 'Tanaka Sensei', email: 'tanaka@email.com', role: 'Giảng viên', status: 'Hoạt động', joinDate: '28/04/2024', courses: 12 },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Giảng viên': return 'bg-red-100 text-red-800';
      case 'Manager': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hoạt động': return 'bg-red-200 text-red-800';
      case 'Tạm khóa': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Quản lý người dùng</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Lọc
            </Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Thêm người dùng
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 font-medium text-gray-900">Tên</th>
                <th className="text-left p-3 font-medium text-gray-900">Email</th>
                <th className="text-left p-3 font-medium text-gray-900">Vai trò</th>
                <th className="text-left p-3 font-medium text-gray-900">Trạng thái</th>
                <th className="text-left p-3 font-medium text-gray-900">Ngày tham gia</th>
                <th className="text-left p-3 font-medium text-gray-900">Khóa học</th>
                <th className="text-left p-3 font-medium text-gray-900">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-600">{user.email}</td>
                  <td className="p-3">
                    <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                  </td>
                  <td className="p-3 text-gray-600">{user.joinDate}</td>
                  <td className="p-3 text-gray-600">{user.courses}</td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Placeholder components for other tabs
function ApprovalRequestsTab() {
  return <ManagerApprovalRequestsPage />;
}

function RevenueTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Báo cáo doanh thu</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Chức năng báo cáo doanh thu sẽ được phát triển ở đây.</p>
      </CardContent>
    </Card>
  );
}

function InstructorsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý giảng viên</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Chức năng quản lý giảng viên sẽ được phát triển ở đây.</p>
      </CardContent>
    </Card>
  );
}

function ScheduleTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý lịch trình</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Chức năng quản lý lịch trình sẽ được phát triển ở đây.</p>
      </CardContent>
    </Card>
  );
}

function FeedbackTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Phản hồi từ người dùng</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Chức năng quản lý phản hồi sẽ được phát triển ở đây.</p>
      </CardContent>
    </Card>
  );
}

function SettingsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cài đặt hệ thống</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Chức năng cài đặt hệ thống sẽ được phát triển ở đây.</p>
      </CardContent>
    </Card>
  );
}

// Main Manager Dashboard Component
export function ManagerDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'users': return <UsersTab />;
      case 'approval-requests': return <ApprovalRequestsTab />;
      case 'revenue': return <RevenueTab />;
      case 'instructors': return <InstructorsTab />;
      case 'schedule': return <ScheduleTab />;
      case 'feedback': return <FeedbackTab />;
      case 'settings': return <SettingsTab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <ManagerNavigation activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="bg-gray-50">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
              <p className="text-gray-600">Quản lý và theo dõi hoạt động của hệ thống</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </ManagerNavigation>
  );
}

export default ManagerDashboardPage;
