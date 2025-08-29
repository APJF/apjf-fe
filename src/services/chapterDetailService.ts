import api from '@/api/axios';
import type { ChapterDetailApiResponse, UnitsApiResponse } from '@/types/course';
import type { MaterialsApiResponse } from '@/types/material';

export const getChapterById = async (id: string) => {
  const response = await api.get<ChapterDetailApiResponse>(`/chapters/${id}`);
  return response.data;
};

export const getUnitsByChapterId = async (chapterId: string) => {
  const response = await api.get<UnitsApiResponse>(`/chapters/${chapterId}/units`);
  return response.data;
};

export const getMaterialsByUnitId = async (unitId: string) => {
  const response = await api.get<MaterialsApiResponse>(`/units/${unitId}/materials`);
  return response.data;
};

// Interface for Unit Exam
export interface UnitExam {
  id: string;
  title: string;
  description: string;
  duration: number;
  type: string;
  examScopeType: string;
  gradingMethod: string;
  courseId: string | null;
  chapterId: string | null;
  unitId: string;
  createdAt: string;
  totalQuestions: number;
}

export interface UnitExamsResponse {
  success: boolean;
  message: string;
  data: UnitExam[];
  timestamp: number;
}

export interface UnitPassResponse {
  success: boolean;
  message: string;
  timestamp: number;
}

export const getExamsByUnitId = async (unitId: string) => {
  const response = await api.get<UnitExamsResponse>(`/units/${unitId}/exams`);
  return response.data;
};

export const markUnitAsPass = async (unitId: string) => {
  const response = await api.post<UnitPassResponse>(`/units/${unitId}/pass`);
  return response.data;
};

// Interface for Unit Detail API Response
export interface UnitDetailData {
  id: string;
  title: string;
  description: string;
  status: string;
  chapterId: string;
  prerequisiteUnitId: string | null;
  isCompleted: boolean;
}

export interface UnitDetailResponse {
  success: boolean;
  message: string;
  data: UnitDetailData;
  timestamp: number;
}

export const getUnitDetail = async (unitId: string) => {
  const response = await api.get<UnitDetailResponse>(`/units/${unitId}/detail`);
  return response.data;
};

// Interface for Chapter Exam
export interface ChapterExam {
  id: string;
  title: string;
  description: string;
  duration: number;
  type: string;
  examScopeType: string;
  gradingMethod: string;
  courseId: string | null;
  chapterId: string;
  unitId: string | null;
  createdAt: string;
  totalQuestions: number;
}

export interface ChapterExamsResponse {
  success: boolean;
  message: string;
  data: ChapterExam[];
  timestamp: number;
}

export const getExamsByChapterId = async (chapterId: string) => {
  const response = await api.get<ChapterExamsResponse>(`/chapters/${chapterId}/exams`);
  return response.data;
};
