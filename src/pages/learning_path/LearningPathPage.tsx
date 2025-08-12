import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Alert } from "../../components/ui/Alert";
import { learningPathService } from "../../services/learningPathService";
import type { LearningPath } from "../../services/learningPathService";
import api from "../../api/axios";
import { Breadcrumb, type BreadcrumbItem } from '../../components/ui/Breadcrumb';
import { RoadmapView, type RoadmapStage } from '../../components/roadmap/RoadmapView';
import {
  BookOpen,
  RefreshCw,
  Clock,
  Award,
  ArrowLeft,
  AlertCircle,
  Flag
} from "lucide-react";

// Interface to map learning paths to our UI - for compatibility with existing code
interface LearningModule {
  id: number;
  title: string;
  description: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  progress?: number;
  totalLessons?: number;
  completedLessons?: number;
  estimatedTime?: string;
  status: "PENDING" | "STUDYING" | "FINISHED"; // Ensures we use API status enum
}

// Current Learning Roadmap Component - using RoadmapView
function CurrentLearningRoadmap({ activePath }: { readonly activePath: LearningPath | null }) {
  const navigate = useNavigate();

  // Hiển thị thông báo nếu không có lộ trình nào đang học
  if (!activePath) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200">
        <CardContent className="p-4 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-blue-500" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Không có lộ trình đang học</h2>
          <p className="text-sm text-gray-600 mb-4">
            Bạn chưa đặt lộ trình nào thành "Đang học". 
            Hãy chọn một lộ trình từ danh sách bên trái và bấm "Đặt lộ trình".
          </p>
        </CardContent>
      </Card>
    );
  }

  // Convert to RoadmapStage format
  const roadmapStages: RoadmapStage[] = [
    {
      id: 1,
      title: "Hiragana & Katakana",
      description: "Học thuộc 46 ký tự cơ bản",
      status: "completed",
      progress: 100,
    },
    {
      id: 2,
      title: "Từ vựng N5",
      description: "800 từ vựng thiết yếu",
      status: "completed",
      progress: 100,
    },
    {
      id: 3,
      title: "Ngữ pháp cơ bản",
      description: "Các mẫu câu N5",
      status: "in_progress",
      progress: 65,
    },
    {
      id: 4,
      title: "Kanji N5",
      description: "103 chữ Kanji cơ bản",
      status: "locked",
      progress: 0,
    },
    {
      id: 5,
      title: "Luyện nghe N5",
      description: "Kỹ năng nghe hiểu",
      status: "locked",
      progress: 0,
    },
    {
      id: 6,
      title: "Đọc hiểu N5",
      description: "Đọc và hiểu văn bản",
      status: "locked",
      progress: 0,
    },
  ];

  return (
    <RoadmapView
      stages={roadmapStages}
      title="Lộ trình đang học"
      subtitle={activePath.title}
      headerInfo={{
        targetLevel: activePath.targetLevel,
        status: "Đang học",
        duration: activePath.duration,
        coursesCount: activePath.courses?.length || 0,
      }}
      onViewDetail={() => navigate(`/roadmap-detail/${activePath.id}`)}
      onStageClick={(stageId) => {
        console.log(`Clicked stage ${stageId}`);
        // Handle stage click - navigate to detail page
        navigate(`/roadmap-detail/${activePath.id}?stage=${stageId}`);
      }}
    />
  );
}

export function LearningPathPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [activePath, setActivePath] = useState<LearningPath | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Lộ trình học tập' }
  ];

  // Color utility functions using unified red theme
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'N5': return 'bg-red-50 text-red-900';
      case 'N4': return 'bg-red-100 text-red-800';
      case 'N3': return 'bg-red-200 text-red-700';
      case 'N2': return 'bg-red-300 text-red-600';
      case 'N1': return 'bg-red-400 text-red-900';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'STUDYING': return 'bg-red-100 text-red-700';
      case 'FINISHED': return 'bg-red-200 text-red-800';
      case 'PENDING': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Load roadmap data from API
  useEffect(() => {
    loadRoadmapData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Extract roadmap data loading logic
  const loadRoadmapData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Sử dụng access_token theo convention
      const token = localStorage.getItem('access_token');
      const userInfo = localStorage.getItem('userInfo') || localStorage.getItem('user');
      
      console.log('🔍 Loading roadmap data...', {
        hasToken: !!token,
        hasUserInfo: !!userInfo,
        tokenLength: token?.length || 0,
        tokenPrefix: token?.substring(0, 10) + '...',
        userInfoObject: userInfo ? JSON.parse(userInfo) : null
      });
      
      if (!token) {
        console.log("❌ No token found, checking for user info before redirecting");
        // Kiểm tra xem có userInfo/user không trước khi chuyển hướng
        if (!userInfo) {
          console.log("❌ No user info found, redirecting to login");
          navigate('/login');
          return;
        } else {
          console.log("⚠️ User info found but no token, will attempt to load data anyway");
        }
      }

      // Lấy danh sách lộ trình học từ API
      let response;
      try {
        // Trước tiên test API profile để đảm bảo auth hoạt động
        console.log('🔍 Testing auth with profile API first...');
        try {
          const profileResponse = await api.get('/users/profile');
          console.log('✅ Profile API test successful:', profileResponse.data);
        } catch (profileError) {
          console.error('❌ Profile API test failed:', profileError);
          // Nếu profile API thất bại, có thể là lỗi auth
          setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          setIsLoading(false);
          return;
        }
        
        console.log('🔍 Calling learningPathService.getUserLearningPaths()...');
        response = await learningPathService.getUserLearningPaths();
        
        // Debug log để xem dữ liệu API trả về
        console.log("✅ API Response received:", {
          success: response.success,
          dataLength: response.data?.length || 0,
          data: response.data
        });
      } catch (err) {
        console.error("❌ API error:", err);
        setError("Không thể tải dữ liệu lộ trình. Vui lòng đăng nhập lại.");
        setIsLoading(false);
        return;
      }
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Lưu trữ tất cả lộ trình
        const paths = response.data;
        console.log("🔍 Processing learning paths:", paths.length);
        
        // Tách riêng lộ trình đang học (STUDYING) và các lộ trình đang chờ (PENDING)
        const studyingPath = paths.find((path: LearningPath) => path.status === 'STUDYING');
        const pendingPaths = paths.filter((path: LearningPath) => path.status === 'PENDING');
        
        console.log("📊 Path breakdown:", {
          studying: studyingPath?.title || 'None',
          pending: pendingPaths.length,
          all: paths.length
        });
        
        // Cập nhật state
        setActivePath(studyingPath || null);
        
        // Chỉ hiển thị các lộ trình PENDING trong danh sách bên trái
        const modulesData: LearningModule[] = pendingPaths.map((path: LearningPath) => ({
          id: path.id,
          title: path.title,
          description: path.description || "Không có mô tả",
          level: (path.targetLevel || 'N5') as "N5" | "N4" | "N3" | "N2" | "N1",
          status: path.status,
          // Các trường phụ có thể không có trong API response
          estimatedTime: `${path.duration || 0} ngày`,
          difficulty: (path.focusSkill === 'Cơ bản' || path.focusSkill === 'Trung bình' || path.focusSkill === 'Nâng cao') 
            ? path.focusSkill 
            : "Cơ bản",
          progress: 0,
          totalLessons: path.courses?.length || 0,
          completedLessons: 0,
          skills: [],
          rating: 0,
          reviews: 0
        }));
        
        console.log("✅ Modules data prepared:", modulesData.length);
        setModules(modulesData);
      } else {
        console.log("⚠️ No learning paths found or invalid response format:", {
          hasData: !!response.data,
          isArray: Array.isArray(response.data),
          length: response.data?.length || 0
        });
        setModules([]);
      }
    } catch (err) {
      console.error('❌ Error loading roadmap data:', err);
      setError('Không thể tải dữ liệu lộ trình. Vui lòng thử lại sau.');
      setModules([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadRoadmapData();
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'STUDYING': return 'Đang học';
      case 'FINISHED': return 'Hoàn thành';
      case 'PENDING': return 'Chưa bắt đầu';
      default: return status;
    }
  };
  
  // Hàm xử lý đặt lộ trình thành STUDYING
  const handleSetLearningPathActive = async (id: number) => {
    setIsLoading(true);
    try {
      await learningPathService.setLearningPathActive(id);
      // Sau khi đặt thành công, load lại dữ liệu
      await loadRoadmapData();
    } catch (error) {
      console.error("Error setting learning path active:", error);
      setError("Không thể đặt lộ trình thành đang học. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredModules = modules
    .filter((m: LearningModule) =>
      (search === "" || m.title.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a: LearningModule, b: LearningModule) => 
      sortOrder === "newest" ? b.id - a.id : a.id - b.id
    );

  // Function to render a single learning module
  const renderSingleModule = (module: LearningModule) => (
    <div key={module.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 flex flex-col gap-3">
      {/* Main Info */}
      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="font-semibold text-sm text-gray-900">{module.title}</span>
          <Badge className={`px-2 py-0.5 text-xs font-medium ${getLevelColor(module.level)}`}>
            {module.level}
          </Badge>
          <Badge className={`px-2 py-0.5 text-xs font-medium ${getStatusColor(module.status)}`}>
            {getStatusText(module.status)}
          </Badge>
        </div>
        <div className="text-gray-600 text-xs mb-2">{module.description}</div>
      </div>

      {/* Progress Bar - Chỉ hiển thị nếu có đủ dữ liệu */}
      <div className="mb-2">
        {module.completedLessons !== undefined && module.totalLessons !== undefined ? (
          <>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Tiến độ: {module.completedLessons}/{module.totalLessons}</span>
              <span className="font-semibold text-blue-600">
                {Math.round((module.completedLessons/module.totalLessons)*100)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full">
              <div 
                className="h-1.5 rounded-full bg-blue-600" 
                style={{ 
                  width: `${(module.completedLessons/module.totalLessons)*100}%`
                }}
              ></div>
            </div>
          </>
        ) : (
          <div className="text-xs text-gray-500">
            Thời gian dự kiến: {module.estimatedTime || 'Chưa xác định'}
          </div>
        )}
      </div>

      {/* Stats và Action Buttons trên cùng 1 hàng */}
      <div className="flex items-center justify-between gap-3">
        {/* Stats Row */}
        <div className="flex gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> 
            <span>{module.totalLessons} bài</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> 
            <span>{module.estimatedTime}</span>
          </div>
        </div>

        {/* Action Buttons - thu nhỏ */}
        <div className="flex gap-1.5">
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center text-xs px-2 py-1 h-7"
            onClick={() => handleSetLearningPathActive(module.id)}
          >
            <Flag className="h-3 w-3 mr-1" />
            Đặt lộ trình
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-gray-600 bg-white border text-xs px-2 py-1 h-7"
            onClick={() => navigate(`/roadmap-detail/${module.id}`)}
          >
            Chi tiết
          </Button>
        </div>
      </div>
    </div>
  );

  // Render learning modules with separate function to avoid nested ternary
  const renderLearningModules = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-500" />
            <p className="text-gray-600">Đang tải lộ trình học...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Đã xảy ra lỗi</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex justify-center space-x-4">
            <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className="h-4 w-4 mr-1" />
              Tải lại
            </Button>
            {error.includes("đăng nhập") && (
              <Button onClick={() => navigate('/login')} className="bg-green-600 hover:bg-green-700 text-white">
                Đăng nhập
              </Button>
            )}
          </div>
        </div>
      );
    }

    if (filteredModules.length === 0) {
      return (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lộ trình học chờ</h3>
          <p className="text-gray-600 mb-4">
            {activePath 
              ? 'Bạn đã có một lộ trình đang học. Hãy hoàn thành lộ trình này trước khi thêm lộ trình mới.'
              : 'Bạn chưa có lộ trình học nào. Hãy tạo lộ trình đầu tiên!'}
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            + Tạo lộ trình mới
          </Button>
        </div>
      );
    }

    return filteredModules.map(renderSingleModule);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-0 py-1">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Lộ trình học tập</h1>
          <p className="text-gray-600 text-sm">Quản lý và theo dõi tiến độ học tập của bạn</p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2 ml-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Đang tải...' : 'Làm mới'}
        </Button>
      </div>          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <h3 className="font-semibold">Thông báo</h3>
            <p className="mt-2 text-sm">{error}</p>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-0 py-1">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Main Layout: Left (List) - Right (Current Roadmap) */}
        <div className="flex gap-1">
          {/* Left Side: Search + Learning Modules List */}
          <div className="flex-1 w-3/5">
            {/* Header với nút lùi về và tiêu đề */}
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-blue-600">Lộ trình học tập</h1>
                <p className="text-gray-600 text-sm">
                  Quản lý và theo dõi tiến độ học tập của bạn
                  {process.env.NODE_ENV === 'development' && (
                    <span className="ml-2 text-xs bg-gray-100 px-1 py-0.5 rounded">
                      {modules.length} lộ trình chờ, {activePath ? '1' : '0'} lộ trình đang học
                    </span>
                  )}
                </p>
              </div>
              <Button 
                onClick={handleRefresh}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2 ml-auto"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </div>
            {/* Progress Overview Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4 w-full">
              <Card className="bg-blue-600 text-white">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-blue-100 text-xs">Tổng lộ trình</p>
                      <p className="text-xl font-bold">{modules.length}</p>
                    </div>
                    <BookOpen className="h-6 w-6 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-600 text-white">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-green-100 text-xs">Hoàn thành</p>
                      <p className="text-xl font-bold">
                        {modules.filter(m => m.status === 'FINISHED').length}
                      </p>
                    </div>
                    <Award className="h-6 w-6 text-green-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search, Filter, Sort Controls và nút Tạo lộ trình */}
            <div className="flex flex-wrap gap-3 mb-3 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center">
                <Input
                  placeholder="Tìm kiếm lộ trình..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-48 text-sm"
                />
                {/* Không cần filter trạng thái vì chỉ hiển thị PENDING */}
                {/*<select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PENDING">Chưa bắt đầu</option>
                  <option value="STUDYING">Đang học</option>
                  <option value="FINISHED">Hoàn thành</option>
                </select>*/}
                <select
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                  className="border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                </select>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2">
                + Tạo lộ trình mới
              </Button>
            </div>

            {/* Learning Modules */}
            <div className="space-y-3">
              {renderLearningModules()}
            </div>
          </div>

          {/* Right Side: Current Learning Roadmap */}
          <div className="w-2/5 sticky top-16 self-start">
            <CurrentLearningRoadmap activePath={activePath} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LearningPathPage;
