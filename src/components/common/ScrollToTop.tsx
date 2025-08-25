import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component - Simple scroll restoration for React Router
 * Auto scrolls to top when route changes using useLocation hook
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Skip scroll restoration for chat page since it has its own scroll logic
    if (pathname === '/chatbox') {
      console.log('🔄 [ScrollToTop] Skipping scroll for chatbot page:', pathname);
      return;
    }

    // Add a small delay to ensure DOM is updated
    const scrollToTop = () => {
      console.log('🔄 [ScrollToTop] Route changed to:', pathname);
      console.log('📍 [ScrollToTop] Current scroll position:', { x: window.scrollX, y: window.scrollY });
      
      // Multiple scroll methods for better compatibility
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      });
      
      // Fallback methods
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Verify scroll position after a short delay
      setTimeout(() => {
        console.log('✅ [ScrollToTop] Scroll position after:', { x: window.scrollX, y: window.scrollY });
      }, 50);
    };

    // Execute scroll after DOM update
    const timeoutId = setTimeout(scrollToTop, 0);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  return null;
};

export default ScrollToTop;