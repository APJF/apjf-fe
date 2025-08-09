import { useState } from "react"
import { StaffNavigation } from "../../components/layout/StaffNavigation"
import { Card, CardContent, CardHeader } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import {
  Users,
  Star,
  Filter,
  Search,
  Reply,
  Calendar,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  TrendingUp,
  AlertCircle
} from "lucide-react"

interface StudentFeedback {
  id: string
  studentName: string
  studentAvatar?: string
  course: string
  lesson?: string
  rating: number
  type: "positive" | "negative" | "suggestion" | "question"
  subject: string
  message: string
  createdAt: string
  isResolved: boolean
  hasResponse: boolean
  upvotes: number
}

const FeedbackCard = ({ feedback }: { feedback: StudentFeedback }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "positive": return <ThumbsUp className="h-5 w-5 text-green-600" />
      case "negative": return <ThumbsDown className="h-5 w-5 text-red-600" />
      case "suggestion": return <MessageCircle className="h-5 w-5 text-blue-600" />
      case "question": return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default: return <MessageCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "positive": return "bg-green-100 text-green-800"
      case "negative": return "bg-red-100 text-red-800"
      case "suggestion": return "bg-blue-100 text-blue-800"
      case "question": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case "positive": return "Tích cực"
      case "negative": return "Tiêu cực"
      case "suggestion": return "Đề xuất"
      case "question": return "Câu hỏi"
      default: return "Khác"
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ))
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {feedback.studentAvatar ? (
                <img
                  src={feedback.studentAvatar}
                  alt={feedback.studentName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                feedback.studentName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{feedback.studentName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  {renderStars(feedback.rating)}
                </div>
                <span className="text-sm text-gray-500">({feedback.rating}/5)</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              {getTypeIcon(feedback.type)}
              <Badge className={getTypeColor(feedback.type)}>
                {getTypeName(feedback.type)}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              {feedback.createdAt}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">{feedback.subject}</h4>
            <div className="text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span className="font-medium">Khóa học:</span> {feedback.course}
                {feedback.lesson && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="font-medium">Bài học:</span> {feedback.lesson}
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 text-sm leading-relaxed">{feedback.message}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <TrendingUp className="h-4 w-4" />
                <span>{feedback.upvotes} upvotes</span>
              </div>
              <div className="flex items-center gap-2">
                {feedback.isResolved && (
                  <Badge className="bg-green-100 text-green-800">Đã giải quyết</Badge>
                )}
                {feedback.hasResponse && (
                  <Badge className="bg-blue-100 text-blue-800">Đã phản hồi</Badge>
                )}
              </div>
            </div>
            <Button size="sm" className="flex items-center gap-1">
              <Reply className="h-4 w-4" />
              Phản hồi
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function StaffStudentFeedbackPage() {
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const mockFeedback: StudentFeedback[] = [
    {
      id: "1",
      studentName: "Nguyễn Văn An",
      course: "N5 - Tiếng Nhật Cơ Bản",
      lesson: "Bài 3: Giới thiệu bản thân",
      rating: 5,
      type: "positive",
      subject: "Bài học rất hay!",
      message: "Cảm ơn sensei đã tạo ra bài học này. Mình học được rất nhiều cách giới thiệu bản thân tự nhiên. Video pronunciation rất rõ ràng và dễ hiểu. Hy vọng sẽ có thêm nhiều bài như thế này!",
      createdAt: "2 giờ trước",
      isResolved: false,
      hasResponse: false,
      upvotes: 12
    },
    {
      id: "2",
      studentName: "Trần Thị Minh",
      course: "N4 - Tiếng Nhật Sơ Cấp",
      lesson: "Bài 8: Ngữ pháp ~てから",
      rating: 3,
      type: "suggestion",
      subject: "Đề xuất thêm ví dụ",
      message: "Bài học về ngữ pháp ~てから khá khó hiểu. Em nghĩ nên thêm nhiều ví dụ thực tế hơn, đặc biệt là trong các tình huống hàng ngày. Có thể tạo thêm bài tập interactive để practice?",
      createdAt: "5 giờ trước",
      isResolved: false,
      hasResponse: true,
      upvotes: 8
    },
    {
      id: "3",
      studentName: "Lê Minh Đức",
      course: "Kanji cho Người Mới Bắt Đầu",
      rating: 2,
      type: "negative",
      subject: "Kanji học quá nhanh",
      message: "Tốc độ học Kanji trong khóa này hơi nhanh với mình. Mỗi lesson có quá nhiều Kanji mới (15-20 chữ) mà không có đủ thời gian để practice. Mình dễ bị overwhelmed và quên mất những chữ đã học trước đó.",
      createdAt: "1 ngày trước",
      isResolved: true,
      hasResponse: true,
      upvotes: 15
    },
    {
      id: "4",
      studentName: "Phạm Thị Hương",
      course: "N3 - Tiếng Nhật Trung Cấp",
      lesson: "Bài 12: Honorific Language",
      rating: 4,
      type: "question",
      subject: "Khi nào dùng Keigo?",
      message: "Em có thắc mắc về việc sử dụng Keigo trong thực tế. Trong bài học có nhiều form khác nhau nhưng em chưa rõ khi nào dùng form nào cho phù hợp. Có thể làm thêm video về cultural context không ạ?",
      createdAt: "2 ngày trước",
      isResolved: false,
      hasResponse: false,
      upvotes: 6
    },
    {
      id: "5",
      studentName: "Võ Thanh Tùng",
      course: "Văn Hóa Nhật Bản",
      lesson: "Bài 5: Tea Ceremony",
      rating: 5,
      type: "positive",
      subject: "Tuyệt vời!",
      message: "Bài học về tea ceremony thật sự rất thú vị! Mình được hiểu nhiều hơn về văn hóa truyền thống Nhật Bản. Hình ảnh đẹp, giải thích rõ ràng. Mong sensei làm thêm series về các traditional arts khác!",
      createdAt: "3 ngày trước",
      isResolved: false,
      hasResponse: true,
      upvotes: 23
    },
    {
      id: "6",
      studentName: "Đỗ Thị Lan",
      course: "N4 - Tiếng Nhật Sơ Cấp",
      rating: 4,
      type: "suggestion",
      subject: "Thêm quiz interactive",
      message: "Khóa học rất hay nhưng em nghĩ nên thêm các quiz tương tác sau mỗi bài để kiểm tra hiểu biết. Hiện tại chỉ có text và video, thiếu phần practice. Mobile app cũng nên được cải thiện hơn.",
      createdAt: "1 tuần trước",
      isResolved: false,
      hasResponse: false,
      upvotes: 11
    }
  ]

  const filteredFeedback = mockFeedback.filter(feedback => {
    if (selectedFilter !== "all" && feedback.type !== selectedFilter) return false
    if (searchQuery && !feedback.subject.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !feedback.course.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !feedback.studentName.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const stats = {
    total: mockFeedback.length,
    avgRating: (mockFeedback.reduce((sum, f) => sum + f.rating, 0) / mockFeedback.length).toFixed(1),
    unresolved: mockFeedback.filter(f => !f.isResolved).length,
    positive: mockFeedback.filter(f => f.type === "positive").length,
    needsResponse: mockFeedback.filter(f => !f.hasResponse).length
  }

  return (
    <StaffNavigation>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Student's Feedback
            </h1>
            <p className="text-gray-600">
              Theo dõi và phản hồi feedback từ học viên về chất lượng khóa học
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Tổng feedback</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                  <Star className="h-5 w-5 fill-current" />
                  {stats.avgRating}
                </div>
                <div className="text-sm text-gray-600">Đánh giá TB</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
                <div className="text-sm text-gray-600">Tích cực</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.needsResponse}</div>
                <div className="text-sm text-gray-600">Cần phản hồi</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.unresolved}</div>
                <div className="text-sm text-gray-600">Chưa giải quyết</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tiêu đề, khóa học hoặc tên học viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Lọc nâng cao
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "Tất cả", count: stats.total },
                { key: "positive", label: "Tích cực", count: mockFeedback.filter(f => f.type === "positive").length },
                { key: "negative", label: "Tiêu cực", count: mockFeedback.filter(f => f.type === "negative").length },
                { key: "suggestion", label: "Đề xuất", count: mockFeedback.filter(f => f.type === "suggestion").length },
                { key: "question", label: "Câu hỏi", count: mockFeedback.filter(f => f.type === "question").length },
              ].map(filter => (
                <Button
                  key={filter.key}
                  variant={selectedFilter === filter.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter.key)}
                >
                  {filter.label} ({filter.count})
                </Button>
              ))}
            </div>
          </div>

          {/* Feedback List */}
          <div className="space-y-6">
            {filteredFeedback.length > 0 ? (
              filteredFeedback.map((feedback) => (
                <FeedbackCard key={feedback.id} feedback={feedback} />
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không có feedback nào
                </h3>
                <p className="text-gray-600">
                  {searchQuery || selectedFilter !== "all" 
                    ? "Không tìm thấy feedback phù hợp với bộ lọc"
                    : "Chưa có feedback từ học viên"
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </StaffNavigation>
  )
}
