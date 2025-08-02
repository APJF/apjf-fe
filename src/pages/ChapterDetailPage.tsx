import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChapterById, getUnitsByChapterId } from '../services/chapterDetailService';
import { MaterialService } from '../services/materialService';
import type { Chapter, Unit } from '../types/course';
import type { Material } from '../services/materialService';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import {
  ArrowLeft,
  FileText,
  BookOpen,
  Eye,
  MessageCircle,
  Headphones,
  PenTool,
  Languages,
  Brain,
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Download,
  Maximize,
  ZoomIn,
  ZoomOut,
  Play,
} from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  type: 'listening' | 'speaking' | 'reading' | 'writing' | 'vocabulary' | 'grammar' | 'practice';
}

interface UnitWithSkills {
  id: string;
  title: string;
  description?: string;
  courseId?: number;
  isExpanded: boolean;
  isCompleted: boolean;
  materials: Material[];
  skills: Skill[];
}

const getSkillIcon = (type: string) => {
  switch (type) {
    case 'vocabulary':
      return <BookOpen className="h-4 w-4" />;
    case 'grammar':
      return <FileText className="h-4 w-4" />;
    case 'listening':
      return <Headphones className="h-4 w-4" />;
    case 'speaking':
      return <MessageCircle className="h-4 w-4" />;
    case 'reading':
      return <Eye className="h-4 w-4" />;
    case 'writing':
      return <PenTool className="h-4 w-4" />;
    case 'practice':
      return <Brain className="h-4 w-4" />;
    default:
      return <Languages className="h-4 w-4" />;
  }
};

const getSkillColor = (type: string) => {
  switch (type) {
    case 'vocabulary':
      return 'from-blue-500 to-blue-600';
    case 'grammar':
      return 'from-green-500 to-green-600';
    case 'listening':
      return 'from-purple-500 to-purple-600';
    case 'speaking':
      return 'from-orange-500 to-orange-600';
    case 'reading':
      return 'from-pink-500 to-pink-600';
    case 'writing':
      return 'from-indigo-500 to-indigo-600';
    case 'practice':
      return 'from-red-500 to-red-600';
    default:
      return 'from-gray-500 to-gray-600';
  }
};

// Mini Roadmap Map Component - Copy từ RoadmapDetailPage với đầy đủ logic
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
            {index < stagesWithFixedPositions.length - 1 && (
              <div
                className="absolute w-32 h-0.5 bg-blue-400 opacity-70"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: index === 2 || index === 3 ? `rotate(-90deg)` : `rotate(90deg)`,
                  transformOrigin: "0 0",
                }}
              />
            )}

            {/* Stage marker - giống y hệt RoadmapPage nhưng nhỏ hơn */}
            <div className="flex flex-col items-center">
              <button
                className={`w-10 h-10 rounded-full border-2 ${getStageColor(stage.status)} flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform group relative`}
                onClick={() => onStageClick(stage.id)}
                aria-label={`Chọn chặng ${stage.id}: ${stage.title}`}
              >
                {(() => {
                  if (stage.status === "completed") {
                    return <CheckCircle className="h-4 w-4" />;
                  } else if (stage.status === "in_progress") {
                    return <Play className="h-4 w-4" />;
                  } else {
                    return <Circle className="h-4 w-4" />;
                  }
                })()}
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

// Stage Units View Component - Copy từ RoadmapDetailPage
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

  const getUnitIcon = (status: string) => {
    if (status === "completed") {
      return <CheckCircle className="h-5 w-5 mb-1" />;
    }
    if (status === "locked") {
      return <Circle className="h-5 w-5 mb-1" />;
    }
    return <Play className="h-5 w-5 mb-1" />;
  };

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
          <ChevronLeft className="w-4 h-4 text-orange-500" />
        </Button>

        <div className="flex-1 mx-2">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-center py-2 px-4 rounded-lg shadow-md">
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
          <ChevronRight className="w-4 h-4 text-orange-500" />
        </Button>
      </div>

      {/* Simplified Units Path */}
      <div 
        ref={unitContainerRef}
        className="bg-gradient-to-b from-blue-50 to-green-50 rounded-lg p-4 max-h-80 overflow-y-auto"
      >
        <div className="grid grid-cols-4 gap-3">
          {currentStageData.unitNumbers.map((unitNumber) => {
            const status = getUnitStatus(unitNumber);
            return (
              <div
                key={unitNumber}
                data-unit={unitNumber}
                className={`
                  relative p-3 rounded-lg border-2 text-center transition-all cursor-pointer
                  ${getUnitStatusClass(status)}
                  hover:scale-105 hover:shadow-md
                `}
              >
                <div className="flex flex-col items-center">
                  {getUnitIcon(status)}
                  <span className="text-xs font-semibold">Unit {unitNumber}</span>
                </div>
              </div>
            );
          })}
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

export default function ChapterDetailPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [units, setUnits] = useState<UnitWithSkills[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [currentStage, setCurrentStage] = useState(3);

  useEffect(() => {
    if (chapterId) {
      const fetchChapterData = async () => {
        try {
          setLoading(true);
          const [chapterRes, unitsRes] = await Promise.all([
            getChapterById(chapterId),
            getUnitsByChapterId(chapterId),
          ]);

          if (chapterRes.success) {
            setChapter(chapterRes.data);
          } else {
            setError(chapterRes.message);
          }

          if (unitsRes.success) {
            // Transform units và fetch materials cho mỗi unit
            const unitsWithSkills = await Promise.all(
              unitsRes.data.map(async (unit: Unit, index: number) => {
                try {
                  const materialsRes = await MaterialService.getMaterialsByUnit(unit.id);
                  const materials = materialsRes.success ? materialsRes.data : [];
                  
                  // Generate skills based on materials or default skills
                  const skills: Skill[] = [
                    { id: `vocab-${unit.id}`, name: 'Từ vựng', type: 'vocabulary' },
                    { id: `grammar-${unit.id}`, name: 'Ngữ pháp', type: 'grammar' },
                    { id: `listening-${unit.id}`, name: 'Luyện nghe', type: 'listening' },
                    { id: `speaking-${unit.id}`, name: 'Luyện nói', type: 'speaking' },
                    { id: `reading-${unit.id}`, name: 'Luyện đọc', type: 'reading' },
                    { id: `writing-${unit.id}`, name: 'Luyện viết', type: 'writing' },
                  ];

                  return {
                    ...unit,
                    isExpanded: index === 0, // Mở unit đầu tiên
                    isCompleted: false, // Logic completion will be implemented later
                    materials,
                    skills,
                  };
                } catch (err) {
                  console.error(`Error fetching materials for unit ${unit.id}:`, err);
                  return {
                    ...unit,
                    isExpanded: index === 0,
                    isCompleted: false,
                    materials: [],
                    skills: [
                      { id: `vocab-${unit.id}`, name: 'Từ vựng', type: 'vocabulary' },
                      { id: `grammar-${unit.id}`, name: 'Ngữ pháp', type: 'grammar' },
                      { id: `listening-${unit.id}`, name: 'Luyện nghe', type: 'listening' },
                      { id: `speaking-${unit.id}`, name: 'Luyện nói', type: 'speaking' },
                      { id: `reading-${unit.id}`, name: 'Luyện đọc', type: 'reading' },
                      { id: `writing-${unit.id}`, name: 'Luyện viết', type: 'writing' },
                    ] as Skill[],
                  };
                }
              })
            );

            setUnits(unitsWithSkills);
            
            // Set first skill as selected
            if (unitsWithSkills.length > 0 && unitsWithSkills[0].skills.length > 0) {
              setSelectedSkill(unitsWithSkills[0].skills[0].id);
            }
          } else {
            console.error('Error fetching units:', unitsRes.message);
          }
        } catch (err) {
          setError('Failed to fetch chapter details.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchChapterData();
    }
  }, [chapterId]);

  const toggleUnit = (unitId: string) => {
    setUnits((prev) =>
      prev.map((unit) =>
        unit.id === unitId ? { ...unit, isExpanded: !unit.isExpanded } : unit
      )
    );
  };

  // Find current skill details
  const getCurrentSkill = () => {
    for (const unit of units) {
      const skill = unit.skills.find((s) => s.id === selectedSkill);
      if (skill) {
        return { skill, unit };
      }
    }
    return null;
  };

  const currentSkillData = getCurrentSkill();

  const handleStageClick = (stageId: number) => {
    setCurrentStage(stageId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-700 font-medium">Đang tải nội dung chương học...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Đã xảy ra lỗi</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(0)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return <div>Chapter not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Full Width Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(`/courses/${chapter?.courseId}`)} 
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại khóa học
            </Button>
            
            {/* Language Toggle */}
            
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <Languages className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">{chapter.title}</h1>
                <p className="text-xl opacity-90">{chapter.description || 'Học tiếng Nhật cơ bản'}</p>
              </div>
            </div>

            {/* Chapter Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Chương đang học</h3>
                  <p className="text-2xl font-bold">{chapter.title}</p>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Tổng số bài</h3>
                  <p className="text-2xl font-bold">{units.length}</p>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Tiến độ</h3>
                  <p className="text-2xl font-bold">
                    {Math.round((units.filter(u => u.isCompleted).length / units.length) * 100) || 0}%
                  </p>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Trạng thái</h3>
                  <Badge className="bg-blue-500/20 text-white border-blue-300/50 text-lg px-3 py-1">
                    Đang học
                  </Badge>
                </div>
              </div>
            </div>

            {currentSkillData && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-4xl mx-auto">
                <div className="flex items-center justify-center gap-6">
                  <div>
                    <h2 className="text-2xl font-bold">{currentSkillData.unit.title}</h2>
                    <p className="text-lg opacity-90">{currentSkillData.unit.description || 'Bài học tiếng Nhật'}</p>
                  </div>
                  <div className="text-center">
                    <Badge className="bg-white/20 text-white border-white/30 mb-2">
                      {currentSkillData.skill.name}
                    </Badge>
                    <p className="text-sm opacity-80">Kỹ năng đang học</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Left Sidebar - Units and Skills */}
        <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Danh sách bài học</h2>
            <p className="text-sm text-gray-600">Chọn unit và kỹ năng để học</p>
          </div>

          {/* Units List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {units.map((unit) => (
                <div key={unit.id} className="space-y-2">
                  {/* Unit Header */}
                  <button
                    className="w-full flex items-center justify-between cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors border border-gray-200 text-left"
                    onClick={() => toggleUnit(unit.id)}
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      {unit.isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{unit.title}</h3>
                        <p className="text-xs text-gray-600">{unit.description || 'Bài học'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {unit.isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Skills */}
                  {unit.isExpanded && (
                    <div className="ml-6 space-y-2">
                      {unit.skills.map((skill) => (
                        <button
                          key={skill.id}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 text-left ${
                            selectedSkill === skill.id
                              ? 'bg-blue-100 border-l-4 border-l-blue-500'
                              : 'hover:bg-gray-50 border border-gray-100'
                          }`}
                          onClick={() => setSelectedSkill(skill.id)}
                          type="button"
                        >
                          <div
                            className={`p-2 rounded-lg bg-gradient-to-br ${getSkillColor(skill.type)} text-white flex-shrink-0`}
                          >
                            {getSkillIcon(skill.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{skill.name}</h4>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-gray-100 p-6">
            <Card className="h-full shadow-lg">
              <CardContent className="p-0 h-full">
                {/* PDF Toolbar */}
                <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold">Tài liệu học tập</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <span>Trang 1 / 10</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="text-white hover:bg-gray-700">
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm px-2">100%</span>
                    <Button size="sm" variant="ghost" className="text-white hover:bg-gray-700">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-gray-600 mx-2" />
                    <Button size="sm" variant="ghost" className="text-white hover:bg-gray-700">
                      <Maximize className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-white hover:bg-gray-700">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* PDF Content Area */}
                <div className="h-full bg-white flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-6 mx-auto">
                      <FileText className="h-16 w-16 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Tài liệu PDF</h3>
                    <p className="text-gray-600 mb-6 max-w-md">
                      {currentSkillData
                        ? `Nội dung bài học "${currentSkillData.skill.name}" - ${currentSkillData.unit.title}`
                        : 'Chọn kỹ năng từ sidebar để xem tài liệu'}
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Mẹo:</strong> Sử dụng các công cụ trên thanh toolbar để điều chỉnh hiển thị tài liệu.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Action Bar */}
          <div className="bg-white border-t border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <ArrowLeft className="h-4 w-4" />
                Kỹ năng trước
              </Button>

              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center gap-2">
                Kỹ năng tiếp theo
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Stage Units */}
        <div className="w-80 bg-white shadow-lg border-l border-gray-200 p-6">
          {/* Roadmap Overview */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Lộ trình tổng quan</h2>
            <p className="text-sm text-gray-600 mb-4">Tiến độ học tập theo từng chặng</p>
            <MiniRoadmapMap onStageClick={handleStageClick} />
          </div>
          
          {/* Current Stage Details */}
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Chặng đang học</h2>
            <p className="text-sm text-gray-600">Theo dõi tiến độ chi tiết</p>
          </div>
          
          <StageUnitsView 
            currentStage={currentStage} 
            setCurrentStage={setCurrentStage}
          />
        </div>
      </div>
    </div>
  );
}
