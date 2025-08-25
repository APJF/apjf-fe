/**
 * Token debugging utilities for troubleshooting authentication issues
 */

// Debug token information
export const debugTokenInfo = () => {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  
  console.log('🔍 TOKEN DEBUG INFO');
  console.log('===================');
  
  if (accessToken) {
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = payload.exp - currentTime;
        
        console.log('📝 Access Token Info:');
        console.log(`   - Token: ${accessToken.substring(0, 30)}...`);
        console.log(`   - Issued at: ${new Date(payload.iat * 1000).toLocaleString()}`);
        console.log(`   - Expires at: ${new Date(payload.exp * 1000).toLocaleString()}`);
        console.log(`   - Time until expiry: ${Math.floor(timeUntilExpiry / 60)} minutes`);
        console.log(`   - Is expired: ${timeUntilExpiry <= 0 ? 'YES' : 'NO'}`);
        console.log(`   - Subject: ${payload.sub || 'N/A'}`);
      }
    } catch (error) {
      console.log(`❌ Access Token: INVALID (${error})`);
    }
  } else {
    console.log('❌ Access Token: NOT FOUND');
  }
  
  if (refreshToken) {
    try {
      const parts = refreshToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = payload.exp - currentTime;
        
        console.log('🔄 Refresh Token Info:');
        console.log(`   - Token: ${refreshToken.substring(0, 30)}...`);
        console.log(`   - Issued at: ${new Date(payload.iat * 1000).toLocaleString()}`);
        console.log(`   - Expires at: ${new Date(payload.exp * 1000).toLocaleString()}`);
        console.log(`   - Time until expiry: ${Math.floor(timeUntilExpiry / 60)} minutes`);
        console.log(`   - Is expired: ${timeUntilExpiry <= 0 ? 'YES' : 'NO'}`);
      }
    } catch (error) {
      console.log(`❌ Refresh Token: INVALID (${error})`);
    }
  } else {
    console.log('❌ Refresh Token: NOT FOUND');
  }
  
  console.log('===================');
};

// Test token refresh
export const testTokenRefresh = async () => {
  console.log('🧪 TESTING TOKEN REFRESH');
  
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    console.log('❌ No refresh token found');
    return;
  }
  
  try {
    const response = await fetch('http://localhost:8080/api/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    
    const data = await response.json();
    
    console.log('📡 Refresh Response:');
    console.log(`   - Status: ${response.status}`);
    console.log(`   - Success: ${data.success}`);
    console.log(`   - Message: ${data.message}`);
    
    if (data.success && data.data) {
      console.log('✅ New tokens received:');
      console.log(`   - Access Token: ${data.data.access_token?.substring(0, 30)}...`);
      console.log(`   - Refresh Token: ${data.data.refresh_token ? data.data.refresh_token?.substring(0, 30) + '...' : 'NOT PROVIDED'}`);
      
      // Update tokens
      localStorage.setItem('access_token', data.data.access_token);
      if (data.data.refresh_token) {
        localStorage.setItem('refresh_token', data.data.refresh_token);
      }
      
      console.log('🔄 Tokens updated in localStorage');
    } else {
      console.log('❌ Refresh failed:', data);
    }
  } catch (error) {
    console.log('❌ Refresh error:', error);
  }
};

// Add to window for manual debugging
if (typeof window !== 'undefined') {
  (window as typeof window & { 
    debugTokenInfo: typeof debugTokenInfo;
    testTokenRefresh: typeof testTokenRefresh;
  }).debugTokenInfo = debugTokenInfo;
  (window as typeof window & { 
    debugTokenInfo: typeof debugTokenInfo;
    testTokenRefresh: typeof testTokenRefresh;
  }).testTokenRefresh = testTokenRefresh;
  
  console.log('🛠️ Debug utilities available:');
  console.log('   - window.debugTokenInfo() - Show token information');  
  console.log('   - window.testTokenRefresh() - Test token refresh');
}
