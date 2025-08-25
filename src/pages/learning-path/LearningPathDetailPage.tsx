import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Progress } from "../../components/ui/Progress";
import { Alert } from "../../components/ui/Alert";
import { Breadcrumb, type BreadcrumbItem } from '../../components/ui/Breadcrumb';
import { JapanRoadmapView, type RoadmapStage } from '../../components/roadmap/JapanRoadmapView';
import api from '../../api/axios';
import {
  BookOpen,
  Clock,
  Star,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Users
} from "lucide-react";

// API Types
interface LearningPathCourse {
  courseId: string;
  learningPathId: number;
  courseOrderNumber: number;
  title: string;
  description: string;
  duration: number;
  level: string;
}

interface LearningPathDetail {
  id: number;
  title: string;
  description: string;
  targetLevel: string;
  primaryGoal: string;
  focusSkill: string;
  status: string;
  duration: number;
  userId: number;
  username: string;
  createdAt: string;
  lastUpdatedAt: string;
  courses: LearningPathCourse[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: number;
}

// Mock data for development - replace with real API when backend is ready
const createMockLearningPathDetail = (id: string): LearningPathDetail => ({
  id: parseInt(id) || 1,
  title: "Lộ trình tiếng Nhật N5 cơ bản",
  description: "Lộ trình học tiếng Nhật từ cơ bản đến hoàn thành kỳ thi N5. Bao gồm đầy đủ các kỹ năng: đọc, viết, nghe, nói.",
  targetLevel: "N5",
  primaryGoal: "Đạt chứng chỉ N5",
  focusSkill: "Ngữ pháp và từ vựng",
  status: "ACTIVE",
  duration: 120,
  userId: 1,
  username: "APJF Admin",
  createdAt: "2024-01-15T00:00:00.000Z",
  lastUpdatedAt: "2025-01-20T00:00:00.000Z",
  courses: [
    {
      courseId: "course1",
      learningPathId: parseInt(id) || 1,
      courseOrderNumber: 1,
      title: "Hiragana và Katakana cơ bản",
      description: "Học cách viết và đọc hai bảng chữ cái cơ bản của tiếng Nhật. Đây là nền tảng quan trọng nhất để bắt đầu học tiếng Nhật.",
      duration: 30,
      level: "N5"
    },
    {
      courseId: "course2",
      learningPathId: parseInt(id) || 1,
      courseOrderNumber: 2,
      title: "Ngữ pháp N5 cơ bản",
      description: "Những cấu trúc ngữ pháp thiết yếu cho người mới học. Bao gồm các mẫu câu cơ bản và cách sử dụng trong giao tiếp hàng ngày.",
      duration: 45,
      level: "N5"
    },
    {
      courseId: "course3",
      learningPathId: parseInt(id) || 1,
      courseOrderNumber: 3,
      title: "Từ vựng thiết yếu N5",
      description: "800 từ vựng quan trọng nhất cho kỳ thi N5. Được phân loại theo chủ đề và tình huống sử dụng thực tế.",
      duration: 35,
      level: "N5"
    },
    {
      courseId: "course4",
      learningPathId: parseInt(id) || 1,
      courseOrderNumber: 4,
      title: "Luyện nghe N5",
      description: "Phát triển kỹ năng nghe hiểu cơ bản qua các bài tập thực tế. Làm quen với giọng điệu và tốc độ nói của người Nhật.",
      duration: 40,
      level: "N5"
    },
    {
      courseId: "course5",
      learningPathId: parseInt(id) || 1,
      courseOrderNumber: 5,
      title: "Kanji N5 - Chữ Hán cơ bản",
      description: "Học 100 chữ Kanji thiết yếu nhất cho trình độ N5. Bao gồm cách đọc, nghĩa và cách sử dụng trong từ vựng.",
      duration: 50,
      level: "N5"
    }
  ]
});

// API Service Function
const getLearningPathDetail = async (id: string): Promise<ApiResponse<LearningPathDetail>> => {
  try {
    console.log(`🔍 [API] Fetching learning path detail for ID: ${id}`);
    const response = await api.get(`/learning-paths/${id}`);
    
    console.log('✅ [API] Learning path detail loaded successfully:', response.data);
    return response.data;
  } catch (error: unknown) {
    console.error('❌ [API] Failed to fetch learning path detail:', error);
    
    // If API call fails, return mock data for development
    console.warn('🔄 [API] Using mock data as fallback');
    return {
      success: true,
      message: "Mock data loaded successfully (API unavailable)",
      data: createMockLearningPathDetail(id),
      timestamp: Date.now()
    };
  }
};

const LearningPathDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [learningPath, setLearningPath] = useState<LearningPathDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLearningPathData = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const response = await getLearningPathDetail(id);
        if (response.success) {
          setLearningPath(response.data);
        } else {
          setError(response.message || "Không thể tải dữ liệu lộ trình");
        }
      } catch (error) {
        console.error("Error fetching learning path data:", error);
        setError("Không thể tải dữ liệu lộ trình. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchLearningPathData();
  }, [id]);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Lộ trình học tập', href: '/learning-path' },
    { label: learningPath?.title || 'Chi tiết lộ trình' },
  ];

  const calculateProgress = () => {
    if (!learningPath?.courses?.length) return 0;
    // For now, return a mock progress value
    // In real implementation, this would be calculated based on course completion
    return 45;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !learningPath) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-7xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <div>
              <h3 className="font-semibold">Lỗi tải dữ liệu</h3>
              <p>{error || "Không thể tải thông tin lộ trình"}</p>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  const overallProgress = calculateProgress();

  // Generate roadmap stages based on target level and courses progress
  const generateRoadmapStages = (targetLevel: string): RoadmapStage[] => {
    const baseStages: RoadmapStage[] = [
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
        title: "Ngữ pháp N5",
        description: "Các mẫu câu N5 cơ bản",
        status: "in_progress",
        progress: overallProgress,
      },
      {
        id: 4,
        title: "Kanji N5",
        description: "103 chữ Kanji cơ bản",
        status: overallProgress > 70 ? "in_progress" : "locked",
        progress: Math.max(0, overallProgress - 30),
      },
      {
        id: 5,
        title: "Luyện nghe N5",
        description: "Kỹ năng nghe hiểu cơ bản",
        status: overallProgress > 85 ? "in_progress" : "locked",
        progress: Math.max(0, overallProgress - 50),
      },
    ];

    // Add N4 stages if target level is N4 or higher
    if (targetLevel === 'N4' || targetLevel === 'N3' || targetLevel === 'N2' || targetLevel === 'N1') {
      baseStages.push(
        {
          id: 6,
          title: "Từ vựng N4",
          description: "1500 từ vựng N4",
          status: overallProgress >= 100 ? "in_progress" : "locked",
          progress: 0,
        },
        {
          id: 7,
          title: "Ngữ pháp N4",
          description: "Mẫu câu N4 nâng cao",
          status: "locked",
          progress: 0,
        },
        {
          id: 8,
          title: "Kanji N4",
          description: "300 chữ Kanji N4",
          status: "locked",
          progress: 0,
        }
      );
    }

    return baseStages;
  };

  const roadmapStages = learningPath ? generateRoadmapStages(learningPath.targetLevel) : [];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Header */}
        <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{learningPath.title}</h1>
              <p className="text-sm text-gray-600 mb-3">{learningPath.description}</p>
              
              <div className="flex items-center space-x-6 mb-3">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 px-2 py-1 text-xs">
                  Cấp độ {learningPath.targetLevel}
                </Badge>
                <div className="flex items-center space-x-1 text-xs text-gray-600">
                  <Clock className="h-3 w-3" />
                  <span>{learningPath.duration} giờ học</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-600">
                  <Users className="h-3 w-3" />
                  <span>Tạo bởi {learningPath.username}</span>
                </div>
                <Badge 
                  variant={learningPath.status === 'ACTIVE' ? 'default' : 'secondary'}
                  className="text-xs px-2 py-1"
                >
                  {learningPath.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm dừng'}
                </Badge>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-600 font-medium">Tiến độ:</span>
                <div className="flex-1 max-w-xs">
                  <Progress value={overallProgress} className="h-2" />
                </div>
                <span className="text-xs font-bold text-orange-600">{overallProgress}%</span>
              </div>
            </div>

            <div className="text-right text-xs text-gray-500">
              Cập nhật: {new Date(learningPath.lastUpdatedAt).toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>

        {/* Learning Path Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">Mục tiêu chính</p>
                  <p className="text-sm font-bold text-blue-900">{learningPath.primaryGoal}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-green-200 bg-green-50/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Star className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium">Kỹ năng tập trung</p>
                  <p className="text-sm font-bold text-green-900">{learningPath.focusSkill}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-orange-200 bg-orange-50/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-orange-600 font-medium">Tổng khóa học</p>
                  <p className="text-sm font-bold text-orange-900">{learningPath.courses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content - Course List */}
          <div className="lg:col-span-8">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                  <span>Các khóa học trong lộ trình</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {learningPath?.courses?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có khóa học nào trong lộ trình này</p>
                  </div>
                ) : (
                  [...(learningPath?.courses || [])]
                    .sort((a, b) => a.courseOrderNumber - b.courseOrderNumber)
                    .map((course) => (
                      <div 
                        key={course.courseId} 
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow bg-white"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs px-2 py-1">
                                #{course.courseOrderNumber}
                              </Badge>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-2 py-1">
                                {course.level}
                              </Badge>
                            </div>
                            
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {course.title}
                            </h3>
                            
                            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                              {course.description}
                            </p>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{course.duration} giờ</span>
                              </div>
                            </div>
                          </div>

                          <div className="ml-4 flex flex-col space-y-2">
                            <Button 
                              size="sm" 
                              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 text-xs"
                              onClick={() => navigate(`/courses/${course.courseId}`)}
                            >
                              Xem chi tiết
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="px-3 py-1.5 text-xs"
                              onClick={() => navigate(`/study/course/${course.courseId}`)}
                            >
                              Bắt đầu học
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Roadmap */}
          <div className="lg:col-span-4">
            <JapanRoadmapView
              stages={roadmapStages}
              title="Lộ trình học tập"
              subtitle={learningPath?.title || ''}
              theme="orange"
              showHeader={true}
              showNavigation={false}
              showActionButtons={false}
              headerInfo={{
                targetLevel: learningPath?.targetLevel || 'N5',
                status: learningPath?.status === 'ACTIVE' ? 'Đang học' : 'Tạm dừng',
                duration: learningPath?.duration || 0,
                coursesCount: learningPath?.courses?.length || 0,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPathDetailPage;
