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
  function: AIFunction;
  messages: FloatingMessage[];
}

export interface AIFunction {
  id: string;
  name: string;
  description: string;
}
