import React from 'react';
import { Play, FileText, CheckCircle, Lock } from 'lucide-react';
import type { Chapter } from '../types/courseDetail';

interface UnitListProps {
  chapter: Chapter;
  chapterIndex: number;
  isEnrolled?: boolean;
  completedUnits?: string[];
  onUnitClick: (unitId: string) => void;
  onExamClick: (examId: string) => void;
}

export const UnitList: React.FC<UnitListProps> = ({
  chapter,
  chapterIndex,
  isEnrolled = false,
  completedUnits = [],
  onUnitClick,
  onExamClick,
}) => {
  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);
    if (hours === 0) return `${minutes}p`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h${minutes}p`;
  };

  const isUnitAccessible = (unit: Chapter['units'][0], unitIndex: number) => {
    if (!isEnrolled) return false;
    if (chapterIndex === 0 && unitIndex === 0) return true;
    if (unit.prerequisiteUnitId && !completedUnits.includes(unit.prerequisiteUnitId)) return false;
    return true;
  };

  const getStatusIcon = (isCompleted: boolean, isAccessible: boolean) => {
    if (isCompleted) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (isAccessible) {
      return <Play className="w-5 h-5 text-red-600" />;
    }
    return <Lock className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="p-4 space-y-2">
      {/* Units */}
      <div className="space-y-2">
        {chapter.units.map((unit, unitIndex) => {
          const isCompleted = completedUnits.includes(unit.id);
          const isAccessible = isUnitAccessible(unit, unitIndex);

          return (
            <div key={unit.id}>
              <button
                onClick={() => isAccessible && onUnitClick(unit.id)}
                disabled={!isAccessible}
                className={`w-full p-4 rounded-lg border transition-colors text-left ${
                  isAccessible
                    ? 'hover:bg-gray-50 border-gray-200'
                    : 'bg-gray-50 border-gray-100 cursor-not-allowed'
                } ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(isCompleted, isAccessible)}
                      <span className="text-sm text-gray-500">
                        {chapterIndex + 1}.{unitIndex + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className={`font-medium ${isAccessible ? 'text-gray-900' : 'text-gray-500'}`}>
                        {unit.title}
                      </h4>
                      <p className={`text-sm ${isAccessible ? 'text-gray-600' : 'text-gray-400'}`}>
                        {unit.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {unit.exams.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <FileText className="w-3 h-3" />
                        {unit.exams.length}
                      </div>
                    )}
                    {isCompleted && <span className="text-xs text-green-600 font-medium">Hoàn thành</span>}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Chapter Exams */}
      {chapter.exams.length > 0 && (
        <div className="space-y-2 pt-2">
          {chapter.exams.map((exam, examIndex) => (
            <div key={exam.id}>
              <button
                onClick={() => isEnrolled && onExamClick(exam.id)}
                disabled={!isEnrolled}
                className={`w-full p-4 rounded-lg border transition-colors text-left ${
                  isEnrolled
                    ? 'hover:bg-blue-100 border-blue-200'
                    : 'bg-gray-50 border-gray-100 cursor-not-allowed'
                } bg-blue-50`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-500">
                        KT.{chapterIndex + 1}.{examIndex + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className={`font-medium ${isEnrolled ? 'text-gray-900' : 'text-gray-500'}`}>
                        {exam.title}
                      </h4>
                      <p className={`text-sm ${isEnrolled ? 'text-gray-600' : 'text-gray-400'}`}>
                        {exam.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{formatDuration(exam.duration)}</span>
                    {isEnrolled && <span className="text-xs text-blue-600 font-medium">Làm bài</span>}
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
