import { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  DollarSign,
  Calendar,
  Award,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

// Navigation Sidebar Component
function ManagerSidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }: Readonly<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}>) {
  const menuItems = [
    { id: 'overview', label: 'Tổng quan', icon: TrendingUp },
    { id: 'users', label: 'Quản lý người dùng', icon: Users },
    { id: 'courses', label: 'Quản lý khóa học', icon: BookOpen },
    { id: 'revenue', label: 'Doanh thu', icon: DollarSign },
    { id: 'instructors', label: 'Giảng viên', icon: Award },
    { id: 'schedule', label: 'Lịch trình', icon: Calendar },
    { id: 'feedback', label: 'Phản hồi', icon: MessageSquare },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col h-screen`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Manager Panel</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                {!isCollapsed && (
                  <span className="ml-3 font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed && (
          <div className="text-center">
            <p className="text-xs text-gray-500">Manager Dashboard v1.0</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab() {
  const stats = [
    { title: 'Tổng người dùng', value: '12,543', change: '+12%', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Khóa học hoạt động', value: '156', change: '+5%', icon: BookOpen, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'Doanh thu tháng', value: '₫ 45.2M', change: '+18%', icon: DollarSign, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { title: 'Đánh giá trung bình', value: '4.8/5', change: '+0.2%', icon: Award, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  ];

  const recentActivities = [
    { id: 1, action: 'Khóa học mới được tạo', detail: '"Tiếng Nhật N4 Nâng cao"', time: '2 giờ trước', type: 'success' },
    { id: 2, action: 'Người dùng mới đăng ký', detail: 'Nguyễn Văn A', time: '4 giờ trước', type: 'info' },
    { id: 3, action: 'Thanh toán hoàn tất', detail: '₫ 2,400,000', time: '6 giờ trước', type: 'success' },
    { id: 4, action: 'Phản hồi mới', detail: 'Khóa học cần cải thiện', time: '8 giờ trước', type: 'warning' },
    { id: 5, action: 'Giảng viên mới ứng tuyển', detail: 'Tanaka Sensei', time: '1 ngày trước', type: 'info' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className={`text-sm mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change} so với tháng trước
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Thống kê doanh thu 6 tháng gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Biểu đồ doanh thu sẽ hiển thị ở đây</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Hoạt động gần đây</span>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Xem tất cả
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const getActivityColor = (type: string) => {
                  if (type === 'success') return 'bg-green-500';
                  if (type === 'warning') return 'bg-yellow-500';
                  return 'bg-blue-500';
                };

                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${getActivityColor(activity.type)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.detail}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
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
      case 'Giảng viên': return 'bg-purple-100 text-purple-800';
      case 'Manager': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hoạt động': return 'bg-green-100 text-green-800';
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
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
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
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
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
function CoursesTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý khóa học</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Chức năng quản lý khóa học sẽ được phát triển ở đây.</p>
      </CardContent>
    </Card>
  );
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'users': return <UsersTab />;
      case 'courses': return <CoursesTab />;
      case 'revenue': return <RevenueTab />;
      case 'instructors': return <InstructorsTab />;
      case 'schedule': return <ScheduleTab />;
      case 'feedback': return <FeedbackTab />;
      case 'settings': return <SettingsTab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <ManagerSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
              <p className="text-gray-600">Quản lý và theo dõi hoạt động của hệ thống</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Xuất báo cáo
              </Button>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboardPage;
