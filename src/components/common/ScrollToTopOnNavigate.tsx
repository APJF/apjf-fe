import { useEffect } from 'react';

/**
 * ScrollToTopOnNavigate - Alternative scroll restoration approach
 * Uses navigation events and window history to detect route changes
 */
const ScrollToTopOnNavigate = () => {
  useEffect(() => {
    console.log('🚀 [ScrollToTopOnNavigate] Component initialized');
    
    let currentPath = window.location.pathname;
    console.log('📍 [ScrollToTopOnNavigate] Initial path:', currentPath);
    
    // Function to scroll to top
    const scrollToTop = () => {
      console.log('📜 [ScrollToTopOnNavigate] Scrolling to top...');
      console.log('📜 [ScrollToTopOnNavigate] Before scroll:', { x: window.scrollX, y: window.scrollY });
      
      try {
        // Multiple attempts for different scenarios
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'auto'
        });
        
        // Immediate fallback
        window.scrollTo(0, 0);
        
        // DOM element fallback
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        // Check result
        setTimeout(() => {
          console.log('📜 [ScrollToTopOnNavigate] After scroll:', { x: window.scrollX, y: window.scrollY });
        }, 10);
        
      } catch (error) {
        console.error('❌ [ScrollToTopOnNavigate] Error:', error);
      }
    };
    
    // Method 1: Navigation API (modern browsers)
    const handleNavigation = () => {
      const newPath = window.location.pathname;
      console.log('🔄 [ScrollToTopOnNavigate] Path changed:', currentPath, '->', newPath);
      
      if (newPath !== currentPath) {
        currentPath = newPath;
        setTimeout(scrollToTop, 10);
      }
    };
    
    // Method 2: History API events
    const handlePopState = () => {
      console.log('⬅️ [ScrollToTopOnNavigate] PopState event');
      setTimeout(scrollToTop, 10);
    };
    
    // Method 3: Hash change events
    const handleHashChange = () => {
      console.log('🔗 [ScrollToTopOnNavigate] Hash change event');
      setTimeout(scrollToTop, 10);
    };
    
    // Method 4: MutationObserver for DOM changes (as fallback)
    const observer = new MutationObserver(() => {
      const newPath = window.location.pathname;
      if (newPath !== currentPath) {
        console.log('🔍 [ScrollToTopOnNavigate] DOM mutation detected path change:', currentPath, '->', newPath);
        currentPath = newPath;
        setTimeout(scrollToTop, 50);
      }
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
    
    // Method 5: Interval check (last resort)
    const intervalCheck = setInterval(() => {
      const newPath = window.location.pathname;
      if (newPath !== currentPath) {
        console.log('⏰ [ScrollToTopOnNavigate] Interval detected path change:', currentPath, '->', newPath);
        currentPath = newPath;
        scrollToTop();
      }
    }, 500);
    
    // Add event listeners
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);
    
    // Modern navigation API
    if ('navigation' in window) {
      const navigation = (window as unknown as { navigation: EventTarget }).navigation;
      navigation.addEventListener('navigate', handleNavigation);
    }
    
    return () => {
      console.log('🧹 [ScrollToTopOnNavigate] Cleanup');
      observer.disconnect();
      clearInterval(intervalCheck);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
      
      if ('navigation' in window) {
        const navigation = (window as unknown as { navigation: EventTarget }).navigation;
        navigation.removeEventListener('navigate', handleNavigation);
      }
    };
  }, []);

  return null;
};

export default ScrollToTopOnNavigate;
