import React from "react"
import { MessageSquare, MoreHorizontal, Edit3, Trash2, Check } from "lucide-react"
import type { ChatSession } from "../../types/chatbot"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/DropdownMenu"

interface ChatSessionItemProps {
  chat: ChatSession
  isActive: boolean
  isEditing: boolean
  editingSessionName: string
  onSelect: () => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onNameChange: (name: string) => void
  onSaveEdit: () => void
  onDelete: () => void
  formatTime: () => string
}

const ChatSessionItem: React.FC<ChatSessionItemProps> = ({
  chat,
  isActive,
  isEditing,
  editingSessionName,
  onSelect,
  onStartEdit,
  onCancelEdit,
  onNameChange,
  onSaveEdit,
  onDelete,
  formatTime,
}) => {
  const handleSave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onSaveEdit()
  }

  const handleStartEdit = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    onStartEdit()
  }

  const handleDelete = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    onDelete()
  }

  return (
    <button
      className={`p-3 rounded-lg text-left w-full mb-2 group hover:bg-gray-50 transition-colors ${
        isActive ? "bg-red-50 border border-red-200" : ""
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editingSessionName}
                onChange={(e) => onNameChange(e.target.value)}
                className="text-sm h-8 flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveEdit()
                  if (e.key === "Escape") onCancelEdit()
                }}
                onBlur={onCancelEdit}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <Button size="sm" onClick={handleSave} className="h-8 w-8 p-0">
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <h3 className="text-sm font-medium text-gray-800 truncate">{chat.session_name}</h3>
              </div>
              <p className="text-xs text-gray-500 mt-1 pl-6">{formatTime()}</p>
            </>
          )}
        </div>
        {!isEditing && (
          <div className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`transition-opacity h-7 w-7 p-0 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleStartEdit}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Sửa tên
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </button>
  )
}

export default ChatSessionItem
