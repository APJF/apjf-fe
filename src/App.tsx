import React from 'react';
import AppRouter from './router/AppRouter';
import { ToastProvider } from './components/ui/toast';

/**
 * App Component - Root component của ứng dụng
 * Sử dụng AppRouter để xử lý routing và ToastProvider cho hệ thống thông báo
 * Tailwind CSS được import qua index.css
 */
function App(): React.ReactElement {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
}

export default App;
