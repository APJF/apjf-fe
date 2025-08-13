import React, { useState, useEffect, useCallback } from 'react';
import { X, Send, Plus, MoreVertical, Edit2, Trash2, ChevronDown, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import type { FloatingChatSession, AISessionType, FloatingMessage } from '../../types/floatingChat';
import { chatbotService, getCurrentUserId, type ChatSession } from '../../services/chatbotService';

interface FloatingChatButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Updated AI session types
const AI_SESSION_TYPES: Array<{ id: AISessionType; name: string; description: string }> = [
  { id: 'qna', name: 'Q&A Trợ lý', description: 'Trả lời câu hỏi chung' },
  { id: 'planner', name: 'Lập kế hoạch', description: 'Hỗ trợ lập kế hoạch học tập' },
  { id: 'speaking', name: 'Luyện nói', description: 'Thực hành giao tiếp tiếng Nhật' },
  { id: 'reviewer', name: 'Ôn tập', description: 'Hỗ trợ ôn tập kiến thức' },
  { id: 'learning', name: 'Học tập', description: 'Hướng dẫn học tập' }
];

export function FloatingChatButton({ isOpen, onToggle }: Readonly<FloatingChatButtonProps>) {
  const [sessions, setSessions] = useState<FloatingChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentSessionType, setCurrentSessionType] = useState<AISessionType>('qna');
  const [input, setInput] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showSessionTypeDropdown, setShowSessionTypeDropdown] = useState(false);
  const [isSessionsPanelCollapsed, setIsSessionsPanelCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const currentUserId = getCurrentUserId();

  // Convert API ChatSession to FloatingChatSession
  const convertToFloatingSession = (apiSession: ChatSession): FloatingChatSession => ({
    id: apiSession.id,
    name: apiSession.name || 'Phiên chat mới',
    lastMessage: apiSession.last_message || 'Phiên chat mới được tạo',
    timestamp: new Date(apiSession.updated_at || apiSession.created_at),
    sessionType: apiSession.session_type,
    messages: [], // Will be loaded separately when needed
    isTemporary: false
  });

  const loadSessionMessages = useCallback(async (sessionId: string) => {
    try {
      const messages = await chatbotService.getMessages(sessionId);
      const floatingMessages: FloatingMessage[] = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.timestamp)
      }));

      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, messages: floatingMessages } : s
      ));
    } catch (error) {
      console.error('Error loading session messages:', error);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const apiSessions = await chatbotService.getSessions(currentUserId);
      const floatingSessions = apiSessions.map(convertToFloatingSession);
      setSessions(floatingSessions);
      
      // Set active session to the first one if no active session
      if (!activeSessionId && floatingSessions.length > 0) {
        setActiveSessionId(floatingSessions[0].id);
        loadSessionMessages(floatingSessions[0].id);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, activeSessionId, loadSessionMessages]);

  // Load sessions when component mounts
  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen, loadSessions]);

  const toggleSessionsPanel = () => {
    setIsSessionsPanelCollapsed(!isSessionsPanelCollapsed);
  };

  const handleCreateNewSession = () => {
    // Create a temporary session immediately (like ChatGPT behavior)
    const tempSession: FloatingChatSession = {
      id: `temp_${Date.now()}`,
      name: 'Phiên chat mới',
      lastMessage: 'Bắt đầu cuộc trò chuyện...',
      timestamp: new Date(),
      sessionType: currentSessionType,
      messages: [],
      isTemporary: true
    };
    
    setSessions([tempSession, ...sessions]);
    setActiveSessionId(tempSession.id);
    setIsCreatingSession(true);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const sessionToDelete = sessions.find(s => s.id === sessionId);
      
      // If it's a temporary session, just remove from state
      if (sessionToDelete?.isTemporary) {
        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        setSessions(updatedSessions);
        
        if (activeSessionId === sessionId && updatedSessions.length > 0) {
          setActiveSessionId(updatedSessions[0].id);
        }
        return;
      }

      // Delete from API if it's a real session
      await chatbotService.deleteSession(sessionId);
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);
      
      if (activeSessionId === sessionId && updatedSessions.length > 0) {
        setActiveSessionId(updatedSessions[0].id);
        loadSessionMessages(updatedSessions[0].id);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleRenameSession = async (sessionId: string, newName: string) => {
    try {
      const sessionToUpdate = sessions.find(s => s.id === sessionId);
      
      // If it's a temporary session, just update in state
      if (sessionToUpdate?.isTemporary) {
        setSessions(sessions.map(s => 
          s.id === sessionId ? { ...s, name: newName } : s
        ));
        return;
      }

      // Update via API if it's a real session
      await chatbotService.renameSession(sessionId, newName);
      setSessions(sessions.map(s => 
        s.id === sessionId ? { ...s, name: newName } : s
      ));
    } catch (error) {
      console.error('Error renaming session:', error);
    }
  };

  const handleSessionTypeChange = (sessionType: AISessionType) => {
    setCurrentSessionType(sessionType);
    
    // If there's an active temporary session, update its type
    if (activeSession?.isTemporary) {
      setSessions(sessions.map(s => 
        s.id === activeSessionId ? { ...s, sessionType } : s
      ));
    }
    
    setShowSessionTypeDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeSession) return;

    const userMessage: FloatingMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    };

    try {
      // If this is a temporary session, create it on the server first
      if (activeSession.isTemporary && isCreatingSession) {
        console.log('Creating new session with first message...');
        
        const newSession = await chatbotService.createSession({
          user_id: currentUserId,
          session_type: currentSessionType,
          first_message: input.trim(),
          context: {}
        });

        // Update the temporary session to be a real session
        const realSession: FloatingChatSession = {
          ...activeSession,
          id: newSession.id,
          isTemporary: false,
          messages: [userMessage]
        };

        setSessions(prev => prev.map(s => 
          s.id === activeSessionId ? realSession : s
        ));
        setActiveSessionId(newSession.id);
        setIsCreatingSession(false);

        // Load messages for the new session (including AI response)
        setTimeout(() => {
          loadSessionMessages(newSession.id);
        }, 1000);
        
      } else if (!activeSession.isTemporary) {
        // Send message to existing session
        await chatbotService.sendMessage(activeSession.id, input.trim());
        
        // Add user message to UI immediately
        setSessions(sessions.map(s => 
          s.id === activeSessionId 
            ? { 
                ...s, 
                messages: [...s.messages, userMessage],
                lastMessage: input.trim(),
                timestamp: new Date()
              }
            : s
        ));

        // Load updated messages (including AI response)
        setTimeout(() => {
          loadSessionMessages(activeSession.id);
        }, 1000);
      }

      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    setActiveSessionId(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    
    // Load messages if it's not a temporary session and messages haven't been loaded
    if (session && !session.isTemporary && session.messages.length === 0) {
      loadSessionMessages(sessionId);
    }
    
    // Update current session type to match the clicked session
    if (session) {
      setCurrentSessionType(session.sessionType);
    }
  };

  const handleMenuToggle = (sessionId: string) => {
    setOpenMenuId(openMenuId === sessionId ? null : sessionId);
  };

  const handleStartEdit = (session: FloatingChatSession) => {
    setEditingId(session.id);
    setEditName(session.name);
    setOpenMenuId(null);
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
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getCurrentSessionTypeName = () => {
    const sessionType = AI_SESSION_TYPES.find(type => type.id === currentSessionType);
    return sessionType?.name || 'Q&A';
  };

  return (
    <>
      {/* Chat Popup - Xuất hiện từ icon với animation */}
      {isOpen && (
        <div className={`fixed bottom-20 right-6 bg-white border border-gray-200 rounded-lg shadow-2xl z-50 flex animate-in slide-in-from-bottom-2 slide-in-from-right-2 duration-300 transition-all ${
          isSessionsPanelCollapsed ? 'w-[480px] h-[400px]' : 'w-[800px] h-[400px]'
        }`}>
          {/* Thêm arrow pointing xuống icon */}
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
          
          {/* Sidebar - Responsive width with slide animation */}
          <div className={`bg-white border-r border-gray-200 flex flex-col rounded-l-lg transition-all duration-300 overflow-hidden ${
            isSessionsPanelCollapsed ? 'w-0 border-r-0' : 'w-2/5'
          }`}>
            {/* Header */}
            <div className="p-3 border-b border-gray-200 flex-shrink-0">
              <button
                onClick={handleCreateNewSession}
                className="w-full flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <Plus size={16} />
                Tạo mới
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && (
                <div className="p-4 text-center text-sm text-gray-500">
                  Đang tải phiên chat...
                </div>
              )}
              {!isLoading && sessions.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">
                  Chưa có phiên chat nào
                </div>
              )}
              {!isLoading && sessions.length > 0 && (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    className={`relative p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors w-full text-left ${
                      activeSessionId === session.id ? 'bg-red-50 border-l-4 border-l-red-600' : ''
                    }`}
                    onClick={() => handleSessionClick(session.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {editingId === session.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="w-full px-2 py-1 text-xs font-medium border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <h3 className="font-medium text-gray-900 truncate text-sm">
                            {session.name}
                            {session.isTemporary && (
                              <span className="ml-1 text-xs text-gray-400">(mới)</span>
                            )}
                          </h3>
                        )}
                        
                        <p className="text-xs text-gray-600 truncate mt-1">
                          {session.lastMessage}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500 truncate">
                            {AI_SESSION_TYPES.find(type => type.id === session.sessionType)?.name || 'Q&A'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(session.timestamp)}
                          </span>
                        </div>
                      </div>

                      <div className="relative ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuToggle(session.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          type="button"
                        >
                          <MoreVertical size={12} className="text-gray-500" />
                        </button>

                        {openMenuId === session.id && (
                          <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-24">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(session);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                              type="button"
                            >
                              <Edit2 size={12} />
                              Sửa
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSession(session.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                              type="button"
                            >
                              <Trash2 size={12} />
                              Xóa
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main Chat - Responsive width */}
          <div className={`flex flex-col bg-white rounded-r-lg transition-all duration-300 ${
            isSessionsPanelCollapsed ? 'w-full' : 'w-3/5'
          }`}>
            {/* Header with close button, toggle button, and function selector */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-red-600 text-white rounded-tr-lg">
              {/* Left side - Toggle button and function selector */}
              <div className="flex items-center gap-2">
                {/* Toggle Sessions Panel Button */}
                <button
                  onClick={toggleSessionsPanel}
                  className="p-1 hover:bg-red-700 rounded transition-colors"
                  title={isSessionsPanelCollapsed ? 'Mở rộng sessions' : 'Thu gọn sessions'}
                >
                  {isSessionsPanelCollapsed ? (
                    <ChevronRight size={16} />
                  ) : (
                    <ChevronLeft size={16} />
                  )}
                </button>

                {/* Session Type Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowSessionTypeDropdown(!showSessionTypeDropdown)}
                    className="flex items-center gap-2 px-3 py-1 bg-red-700 rounded-lg hover:bg-red-800 transition-colors text-sm"
                  >
                    <span className="font-medium truncate">
                      {getCurrentSessionTypeName()} AI
                    </span>
                    <ChevronDown size={14} />
                  </button>

                  {showSessionTypeDropdown && (
                    <div className="absolute top-8 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                      {AI_SESSION_TYPES.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => handleSessionTypeChange(type.id)}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors text-sm ${
                            currentSessionType === type.id ? 'bg-red-50 text-red-800' : 'text-gray-700'
                          }`}
                        >
                          <div className="font-medium">{type.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right side - Close button */}
              <button
                onClick={onToggle}
                className="p-1 hover:bg-red-700 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {activeSession?.messages.map((message: FloatingMessage) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      message.role === 'user'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-red-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-200">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Floating Button với visual cues */}
      <div className="fixed bottom-6 right-6 z-40">
        {/* Notification badge khi có tin nhắn mới */}
        {sessions.some(s => s.messages.length > 1) && !isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            !
          </div>
        )}
        
        {/* Tooltip */}
        <div className={`absolute bottom-16 right-0 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-0 hover:opacity-100'
        }`}>
          {isOpen ? 'Đóng chat' : 'Mở trợ lý AI'}
          <div className="absolute top-full right-4 w-2 h-2 bg-gray-800 transform rotate-45 -mt-1"></div>
        </div>

        <button
          onClick={onToggle}
          className={`w-14 h-14 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all duration-300 flex items-center justify-center group ${
            isOpen ? 'rotate-180 scale-110' : 'hover:scale-110'
          }`}
        >
          {isOpen ? (
            <X size={24} className="transition-transform duration-200" />
          ) : (
            <MessageCircle size={24} className="transition-transform duration-200 group-hover:scale-110" />
          )}
        </button>
        
        {/* Ripple effect khi hover */}
        <div className={`absolute inset-0 rounded-full bg-red-600 opacity-20 scale-0 group-hover:scale-150 transition-transform duration-500 pointer-events-none ${
          isOpen ? 'hidden' : ''
        }`}></div>
      </div>
    </>
  );
}
