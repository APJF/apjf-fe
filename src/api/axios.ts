import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import authService, { refreshToken } from '../services/authService';

interface CustomAxiosError {
  config: AxiosRequestConfig & { _retry?: boolean };
  response?: { status: number; data?: unknown; statusText?: string };
  request?: unknown;
  message?: string;
}

const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const isAxiosError = (error: unknown): error is CustomAxiosError => {
  return typeof error === 'object' && error !== null && 'config' in error;
};

const shouldHandleTokenRefresh = (
  config?: AxiosRequestConfig & { _retry?: boolean },
  response?: { status?: number }
): boolean => {
  return (
    config?.url !== '/auth/login' &&
    config?.url !== '/auth/refresh-token' &&
    response?.status === 401 &&
    !config?._retry
  );
};

const handleTokenRefresh = async (config: AxiosRequestConfig & { _retry?: boolean }) => {
  const updatedConfig = { ...config, _retry: true };
  const refreshResponse = await refreshToken();
  
  if (!refreshResponse.success) {
    throw new Error(refreshResponse.message || 'Token refresh failed');
  }
  
  return instance(updatedConfig);
};

const handleAuthError = (error: unknown) => {
  console.error('Authentication error:', error);
  authService.logout();
  window.location.href = '/login';
};

instance.interceptors.request.use(
  (config) => {
    // Danh sách các endpoint không cần token
    const publicEndpoints = [
      '/auth/register',
      '/auth/login',
      '/auth/verify',
      '/auth/resend-otp',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/refresh-token'
    ];

    // Kiểm tra xem URL hiện tại có phải là public endpoint không
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );

    if (!isPublicEndpoint) {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error: unknown) => {
    if (error instanceof Error) {
      return Promise.reject(error);
    }
    return Promise.reject(new Error('Request failed'));
  }
);

instance.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err: unknown) => {
    if (!isAxiosError(err)) {
      return Promise.reject(err instanceof Error ? err : new Error('Unknown error occurred'));
    }

    const { config: originalConfig, response } = err;

    // Nếu là lỗi từ auth endpoint, trả về lỗi nguyên gốc để component xử lý
    if (originalConfig?.url?.includes('/auth/')) {
      return Promise.reject(err instanceof Error ? err : new Error('Auth request failed'));
    }

    if (!originalConfig || !shouldHandleTokenRefresh(originalConfig, response)) {
      return Promise.reject(err instanceof Error ? err : new Error('Request failed'));
    }

    try {
      return await handleTokenRefresh(originalConfig);
    } catch (refreshError) {
      handleAuthError(refreshError);
      return Promise.reject(refreshError instanceof Error ? refreshError : new Error('Authentication failed'));
    }
  }
);

export default instance;
