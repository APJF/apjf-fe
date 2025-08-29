import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, Clock, GraduationCap } from "lucide-react";
import { StarDisplay } from "../../components/ui/StarDisplay";
import EnrollButton from "../../components/course/EnrollButton";
import CourseTabs from "../../components/course/CourseTabs";
import { CourseService } from "../../services/courseService";
import { learningPathService } from "../../services/learningPathService";
import type { ActiveLearningPath } from "../../services/learningPathService";
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
  const [activePathDetail, setActivePathDetail] = useState<ActiveLearningPath | null>(null);
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
      
      // Gọi song song 3 API: course detail, chapters, và active learning path
      const [courseRes, chaptersRes, activePathRes] = await Promise.allSettled([
        CourseService.getCourseDetail(courseId!),
        CourseService.getChaptersByCourseId(courseId!),
        learningPathService.getActiveLearningPath()
      ]);
      
      console.log('Course response:', courseRes);
      console.log('Chapters response:', chaptersRes);
      console.log('Active path response:', activePathRes);
      
      // Process course data
      if (courseRes.status === 'fulfilled' && courseRes.value.success) {
        setCourse(courseRes.value.data);
      } else {
        const errorMsg = courseRes.status === 'fulfilled' 
          ? courseRes.value.message || "Không thể tải thông tin khóa học"
          : "Lỗi kết nối khi tải khóa học";
        setError(errorMsg);
        return;
      }
      
      // Process chapters data
      if (chaptersRes.status === 'fulfilled' && chaptersRes.value.success) {
        // Only show active chapters
        const activeChapters = (chaptersRes.value.data || []).filter(chapter => chapter.status === "ACTIVE");
        const sortedChapters = sortChaptersByPrerequisite(activeChapters);
        setChapters(sortedChapters);
      } else {
        console.warn('Could not load chapters:', chaptersRes.status === 'fulfilled' ? chaptersRes.value.message : 'Connection error');
        setChapters([]);
      }

      // Process active learning path data
      if (activePathRes.status === 'fulfilled' && activePathRes.value.success) {
        setActivePathDetail(activePathRes.value.data);
        console.log('✅ Active learning path loaded:', activePathRes.value.data);
      } else {
        console.warn('⚠️ Could not load active learning path:', activePathRes.status === 'fulfilled' ? activePathRes.value.message : 'Connection error');
        setActivePathDetail(null);
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

  // Create roadmap stages based on active learning path or fallback data
  const createRoadmapStages = (): RoadmapStage[] => {
    // Nếu có active learning path và courseId này có trong path đó
    if (activePathDetail?.courses) {
      const currentCourse = activePathDetail.courses.find(c => c.id === courseId);
      if (currentCourse) {
        // Tạo roadmap từ tất cả courses trong learning path, highlight current course
        return activePathDetail.courses
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
    }

    // Fallback: Mock roadmap data for this course
    return [
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
  };

  const roadmapStages: RoadmapStage[] = createRoadmapStages();

  // Determine status text
  const getStatusText = () => {
    if (activePathDetail) {
      return activePathDetail.status === 'ACTIVE' ? "Đang học" : "Tạm dừng";
    } else {
      return course.isEnrolled ? "Đang học" : "Chưa đăng ký";
    }
  };

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
            title={activePathDetail ? "Lộ trình học tập" : "Tiến độ khóa học"}
            compact={true}
            showHeader={true}
            showNavigation={false}
            showStageCards={false}
            headerInfo={{
              targetLevel: activePathDetail?.targetLevel || course.level,
              status: getStatusText(),
              coursesCount: activePathDetail?.courses?.length || chapters.length
            }}
            onStageClick={(stageId) => {
              console.log('Clicked stage:', stageId);
              // Nếu có active learning path, navigate đến course tương ứng
              if (activePathDetail?.courses) {
                // Sắp xếp courses theo courseOrderNumber trước khi tìm kiếm
                const sortedCourses = activePathDetail.courses
                  .sort((a, b) => (a.courseOrderNumber || 0) - (b.courseOrderNumber || 0));
                  
                // Tìm course dựa trên index trong danh sách đã sắp xếp
                const courseIndex = stageId - 1;
                let targetCourse;
                
                if (courseIndex >= 0 && courseIndex < sortedCourses.length) {
                  targetCourse = sortedCourses[courseIndex];
                }
                
                if (targetCourse && targetCourse.id !== courseId) {
                  navigate(`/courses/${targetCourse.id}`);
                }
              }
            }}
          />
        </div>
      </section>
    </main>
  );
}
