import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Alert } from "../../components/ui/Alert";
import { learningPathService } from "../../services/learningPathService";
import type { 
  LearningPath
} from "../../services/learningPathService";
import api from "../../api/axios";
import { Breadcrumb, type BreadcrumbItem } from '../../components/ui/Breadcrumb';
import { RoadmapView, type RoadmapStage } from '../../components/roadmap/RoadmapView';
import { PlannerChatBox } from '../../components/roadmap/PlannerChatBox';
import { getCurrentUserId } from '../../services/chatbotService';

import {
  BookOpen,
  Clock,
  AlertCircle,
  Flag,
  RefreshCw
} from "lucide-react";

// Interface to map learning paths to our UI - for compatibility with existing code
interface LearningModule {
  id: number;
  title: string;
  description: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  primaryGoal: string;
  focusSkill: string;
  isCompleted: boolean;
  percent: number;
  progress?: number;
  totalLessons?: number;
  completedLessons?: number;
  estimatedTime?: string;
  status: "PENDING" | "STUDYING" | "FINISHED"; // Ensures we use API status enum
}

// Current Learning Roadmap Component - using RoadmapView
function CurrentLearningRoadmap({ 
  activePath, 
  activePathDetail, 
  loading 
}: { 
  readonly activePath: LearningPath | null;
  readonly activePathDetail: LearningPath | null;
  readonly loading: boolean;
}) {
  const navigate = useNavigate();

  // Hiển thị thông báo nếu không có lộ trình nào đang học
  if (!activePath) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200">
        <CardContent className="p-3 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-3 text-blue-500" />
          <h2 className="text-sm font-bold text-gray-900 mb-2">Không có lộ trình đang học</h2>
          <p className="text-xs text-gray-600 mb-3">
            Bạn chưa đặt lộ trình nào thành "Đang học". 
            Hãy chọn một lộ trình từ danh sách bên trái.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Hiển thị loading state
  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200">
        <CardContent className="p-3 text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-3 text-blue-500 animate-spin" />
          <h2 className="text-sm font-bold text-gray-900 mb-2">Đang tải lộ trình...</h2>
        </CardContent>
      </Card>
    );
  }

  // Convert courses từ API thành RoadmapStage format
  const roadmapStages: RoadmapStage[] = activePathDetail?.courses
    ?.sort((a, b) => (a.courseOrderNumber || 0) - (b.courseOrderNumber || 0)) // Sắp xếp theo courseOrderNumber
    ?.map((course, index) => {
      let status: "completed" | "in_progress" | "locked";
      
      // Safe check cho courseProgress
      const courseProgress = course.courseProgress;
      if (!courseProgress) {
        status = "locked";
      } else if (courseProgress.completed) {
        status = "completed";
      } else if (courseProgress.percent > 0) {
        status = "in_progress";
      } else {
        status = "locked";
      }

      return {
        id: parseInt(course.courseId) || index + 1,
        title: course.courseId, // Hiển thị course ID
        description: `${courseProgress?.percent?.toFixed(2) || '0.00'}%`, // Hiển thị percent với 2 chữ số thập phân
        status,
        progress: courseProgress?.percent || 0,
      };
    }) || [
    // Fallback static data nếu không có data từ API
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
  ];

  return (
    <RoadmapView
      stages={roadmapStages}
      title="Lộ trình học tập"
      subtitle={activePathDetail?.title || activePath.title}
      compact={true}
      showHeader={true}
      showNavigation={false}
      showStageCards={false}
      headerInfo={{
        targetLevel: activePathDetail?.targetLevel || activePath.targetLevel,
        status: "Đang học",
        duration: activePathDetail?.duration || activePath.duration,
        coursesCount: activePathDetail?.courses?.length || activePath.courses?.length || 0,
      }}
      onViewDetail={() => navigate(`/roadmap-detail/${activePath.id}`)}
      onStageClick={(stageId: number) => {
        console.log(`Clicked stage ${stageId}`);
        console.log('activePathDetail:', activePathDetail);
        console.log('activePathDetail?.courses:', activePathDetail?.courses);
        
        // Navigate to CourseDetailPage dựa trên course ID
        if (activePathDetail?.courses) {
          // Sắp xếp courses theo courseOrderNumber trước khi tìm kiếm
          const sortedCourses = activePathDetail.courses
            .sort((a, b) => (a.courseOrderNumber || 0) - (b.courseOrderNumber || 0));
            
          // Tìm course dựa trên index (stageId - 1) trong danh sách đã sắp xếp
          let targetCourse;
          
          // Method 1: Tìm theo index (vì stage.id = index + 1 trong sorted array)
          const courseIndex = stageId - 1;
          if (courseIndex >= 0 && courseIndex < sortedCourses.length) {
            targetCourse = sortedCourses[courseIndex];
          }
          
          // Method 2: Nếu không tìm được, thử tìm theo course.courseId
          if (!targetCourse) {
            targetCourse = sortedCourses.find(course => 
              parseInt(course.courseId) === stageId || course.courseId === stageId.toString()
            );
          }
          
          console.log('targetCourse found:', targetCourse);
          if (targetCourse) {
            console.log(`Navigating to /courses/${targetCourse.courseId}`);
            navigate(`/courses/${targetCourse.courseId}`);
          } else {
            console.log('No target course found for stageId:', stageId);
          }
        } else {
          console.log('No activePathDetail.courses available');
          // Fallback: Try to use the stage ID directly as course ID
          console.log(`Fallback: Navigating to /courses/${stageId}`);
          navigate(`/courses/${stageId}`);
        }
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
  const [activePathDetail, setActivePathDetail] = useState<LearningPath | null>(null);
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
        
        // Fetch detail cho studying path nếu có
        if (studyingPath) {
          try {
            console.log(`🔍 Fetching detail for studying path: ${studyingPath.id}`);
            const detailResponse = await learningPathService.getLearningPath(studyingPath.id);
            if (detailResponse.success) {
              setActivePathDetail(detailResponse.data);
              console.log('✅ Active learning path detail loaded:', detailResponse.data);
            } else {
              console.warn('❌ Failed to load active learning path detail:', detailResponse.message);
              setActivePathDetail(null);
            }
          } catch (error) {
            console.error('❌ Error fetching active learning path detail:', error);
            setActivePathDetail(null);
          }
        } else {
          setActivePathDetail(null);
        }
        
        // Hiển thị TẤT CẢ lộ trình trong danh sách bên trái (bao gồm cả STUDYING)
        const modulesData: LearningModule[] = paths.map((path: LearningPath) => ({
          id: path.id,
          title: path.title,
          description: path.description || "Không có mô tả",
          level: (path.targetLevel || 'N5') as "N5" | "N4" | "N3" | "N2" | "N1",
          status: path.status,
          primaryGoal: path.primaryGoal || "Chưa xác định",
          focusSkill: path.focusSkill || "Tổng hợp",
          isCompleted: path.isCompleted || false,
          percent: path.percent || 0,
          // Các trường phụ có thể không có trong API response
          estimatedTime: `${path.duration || 0} ngày`,
          difficulty: (path.focusSkill === 'Cơ bản' || path.focusSkill === 'Trung bình' || path.focusSkill === 'Nâng cao') 
            ? path.focusSkill 
            : "Cơ bản",
          progress: path.percent || 0,
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
    <div key={module.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
      {/* Header with badges */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 mb-2">{module.title}</h3>
          <p className="text-gray-600 text-sm mb-3">{module.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`px-3 py-1 text-xs font-medium rounded-full ${getLevelColor(module.level)}`}>
              {module.level}
            </Badge>
            <Badge className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(module.status)}`}>
              {getStatusText(module.status)}
            </Badge>
            {module.isCompleted && (
              <Badge className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                Hoàn thành
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Primary Goal and Focus Skill */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-xs text-blue-600 font-medium mb-1">Mục tiêu chính</div>
          <div className="text-sm font-semibold text-blue-900">{module.primaryGoal}</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-xs text-purple-600 font-medium mb-1">Kỹ năng tập trung</div>
          <div className="text-sm font-semibold text-purple-900">{module.focusSkill}</div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Tiến độ học tập</span>
          <span className="font-semibold text-red-600">
            {Math.round(module.percent)}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full mb-3">
          <div 
            className="h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300" 
            style={{ 
              width: `${module.percent}%`
            }}
          ></div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-500" />
            <span>Thời gian dự kiến: {module.estimatedTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-red-500" />
            <span>{module.totalLessons} bài học</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {module.status === 'STUDYING' ? (
          // Nếu là lộ trình đang học, hiển thị text với màu xanh để đánh dấu
          <div className="flex-1 bg-green-600 text-white font-medium py-3 px-4 rounded-lg text-center flex items-center justify-center">
            <Flag className="h-4 w-4 mr-2" />
            Lộ trình đang hoạt động
          </div>
        ) : (
          // Nếu không phải lộ trình đang học, hiển thị nút như bình thường
          <Button 
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors duration-200"
            onClick={() => handleSetLearningPathActive(module.id)}
          >
            <Flag className="h-4 w-4 mr-2" />
            Đặt lộ trình này làm lộ trình chính
          </Button>
        )}
        <Button
          variant="outline"
          className="px-6 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 rounded-lg transition-colors duration-200"
          onClick={() => navigate(`/roadmap-detail/${module.id}`)}
        >
          Chi tiết
        </Button>
      </div>
    </div>
  );

  // Render learning modules with separate function to avoid nested ternary
  const renderLearningModules = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Clock className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-500" />
            <p className="text-gray-600">Đang tải lộ trình học...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <AlertCircle className="h-16 w-16 mx-auto mb-6 text-red-500" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Đã xảy ra lỗi</h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">{error}</p>
            <div className="flex justify-center space-x-4">
              {error.includes("đăng nhập") && (
                <Button onClick={() => navigate('/login')} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2">
                  Đăng nhập
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (filteredModules.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <BookOpen className="h-16 w-16 mx-auto mb-6 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {search !== "" ? 'Không tìm thấy kết quả' : 'Chưa có lộ trình học'}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {search !== "" 
                ? 'Không tìm thấy lộ trình nào phù hợp với từ khóa tìm kiếm.'
                : 'Bạn chưa có lộ trình học nào. Liên hệ với giáo viên để được hỗ trợ tạo lộ trình phù hợp.'}
            </p>
          </div>
        </div>
      );
    }

    return filteredModules.map(renderSingleModule);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6">
            <Breadcrumb items={breadcrumbItems} />
          </div>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <h3 className="font-semibold">Thông báo</h3>
            <p className="mt-2 text-sm">{error}</p>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Main Layout: Left (List) - Right (Current Roadmap) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Side: Header + Search + Learning Modules List */}
          <div className="lg:col-span-3">
            {/* Page Header - chỉ ở bên trái */}
            <div className="mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Lộ trình học tập</h1>
                <p className="text-gray-600">Khám phá và theo dõi tiến độ học tập tiếng Nhật của bạn</p>
              </div>
            </div>

            {/* Search, Sort, và Refresh Button trên cùng một dòng */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Tìm kiếm lộ trình học tập..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-11 text-sm border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                className="h-11 px-4 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white min-w-[140px]"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
              </select>
              <Button
                onClick={loadRoadmapData}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300 h-11 px-4"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>

            {/* Learning Modules */}
            <div className="space-y-4">
              {renderLearningModules()}
            </div>
          </div>

          {/* Right Side: Current Learning Roadmap + Planner ChatBox */}
          <div className="lg:col-span-2">
            <div className="flex flex-col sticky" style={{top: '24px', maxHeight: 'calc(100vh - 24px)'}}>
              {/* Roadmap tăng không gian lên */}
              <div style={{height: '420px', overflow: 'auto'}} className="flex-shrink-0">
                <CurrentLearningRoadmap 
                  activePath={activePath} 
                  activePathDetail={activePathDetail}
                  loading={isLoading}
                />
              </div>
              
              {/* ChatBox giảm không gian xuống 4/5 */}
              <div style={{height: 'calc((100vh - 420px - 48px) * 0.8)'}} className="flex-shrink-0 flex items-end">
                <PlannerChatBox userId={getCurrentUserId() || ''} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LearningPathPage;
