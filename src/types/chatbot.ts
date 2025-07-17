export interface Message {
  id: number;
  content: string;
  type: "human" | "ai";
  timestamp: Date;
  isTyping?: boolean;
  isEditing?: boolean;
}

export interface ChatSession {
  id: number;
  session_name: string;
  updated_at: string;
  messages: Message[];
}
