const API_URL_AI = "http://localhost:8090";

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
      console.error("API Error Details:", errorData);
    } catch {
      errorData = { detail: "An unknown error occurred, and the response was not valid JSON." };
    }
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }
  if (response.status === 204) {
    return null; // No content
  }
  return response.json();
};

const getToken = () => localStorage.getItem('token');

const api = {
  post: async (endpoint: string, body: Record<string, unknown>) => {
    const token = getToken();
    const response = await fetch(`${API_URL_AI}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },
  get: async (endpoint: string) => {
    const token = getToken();
    const response = await fetch(`${API_URL_AI}${endpoint}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return handleResponse(response);
  },
  delete: async (endpoint: string) => {
    const token = getToken();
    const response = await fetch(`${API_URL_AI}${endpoint}`, {
      method: 'DELETE',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (response.status === 204) {
      return null;
    }
    return handleResponse(response);
  },
  put: async (endpoint: string, body: Record<string, unknown>) => {
    const token = getToken();
    const response = await fetch(`${API_URL_AI}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },
};

export const chatbotService = {
  invokeStateless: (userInput: string) => {
    return api.post('/chat/invoke/stateless', { user_input: userInput });
  },

  invoke: (sessionId: number, userInput: string) => {
    return api.post('/chat/invoke', { session_id: sessionId.toString(), user_input: userInput });
  },

  editAndResubmit: (sessionId: number, correctedInput: string) => {
    return api.post('/chat/edit_and_resubmit', { session_id: sessionId, corrected_input: correctedInput });
  },

  createSession: (userId: string, sessionName: string) => {
    return api.post('/sessions/', { user_id: userId, session_name: sessionName });
  },

  getSessions: (userId: string) => {
    return api.get(`/sessions/user/${userId}`);
  },

  getSessionHistory: (sessionId: number) => {
    return api.get(`/sessions/${sessionId}/history`);
  },

  deleteSession: (sessionId: number) => {
    return api.delete(`/sessions/${sessionId}`);
  },

  renameSession: (sessionId: number, newName: string) => {
    return api.put(`/sessions/${sessionId}/rename`, { new_name: newName });
  },
};
