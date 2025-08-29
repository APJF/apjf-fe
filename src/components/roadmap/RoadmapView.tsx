import { useState } from "react";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { CheckCircle, Play, Flag } from "lucide-react";

// Types
export interface RoadmapStage {
  id: number;
  title: string;
  description: string;
  status: "completed" | "in_progress" | "locked";
  progress: number;
  position?: { x: number; y: number };
}

export interface RoadmapViewProps {
  // Required props
  stages: RoadmapStage[];
  
  // Optional props for customization
  title?: string;
  subtitle?: string;
  className?: string;
  compact?: boolean; // For smaller version like in detail page
  showHeader?: boolean;
  showNavigation?: boolean;
  showStageCards?: boolean;
  
  // Event handlers
  onStageClick?: (stageId: number) => void;
  onSetActive?: () => void;
  onViewDetail?: () => void;
  
  // Additional info for header
  headerInfo?: {
    targetLevel?: string;
    status?: string;
    duration?: number;
    coursesCount?: number;
  };
}

// Default stages data
const DEFAULT_STAGES: RoadmapStage[] = [
  {
    id: 1,
    title: "Hiragana & Katakana",
    description: "Học thuộc 46 ký tự cơ bản",
    status: "completed",
    progress: 100,
  },
  {
    id: 2,
    title: "Từ vựng N5",
    description: "800 từ vựng thiết yếu",
    status: "completed",
    progress: 100,
  },
  {
    id: 3,
    title: "Ngữ pháp cơ bản",
    description: "Các mẫu câu N5",
    status: "in_progress",
    progress: 65,
  },
  {
    id: 4,
    title: "Kanji N5",
    description: "103 chữ Kanji cơ bản",
    status: "locked",
    progress: 0,
  },
  {
    id: 5,
    title: "Luyện nghe N5",
    description: "Kỹ năng nghe hiểu",
    status: "locked",
    progress: 0,
  },
  {
    id: 6,
    title: "Đọc hiểu N5",
    description: "Đọc và hiểu văn bản",
    status: "locked",
    progress: 0,
  },
];

export function RoadmapView({
  stages = DEFAULT_STAGES,
  title = "Lộ trình đang học",
  subtitle,
  className = "",
  compact = false,
  showHeader = true,
  showNavigation = true,
  showStageCards = true,
  onStageClick,
  onSetActive,
  onViewDetail,
  headerInfo,
}: RoadmapViewProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const stagesPerPage = 4;
  const totalPages = Math.ceil(stages.length / stagesPerPage);
  const currentStages = stages.slice(currentPage * stagesPerPage, (currentPage + 1) * stagesPerPage);

  // Fixed positions for 4 stages per page
  const fixedPositions = [
    { x: 20, y: 40 },  // Stage 1
    { x: 44, y: 54 },  // Stage 2
    { x: 72, y: 75 },  // Stage 3
    { x: 85, y: 52 },  // Stage 4
  ];

  // Assign fixed positions to stages
  const stagesWithFixedPositions = currentStages.map((stage, index) => ({
    ...stage,
    position: fixedPositions[index] || { x: 50, y: 50 }
  }));

  const getStageIcon = (status: string) => {
    const iconSize = compact ? "h-4 w-4" : "h-6 w-6";
    
    switch (status) {
      case "completed":
        return <CheckCircle className={`${iconSize} ${compact ? 'text-green-600' : 'text-red-800'}`} />;
      case "in_progress":
        return <Play className={`${iconSize} ${compact ? 'text-blue-600' : 'text-red-600'}`} />;
      case "locked":
        return <div className={`${iconSize} border-2 border-gray-400 rounded-full`} />;
      default:
        return null;
    }
  };

  const getStageColor = (status: string) => {
    if (compact) {
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
    } else {
      // Using unified red theme for all stages in main view
      switch (status) {
        case "completed":
          return "bg-red-50 border-red-500 text-red-800";
        case "in_progress":
          return "bg-red-100 border-red-600 text-red-700";
        case "locked":
          return "bg-gray-100 border-gray-300 text-gray-600";
        default:
          return "bg-gray-100 border-gray-300 text-gray-600";
      }
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

  const markerSize = compact ? "w-10 h-10" : "w-8 h-8";

  return (
    <Card className={`bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 ${className}`}>
      <CardContent className="p-1">
        {/* Header */}
        {showHeader && (
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
              {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
              {headerInfo && (
                <div className="flex items-center space-x-2 mt-1">
                  {headerInfo.targetLevel && (
                    <Badge className="bg-green-100 text-green-800 text-xs">{headerInfo.targetLevel}</Badge>
                  )}
                  {headerInfo.status && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs">{headerInfo.status}</Badge>
                  )}
                  {headerInfo.duration && (
                    <span className="text-xs text-gray-600">Thời gian: {headerInfo.duration} giờ</span>
                  )}
                </div>
              )}
            </div>
            {headerInfo?.coursesCount !== undefined && (
              <div className="text-right">
                <div className="text-xl font-bold text-blue-600">{headerInfo.coursesCount}</div>
                <p className="text-xs text-gray-600">Khóa học</p>
              </div>
            )}
          </div>
        )}

        {/* Japan Map with Stages */}
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden bg-gray-50">
            {/* Background image */}
            <img 
              src="/img/Roadmap.webp" 
              alt="Japan Roadmap" 
              className="w-full h-auto object-contain"
            />
            
            {/* Stage markers overlay */}
            <div className="absolute inset-0">
              {stagesWithFixedPositions.map((stage, index) => (
                <div
                  key={stage.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{
                    left: `${stage.position!.x}%`,
                    top: `${stage.position!.y}%`,
                  }}
                >
                  {/* Connection line to next stage */}
                  <div
                    className="absolute w-12 h-0.5 bg-blue-400 opacity-70"
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: index === 2 || index === 3 ? `rotate(-90deg)` : `rotate(90deg)`,
                      transformOrigin: "0 0",
                    }}
                  />

                  {/* Stage marker */}
                  <div className="flex flex-col items-center">
                    <button
                      className={`${markerSize} rounded-full border-2 ${getStageColor(stage.status)} flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform group relative`}
                      onClick={() => onStageClick?.(stage.id)}
                      aria-label={`Chọn chặng ${stage.id}: ${stage.title}`}
                    >
                      <div className={compact ? "scale-100" : "scale-75"}>
                        {getStageIcon(stage.status)}
                      </div>
                      
                      {/* Stage info tooltip */}
                      <div className={`absolute left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-2 min-w-32 opacity-0 group-hover:opacity-100 transition-opacity z-30 border border-gray-200 pointer-events-none ${
                        stage.id === 3 ? 'bottom-10' : 'top-10'
                      }`}>
                        <h4 className="font-semibold text-xs mb-1">{stage.title}</h4>
                        {/* Hiển thị progress bar chỉ cho in_progress */}
                        {stage.status === "in_progress" && (
                          <div className="space-y-1 mb-1">
                            <div className="flex justify-between text-xs">
                              <span>Tiến độ</span>
                              <span className="font-semibold text-blue-600">{stage.progress.toFixed(2)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${stage.progress}%` }} />
                            </div>
                          </div>
                        )}
                        {/* Hiển thị completion status cho completed */}
                        {stage.status === "completed" && (
                          <div className="mb-1">
                            <span className="text-xs font-medium text-green-600">✓ Hoàn thành</span>
                          </div>
                        )}
                        <div className={`text-xs font-medium px-1 py-0.5 rounded-full text-center ${getStageColor(stage.status)}`}>
                          {getStatusTextLabel(stage.status)}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          {showNavigation && totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="bg-white text-xs px-2 py-1"
              >
                ← Trước
              </Button>

              <div className="flex items-center space-x-1">
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
                className="bg-white text-xs px-2 py-1"
              >
                Sau →
              </Button>
            </div>
          )}
        </div>

        {/* Current stage info cards */}
        {showStageCards && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {stagesWithFixedPositions.slice(0, 4).map((stage) => (
              <div key={stage.id} className={`p-2 rounded-lg border ${getStageColor(stage.status)}`}>
                <div className="flex items-center space-x-1 mb-1">
                  <div className="scale-75">
                    {getStageIcon(stage.status)}
                  </div>
                  <span className="font-semibold text-xs">Chặng {stage.id}</span>
                </div>
                <h4 className="font-medium text-xs mb-1">{stage.title}</h4>
                {/* Hiển thị progress bar chỉ cho in_progress */}
                {stage.status === "in_progress" && stage.progress > 0 && (
                  <div className="mt-1">
                    <div className="w-full bg-white bg-opacity-50 rounded-full h-1">
                      <div className="bg-current h-1 rounded-full" style={{ width: `${stage.progress}%` }} />
                    </div>
                  </div>
                )}
                {/* Hiển thị completion status cho completed */}
                {stage.status === "completed" && (
                  <div className="mt-1">
                    <span className="text-xs font-medium text-green-600">✓ Hoàn thành</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {(onSetActive || onViewDetail) && (
          <div className="flex justify-center space-x-2 mt-2">
            {onSetActive && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                onClick={onSetActive}
              >
                <Flag className="h-3 w-3 mr-1" />
                Đặt lộ trình
              </Button>
            )}
            {onViewDetail && (
              <Button 
                variant="outline" 
                className="bg-white text-xs px-3 py-1"
                onClick={onViewDetail}
              >
                Chi tiết
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
