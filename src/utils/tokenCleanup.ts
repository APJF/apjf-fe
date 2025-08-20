/**
 * Token cleanup utility - Cleans up corrupted or expired tokens
 * Call this function if you encounter persistent authentication issues
 */

export const cleanupTokens = (reason = 'Manual cleanup') => {
  console.log(`🧹 Cleaning up tokens: ${reason}`);
  
  // Remove all auth-related localStorage items
  const authKeys = [
    'access_token',
    'refresh_token', 
    'userInfo',
    'user', // legacy
    'accessToken', // legacy
    'refreshToken' // legacy
  ];

  authKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      console.log(`🗑️ Removing ${key}: ${value.substring(0, 20)}...`);
      localStorage.removeItem(key);
    }
  });

  // Dispatch auth state change
  window.dispatchEvent(new CustomEvent('authStateChanged', {
    detail: { user: null, isAuthenticated: false }
  }));

  console.log('✅ Tokens cleaned up successfully');
};

// Auto-run cleanup if detected corrupted tokens on page load
export const autoCleanupIfCorrupted = () => {
  try {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    // Check if tokens exist but are malformed
    if (accessToken && (!accessToken.includes('.') || accessToken.length < 50)) {
      cleanupTokens('Corrupted access token detected');
      return true;
    }
    
    if (refreshToken && (!refreshToken.includes('.') || refreshToken.length < 50)) {
      cleanupTokens('Corrupted refresh token detected');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking token corruption:', error);
    cleanupTokens('Error checking tokens');
    return true;
  }
};

// Add to window for manual debugging
if (typeof window !== 'undefined') {
  (window as typeof window & { cleanupTokens: typeof cleanupTokens }).cleanupTokens = cleanupTokens;
  console.log('🛠️ Debug: Use window.cleanupTokens() to manually clean tokens');
}
