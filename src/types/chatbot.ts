export interface Message {
  id: string;
  content: string;
  type: "human" | "ai";
  role: "user" | "assistant";
  timestamp: Date;
  isTyping?: boolean;
  isEditing?: boolean;
}

export interface ChatSession {
  id: string;
  name: string;
  session_name: string;
  lastMessage: string;
  timestamp: Date;
  updated_at: Date;
  function: AIFunction;
  messages: Message[];
}

export interface AIFunction {
  id: string;
  name: string;
  description: string;
}
