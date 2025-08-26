import { createContext } from 'react';

interface ChatContextType {
  isFloatingChatOpen: boolean;
  setIsFloatingChatOpen: (isOpen: boolean) => void;
  toggleFloatingChat: () => void;
  currentMaterialId: string | null;
  setCurrentMaterialId: (materialId: string | null) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);
