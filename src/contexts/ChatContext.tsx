import { createContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

interface ChatContextType {
  isFloatingChatOpen: boolean;
  setIsFloatingChatOpen: (isOpen: boolean) => void;
  toggleFloatingChat: () => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);

  const toggleFloatingChat = useCallback(() => {
    setIsFloatingChatOpen(!isFloatingChatOpen);
  }, [isFloatingChatOpen]);

  const value = useMemo(() => ({
    isFloatingChatOpen,
    setIsFloatingChatOpen,
    toggleFloatingChat
  }), [isFloatingChatOpen, toggleFloatingChat]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
