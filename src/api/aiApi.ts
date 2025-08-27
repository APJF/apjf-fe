import axios from 'axios';
import { refreshToken } from '../services/authService';

// Get AI API base URL from environment variable
const getAIApiUrl = (): string => {
  let baseUrl = import.meta.env.VITE_AI_URL || 'http://localhost:8000/api';
  
  // Production fix: Force HTTPS if running on HTTPS site to avoid mixed content
  if (window.location.protocol === 'https:' && baseUrl.startsWith('http://')) {
    baseUrl = baseUrl.replace('http://', 'https://');
    console.log('🔒 Production: Converted HTTP to HTTPS for AI API:', baseUrl);
  }
  
  console.log('🌐 AI API Base URL:', baseUrl);
  return baseUrl;
};

// Create AI API instance for port 8000 with /api prefix
const aiApi = axios.create({
  baseURL: getAIApiUrl(),
  timeout: 30000, // 30 seconds for AI processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add access token to headers
aiApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('🤖 AI API Token:', token ? `${token.substring(0, 20)}...` : 'No token');
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }
    console.log('🌐 AI API Request URL:', (config.baseURL || '') + (config.url || ''));
    console.log('📦 AI API Request data:', config.data);
    return config;
  },
  (error: unknown) => {
    console.error('❌ AI API Request interceptor error:', error);
    return Promise.reject(new Error(error instanceof Error ? error.message : 'Request failed'));
  }
);

// Response interceptor: handle token expired and refresh
aiApi.interceptors.response.use(
  (response) => {
    console.log('✅ AI API Response:', response.status, response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response) {
      console.error('❌ AI API Error Response:', error.response.status, error.response.data);
      
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          console.log('🔄 Refreshing token for AI API...');
          await refreshToken();
          const newToken = localStorage.getItem('access_token');
          if (newToken) {
            originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
            return aiApi(originalRequest);
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed for AI API:', refreshError);
          // Redirect to login or handle as needed
          window.location.href = '/login';
          return Promise.reject(new Error('Authentication failed'));
        }
      }
    }

    return Promise.reject(new Error(error instanceof Error ? error.message : 'AI API request failed'));
  }
);

export default aiApi;
