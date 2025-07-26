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
    completedLessons: 19,
    estimatedTime: "25 giờ",
    difficulty: "Cơ bản",
    status: "in_progress",
    rating: 4.7,
    students: 890,
    instructor: "Sensei Yamada",
  },
  {
    id: 3,
    title: "Tiếng Nhật N4 - Sơ cấp",
    description: "Nâng cao kỹ năng tiếng Nhật lên trình độ N4",
    level: "N4",
    progress: 0,
    totalLessons: 50,
    completedLessons: 0,
    estimatedTime: "50 giờ",
    difficulty: "Trung bình",
    status: "not_started",
    rating: 4.6,
    students: 650,
    instructor: "Sensei Sato",
  },
  {
    id: 4,
    title: "Giao tiếp tiếng Nhật hàng ngày",
    description: "Luyện tập giao tiếp trong các tình huống thực tế",
    level: "N4",
    progress: 0,
    totalLessons: 35,
    completedLessons: 0,
    estimatedTime: "30 giờ",
    difficulty: "Trung bình",
    status: "not_started",
    rating: 4.5,
    students: 420,
    instructor: "Sensei Kimura",
  },
  {
    id: 5,
    title: "Tiếng Nhật N3 - Trung cấp",
    description: "Khóa học nâng cao cho trình độ N3",
    level: "N3",
    progress: 0,
    totalLessons: 60,
    completedLessons: 0,
    estimatedTime: "60 giờ",
    difficulty: "Nâng cao",
    status: "not_started",
    rating: 4.4,
    students: 320,
    instructor: "Sensei Watanabe",
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

// Mini Roadmap Map Component - Copy từ RoadmapPage với đầy đủ logic
function MiniRoadmapMap({ onStageClick }: Readonly<{ onStageClick: (stageId: number) => void }>) {
  const [currentPage, setCurrentPage] = useState(0);

  // Sample roadmap data with stages - giống y hệt RoadmapPage
  const roadmapStages = [
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
  const totalPages = Math.ceil(roadmapStages.length / stagesPerPage);
  const currentStages = roadmapStages.slice(currentPage * stagesPerPage, (currentPage + 1) * stagesPerPage);

  // Cố định vị trí cho 4 stages trên mỗi trang - giống y hệt RoadmapPage
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
        {/* Stage markers - copy y hệt từ RoadmapPage */}
        {stagesWithFixedPositions.map((stage, index) => (
          <div
            key={stage.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              left: `${stage.position.x}%`,
              top: `${stage.position.y}%`,
            }}
          >
            {/* Connection line to next stage - giống y hệt RoadmapPage */}
            <div
              className="absolute w-32 h-0.5 bg-blue-400 opacity-70"
              style={{
                left: "50%",
                top: "50%",
                transform: index === 2 || index === 3 ? `rotate(-90deg)` : `rotate(90deg)`,
                transformOrigin: "0 0",
              }}
            />

            {/* Stage marker - giống y hệt RoadmapPage nhưng nhỏ hơn */}
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

      {/* Navigation buttons - giống y hệt RoadmapPage */}
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
function StageUnitsView({ currentStage, setCurrentStage }: Readonly<{ 
  currentStage: number; 
  setCurrentStage: (stage: number) => void;
}>) {
  const unitContainerRef = useRef<HTMLDivElement>(null);

  // Generate 45 units across 6 stages
  const generateUnits = () => {
    const stages = [
      { id: 1, title: "Hiragana & Katakana", units: 8, status: "completed" },
      { id: 2, title: "Từ vựng N5", units: 7, status: "completed" },
      { id: 3, title: "Ngữ pháp cơ bản", units: 15, status: "in_progress" }, // Increased for demo
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

  // Auto-scroll to current unit when stage changes - Scroll tự động đến unit đang học
  useEffect(() => {
    if (currentStageData?.status === "in_progress" && unitContainerRef.current) {
      const completedUnits = Math.floor(currentStageData.units * 0.65);
      const currentUnitNumber = currentStageData.unitNumbers[0] + completedUnits;
      
      // Find the current unit element and scroll to it
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

    // For in_progress stage, assume first 65% are completed (based on 65% progress)
    const completedUnits = Math.floor(currentStageData.units * 0.65);
    return unitNumber <= currentStageData.unitNumbers[0] + completedUnits - 1 ? "completed" : "locked";
  };

  // Create path layout: 2 units, then 1 unit, then 2 units, etc.
  const createPathLayout = () => {
    const layout = [];
    const units = currentStageData.unitNumbers;
    let index = 0;

    while (index < units.length) {
      const isEvenRow = Math.floor(layout.length) % 2 === 0;
      if (isEvenRow) {
        // Even row: 2 units
        const rowUnits = units.slice(index, index + 2);
        layout.push(rowUnits);
        index += 2;
      } else {
        // Odd row: 1 unit in center
        const rowUnits = units.slice(index, index + 1);
        layout.push(rowUnits);
        index += 1;
      }
    }
    return layout;
  };

  const pathLayout = createPathLayout();

  return (
    <div className="space-y-4">
      {/* Stage Header with Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStage(currentStage - 1)}
          disabled={!canGoPrevious}
          className="p-1"
        >
          <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </Button>

        <div className="flex-1 mx-2">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-center py-2 px-4 rounded-lg shadow-md relative">
            <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-yellow-400"></div>
            <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-yellow-500"></div>
            <span className="font-bold text-gray-800">• Chặng {currentStage} •</span>
          </div>
          <p className="text-center text-sm text-gray-600 mt-1">{currentStageData.title}</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStage(currentStage + 1)}
          disabled={!canGoNext}
          className="p-1"
        >
          <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
          </svg>
        </Button>
      </div>

      {/* Units Path with Beautiful Curved Road Background - Background con đường uốn lượn với cỏ cây hoa lá */}
      <div 
        ref={unitContainerRef}
        className="relative bg-transparent rounded-lg p-4 h-96 overflow-y-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Add CSS Animation Styles - Thêm CSS Animation */}
        <style dangerouslySetInnerHTML={{ __html: treeAnimationStyle }} />
        
        {/* SVG Background with Curved Road and Nature Elements - Background SVG với con đường cong và cảnh thiên nhiên */}
        <div className="absolute inset-0 z-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 400 800"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Sky Background - Nền trời xanh */}
            <rect x="0" y="0" width="400" height="800" fill="#E0F7FA" />

            {/* Curved Road - Con đường cong uốn lượn */}
            <path
              d="M50 50 Q100 150 200 200 Q300 250 350 350 Q300 450 200 500 Q100 550 50 650 Q100 750 200 780"
              fill="none"
              stroke="#8B4513"
              strokeWidth="20"
              strokeLinecap="round"
            />

            {/* Grass on Both Sides - Cỏ hai bên đường */}
            <path d="M0 50 L50 50 L50 780 L0 780 Z" fill="#4CAF50" />
            <path d="M400 50 L350 50 L350 780 L400 780 Z" fill="#4CAF50" />

            {/* Trees with Animation - Cây cối với hiệu ứng đung đưa */}
            <g className="tree">
              <path d="M30 120 L30 140 L20 140 L25 150 L30 140 L40 140 Z" fill="#228B22" />
              <rect x="25" y="140" width="10" height="20" fill="#8B4513" />
            </g>
            <g className="tree">
              <path d="M370 180 L370 200 L360 200 L365 210 L370 200 L380 200 Z" fill="#228B22" />
              <rect x="365" y="200" width="10" height="20" fill="#8B4513" />
            </g>
            <g className="tree">
              <path d="M30 300 L30 320 L20 320 L25 330 L30 320 L40 320 Z" fill="#228B22" />
              <rect x="25" y="320" width="10" height="20" fill="#8B4513" />
            </g>
            <g className="tree">
              <path d="M370 400 L370 420 L360 420 L365 430 L370 420 L380 420 Z" fill="#228B22" />
              <rect x="365" y="420" width="10" height="20" fill="#8B4513" />
            </g>

            {/* Flowers with Animation - Hoa với hiệu ứng */}
            <g className="flower">
              <circle cx="40" cy="200" r="5" fill="#FF69B4" />
              <circle cx="45" cy="205" r="3" fill="#FFD700" />
              <circle cx="35" cy="205" r="3" fill="#FFD700" />
            </g>
            <g className="flower">
              <circle cx="360" cy="300" r="5" fill="#FF69B4" />
              <circle cx="365" cy="305" r="3" fill="#FFD700" />
              <circle cx="355" cy="305" r="3" fill="#FFD700" />
            </g>
            <g className="flower">
              <circle cx="40" cy="450" r="5" fill="#FF1493" />
              <circle cx="45" cy="455" r="3" fill="#FFD700" />
              <circle cx="35" cy="455" r="3" fill="#FFD700" />
            </g>

            {/* Grass Tufts - Bụi cỏ */}
            <path d="M60 250 L65 240 L70 250 L65 245 Z" fill="#4CAF50" />
            <path d="M330 320 L335 310 L340 320 L335 315 Z" fill="#4CAF50" />
            <path d="M60 480 L65 470 L70 480 L65 475 Z" fill="#4CAF50" />
            <path d="M330 580 L335 570 L340 580 L335 575 Z" fill="#4CAF50" />

            {/* Additional Nature Elements - Thêm yếu tố thiên nhiên */}
            <g className="flower">
              <circle cx="40" cy="600" r="4" fill="#9C27B0" />
              <circle cx="44" cy="604" r="2" fill="#FFC107" />
              <circle cx="36" cy="604" r="2" fill="#FFC107" />
            </g>
            <g className="flower">
              <circle cx="360" cy="650" r="4" fill="#E91E63" />
              <circle cx="364" cy="654" r="2" fill="#FFEB3B" />
              <circle cx="356" cy="654" r="2" fill="#FFEB3B" />
            </g>
          </svg>
        </div>

        {/* Path with Units - Con đường với các unit */}
        <div className="relative space-y-6 py-4 z-10">
          {pathLayout.map((rowUnits, rowIndex) => (
            <div key={`row-${rowIndex}-${rowUnits[0] || rowIndex}`} className="relative">
              {/* Path connection line - Đường nối giữa các hàng */}
              {rowIndex > 0 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-1 h-6 bg-yellow-300 rounded-full"></div>
              )}

              {/* Row units - Các unit trong hàng */}
              <div className="flex items-center justify-center space-x-8">
                {rowUnits.map((unitNumber, unitIndex) => {
                  const status = getUnitStatus(unitNumber);
                  const isCurrentUnit = currentStageData.status === "in_progress" && 
                    unitNumber === currentStageData.unitNumbers[0] + Math.floor(currentStageData.units * 0.65);

                  return (
                    <div key={unitNumber} className="relative">
                      {/* Connection line between units in same row - Đường nối giữa các unit cùng hàng */}
                      {unitIndex > 0 && rowUnits.length > 1 && (
                        <div className="absolute top-1/2 -left-4 transform -translate-y-1/2 w-8 h-1 bg-yellow-300 rounded-full"></div>
                      )}

                      {/* Unit circle - Vòng tròn unit */}
                      <div
                        data-unit={unitNumber}
                        className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-sm shadow-lg cursor-pointer hover:scale-110 transition-transform relative ${getUnitStatusClass(status)} ${
                          isCurrentUnit ? 'ring-4 ring-blue-300 ring-opacity-50 animate-pulse' : ''
                        }`}
                      >
                        {unitNumber}

                        {/* Status indicator - Chỉ thị trạng thái */}
                        {status === "completed" && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-2 h-2 text-white" />
                          </div>
                        )}

                        {/* Current unit indicator - Chỉ thị unit hiện tại */}
                        {isCurrentUnit && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
                            <Play className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Connection line to next row - Đường nối đến hàng tiếp theo */}
                      {rowIndex < pathLayout.length - 1 && unitIndex === Math.floor(rowUnits.length / 2) && (
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-1 h-6 bg-yellow-300 rounded-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stage Progress - Tiến độ chặng */}
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

// CSS Animation for Trees - CSS Animation cho cây cối
const treeAnimationStyle = `
  .tree {
    animation: sway 3s ease-in-out infinite;
    transform-origin: bottom center;
  }
  
  @keyframes sway {
    0%, 100% { 
      transform: rotate(0deg); 
    }
    50% { 
      transform: rotate(5deg); 
    }
  }
  
  .flower {
    animation: bloom 2s ease-in-out infinite alternate;
  }
  
  @keyframes bloom {
    0% { 
      transform: scale(1); 
    }
    100% { 
      transform: scale(1.1); 
    }
  }
`;

export function RoadmapDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState(3); // State để quản lý stage hiện tại

  useEffect(() => {
    const loadRoadmapDetail = async () => {
      if (!id) {
        setError("ID lộ trình không hợp lệ");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('access_token');

        if (user.id && token) {
          // Gọi API khi có user và token (hiện tại API chưa có)
          await roadmapService.getRoadmapDetail(parseInt(id));
          // Transform API response to match our interface
          // Note: This will need to be updated when real API is available
        }

        // Sử dụng mock data
        const overallProgress = Math.round(
          mockCourseModules.reduce((sum, module) => sum + module.progress, 0) / mockCourseModules.length
        );

        const mockData: RoadmapData = {
          id: parseInt(id),
          title: "Lộ trình N5 tiếng Nhật cơ bản",
          description: "Lộ trình học từng bước từ cơ bản đến nâng cao. Hiragana, Katakana và ngữ pháp cơ bản",
          level: "N5",
          rating: 4.8,
          students: 3530,
          overallProgress,
          modules: mockCourseModules,
          goals: mockLearningGoals,
          nextCourses: mockNextCourses,
          stats: {
            completedLessons: 37,
            studyHours: 95,
            streakDays: 12,
          },
        };

        setRoadmapData(mockData);
      } catch (err) {
        console.error('Error loading roadmap detail:', err);
        setError('Không thể tải chi tiết lộ trình học.');
      } finally {
        setIsLoading(false);
      }
    };

    loadRoadmapDetail();
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

  const handleBackToRoadmap = () => {
    navigate('/roadmap');
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

  if (error || !roadmapData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleBackToRoadmap}
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
              onClick={handleBackToRoadmap}
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
              onClick={handleBackToRoadmap} 
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
                      <h2 className="text-xl font-semibold text-gray-900">{roadmapData.title}</h2>
                      <p className="text-gray-600 text-sm">{roadmapData.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          {roadmapData.rating} ({roadmapData.students.toLocaleString()} đánh giá)
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {roadmapData.students.toLocaleString()} học viên
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{roadmapData.overallProgress}%</div>
                    <p className="text-sm text-gray-600">Hoàn thành</p>
                    <Button className="mt-2 bg-blue-600 hover:bg-blue-700">
                      <Play className="h-4 w-4 mr-2" />
                      Tiếp tục học
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Modules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Lộ trình khóa học ({roadmapData.modules.length} khóa học)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {roadmapData.modules.map((module, index) => (
                  <div key={module.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start space-x-4">
                      {/* Module Number */}
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>

                      {/* Module Content */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{module.title}</h3>
                            <p className="text-sm text-gray-600">{module.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{module.progress}%</div>
                            {getStatusBadge(module.status)}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <Progress value={module.progress} className="h-2" />
                        </div>

                        {/* Module Info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-gray-600">
                            <Badge className={getLevelColor(module.level)}>{module.level}</Badge>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{module.estimatedTime}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <BookOpen className="h-3 w-3" />
                              <span>{module.totalLessons} bài</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Star className="h-3 w-3" />
                              <span>{module.rating}</span>
                            </span>
                          </div>

                          <div className="flex space-x-2">
                            {module.status === "in_progress" && (
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700" 
                                onClick={() => navigate(`/courses/${module.id}`)}
                              >
                                Tiếp tục
                              </Button>
                            )}
                            {module.status === "not_started" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/courses/${module.id}`)}
                              >
                                Bắt đầu
                              </Button>
                            )}
                            {module.status === "completed" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/courses/${module.id}`)}
                              >
                                Ôn tập
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
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
              <CardContent>
                {roadmapData.nextCourses.map((course) => (
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
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mini Roadmap Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Lộ trình tổng quan</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MiniRoadmapMap onStageClick={setCurrentStage} />
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

export default RoadmapDetailPage;
