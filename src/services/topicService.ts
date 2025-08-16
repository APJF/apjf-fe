import type { Topic } from '../types/topic';
import api from '../api/axios';

export interface TopicsApiResponse {
  success: boolean;
  message: string;
  data: Topic[];
  timestamp: number;
}

export class TopicService {
  // Get all topics
  static async getAllTopics(): Promise<TopicsApiResponse> {
    const response = await api.get('/topics');
    return response.data;
  }
}
