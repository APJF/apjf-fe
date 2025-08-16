import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { CheckCircle, Play, Lock, Flag, ArrowLeft, ArrowRight } from "lucide-react";

// Base interface for roadmap stages
export interface RoadmapStage {
  id: number;
  title: string;
  description: string;
  status: "completed" | "in_progress" | "locked";
  progress: number;
  position?: { x: number; y: number };
}

// Props interface for the Japan Roadmap component
export interface JapanRoadmapViewProps {
  // Required props
  stages: RoadmapStage[];
  
  // Optional props for customization
  title?: string;
  subtitle?: string;
  className?: string;
  
  // Layout options - removed variant, now using standard size only
  showHeader?: boolean;
  showNavigation?: boolean;
  showStageCards?: boolean;
  showActionButtons?: boolean;
  
  // Event handlers
  onStageClick?: (stageId: number) => void;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  
  // Action button customization
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  primaryActionIcon?: React.ReactNode;
  secondaryActionIcon?: React.ReactNode;
  
  // Header info display
  headerInfo?: {
    targetLevel?: string;
    status?: string;
    duration?: number;
    coursesCount?: number;
    completedStages?: number;
    totalStages?: number;
  };
  
  // Color theme
  theme?: "red" | "blue" | "green" | "orange" | "purple";
}

// Fixed positions for stages on Japan map (4 locations)
const JAPAN_MAP_POSITIONS = [
  { x: 20, y: 40 },  // Hokkaido area
  { x: 44, y: 54 },  // Honshu north
  { x: 72, y: 75 },  // Honshu central/south
  { x: 85, y: 52 },  // Kyushu/Shikoku
];

export function JapanRoadmapView({
  stages,
  title = "Lộ trình học tập",
  subtitle,
  className = "",
  showHeader = true,
  showNavigation = true,
  showStageCards = true,
  showActionButtons = false,
  onStageClick,
  onPrimaryAction,
  onSecondaryAction,
  primaryActionLabel = "Hành động chính",
  secondaryActionLabel = "Chi tiết",
  primaryActionIcon = <Flag className="h-3 w-3" />,
  secondaryActionIcon,
  headerInfo,
  theme = "blue", // Standardized theme
}: JapanRoadmapViewProps) {
  const [currentPage, setCurrentPage] = useState(0);

  // Calculate pagination
  const stagesPerPage = 4; // Fixed at 4 for Japan map positions
  const totalPages = Math.ceil(stages.length / stagesPerPage);
  const currentStages = stages.slice(currentPage * stagesPerPage, (currentPage + 1) * stagesPerPage);

  // Assign fixed positions to current stages
  const stagesWithPositions = currentStages.map((stage, index) => ({
    ...stage,
    position: JAPAN_MAP_POSITIONS[index] || { x: 50, y: 50 }
  }));

  // Theme-based styling
  const getThemeColors = () => {
    switch (theme) {
      case "red":
        return {
          primary: "red",
          completed: "bg-red-50 border-red-500 text-red-800",
          inProgress: "bg-red-100 border-red-600 text-red-700",
          locked: "bg-gray-100 border-gray-300 text-gray-600",
          badge: "bg-red-100 text-red-800",
          progressBar: "bg-red-600"
        };
      case "green":
        return {
          primary: "green",
          completed: "bg-green-50 border-green-500 text-green-800",
          inProgress: "bg-green-100 border-green-600 text-green-700",
          locked: "bg-gray-100 border-gray-300 text-gray-600",
          badge: "bg-green-100 text-green-800",
          progressBar: "bg-green-600"
        };
      case "orange":
        return {
          primary: "orange",
          completed: "bg-orange-50 border-orange-500 text-orange-800",
          inProgress: "bg-orange-100 border-orange-600 text-orange-700",
          locked: "bg-gray-100 border-gray-300 text-gray-600",
          badge: "bg-orange-100 text-orange-800",
          progressBar: "bg-orange-600"
        };
      case "purple":
        return {
          primary: "purple",
          completed: "bg-purple-50 border-purple-500 text-purple-800",
          inProgress: "bg-purple-100 border-purple-600 text-purple-700",
          locked: "bg-gray-100 border-gray-300 text-gray-600",
          badge: "bg-purple-100 text-purple-800",
          progressBar: "bg-purple-600"
        };
      default: // blue
        return {
          primary: "blue",
          completed: "bg-blue-50 border-blue-500 text-blue-800",
          inProgress: "bg-blue-100 border-blue-600 text-blue-700",
          locked: "bg-gray-100 border-gray-300 text-gray-600",
          badge: "bg-blue-100 text-blue-800",
          progressBar: "bg-blue-600"
        };
    }
  };

  const themeColors = getThemeColors();

  // Variant-based sizing - standardized for consistency
  const getSizeClasses = () => {
    // Unified standard size for all use cases
    return {
      marker: "w-8 h-8",      // Medium size markers
      icon: "h-4 w-4",        // Medium icons
      card: "p-4",            // Standard padding
      text: "text-sm",        // Standard text
      title: "text-lg",       // Standard title
      button: "text-sm px-3 py-2", // Standard buttons
      // Remove fixed height to allow image to display fully
    };
  };

  const sizeClasses = getSizeClasses();

  // Get appropriate icon for stage status
  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className={`${sizeClasses.icon} text-${themeColors.primary}-600`} />;
      case "in_progress":
        return <Play className={`${sizeClasses.icon} text-${themeColors.primary}-500`} />;
      case "locked":
        return <Lock className={`${sizeClasses.icon} text-gray-400`} />;
      default:
        return <div className={`${sizeClasses.icon} border-2 border-gray-400 rounded-full`} />;
    }
  };

  // Get stage styling based on status
  const getStageColor = (status: string) => {
    switch (status) {
      case "completed":
        return themeColors.completed;
      case "in_progress":
        return themeColors.inProgress;
      case "locked":
        return themeColors.locked;
      default:
        return themeColors.locked;
    }
  };

  // Get status text in Vietnamese
  const getStatusText = (status: string) => {
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

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (stages.length === 0) return 0;
    const totalProgress = stages.reduce((sum, stage) => sum + stage.progress, 0);
    return Math.round(totalProgress / stages.length);
  };

  return (
    <Card className={`bg-gradient-to-br from-${themeColors.primary}-50 to-${themeColors.primary}-100 border-2 border-${themeColors.primary}-200 ${className}`}>
      {showHeader && (
        <CardHeader className={sizeClasses.card}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className={`${sizeClasses.title} font-bold text-gray-900`}>
                {title}
              </CardTitle>
              {subtitle && (
                <p className={`${sizeClasses.text} text-gray-600 mt-1`}>{subtitle}</p>
              )}
              
              {/* Header info badges */}
              {headerInfo && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {headerInfo.targetLevel && (
                    <Badge className={`${themeColors.badge} text-xs`}>
                      {headerInfo.targetLevel}
                    </Badge>
                  )}
                  {headerInfo.status && (
                    <Badge className={`${themeColors.badge} text-xs`}>
                      {headerInfo.status}
                    </Badge>
                  )}
                  {headerInfo.duration && (
                    <span className={`${sizeClasses.text} text-gray-600`}>
                      {headerInfo.duration} ngày
                    </span>
                  )}
                  {headerInfo.completedStages !== undefined && headerInfo.totalStages && (
                    <span className={`${sizeClasses.text} text-gray-600`}>
                      {headerInfo.completedStages}/{headerInfo.totalStages} chặng
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Progress display */}
            {headerInfo && (
              <div className="text-right">
                {headerInfo.coursesCount !== undefined && (
                  <>
                    <div className={`text-xl font-bold text-${themeColors.primary}-600`}>
                      {headerInfo.coursesCount}
                    </div>
                    <p className={`${sizeClasses.text} text-gray-600`}>Khóa học</p>
                  </>
                )}
                {!headerInfo.coursesCount && (
                  <>
                    <div className={`text-xl font-bold text-${themeColors.primary}-600`}>
                      {calculateOverallProgress()}%
                    </div>
                    <p className={`${sizeClasses.text} text-gray-600`}>Hoàn thành</p>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className={sizeClasses.card}>
        {/* Japan Map with Stage Markers */}
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden bg-gray-50">
            {/* Background Japan map image - maintain aspect ratio, show 100% */}
            <img 
              src="/img/Roadmap.webp" 
              alt="Japan Learning Path Map" 
              className="w-full h-auto object-contain"
            />
            
            {/* Stage markers overlay */}
            <div className="absolute inset-0">
              {stagesWithPositions.map((stage, index) => (
                <div
                  key={stage.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{
                    left: `${stage.position!.x}%`,
                    top: `${stage.position!.y}%`,
                  }}
                >
                  {/* Connection line to next stage */}
                  {index < stagesWithPositions.length - 1 && (
                    <div
                      className={`absolute w-0.5 h-8 bg-${themeColors.primary}-400 opacity-70`}
                      style={{
                        left: "50%",
                        top: index === 0 || index === 1 ? "100%" : "-32px", // 1,2 trỏ xuống, 3,4 trỏ lên
                        transform: "translateX(-50%)",
                      }}
                    />
                  )}

                  {/* Stage marker button */}
                  <button
                    className={`${sizeClasses.marker} rounded-full border-2 ${getStageColor(stage.status)} flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform group relative disabled:cursor-not-allowed`}
                    onClick={() => onStageClick?.(stage.id)}
                    disabled={stage.status === "locked" && !onStageClick}
                    aria-label={`${stage.title} - ${getStatusText(stage.status)}`}
                  >
                    {getStageIcon(stage.status)}
                    
                    {/* Hover tooltip */}
                    <div className={`absolute left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-3 min-w-48 opacity-0 group-hover:opacity-100 transition-opacity z-30 border border-gray-200 pointer-events-none ${
                      stage.position!.y < 50 ? 'top-12' : 'bottom-12'
                    }`}>
                      <div className="text-left">
                        <h4 className="font-semibold text-sm mb-1 text-gray-900">
                          {stage.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">{stage.description}</p>
                        
                        {/* Progress bar for in-progress stages */}
                        {stage.status === "in_progress" && stage.progress > 0 && (
                          <div className="space-y-1 mb-2">
                            <div className="flex justify-between text-xs">
                              <span>Tiến độ</span>
                              <span className={`font-semibold text-${themeColors.primary}-600`}>
                                {stage.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`${themeColors.progressBar} h-1.5 rounded-full`} 
                                style={{ width: `${stage.progress}%` }} 
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Status badge */}
                        <div className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${getStageColor(stage.status)}`}>
                          {getStatusText(stage.status)}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation controls */}
        {showNavigation && totalPages > 1 && (
          <div className="flex justify-center items-center space-x-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className={`bg-white ${sizeClasses.button}`}
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Trước
            </Button>

            {/* Page indicators */}
            <div className="flex items-center space-x-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentPage ? `bg-${themeColors.primary}-600` : "bg-gray-300"
                  }`}
                  aria-label={`Trang ${i + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className={`bg-white ${sizeClasses.button}`}
            >
              Sau
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}

        {/* Current stage cards - always show for standard variant */}
        {showStageCards && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {stagesWithPositions.map((stage) => (
              <div key={stage.id} className={`p-2 rounded-lg border ${getStageColor(stage.status)}`}>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="scale-75">
                    {getStageIcon(stage.status)}
                  </div>
                  <span className="font-semibold text-xs">{stage.title}</span>
                </div>
                <h4 className="font-medium text-xs mb-1 leading-tight">{stage.title}</h4>
                
                {/* Progress bar for in-progress/completed stages */}
                {stage.progress > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-white bg-opacity-50 rounded-full h-1">
                      <div 
                        className={`${themeColors.progressBar} h-1 rounded-full`} 
                        style={{ width: `${stage.progress}%` }} 
                      />
                    </div>
                    <span className="text-xs font-medium mt-1 block">{stage.progress}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {showActionButtons && (onPrimaryAction || onSecondaryAction) && (
          <div className="flex justify-center space-x-3 mt-4">
            {onPrimaryAction && (
              <Button 
                className={`bg-${themeColors.primary}-600 hover:bg-${themeColors.primary}-700 text-white ${sizeClasses.button} flex items-center space-x-1`}
                onClick={onPrimaryAction}
              >
                {primaryActionIcon}
                <span>{primaryActionLabel}</span>
              </Button>
            )}
            {onSecondaryAction && (
              <Button 
                variant="outline" 
                className={`bg-white ${sizeClasses.button} flex items-center space-x-1`}
                onClick={onSecondaryAction}
              >
                {secondaryActionIcon}
                <span>{secondaryActionLabel}</span>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default JapanRoadmapView;
