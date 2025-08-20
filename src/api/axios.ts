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

// Create a new Axios instance
const api: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    const publicEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh-token',
      '/auth/send-otp',
      '/auth/verify',
      '/auth/reset-password',
      '/oauth2/',
      '/courses', // Allow public access to courses
      '/roadmap', // Allow public access to roadmap
      '/forum', // Allow public access to forum
    ];

    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));

    // Only add token if user is authenticated AND endpoint is not explicitly public
    if (token && !isPublicEndpoint) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('Request Interceptor:', {
      url: config.url,
      hasAuth: !!config.headers['Authorization'],
      isPublic: isPublicEndpoint,
    });

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Variable to prevent infinite refresh loops
let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: Error) => void; }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor for handling token refresh and error messages
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 403 Forbidden - No permission
    if (error.response?.status === 403) {
      console.error('403 Forbidden - Insufficient permissions');
      if (showToast) {
        showToast('Bạn không có quyền truy cập chức năng này', 'error');
      }
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
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
        console.log(`DEBUG: Attempting to refresh token with value: "${refreshToken}"`);
        const { data } = await axios.post(
          `${getApiBaseUrl()}/auth/refresh-token`,
          { refresh_token: refreshToken },
          { 
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000 // 10 second timeout for refresh requests
          }
        );

        if (!data.success || !data.data || !data.data.access_token) {
          throw new Error('Invalid refresh response structure');
        }

        const newAccessToken = data.data.access_token;
        localStorage.setItem('access_token', newAccessToken);
        
        if (data.data.refresh_token) {
            localStorage.setItem('refresh_token', data.data.refresh_token);
        }

        console.log('Token refreshed successfully.');
        
        if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }
        
        processQueue(null, newAccessToken);
        return api(originalRequest);

      } catch (refreshError) {
        const err = refreshError as AxiosError;
        console.error('DEBUG: Token refresh API call failed.', {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message,
        });
        
        // If refresh token is also invalid/expired, clear everything
        if (err.response?.status === 401 || err.response?.status === 403) {
          console.error('DEBUG: Refresh token expired or invalid. Logging out.');
        }
        
        processQueue(err, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
