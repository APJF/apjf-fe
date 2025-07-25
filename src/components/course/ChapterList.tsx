import React, { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Clock } from "lucide-react";
import type { Chapter, Exam } from '../../types/courseDetail';
import { UnitList } from './UnitList';

interface ChapterListProps {
  chapters: Chapter[];
  courseExams: Exam[];
  isEnrolled?: boolean;
  completedUnits?: string[];
  onUnitClick: (unitId: string) => void;
  onExamClick: (examId: string) => void;
}

export const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  courseExams,
  isEnrolled = false,
  completedUnits = [],
  onUnitClick,
  onExamClick,
}) => {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedExams, setExpandedExams] = useState<boolean>(false);

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const getTotalUnits = (chapter: Chapter) => {
    return chapter.units.length;
  };

  const getCompletedUnitsInChapter = (chapter: Chapter) => {
    return chapter.units.filter((unit) => completedUnits.includes(unit.id)).length;
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);
    if (hours === 0) return `${minutes}p`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h${minutes}p`;
  };

  return (
    <div className="space-y-4">
      {/* Chapters */}
      {chapters.map((chapter, chapterIndex) => {
        const isExpanded = expandedChapters.has(chapter.id);
        const totalUnits = getTotalUnits(chapter);
        const completedUnitsCount = getCompletedUnitsInChapter(chapter);

        return (
          <div key={chapter.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Chapter Header */}
            <button
              onClick={() => toggleChapter(chapter.id)}
              className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-semibold text-sm">
                      {chapterIndex + 1}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{chapter.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{chapter.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {completedUnitsCount}/{totalUnits} bài học
                  </div>
                  {isEnrolled && (
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(completedUnitsCount / totalUnits) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* Chapter Content */}
            {isExpanded && (
              <div className="border-t border-gray-200">
                <UnitList
                  chapter={chapter}
                  isEnrolled={isEnrolled}
                  completedUnits={completedUnits}
                  onUnitClick={onUnitClick}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Course Level Exams */}
      {courseExams.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => setExpandedExams(!expandedExams)}
            className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {expandedExams ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Bài kiểm tra khóa học</h3>
                  <p className="text-gray-600 text-sm mt-1">Các bài kiểm tra tổng hợp kiến thức toàn khóa</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {courseExams.length} bài kiểm tra
              </div>
            </div>
          </button>

          {expandedExams && (
            <div className="border-t border-gray-200 p-4 space-y-3">
              {courseExams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{exam.title}</h4>
                      <p className="text-sm text-gray-600">{exam.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {formatDuration(exam.duration)}
                    </div>
                    <button
                      onClick={() => onExamClick(exam.id)}
                      disabled={!isEnrolled}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      {isEnrolled ? "Làm bài" : "Đăng ký để làm bài"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
