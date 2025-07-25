import { Clock, BookOpen, Star, Flame } from "lucide-react";
import type { Course } from "../../types/courseDetail";

interface CourseHeaderInfoProps {
  course: Course;
  chaptersCount: number;
}

export function CourseHeaderInfo({ course, chaptersCount }: Readonly<CourseHeaderInfoProps>) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case "N5":
        return "bg-green-500 text-white";
      case "N4":
        return "bg-blue-500 text-white";
      case "N3":
        return "bg-yellow-500 text-white";
      case "N2":
        return "bg-orange-500 text-white";
      case "N1":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);
    if (hours === 0) return `${minutes} phút học`;
    if (minutes === 0) return `${hours} giờ học`;
    return `${hours} giờ ${minutes} phút học`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      {/* Badges */}
      <div className="flex items-center gap-3 mb-4">
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
          <Flame className="w-3 h-3" />
          HOT
        </span>
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getLevelColor(course.level)}`}>
          JLPT {course.level}
        </span>
        <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
          <Star className="w-3 h-3 fill-current" />
          4.8
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-3">{course.title}</h1>

      {/* Description */}
      <p className="text-gray-600 text-lg mb-6">{course.description}</p>

      {/* Course Info */}
      <div className="flex items-center gap-6 text-gray-600">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{formatDuration(course.duration)}</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          <span className="text-sm">{chaptersCount} chương</span>
        </div>
      </div>
    </div>
  );
}
