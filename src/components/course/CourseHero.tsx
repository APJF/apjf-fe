import React from 'react';
import { Clock, BookOpen, Star, Users, Award, Play } from "lucide-react";
import type { Course, Topic } from '../../types/course';

interface CourseHeroProps {
  course: Course;
  isEnrolled?: boolean;
  onEnroll: () => void;
  onStartLearning: () => void;
}

export const CourseHero: React.FC<CourseHeroProps> = ({ 
  course, 
  isEnrolled = false, 
  onEnroll, 
  onStartLearning 
}) => {
  const getLevelColor = (level: string) => {
    // Using unified red theme for all levels
    switch (level) {
      case "N5":
        return "bg-red-50 text-red-900 border-red-100";
      case "N4":
        return "bg-red-50 text-red-800 border-red-200";
      case "N3":
        return "bg-red-100 text-red-700 border-red-300";
      case "N2":
        return "bg-red-200 text-red-600 border-red-400";
      case "N1":
        return "bg-red-300 text-red-900 border-red-500";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);
    if (hours === 0) return `${minutes} phút`;
    if (minutes === 0) return `${hours} giờ`;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Course Image */}
          <div className="lg:col-span-1">
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
              {course.image ? (
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-80" />
                    <div className="text-2xl font-bold opacity-60">日本語</div>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-black/20" />
              {!isEnrolled && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={onStartLearning}
                    className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <Play className="w-8 h-8 ml-1" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Course Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Level Badge */}
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getLevelColor(course.level)}`}>
                {course.level}
              </span>
              <div className="flex items-center gap-1 text-red-100">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">4.8 (2,847 đánh giá)</span>
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-3">{course.title}</h1>
              <p className="text-red-100 text-lg leading-relaxed">{course.description}</p>
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-200" />
                <div>
                  <div className="text-sm text-red-200">Thời lượng</div>
                  <div className="font-semibold">{formatDuration(course.duration)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-red-200" />
                <div>
                  <div className="text-sm text-red-200">Học viên</div>
                  <div className="font-semibold">12,543</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-red-200" />
                <div>
                  <div className="text-sm text-red-200">Chứng chỉ</div>
                  <div className="font-semibold">Có</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-red-200" />
                <div>
                  <div className="text-sm text-red-200">Cấp độ</div>
                  <div className="font-semibold">Cơ bản</div>
                </div>
              </div>
            </div>

            {/* Topics */}
            <div className="flex flex-wrap gap-2">
              {course.topics.map((topic: Topic) => (
                <span
                  key={topic.id}
                  className="px-3 py-1 bg-white/10 backdrop-blur-sm text-white text-sm rounded-full border border-white/20"
                >
                  {topic.name}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {isEnrolled ? (
                <button
                  onClick={onStartLearning}
                  className="px-8 py-3 bg-white text-red-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Tiếp tục học
                </button>
              ) : (
                <button
                  onClick={onEnroll}
                  className="px-8 py-3 bg-white text-red-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Đăng ký học ngay
                </button>
              )}
              <button className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
                Xem trước miễn phí
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
