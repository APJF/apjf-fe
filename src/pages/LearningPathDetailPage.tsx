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
const svgHeight = Math.max(contentHeight, 400); // Chiều cao SVG, tối thiểu 400px
  
// CSS Animation for Trees and Cherry Blossoms
const treeAnimationStyle = `
  .tree {
    animation: sway 3s ease-in-out infinite;
    transform-origin: bottom center;
  }
  
  @keyframes sway {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-5deg); }
  }
  
  .flower {
    animation: bloom 2s ease-in-out infinite alternate;
  }
  
  @keyframes bloom {
    0% { transform: scale(1); }
    100% { transform: scale(1.1); }
  }
  
  .grass {
    animation: wave 4s ease-in-out infinite;
  }
  
  @keyframes wave {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(5px); }
  }
  
  .falling-petals {
    animation: fallAndDrift 7s linear infinite;
  }
  
  @keyframes fallAndDrift {
    0% {
      transform: translateY(-10px) rotate(0deg);
      opacity: 1;
    }
    50% {
      transform: translateY(50vh) rotate(180deg);
      opacity: 0.8;
    }
    100% {
      transform: translateY(100vh) rotate(360deg);
      opacity: 0;
    }
  }
  
  .cherry-blossom {
    animation: gentleBloom 3s ease-in-out infinite alternate;
  }
  
  @keyframes gentleBloom {
    0% { transform: scale(1) rotate(0deg); }
    100% { transform: scale(1.05) rotate(5deg); }
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

      {/* Scrollable Units Path with Dynamic Background */}
      <div 
        ref={unitContainerRef}
        className="relative bg-transparent rounded-lg p-2 max-h-96 overflow-y-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Add CSS Animation Styles */}
        <style dangerouslySetInnerHTML={{ __html: treeAnimationStyle }} />
        
        {/* SVG Background with Dynamic Height */}
        <div className="absolute inset-0 z-0">
  <svg
    className="w-full"
    style={{ height: `${svgHeight}px` }}
    viewBox={`0 0 400 ${svgHeight}`}
    preserveAspectRatio="xMidYMin slice"
  >
    <defs>
      <linearGradient id="grassGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#66BB6A" />
        <stop offset="100%" stopColor="#4CAF50" />
      </linearGradient>
    </defs>

    {/* Sky Background */}
    <rect x="0" y="0" width="400" height={svgHeight} fill="#E0F7FA" />

    {/* Road Path - Đường đi qua từng unit theo pattern liên tục */}
    <path
      d={(() => {
        const pathCommands = ['M130 0']; // Bắt đầu tại (130, 0)
        const numRows = pathLayout.length; // Số lượng hàng
        const rowHeight = 100; // Chiều cao mỗi hàng
        const numPairs = Math.floor(numRows / 2); // Số cặp hàng
        const hasExtraRow = numRows % 2 === 1; // Kiểm tra số hàng lẻ
        let startY = 0; // Vị trí y trước đó
        let lastX = 130; // Theo dõi tọa độ x cuối cùng

        // Lặp qua từng cặp hàng
        for (let k = 0; k < numPairs; k++) {
          const y0 = 50 + 2 * k * rowHeight - 5 * k; // y của hàng đầu tiên trong cặp
          const y1 = y0 + rowHeight; // y của hàng thứ hai trong cặp
          
          if (k === 0) {
        // Cong xuống từ (130, 0) đến (130, 50) với độ cong lớn hơn
        pathCommands.push(`Q122 ${y0 - 25} 130 ${y0}`);
      } else {
        // Cong xuống từ điểm trước đó đến hàng tiếp theo với độ cong lớn hơn
        pathCommands.push(`Q100 ${(startY + y0) / 2 - 10} 130 ${y0}`);
      }
          pathCommands.push(`L270 ${y0}`); // Đi ngang qua phải của hàng đầu tiên
          // Cong mềm xuống hàng thứ hai
          pathCommands.push(`Q300 ${(y0 + y1) / 2} 270 ${y1}`); 
          pathCommands.push(`L130 ${y1}`); // Đi ngang qua trái của hàng thứ hai
          startY = y1; // Cập nhật vị trí y trước đó
        }

        // Xử lý hàng lẻ nếu có
        if (hasExtraRow) {
          const yLast = 50 + (2 * numPairs) * rowHeight; // y của hàng cuối
          pathCommands.push(`Q120 ${(startY + yLast) / 2} 130 ${yLast}`); // Cong xuống trái của hàng cuối - mềm mại hơn
          pathCommands.push(`L270 ${yLast}`); // Đi ngang qua phải của hàng cuối
          lastX = 270; // Cập nhật x cuối cùng là 270
        }

        // Kết thúc bằng đường cong dọc xuống thay vì đi thẳng về giữa
        if (lastX === 270) {
      // Nếu kết thúc ở bên phải, cong dọc xuống bên phải
      pathCommands.push(`Q278 ${svgHeight - 25} 270 ${svgHeight}`);
    } else {
      // Nếu kết thúc ở bên trái, cong dọc xuống bên trái
      pathCommands.push(`Q122 ${svgHeight - 25} 130 ${svgHeight}`);
    }


        return pathCommands.join(' ');
      })()}
      fill="none"
      stroke="#8B4513"
      strokeWidth="15"
      strokeLinecap="round"
    />
    {/* Grass on Left Side */}
<path
  className="grass"
  d={`
    M0 0 
    L100 0 
    ${Array.from({ length: Math.floor(svgHeight / 150) }, (_, i) => {
      const y = 75 + (i + 1) * 150;
      const offset = Math.sin(i * 0.3) * 8; // Offset bên trái
      const x = 85 + offset; // Khi offset dương thì lồi ra ngoài
      const controlX1 = 85 + Math.sin(i * 0.3 - 0.1) * 6;
      const controlX2 = 85 + Math.sin(i * 0.3 + 0.1) * 6;
      return `C${controlX1} ${y - 75}, ${controlX2} ${y - 25}, ${x} ${y}`;
    }).join(' ')}
    L0 ${svgHeight} 
    Z
  `}
  fill="url(#grassGradient)"
/>

{/* Grass on Right Side */}
<path
  className="grass"
  d={`
    M400 0 
    L300 0 
    ${Array.from({ length: Math.floor(svgHeight / 150) }, (_, i) => {
      const y = 75 + (i + 1) * 150;
      const offset = -Math.sin(i * 0.3) * 8; // Đồng bộ hóa sóng sin đối lập
      const x = 315 + offset; // Điều chỉnh cho sóng sin đối lập
      const controlX1 = 315 - Math.sin(i * 0.3 - 0.1) * 6; // Điểm điều khiển
      const controlX2 = 315 - Math.sin(i * 0.3 + 0.1) * 6; // Điểm điều khiển
      return `C${controlX1} ${y - 75}, ${controlX2} ${y - 25}, ${x} ${y}`;
    }).join(' ')}
    L400 ${svgHeight} 
    Z
  `}
  fill="url(#grassGradient)"
/>

    {/* Cherry Blossom Trees - Extended throughout the entire SVG height */}
    {Array.from({ length: Math.ceil(svgHeight / 100) }, (_, index) => (
      <g key={`cherry-tree-${currentStage}-${index}`} transform={`translate(0, ${index * 100})`}>
        {/* Cherry Tree Left - repositioned to translate(50, 80) */}
        <g className="tree" transform="translate(50, 80)">
          {/* Tree trunk - increased height to 30 */}
          <rect x="-6" y="10" width="12" height="30" fill="#8B4513" />
          {/* Tree crown - larger radius 20 with semi-transparent green */}
          <circle cx="0" cy="0" r="20" fill="#90EE90" fillOpacity="0.3" />
          {/* Cherry blossoms - more abundant and varied */}
          <g className="cherry-blossom">
            <circle cx="0" cy="0" r="4" fill="#FFB6C1" />
            <circle cx="10" cy="-8" r="3" fill="#FF69B4" />
            <circle cx="-10" cy="-8" r="3" fill="#FF69B4" />
            <circle cx="8" cy="10" r="2.5" fill="#FFC0CB" />
            <circle cx="-8" cy="10" r="2.5" fill="#FFC0CB" />
            <circle cx="0" cy="-12" r="3" fill="#FFB6C1" />
            <circle cx="-12" cy="2" r="2.5" fill="#FF69B4" />
            <circle cx="12" cy="2" r="2.5" fill="#FF69B4" />
          </g>
        </g>
        
        {/* Cherry Tree Right - repositioned to translate(350, 120) */}
        <g className="tree" transform="translate(350, 120)">
          {/* Tree trunk - increased height to 30 */}
          <rect x="-6" y="10" width="12" height="30" fill="#8B4513" />
          {/* Tree crown - larger radius 20 with semi-transparent green */}
          <circle cx="0" cy="0" r="20" fill="#90EE90" fillOpacity="0.3" />
          {/* Cherry blossoms - more abundant and varied */}
          <g className="cherry-blossom">
            <circle cx="0" cy="0" r="4" fill="#FFB6C1" />
            <circle cx="10" cy="-8" r="3" fill="#FF69B4" />
            <circle cx="-10" cy="-8" r="3" fill="#FF69B4" />
            <circle cx="8" cy="10" r="2.5" fill="#FFC0CB" />
            <circle cx="-8" cy="10" r="2.5" fill="#FFC0CB" />
            <circle cx="0" cy="-12" r="3" fill="#FFB6C1" />
            <circle cx="-12" cy="2" r="2.5" fill="#FF69B4" />
            <circle cx="12" cy="2" r="2.5" fill="#FF69B4" />
          </g>
        </g>
      </g>
    ))}

    {/* Flowers on Grass - Extended throughout the entire SVG height */}
    {Array.from({ length: Math.ceil(svgHeight / 75) * 2 }, (_, index) => {
      const x = index % 2 === 0 ? 60 : 340; // Alternate between left (60) and right (340)
      const y = 80 + (Math.floor(index / 2) * 75); // Distributed vertically every 75px
      
      return (
        <g key={`grass-flower-${currentStage}-${index}`} transform={`translate(${x}, ${y})`}>
          <circle className="flower" cx="0" cy="0" r="5" fill="#FF69B4" />
          <circle cx="5" cy="5" r="3" fill="#FFD700" />
          <circle cx="-5" cy="5" r="3" fill="#FFD700" />
        </g>
      );
    })}

    {/* Falling Cherry Blossoms - Improved animation */}
    {Array.from({ length: 20 }, (_, index) => {
      const startX = Math.random() * 400;
      const startY = Math.random() * (svgHeight * 0.7); // Không bay quá thấp
      const driftX = (Math.random() - 0.5) * 150; // Random horizontal drift
      const size = 2 + Math.random() * 2; // Variable petal sizes (2-4px)
      const colors = ['#FFB6C1', '#FF69B4', '#FFC0CB', '#FFCCCB'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      return (
        <circle
          key={`petal-${currentStage}-${index}`}
          className="falling-petals"
          cx={startX}
          cy={startY}
          r={size}
          fill={color}
          fillOpacity="0.8"
          style={{
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 4}s`,
            transform: `translate(${driftX}px, 0)`,
          }}
        />
      );
    })}
  </svg>
</div>

        {/* Path with Units */}
        <div className="relative py-4 z-10" style={{ gap: '50px', display: 'flex', flexDirection: 'column' }}>
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
                        className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-sm shadow-lg cursor-pointer hover:scale-110 transition-transform relative ${getUnitStatusClass(status)} ${
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
