import { CheckCircle, Circle, Lock } from "lucide-react";
import type { Chapter } from "../../types/courseDetail";

interface LearningPathSidebarProps {
  chapters: Chapter[];
  completedChapters: string[];
  currentChapter?: string;
  isEnrolled: boolean;
}

export function LearningPathSidebar({
  chapters,
  completedChapters,
  currentChapter,
}: Readonly<Omit<LearningPathSidebarProps, 'isEnrolled'>>) {
  const getChapterStatus = (chapterId: string, index: number) => {
    if (completedChapters.includes(chapterId)) return "completed";
    if (currentChapter === chapterId) return "current";
    if (index === 0 || completedChapters.includes(chapters[index - 1]?.id)) return "available";
    return "locked";
  };

  const getIconByStatus = (status: string) => {
    if (status === "completed") {
      return <CheckCircle className="w-6 h-6 text-white" />;
    }
    if (status === "current") {
      return (
        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        </div>
      );
    }
    if (status === "available") {
      return <Circle className="w-6 h-6 text-white" />;
    }
    return <Lock className="w-6 h-6 text-white/50" />;
  };

  return (
    <div className="bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 text-white">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-xl">🗾</span><span> Lộ trình học tập</span>
        </h3>
      </div>

      {/* Learning Path Image */}
      <div className="relative px-6 pb-4">
        <div className="w-full h-64 bg-white/10 rounded-lg flex items-center justify-center">
          <span className="text-white/50 text-sm">Learning Path Image</span>
        </div>
      </div>

      {/* Chapter Progress */}
      <div className="p-6 space-y-4">
        {chapters.map((chapter, index) => {
          const status = getChapterStatus(chapter.id, index);

          return (
            <div key={chapter.id} className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {getIconByStatus(status)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium text-sm ${status === "locked" ? "text-white/50" : "text-white"}`}>
                  Chương {index + 1}
                </h4>
                <p className={`text-xs truncate ${status === "locked" ? "text-white/40" : "text-white/80"}`}>
                  {chapter.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="px-6 pb-6">
        <div className="bg-white/20 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-500"
            style={{ width: `${(completedChapters.length / chapters.length) * 100}%` }}
          />
        </div>
        <p className="text-white/80 text-xs mt-2 text-center">
          {completedChapters.length}/{chapters.length} chương hoàn thành
        </p>
      </div>
    </div>
  );
}
