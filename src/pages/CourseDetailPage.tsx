import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  AlertCircle, 
  ArrowLeft, 
  BookOpen, 
  Users, 
  Star, 
  Clock, 
  Flame,
  CheckCircle, 
  Circle, 
  Lock
} from "lucide-react";
import { ChapterList } from "../components/ChapterList";

interface Topic {
  id: number;
  name: string;
}

interface CourseExam {
  id: string;
  title: string;
  description: string;
  duration: number;
  examScopeType: string;
  createdAt: string;
}

interface Unit {
  id: string;
  title: string;
  description: string;
  status: string;
  chapterId: string;
  prerequisiteUnitId: string | null;
  exams: CourseExam[];
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  status: string;
  courseId: string;
  prerequisiteChapterId: string | null;
  exams: CourseExam[];
  units: Unit[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: string;
  image: string | null;
  requirement: string | null;
  status: string;
  prerequisiteCourseId: string | null;
  topics: Topic[];
  exams: CourseExam[];
  chapters: Chapter[];
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Course; // Changed from { course: Course } to Course directly
  timestamp: number;
}

// Header Component (inline)
function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-red-600">日本語Learning</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-gray-700 hover:text-red-600">Trang chủ</a>
            <a href="/courses" className="text-gray-700 hover:text-red-600">Khóa học</a>
          </nav>
        </div>
      </div>
    </header>
  );
}

// Course Detail Tabs Component (inline)
interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function CourseDetailTabs({ activeTab, onTabChange }: Readonly<TabsProps>) {
  const tabs = [
    { id: "content", label: "Nội dung khóa học", icon: BookOpen },
    { id: "overview", label: "Tổng quan", icon: Users },
    { id: "reviews", label: "Đánh giá", icon: Star },
  ];

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex space-x-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Course Header Info Component (inline)
interface CourseHeaderInfoProps {
  course: Course;
  chaptersCount: number;
}

function CourseHeaderInfo({ course, chaptersCount }: Readonly<CourseHeaderInfoProps>) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case "N5":
        return "bg-green-500 text-white";
      case "N4":
        return "bg-blue-500 text-white";
      case "N3":
        return "bg-yellow-500 text-white";
      case "N2":
        return "bg-orange-500 text-white";
      case "N1":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);
    if (hours === 0) return `${minutes} phút học`;
    if (minutes === 0) return `${hours} giờ học`;
    return `${hours} giờ ${minutes} phút học`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      {/* Badges */}
      <div className="flex items-center gap-3 mb-4">
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
          <Flame className="w-3 h-3" />
          HOT
        </span>
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getLevelColor(course.level)}`}>
          JLPT {course.level}
        </span>
        <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
          <Star className="w-3 h-3 fill-current" />
          4.8
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-3">{course.title}</h1>

      {/* Description */}
      <p className="text-gray-600 text-lg mb-6">{course.description}</p>

      {/* Course Info */}
      <div className="flex items-center gap-6 text-gray-600">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{formatDuration(course.duration)}</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          <span className="text-sm">{chaptersCount} chương</span>
        </div>
      </div>
    </div>
  );
}

// Learning Path Sidebar Component (inline)
interface LearningPathSidebarProps {
  chapters: Chapter[];
  completedChapters: string[];
  currentChapter?: string;
  isEnrolled: boolean;
}

function LearningPathSidebar({
  chapters,
  completedChapters,
  currentChapter,
}: Readonly<Omit<LearningPathSidebarProps, 'isEnrolled'>>) {
  const getChapterStatus = (chapterId: string, index: number) => {
    if (completedChapters.includes(chapterId)) return "completed";
    if (currentChapter === chapterId) return "current";
    if (index === 0 || completedChapters.includes(chapters[index - 1]?.id)) return "available";
    return "locked";
  };

  const getIconByStatus = (status: string) => {
    if (status === "completed") {
      return <CheckCircle className="w-6 h-6 text-white" />;
    }
    if (status === "current") {
      return (
        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        </div>
      );
    }
    if (status === "available") {
      return <Circle className="w-6 h-6 text-white" />;
    }
    return <Lock className="w-6 h-6 text-white/50" />;
  };

  return (
    <div className="bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 text-white">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-xl">🗾</span><span> Lộ trình học tập</span>
        </h3>
      </div>

      {/* Learning Path Image */}
      <div className="relative px-6 pb-4">
        <div className="w-full h-64 bg-white/10 rounded-lg flex items-center justify-center">
          <span className="text-white/50 text-sm">Learning Path Image</span>
        </div>
      </div>

      {/* Chapter Progress */}
      <div className="p-6 space-y-4">
        {chapters.map((chapter, index) => {
          const status = getChapterStatus(chapter.id, index);

          return (
            <div key={chapter.id} className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {getIconByStatus(status)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium text-sm ${status === "locked" ? "text-white/50" : "text-white"}`}>
                  Chương {index + 1}
                </h4>
                <p className={`text-xs truncate ${status === "locked" ? "text-white/40" : "text-white/80"}`}>
                  {chapter.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="px-6 pb-6">
        <div className="bg-white/20 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-500"
            style={{ width: `${(completedChapters.length / chapters.length) * 100}%` }}
          />
        </div>
        <p className="text-white/80 text-xs mt-2 text-center">
          {completedChapters.length}/{chapters.length} chương hoàn thành
        </p>
      </div>
    </div>
  );
}

// Main CourseDetailPage Component
export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("content");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completedUnits, setCompletedUnits] = useState<string[]>([]);
  const [completedChapters, setCompletedChapters] = useState<string[]>([]);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetail();
      checkEnrollmentStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchCourseDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching course detail for courseId:", courseId);
      
      // Prepare headers with authorization if token exists
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`http://localhost:8080/api/courses/${courseId}`, {
        method: "GET",
        headers,
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      console.log("API Response:", data);

      if (data.success) {
        setCourse(data.data);
        console.log("Course data set successfully:", data.data);
      } else {
        setError(data.message || "Không thể tải thông tin khóa học");
        console.error("API returned success: false", data);
      }
    } catch (err) {
      setError("Lỗi kết nối. Vui lòng thử lại.");
      console.error("Error fetching course detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = () => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsEnrolled(true);
      setCompletedUnits(["unit-01", "unit-02"]);
      setCompletedChapters(["chapter-01"]);
    }
  };

  const handleUnitClick = (unitId: string) => {
    navigate(`/courses/${courseId}/units/${unitId}`);
  };

  const handleExamClick = (examId: string) => {
    navigate(`/exam/${examId}/preparation`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">Đang tải thông tin khóa học...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Không thể tải thông tin khóa học</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={fetchCourseDetail}
              className="ml-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "content":
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-red-600 flex items-center gap-2 mb-4">
                <span className="text-red-600">📚</span><span> Chương trình học</span>
              </h2>
            </div>
            <ChapterList
              chapters={course.chapters || []}
              courseExams={course.exams || []}
              isEnrolled={isEnrolled}
              completedUnits={completedUnits}
              onUnitClick={handleUnitClick}
              onExamClick={handleExamClick}
            />
          </div>
        );
      case "overview":
        return (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tổng quan khóa học</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-6">{course.description}</p>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mục tiêu khóa học</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Nắm vững kiến thức cơ bản về tiếng Nhật cấp độ {course.level}</li>
                <li>• Đọc và viết được các ký tự Hiragana và Katakana</li>
                <li>• Giao tiếp cơ bản trong các tình huống hàng ngày</li>
                <li>• Chuẩn bị tốt cho kỳ thi JLPT {course.level}</li>
              </ul>
            </div>
          </div>
        );
      case "reviews":
        return (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Đánh giá từ học viên</h2>
            <div className="text-center py-12">
              <p className="text-gray-500">Chức năng đánh giá đang được phát triển</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate("/courses")}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách khóa học</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <CourseHeaderInfo course={course} chaptersCount={course.chapters?.length || 0} />

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <CourseDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />
              <div className="p-6">{renderTabContent()}</div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <LearningPathSidebar
                chapters={course.chapters || []}
                completedChapters={completedChapters}
                currentChapter={course.chapters?.[0]?.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
