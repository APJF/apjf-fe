import React from 'react';
import { Clock, BookOpen, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Course } from '../../types/course';

interface CourseCardProps {
  course: Course
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case "N5":
        return "bg-green-100 text-green-800"
      case "N4":
        return "bg-blue-100 text-blue-800"
      case "N3":
        return "bg-yellow-100 text-yellow-800"
      case "N2":
        return "bg-orange-100 text-orange-800"
      case "N1":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration)
    const minutes = Math.round((duration - hours) * 60)
    if (hours === 0) return `${minutes} phút`
    if (minutes === 0) return `${hours} giờ`
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Course Image */}
      <div className="relative h-48 bg-gradient-to-br from-red-500 to-red-600 overflow-hidden">
        {course.image ? (
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-white">
              <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-80" />
              <div className="text-4xl font-bold opacity-20">日本語</div>
            </div>
          </div>
        )}

        {/* Level Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getLevelColor(course.level)}`}>
            {course.level}
          </span>
        </div>

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Course Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description}</p>

        {/* Course Info */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(course.duration)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>4.8</span>
          </div>
        </div>

        {/* Topics */}
        <div className="flex flex-wrap gap-2 mb-4">
          {course.topics.map((topic) => (
            <span key={topic.id} className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-full">
              {topic.name}
            </span>
          ))}
        </div>

        {/* Action Button */}
        <Link
          to={`/courses/${course.id}`}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-center block"
        >
          Xem chi tiết
        </Link>
      </div>
    </div>
  )
};
