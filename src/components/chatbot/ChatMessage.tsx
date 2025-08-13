import React from "react"
import { Bot, User, Loader2, Edit3, Check, XCircle } from "lucide-react"
import type { Message } from "../../types/chatbot"
import { Button } from "../ui/Button"
import { Textarea } from "../ui/Textarea"

interface ChatMessageProps {
  message: Message
  isLastHumanMessage: boolean
  editingMessageId: string | null
  editingContent: string
  isLoading: boolean
  onEditContentChange: (content: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onEditMessage: (messageId: string, content: string) => void
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLastHumanMessage,
  editingMessageId,
  editingContent,
  isLoading,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
  onEditMessage,
}) => {
  const renderMessageContent = () => {
    if (message.isTyping) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-red-600" />
          <span className="text-sm text-red-600">Đang trả lời...</span>
        </div>
      )
    }

    if (editingMessageId === message.id) {
      return (
        <div className="space-y-2">
          <Textarea
            value={editingContent}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onEditContentChange(e.target.value)}
            className="min-h-[60px] max-h-[600px] text-sm text-black"
            placeholder="Chỉnh sửa tin nhắn..."
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={onSaveEdit} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
              Lưu & Gửi lại
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelEdit}>
              <XCircle className="h-3 w-3 mr-1" />
              Hủy
            </Button>
          </div>
        </div>
      )
    }

    return (
      <>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs opacity-70">
            {message.timestamp.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {message.type === "human" && isLastHumanMessage && (
            <Button
              size="sm"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
              onClick={() => onEditMessage(message.id, message.content)}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </>
    )
  }

  return (
    <div key={message.id} className={`flex gap-3 ${message.type === "human" ? "justify-end" : "justify-start"}`}>
      {message.type === "ai" && (
        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 group relative ${
          message.type === "human" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {renderMessageContent()}
      </div>
      {message.type === "human" && (
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  )
}

export default ChatMessage
