import { FileText, CheckCircle, Lock } from "lucide-react";
import type { Chapter } from '@/types/course';

interface UnitListProps {
  readonly chapter: Chapter;
  readonly isEnrolled?: boolean;
  readonly completedUnits?: string[];
  readonly onUnitClick?: (unitId: string) => void;
}

export function UnitList({ 
  chapter,
  isEnrolled = false, 
  completedUnits = [],
  onUnitClick
}: UnitListProps) {
  if (!chapter.units || chapter.units.length === 0) {
    return (
      <div className="pl-8 py-4 text-gray-500 text-sm">
        Chưa có bài học nào trong chương này
      </div>
    );
  }

  const getColorByStatus = (isCompleted: boolean, canAccess: boolean, variant: 'icon' | 'title' | 'description'): string => {
    if (isCompleted) {
      switch (variant) {
        case 'icon':
        case 'description':
          return 'text-green-600';
        case 'title':
          return 'text-green-800';
        default:
          return 'text-green-600';
      }
    }
    
    if (canAccess) {
      switch (variant) {
        case 'title':
          return 'text-gray-900';
        case 'icon':
        case 'description':
        default:
          return 'text-gray-600';
      }
    }
    
    return 'text-gray-400';
  };

  const renderIcon = (isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircle className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div className="pl-8 space-y-1">
      {chapter.units.map((unit) => {
        const isCompleted = completedUnits.includes(unit.id);
        const canAccess = isEnrolled;
        
        return (
          <button
            key={unit.id}
            type="button"
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
              canAccess 
                ? 'hover:bg-gray-50 border-gray-200' 
                : 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-60'
            } ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}
            onClick={() => canAccess && onUnitClick?.(unit.id)}
            disabled={!canAccess}
          >
            <div className="flex items-center space-x-3 flex-1">
              <div className={`flex-shrink-0 ${getColorByStatus(isCompleted, canAccess, 'icon')}`}>
                {renderIcon(isCompleted)}
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <h4 className={`font-medium text-sm ${getColorByStatus(isCompleted, canAccess, 'title')}`}>
                  {unit.title}
                </h4>
                {unit.description && (
                  <p className={`text-xs mt-1 ${getColorByStatus(isCompleted, canAccess, 'description')}`}>
                    {unit.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              {!canAccess && (
                <div className="flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                    Premium
                  </span>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default UnitList;
