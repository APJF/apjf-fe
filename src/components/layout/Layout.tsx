import React from 'react';
import { Header } from './Header';
import Footer from './Footer';
import { GlobalFloatingChat } from '../chatbot/GlobalFloatingChat';

/**
 * Layout Component - Wrapper component cho toàn bộ trang
 * Chứa Header, Footer và content area
 * Sử dụng flexbox để footer luôn ở dưới cùng
 */
interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Navigation */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <Footer />
      
      {/* Floating Chat - Only in Layout pages */}
      <GlobalFloatingChat />
    </div>
  );
};

export default Layout;
