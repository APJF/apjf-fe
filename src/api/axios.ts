import axios from 'axios';
import { refreshToken } from '../services/authService';

const instance = axios.create({
  baseURL: 'http://localhost:8080/api',
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('Request interceptor - Token:', token ? `${token.substring(0, 20)}...` : 'No token');
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
      console.log('Authorization header set:', config.headers['Authorization'] ? 'Yes' : 'No');
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(new Error(error instanceof Error ? error.message : 'Request failed'));
  }
);

instance.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err: unknown) => {
    // Enhanced logging for debugging
    console.log('🔍 Response interceptor - Full error:', err);
    
    // Type guard to check if err is an axios error
    const isAxiosError = (error: unknown): error is { 
      config: { url?: string; _retry?: boolean }; 
      response?: { status: number; data?: unknown; statusText?: string }; 
      request?: unknown;
      message?: string;
    } => {
      return typeof error === 'object' && error !== null && 'config' in error;
    };

    if (!isAxiosError(err)) {
      console.log('❌ Not an axios error:', err);
      return Promise.reject(new Error('Unknown error occurred'));
    }

    const originalConfig = err.config;
    
    // Enhanced error logging
    console.log('🔍 Axios error details:', {
      url: originalConfig?.url,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      message: err.message,
      hasResponse: !!err.response,
      hasRequest: !!err.request
    });

    if (originalConfig?.url !== '/auth/login' && err.response) {
      // Access Token was expired
      if (err.response.status === 401 && !originalConfig._retry) {
        console.log('🔄 Token expired, attempting refresh...');
        originalConfig._retry = true;

        try {
          await refreshToken();
          console.log('✅ Token refreshed successfully');
          return instance(originalConfig);
        } catch (_error: unknown) {
          console.log('❌ Token refresh failed:', _error);
          return Promise.reject(new Error(_error instanceof Error ? _error.message : 'Token refresh failed'));
        }
      }
    }

    // Return more detailed error information
    const responseData = err.response?.data as { message?: string } | undefined;
    const errorMessage = responseData?.message || err.message || 'Response failed';
    return Promise.reject(new Error(errorMessage));
  }
);

export default instance;
