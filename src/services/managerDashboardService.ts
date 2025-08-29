import api from '../api/axios';

// Types for Dashboard API
interface DashboardStats {
  totalCourse: number;
  totalActiveCourse: number;
  totalInactiveCourse: number;
  totalChapter: number;
  totalActiveChapter: number;
  totalInactiveChapter: number;
  totalUnit: number;
  totalActiveUnit: number;
  totalInactiveUnit: number;
  totalMaterial: number;
  totalExam: number;
  coursesTotalCompletedPercent: CourseCompletionData[];
  courseMonthlyActivity: MonthlyActivityData[];
}

interface CourseCompletionData {
  id: string;
  title: string;
  level: string;
  totalCompleted: number;
  totalEnrolled: number;
  percent: number;
}

interface MonthlyActivityData {
  month: string;
  totalEnrolled: number;
  totalCompleted: number;
}

interface DashboardApiResponse {
  success: boolean;
  message: string;
  data: DashboardStats;
  timestamp: number;
}

export class ManagerDashboardService {
  static async getDashboardStats(): Promise<DashboardApiResponse> {
    const token = localStorage.getItem('access_token');
    const response = await api.get('/approval-requests/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
}

export type { DashboardStats, CourseCompletionData, MonthlyActivityData, DashboardApiResponse };
