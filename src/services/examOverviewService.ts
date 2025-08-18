import aiApi from "../api/aiApi";

// Types for AI Overview API
export type ExamSection = "GRAMMAR" | "KANJI" | "VOCAB" | "READING" | "LISTENING";

export interface AIOverviewResponse {
  exam_result_id: string;
  advice: {
    summary: { 
      total_questions: number; 
      correct: number; 
      wrong: number; 
      accuracy_percent: number 
    };
    by_section: Array<{
      section: ExamSection;
      total: number;
      correct: number;
      wrong: number;
      accuracy_percent: number;
    }>;
    strengths: ExamSection[];
    weaknesses: ExamSection[];
    notes: string[];
  };
}

// API service functions
export const examOverviewService = {
  /**
   * Get AI overview for exam result
   * POST /api/exam/overview (port 8000)
   * @param examResultId - The exam result ID
   * @returns Promise<AIOverviewResponse>
   */
  async getOverview(examResultId: string): Promise<AIOverviewResponse> {
    console.log("🤖 Calling AI overview API for exam result:", examResultId);
    
    try {
      const requestBody = {
        exam_result_id: examResultId
      };
      
      console.log("🤖 AI overview API request body:", requestBody);
      
      const response = await aiApi.post('/exam/overview', requestBody);
      
      console.log("🤖 AI overview API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error calling AI overview API:", error);
      throw error;
    }
  }
};
