import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChapterById, getUnitsByChapterId } from '../services/chapterDetailService';
import { MaterialService } from '../services/materialService';
import type { Chapter } from '../types/chapter';
import type { Unit, UnitStatus } from '../types/unit';
import type { Material } from '../types/material';
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
  Play,
} from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  type: 'vocabulary' | 'kanji' | 'grammar' | 'reading' | 'listening' | 'writing' | 'practice' | 'speaking';
  order: number;
  materials: Material[];
}

interface UnitWithSkills {
  id: string;
  title: string;
  description?: string | null;
  status: UnitStatus;
  chapterId: string;
  prerequisiteUnitId?: string | null;
  isExpanded: boolean;
  isCompleted: boolean;
  materials: Material[];
  skills: Skill[];
}

// Material type mapping
const MATERIAL_TYPE_TO_SKILL: Record<string, Skill['type']> = {
  'VOCAB': 'vocabulary',
  'KANJI': 'kanji',
  'GRAMMAR': 'grammar',
  'READING': 'reading', 
  'LISTENING': 'listening',
  'WRITING': 'writing'
}

// Skill order for display
const SKILL_ORDER: Skill['type'][] = ['vocabulary', 'kanji', 'grammar', 'reading', 'listening', 'writing', 'practice']

const SKILL_NAMES: Record<Skill['type'], string> = {
  'vocabulary': 'Từ vựng',
  'kanji': 'Kanji', 
  'grammar': 'Ngữ pháp',
  'reading': 'Luyện đọc',
  'listening': 'Luyện nghe',
  'writing': 'Luyện viết',
  'practice': 'Kiểm tra',
  'speaking': 'Luyện nói'
}

// Tạo skills từ materials có sẵn
const createSkillsFromMaterials = (materials: Material[], unitId: string): Skill[] => {
  console.log('Creating skills from materials for unit:', unitId, materials);
  
  // Tạo set các skill type có material
  const availableSkillTypes = new Set<Skill['type']>();
  
  materials.forEach(material => {
    const skillType = MATERIAL_TYPE_TO_SKILL[material.type];
    if (skillType) {
      availableSkillTypes.add(skillType);
    }
  });
  
  // Luôn có practice skill nếu có bất kỳ material nào
  if (materials.length > 0) {
    availableSkillTypes.add('practice');
  }
  
  // Tạo skills theo thứ tự đã định sẵn, chỉ hiển thị skills có material
  const skills: Skill[] = [];
  
  SKILL_ORDER.forEach((skillType, index) => {
    if (availableSkillTypes.has(skillType)) {
      const skillMaterials = materials.filter(material => 
        MATERIAL_TYPE_TO_SKILL[material.type] === skillType
      );
      
      // For practice skill, use the first available material (since it's generic)
      let finalMaterials = skillMaterials;
      if (skillType === 'practice' && materials.length > 0) {
        finalMaterials = [materials[0]];
      }
      
      skills.push({
        id: `skill_${skillType}_${unitId}`, // Add unitId to make unique
        name: SKILL_NAMES[skillType],
        type: skillType,
        order: index,
        materials: finalMaterials
      });
    }
  });
  
  console.log('Created skills for unit', unitId, ':', skills);
  return skills;
};

// Sắp xếp units theo thứ tự prerequisite
const sortUnitsByPrerequisite = (units: UnitWithSkills[]): UnitWithSkills[] => {
  console.log('🔄 Sorting units by prerequisite order');
  
  const sorted: UnitWithSkills[] = [];
  const remaining = [...units];
  
  // Tìm units không có prerequisite trước
  while (remaining.length > 0) {
    const readyUnits = remaining.filter(unit => {
      // Unit sẵn sàng nếu không có prerequisite hoặc prerequisite đã được thêm vào sorted
      return !unit.prerequisiteUnitId || 
             sorted.some(sortedUnit => sortedUnit.id === unit.prerequisiteUnitId);
    });
    
    if (readyUnits.length === 0) {
      // Nếu không tìm thấy unit nào ready (có thể có circular dependency), 
      // thêm tất cả units còn lại
      console.warn('⚠️ Possible circular dependency detected, adding remaining units');
      sorted.push(...remaining);
      break;
    }
    
    // Thêm ready units vào sorted và xóa khỏi remaining
    readyUnits.forEach(unit => {
      sorted.push(unit);
      const index = remaining.indexOf(unit);
      if (index > -1) {
        remaining.splice(index, 1);
      }
    });
  }
  
  console.log('🎯 Units sorted by prerequisite:', sorted.map(u => ({
    id: u.id,
    title: u.title,
    prerequisiteUnitId: u.prerequisiteUnitId
  })));
  
  return sorted;
};

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

  // Auto-scroll logic - Use scrollTop instead of scrollIntoView to avoid page interference
  useEffect(() => {
    if (currentStageData?.status === "in_progress" && unitContainerRef.current) {
      const completedUnits = Math.floor(currentStageData.units * 0.65);
      const currentUnitNumber = currentStageData.unitNumbers[0] + completedUnits;
      
      setTimeout(() => {
        const currentUnitElement = document.querySelector(`[data-unit="${currentUnitNumber}"]`) as HTMLElement;
        if (currentUnitElement && unitContainerRef.current) {
          // Use scrollTop on the container instead of scrollIntoView to prevent page scroll
          const container = unitContainerRef.current;
          
          // Calculate relative position within container
          const elementTop = currentUnitElement.offsetTop;
          const containerHeight = container.clientHeight;
          
          // Scroll to center the element within the container
          const scrollTop = elementTop - (containerHeight / 2);
          
          container.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
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
  const { courseId, chapterId } = useParams<{ 
    courseId: string;
    chapterId: string;
  }>();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [units, setUnits] = useState<UnitWithSkills[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [currentStage, setCurrentStage] = useState(3);

  // Function to handle skill selection with auto-scroll
  const handleSkillSelect = (skillId: string) => {
    console.log('🎯 handleSkillSelect called for:', skillId, 'current page scrollY:', window.scrollY);
    setSelectedSkill(skillId);
    
    // Auto scroll to top after skill selection (below header)
    setTimeout(() => {
      console.log('📜 Scrolling to top 300, before scroll Y:', window.scrollY);
      window.scrollTo({
        top: 300,
        behavior: 'smooth'
      });
      setTimeout(() => {
        console.log('📜 After scroll, current Y:', window.scrollY);
      }, 500);
    }, 100);
  };

  // Navigation functions for skills
  const getAllSkillsInOrder = () => {
    const allSkills: Array<{ skillId: string; unitId: string; unitTitle: string; skillName: string; skillType: string }> = [];
    
    units.forEach(unit => {
      unit.skills.forEach(skill => {
        allSkills.push({
          skillId: skill.id,
          unitId: unit.id,
          unitTitle: unit.title,
          skillName: skill.name,
          skillType: skill.type
        });
      });
    });
    
    return allSkills;
  };

  const getCurrentSkillIndex = () => {
    const allSkills = getAllSkillsInOrder();
    return allSkills.findIndex(skill => skill.skillId === selectedSkill);
  };

  const handlePreviousSkill = () => {
    console.log('⬅️ handlePreviousSkill called, current scrollY:', window.scrollY);
    const allSkills = getAllSkillsInOrder();
    const currentIndex = getCurrentSkillIndex();
    
    if (currentIndex > 0) {
      const previousSkill = allSkills[currentIndex - 1];
      
      // Expand the unit containing the previous skill
      setUnits(prev => prev.map(unit => ({
        ...unit,
        isExpanded: unit.id === previousSkill.unitId ? true : unit.isExpanded
      })));
      
      handleSkillSelect(previousSkill.skillId);
    }
  };

  const handleNextSkill = () => {
    console.log('➡️ handleNextSkill called, current scrollY:', window.scrollY);
    const allSkills = getAllSkillsInOrder();
    const currentIndex = getCurrentSkillIndex();
    
    if (currentIndex < allSkills.length - 1) {
      const nextSkill = allSkills[currentIndex + 1];
      
      // Expand the unit containing the next skill
      setUnits(prev => prev.map(unit => ({
        ...unit,
        isExpanded: unit.id === nextSkill.unitId ? true : unit.isExpanded
      })));
      
      handleSkillSelect(nextSkill.skillId);
    } else {
      // At the last skill - navigate to next chapter
      navigate(`/courses/${courseId}`);
    }
  };

  const isFirstSkill = () => getCurrentSkillIndex() === 0;
  const isLastSkill = () => {
    const allSkills = getAllSkillsInOrder();
    return getCurrentSkillIndex() === allSkills.length - 1;
  };

  const isLastSkillOfUnit = () => {
    const currentSkillData = getCurrentSkill();
    if (!currentSkillData) return false;
    
    const unit = currentSkillData.unit;
    const skillIndex = unit.skills.findIndex(skill => skill.id === selectedSkill);
    return skillIndex === unit.skills.length - 1;
  };

  const isPracticeSkill = () => {
    const currentSkillData = getCurrentSkill();
    return currentSkillData?.skill.type === 'practice';
  };

  // Get button text for next skill navigation
  const getNextButtonText = () => {
    if (isPracticeSkill() && isLastSkillOfUnit() && !isLastSkill()) {
      return 'Bài học tiếp theo';
    }
    if (isLastSkill()) {
      return 'Chương tiếp theo';
    }
    return 'Kỹ năng tiếp theo';
  };

  useEffect(() => {
    if (chapterId) {
      console.log('🔍 Fetching data for chapterId:', chapterId);
      
      const fetchChapterData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          console.log('📡 Calling getChapterById and getUnitsByChapterId APIs');
          const [chapterRes, unitsRes] = await Promise.all([
            getChapterById(chapterId),
            getUnitsByChapterId(chapterId),
          ]);

          console.log('📋 Chapter response:', chapterRes);
          console.log('📋 Units response:', unitsRes);

          if (chapterRes.success) {
            setChapter(chapterRes.data);
          } else {
            console.error('❌ Chapter fetch failed:', chapterRes.message);
            setError(chapterRes.message || 'Không thể tải thông tin chương');
          }

          if (unitsRes.success) {
            console.log('📝 Processing units data:', unitsRes.data);
            
            // Lọc chỉ lấy units có status ACTIVE
            const activeUnits = unitsRes.data.filter((unit: Unit) => unit.status === 'ACTIVE');
            console.log('🔍 Filtered active units:', activeUnits);
            
            // Transform units với dữ liệu mới từ API
            const unitsWithSkills = await Promise.all(
              activeUnits.map(async (unit: Unit) => {
                try {
                  const materialsRes = await MaterialService.getMaterialsByUnit(unit.id);
                  const materials = materialsRes.success ? materialsRes.data : [];
                  
                  // Generate skills based on materials
                  const skills = createSkillsFromMaterials(materials, unit.id);

                  const processedUnit: UnitWithSkills = {
                    id: unit.id,
                    title: unit.title,
                    description: unit.description,
                    status: unit.status,
                    chapterId: unit.chapterId || chapterId || '',
                    prerequisiteUnitId: unit.prerequisiteUnitId,
                    isExpanded: false, // Will be set later based on completion status
                    isCompleted: unit.status === 'ACTIVE', // Unit active = completed
                    materials,
                    skills,
                  };
                  
                  console.log(`✅ Processed unit ${unit.id}:`, processedUnit);
                  return processedUnit;
                } catch (err) {
                  console.error(`❌ Error fetching materials for unit ${unit.id}:`, err);
                  
                  // Return unit with empty materials on error
                  const fallbackUnit: UnitWithSkills = {
                    id: unit.id,
                    title: unit.title,
                    description: unit.description,
                    status: unit.status,
                    chapterId: unit.chapterId || chapterId || '',
                    prerequisiteUnitId: unit.prerequisiteUnitId,
                    isExpanded: false, // Will be set later based on completion status
                    isCompleted: unit.status === 'ACTIVE',
                    materials: [],
                    skills: [],
                  };
                  return fallbackUnit;
                }
              })
            );

            console.log('🎯 Final processed units:', unitsWithSkills);
            
            // Sort units based on prerequisite order
            const sortedUnits = sortUnitsByPrerequisite(unitsWithSkills);
            console.log('🔄 Units sorted by prerequisite:', sortedUnits);
            
            // Find first incomplete unit, or first unit if all completed
            const firstIncompleteUnit = sortedUnits.find(unit => !unit.isCompleted) || sortedUnits[0];
            
            // Set the first incomplete unit as expanded
            const unitsWithExpansion = sortedUnits.map(unit => ({
              ...unit,
              isExpanded: unit.id === firstIncompleteUnit?.id
            }));
            
            setUnits(unitsWithExpansion);
            
            // Set first skill of the expanded unit as selected
            if (firstIncompleteUnit && firstIncompleteUnit.skills.length > 0) {
              setSelectedSkill(firstIncompleteUnit.skills[0].id);
              console.log('🎯 Selected first skill of first incomplete unit:', firstIncompleteUnit.skills[0].id);
            }
          } else {
            console.error('❌ Units fetch failed:', unitsRes.message);
            setError(unitsRes.message || 'Không thể tải danh sách bài học');
          }
        } catch (err) {
          console.error('💥 Fatal error in fetchChapterData:', err);
          setError('Không thể tải thông tin chương. Vui lòng thử lại.');
        } finally {
          setLoading(false);
        }
      };

      fetchChapterData();
    } else {
      console.warn('⚠️ No chapterId provided');
      setError('ID chương không hợp lệ');
    }
  }, [chapterId]);

  const toggleUnit = (unitId: string) => {
    console.log('🔧 toggleUnit called for:', unitId, 'current page scrollY:', window.scrollY);
    setUnits((prev) =>
      prev.map((unit) =>
        unit.id === unitId ? { ...unit, isExpanded: !unit.isExpanded } : unit
      )
    );
    setTimeout(() => {
      console.log('🔧 After toggleUnit, scrollY:', window.scrollY);
    }, 200);
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

  // Get current material from selected skill
  const currentMaterial = currentSkillData?.skill.materials?.[0] || null;

  // Zoom state for PDF viewer
  const [zoomLevel] = useState(100);



  const handleStageClick = (stageId: number) => {
    console.log('🗺️ handleStageClick called for stage:', stageId, 'current scrollY:', window.scrollY);
    setCurrentStage(stageId);
    setTimeout(() => {
      console.log('🗺️ After handleStageClick, scrollY:', window.scrollY);
    }, 200);
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
              onClick={() => navigate(`/courses/${courseId || chapter?.courseId}`)} 
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

          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Left Sidebar - Units and Skills */}
        <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col h-screen">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Danh sách bài học</h2>
            <p className="text-sm text-gray-600">Chọn unit và kỹ năng để học</p>
          </div>

          {/* Units List */}
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-120px)]">
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
                          onClick={() => handleSkillSelect(skill.id)}
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
                {/* Single PDF Toolbar */}
                <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
                  {/* Left: Document Title and Skill Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <h3 className="font-semibold">
                      {currentMaterial 
                        ? `Tài liệu: ${currentMaterial.description || 'Learning Material'}`
                        : 'Tài liệu học tập'
                      }
                    </h3>
                    {currentSkillData && (
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span>•</span>
                        <span>{currentSkillData.skill.name} - {currentSkillData.unit.title}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* PDF Content Area - No padding */}
                <div className="h-full bg-white flex items-center justify-center pb-11">
                  {currentMaterial ? (
                    /* Actual PDF Display with Zoom - Full width/height */
                    <div className="w-full h-full bg-white overflow-auto ">
                      <iframe
                        src={currentMaterial.fileUrl}
                        className="w-full h-full border-0"
                        title={`Material: ${currentMaterial.description || 'Learning Material'}`}
                        style={{ 
                          transform: `scale(${zoomLevel / 100})`,
                          transformOrigin: 'top left',
                          width: `${(100 * 100) / zoomLevel}%`,
                          height: `${(100 * 100) / zoomLevel}%`
                        }}
                      />
                    </div>
                  ) : (
                    /* Placeholder when no material - Keep padding for centered content */
                    <div className="text-center p-8">
                      <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-6 mx-auto">
                        <FileText className="h-16 w-16 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Tài liệu PDF</h3>
                      <p className="text-gray-600 mb-6 max-w-md">
                        {currentSkillData
                          ? `Chưa có tài liệu cho "${currentSkillData.skill.name}" - ${currentSkillData.unit.title}`
                          : 'Chọn kỹ năng từ sidebar để xem tài liệu'}
                      </p>
                      {currentSkillData?.skill.materials && currentSkillData.skill.materials.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                          <p className="text-sm text-yellow-800">
                            📁 Có {currentSkillData.skill.materials.length} tài liệu cho kỹ năng này:
                          </p>
                          <div className="mt-2 space-y-1">
                            {currentSkillData.skill.materials.map((material, index) => (
                              <div key={material.id} className="text-xs text-yellow-700">
                                {index + 1}. {material.description || `Material ${material.id}`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mt-4">
                        <p className="text-sm text-blue-800">
                          💡 <strong>Mẹo:</strong> Sử dụng các công cụ trên thanh toolbar để điều chỉnh hiển thị tài liệu.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Action Bar */}
          <div className="bg-white border-t border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-transparent"
                onClick={handlePreviousSkill}
                disabled={isFirstSkill()}
              >
                <ArrowLeft className="h-4 w-4" />
                Kỹ năng trước
              </Button>

              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center gap-2"
                onClick={handleNextSkill}
              >
                {getNextButtonText()}
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
