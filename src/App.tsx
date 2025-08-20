import React, { useEffect } from 'react';
import AppRouter from './router/AppRouter';
import { ToastProvider } from './components/ui/ToastProvider';
import { LanguageProvider } from './contexts/LanguageContext';
import { ChatProvider } from './contexts/ChatContext';
import { GlobalFloatingChat } from './components/chatbot/GlobalFloatingChat';
import { setToastFunction } from './api/axios';
import { useToast } from './hooks/useToast';

/**
 * App Content - Inner component để access toast context
 */
const AppContent: React.FC = () => {
  const { showToast } = useToast();

  // Setup toast function for axios interceptor
  useEffect(() => {
    setToastFunction((message: string, type: 'error' | 'success' | 'info') => {
      // Map 'info' to 'warning' for toast compatibility
      const toastType = type === 'info' ? 'warning' : type;
      showToast(toastType, message);
    });
  }, [showToast]);

  return (
    <>
      <AppRouter />
      <GlobalFloatingChat />
    </>
  );
};

/**
 * App Component - Root component của ứng dụng
 * Sử dụng AppRouter để xử lý routing, ToastProvider cho hệ thống thông báo,
 * LanguageProvider cho hệ thống đa ngôn ngữ và ChatProvider cho floating chat AI
 * Tailwind CSS được import qua index.css
 */
function App(): React.ReactElement {
  return (
    <LanguageProvider>
      <ChatProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ChatProvider>
    </LanguageProvider>
  );
}

export default App;
