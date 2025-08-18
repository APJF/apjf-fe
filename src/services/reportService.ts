import api from '../api/axios';

// Report API
export const reportApi = {
  createReport: async (reportData: {
    targetType: 'post' | 'comment';
    targetId: string;
    reason: string;
  }) => {
    const response = await api.post('/reports', reportData);
    return response.data;
  },

  getUserReports: async () => {
    const response = await api.get('/reports/user');
    return response.data;
  },

  getReportById: async (reportId: string) => {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
  },
};
