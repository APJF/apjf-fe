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
