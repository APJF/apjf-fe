import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, Clock, GraduationCap, Tag } from "lucide-react";
import { StarDisplay } from "../../components/ui/StarDisplay";
import EnrollButton from "../../components/course/EnrollButton";
import CourseTabs from "../../components/course/CourseTabs";
import { CourseService } from "../../services/courseService";
import type { Course, Chapter } from "../../types/course";
import { Breadcrumb, type BreadcrumbItem } from '../../components/ui/Breadcrumb';
import { useLanguage } from "../../contexts/LanguageContext";

// Function to sort chapters by prerequisite order
function sortChaptersByPrerequisite(chapters: Chapter[]): Chapter[] {
  const chapterMap = new Map<string, Chapter>();
  const sortedChapters: Chapter[] = [];
  const visited = new Set<string>();
  const inProgress = new Set<string>();

  // Tạo map để dễ lookup
  chapters.forEach(chapter => {
    chapterMap.set(chapter.id, chapter);
  });

  // Hàm đệ quy để sắp xếp theo thứ tự prerequisite
  function visit(chapterId: string): void {
    if (visited.has(chapterId) || inProgress.has(chapterId)) {
      return; // Tránh vòng lặp vô hạn
    }

    const chapter = chapterMap.get(chapterId);
    if (!chapter) {
      return;
    }

    inProgress.add(chapterId);

    // Nếu có prerequisite, xử lý prerequisite trước
    if (chapter.prerequisiteChapterId && chapterMap.has(chapter.prerequisiteChapterId)) {
      visit(chapter.prerequisiteChapterId);
    }

    inProgress.delete(chapterId);
    
    if (!visited.has(chapterId)) {
      visited.add(chapterId);
      sortedChapters.push(chapter);
    }
  }

  // Bắt đầu với các chapter không có prerequisite
  chapters.forEach(chapter => {
    if (!chapter.prerequisiteChapterId) {
      visit(chapter.id);
    }
  });

  // Thêm các chapter còn lại (có prerequisite)
  chapters.forEach(chapter => {
    if (!visited.has(chapter.id)) {
      visit(chapter.id);
    }
  });

  return sortedChapters;
}

export default function CourseDetailPage() {
  const { t } = useLanguage();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      console.log('Fetching course detail for ID:', courseId);
      fetchCourseDetail();
    } else {
      console.error('Course ID is undefined');
      setError(t('courseDetail.invalidCourseId'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchCourseDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching course detail for ID:', courseId);
      
      // Gọi song song 2 API
      const [courseRes, chaptersRes] = await Promise.all([
        CourseService.getCourseDetail(courseId!),
        CourseService.getChaptersByCourseId(courseId!)
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
        const sortedChapters = sortChaptersByPrerequisite(chaptersRes.data || []);
        setChapters(sortedChapters);
      } else {
        console.warn('Could not load chapters:', chaptersRes.message);
        setChapters([]);
      }
      
    } catch (error) {
      console.error('Error fetching course detail:', error);
      setError(t('courseDetail.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">{t('courseDetail.loading')}</span>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {t('courseDetail.cannotLoadCourse')}
          </h1>
          <p className="text-gray-600 mb-6">
            {error || t('courseDetail.courseNotFound')}
          </p>
          <button
            onClick={() => navigate('/courses')}
            className="bg-rose-600 text-white px-6 py-2 rounded-lg hover:bg-rose-700 transition-colors"
          >
            {t('courseDetail.backToCourses')}
          </button>
        </div>
      </div>
    );
  }

  const description = course.description || t('courseDetail.defaultDescription');
    
  // Create breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t('header.home'), href: '/' },
    { label: t('courses.title'), href: '/courses' },
    { label: course.title } // Current page - no href
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Layout 10 cột: trái 7/10 cho detail + tabs */}
      <section className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        <div className="lg:col-span-7 space-y-6">
          {/* Card detail */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Ảnh cover */}
            <img
              src={course.image || "/placeholder.svg"}
              alt={course.title}
              className="w-full aspect-[2/1] object-cover"
            />

            {/* Nội dung detail */}
            <div className="p-6">
              <h1 className="text-2xl font-semibold text-gray-900">{course.id}</h1>
              <p className="text-lg text-gray-600 mt-2">{course.title}</p>

              {/* Hàng 1: Duration + Level */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                  <Clock className="w-4 h-4 text-gray-500" />
                  {Math.round((course.duration || 0) / 60)}h
                </span>
                <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-blue-100 text-blue-700">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  {course.level}
                </span>
              </div>

              {/* Hàng 2: Topics */}
              {course.topics && course.topics.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  {course.topics.map((topic) => (
                    <span 
                      key={topic.id} 
                      className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-rose-100 text-rose-700"
                    >
                      <Tag className="w-4 h-4 text-rose-500" />
                      {topic.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Rating ngay dưới */}
              <div className="mt-3">
                <StarDisplay rating={course.averageRating || 0} />
              </div>

              {/* Hàng: Giá + Enroll (cùng hàng) */}
              <div className="mt-4 flex items-center gap-4">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">{t('courseDetail.free')}</div>
                <div className="ml-auto">
                  <EnrollButton 
                    courseId={course.id} 
                    courseTitle={course.title} 
                    isEnrolled={course.isEnrolled} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs: Chapters / Overview / Reviews */}
          <CourseTabs 
            description={description} 
            chapters={chapters.map(ch => ({
              id: ch.id,
              title: ch.title,
              duration: 0 // Tạm thời set duration = 0, có thể tính từ units sau
            }))} 
          />
        </div>

        {/* Cột phải 3/10 (để trống cho mở rộng sau) */}
        <div className="hidden lg:block lg:col-span-3" />
      </section>
    </main>
  );
}
