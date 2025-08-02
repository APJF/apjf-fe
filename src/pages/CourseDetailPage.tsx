import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { ChapterList } from "../components/course/ChapterList";
import { CourseHeaderInfo } from "../components/course/CourseHeaderInfo";
import { CourseDetailTabs } from "../components/course/CourseDetailTabs";
import { LearningPathSidebar } from "../components/course/LearningPathSidebar";
import { CourseService } from "../services/courseService";
import type { Course, Chapter } from "../types/course";

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("content");
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (courseId) {
      console.log('Fetching course detail for ID:', courseId);
      fetchCourseDetail();
      checkEnrollmentStatus();
    } else {
      console.error('Course ID is undefined');
      setError('ID khóa học không hợp lệ');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchCourseDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching course detail for ID:', courseId);
      
      // Gọi song song 2 API mới
      const [courseRes, chaptersRes] = await Promise.all([
        CourseService.getCourseDetail(courseId!), // Sử dụng API mới GET /api/course/{courseId}
        CourseService.getChaptersByCourseId(courseId!) // Sử dụng API GET /api/chapters/course/{courseId}
      ]);
      
      console.log('Course response:', courseRes);
      console.log('Chapters response:', chaptersRes);
      
      if (courseRes.success) {
        setCourse(courseRes.data);
      } else {
        setError(courseRes.message || "Không thể tải thông tin khóa học");
        return;
      }
      
      if (chaptersRes.success) {
        setChapters(chaptersRes.data);
      } else {
        // Chapters không thành công không phải lỗi critical, chỉ log warning
        console.warn('Failed to load chapters:', chaptersRes.message);
        setChapters([]);
      }
      
    } catch (err: unknown) {
      console.error("Error fetching course/chapter detail:", err);
      
      // Parse error message
      let errorMessage = "Lỗi kết nối. Vui lòng thử lại.";
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number }; message?: string };
        if (axiosError.response?.status === 404) {
          errorMessage = "Không tìm thấy khóa học này.";
        } else if (axiosError.response?.status === 500) {
          errorMessage = "Lỗi server. Vui lòng thử lại sau.";
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = () => {
    // Giả lập kiểm tra đã đăng ký khóa học hay chưa
    const token = localStorage.getItem("accessToken");
    if (token) {
      // Trong thực tế, bạn sẽ cần gọi API để kiểm tra
      setIsEnrolled(true); 
    }
  };

  const handleExamClick = (examId: string) => {
    navigate(`/exam/${examId}/preparation`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
              chapters={chapters}
              courseExams={course.exams || []}
              isEnrolled={isEnrolled}
              onExamClick={handleExamClick}
              courseId={courseId!}
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
            <CourseHeaderInfo course={course} chaptersCount={chapters.length} />

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
                chapters={chapters}
                completedChapters={[]} // Tạm thời để trống
                currentChapter={chapters[0]?.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
