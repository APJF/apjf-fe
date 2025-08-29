import api from '@/api/axios';

export interface UnitPassResponse {
  success: boolean;
  message: string;
  timestamp: number;
}

export interface ExamResult {
  examId: string;
  unitId: string;
  score: number;
  passed: boolean;
  completedAt: string;
}

/**
 * Mark a unit as passed/completed
 */
export const markUnitAsPass = async (unitId: string): Promise<UnitPassResponse> => {
  const response = await api.post<UnitPassResponse>(`/units/${unitId}/pass`);
  return response.data;
};

/**
 * Check if all exams in a unit are passed and mark unit as complete if so
 */
export const checkAndMarkUnitComplete = async (
  unitId: string, 
  examResults: ExamResult[]
): Promise<boolean> => {
  // Check if all exams are passed (score > 60%)
  const allExamsPassed = examResults.every(result => result.passed || result.score > 60);
  
  if (allExamsPassed) {
    try {
      const response = await markUnitAsPass(unitId);
      if (response.success) {
        console.log(`Unit ${unitId} marked as completed`);
        return true;
      }
    } catch (error) {
      console.error('Error marking unit as passed:', error);
    }
  }
  
  return false;
};

/**
 * Get user progress for a specific unit
 */
export const getUserUnitProgress = async (unitId: string) => {
  try {
    const response = await api.get(`/units/${unitId}/progress`);
    return response.data;
  } catch (error) {
    console.error('Error fetching unit progress:', error);
    return null;
  }
};

/**
 * Get exam results for a specific unit
 */
export const getUnitExamResults = async (unitId: string): Promise<ExamResult[]> => {
  try {
    const response = await api.get(`/units/${unitId}/exam-results`);
    return response.data.success ? response.data.data : [];
  } catch (error) {
    console.error('Error fetching unit exam results:', error);
    return [];
  }
};
