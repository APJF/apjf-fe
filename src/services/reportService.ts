import axios from 'axios';
import { refreshToken } from './authService';

const apiInstance = axios.create({
  baseURL: 'http://localhost:8080/api/',
});

// Request interceptor: thêm access token vào header
apiInstance.interceptors.request.use(
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

// Response interceptor: tự động refresh token khi 401
apiInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalConfig = err.config;

    if (err.response?.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;
      try {
        const result = await refreshToken();
        const newToken = result.data?.access_token;
        if (newToken) {
          originalConfig.headers['Authorization'] = 'Bearer ' + newToken;
          return apiInstance(originalConfig);
        } else {
          throw new Error('No access token received');
        }
      } catch (error) {
        console.error('Refresh token failed:', error);
        // Redirect to login or handle logout
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(err);
  }
);

// Report API
export const reportApi = {
  createReport: async (reportData: {
    targetType: 'post' | 'comment';
    targetId: string;
    reason: string;
  }) => {
    const response = await apiInstance.post('/reports', reportData);
    return response.data;
  },

  getUserReports: async () => {
    const response = await apiInstance.get('/reports/user');
    return response.data;
  },

  getReportById: async (reportId: string) => {
    const response = await apiInstance.get(`/reports/${reportId}`);
    return response.data;
  },
};
