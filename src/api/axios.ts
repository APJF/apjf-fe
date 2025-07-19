import axios from 'axios';
import { refreshToken } from '../services/authService';

const instance = axios.create({
  baseURL: 'http://localhost:8080/api',
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
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
    // Type guard to check if err is an axios error
    const isAxiosError = (error: unknown): error is { 
      config: { url?: string; _retry?: boolean }; 
      response?: { status: number }; 
    } => {
      return typeof error === 'object' && error !== null && 'config' in error;
    };

    if (!isAxiosError(err)) {
      return Promise.reject(new Error('Unknown error occurred'));
    }

    const originalConfig = err.config;

    if (originalConfig?.url !== '/auth/login' && err.response) {
      // Access Token was expired
      if (err.response.status === 401 && !originalConfig._retry) {
        originalConfig._retry = true;

        try {
          await refreshToken();
          return instance(originalConfig);
        } catch (_error: unknown) {
          return Promise.reject(new Error(_error instanceof Error ? _error.message : 'Token refresh failed'));
        }
      }
    }

    return Promise.reject(new Error(err instanceof Error ? err.message : 'Response failed'));
  }
);

export default instance;
