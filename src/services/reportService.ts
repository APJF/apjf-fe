import api from '../api/axios';

// Report API - Updated for new endpoints
export const reportApi = {
  // Report post using new API
  reportPost: async (postId: number, content: string) => {
    const response = await api.post('/post-reports', {
      postId,
      content
    });
    return response.data;
  },

  // Report comment using new API  
  reportComment: async (commentId: number, content: string) => {
    const response = await api.post('/comment-reports', {
      commentId,
      content
    });
    return response.data;
  },

  // Legacy method for backward compatibility
  createReport: async (reportData: {
    targetType: 'post' | 'comment';
    targetId: string;
    reason: string;
  }) => {
    if (reportData.targetType === 'post') {
      return await reportApi.reportPost(parseInt(reportData.targetId), reportData.reason);
    } else {
      return await reportApi.reportComment(parseInt(reportData.targetId), reportData.reason);
    }
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
