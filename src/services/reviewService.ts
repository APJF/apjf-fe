import api from '../api/axios';
import type { ApiResponse } from '../types/api';
import type { Review } from '@/types/review';
import type { AxiosError } from 'axios';

// Định nghĩa kiểu cho dữ liệu tạo review
export interface CreateReviewData {
  courseId: string;
  rating: number;
  comment: string;
}

// Định nghĩa kiểu cho dữ liệu cập nhật review
export interface UpdateReviewData {
  courseId: string;
  rating: number;
  comment: string;
}

export const ReviewService = {
  // Lấy tất cả review của một khóa học
  getReviewsByCourseId: async (courseId: string): Promise<ApiResponse<Review[]>> => {
    try {
      console.log('🔍 ReviewService.getReviewsByCourseId - Starting with courseId:', courseId);
      const url = `/reviews/${courseId}`;
      console.log('📡 GET Request URL:', url);
      
      const response = await api.get<ApiResponse<Review[]>>(url);
      console.log('✅ ReviewService.getReviewsByCourseId - Success:', response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('❌ ReviewService.getReviewsByCourseId - Error:', axiosError);
      console.error('📋 Error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message,
        url: axiosError.config?.url,
        method: axiosError.config?.method
      });
      throw error;
    }
  },

  // Tạo một review mới
  createReview: async (data: CreateReviewData): Promise<ApiResponse<Review>> => {
    try {
      console.log('🔍 ReviewService.createReview - Starting with data:', data);
      const url = '/reviews';
      console.log('📡 POST Request URL:', url);
      console.log('📤 POST Request payload:', JSON.stringify(data, null, 2));
      
      const response = await api.post<ApiResponse<Review>>(url, data);
      console.log('✅ ReviewService.createReview - Success:', response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('❌ ReviewService.createReview - Error:', axiosError);
      console.error('📋 Error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message,
        url: axiosError.config?.url,
        method: axiosError.config?.method,
        requestData: axiosError.config?.data
      });
      
      // Additional detailed error logging
      if (axiosError.response?.data) {
        console.error('🚨 Server Error Response Details:');
        console.error('📄 Response Data:', JSON.stringify(axiosError.response.data, null, 2));
      }
      
      if (axiosError.config?.data) {
        console.error('📤 Request Data Sent:', JSON.stringify(JSON.parse(axiosError.config.data), null, 2));
      }
      
      throw error;
    }
  },

  // Cập nhật một review đã có
  updateReview: async (reviewId: number, data: UpdateReviewData): Promise<ApiResponse<Review>> => {
    try {
      console.log('🔍 ReviewService.updateReview - Starting with reviewId:', reviewId, 'data:', data);
      const url = `/reviews/${reviewId}`;
      console.log('📡 PUT Request URL:', url);
      console.log('📤 PUT Request payload:', JSON.stringify(data, null, 2));
      
      const response = await api.put<ApiResponse<Review>>(url, data);
      console.log('✅ ReviewService.updateReview - Success:', response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('❌ ReviewService.updateReview - Error:', axiosError);
      console.error('📋 Error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message,
        url: axiosError.config?.url,
        method: axiosError.config?.method,
        requestData: axiosError.config?.data
      });
      throw error;
    }
  },

  // Xóa một review
  deleteReview: async (reviewId: number): Promise<ApiResponse<string>> => {
    try {
      console.log('🔍 ReviewService.deleteReview - Starting with reviewId:', reviewId);
      const url = `/reviews/${reviewId}`;
      console.log('📡 DELETE Request URL:', url);
      
      const response = await api.delete<ApiResponse<string>>(url);
      console.log('✅ ReviewService.deleteReview - Success:', response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('❌ ReviewService.deleteReview - Error:', axiosError);
      console.error('📋 Error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message,
        url: axiosError.config?.url,
        method: axiosError.config?.method
      });
      throw error;
    }
  },
};
