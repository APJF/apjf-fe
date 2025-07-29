"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import {
  Send,
  Bot,
  Loader2,
  Plus,
  Settings,
  Menu,
  X,
  RefreshCw,
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Badge } from "../components/ui/Badge"
import { ScrollArea } from "../components/ui/ScrollArea"
import { Alert, AlertDescription } from "../components/ui/Alert"
import { chatbotService } from "../services/chatbotService"
import type { Message, ChatSession } from "../types/chatbot"
// import { useAuth } from "../hooks/useAuth"
import ChatMessage from "../components/chatbot/ChatMessage"
import ChatSessionItem from "../components/chatbot/ChatSessionItem"

export default function ChatbotPage() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentChatId, setCurrentChatId] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [editingSessionName, setEditingSessionName] = useState("")
  const [error, setError] = useState<string>("")
  // Removed userId logic as backend no longer requires it

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentChat = chatSessions.find((chat) => chat.id === currentChatId)
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputValue)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentChat?.messages])

  const loadChatMessages = useCallback(async (sessionId: number) => {
    setIsLoading(true)
    try {
      const response = await chatbotService.getSessionHistory(sessionId)
      if (response.messages) {
        const messages = response.messages
          .map((msg: Message, index: number) => ({
            id: `${sessionId}-${index}`,
            content: msg.content,
            type: msg.type,
            timestamp: new Date(),
          }))
          .filter((m: Message) => !m.isTyping) // Lọc bỏ tin nhắn đang gõ

        setChatSessions((prev) =>
          prev.map((chat) => (chat.id === sessionId ? { ...chat, messages } : chat)),
        )
      }
    } catch (error) {
      console.error("Error loading messages:", error)
    } finally {
      setIsLoading(false)
    }
    setCurrentChatId(sessionId)
  }, [])

  const handleLoadedSessions = useCallback((sessions: ChatSession[] | undefined) => {
    if (!sessions) {
      setError("Không thể tải danh sách chat");
      return;
    }

    const mappedSessions = sessions.map((session) => ({
      ...session,
      messages: [],
    }));
    setChatSessions(mappedSessions);

    if (mappedSessions.length > 0) {
      const firstSessionId = mappedSessions[0].id;
      setCurrentChatId(firstSessionId);
      loadChatMessages(firstSessionId);
    }
  }, [loadChatMessages]);

  const loadChatSessions = useCallback(async () => {
    setError("")
    setIsLoading(true)
    try {
      const response = await chatbotService.getSessions();
      handleLoadedSessions(response.sessions);
    } catch (error) {
      setError("Lỗi kết nối đến server")
      console.error("Error loading chat sessions:", error)
    } finally {
      setIsLoading(false)
    }
  }, [handleLoadedSessions]);

  // Load chat sessions on component mount
  useEffect(() => {
    loadChatSessions()
  }, [loadChatSessions])

  const createNewChat = async () => {
    setError("")
    setIsLoading(true)
    try {
      const newSessionData = await chatbotService.createSession("Cuộc trò chuyện mới")
      if (newSessionData.id) {
        const newSession: ChatSession = {
          ...newSessionData,
          messages: [],
        }
        setChatSessions((prev) => [newSession, ...prev])
        setCurrentChatId(newSession.id)
      } else {
        setError("Không thể tạo chat mới")
      }
    } catch (error) {
      setError("Lỗi khi tạo chat mới")
      console.error("Error creating new chat:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteChat = async (sessionId: number) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa cuộc trò chuyện này?");
    if (!confirmDelete) return;

    setError("")
    try {
      await chatbotService.deleteSession(sessionId);
      const updatedSessions = chatSessions.filter((chat) => chat.id !== sessionId);
      setChatSessions(updatedSessions);
      handlePostDeleteNavigation(sessionId, updatedSessions);
    } catch (error) {
      setError("Lỗi khi xóa chat")
      console.error("Error deleting chat:", error)
    }
  }

  const handlePostDeleteNavigation = (deletedSessionId: number, remainingSessions: ChatSession[]) => {
    if (currentChatId === deletedSessionId) {
      if (remainingSessions.length > 0) {
        const newCurrentChatId = remainingSessions[0].id;
        setCurrentChatId(newCurrentChatId);
        loadChatMessages(newCurrentChatId);
      } else {
        setCurrentChatId(null);
      }
    }
  };

  const handleEditSessionName = async (sessionId: number, newName: string) => {
    if (!newName.trim()) return

    try {
      const response = await chatbotService.renameSession(sessionId, newName.trim())
      if (response.id) {
        setChatSessions((prev) =>
          prev.map((chat) => (chat.id === sessionId ? { ...chat, session_name: response.session_name } : chat)),
        )
        setEditingSessionId(null)
      } else {
        setError("Không thể cập nhật tên session")
      }
    } catch (error) {
      setError("Lỗi khi cập nhật tên session")
      console.error("Error updating session name:", error)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now(),
      content: content.trim(),
      type: "human",
      timestamp: new Date(),
    }

    const typingMessage: Message = {
      id: -1,
      content: "",
      type: "ai",
      timestamp: new Date(),
      isTyping: true,
    }

    setInputValue("")
    setIsLoading(true)
    setError("")

    let finalChatId = currentChatId

    // If there's no active chat, create one first
    if (!finalChatId) {
      try {
        const newSessionResponse = await chatbotService.createSession(content.trim().substring(0, 30))
        if (newSessionResponse.id) {
          finalChatId = newSessionResponse.id
          const newSession: ChatSession = {
            ...newSessionResponse,
            messages: [userMessage, typingMessage], // Start with the new messages
          }
          setChatSessions((prev) => [newSession, ...prev])
          setCurrentChatId(finalChatId)
        } else {
          throw new Error("Failed to create new session")
        }
      } catch (error) {
        setError("Lỗi khi tạo cuộc trò chuyện mới")
        console.error("Error creating new session:", error)
        setIsLoading(false)
        return
      }
    } else {
      // Add user message and typing indicator to the existing chat session
      setChatSessions((prev) =>
        prev.map((chat) =>
          chat.id === finalChatId
            ? { ...chat, messages: [...(chat.messages || []), userMessage, typingMessage] }
            : chat,
        ),
      )
    }

    try {
      const response = await chatbotService.invoke(finalChatId as number, content.trim());
      handleSuccessfulAiResponse(finalChatId as number, response.ai_response);
    } catch (error) {
      handleFailedAiResponse(finalChatId as number, error);
    } finally {
      setIsLoading(false);
    }
  }

  const updateChatWithNewMessage = (chatId: number, message: Message) => {
    setChatSessions((prev) => {
      const newSessions = [...prev]
      const chatIndex = newSessions.findIndex((chat) => chat.id === chatId)

      if (chatIndex !== -1) {
        const newMessages = (newSessions[chatIndex].messages || []).filter((m) => !m.isTyping)
        newSessions[chatIndex] = {
          ...newSessions[chatIndex],
          messages: [...newMessages, message],
        }
      }
      return newSessions
    })
  }

  const handleSuccessfulAiResponse = (chatId: number, aiResponse: string) => {
    if (!aiResponse) {
      throw new Error("API call failed but did not throw an error.");
    }
    const aiMessage: Message = {
      id: Date.now() + 1,
      content: aiResponse,
      type: "ai",
      timestamp: new Date(),
    };
    updateChatWithNewMessage(chatId, aiMessage);
  };

  const handleFailedAiResponse = (chatId: number, error: unknown) => {
    setError("Lỗi khi gửi tin nhắn");
    console.error("Error sending message:", error);

    const errorMessage: Message = {
      id: Date.now() + 1,
      content: "Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau. 😅",
      type: "ai",
      timestamp: new Date(),
    };
    updateChatWithNewMessage(chatId, errorMessage);
  };

  const handleEditAndResubmit = async (newContent: string) => {
    if (!currentChatId || !newContent.trim()) return

    setIsLoading(true)
    setError("")

    try {
      const response = await chatbotService.editAndResubmit(currentChatId, newContent.trim())

      if (response.ai_response) {
        await loadChatMessages(currentChatId)
      } else {
        setError("Không thể chỉnh sửa và gửi lại tin nhắn")
      }
    } catch (error) {
      setError("Lỗi khi chỉnh sửa tin nhắn")
      console.error("Error editing and resubmitting:", error)
    } finally {
      setIsLoading(false)
      setEditingMessageId(null)
      setEditingContent("")
    }
  }

  const handleEditMessage = (messageId: number, content: string) => {
    const humanMessages = (currentChat?.messages || []).filter((msg) => msg.type === "human")
    const lastHumanMessage = humanMessages[humanMessages.length - 1]

    if (messageId === lastHumanMessage?.id) {
      setEditingMessageId(messageId)
      setEditingContent(content)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingMessageId || !currentChatId) return
    await handleEditAndResubmit(editingContent)
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditingContent("")
  }

  const formatTime = (dateString: string) => {
    // Ensure the date string is treated as UTC by appending 'Z' if it's not already there.
    const utcDate = new Date(dateString.endsWith('Z') ? dateString : `${dateString}Z`);
    const now = new Date();
    const diff = now.getTime() - utcDate.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return utcDate.toLocaleDateString("vi-VN");
  }

  const renderSession = (chat: ChatSession) => {
    const { id, session_name, updated_at } = chat

    const handleSelect = () => {
      if (editingSessionId !== id) {
        loadChatMessages(id)
      }
    }

    const handleStartEdit = () => {
      setEditingSessionId(id)
      setEditingSessionName(session_name)
    }

    const handleCancelEdit = () => {
      setEditingSessionId(null)
    }

    const handleSaveEdit = () => {
      handleEditSessionName(id, editingSessionName)
    }

    const handleDelete = () => {
      deleteChat(id)
    }

    const handleFormatTime = () => {
      return formatTime(updated_at)
    }

    return (
      <ChatSessionItem
        key={id}
        chat={chat}
        isActive={currentChatId === id}
        isEditing={editingSessionId === id}
        editingSessionName={editingSessionName}
        onSelect={handleSelect}
        onStartEdit={handleStartEdit}
        onCancelEdit={handleCancelEdit}
        onNameChange={setEditingSessionName}
        onSaveEdit={handleSaveEdit}
        onDelete={handleDelete}
        formatTime={handleFormatTime}
      />
    )
  }

  const chatSessionList = chatSessions.map(renderSession)

  const humanMessages = (currentChat?.messages || []).filter((m) => m.type === "human")
  const lastHumanMessage = humanMessages[humanMessages.length - 1]
  const messageList = (currentChat?.messages || []).map((message) => {
    const isLastHumanMessage = message.id === lastHumanMessage?.id

    return (
      <ChatMessage
        key={message.id}
        message={message}
        isLastHumanMessage={isLastHumanMessage}
        editingMessageId={editingMessageId}
        editingContent={editingContent}
        isLoading={isLoading}
        onEditContentChange={setEditingContent}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onEditMessage={handleEditMessage}
      />
    )
  })

  // userId check removed

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0 bg-white flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 border-r border-gray-200 flex flex-col overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Trợ lý AI</h1>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={createNewChat} className="w-full bg-red-600 hover:bg-red-700 text-white mb-3">
            <Plus className="h-4 w-4 mr-2" />
            Tạo đoạn chat mới
          </Button>
          <Button onClick={loadChatSessions} variant="outline" size="sm" className="w-full bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>

        {/* Chat Sessions List */}
        <ScrollArea className="flex-1">
          <div className="p-2">{chatSessionList}</div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">🇯🇵 Tiếng Nhật</Badge>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 flex-shrink-0">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4 max-w-4xl mx-auto">
              {messageList}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input */}
        <div className="p-4 bg-white flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn của bạn..."
                  disabled={isLoading || !currentChatId}
                  className="pr-12 py-3 rounded-2xl border-gray-300 focus:border-red-400 focus:ring-red-400"
                />
                <Button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading || !currentChatId}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 hover:bg-red-700 rounded-full h-8 w-8 p-0"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              AI có thể mắc lỗi. Vui lòng kiểm tra thông tin quan trọng.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
