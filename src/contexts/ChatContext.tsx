import { useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ChatContext } from './ChatContextDefinition';

interface ChatProviderProps {
  readonly children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);
  const [currentMaterialId, setCurrentMaterialId] = useState<string | null>(null);

  const toggleFloatingChat = useCallback(() => {
    setIsFloatingChatOpen(!isFloatingChatOpen);
  }, [isFloatingChatOpen]);

  const value = useMemo(() => ({
    isFloatingChatOpen,
    setIsFloatingChatOpen,
    toggleFloatingChat,
    currentMaterialId,
    setCurrentMaterialId
  }), [isFloatingChatOpen, toggleFloatingChat, currentMaterialId]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

// Re-export context for convenience
export { ChatContext } from './ChatContextDefinition';
