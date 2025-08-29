import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Alert } from "../../components/ui/Alert";
import { Breadcrumb, type BreadcrumbItem } from '../../components/ui/Breadcrumb';
import { RoadmapView, type RoadmapStage } from '../../components/roadmap/RoadmapView';
import type { 
  ActiveLearningPath
} from '../../services/learningPathService';
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
  id: string;
  title: string;
  description: string;
  duration: number;
  level: string;
  image: string;
  requirement: string;
  status: string;
  prerequisiteCourseId: string;
  topics: Array<{
    id: number;
    name: string;
  }>;
  averageRating: number;
  courseProgress: {
    completed: boolean;
    percent: number;
  };
  courseOrderNumber: number;
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
  isCompleted: boolean;
  percent: number;
  courses?: LearningPathCourse[]; // Make courses optional since API might not always return it
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
  isCompleted: false,
  percent: 65.5,
  courses: [
    {
      id: "course1",
      title: "Hiragana và Katakana cơ bản",
      description: "Học cách viết và đọc hai bảng chữ cái cơ bản của tiếng Nhật. Đây là nền tảng quan trọng nhất để bắt đầu học tiếng Nhật.",
      duration: 30,
      level: "N5",
      image: "",
      requirement: "",
      status: "ACTIVE",
      prerequisiteCourseId: "",
      topics: [],
      averageRating: 4.5,
      courseProgress: {
        completed: true,
        percent: 100
      },
      courseOrderNumber: 1
    },
    {
      id: "course2",
      title: "Ngữ pháp N5 cơ bản",
      description: "Những cấu trúc ngữ pháp thiết yếu cho người mới học. Bao gồm các mẫu câu cơ bản và cách sử dụng trong giao tiếp hàng ngày.",
      duration: 45,
      level: "N5",
      image: "",
      requirement: "",
      status: "ACTIVE",
      prerequisiteCourseId: "",
      topics: [],
      averageRating: 4.3,
      courseProgress: {
        completed: false,
        percent: 65.5
      },
      courseOrderNumber: 2
    },
    {
      id: "course3",
      title: "Từ vựng thiết yếu N5",
      description: "800 từ vựng quan trọng nhất cho kỳ thi N5. Được phân loại theo chủ đề và tình huống sử dụng thực tế.",
      duration: 35,
      level: "N5",
      image: "",
      requirement: "",
      status: "ACTIVE",
      prerequisiteCourseId: "",
      topics: [],
      averageRating: 4.7,
      courseProgress: {
        completed: false,
        percent: 25.0
      },
      courseOrderNumber: 3
    },
    {
      id: "course4",
      title: "Luyện nghe N5",
      description: "Phát triển kỹ năng nghe hiểu cơ bản qua các bài tập thực tế. Làm quen với giọng điệu và tốc độ nói của người Nhật.",
      duration: 40,
      level: "N5",
      image: "",
      requirement: "",
      status: "ACTIVE",
      prerequisiteCourseId: "",
      topics: [],
      averageRating: 4.1,
      courseProgress: {
        completed: false,
        percent: 0
      },
      courseOrderNumber: 4
    },
    {
      id: "course5",
      title: "Kanji N5 - Chữ Hán cơ bản",
      description: "Học 100 chữ Kanji thiết yếu nhất cho trình độ N5. Bao gồm cách đọc, nghĩa và cách sử dụng trong từ vựng.",
      duration: 50,
      level: "N5",
      image: "",
      requirement: "",
      status: "ACTIVE",
      prerequisiteCourseId: "",
      topics: [],
      averageRating: 4.4,
      courseProgress: {
        completed: false,
        percent: 0
      },
      courseOrderNumber: 5
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
  const [activePathDetail, setActivePathDetail] = useState<ActiveLearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLearningPathData = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // Lấy thông tin learning path từ API (đã bao gồm courseProgress)
        const response = await getLearningPathDetail(id);
        if (response.success) {
          // Ensure courses array exists
          const pathData = {
            ...response.data,
            courses: response.data.courses || []
          };
          setLearningPath(pathData);

          // Nếu learning path này đang active, cũng set làm activePathDetail
          // vì API đã trả về đầy đủ thông tin courseProgress
          if (pathData.status === 'ACTIVE' || pathData.status === 'STUDYING') {
            // Convert pathData thành định dạng ActiveLearningPath để tương thích
            const activePathData: ActiveLearningPath = {
              ...pathData,
              courses: pathData.courses || []
            };
            setActivePathDetail(activePathData);
            console.log('✅ Learning path data loaded as active:', activePathData);
          }
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
    if (!learningPath) return 0;
    return learningPath.percent || 0;
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

  // Generate roadmap stages based on target level and courses progress
  const generateRoadmapStages = (): RoadmapStage[] => {
    // Ưu tiên sử dụng activePathDetail nếu có, fallback về learningPath
    const coursesData = activePathDetail?.courses || learningPath?.courses;
    
    if (coursesData && coursesData.length > 0) {
      return coursesData
        .sort((a, b) => (a.courseOrderNumber || 0) - (b.courseOrderNumber || 0)) // Sắp xếp theo courseOrderNumber
        .map((course, index) => {
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
            id: parseInt(course.id) || index + 1,
            title: course.id, // Hiển thị course ID
            description: `${courseProgress?.percent?.toFixed(2) || '0.00'}%`, // Hiển thị percent với 2 chữ số thập phân
            status,
            progress: courseProgress?.percent || 0,
          };
        });
    }

    // Fallback: Generate stages based on target level nếu không có API data
    if (!learningPath) return [];
    
    const fallbackProgress = calculateProgress();
    const targetLevel = learningPath.targetLevel;
    
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
        progress: fallbackProgress,
      },
      {
        id: 4,
        title: "Kanji N5",
        description: "103 chữ Kanji cơ bản",
        status: fallbackProgress > 70 ? "in_progress" : "locked",
        progress: Math.max(0, fallbackProgress - 30),
      },
      {
        id: 5,
        title: "Luyện nghe N5",
        description: "Kỹ năng nghe hiểu cơ bản",
        status: fallbackProgress > 85 ? "in_progress" : "locked",
        progress: Math.max(0, fallbackProgress - 50),
      },
    ];

    // Add N4 stages if target level is N4 or higher
    if (targetLevel === 'N4' || targetLevel === 'N3' || targetLevel === 'N2' || targetLevel === 'N1') {
      baseStages.push(
        {
          id: 6,
          title: "Từ vựng N4",
          description: "1500 từ vựng N4",
          status: fallbackProgress >= 100 ? "in_progress" : "locked",
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

  const roadmapStages = generateRoadmapStages();

  // Sử dụng activePathDetail nếu có, fallback to learningPath
  const displayPath = activePathDetail || learningPath;
  const overallProgress = activePathDetail?.percent || calculateProgress();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Header */}
        <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{displayPath?.title}</h1>
              <p className="text-sm text-gray-600 mb-3">{displayPath?.description}</p>
              
              <div className="flex items-center space-x-6 mb-3">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 px-2 py-1 text-xs">
                  Cấp độ {displayPath?.targetLevel}
                </Badge>
                <div className="flex items-center space-x-1 text-xs text-gray-600">
                  <Clock className="h-3 w-3" />
                  <span>{displayPath?.duration} giờ học</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-600">
                  <Users className="h-3 w-3" />
                  <span>Tạo bởi {displayPath?.username}</span>
                </div>
                <Badge 
                  variant={displayPath?.status === 'STUDYING' ? 'default' : 'secondary'}
                  className="text-xs px-2 py-1"
                >
                  {(() => {
                    switch (displayPath?.status) {
                      case 'STUDYING': return 'Đang học';
                      case 'FINISHED': return 'Hoàn thành';
                      default: return 'Chờ bắt đầu';
                    }
                  })()}
                </Badge>
                {displayPath?.isCompleted && (
                  <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
                    Đã hoàn thành
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-600 font-medium">Tiến độ:</span>
                <div className="flex-1 max-w-xs">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs font-bold text-orange-600">{overallProgress.toFixed(1)}%</span>
              </div>
            </div>

            <div className="text-right text-xs text-gray-500">
              Cập nhật: {new Date(displayPath?.lastUpdatedAt || '').toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>

        {/* Learning Path Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">Mục tiêu chính</p>
                  <p className="text-sm font-bold text-blue-900">{displayPath?.primaryGoal}</p>
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
                  <p className="text-sm font-bold text-green-900">{displayPath?.focusSkill || 'Tổng hợp'}</p>
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
                  <p className="text-sm font-bold text-orange-900">{displayPath?.courses?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-purple-200 bg-purple-50/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-purple-600 font-medium">Tiến độ hoàn thành</p>
                  <p className="text-sm font-bold text-purple-900">{overallProgress.toFixed(1)}%</p>
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
                {displayPath?.courses?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có khóa học nào trong lộ trình này</p>
                  </div>
                ) : (
                  [...(displayPath?.courses || [])]
                    .sort((a, b) => a.courseOrderNumber - b.courseOrderNumber)
                    .map((course) => (
                      <div 
                        key={course.id} 
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow bg-white relative min-h-[180px] flex flex-col"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs px-2 py-1">
                              #{course.courseOrderNumber}
                            </Badge>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-2 py-1">
                              {course.level}
                            </Badge>
                          </div>
                          {/* Hiển thị trạng thái completion */}
                          {course.courseProgress?.completed && (
                            <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
                              ✓ Hoàn thành
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                          {course.description}
                        </p>
                        
                        {/* Progress bar cho course */}
                        {course.courseProgress && course.courseProgress.percent > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-600">Tiến độ</span>
                              <span className="text-xs font-semibold text-blue-600">
                                {course.courseProgress.percent.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${Math.min(100, Math.max(0, course.courseProgress.percent))}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-8">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{course.duration} giờ</span>
                          </div>
                          {course.averageRating && (
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3" />
                              <span>{course.averageRating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-4 right-4">
                          <Button 
                            size="sm" 
                            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-xs shadow-md"
                            onClick={() => navigate(`/courses/${course.id}`)}
                          >
                            Tiếp tục học
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Roadmap */}
          <div className="lg:col-span-4">
            <RoadmapView
              stages={roadmapStages}
              title="Lộ trình học tập"
              subtitle={displayPath?.title || ''}
              compact={true}
              showHeader={true}
              showNavigation={false}
              showStageCards={false}
              headerInfo={{
                targetLevel: displayPath?.targetLevel || 'N5',
                status: displayPath?.status === 'ACTIVE' ? 'Đang học' : 'Tạm dừng',
                duration: displayPath?.duration || 0,
                coursesCount: displayPath?.courses?.length || 0,
              }}
              onStageClick={(stageId: number) => {
                console.log(`Clicked stage ${stageId}`);
                // Navigate to course if it's a course-based stage
                const coursesData = activePathDetail?.courses || learningPath?.courses;
                if (coursesData) {
                  // Sắp xếp courses theo courseOrderNumber trước khi tìm kiếm
                  const sortedCourses = coursesData
                    .sort((a, b) => (a.courseOrderNumber || 0) - (b.courseOrderNumber || 0));
                    
                  // Tìm course dựa trên index trong danh sách đã sắp xếp
                  const courseIndex = stageId - 1;
                  let targetCourse;
                  
                  if (courseIndex >= 0 && courseIndex < sortedCourses.length) {
                    targetCourse = sortedCourses[courseIndex];
                  }
                  
                  if (targetCourse) {
                    navigate(`/courses/${targetCourse.id}`);
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPathDetailPage;
