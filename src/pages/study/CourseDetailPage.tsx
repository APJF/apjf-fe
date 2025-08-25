import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, Clock, GraduationCap } from "lucide-react";
import { StarDisplay } from "../../components/ui/StarDisplay";
import EnrollButton from "../../components/course/EnrollButton";
import CourseTabs from "../../components/course/CourseTabs";
import { CourseService } from "../../services/courseService";
import type { Course, Chapter } from "../../types/course";
import { Breadcrumb, type BreadcrumbItem } from '../../components/ui/Breadcrumb';
import { useLanguage } from "../../contexts/LanguageContext";
import { RoadmapView, type RoadmapStage } from "../../components/roadmap/RoadmapView";

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

  // Mock roadmap data for this course
  const roadmapStages: RoadmapStage[] = [
    {
      id: 1,
      title: "Cơ bản",
      description: "Nắm vững kiến thức nền tảng",
      status: course.isEnrolled ? "completed" : "locked",
      progress: course.isEnrolled ? 100 : 0,
    },
    {
      id: 2,
      title: "Thực hành",
      description: "Luyện tập với bài tập",
      status: course.isEnrolled ? "in_progress" : "locked",
      progress: course.isEnrolled ? 65 : 0,
    },
    {
      id: 3,
      title: "Nâng cao",
      description: "Kiến thức chuyên sâu",
      status: "locked",
      progress: 0,
    },
    {
      id: 4,
      title: "Kiểm tra",
      description: "Đánh giá kết quả",
      status: "locked",
      progress: 0,
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Layout theo ảnh: Trái to (chapters/exam/review/description) - Phải nhỏ (course detail + roadmap) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cột trái: Course detail (hero) + Tabs description/chapters/exams/reviews */}
        <div className="lg:col-span-8 space-y-6">
          {/* Large course hero / detail */}
          <div className="bg-rose-50 text-slate-900 rounded-xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch gap-3 lg:gap-4 min-h-0">
              <div className="lg:col-span-6 p-2 sm:p-4 flex flex-col justify-between h-full">
                <div className="space-y-1.5 sm:space-y-2">
                  <h1 className="text-base sm:text-lg lg:text-2xl font-semibold leading-tight">{course.id}</h1>
                  <p className="text-rose-700 text-sm mb-1">{course.title}</p>

                  <div className="flex items-center gap-3 text-sm text-rose-700">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white/60 text-slate-900">
                      <Clock className="w-4 h-4 text-rose-600" /> {Math.round((course.duration || 0) / 60)}h
                    </span>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white/60 text-slate-900">
                      <GraduationCap className="w-4 h-4 text-rose-600" /> {course.level}
                    </span>
                  </div>

                  {/* Rating */}
                  <div>
                    <StarDisplay rating={course.averageRating || 0} />
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {course.topics?.slice(0, 4).map((topic) => (
                      <span key={topic.id} className="text-xs px-2 py-0.5 bg-white/60 rounded-lg text-slate-900">{topic.name}</span>
                    ))}
                  </div>
                </div>

                {/* Enroll (left) + Price (right) */}
                <div className="flex items-center justify-between gap-3 mt-3">
                  <div className="flex items-center">
                    <EnrollButton courseId={course.id} courseTitle={course.title} isEnrolled={course.isEnrolled} />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-rose-600">Giá</div>
                    <div className="text-lg font-bold text-slate-900">
                      { (course.price ?? 0) === 0 ? t('courseDetail.free') || 'Miễn phí' : `${(course.price ?? 0).toLocaleString('vi-VN')}₫` }
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 p-2 sm:p-4 flex items-center justify-center">
                <div className="w-full max-w-[540px] rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10">
                  <img src={course.image || '/placeholder.svg'} alt={course.title} className="w-full h-full object-cover aspect-[2/1] block" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs: Description / Chapters / Exams / Reviews (left, under hero) */}
          <CourseTabs
            description={description}
            chapters={chapters.map(ch => ({ id: ch.id, title: ch.title, duration: 0 }))}
          />
        </div>

        {/* Cột phải: Roadmap (narrow) */}
        <div className="lg:col-span-4">
          <RoadmapView
            stages={roadmapStages}
            title="Lộ trình"
            compact={true}
            showHeader={true}
            showNavigation={false}
            showStageCards={false}
            headerInfo={{
              targetLevel: course.level,
              status: course.isEnrolled ? "Đang học" : "Chưa đăng ký",
              coursesCount: chapters.length
            }}
            onStageClick={(stageId) => console.log('Clicked stage:', stageId)}
          />
        </div>
      </section>
    </main>
  );
}
