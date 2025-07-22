import { useState } from "react"
import { StaffNavigation } from "../components/layout/StaffNavigation"
import { Card, CardContent, CardHeader } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { Badge } from "../components/ui/Badge"
import {
  MessageSquare,
  ThumbsDown,
  Star,
  Filter,
  Search,
  Eye,
  Reply,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react"

interface ManagerFeedback {
  id: string
  type: "approval" | "revision" | "rejection" | "question"
  status: "new" | "read" | "responded"
  priority: "low" | "medium" | "high"
  course: string
  lesson?: string
  subject: string
  message: string
  managerName: string
  createdAt: string
  dueDate?: string
  rating?: number
}

const FeedbackCard = ({ feedback }: { feedback: ManagerFeedback }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "approval": return <CheckCircle className="h-5 w-5 text-green-600" />
      case "revision": return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "rejection": return <ThumbsDown className="h-5 w-5 text-red-600" />
      case "question": return <MessageSquare className="h-5 w-5 text-blue-600" />
      default: return <MessageSquare className="h-5 w-5 text-gray-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "approval": return "bg-green-100 text-green-800"
      case "revision": return "bg-yellow-100 text-yellow-800"
      case "rejection": return "bg-red-100 text-red-800"
      case "question": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500"
      case "medium": return "bg-yellow-500"
      case "low": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800"
      case "read": return "bg-gray-100 text-gray-800"
      case "responded": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case "approval": return "Phê duyệt"
      case "revision": return "Yêu cầu sửa đổi"
      case "rejection": return "Từ chối"
      case "question": return "Câu hỏi"
      default: return "Khác"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "new": return "Mới"
      case "read": return "Đã đọc"
      case "responded": return "Đã phản hồi"
      default: return "Không xác định"
    }
  }

  return (
    <Card className={`transition-all hover:shadow-md ${
      feedback.status === "new" ? "ring-2 ring-blue-200" : ""
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-2">
              {getTypeIcon(feedback.type)}
              <div className="flex items-center gap-2">
                <Badge className={getTypeColor(feedback.type)}>
                  {getTypeName(feedback.type)}
                </Badge>
                <Badge className={getStatusColor(feedback.status)}>
                  {getStatusText(feedback.status)}
                </Badge>
              </div>
            </div>
            <div className={`w-2 h-2 rounded-full ${getPriorityColor(feedback.priority)}`} 
                 title={`Priority: ${feedback.priority}`} />
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              {feedback.createdAt}
            </div>
            {feedback.dueDate && (
              <div className="flex items-center gap-1 text-sm text-amber-600 mt-1">
                <Clock className="h-4 w-4" />
                Due: {feedback.dueDate}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{feedback.subject}</h3>
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Khóa học:</span> {feedback.course}
              {feedback.lesson && (
                <>
                  <span className="mx-2">•</span>
                  <span className="font-medium">Bài học:</span> {feedback.lesson}
                </>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{feedback.managerName}</span>
              {feedback.rating && (
                <div className="flex items-center gap-1 ml-auto">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm">{feedback.rating}/5</span>
                </div>
              )}
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{feedback.message}</p>
          </div>

          <div className="flex gap-3">
            <Button size="sm" variant="outline" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Xem chi tiết
            </Button>
            {feedback.status !== "responded" && (
              <Button size="sm" className="flex items-center gap-1">
                <Reply className="h-4 w-4" />
                Phản hồi
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function StaffManagerFeedbackPage() {
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const mockFeedback: ManagerFeedback[] = [
    {
      id: "1",
      type: "revision",
      status: "new",
      priority: "high",
      course: "N5 - Tiếng Nhật Cơ Bản",
      lesson: "Bài 3: Giới thiệu bản thân",
      subject: "Cần bổ sung ví dụ thực tế",
      message: "Bài học này cần thêm nhiều ví dụ hội thoại thực tế hơn. Học viên phản ánh khó áp dụng vào cuộc sống hàng ngày. Đề nghị thêm 3-5 ví dụ tình huống cụ thể.",
      managerName: "Nguyễn Văn Minh",
      createdAt: "2 giờ trước",
      dueDate: "3 ngày nữa"
    },
    {
      id: "2",
      type: "approval",
      status: "read",
      priority: "medium",
      course: "N4 - Tiếng Nhật Sơ Cấp",
      lesson: "Bài 12: Kanji về thời tiết",
      subject: "Bài học được phê duyệt",
      message: "Nội dung bài học rất hay và phù hợp với trình độ N4. Cách giải thích Kanji rõ ràng, dễ hiểu. Có thể publish ngay.",
      managerName: "Trần Thị Hoa",
      createdAt: "1 ngày trước",
      rating: 5
    },
    {
      id: "3",
      type: "question",
      status: "new",
      priority: "medium",
      course: "Kanji cho Người Mới Bắt Đầu",
      subject: "Thứ tự dạy Kanji",
      message: "Bạn có nghĩ nên dạy Kanji theo thứ tự stroke count hay theo frequency of use? Tôi thấy approach hiện tại có thể gây khó khăn cho học viên.",
      managerName: "Lê Minh Đức",
      createdAt: "2 ngày trước",
      dueDate: "1 tuần nữa"
    },
    {
      id: "4",
      type: "rejection",
      status: "responded",
      priority: "high",
      course: "N3 - Tiếng Nhật Trung Cấp",
      lesson: "Bài 5: Ngữ pháp nâng cao",
      subject: "Nội dung quá khó cho N3",
      message: "Nội dung bài học này phù hợp hơn với N2. Đề nghị đơn giản hóa hoặc chuyển sang khóa học khác. Ngữ pháp quá phức tạp cho học viên N3.",
      managerName: "Phạm Văn Tuấn",
      createdAt: "1 tuần trước"
    },
    {
      id: "5",
      type: "approval",
      status: "read",
      priority: "low",
      course: "Văn Hóa Nhật Bản",
      lesson: "Bài 8: Lễ hội truyền thống",
      subject: "Nội dung hay và phong phú",
      message: "Bài học về văn hóa rất thú vị. Hình ảnh đẹp, nội dung phong phú. Học viên sẽ rất thích. Chỉ cần check lại một vài từ vựng khó.",
      managerName: "Vũ Thị Lan",
      createdAt: "3 ngày trước",
      rating: 4
    }
  ]

  const filteredFeedback = mockFeedback.filter(feedback => {
    if (selectedFilter !== "all" && feedback.type !== selectedFilter) return false
    if (searchQuery && !feedback.subject.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !feedback.course.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const stats = {
    total: mockFeedback.length,
    new: mockFeedback.filter(f => f.status === "new").length,
    pending: mockFeedback.filter(f => f.status === "new" || f.status === "read").length,
    highPriority: mockFeedback.filter(f => f.priority === "high").length
  }

  return (
    <StaffNavigation>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Manager's Feedback
            </h1>
            <p className="text-gray-600">
              Theo dõi và phản hồi feedback từ manager về nội dung khóa học
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Tổng feedback</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
                <div className="text-sm text-gray-600">Chưa đọc</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-gray-600">Cần xử lý</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
                <div className="text-sm text-gray-600">Ưu tiên cao</div>
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
                  placeholder="Tìm kiếm theo tiêu đề hoặc khóa học..."
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
                { key: "approval", label: "Phê duyệt", count: mockFeedback.filter(f => f.type === "approval").length },
                { key: "revision", label: "Yêu cầu sửa", count: mockFeedback.filter(f => f.type === "revision").length },
                { key: "question", label: "Câu hỏi", count: mockFeedback.filter(f => f.type === "question").length },
                { key: "rejection", label: "Từ chối", count: mockFeedback.filter(f => f.type === "rejection").length },
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
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không có feedback nào
                </h3>
                <p className="text-gray-600">
                  {searchQuery || selectedFilter !== "all" 
                    ? "Không tìm thấy feedback phù hợp với bộ lọc"
                    : "Chưa có feedback từ manager"
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
