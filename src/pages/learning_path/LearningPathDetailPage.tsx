import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Progress } from "../../components/ui/Progress";
import { Alert } from "../../components/ui/Alert";
import { Breadcrumb, type BreadcrumbItem } from '../../components/ui/Breadcrumb';
import { RoadmapView, type RoadmapStage } from '../../components/roadmap/RoadmapView';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle,
  Target,
  Star,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Users
} from "lucide-react";

interface CourseModule {
  id: number;
  title: string;
  description: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  progress: number;
  totalLessons: number;
  completedLessons: number;
  estimatedTime: string;
  difficulty: "Cơ bản" | "Trung bình" | "Nâng cao";
  status: "not_started" | "in_progress" | "completed";
  rating: number;
  students: number;
  instructor: string;
}

interface LearningGoal {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  dueDate: string;
}

interface NextCourse {
  id: number;
  title: string;
  description: string;
  level: string;
  estimatedTime: string;
  price: string;
  rating: number;
}

interface RoadmapData {
  id: number;
  title: string;
  description: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  rating: number;
  students: number;
  overallProgress: number;
  modules: CourseModule[];
  goals: LearningGoal[];
  nextCourses: NextCourse[];
  stats: {
    completedLessons: number;
    studyHours: number;
    streakDays: number;
  };
}

// Mock data for development
const mockCourseModules: CourseModule[] = [
  {
    id: 1,
    title: "Tiếng Nhật N5 - Cơ bản",
    description: "Khóa học tổng hợp về tiếng Nhật cơ bản cho người mới bắt đầu",
    level: "N5",
    progress: 40,
    totalLessons: 45,
    completedLessons: 18,
    estimatedTime: "40 giờ",
    difficulty: "Cơ bản",
    status: "in_progress",
    rating: 4.8,
    students: 1250,
    instructor: "Sensei Tanaka",
  },
  {
    id: 2,
    title: "Kanji cơ bản - 300 chữ Hán đầu tiên",
    description: "Học thuộc 300 chữ Kanji cơ bản nhất trong tiếng Nhật",
    level: "N5",
    progress: 65,
    totalLessons: 30,
    completedLessons: 20,
    estimatedTime: "25 giờ",
    difficulty: "Cơ bản",
    status: "in_progress",
    rating: 4.7,
    students: 980,
    instructor: "Sensei Yamada",
  },
  {
    id: 3,
    title: "Giao tiếp hàng ngày N5",
    description: "Luyện tập các tình huống giao tiếp thường gặp",
    level: "N5",
    progress: 0,
    totalLessons: 20,
    completedLessons: 0,
    estimatedTime: "15 giờ",
    difficulty: "Cơ bản",
    status: "not_started",
    rating: 4.9,
    students: 1450,
    instructor: "Sensei Sato",
  },
];

const mockGoals: LearningGoal[] = [
  { id: 1, title: "Hoàn thành 300 chữ Kanji N5", description: "Học thuộc tất cả Kanji cần thiết cho N5", completed: false, dueDate: "2024-06-30" },
  { id: 2, title: "Luyện tập giao tiếp hàng ngày", description: "Thực hành tối thiểu 30 phút mỗi ngày", completed: true, dueDate: "2024-05-15" },
  { id: 3, title: "Thi thử N5 đạt 80%", description: "Đạt điểm tốt trong bài thi thử", completed: false, dueDate: "2024-07-15" },
];

const mockNextCourses: NextCourse[] = [
  { id: 1, title: "Tiếng Nhật N4 - Trung cấp", description: "Nâng cao kiến thức lên cấp độ N4", level: "N4", estimatedTime: "60 giờ", price: "Miễn phí", rating: 4.8 },
  { id: 2, title: "Kanji nâng cao N4", description: "Mở rộng vốn Kanji cho cấp độ N4", level: "N4", estimatedTime: "35 giờ", price: "299.000đ", rating: 4.7 },
  { id: 3, title: "Nghe hiểu nâng cao", description: "Rèn luyện khả năng nghe hiểu tiếng Nhật", level: "N4", estimatedTime: "25 giờ", price: "199.000đ", rating: 4.9 },
];

// Component for stage units display
interface StageUnitsViewProps {
  currentStage: number;
  setCurrentStage: (stage: number) => void;
}

function StageUnitsView({ currentStage, setCurrentStage }: StageUnitsViewProps) {
  const unitContainerRef = useRef<HTMLDivElement>(null);

  // Generate units logic
  const generateUnits = () => {
    const stages = [
      { id: 1, title: "Hiragana & Katakana", units: 8, status: "completed" },
      { id: 2, title: "Từ vựng N5", units: 7, status: "completed" },
      { id: 3, title: "Ngữ pháp cơ bản", units: 15, status: "in_progress" },
      { id: 4, title: "Kanji N5", units: 8, status: "locked" },
      { id: 5, title: "Luyện nghe N5", units: 7, status: "locked" },
      { id: 6, title: "Đọc hiểu N5", units: 6, status: "locked" },
    ];

    let unitCounter = 1;
    return stages.map((stage) => ({
      ...stage,
      unitNumbers: Array.from({ length: stage.units }, () => unitCounter++),
    }));
  };

  const allStages = generateUnits();
  const currentStageData = allStages.find((s) => s.id === currentStage);

  // Auto-scroll logic
  useEffect(() => {
    if (currentStageData?.status === "in_progress" && unitContainerRef.current) {
      const completedUnits = Math.floor(currentStageData.units * 0.65);
      const currentUnitNumber = currentStageData.unitNumbers[0] + completedUnits;
      
      setTimeout(() => {
        const currentUnitElement = document.querySelector(`[data-unit="${currentUnitNumber}"]`);
        if (currentUnitElement && unitContainerRef.current) {
          currentUnitElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
        }
      }, 100);
    }
  }, [currentStage, currentStageData]);

  if (!currentStageData) return null;

  const canGoPrevious = currentStage > 1;
  const canGoNext = currentStage < allStages.length;

  const getUnitStatusClass = (status: string) => {
    if (status === "completed") {
      return "bg-green-100 border-green-500 text-green-800";
    }
    if (status === "locked") {
      return "bg-gray-100 border-gray-400 text-gray-500";
    }
    return "bg-blue-100 border-blue-500 text-blue-800";
  };

  const getProgressPercentage = () => {
    if (currentStageData.status === "completed") return 100;
    if (currentStageData.status === "in_progress") return 65;
    return 0;
  };

  const getProgressText = () => {
    if (currentStageData.status === "completed") return "100%";
    if (currentStageData.status === "in_progress") return "65%";
    return "0%";
  };

  const getProgressDescription = () => {
    if (currentStageData.status === "completed") {
      return `Đã hoàn thành ${currentStageData.units} unit`;
    }
    if (currentStageData.status === "in_progress") {
      return `Đã hoàn thành ${Math.floor(currentStageData.units * 0.65)} / ${currentStageData.units} unit`;
    }
    return `Chưa bắt đầu - ${currentStageData.units} unit`;
  };

  const getUnitStatus = (unitNumber: number) => {
    if (currentStageData.status === "completed") return "completed";
    if (currentStageData.status === "locked") return "locked";

    const completedUnits = Math.floor(currentStageData.units * 0.65);
    return unitNumber <= currentStageData.unitNumbers[0] + completedUnits - 1 ? "completed" : "locked";
  };

  const createPathLayout = () => {
    const layout = [];
    const units = currentStageData.unitNumbers;
    let index = 0;

    while (index < units.length) {
      const isEvenRow = layout.length % 2 === 0;
      if (isEvenRow) {
        const rowUnits = units.slice(index, index + 1);
        layout.push(rowUnits);
        index += 1;
      } else {
        if (index < units.length - 1) {
          const rowUnits = units.slice(index, index + 2);
          layout.push(rowUnits);
          index += 2;
        } else {
          const rowUnits = units.slice(index, index + 1);
          layout.push(rowUnits);
          index += 1;
        }
      }
    }

    return layout;
  };

  const pathLayout = createPathLayout();

  return (
    <div className="space-y-3">
      {/* Stage Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-gray-900">Chặng {currentStage}: {currentStageData.title}</h3>
          <p className="text-sm text-gray-600">{getProgressDescription()}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600">{getProgressText()}</div>
          <Progress value={getProgressPercentage()} className="w-20 h-2" />
        </div>
      </div>

      {/* Units Path */}
      <div 
        ref={unitContainerRef}
        className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50 max-h-64 overflow-y-auto"
      >
        <div className="space-y-3">
          {pathLayout.map((row, rowIndex) => (
            <div key={rowIndex} className={`flex ${row.length === 1 ? 'justify-center' : 'justify-between'} items-center`}>
              {row.map((unitNumber) => {
                const status = getUnitStatus(unitNumber);
                return (
                  <div key={unitNumber} className="flex flex-col items-center">
                    <button
                      data-unit={unitNumber}
                      className={`w-8 h-8 rounded-full border-2 ${getUnitStatusClass(status)} flex items-center justify-center text-xs font-bold hover:scale-110 transition-transform`}
                      disabled={status === "locked"}
                    >
                      {status === "completed" ? <CheckCircle className="h-4 w-4" /> : unitNumber}
                    </button>
                    <span className="text-xs mt-1 text-gray-600">Unit {unitNumber}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentStage(currentStage - 1)}
          disabled={!canGoPrevious}
          className="flex items-center space-x-1"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Chặng trước</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentStage(currentStage + 1)}
          disabled={!canGoNext}
          className="flex items-center space-x-1"
        >
          <span>Chặng sau</span>
          <ArrowLeft className="h-3 w-3 rotate-180" />
        </Button>
      </div>
    </div>
  );
}

export default function LearningPathDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState(3);

  // Mock roadmap stages data
  const roadmapStages: RoadmapStage[] = [
    {
      id: 1,
      title: "Hiragana & Katakana",
      description: "Học bảng chữ cái tiếng Nhật cơ bản",
      status: "completed",
      progress: 100,
      position: { x: 15, y: 75 }
    },
    {
      id: 2,
      title: "Từ vựng N5",
      description: "800 từ vựng cơ bản cho kỳ thi N5",
      status: "completed",
      progress: 100,
      position: { x: 35, y: 60 }
    },
    {
      id: 3,
      title: "Ngữ pháp cơ bản",
      description: "Các mẫu câu và ngữ pháp N5",
      status: "in_progress",
      progress: 65,
      position: { x: 55, y: 40 }
    },
    {
      id: 4,
      title: "Kanji N5",
      description: "300 chữ Hán cơ bản",
      status: "locked",
      progress: 0,
      position: { x: 75, y: 25 }
    },
    {
      id: 5,
      title: "Luyện nghe N5",
      description: "Kỹ năng nghe hiểu",
      status: "locked",
      progress: 0,
      position: { x: 60, y: 10 }
    },
    {
      id: 6,
      title: "Đọc hiểu N5",
      description: "Kỹ năng đọc hiểu",
      status: "locked",
      progress: 0,
      position: { x: 40, y: 5 }
    }
  ];

  useEffect(() => {
    const fetchRoadmapData = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // Mock API call - replace with actual API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData: RoadmapData = {
          id: parseInt(id),
          title: "Lộ trình tiếng Nhật N5",
          description: "Lộ trình học tiếng Nhật từ cơ bản đến hoàn thành kỳ thi N5",
          level: "N5",
          rating: 4.8,
          students: 2580,
          overallProgress: 45,
          modules: mockCourseModules,
          goals: mockGoals,
          nextCourses: mockNextCourses,
          stats: {
            completedLessons: 38,
            studyHours: 85,
            streakDays: 12,
          },
        };

        setRoadmapData(mockData);
      } catch (error) {
        console.error("Error fetching roadmap data:", error);
        setError("Không thể tải dữ liệu lộ trình. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmapData();
  }, [id]);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Lộ trình học tập', href: '/learning-path' },
    { label: roadmapData?.title || 'Chi tiết lộ trình' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !roadmapData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Header */}
        <div className="flex items-center space-x-4 bg-white rounded-lg p-4 shadow-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại</span>
          </Button>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{roadmapData.title}</h1>
            <p className="text-gray-600">{roadmapData.description}</p>
            
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                Cấp độ {roadmapData.level}
              </Badge>
              <span className="flex items-center space-x-1 text-sm text-gray-600">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{roadmapData.rating}</span>
              </span>
              <span className="flex items-center space-x-1 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{roadmapData.students.toLocaleString()} học viên</span>
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold text-orange-600">{roadmapData.overallProgress}%</div>
            <Progress value={roadmapData.overallProgress} className="w-24" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bài học đã hoàn thành</p>
                  <p className="text-2xl font-bold text-gray-900">{roadmapData.stats.completedLessons}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Giờ học tích lũy</p>
                  <p className="text-2xl font-bold text-gray-900">{roadmapData.stats.studyHours}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Streak hiện tại</p>
                  <p className="text-2xl font-bold text-gray-900">{roadmapData.stats.streakDays} ngày</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Course Modules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Các khóa học trong lộ trình</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {roadmapData.modules.map((module) => (
                  <div key={module.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{module.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{module.estimatedTime}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <BookOpen className="h-3 w-3" />
                            <span>{module.completedLessons}/{module.totalLessons} bài</span>
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {module.difficulty}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Progress value={module.progress} className="flex-1" />
                          <span className="text-sm font-medium text-gray-600">{module.progress}%</span>
                        </div>
                      </div>

                      <div className="ml-4 text-right">
                        <Badge variant={module.status === "completed" ? "default" : module.status === "in_progress" ? "secondary" : "outline"}>
                          {module.status === "completed" ? "Hoàn thành" : module.status === "in_progress" ? "Đang học" : "Chưa bắt đầu"}
                        </Badge>
                        
                        <div className="mt-2">
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                            {module.status === "not_started" ? "Bắt đầu" : "Tiếp tục"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Learning Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Mục tiêu học tập</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {roadmapData.goals.map((goal) => (
                  <div key={goal.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      goal.completed ? "bg-green-100 border-green-500" : "border-gray-300"
                    }`}>
                      {goal.completed && <CheckCircle className="h-3 w-3 text-green-600" />}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${goal.completed ? "text-gray-500 line-through" : "text-gray-900"}`}>
                        {goal.title}
                      </h4>
                      <p className="text-sm text-gray-600">{goal.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Hạn: {goal.dueDate}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Next Courses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Khóa học tiếp theo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {roadmapData.nextCourses.map((course) => (
                  <div key={course.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <Badge variant="outline">{course.level}</Badge>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{course.estimatedTime}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Star className="h-3 w-3" />
                            <span>{course.rating}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-600">{course.price}</div>
                        <Button size="sm" className="mt-2 bg-orange-600 hover:bg-orange-700">
                          Đăng ký
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Mini Roadmap Map */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900 flex items-center space-x-1">
                <BookOpen className="h-4 w-4" />
                <span>Lộ trình tổng quan</span>
              </h3>
              <RoadmapView
                stages={roadmapStages}
                onStageClick={setCurrentStage}
                compact={true}
                showHeader={false}
                showNavigation={false}
                showStageCards={false}
              />
            </div>

            {/* Current Stage Units */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Chặng đang học</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StageUnitsView 
                  currentStage={currentStage} 
                  setCurrentStage={setCurrentStage}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
