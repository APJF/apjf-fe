import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { ChapterList } from "../components/ChapterList";
import { CourseHeaderInfo } from "../components/course/CourseHeaderInfo";
import { CourseDetailTabs } from "../components/course/CourseDetailTabs";
import { LearningPathSidebar } from "../components/course/LearningPathSidebar";
import type { Course, CourseDetailApiResponse } from "../types/courseDetail";

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
      const response = await fetch(`http://localhost:8080/api/courses/${courseId}/detail`);
      const data: CourseDetailApiResponse = await response.json();

      if (data.success) {
        setCourse(data.data.course);
      } else {
        setError(data.message || "Không thể tải thông tin khóa học");
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
    navigate(`/courses/${courseId}/exams/${examId}`);
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
              chapters={course.chapters}
              courseExams={course.exams}
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
            <CourseHeaderInfo course={course} chaptersCount={course.chapters.length} />

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
                chapters={course.chapters}
                completedChapters={completedChapters}
                currentChapter={course.chapters[0]?.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
