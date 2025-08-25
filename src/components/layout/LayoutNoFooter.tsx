import React from 'react';
import { Header } from './Header';
import ScrollToTop from '../common/ScrollToTop';

/**
 * LayoutNoFooter Component - Layout variant without Footer
 * Used for pages that need full height without footer (like chat pages)
 * GlobalFloatingChat is disabled here as it would conflict with main chat interface
 */
interface LayoutNoFooterProps {
  children: React.ReactNode;
}

const LayoutNoFooter: React.FC<LayoutNoFooterProps> = ({ children }) => {
  console.log('🏗️ [LayoutNoFooter] Rendering Layout without Footer');
  
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Scroll restoration for navigation - disabled for chatbox */}
      <ScrollToTop />
            
      {/* Header - Navigation - Fixed height */}
      <div className="flex-shrink-0">
        <Header />
      </div>

      {/* Main Content Area - Takes remaining height with no scroll */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default LayoutNoFooter;
