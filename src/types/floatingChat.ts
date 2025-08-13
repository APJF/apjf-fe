export interface FloatingMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export interface FloatingChatSession {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
  sessionType: AISessionType;
  messages: FloatingMessage[];
  isTemporary?: boolean; // For new sessions that haven't been saved yet
}

export interface AIFunction {
  id: string;
  name: string;
  description: string;
}

export type AISessionType = 'qna' | 'planner' | 'speaking' | 'reviewer' | 'learning';
