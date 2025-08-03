import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Alert } from "../components/ui/Alert";
import { roadmapService } from "../services/roadmapService";
import {
  BookOpen,
  Clock,
  Play,
  MessageCircle,
  Send,
  Bot,
  Target,
  Calendar,
  ArrowLeft,
  Edit,
  Eye,
  Award,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface LearningModule {
  id: number;
  title: string;
  description: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  progress: number;
  totalLessons: number;
  completedLessons: number;
  estimatedTime: string;
  difficulty: "Cơ bản" | "Trung bình" | "Nâng cao";
  status: "not_started" | "in_progress" | "completed";
  skills: string[];
  rating: number;
  reviews: number;
}

interface ChatMessage {
  id: number;
  type: "user" | "ai";
  content: string;
  timestamp: string;
}

const learningModules: LearningModule[] = [
  {
    id: 1,
    title: "Lộ trình JLPT N5 - Cơ bản",
    description: "Lộ trình học từng bước từ cơ bản đến nâng cao. Hiragana, Katakana và ngữ pháp cơ bản",
    level: "N5",
    progress: 11,
    totalLessons: 45,
    completedLessons: 5,
    estimatedTime: "3 tháng",
    difficulty: "Cơ bản",
    status: "in_progress",
    skills: ["Hiragana", "Katakana", "Từ vựng cơ bản", "Ngữ pháp N5"],
    rating: 4.8,
    reviews: 1250,
  },
  {
    id: 2,
    title: "Tiếng Nhật Giao tiếp Cơ bản",
    description: "Luyện tập giao tiếp hàng ngày và các tình huống thực tế trong cuộc sống",
    level: "N5",
    progress: 85,
    totalLessons: 30,
    completedLessons: 25,
    estimatedTime: "2 tháng",
    difficulty: "Cơ bản",
    status: "in_progress",
    skills: ["Giao tiếp", "Phát âm", "Nghe hiểu", "Hội thoại"],
    rating: 4.7,
    reviews: 890,
  },
  {
    id: 3,
    title: "Lộ trình JLPT N3 - Nâng cao",
    description: "Nâng cao kỹ năng đọc hiểu và ngữ pháp phức tạp hơn, kanji nâng cao",
    level: "N3",
    progress: 23,
    totalLessons: 60,
    completedLessons: 14,
    estimatedTime: "4 tháng",
    difficulty: "Nâng cao",
    status: "in_progress",
    skills: ["Kanji nâng cao", "Ngữ pháp N3", "Đọc hiểu", "Từ vựng chuyên ngành"],
    rating: 4.6,
    reviews: 650,
  },
  {
    id: 4,
    title: "Lộ trình JLPT N2 - Chuyên sâu",
    description: "Ôn luyện chuyên sâu cho kỳ thi JLPT N2, tập trung vào kỹ năng nghe và đọc hiểu.",
    level: "N2",
    progress: 60,
    totalLessons: 50,
    completedLessons: 30,
    estimatedTime: "3 tháng",
    difficulty: "Nâng cao",
    status: "in_progress",
    skills: ["Nghe hiểu", "Đọc hiểu", "Ngữ pháp N2"],
    rating: 4.9,
    reviews: 980,
  },
  {
    id: 5,
    title: "Lộ trình Kanji Master",
    description: "Chinh phục 1000 Kanji thông dụng nhất trong tiếng Nhật, phù hợp cho mọi trình độ.",
    level: "N3",
    progress: 40,
    totalLessons: 100,
    completedLessons: 40,
    estimatedTime: "5 tháng",
    difficulty: "Trung bình",
    status: "in_progress",
    skills: ["Kanji", "Từ vựng", "Viết chữ"],
    rating: 4.5,
    reviews: 720,
  },
  {
    id: 6,
    title: "Lộ trình Giao tiếp nâng cao",
    description: "Luyện tập giao tiếp nâng cao, phản xạ nhanh trong các tình huống thực tế và công việc.",
    level: "N2",
    progress: 75,
    totalLessons: 35,
    completedLessons: 26,
    estimatedTime: "2 tháng",
    difficulty: "Nâng cao",
    status: "in_progress",
    skills: ["Giao tiếp", "Phản xạ", "Nghe hiểu"],
    rating: 4.8,
    reviews: 810,
  },
];

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    type: "ai",
    content:
      "Chào bạn! Tôi là AI trợ giáo. Bạn có thể hỏi tôi về bất kỳ câu hỏi nào liên quan đến lộ trình học. Tôi sẽ giúp bạn lựa chọn lộ trình phù hợp và theo dõi tiến độ học tập.",
    timestamp: "9:34:50 PM",
  },
];

// Current Learning Roadmap Component
function CurrentLearningRoadmap() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);

  // Sample roadmap data with stages
  const roadmapStages = [
    {
      id: 1,
      title: "Hiragana & Katakana",
      description: "Học thuộc 46 ký tự cơ bản",
      status: "completed",
      progress: 100,
      position: { x: 15, y: 25 },
    },
    {
      id: 2,
      title: "Từ vựng N5",
      description: "800 từ vựng thiết yếu",
      status: "completed",
      progress: 100,
      position: { x: 35, y: 45 },
    },
    {
      id: 3,
      title: "Ngữ pháp cơ bản",
      description: "Các mẫu câu N5",
      status: "in_progress",
      progress: 65,
      position: { x: 55, y: 35 },
    },
    {
      id: 4,
      title: "Kanji N5",
      description: "103 chữ Kanji cơ bản",
      status: "locked",
      progress: 0,
      position: { x: 75, y: 55 },
    },
    {
      id: 5,
      title: "Luyện nghe N5",
      description: "Kỹ năng nghe hiểu",
      status: "locked",
      progress: 0,
      position: { x: 25, y: 65 },
    },
    {
      id: 6,
      title: "Đọc hiểu N5",
      description: "Đọc và hiểu văn bản",
      status: "locked",
      progress: 0,
      position: { x: 65, y: 75 },
    },
  ];

  const stagesPerPage = 4;
  const totalPages = Math.ceil(roadmapStages.length / stagesPerPage);
  const currentStages = roadmapStages.slice(currentPage * stagesPerPage, (currentPage + 1) * stagesPerPage);

  // Cố định vị trí cho 4 stages trên mỗi trang
  const fixedPositions = [
    { x: 20, y: 40 },  // Stage 1
    { x: 44, y: 54 },  // Stage 2
    { x: 72, y: 75 },  // Stage 3
    { x: 85, y: 52 },  // Stage 4
  ];

  // Gán vị trí cố định cho các stages
  const stagesWithFixedPositions = currentStages.map((stage, index) => ({
    ...stage,
    position: fixedPositions[index] || { x: 50, y: 50 }
  }));

  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-6 w-6 text-red-800" />;
      case "in_progress":
        return <Play className="h-6 w-6 text-red-600" />;
      case "locked":
        return <div className="h-6 w-6 border-2 border-gray-400 rounded-full" />;
      default:
        return null;
    }
  };

  const getStageColor = (status: string) => {
    // Using unified red theme for all stages
    switch (status) {
      case "completed":
        return "bg-red-50 border-red-500 text-red-800";
      case "in_progress":
        return "bg-red-100 border-red-600 text-red-700";
      case "locked":
        return "bg-gray-100 border-gray-300 text-gray-600";
      default:
        return "bg-gray-100 border-gray-300 text-gray-600";
    }
  };

  const getStatusTextLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Hoàn thành";
      case "in_progress":
        return "Đang học";
      case "locked":
        return "Chưa mở";
      default:
        return "Chưa mở";
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Lộ trình đang học</h2>
            <p className="text-gray-600">Lộ trình JLPT N5 - Cơ bản</p>
            <div className="flex items-center space-x-4 mt-2">
              <Badge className="bg-green-100 text-green-800">N5</Badge>
              <Badge className="bg-blue-100 text-blue-800">Đang học</Badge>
              <span className="text-sm text-gray-600">Tiến độ: 55%</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">55%</div>
            <p className="text-sm text-gray-600">Hoàn thành</p>
          </div>
        </div>

        {/* Japan Map with Stages */}
        <div className="relative">
          <div
            className="w-full h-150 bg-cover bg-center rounded-lg relative overflow-hidden"
            style={{
              backgroundImage: "url('/img/Roadmap.webp')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Overlay for better visibility */}
            {/* <div className="absolute inset-0 bg-black bg-opacity-5 rounded-lg"></div> */}

            {/* Stage markers */}
            {stagesWithFixedPositions.map((stage, index) => (
              <div
                key={stage.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{
                  left: `${stage.position.x}%`,
                  top: `${stage.position.y}%`,
                }}
              >
                {/* Connection line to next stage */}
                <div
                  className="absolute w-56 h-0.5 bg-blue-400 opacity-70"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: index === 2 || index===3 ? `rotate(-90deg)` : `rotate(90deg)`, // Stage 4 kẻ lên trên
                    transformOrigin: "0 0",
                  }}
                />

                {/* Stage marker */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-16 h-16 rounded-full border-4 ${getStageColor(stage.status)} flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform group relative`}
                  >
                    {getStageIcon(stage.status)}
                    
                    {/* Stage info tooltip - hiển thị khi hover - stage 3 sẽ hiển thị phía trên */}
                    <div className={`absolute left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-4 min-w-64 opacity-0 group-hover:opacity-100 transition-opacity z-30 border border-gray-200 pointer-events-none ${
                      stage.id === 3 ? 'bottom-20' : 'top-20'
                    }`}>
                      <div className="flex items-center space-x-2 mb-3">
                        {getStageIcon(stage.status)}
                        <span className="font-semibold text-sm text-gray-900">Chặng {stage.id}</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{stage.title}</h4>
                      <p className="text-xs text-gray-600 mb-3">{stage.description}</p>
                      {stage.status === "in_progress" && (
                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between text-xs">
                            <span>Tiến độ</span>
                            <span className="font-semibold text-blue-600">{stage.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stage.progress}%` }} />
                          </div>
                        </div>
                      )}
                      <div className={`text-xs font-medium px-2 py-1 rounded-full text-center ${getStageColor(stage.status)}`}>
                        {getStatusTextLabel(stage.status)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-4 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="bg-white"
              >
                ← Chặng trước
              </Button>

              <div className="flex items-center space-x-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      i === currentPage ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className="bg-white"
              >
                Chặng sau →
              </Button>
            </div>
          )}
        </div>

        {/* Current stage info */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          {stagesWithFixedPositions.map((stage) => (
            <div key={stage.id} className={`p-3 rounded-lg border-2 ${getStageColor(stage.status)}`}>
              <div className="flex items-center space-x-2 mb-2">
                {getStageIcon(stage.status)}
                <span className="font-semibold text-sm">Chặng {stage.id}</span>
              </div>
              <h4 className="font-medium text-sm mb-1">{stage.title}</h4>
              <p className="text-xs opacity-80">{stage.description}</p>
              {stage.status === "in_progress" && (
                <div className="mt-2">
                  <div className="w-full bg-white bg-opacity-50 rounded-full h-1.5">
                    <div className="bg-current h-1.5 rounded-full" style={{ width: `${stage.progress}%` }} />
                  </div>
                  <span className="text-xs font-medium">{stage.progress}%</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex justify-center space-x-4 mt-6">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Play className="h-4 w-4 mr-2" />
            Tiếp tục học
          </Button>
          <Button 
            variant="outline" 
            className="bg-white"
            onClick={() => navigate('/roadmap-detail/1')}
          >
            Xem chi tiết lộ trình
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function RoadmapPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [modules, setModules] = useState<LearningModule[]>(learningModules);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Color utility functions using unified red theme
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'N5': return 'bg-red-50 text-red-900';
      case 'N4': return 'bg-red-100 text-red-800';
      case 'N3': return 'bg-red-200 text-red-700';
      case 'N2': return 'bg-red-300 text-red-600';
      case 'N1': return 'bg-red-400 text-red-900';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-red-100 text-red-700';
      case 'completed': return 'bg-red-200 text-red-800';
      case 'not_started': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Load roadmap data from API
  useEffect(() => {
    loadRoadmapData();
  }, []);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    };
    scrollToBottom();
  }, [messages, typingText]);

  // Extract roadmap data loading logic
  const loadRoadmapData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('access_token');
      
      if (!user.id || !token) {
        setModules(learningModules);
        return;
      }

      const response = await roadmapService.getUserRoadmaps();
      if (response.data && response.data.length > 0) {
        setModules(response.data.map(item => ({
          ...item,
          progress: Math.round((item.completedLessons / item.totalLessons) * 100)
        })));
      } else {
        setModules(learningModules);
      }
    } catch (err) {
      console.error('Error loading roadmap data:', err);
      setError('Không thể tải dữ liệu lộ trình. Hiển thị dữ liệu mẫu.');
      setModules(learningModules);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadRoadmapData();
  };

  // Function to handle AI typing effect
  const simulateAITyping = (responseText: string, messageId: number) => {
    setIsTyping(true);
    setTypingText("");
    
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < responseText.length) {
        setTypingText(responseText.substring(0, index + 1));
        index++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        
        // Add the complete AI message
        const aiResponse: ChatMessage = {
          id: messageId,
          type: "ai",
          content: responseText,
          timestamp: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, aiResponse]);
        setTypingText("");
      }
    }, 30); // Speed of typing effect
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage: ChatMessage = {
        id: messages.length + 1,
        type: "user",
        content: inputMessage,
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };

      setMessages([...messages, newMessage]);
      setInputMessage("");

      // Simulate AI response with typing effect
      const aiResponseText = `Dựa trên câu hỏi của bạn, tôi khuyên bạn nên bắt đầu với lộ trình JLPT N5 nếu bạn là người mới học. Lộ trình này sẽ giúp bạn nắm vững các kiến thức cơ bản nhất. Bạn có muốn tôi giải thích chi tiết hơn không?`;
      
      setTimeout(() => {
        simulateAITyping(aiResponseText, messages.length + 2);
      }, 1000);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress': return 'Đang học';
      case 'completed': return 'Hoàn thành';
      case 'not_started': return 'Chưa bắt đầu';
      default: return status;
    }
  };

  const calculateDeadline = (estimatedTime: string) => {
    const startDate = new Date(2025, 5, 1); // tháng 6 (0-based)
    const months = parseInt(estimatedTime);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + (isNaN(months) ? 3 : months));
    return endDate.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const filteredModules = modules
    .filter((m: LearningModule) =>
      (filterStatus === "all" || m.status === filterStatus) &&
      (search === "" || m.title.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a: LearningModule, b: LearningModule) => 
      sortOrder === "newest" ? b.id - a.id : a.id - b.id
    );

  // Function to render a single learning module
  const renderSingleModule = (module: LearningModule) => (
    <div key={module.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex gap-6 items-stretch">
      {/* Left: Main Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-lg text-gray-900">{module.title}</span>
            <Badge className={`px-2 py-0.5 text-xs font-medium ${getLevelColor(module.level)}`}>
              {module.level}
            </Badge>
            <Badge className={`px-2 py-0.5 text-xs font-medium ${getStatusColor(module.status)}`}>
              {getStatusText(module.status)}
            </Badge>
            <button className="ml-2 p-1 rounded hover:bg-gray-100" title="Chỉnh sửa khóa học">
              <Edit className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          <div className="text-gray-600 text-sm mb-2">{module.description}</div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Tiến độ học tập - {module.completedLessons}/{module.totalLessons}</span>
            <span className="font-semibold text-blue-600">
              {Math.round((module.completedLessons/module.totalLessons)*100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 rounded-full" 
              style={{ 
                width: `${(module.completedLessons/module.totalLessons)*100}%`, 
                background: module.status === 'completed' ? '#22c55e' : '#2563eb' 
              }}
            ></div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-6 text-xs text-gray-500 mt-2">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" /> 
            <span>{module.totalLessons} bài học</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" /> 
            <span>{module.estimatedTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-1"></span> 
            <span>Truy cập lần cuối: 12/07/2025</span>
          </div>
        </div>
      </div>

      {/* Right: Card Actions & Info */}
      <div className="flex flex-col justify-between items-end min-w-[180px] text-right">
        <div className="flex gap-2 mb-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex flex-col items-center w-32">
            <Calendar className="h-4 w-4 text-red-500 mb-1" />
            <p className="text-xs font-semibold text-red-600">Hạn hoàn thành</p>
            <p className="text-xs text-red-600 mt-1">{calculateDeadline(module.estimatedTime)}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex flex-col items-center w-32">
            <Target className="h-4 w-4 text-blue-500 mb-1" />
            <p className="text-xs font-semibold text-blue-600">Mục tiêu</p>
            <p className="text-xs text-blue-600 mt-1">{module.skills.length} mốc</p>
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
            onClick={() => navigate(`/courses/${module.id}`)}
          >
            <Play className="h-3 w-3 mr-1" />
            {module.status === "not_started" ? "Bắt đầu học" : "Tiếp tục học"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-gray-600 bg-white border"
            onClick={() => navigate(`/roadmap-detail/${module.id}`)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Chi tiết
          </Button>
        </div>
      </div>
    </div>
  );

  // Render learning modules with separate function to avoid nested ternary
  const renderLearningModules = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-500" />
            <p className="text-gray-600">Đang tải lộ trình học...</p>
          </div>
        </div>
      );
    }

    if (filteredModules.length === 0) {
      return (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lộ trình học</h3>
          <p className="text-gray-600 mb-4">Bạn chưa có lộ trình học nào. Hãy tạo lộ trình đầu tiên!</p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            + Tạo lộ trình mới
          </Button>
        </div>
      );
    }

    return filteredModules.map(renderSingleModule);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="p-2 hover:bg-gray-100 text-gray-600"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-blue-600">Lộ trình học tập</h1>
                  <p className="text-gray-600 text-sm">Quản lý và theo dõi tiến độ học tập của bạn</p>
                </div>
              </div>
              <Button 
                onClick={handleRefresh}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Thử lại
              </Button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto p-6">
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <h3 className="font-semibold">Thông báo</h3>
            <p className="mt-2 text-sm">{error}</p>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-blue-600">Lộ trình học tập</h1>
                <p className="text-gray-600 text-sm">Quản lý và theo dõi tiến độ học tập của bạn</p>
              </div>
            </div>
              <div className="flex items-center gap-2">
                {/* <Button 
                  onClick={handleRefresh}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Đang tải...' : 'Làm mới'}
                </Button> */}
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  + Tạo lộ trình mới
                </Button>
              </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Main content layout with chat sidebar */}
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1 max-w-5xl">
            {/* Current Learning Roadmap */}
            <div className="mb-8">
              <CurrentLearningRoadmap />
            </div>
            
            {/* Progress Overview Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8 w-full">
              <Card className="bg-blue-600 text-white">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-blue-100 text-sm">Tổng lộ trình</p>
                      <p className="text-2xl font-bold">{modules.length}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-600 text-white">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-green-100 text-sm">Hoàn thành</p>
                      <p className="text-2xl font-bold">
                        {modules.filter(m => m.status === 'completed').length}
                      </p>
                    </div>
                    <Award className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search, Filter, Sort Controls */}
            <div className="flex flex-wrap gap-4 mb-4 items-center">
              <Input
                placeholder="Tìm kiếm lộ trình..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-64"
              />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="in_progress">Đang học</option>
                <option value="completed">Hoàn thành</option>
                <option value="not_started">Chưa bắt đầu</option>
              </select>
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
              </select>
            </div>

            {/* Learning Modules */}
            <div className="space-y-6">
              {renderLearningModules()}
            </div>
          </div>

          {/* AI Chat Sidebar */}
          <div className="w-96 sticky top-16 self-start">
            <div className="bg-white border border-gray-200 rounded-xl shadow-xl">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Trợ Giáo</h3>
                    <p className="text-xs text-gray-600">Hỗ trợ lộ trình học tập</p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30" 
                style={{ height: '500px', minHeight: '500px' }}
              >
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-xs">
                      {message.type === "ai" && (
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                            <Bot className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-xs text-gray-500 font-medium">AI Assistant</span>
                        </div>
                      )}
                      <div
                        className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                          message.type === "user"
                            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md"
                            : "bg-white text-gray-800 border border-gray-100 rounded-bl-md"
                        }`}
                      >
                        <p className="leading-relaxed">{message.content}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 px-2">{message.timestamp}</p>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-xs">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                          <Bot className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">AI Assistant</span>
                      </div>
                      <div className="px-4 py-3 rounded-2xl text-sm shadow-sm bg-white text-gray-800 border border-gray-100 rounded-bl-md">
                        <p className="leading-relaxed">
                          {typingText}
                          <span className="animate-pulse">|</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Auto scroll reference */}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
                <div className="flex space-x-3">
                  <Input
                    placeholder="Hỏi về lộ trình học..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    size="sm" 
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-200"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoadmapPage;
