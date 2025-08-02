import api from '@/api/axios';
import type { ChapterDetailApiResponse, UnitsApiResponse } from '@/types/course';

export const getChapterById = async (id: string) => {
  const response = await api.get<ChapterDetailApiResponse>(`/chapters/${id}`);
  return response.data;
};

export const getUnitsByChapterId = async (chapterId: string) => {
  const response = await api.get<UnitsApiResponse>(`/units/chapter/${chapterId}`);
  return response.data;
};
