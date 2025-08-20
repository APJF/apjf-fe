import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Send, Plus, MoreVertical, Edit2, Trash2, ChevronDown, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import type { FloatingChatSession, AISessionType, FloatingMessage } from '../../types/floatingChat';
import { chatbotService, getCurrentUserId, type ChatSession } from '../../services/chatbotService';

interface FloatingChatButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Updated AI session types
const AI_SESSION_TYPES: Array<{ id: AISessionType; name: string; description: string }> = [
  { id: 'qna', name: 'Trợ lý', description: 'Trả lời câu hỏi chung' },
  { id: 'planner', name: 'Lộ trình học', description: 'Hỗ trợ lập kế hoạch học tập' },
  { id: 'reviewer', name: 'Đánh giá', description: 'Hỗ trợ ôn tập kiến thức' },
  { id: 'learning', name: 'Hướng dẫn học tập', description: 'Hướng dẫn học tập' }
];

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex space-x-1">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
  </div>
);

export function FloatingChatButton({ isOpen, onToggle }: Readonly<FloatingChatButtonProps>) {
  const [sessions, setSessions] = useState<FloatingChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [currentSessionType, setCurrentSessionType] = useState<AISessionType>('qna');
  const [input, setInput] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [showSessionTypeDropdown, setShowSessionTypeDropdown] = useState(false);
  const [isSessionsPanelCollapsed, setIsSessionsPanelCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false); // Separate loading state for sessions
  const [isCreatingNewSession, setIsCreatingNewSession] = useState(false);
  const hasLoadedSessionsRef = useRef(false); // Track if sessions have been loaded
  const currentUserIdRef = useRef(getCurrentUserId()); // Track current user ID

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const currentUserId = getCurrentUserId();

  // Ref cho messages container để auto-scroll
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Function để scroll xuống tin nhắn mới nhất
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto-scroll khi có tin nhắn mới
  React.useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, scrollToBottom]);

  // Convert API ChatSession to FloatingChatSession
  const convertToFloatingSession = (apiSession: ChatSession): FloatingChatSession => {
    // Map API type to our session type
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
      messages: [], // Will be loaded separately when needed
      isTemporary: false
    };
  };

  const loadSessionMessages = useCallback(async (sessionId: number) => {
    console.log('🔄 loadSessionMessages called for session:', sessionId);
    try {
      console.log('📞 Calling getMessages API...');
      const messages = await chatbotService.getMessages(sessionId.toString());
      console.log('✅ Got messages from API:', messages);
      
      const floatingMessages: FloatingMessage[] = messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.timestamp) // Chuyển đổi từ ISO string sang Date
      }));
      console.log('🔄 Converted to floating messages:', floatingMessages);

      setSessions(prev => {
        console.log('Previous sessions before update:', prev);
        const updated = prev.map(s => 
          s.id === sessionId ? { ...s, messages: floatingMessages } : s
        );
        console.log('Updated sessions after adding messages:', updated);
        return updated;
      });

      // Auto-scroll xuống tin nhắn mới nhất sau khi load messages
      setTimeout(() => {
        scrollToBottom();
      }, 100); // Small delay để đảm bảo messages đã render
    } catch (error) {
      console.error('❌ Error loading session messages:', error);
    }
  }, [scrollToBottom]);

  const loadSessions = useCallback(async () => {
    console.log('🔄 loadSessions called');
    
    if (!currentUserId) {
      console.log('❌ No user ID, skipping loadSessions');
      return;
    }
    
    try {
      setIsLoadingSessions(true); // Use separate loading state for sessions
      console.log('📞 Calling getSessions API with user ID:', currentUserId);
      
      const apiSessions = await chatbotService.getSessions(currentUserId);
      console.log('✅ Got sessions from API:', apiSessions);
      
      const floatingSessions = apiSessions.map(convertToFloatingSession);
      console.log('🔄 Converted to floating sessions:', floatingSessions);
      setSessions(floatingSessions);
      hasLoadedSessionsRef.current = true; // Mark as loaded
      
      // Set active session to the first one if no active session AND not creating new session
      if (!activeSessionId && !isCreatingNewSession && floatingSessions.length > 0) {
        console.log('🎯 Setting first session as active:', floatingSessions[0].id);
        setActiveSessionId(floatingSessions[0].id);
        loadSessionMessages(floatingSessions[0].id);
      }
    } catch (error) {
      console.error('❌ Error loading sessions:', error);
    } finally {
      setIsLoadingSessions(false); // Use separate loading state for sessions
    }
  }, [currentUserId, activeSessionId, isCreatingNewSession, loadSessionMessages]);

  // Load sessions when component mounts ONLY
  useEffect(() => {
    if (isOpen && !hasLoadedSessionsRef.current) {
      console.log('🎬 Initial load of sessions');
      loadSessions();
    }
  }, [isOpen, loadSessions]);

  // Reset loaded flag when chat is closed
  useEffect(() => {
    if (!isOpen) {
      hasLoadedSessionsRef.current = false;
    }
  }, [isOpen]);

  // Check for user ID change and reset sessions if needed
  useEffect(() => {
    const newUserId = getCurrentUserId();
    if (currentUserIdRef.current !== newUserId) {
      console.log('👤 User ID changed from', currentUserIdRef.current, 'to', newUserId);
      console.log('🔄 Resetting sessions and reloading for new user');
      
      // Reset everything for new user
      currentUserIdRef.current = newUserId;
      hasLoadedSessionsRef.current = false;
      setSessions([]);
      setActiveSessionId(null);
      
      // Reload sessions if chat is open
      if (isOpen) {
        loadSessions();
      }
    }
  }, [isOpen, loadSessions]); // Check on every render when chat is open

  const toggleSessionsPanel = () => {
    setIsSessionsPanelCollapsed(!isSessionsPanelCollapsed);
  };

  const handleCreateNewSession = () => {
    console.log('🆕 handleCreateNewSession called');
    console.log('Previous activeSessionId:', activeSessionId);
    
    // Reset chat interface to blank state
    setActiveSessionId(null);
    setInput('');
    setIsCreatingNewSession(true);
    console.log('✅ Reset to blank state - activeSessionId: null, input: "", isCreatingNewSession: true');
    
    // Don't add any session to the list yet - wait for first message
  };

  // OPTIMIZED DELETE WITH INSTANT UI UPDATE
  const handleDeleteSession = async (sessionId: number) => {
    try {
      console.log('🗑️ handleDeleteSession - Attempting to delete session:', sessionId);
      console.log('🔍 Current sessions list:', sessions.map(s => ({ id: s.id, name: s.name })));
      
      // Store original sessions for potential revert
      const originalSessions = [...sessions];
      const originalActiveSessionId = activeSessionId;
      
      // 1. OPTIMISTIC UPDATE: Remove from UI immediately
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);
      console.log('⚡ Optimistic update - session removed from UI immediately');
      
      // 2. Handle active session selection immediately
      if (activeSessionId === sessionId) {
        console.log('🎯 Deleted session was active, finding new active session...');
        if (updatedSessions.length > 0) {
          const newActiveSession = updatedSessions[0];
          setActiveSessionId(newActiveSession.id);
          console.log('🎯 Set new active session immediately:', newActiveSession.id);
          
          // Load messages for new active session if not already loaded
          if (newActiveSession.messages.length === 0) {
            loadSessionMessages(newActiveSession.id);
          }
        } else {
          setActiveSessionId(null);
          console.log('🔄 Reset active session to null - no sessions left');
        }
      }
      
      // 3. Call API in background (don't await to block UI)
      chatbotService.deleteSession(sessionId)
        .then(() => {
          console.log('✅ chatbotService.deleteSession completed successfully');
          // No need to reload sessions - optimistic update is enough
        })
        .catch((error: unknown) => {
          console.error('❌ Background delete failed, reverting optimistic update:', error);
          // Revert optimistic update if API failed
          setSessions(originalSessions);
          setActiveSessionId(originalActiveSessionId);
        });
      
      console.log('⚡ Delete operation completed instantly with optimistic update');
    } catch (error) {
      console.error('❌ Error in handleDeleteSession:', error);
    }
  };

  // OPTIMIZED RENAME WITH INSTANT UI UPDATE  
  const handleRenameSession = async (sessionId: number, newName: string) => {
    try {
      console.log('✏️ handleRenameSession - Attempting to rename session:', sessionId, 'to:', newName);
      console.log('🔍 Current session:', sessions.find(s => s.id === sessionId));
      
      // Store original sessions for potential revert
      const originalSessions = [...sessions];
      
      // 1. OPTIMISTIC UPDATE: Update name in UI immediately
      const updatedSessions = sessions.map(s => 
        s.id === sessionId ? { ...s, name: newName } : s
      );
      setSessions(updatedSessions);
      console.log('⚡ Optimistic update - session name updated in UI immediately');
      
      // 2. Call API in background (don't await to block UI)
      chatbotService.updateSessionName(sessionId, newName)
        .then(() => {
          console.log('✅ chatbotService.updateSessionName completed successfully');
          // No need to reload sessions - optimistic update is enough
        })
        .catch((error: unknown) => {
          console.error('❌ Background rename failed, reverting optimistic update:', error);
          // Revert optimistic update if API failed
          setSessions(originalSessions);
        });
      
      console.log('⚡ Rename operation completed instantly with optimistic update');
      console.log('🔍 Sessions after optimistic update:', updatedSessions.map(s => ({ id: s.id, name: s.name })));
    } catch (error) {
      console.error('❌ Error in handleRenameSession:', error);
      console.error('🔍 Error details - sessionId:', sessionId);
      console.error('🔍 Error details - newName:', newName);
    }
  };

  const handleSessionTypeChange = (sessionType: AISessionType) => {
    console.log('🔄 handleSessionTypeChange called');
    console.log('Previous session type:', currentSessionType);
    console.log('New session type:', sessionType);
    console.log('Active session:', activeSession);
    
    setCurrentSessionType(sessionType);
    
    console.log('✅ Session type updated to:', sessionType);
    if (sessionType === 'reviewer') {
      console.log('🏥 REVIEWER AI SELECTED - Will include exam_result_id in context');
    }
    
    // If there's an active temporary session, update its type
    if (activeSession?.isTemporary) {
      console.log('🔄 Updating temporary session type');
      setSessions(sessions.map(s => 
        s.id === activeSessionId ? { ...s, sessionType } : s
      ));
    }
    
    setShowSessionTypeDropdown(false);
    console.log('✅ Session type changed and dropdown closed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== handleSubmit called ===');
    console.log('Input:', input);
    console.log('Input trimmed:', input.trim());
    console.log('ActiveSessionId:', activeSessionId);
    console.log('CurrentSessionType:', currentSessionType);
    console.log('Current URL:', window.location.href);
    
    if (!input.trim()) {
      console.log('❌ Input is empty, returning');
      return;
    }

    const currentInput = input.trim();
    setInput(''); // Clear input immediately for better UX
    console.log('🧹 Cleared input field immediately');

    setIsLoading(true);
    console.log('🔄 Setting loading to true');

    try {
      // If no active session OR creating new session, create new session with first message
      if (!activeSessionId || isCreatingNewSession) {
        console.log('🆕 Creating new session with first message...');
        console.log('🔍 Conditions - activeSessionId:', activeSessionId, 'isCreatingNewSession:', isCreatingNewSession);
        
        // 1. Create temporary session with user message and typing indicator immediately
        const tempSessionId = Date.now(); // Temporary ID
        
        const userMessage: FloatingMessage = {
          id: 'temp-user-' + Date.now(),
          content: currentInput,
          role: 'user',
          timestamp: new Date()
        };

        const typingMessage: FloatingMessage = {
          id: 'temp-typing-' + Date.now(),
          content: '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏', // Spinning dots
          role: 'assistant',
          timestamp: new Date()
        };

        const tempSessionForUI: FloatingChatSession = {
          id: tempSessionId,
          name: 'Đang tạo phiên...', // Simple temporary name
          sessionType: currentSessionType,
          messages: [userMessage, typingMessage],
          lastMessage: 'AI đang trả lời...',
          timestamp: new Date()
        };

        // 2. Show temporary session immediately
        setSessions(prev => [tempSessionForUI, ...prev]);
        setActiveSessionId(tempSessionId);
        setIsCreatingNewSession(false);
        console.log('🎭 Created temporary session with typing indicator');
        
        // 3. Build context for reviewer AI type
        const context: Record<string, number | string> = {};
        
        // Check if we're on exam result review page
        const currentPath = window.location.pathname;
        console.log('Current path:', currentPath);
        
        if (currentSessionType === 'reviewer') {
          console.log('🔍 Reviewer AI type selected, checking for exam_result_id...');
          
          // Try to extract exam_result_id from URL path like /exam-result/114/review
          const examResultRegex = /\/exam-result\/(\d+)/;
          const examResultMatch = examResultRegex.exec(currentPath);
          if (examResultMatch) {
            const examResultId = parseInt(examResultMatch[1]);
            context.exam_result_id = examResultId;
            console.log('✅ Found exam_result_id from URL:', examResultId);
          } else {
            console.log('⚠️ Reviewer AI selected but no exam_result_id found in URL');
          }
        }
        
        console.log('Context to send:', context);
        console.log('User ID:', currentUserId);

        if (!currentUserId) {
          console.error('❌ No user ID available for creating session');
          return;
        }

        const createSessionRequest = {
          user_id: currentUserId,
          session_type: currentSessionType,
          first_message: currentInput,
          context
        };
        
        console.log('🚀 Sending createSession request:', createSessionRequest);
        const newSession = await chatbotService.createSession(createSessionRequest);
        console.log('✅ Session created successfully:', newSession);

        // 4. Replace temporary session with real session
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
          name: newSession.session_name, // Use real session name from API
          sessionType: currentSessionType,
          messages: [realUserMessage, realAiMessage],
          lastMessage: newSession.ai_first_response.substring(0, 50) + '...',
          timestamp: new Date()
        };

        // 5. Replace temporary session with real session
        setSessions(prev => prev.map(s => 
          s.id === tempSessionId ? realSessionForUI : s
        ));
        setActiveSessionId(newSession.session_id);
        console.log('� Replaced temporary session with real session!');
        
      } else {
        console.log('💬 Sending message to existing session:', activeSessionId);
        
        // 1. Show user message immediately
        const userMessage: FloatingMessage = {
          id: 'temp-user-' + Date.now(),
          content: currentInput,
          role: 'user',
          timestamp: new Date()
        };

        // 2. Add typing indicator
        const typingMessage: FloatingMessage = {
          id: 'temp-typing-' + Date.now(),
          content: '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏', // Spinning dots - will be replaced with CSS animation
          role: 'assistant',
          timestamp: new Date()
        };

        // 3. Update UI immediately with user message + typing indicator
        setSessions(prev => prev.map(s => 
          s.id === activeSessionId 
            ? { 
                ...s, 
                messages: [...s.messages, userMessage, typingMessage],
                lastMessage: 'AI đang trả lời...',
                timestamp: new Date()
              }
            : s
        ));
        
        console.log('🎭 Added user message and typing indicator immediately');
        
        const sendMessageRequest = {
          session_id: activeSessionId,
          user_input: currentInput
        };
        
        console.log('🚀 Sending message request:', sendMessageRequest);
        const response = await chatbotService.sendMessage(sendMessageRequest);
        console.log('✅ Message sent successfully:', response);

        // 4. Replace user message and typing indicator with real messages
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

        // 5. Replace temporary messages with real ones
        setSessions(prev => prev.map(s => 
          s.id === activeSessionId 
            ? { 
                ...s, 
                messages: [...s.messages.slice(0, -2), realUserMessage, realAiMessage], // Remove last 2 temp messages, add real ones
                lastMessage: response.ai_response.substring(0, 50) + '...',
                timestamp: new Date()
              }
            : s
        ));

        console.log('🎉 Replaced temp messages with real messages');
      }
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown; status?: number } };
        console.error('Response data:', axiosError.response?.data);
        console.error('Response status:', axiosError.response?.status);
      }
    } finally {
      setIsLoading(false);
      console.log('✅ Setting loading to false');
    }
  };

  const handleSessionClick = (sessionId: number) => {
    setActiveSessionId(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    
    // Load messages if messages haven't been loaded
    if (session && session.messages.length === 0) {
      loadSessionMessages(sessionId);
    }
    
    // Update current session type to match the clicked session
    if (session) {
      setCurrentSessionType(session.sessionType);
    }
  };

  const handleMenuToggle = (sessionId: number) => {
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
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleString('vi-VN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getCurrentSessionTypeName = () => {
    const sessionType = AI_SESSION_TYPES.find(type => type.id === currentSessionType);
    return sessionType?.name || 'Trợ lý';
  };

  // Don't render if no user ID (not authenticated)
  if (!currentUserId) {
    return null;
  }
  
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
              {isLoadingSessions && (
                <div className="p-4 text-center text-sm text-gray-500">
                  Đang tải phiên chat...
                </div>
              )}
              {!isLoadingSessions && sessions.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">
                  Chưa có phiên chat nào
                </div>
              )}
              {!isLoadingSessions && sessions.length > 0 && (
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
                            {AI_SESSION_TYPES.find(type => type.id === session.sessionType)?.name || 'Trợ lý'}
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
                    {message.id.includes('temp-typing') ? (
                      <TypingIndicator />
                    ) : (
                      <p>{message.content}</p>
                    )}
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-red-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {/* Element để scroll tới */}
              <div ref={messagesEndRef} />
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
                  disabled={!input.trim() || isLoading}
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
