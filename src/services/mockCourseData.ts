import type { CourseDetailApiResponse } from '../types/courseDetail';

// Mock data cho khóa học
const mockCourseData: CourseDetailApiResponse = {
  success: true,
  message: "Lấy thông tin khóa học thành công",
  data: {
    course: {
      id: "course-n5-01",
      title: "Tiếng Nhật N5 - Khóa học cơ bản cho người mới bắt đầu",
      description: "Khóa học tiếng Nhật N5 dành cho người mới bắt đầu, giúp bạn nắm vững kiến thức cơ bản về ngữ pháp, từ vựng và các kỹ năng giao tiếp cơ bản trong tiếng Nhật. Khóa học này sẽ giúp bạn chuẩn bị tốt cho kỳ thi JLPT N5.",
      duration: 36, // Số giờ học
      level: "N5",
      image: "https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=1000&auto=format&fit=crop",
      requirement: "Không yêu cầu kiến thức nền tảng, phù hợp cho người mới học tiếng Nhật",
      status: "PUBLISHED",
      prerequisiteCourseId: null,
      topics: [
        { id: 1, name: "Tiếng Nhật cơ bản" },
        { id: 2, name: "JLPT N5" },
        { id: 3, name: "Ngữ pháp tiếng Nhật" }
      ],
      exams: [
        {
          id: "exam-n5-final",
          title: "Bài kiểm tra cuối khóa N5",
          description: "Đánh giá tổng thể kiến thức JLPT N5",
          duration: 120, // Thời gian làm bài (phút)
          examScopeType: "COURSE",
          createdAt: "2023-06-15T08:00:00Z"
        }
      ],
      chapters: [
        {
          id: "chapter-01",
          title: "Chương 1: Giới thiệu và các ký tự cơ bản",
          description: "Học cách đọc và viết Hiragana, Katakana và một số Kanji đơn giản",
          status: "PUBLISHED",
          courseId: "course-n5-01",
          prerequisiteChapterId: null,
          exams: [
            {
              id: "exam-chapter-01",
              title: "Kiểm tra Chương 1",
              description: "Kiểm tra kiến thức về Hiragana và Katakana",
              duration: 30,
              examScopeType: "CHAPTER",
              createdAt: "2023-06-01T10:00:00Z"
            }
          ],
          units: [
            {
              id: "unit-01",
              title: "Bảng chữ cái Hiragana",
              description: "Học cách đọc và viết 46 ký tự Hiragana cơ bản",
              status: "PUBLISHED",
              chapterId: "chapter-01",
              prerequisiteUnitId: null,
              exams: []
            },
            {
              id: "unit-02",
              title: "Bảng chữ cái Katakana",
              description: "Học cách đọc và viết 46 ký tự Katakana cơ bản",
              status: "PUBLISHED",
              chapterId: "chapter-01",
              prerequisiteUnitId: "unit-01",
              exams: []
            }
          ]
        },
        {
          id: "chapter-02",
          title: "Chương 2: Ngữ pháp cơ bản",
          description: "Các cấu trúc ngữ pháp cơ bản trong tiếng Nhật",
          status: "PUBLISHED",
          courseId: "course-n5-01",
          prerequisiteChapterId: "chapter-01",
          exams: [],
          units: [
            {
              id: "unit-03",
              title: "Cấu trúc câu cơ bản",
              description: "Học cách tạo câu đơn giản trong tiếng Nhật",
              status: "PUBLISHED",
              chapterId: "chapter-02",
              prerequisiteUnitId: null,
              exams: []
            },
            {
              id: "unit-04",
              title: "Động từ nhóm 1",
              description: "Học cách chia động từ nhóm 1 (động từ -u)",
              status: "PUBLISHED",
              chapterId: "chapter-02",
              prerequisiteUnitId: "unit-03",
              exams: []
            },
            {
              id: "unit-05",
              title: "Động từ nhóm 2 và 3",
              description: "Học cách chia động từ nhóm 2 (động từ -ru) và nhóm 3 (động từ bất quy tắc)",
              status: "PUBLISHED",
              chapterId: "chapter-02",
              prerequisiteUnitId: "unit-04",
              exams: [
                {
                  id: "exam-unit-05",
                  title: "Kiểm tra động từ",
                  description: "Kiểm tra kiến thức về chia động từ các nhóm",
                  duration: 20,
                  examScopeType: "UNIT",
                  createdAt: "2023-06-10T14:00:00Z"
                }
              ]
            }
          ]
        },
        {
          id: "chapter-03",
          title: "Chương 3: Từ vựng và giao tiếp cơ bản",
          description: "Học từ vựng và cách giao tiếp trong các tình huống hàng ngày",
          status: "PUBLISHED",
          courseId: "course-n5-01",
          prerequisiteChapterId: "chapter-02",
          exams: [],
          units: [
            {
              id: "unit-06",
              title: "Chào hỏi và giới thiệu",
              description: "Học cách chào hỏi và giới thiệu bản thân trong tiếng Nhật",
              status: "PUBLISHED",
              chapterId: "chapter-03",
              prerequisiteUnitId: null,
              exams: []
            },
            {
              id: "unit-07",
              title: "Số đếm và thời gian",
              description: "Học cách đếm số và nói về thời gian trong tiếng Nhật",
              status: "PUBLISHED",
              chapterId: "chapter-03",
              prerequisiteUnitId: "unit-06",
              exams: []
            }
          ]
        }
      ]
    }
  },
  timestamp: Date.now()
};

// Khai báo Record type để sửa lỗi TypeScript
export type CourseRecord = Record<string, CourseDetailApiResponse>;

// Sửa interface mockCourses để phù hợp với Record type
const mockCourses: CourseRecord = {
  "course-n5-01": mockCourseData,
  "course-n4-01": {
    success: true,
    message: "Lấy thông tin khóa học thành công",
    data: {
      course: {
        id: "course-n4-01",
        title: "Tiếng Nhật N4 - Nâng cao kỹ năng giao tiếp",
        description: "Khóa học tiếng Nhật trình độ N4, giúp bạn nâng cao kỹ năng giao tiếp và mở rộng vốn từ vựng, ngữ pháp. Hoàn thành khóa học này, bạn sẽ có đủ kiến thức để chinh phục kỳ thi JLPT N4.",
        duration: 48,
        level: "N4",
        image: "https://images.unsplash.com/photo-1492571350019-22de08371fd3?q=80&w=1000&auto=format&fit=crop",
        requirement: "Yêu cầu trình độ N5 hoặc tương đương",
        status: "PUBLISHED",
        prerequisiteCourseId: "course-n5-01",
        topics: [
          { id: 4, name: "Tiếng Nhật trung cấp" },
          { id: 5, name: "JLPT N4" },
          { id: 6, name: "Đọc hiểu tiếng Nhật" }
        ],
        exams: [],
        chapters: [
          {
            id: "chapter-n4-01",
            title: "Chương 1: Ngữ pháp nâng cao",
            description: "Các cấu trúc ngữ pháp trình độ N4",
            status: "PUBLISHED",
            courseId: "course-n4-01",
            prerequisiteChapterId: null,
            exams: [],
            units: []
          }
        ]
      }
    },
    timestamp: Date.now()
  }
};

export { mockCourses, mockCourseData };
