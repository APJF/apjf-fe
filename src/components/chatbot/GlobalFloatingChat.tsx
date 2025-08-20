import { FloatingChatButton } from './FloatingChatButton';
import { useChat } from '../../hooks/useChat';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';

export function GlobalFloatingChat() {
  const { isFloatingChatOpen, toggleFloatingChat } = useChat();
  const location = useLocation();
  const { user } = useAuth();

  // Pages where chat should be hidden
  const hiddenOnPages = [
    '/login',
    '/register', 
    '/forgot-password',
    '/reset-password',
    '/verify-otp',
    '/oauth2/redirect'
  ];

  // Routes patterns where chat should be hidden (using regex-like matching)
  const hiddenRoutePatterns = [
    /^\/exam\/.*\/take$/, // Hide on exam taking pages: /exam/{examId}/take
  ];

  // Check if current route should hide chat
  const shouldHideChat = () => {
    // Hide chat if user is not authenticated
    const isAuthenticated = authService.isAuthenticated() && user;
    if (!isAuthenticated) {
      return true;
    }

    // Check exact page matches
    if (hiddenOnPages.includes(location.pathname)) {
      return true;
    }

    // Check pattern matches
    return hiddenRoutePatterns.some(pattern => pattern.test(location.pathname));
  };

  // Don't render chat if should be hidden
  if (shouldHideChat()) {
    return null;
  }

  return (
    <FloatingChatButton 
      isOpen={isFloatingChatOpen}
      onToggle={toggleFloatingChat}
    />
  );
}
