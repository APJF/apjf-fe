import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Progress } from "../components/ui/Progress";
import { Alert } from "../components/ui/Alert";
import { roadmapService } from "../services/roadmapService";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Play,
  CheckCircle,
  Target,
  Star,
  Edit,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Users,
  GripVertical
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Interfaces phù hợp với API response thực tế
interface CourseInPath {
  courseId: string;
  learningPathId: number;
  courseOrderNumber: number;
  title: string;
  description: string | null;
  duration: number;
  level: string;
}

interface CourseWithDetails extends CourseInPath {
  // Additional fields for display
  instructor?: string;
  rating?: number;
  students?: number;
  totalLessons?: number;
  progress?: number;
  status?: "not_started" | "in_progress" | "completed";
}

interface LearningPathApiResponse {
  id: number;
  title: string;
  description: string;
  targetLevel: string;
  primaryGoal: string;
  focusSkill: string;
  status: "PENDING" | "STUDYING" | "FINISHED";
  duration: number;
  userId: number;
  username: string;
  createdAt: string;
  lastUpdatedAt: string;
  courses: CourseInPath[]; // This matches the actual API response structure
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

interface LearningPathData {
  id: number;
  title: string;
  description: string;
  targetLevel: string;
  primaryGoal: string;
  focusSkill: string;
  status: "PENDING" | "STUDYING" | "FINISHED";
  duration: number;
  userId: number;
  username: string;
  rating?: number;
  students?: number;
  overallProgress?: number;
  courses: CourseWithDetails[];
  goals?: LearningGoal[];
  nextCourses?: NextCourse[];
  stats?: {
    completedLessons: number;
    studyHours: number;
    streakDays: number;
  };
}

// Mock data for development
const mockCoursesWithDetails: CourseWithDetails[] = [
  {
    courseId: "JPD111",
    learningPathId: 1,
    courseOrderNumber: 1,
    title: "Tiếng Nhật N5 - Cơ bản",
    description: "Khóa học tổng hợp về tiếng Nhật cơ bản cho người mới bắt đầu",
    level: "N5",
    progress: 40,
    totalLessons: 45,
    duration: 40,
    status: "in_progress",
    rating: 4.8,
    students: 1250,
    instructor: "Sensei Tanaka",
  },
  {
    courseId: "JPD112",
    learningPathId: 1,
    courseOrderNumber: 2,
    title: "Kanji cơ bản - 300 chữ Hán đầu tiên",
    description: "Học thuộc 300 chữ Kanji cơ bản nhất trong tiếng Nhật",
    level: "N5",
    progress: 65,
    totalLessons: 30,
    duration: 25,
    status: "in_progress",
    rating: 4.7,
    students: 890,
    instructor: "Sensei Yamada",
  },
  {
    courseId: "JPD113",
    learningPathId: 1,
    courseOrderNumber: 3,
    title: "Tiếng Nhật N4 - Sơ cấp",
    description: "Nâng cao kỹ năng tiếng Nhật lên trình độ N4",
    level: "N4",
    progress: 0,
    totalLessons: 50,
    duration: 50,
    status: "not_started",
    rating: 4.6,
    students: 650,
    instructor: "Sensei Sato",
  },
];

const mockLearningGoals: LearningGoal[] = [
  {
    id: 1,
    title: "Đạt chứng chỉ N5",
    description: "Hoàn thành kỳ thi JLPT N5 với điểm số cao",
    completed: false,
    dueDate: "30/06/2024",
  },
  {
    id: 2,
    title: "Giao tiếp cơ bản",
    description: "Có thể giao tiếp cơ bản trong cuộc sống hàng ngày",
    completed: false,
    dueDate: "15/07/2024",
  },
  {
    id: 3,
    title: "Đọc hiểu văn bản đơn giản",
    description: "Đọc và hiểu được các văn bản tiếng Nhật đơn giản",
    completed: false,
    dueDate: "31/07/2024",
  },
  {
    id: 4,
    title: "Viết được 300 chữ Kanji",
    description: "Nhớ và viết được 300 chữ Kanji cơ bản",
    completed: true,
    dueDate: "15/05/2024",
  },
];

const mockNextCourses: NextCourse[] = [
  {
    id: 1,
    title: "Kanji nâng cao - 500 chữ Hán tiếp theo",
    description: "Mở rộng vốn Kanji lên 800 chữ",
    level: "N4-N3",
    estimatedTime: "40 giờ",
    price: "1,200,000đ",
    rating: 4.7,
  },
];

// Sortable Course Item Component
function SortableCourseItem({ 
  course, 
  getStatusBadge, 
  getLevelColor, 
  navigate 
}: Readonly<{
  course: CourseWithDetails;
  getStatusBadge: (status: string) => React.ReactElement;
  getLevelColor: (level: string) => string;
  navigate: (path: string) => void;
}>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: course.courseId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`border rounded-lg p-4 hover:shadow-sm transition-shadow ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-start space-x-4">
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners}
          className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mt-1"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Course Number */}
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-blue-600">{course.courseOrderNumber}</span>
        </div>

        {/* Course Content */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-gray-900">{course.title || course.courseId}</h3>
              <p className="text-sm text-gray-600">{course.description || `Khóa học ${course.courseId}`}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">{course.progress || 0}%</div>
              {getStatusBadge(course.status || "not_started")}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <Progress value={course.progress || 0} className="h-2" />
          </div>

          {/* Course Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <Badge className={getLevelColor(course.level || "N5")}>{course.level || "N5"}</Badge>
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{course.duration || 30} giờ</span>
              </span>
              <span className="flex items-center space-x-1">
                <BookOpen className="h-3 w-3" />
                <span>{course.totalLessons || 0} bài</span>
              </span>
              <span className="flex items-center space-x-1">
                <Star className="h-3 w-3" />
                <span>{course.rating || 0}</span>
              </span>
            </div>

            <div className="flex space-x-2">
              {course.status === "in_progress" && (
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700" 
                  onClick={() => navigate(`/courses/${course.courseId}`)}
                >
                  Tiếp tục
                </Button>
              )}
              {course.status === "not_started" && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate(`/courses/${course.courseId}`)}
                >
                  Bắt đầu
                </Button>
              )}
              {course.status === "completed" && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate(`/courses/${course.courseId}`)}
                >
                  Ôn tập
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mini Learning Path Map Component - Copy từ LearningPathPage với đầy đủ logic
function MiniLearningPathMap({ onStageClick }: Readonly<{ onStageClick: (stageId: number) => void }>) {
  const [currentPage, setCurrentPage] = useState(0);

  // Sample learning path data with stages - giống y hệt LearningPathPage
  const learningPathStages = [
    {
      id: 1,
      title: "Hiragana & Katakana",
      description: "Học thuộc 46 ký tự cơ bản",
      status: "completed",
      progress: 100,
      position: { x: 15, y: 25 },
    },
    {
      id: 2,
      title: "Từ vựng N5",
      description: "800 từ vựng thiết yếu",
      status: "completed",
      progress: 100,
      position: { x: 35, y: 45 },
    },
    {
      id: 3,
      title: "Ngữ pháp cơ bản",
      description: "Các mẫu câu N5",
      status: "in_progress",
      progress: 65,
      position: { x: 55, y: 35 },
    },
    {
      id: 4,
      title: "Kanji N5",
      description: "103 chữ Kanji cơ bản",
      status: "locked",
      progress: 0,
      position: { x: 75, y: 55 },
    },
    {
      id: 5,
      title: "Luyện nghe N5",
      description: "Kỹ năng nghe hiểu",
      status: "locked",
      progress: 0,
      position: { x: 25, y: 65 },
    },
    {
      id: 6,
      title: "Đọc hiểu N5",
      description: "Đọc và hiểu văn bản",
      status: "locked",
      progress: 0,
      position: { x: 65, y: 75 },
    },
  ];

  const stagesPerPage = 4;
  const totalPages = Math.ceil(learningPathStages.length / stagesPerPage);
  const currentStages = learningPathStages.slice(currentPage * stagesPerPage, (currentPage + 1) * stagesPerPage);

  // Cố định vị trí cho 4 stages trên mỗi trang - giống y hệt LearningPathPage
  const fixedPositions = [
    { x: 20, y: 40 },  // Stage 1
    { x: 44, y: 54 },  // Stage 2
    { x: 72, y: 75 },  // Stage 3
    { x: 85, y: 52 },  // Stage 4
  ];

  // Gán vị trí cố định cho các stages
  const stagesWithFixedPositions = currentStages.map((stage, index) => ({
    ...stage,
    position: fixedPositions[index] || { x: 50, y: 50 }
  }));

  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_progress":
        return <Play className="h-4 w-4 text-blue-600" />;
      case "locked":
        return <div className="h-4 w-4 border-2 border-gray-400 rounded-full" />;
      default:
        return null;
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 border-green-500 text-green-800";
      case "in_progress":
        return "bg-blue-100 border-blue-500 text-blue-800";
      case "locked":
        return "bg-gray-100 border-gray-300 text-gray-600";
      default:
        return "bg-gray-100 border-gray-300 text-gray-600";
    }
  };

  const getStatusTextLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Hoàn thành";
      case "in_progress":
        return "Đang học";
      case "locked":
        return "Chưa mở";
      default:
        return "Chưa mở";
    }
  };

  return (
    <div className="space-y-3">
      <div
        className="w-full h-48 bg-cover bg-center rounded-lg relative overflow-hidden"
        style={{
          backgroundImage: "url('/img/Roadmap.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Stage markers - copy y hệt từ LearningPathPage */}
        {stagesWithFixedPositions.map((stage, index) => (
          <div
            key={stage.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              left: `${stage.position.x}%`,
              top: `${stage.position.y}%`,
            }}
          >
            {/* Connection line to next stage - giống y hệt LearningPathPage */}
            <div
              className="absolute w-32 h-0.5 bg-blue-400 opacity-70"
              style={{
                left: "50%",
                top: "50%",
                transform: index === 2 || index === 3 ? `rotate(-90deg)` : `rotate(90deg)`,
                transformOrigin: "0 0",
              }}
            />

            {/* Stage marker - giống y hệt LearningPathPage nhưng nhỏ hơn */}
            <div className="flex flex-col items-center">
              <button
                className={`w-10 h-10 rounded-full border-2 ${getStageColor(stage.status)} flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform group relative`}
                onClick={() => onStageClick(stage.id)}
                aria-label={`Chọn chặng ${stage.id}: ${stage.title}`}
              >
                {getStageIcon(stage.status)}
                
                {/* Stage info tooltip - hiển thị khi hover - stage 3 sẽ hiển thị phía trên */}
                <div className={`absolute left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-3 min-w-48 opacity-0 group-hover:opacity-100 transition-opacity z-30 border border-gray-200 pointer-events-none ${
                  stage.id === 3 ? 'bottom-14' : 'top-14'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {getStageIcon(stage.status)}
                    <span className="font-semibold text-xs text-gray-900">Chặng {stage.id}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-xs mb-1">{stage.title}</h4>
                  <p className="text-xs text-gray-600 mb-2">{stage.description}</p>
                  {stage.status === "in_progress" && (
                    <div className="space-y-1 mb-2">
                      <div className="flex justify-between text-xs">
                        <span>Tiến độ</span>
                        <span className="font-semibold text-blue-600">{stage.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${stage.progress}%` }} />
                      </div>
                    </div>
                  )}
                  <div className={`text-xs font-medium px-2 py-1 rounded-full text-center ${getStageColor(stage.status)}`}>
                    {getStatusTextLabel(stage.status)}
                  </div>
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation buttons - giống y hệt LearningPathPage */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-4 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="bg-white"
          >
            ← Chặng trước
          </Button>

          <div className="flex items-center space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentPage ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            className="bg-white"
          >
            Chặng sau →
          </Button>
        </div>
      )}
    </div>
  );
}

// Stage Units View Component - Cập nhật với background đẹp và auto-scroll
// StageUnitsView Component
function StageUnitsView({ currentStage, setCurrentStage }: Readonly<{ 
  currentStage: number; 
  setCurrentStage: (stage: number) => void;
}>) {
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
      const isEvenRow = Math.floor(layout.length) % 2 === 0;
      if (isEvenRow) {
        const rowUnits = units.slice(index, index + 2);
        layout.push(rowUnits);
        index += 2;
      } else {
        const rowUnits = units.slice(index, index + 1);
        layout.push(rowUnits);
        index += 1;
      }
    }
    return layout;
  };

const pathLayout = createPathLayout();
const rowHeight = 100; // Chiều cao mỗi hàng
// Tính số hàng dựa trên mô hình xen kẽ 2-1-2-1
const numUnits = currentStageData.units;
const numCycles = Math.floor(numUnits / 3); // Mỗi chu kỳ 2 hàng (2+1 unit)
const remainingUnits = numUnits % 3;
const numRows = remainingUnits === 0 ? numCycles * 2 : numCycles * 2 + 1;
const contentHeight = numRows * rowHeight; // Chiều cao nội dung thực tế
  
// CSS Animation for Cherry Blossoms only - Optimized for performance
const treeAnimationStyle = `
  .falling-petals {
    animation: fallAndDrift 10s linear infinite;
    will-change: transform, opacity;
    pointer-events: none;
  }
  
  @keyframes fallAndDrift {
    0% {
      transform: translateY(-20px) translateX(0px) rotate(0deg);
      opacity: 0.9;
    }
    25% {
      transform: translateY(25vh) translateX(10px) rotate(90deg);
      opacity: 0.8;
    }
    50% {
      transform: translateY(50vh) translateX(-5px) rotate(180deg);
      opacity: 0.6;
    }
    75% {
      transform: translateY(75vh) translateX(15px) rotate(270deg);
      opacity: 0.4;
    }
    100% {
      transform: translateY(100vh) translateX(-10px) rotate(360deg);
      opacity: 0;
    }
  }
  
  /* Performance optimizations */
  .falling-petals {
    backface-visibility: hidden;
    perspective: 1000px;
  }
`;

  return (
    <div className="space-y-4">
      {/* Stage Header with Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStage(currentStage - 1)}
          disabled={!canGoPrevious}
          className="p-2 hover:bg-gray-100"
        >
          <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </Button>

        <div className="flex-1 mx-2">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-center py-2 px-4 rounded-lg shadow-md relative">
            <span className="font-bold text-gray-800">• Chặng {currentStage} •</span>
          </div>
          <p className="text-center text-sm text-gray-600 mt-1">{currentStageData.title}</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStage(currentStage + 1)}
          disabled={!canGoNext}
          className="p-2 hover:bg-gray-100"
        >
          <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
          </svg>
        </Button>
      </div>

      {/* Container with Fixed Background and Scrollable Content */}
      <div className="relative rounded-lg overflow-hidden" style={{ height: "384px" }}>
        {/* Fixed Background */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/img/RoadMap2.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }}
        />

        {/* Scrollable Container for Path and Units */}
        <div 
          ref={unitContainerRef}
          className="relative z-10 h-full overflow-y-auto"
          style={{ 
            scrollBehavior: 'smooth'
          }}
        >
          {/* Add CSS Animation Styles for falling petals */}
          <style dangerouslySetInnerHTML={{ __html: treeAnimationStyle }} />

          {/* SVG for Scrollable Path */}
          <div className="relative">
            <svg
              className="w-full"
              style={{ height: `${contentHeight}px` }}
              viewBox={`0 0 400 ${contentHeight}`}
              preserveAspectRatio="xMidYMin slice"
            >
              {/* Road Path - Dynamic based on content with smooth curves */}
              <path
                d={(() => {
                  const pathCommands = ['M130 0'];
                  const numRows = pathLayout.length;
                  const rowHeight = 100;
                  const numPairs = Math.floor(numRows / 2);
                  const hasExtraRow = numRows % 2 === 1;
                  let startY = 0;
                  let lastX = 130;

                  for (let k = 0; k < numPairs; k++) {
                    const y0 = 50 + 2 * k * rowHeight - 5 * k;
                    const y1 = y0 + rowHeight;
                    
                    if (k === 0) {
                      // Smooth curve from start to first position using Cubic Bezier
                      pathCommands.push(`C125 ${y0 - 30}, 125 ${y0 - 15}, 130 ${y0}`);
                    } else {
                      // Smooth transition between rows using Cubic Bezier
                      pathCommands.push(`C70 ${(startY + y0) / 2 - 20}, 70 ${(startY + y0) / 2 + 10}, 130 ${y0}`);
                    }
                    // Horizontal line with smooth curve to right side
                    pathCommands.push(`C200 ${y0 - 5}, 240 ${y0 + 5}, 270 ${y0}`);
                    // Smooth curve down the right side
                    pathCommands.push(`C320 ${(y0 + y1) / 2 - 15}, 320 ${(y0 + y1) / 2 + 15}, 270 ${y1}`);
                    // Horizontal line back to left with smooth curve  
                    pathCommands.push(`C240 ${y1 + 5}, 200 ${y1 - 5}, 130 ${y1}`);
                    startY = y1;
                  }

                  if (hasExtraRow) {
                    const yLast = 50 + (2 * numPairs) * rowHeight;
                    // Smooth curve to final row using Cubic Bezier
                    pathCommands.push(`C115 ${(startY + yLast) / 2 - 15}, 125 ${(startY + yLast) / 2 + 15}, 130 ${yLast}`);
                    pathCommands.push(`C200 ${yLast - 5}, 240 ${yLast + 5}, 270 ${yLast}`);
                    lastX = 270;
                  }

                  // Smooth ending curve
                  if (lastX === 270) {
                    pathCommands.push(`C275 ${contentHeight - 30}, 275 ${contentHeight - 15}, 270 ${contentHeight}`);
                  } else {
                    pathCommands.push(`C125 ${contentHeight - 30}, 125 ${contentHeight - 15}, 130 ${contentHeight}`);
                  }

                  return pathCommands.join(' ');
                })()}
                fill="none"
                stroke="#8B4513"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Falling Cherry Blossoms - Only in this scrollable area */}
              {Array.from({ length: 40 }, (_, index) => {
                const startX = Math.random() * 400;
                const startY = Math.random() * contentHeight;
                const size = 1.5 + Math.random() * 2.5;
                const colors = ['#FFB6C1', '#FF69B4', '#FFC0CB', '#FFCCCB', '#FFE4E1', '#F8BBD9'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                return (
                  <circle
                    key={`petal-scrollable-${index}`}
                    className="falling-petals"
                    cx={startX}
                    cy={startY}
                    r={size}
                    fill={color}
                    fillOpacity="0.8"
                    style={{
                      animationDelay: `${Math.random() * 12}s`,
                      animationDuration: `${8 + Math.random() * 6}s`,
                    }}
                  />
                );
              })}
            </svg>

            {/* Path with Units */}
            <div className="absolute top-0 left-0 w-full py-4" style={{ gap: '50px', display: 'flex', flexDirection: 'column' }}>
              {pathLayout.map((rowUnits, rowIndex) => (
                <div key={`row-${rowIndex}-${rowUnits[0] || rowIndex}`} className="relative">
                  <div className="flex items-center justify-center space-x-8">
                    {rowUnits.map((unitNumber) => {
                      const status = getUnitStatus(unitNumber);
                      const isCurrentUnit = currentStageData.status === "in_progress" && 
                        unitNumber === currentStageData.unitNumbers[0] + Math.floor(currentStageData.units * 0.65);

                      return (
                        <div key={unitNumber} className="relative">
                          <div
                            data-unit={unitNumber}
                            className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-sm shadow-lg cursor-pointer hover:scale-110 transition-transform relative bg-white ${getUnitStatusClass(status)} ${
                              isCurrentUnit ? 'ring-4 ring-blue-300 ring-opacity-50 animate-pulse' : ''
                            }`}
                          >
                            {unitNumber}
                            {status === "completed" && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-2 h-2 text-white" />
                              </div>
                            )}
                            {isCurrentUnit && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
                                <Play className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stage Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Tiến độ chặng {currentStage}</span>
          <span className="font-medium">{getProgressText()}</span>
        </div>
        <Progress
          value={getProgressPercentage()}
          className="h-2"
        />
        <p className="text-xs text-gray-600">{getProgressDescription()}</p>
      </div>
    </div>
  );
}

// (Đã xoá biến treeAnimationStyle không sử dụng)

export function LearningPathDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [learningPathData, setLearningPathData] = useState<LearningPathData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState(1);
  const [isReordering, setIsReordering] = useState(false);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !learningPathData) {
      return;
    }

    const oldIndex = learningPathData.courses.findIndex(course => course.courseId === active.id);
    const newIndex = learningPathData.courses.findIndex(course => course.courseId === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reorder courses locally
    const newCourses = arrayMove(learningPathData.courses, oldIndex, newIndex);
    
    // Update courseOrderNumber for each course
    const updatedCourses = newCourses.map((course, index) => ({
      ...course,
      courseOrderNumber: index + 1
    }));

    // Update local state immediately for better UX
    setLearningPathData({
      ...learningPathData,
      courses: updatedCourses
    });

    // Send to API
    try {
      setIsReordering(true);
      const courseIds = updatedCourses.map(course => course.courseId);
      await roadmapService.reorderLearningPathCourses(learningPathData.id, courseIds);
      console.log('✅ Course reorder successful');
    } catch (error) {
      console.error('❌ Error reordering courses:', error);
      // Revert to original order on error
      setLearningPathData({
        ...learningPathData,
        courses: learningPathData.courses
      });
    } finally {
      setIsReordering(false);
    }
  };

  useEffect(() => {
    const loadLearningPathDetail = async () => {
      if (!id) {
        setError("ID lộ trình không hợp lệ");
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔥 START loadLearningPathDetail - ID:', id);
        
        setIsLoading(true);
        setError(null);

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('access_token');
        
        console.log('🔥 Auth Check - User:', user);
        console.log('🔥 Auth Check - Token exists:', !!token);
        console.log('🔥 Auth Check - user.id:', user.id);
        console.log('🔥 Auth Check - user keys:', Object.keys(user));
        console.log('🔥 Auth Check - Full user object:', JSON.stringify(user, null, 2));
        
        // Kiểm tra thêm các field có thể có
        console.log('🔥 Auth Check - user.userId:', user.userId);
        console.log('🔥 Auth Check - user.username:', user.username);
        console.log('🔥 Auth Check - user.email:', user.email);

        // Chỉ cần token vì JWT đã chứa thông tin user
        if (token) {
          console.log('🔥 AUTH SUCCESS - Using API with token');
          // Gọi API thực để lấy chi tiết learning path
          const response = await roadmapService.getLearningPathDetail(parseInt(id));
          console.log('🔥 Full API Response:', response);
          
          const apiData = response.data as unknown as LearningPathApiResponse;
          console.log('🔥 API Data:', apiData);
          console.log('🔥 API Courses:', apiData.courses);
          
          // Sử dụng trực tiếp dữ liệu từ API response
          const coursesWithProgress = apiData.courses.map((course, index) => ({
            ...course,
            // Thêm progress và status mock tạm thời
            progress: Math.floor(Math.random() * 100),
            status: (index === 0 ? "in_progress" : "not_started") as "not_started" | "in_progress" | "completed"
          })) as CourseWithDetails[];
          
          console.log('🔥 Courses With Progress:', coursesWithProgress);

          const realData: LearningPathData = {
            id: apiData.id,
            title: apiData.title,
            description: apiData.description,
            targetLevel: apiData.targetLevel,
            primaryGoal: apiData.primaryGoal,
            focusSkill: apiData.focusSkill,
            status: apiData.status,
            duration: apiData.duration,
            userId: apiData.userId,
            username: apiData.username,
            courses: coursesWithProgress,
            rating: 4.8, // Mock rating
            students: 3530, // Mock students
            overallProgress: Math.round(
              coursesWithProgress.reduce((sum: number, course: CourseWithDetails) => sum + (course.progress || 0), 0) / coursesWithProgress.length
            ),
            goals: mockLearningGoals, // Keep mock goals for now
            nextCourses: mockNextCourses, // Keep mock next courses for now
            stats: {
              completedLessons: 37,
              studyHours: 95,
              streakDays: 12,
            },
          };
          
          console.log('🔥 Final Real Data:', realData);
          console.log('🔥 Final Courses:', realData.courses);
          
          setLearningPathData(realData);
          return;
        }

        console.log('🚨 Using MOCK DATA - No token found');
        console.log('🚨 User:', user);
        console.log('🚨 Token:', token);
        
        // Sử dụng mock data
        const overallProgress = Math.round(
          mockCoursesWithDetails.reduce((sum, course) => sum + (course.progress || 0), 0) / mockCoursesWithDetails.length
        );

        const mockData: LearningPathData = {
          id: parseInt(id),
          title: "Lộ trình N5 tiếng Nhật cơ bản",
          description: "Lộ trình học từng bước từ cơ bản đến nâng cao. Hiragana, Katakana và ngữ pháp cơ bản",
          targetLevel: "N5",
          primaryGoal: "Đạt chứng chỉ JLPT N5",
          focusSkill: "Toàn diện",
          status: "STUDYING",
          duration: 99,
          userId: 1,
          username: "new user",
          rating: 4.8,
          students: 3530,
          overallProgress,
          courses: mockCoursesWithDetails,
          goals: mockLearningGoals,
          nextCourses: mockNextCourses,
          stats: {
            completedLessons: 37,
            studyHours: 95,
            streakDays: 12,
          },
        };

        setLearningPathData(mockData);
      } catch (err) {
        console.error('Error loading learning path detail:', err);
        setError('Không thể tải chi tiết lộ trình học.');
      } finally {
        setIsLoading(false);
      }
    };

    loadLearningPathDetail();
  }, [id]);

  const getStatusBadge = (status: string) => {
    if (status === "completed") {
      return <Badge className="bg-green-100 text-green-800">Hoàn thành</Badge>;
    } else if (status === "in_progress") {
      return <Badge className="bg-blue-100 text-blue-800">Đang học</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Chưa bắt đầu</Badge>;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "N5":
        return "bg-green-100 text-green-800";
      case "N4":
        return "bg-blue-100 text-blue-800";
      case "N3":
        return "bg-yellow-100 text-yellow-800";
      case "N2":
        return "bg-orange-100 text-orange-800";
      case "N1":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleBackToLearningPath = () => {
    navigate('/learning-path');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-500" />
          <p className="text-gray-600">Đang tải chi tiết lộ trình...</p>
        </div>
      </div>
    );
  }

  console.log('🔥 RENDER - learningPathData:', learningPathData);
  console.log('🔥 RENDER - courses:', learningPathData?.courses);

  if (error || !learningPathData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-0 py-3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleBackToLearningPath}
                className="p-2 hover:bg-gray-100 text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-blue-600">Chi tiết lộ trình</h1>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <h3 className="font-semibold">Lỗi</h3>
            <p className="mt-2 text-sm">{error || "Không tìm thấy lộ trình học."}</p>
            <Button 
              onClick={handleBackToLearningPath}
              className="mt-4"
              size="sm"
            >
              Quay lại danh sách
            </Button>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={handleBackToLearningPath} 
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lộ trình học tập của tôi</h1>
              <p className="text-gray-600 text-sm">Theo dõi tiến độ và quản lý lộ trình học tập của bạn</p>
            </div>
          </div>
          <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
            <Edit className="h-4 w-4" />
            <span>Chỉnh sửa lộ trình</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-4 space-y-6">
            {/* Course Overview */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{learningPathData.title}</h2>
                      <p className="text-gray-600 text-sm">{learningPathData.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          {learningPathData.rating || 0} ({learningPathData.students?.toLocaleString() || 0} đánh giá)
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {learningPathData.students?.toLocaleString() || 0} học viên
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{learningPathData.overallProgress}%</div>
                    <p className="text-sm text-gray-600">Hoàn thành</p>
                    <Button className="mt-2 bg-blue-600 hover:bg-blue-700">
                      <Play className="h-4 w-4 mr-2" />
                      Tiếp tục học
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Modules with Drag & Drop */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Danh sách khóa học ({learningPathData.courses.length} khóa học)</span>
                  {isReordering && (
                    <div className="flex items-center space-x-2 text-sm text-blue-600">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Đang cập nhật thứ tự...</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={learningPathData.courses.map(course => course.courseId)}
                    strategy={verticalListSortingStrategy}
                  >
                    {learningPathData.courses.map((course) => (
                      <SortableCourseItem
                        key={course.courseId}
                        course={course}
                        getStatusBadge={getStatusBadge}
                        getLevelColor={getLevelColor}
                        navigate={navigate}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
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
              <CardContent>
                {learningPathData.nextCourses && learningPathData.nextCourses.length > 0 ? (
                  learningPathData.nextCourses.map((course) => (
                  <div key={course.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
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
                ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Chưa có khóa học tiếp theo được đề xuất</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mini Learning Path Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Lộ trình tổng quan</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MiniLearningPathMap onStageClick={setCurrentStage} />
              </CardContent>
            </Card>

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

export default LearningPathDetailPage;
