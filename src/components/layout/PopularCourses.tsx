import { Clock, Users, Star } from "lucide-react"
import { Link } from "react-router-dom"

interface Course {
  id: string
  title: string
  description: string
  level: string
  duration: string
  students: number
  rating: number
  price: string
  image: string
  features: string[]
}

export function PopularCourses() {
  const courses: Course[] = [
    {
      id: "1",
      title: "Hiragana & Katakana Mastery",
      description: "Master the fundamental Japanese writing systems with interactive exercises and mnemonics.",
      level: "Beginner",
      duration: "4 weeks",
      students: 15420,
      rating: 4.9,
      price: "Free",
      image: "/img/hiragana-course.jpg",
      features: ["46 Characters Each", "Writing Practice", "Audio Pronunciation", "Memory Games"],
    },
    {
      id: "2",
      title: "Essential Kanji for Daily Life",
      description: "Learn the most important 1000 Kanji characters used in everyday Japanese communication.",
      level: "Intermediate",
      duration: "12 weeks",
      students: 8930,
      rating: 4.8,
      price: "$29/month",
      image: "/img/kanji-course.jpg",
      features: ["1000+ Kanji", "Stroke Order", "Radical System", "Context Examples"],
    },
    {
      id: "3",
      title: "Japanese Grammar Complete",
      description: "Comprehensive grammar course covering all JLPT levels from N5 to N1.",
      level: "All Levels",
      duration: "24 weeks",
      students: 12650,
      rating: 4.9,
      price: "$49/month",
      image: "/img/grammar-course.jpg",
      features: ["JLPT N5-N1", "Grammar Patterns", "Example Sentences", "Practice Tests"],
    },
  ]

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-800"
      case "Intermediate":
        return "bg-blue-100 text-blue-800"
      case "All Levels":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Khóa Học Phổ Biến</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Chọn từ các khóa học được thiết kế cẩn thận để đưa bạn từ người mới bắt đầu đến thành thạo
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="relative">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <span className={`absolute top-4 left-4 px-2 py-1 rounded-full text-xs font-medium ${getLevelBadgeColor(course.level)}`}>
                  {course.level}
                </span>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                <p className="text-gray-600 mb-4">{course.description}</p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{course.students.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{course.rating}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-sm mb-2">Bạn sẽ học được:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {course.features.map((feature) => (
                      <li key={feature} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-2xl font-bold text-red-600">{course.price}</div>
                  <button className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">
                    {course.price === "Free" ? "Bắt đầu miễn phí" : "Đăng ký ngay"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/courses"
            className="inline-block px-8 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            Xem tất cả khóa học
          </Link>
        </div>
      </div>
    </section>
  )
}
