import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Plus,
  MessageSquare,
  Trash2,
  MoreHorizontal,
  Search,
  Menu,
  X,
  Edit2,
  ChevronDown,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ScrollArea } from "../components/ui/ScrollArea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/DropdownMenu";
import { useAuth } from "../hooks/useAuth";
import { chatbotService, getCurrentUserId, type ChatSession } from "../services/chatbotService";
import type { FloatingChatSession, AISessionType, FloatingMessage } from "../types/floatingChat";

const AI_SESSION_TYPES: Array<{ id: AISessionType; name: string; description: string }> = [
  { id: 'qna', name: 'Trợ lý', description: 'Trả lời câu hỏi chung' },
  { id: 'planner', name: 'Lộ trình học', description: 'Hỗ trợ lập kế hoạch học tập' },
  { id: 'reviewer', name: 'Đánh giá', description: 'Hỗ trợ ôn tập kiến thức' },
  { id: 'learning', name: 'Hướng dẫn học tập', description: 'Hướng dẫn học tập' }
];

const initialMessage: FloatingMessage = {
  id: "1",
  content:
    "Xin chào! Tôi là AI Assistant của trung tâm tiếng Nhật. Tôi có thể giúp bạn tìm hiểu về các khóa học, lịch học, và trả lời mọi câu hỏi về việc học tiếng Nhật. Bạn cần hỗ trợ gì hôm nay? 🇯🇵",
  role: "assistant",
  timestamp: new Date(),
};

const TypingIndicator = () => (
  <div className="flex items-center gap-2">
    <Loader2 className="h-4 w-4 animate-spin text-red-600" />
    <span className="text-sm text-red-600">Đang trả lời...</span>
  </div>
);

function ChatbotPage() {
  const { user } = useAuth();
  const [chatSessions, setChatSessions] = useState<FloatingChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSessionType, setCurrentSessionType] = useState<AISessionType>('qna');
  const [showSessionTypeDropdown, setShowSessionTypeDropdown] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreatingNewSession, setIsCreatingNewSession] = useState(false);
  const [isAiOnline, setIsAiOnline] = useState(true); // Track AI service status

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasLoadedSessionsRef = useRef(false);
  const currentUserIdRef = useRef(getCurrentUserId());

  const currentChat = chatSessions.find((chat) => chat.id === currentChatId);
  const currentMessages = useMemo(() => currentChat?.messages || [], [currentChat?.messages]);
  const currentUserId = getCurrentUserId();

  const filteredChatSessions = chatSessions.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const scrollToBottom = useCallback(() => {
    // Scroll within the messages container, not the entire page
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
      console.log('� [ChatbotPage] Scrolled messages container to bottom');
    } else if (messagesEndRef.current) {
      // Fallback to scrollIntoView but only within the scroll container
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end",
        inline: "nearest"
      });
      console.log('📜 [ChatbotPage] Used scrollIntoView fallback');
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, scrollToBottom]);

  const convertToFloatingSession = (apiSession: ChatSession): FloatingChatSession => {
    const getSessionType = (apiType: string): AISessionType => {
      switch (apiType.toUpperCase()) {
        case 'QNA': return 'qna';
        case 'REVIEWER': return 'reviewer';  
        case 'PLANNER': return 'planner';
        case 'LEARNING': return 'learning';
        default: return 'qna';
      }
    };

    return {
      id: apiSession.id,
      name: apiSession.session_name,
      lastMessage: 'Phiên chat đã tạo',
      timestamp: new Date(apiSession.updated_at),
      sessionType: getSessionType(apiSession.type),
      messages: [],
      isTemporary: false
    };
  };

  const loadSessionMessages = useCallback(async (sessionId: number) => {
    try {
      const messages = await chatbotService.getMessages(sessionId.toString());
      
      const floatingMessages: FloatingMessage[] = messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.timestamp)
      }));

      setChatSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, messages: floatingMessages } : s
      ));

      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('Error loading session messages:', error);
    }
  }, [scrollToBottom]);

  const loadSessions = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      setIsLoadingSessions(true);
      setIsAiOnline(true); // Assume online until error occurs
      const apiSessions = await chatbotService.getSessions(currentUserId);
      const floatingSessions = apiSessions.map(convertToFloatingSession);
      setChatSessions(floatingSessions);
      hasLoadedSessionsRef.current = true;
      
      if (!currentChatId && !isCreatingNewSession && floatingSessions.length > 0) {
        setCurrentChatId(floatingSessions[0].id);
        loadSessionMessages(floatingSessions[0].id);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      // Check if it's a network error indicating AI service is down
      if (error instanceof Error && (
        error.message.includes('Network Error') || 
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('fetch')
      )) {
        setIsAiOnline(false);
      }
    } finally {
      setIsLoadingSessions(false);
    }
  }, [currentUserId, currentChatId, isCreatingNewSession, loadSessionMessages]);

  useEffect(() => {
    if (!hasLoadedSessionsRef.current) {
      loadSessions();
    }
  }, [loadSessions]);

  useEffect(() => {
    const newUserId = getCurrentUserId();
    if (currentUserIdRef.current !== newUserId) {
      currentUserIdRef.current = newUserId;
      hasLoadedSessionsRef.current = false;
      setChatSessions([]);
      setCurrentChatId(null);
      loadSessions();
    }
  }, [loadSessions]);

  const createNewChat = () => {
    setCurrentChatId(null);
    setInputValue('');
    setIsCreatingNewSession(true);
  };

    const handleDeleteSession = async (session: FloatingChatSession) => {
    await chatbotService.deleteSession(session.id);
    // Refresh sessions list after deletion
    loadSessions();
  };

  const handleRenameSession = async (sessionId: number, newName: string) => {
    try {
      const originalSessions = [...chatSessions];
      
      const updatedSessions = chatSessions.map(s => 
        s.id === sessionId ? { ...s, name: newName } : s
      );
      setChatSessions(updatedSessions);
      
      chatbotService.updateSessionName(sessionId, newName)
        .catch((error: unknown) => {
          console.error('Background rename failed, reverting optimistic update:', error);
          setChatSessions(originalSessions);
        });
    } catch (error) {
      console.error('Error in handleRenameSession:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const currentInput = content.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      if (!currentChatId || isCreatingNewSession) {
        const tempSessionId = Date.now();
        
        const userMessage: FloatingMessage = {
          id: 'temp-user-' + Date.now(),
          content: currentInput,
          role: 'user',
          timestamp: new Date()
        };

        const typingMessage: FloatingMessage = {
          id: 'temp-typing-' + Date.now(),
          content: '',
          role: 'assistant',
          timestamp: new Date(),
          isTyping: true
        };

        const tempSessionForUI: FloatingChatSession = {
          id: tempSessionId,
          name: 'Đang tạo phiên...',
          sessionType: currentSessionType,
          messages: [userMessage, typingMessage],
          lastMessage: 'AI đang trả lời...',
          timestamp: new Date()
        };

        setChatSessions(prev => [tempSessionForUI, ...prev]);
        setCurrentChatId(tempSessionId);
        setIsCreatingNewSession(false);
        
        const context: Record<string, number | string> = {};
        const currentPath = window.location.pathname;
        
        if (currentSessionType === 'reviewer') {
          const examResultRegex = /\/exam-result\/(\d+)/;
          const examResultMatch = examResultRegex.exec(currentPath);
          if (examResultMatch) {
            const examResultId = parseInt(examResultMatch[1]);
            context.exam_result_id = examResultId;
          }
        }

        if (!currentUserId) {
          console.error('No user ID available for creating session');
          return;
        }

        const createSessionRequest = {
          user_id: currentUserId,
          session_type: currentSessionType,
          first_message: currentInput,
          context
        };
        
        const newSession = await chatbotService.createSession(createSessionRequest);

        const realUserMessage: FloatingMessage = {
          id: 'user-' + Date.now(),
          content: currentInput,
          role: 'user',
          timestamp: new Date()
        };

        const realAiMessage: FloatingMessage = {
          id: 'ai-' + Date.now(),
          content: newSession.ai_first_response,
          role: 'assistant',
          timestamp: new Date()
        };

        const realSessionForUI: FloatingChatSession = {
          id: newSession.session_id,
          name: newSession.session_name,
          sessionType: currentSessionType,
          messages: [realUserMessage, realAiMessage],
          lastMessage: newSession.ai_first_response.substring(0, 50) + '...',
          timestamp: new Date()
        };

        setChatSessions(prev => prev.map(s => 
          s.id === tempSessionId ? realSessionForUI : s
        ));
        setCurrentChatId(newSession.session_id);
        
      } else {
        const userMessage: FloatingMessage = {
          id: 'temp-user-' + Date.now(),
          content: currentInput,
          role: 'user',
          timestamp: new Date()
        };

        const typingMessage: FloatingMessage = {
          id: 'temp-typing-' + Date.now(),
          content: '',
          role: 'assistant',
          timestamp: new Date(),
          isTyping: true
        };

        setChatSessions(prev => prev.map(s => 
          s.id === currentChatId 
            ? { 
                ...s, 
                messages: [...s.messages, userMessage, typingMessage],
                lastMessage: 'AI đang trả lời...',
                timestamp: new Date()
              }
            : s
        ));
        
        const sendMessageRequest = {
          session_id: currentChatId,
          user_input: currentInput
        };
        
        const response = await chatbotService.sendMessage(sendMessageRequest);

        const realUserMessage: FloatingMessage = {
          id: response.human_message_id.toString(),
          content: currentInput,
          role: 'user',
          timestamp: new Date()
        };

        const realAiMessage: FloatingMessage = {
          id: response.ai_message_id.toString(),
          content: response.ai_response,
          role: 'assistant',
          timestamp: new Date()
        };

        setChatSessions(prev => prev.map(s => 
          s.id === currentChatId 
            ? { 
                ...s, 
                messages: [...s.messages.slice(0, -2), realUserMessage, realAiMessage],
                lastMessage: response.ai_response.substring(0, 50) + '...',
                timestamp: new Date()
              }
            : s
        ));
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      // Check if it's a network error indicating AI service is down
      if (error instanceof Error && (
        error.message.includes('Network Error') || 
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('fetch')
      )) {
        setIsAiOnline(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const handleSessionClick = (sessionId: number) => {
    setCurrentChatId(sessionId);
    const session = chatSessions.find(s => s.id === sessionId);
    
    if (session && session.messages.length === 0) {
      loadSessionMessages(sessionId);
    }
    
    if (session) {
      setCurrentSessionType(session.sessionType);
    }
  };

  const handleStartEdit = (session: FloatingChatSession) => {
    setEditingId(session.id);
    setEditName(session.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      handleRenameSession(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const getCurrentSessionTypeName = () => {
    const sessionType = AI_SESSION_TYPES.find(type => type.id === currentSessionType);
    return sessionType?.name || 'Trợ lý';
  };

  const handleSessionTypeChange = (sessionType: AISessionType) => {
    setCurrentSessionType(sessionType);
    
    if (currentChat?.isTemporary) {
      setChatSessions(chatSessions.map(s => 
        s.id === currentChatId ? { ...s, sessionType } : s
      ));
    }
    
    setShowSessionTypeDropdown(false);
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Vui lòng đăng nhập để sử dụng tính năng này
          </h2>
          <p className="text-gray-600">
            Bạn cần đăng nhập để có thể chat với AI Assistant
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 border-r border-gray-200 flex flex-col overflow-hidden bg-gray-50`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Lịch sử chat</h2>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Button 
            onClick={createNewChat} 
            disabled={!isAiOnline}
            className={`w-full mb-4 py-2.5 rounded-lg font-medium shadow-sm ${
              isAiOnline 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isAiOnline ? 'Tạo đoạn chat mới' : 'AI không khả dụng'}
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-2.5 rounded-lg border-gray-300 focus:border-red-500 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Chat Sessions List */}
        <div className="flex-1 overflow-hidden min-h-0">
          <ScrollArea className="h-full">
            <div className="p-3">
              {isLoadingSessions && (
                <div className="p-3 text-center text-sm text-gray-500">
                  Đang tải phiên chat...
                </div>
              )}
              {!isLoadingSessions && !isAiOnline && (
                <div className="p-3 text-center text-sm text-gray-500">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <p className="text-red-800 font-medium">AI không khả dụng</p>
                    <p className="text-red-600 text-xs mt-1">Không thể tải danh sách phiên chat</p>
                  </div>
                </div>
              )}
              {!isLoadingSessions && isAiOnline && filteredChatSessions.length === 0 && (
                <div className="p-3 text-center text-sm text-gray-500">
                  Chưa có phiên chat nào
                </div>
              )}
              {!isLoadingSessions && isAiOnline && filteredChatSessions.map((chat) => (
              <button
                key={chat.id}
                className={`w-full text-left p-2 rounded-md cursor-pointer mb-1 group hover:bg-gray-50 transition-colors ${
                  currentChatId === chat.id ? "bg-red-50 border border-red-200" : ""
                }`}
                onClick={() => handleSessionClick(chat.id)}
                aria-label={`Select chat session: ${chat.name}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      {editingId === chat.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="w-full px-2 py-1 text-sm font-medium border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h3 className="text-sm font-medium text-gray-900 truncate">{chat.name}</h3>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-1">{chat.lastMessage}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {AI_SESSION_TYPES.find(type => type.id === chat.sessionType)?.name || 'Trợ lý'}
                      </span>
                      <span className="text-xs text-gray-400">{formatTime(chat.timestamp)}</span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem 
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleStartEdit(chat);
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Sửa tên
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleDeleteSession(chat);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </button>
            ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chat Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-gray-900">AI Assistant</h1>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <div className={`w-2 h-2 rounded-full ${isAiOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>{isAiOnline ? 'Đang hoạt động' : 'Không hoạt động'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Session Type Selector */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSessionTypeDropdown(!showSessionTypeDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg transition-all duration-200"
                >
                  <span className="font-medium text-sm">{getCurrentSessionTypeName()}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showSessionTypeDropdown ? 'rotate-180' : ''}`} />
                </Button>

                {showSessionTypeDropdown && (
                  <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-64 overflow-hidden">
                    {AI_SESSION_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleSessionTypeChange(type.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-red-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                          currentSessionType === type.id ? 'bg-red-50 text-red-800 border-red-100' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${currentSessionType === type.id ? 'bg-red-600' : 'bg-gray-300'}`}></div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{type.name}</div>
                            <div className="text-xs text-gray-500 mt-1 leading-relaxed">{type.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <ScrollArea className="flex-1 h-full" ref={messagesScrollRef}>
            <div className="p-4 space-y-4 min-h-full pb-4">
              {!isAiOnline && (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center mx-auto mb-4">
                      <Bot className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Assistant hiện không khả dụng</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                      Dịch vụ AI hiện đang gặp sự cố hoặc đang bảo trì. 
                      Vui lòng thử lại sau hoặc liên hệ với bộ phận hỗ trợ nếu vấn đề vẫn tiếp diễn.
                    </p>
                    <Button 
                      onClick={loadSessions}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
                      disabled={isLoadingSessions}
                    >
                      {isLoadingSessions ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Đang thử lại...
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5 mr-2" />
                          Thử lại kết nối
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {isAiOnline && currentMessages.length === 0 && !isCreatingNewSession && (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mx-auto mb-4">
                      <Bot className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Chào mừng bạn đến với AI Assistant!</h3>
                    <p className="text-gray-600 mb-4 max-w-md mx-auto leading-relaxed">{initialMessage.content}</p>
                    <Button 
                      onClick={createNewChat}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Bắt đầu cuộc trò chuyện
                    </Button>
                  </div>
                </div>
              )}
              
              {currentMessages.map((message: FloatingMessage) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                      message.role === "user" 
                        ? "bg-red-600 text-white" 
                        : "bg-white border border-gray-200 text-gray-900"
                    }`}
                  >
                    {message.isTyping ? (
                      <TypingIndicator />
                    ) : (
                      <>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-2 ${message.role === "user" ? "text-red-100" : "text-gray-500"}`}>
                          {message.timestamp.toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </>
                    )}
                  </div>

                  {message.role === "user" && (
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4 shadow-lg">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={isAiOnline ? "Nhập tin nhắn của bạn..." : "AI đang không khả dụng..."}
                disabled={isLoading || !isAiOnline}
                className={`pr-12 py-3 text-base rounded-xl border-gray-300 focus:border-red-500 focus:ring-red-500 shadow-sm ${
                  !isAiOnline ? 'bg-gray-100 text-gray-500' : ''
                }`}
              />
              <Button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isLoading || !isAiOnline}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 hover:bg-red-700 rounded-lg h-8 w-8 p-0 shadow-sm disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {isAiOnline ? 
              "AI có thể mắc lỗi. Vui lòng kiểm tra thông tin quan trọng." :
              "Dịch vụ AI hiện không khả dụng. Vui lòng thử lại sau."
            }
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatbotPage;
