import axios from 'axios';
import type { AxiosError, AxiosRequestConfig, AxiosInstance } from 'axios';

// Import toast for error notifications
let showToast: ((message: string, type: 'error' | 'success' | 'info') => void) | null = null;

// Function to set toast function (will be called from main app)
export const setToastFunction = (toastFn: (message: string, type: 'error' | 'success' | 'info') => void) => {
  showToast = toastFn;
};

// Function to get the API base URL
const getApiBaseUrl = (): string => {
  // Using Vite's import.meta.env for environment variables
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
};

// Define public endpoints that don't require authentication
const publicEndpoints = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh-token',
  '/auth/send-otp',
  '/auth/verify',
  '/auth/reset-password',
  '/oauth2/',
  '/courses', // Allow public access to courses and course details
  '/topics', // Allow public access to topics
  '/roadmap', // Allow public access to roadmap
  '/courses/*', // Allow access to course details and related endpoints
];

// Create a new Axios instance
const api: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// Variables for token refresh logic
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add the auth token to headers
api.interceptors.request.use(
  async (config) => {
    // Try to refresh token proactively if needed
    const validToken = await refreshTokenIfNeeded();
    const token = validToken || localStorage.getItem('access_token');
    
    const isPublicEndpoint = publicEndpoints.some((endpoint: string) => {
      if (endpoint.endsWith('/*')) {
        const basePattern = endpoint.slice(0, -2);
        return config.url?.startsWith(basePattern);
      }
      return config.url === endpoint;
    });

    // Log request details
    console.log('Request Interceptor:', {
      url: config.url,
      hasAuth: !!token,
      isPublic: isPublicEndpoint,
      tokenRefreshed: validToken !== null
    });

    // Add token to headers if available and not a public endpoint
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle different error status codes
    if (error.response?.status === 400) {
      console.error('Bad Request (400):', error.response.data);
      if (showToast) {
        const errorMessage = (error.response.data as any)?.message || 'Yêu cầu không hợp lệ';
        showToast(errorMessage, 'error');
      }
    }

    if (error.response?.status === 403) {
      console.error('Forbidden (403):', error.response.data);
      if (showToast) {
        showToast('Bạn không có quyền truy cập chức năng này', 'error');
      }
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url || '';
      
      // Check if this is a public endpoint
      const isPublicEndpoint = publicEndpoints.some((endpoint: string) => {
        if (endpoint.endsWith('/*')) {
          const basePattern = endpoint.slice(0, -2);
          return url.startsWith(basePattern);
        }
        return url === endpoint;
      });

      if (isPublicEndpoint) {
        console.error(`401 Unauthorized on public endpoint: ${url}`);
        if (showToast) {
          showToast('Không thể truy cập tài nguyên này', 'error');
        }
        return Promise.reject(error);
      }

      // Check if user has no token at all (not logged in)
      const hasToken = !!localStorage.getItem('access_token');
      if (!hasToken) {
        console.error('401 Unauthorized - Not logged in');
        if (showToast) {
          showToast('Bạn cần đăng nhập để sử dụng chức năng này', 'error');
        }
        return Promise.reject(error);
      }

      // Token exists but expired, try to refresh
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(token => {
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
          }
          return api(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        console.error('DEBUG: No refresh token found in localStorage. Logging out.');
        isRefreshing = false;
        processQueue(new Error('No refresh token'), null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        console.log(`DEBUG: Attempting to refresh token with refresh_token: ${refreshToken?.substring(0, 20)}...`);
        const refreshResponse = await axios.post(
          `${getApiBaseUrl()}/auth/refresh-token`,
          { refresh_token: refreshToken },
          { 
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000 // 10 second timeout for refresh requests
          }
        );

        console.log('DEBUG: Refresh response status:', refreshResponse.status);
        console.log('DEBUG: Refresh response data:', JSON.stringify(refreshResponse.data, null, 2));

        const data = refreshResponse.data;
        if (!data?.success || !data?.data?.access_token) {
          throw new Error(`Invalid refresh response: ${JSON.stringify(data)}`);
        }

        const newAccessToken = data.data.access_token;
        console.log(`DEBUG: New access token received: ${newAccessToken?.substring(0, 20)}...`);
        
        localStorage.setItem('access_token', newAccessToken);
        
        if (data.data.refresh_token) {
          console.log(`DEBUG: New refresh token received: ${data.data.refresh_token?.substring(0, 20)}...`);
          localStorage.setItem('refresh_token', data.data.refresh_token);
        } else {
          console.log('DEBUG: No new refresh token in response, keeping existing one');
        }

        isRefreshing = false;
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
        }

        console.log('DEBUG: Token refreshed successfully, retrying original request');
        return api(originalRequest);
      } catch (refreshError: any) {
        console.error('DEBUG: Token refresh failed:', refreshError);
        isRefreshing = false;
        processQueue(refreshError, null);
        
        // If refresh token is also invalid, clear storage and redirect
        if (refreshError.response?.status === 400 || refreshError.response?.status === 401) {
          console.log('DEBUG: Refresh token invalid, clearing storage and redirecting to login');
          localStorage.clear();
          if (showToast) {
            showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
          }
          // Small delay before redirect to ensure toast is shown
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        } else if (showToast) {
          showToast('Lỗi kết nối. Vui lòng thử lại sau.', 'error');
        }
        
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      if (showToast) {
        showToast('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.', 'error');
      }
    }

    return Promise.reject(error);
  }
);

// Utility function to clear corrupted tokens
export const clearCorruptedTokens = () => {
  try {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (accessToken && !isValidJWT(accessToken)) {
      console.warn('Removing corrupted access token');
      localStorage.removeItem('access_token');
    }
    
    if (refreshToken && !isValidJWT(refreshToken)) {
      console.warn('Removing corrupted refresh token');
      localStorage.removeItem('refresh_token');
    }
  } catch (error) {
    console.error('Error checking tokens:', error);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

// Simple JWT validation
const isValidJWT = (token: string): boolean => {
  try {
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  } catch {
    return false;
  }
};

// Check if token is expired (or close to expiry)
const isTokenExpired = (token: string): boolean => {
  try {
    if (!isValidJWT(token)) return true;
    
    const base64Payload = token.split('.')[1];
    const payload = JSON.parse(atob(base64Payload));
    
    if (!payload.exp) return false;
    
    // Consider token expired if it expires within next 5 minutes (300 seconds)
    const expiryTime = payload.exp * 1000;
    const currentTime = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    
    const isExpired = (expiryTime - currentTime) <= bufferTime;
    
    if (isExpired) {
      console.log('DEBUG: Token is expired or will expire soon', {
        expiryTime: new Date(expiryTime).toISOString(),
        currentTime: new Date(currentTime).toISOString(),
        timeLeft: Math.floor((expiryTime - currentTime) / 1000 / 60) + ' minutes'
      });
    }
    
    return isExpired;
  } catch (error) {
    console.warn('DEBUG: Error checking token expiry:', error);
    return true;
  }
};

// Proactive token refresh function
const refreshTokenIfNeeded = async (): Promise<string | null> => {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  
  // Validate tokens exist and are not corrupted
  if (!accessToken || !refreshToken || 
      accessToken.trim() === '' || refreshToken.trim() === '' ||
      accessToken === 'null' || refreshToken === 'null' ||
      accessToken === 'undefined' || refreshToken === 'undefined') {
    console.log('DEBUG: Invalid or missing tokens, clearing storage');
    localStorage.clear();
    return null;
  }
  
  if (!isTokenExpired(accessToken)) {
    return accessToken; // Token is still valid
  }
  
  console.log('DEBUG: Proactively refreshing expired token');
  
  try {
    const refreshResponse = await axios.post(
      `${getApiBaseUrl()}/auth/refresh-token`,
      { refresh_token: refreshToken.trim() },
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
    
    const data = refreshResponse.data;
    if (data?.success && data?.data?.access_token) {
      const newAccessToken = data.data.access_token;
      
      // Validate new token before saving
      if (!newAccessToken || newAccessToken.trim() === '') {
        console.error('DEBUG: Invalid new access token received');
        return null;
      }
      
      localStorage.setItem('access_token', newAccessToken);
      
      if (data.data.refresh_token && data.data.refresh_token.trim() !== '') {
        localStorage.setItem('refresh_token', data.data.refresh_token);
      }
      
      console.log('DEBUG: Proactive token refresh successful');
      return newAccessToken;
    } else {
      console.error('DEBUG: Invalid refresh response:', data);
      return null;
    }
  } catch (error: any) {
    console.warn('DEBUG: Proactive token refresh failed:', error);
    
    // If refresh token is invalid, clear storage but don't redirect during exam
    if (error?.response?.status === 400 || error?.response?.status === 401) {
      console.log('DEBUG: Refresh token invalid, clearing storage');
      localStorage.clear();
    }
    return null;
  }
};

export default api;
