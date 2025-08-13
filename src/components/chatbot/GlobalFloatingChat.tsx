import { FloatingChatButton } from './FloatingChatButton';
import { useChat } from '../../hooks/useChat';

export function GlobalFloatingChat() {
  const { isFloatingChatOpen, toggleFloatingChat } = useChat();

  return (
    <FloatingChatButton 
      isOpen={isFloatingChatOpen}
      onToggle={toggleFloatingChat}
    />
  );
}
