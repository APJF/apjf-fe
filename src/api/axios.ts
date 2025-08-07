import axios from 'axios';
import type { AxiosError, AxiosRequestConfig, AxiosInstance } from 'axios';

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
    ];

    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));

    if (token && !isPublicEndpoint) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('Request Interceptor:', {
      url: config.url,
      hasAuth: !!config.headers['Authorization'],
    });

    return config;
  },
  (error: Error) => {
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

// Response interceptor for handling token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
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
        .catch((err: Error) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        console.error('DEBUG: No refresh token found in localStorage. Logging out.');
        localStorage.clear();
        window.location.href = '/login';
        isRefreshing = false;
        return Promise.reject(new Error('No refresh token available'));
      }

      try {
        console.log(`DEBUG: Attempting to refresh token with value: "${refreshToken}"`);
        const { data } = await axios.post(
          `${getApiBaseUrl()}/auth/refresh-token`,
          { refresh_token: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

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
        const errorToReject = refreshError instanceof Error 
            ? refreshError 
            : new Error(err.message || 'Token refresh failed');
        processQueue(errorToReject, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(errorToReject);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error instanceof Error ? error : new Error('Unknown error'));
  }
);

export default api;
