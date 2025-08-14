import api from '../api/axios';
import type { ApiResponse } from '../types/api';
import type { Review } from '@/types/review';

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
    const response = await api.get<ApiResponse<Review[]>>(`/reviews/${courseId}`);
    return response.data;
  },

  // Tạo một review mới
  createReview: async (data: CreateReviewData): Promise<ApiResponse<Review>> => {
    const response = await api.post<ApiResponse<Review>>('/reviews', data);
    return response.data;
  },

  // Cập nhật một review đã có
  updateReview: async (reviewId: number, data: UpdateReviewData): Promise<ApiResponse<Review>> => {
    const response = await api.put<ApiResponse<Review>>(`/reviews/${reviewId}`, data);
    return response.data;
  },

  // Xóa một review
  deleteReview: async (reviewId: number): Promise<ApiResponse<string>> => {
    const response = await api.delete<ApiResponse<string>>(`/reviews/${reviewId}`);
    return response.data;
  },
};
