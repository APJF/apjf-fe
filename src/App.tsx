import React from 'react';
import AppRouter from './router/AppRouter';
import { ToastProvider } from './components/ui/ToastProvider';
import { LanguageProvider } from './contexts/LanguageContext';
import { ChatProvider } from './contexts/ChatContext';
import { GlobalFloatingChat } from './components/chatbot/GlobalFloatingChat';

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
          <AppRouter />
          <GlobalFloatingChat />
        </ToastProvider>
      </ChatProvider>
    </LanguageProvider>
  );
}

export default App;
