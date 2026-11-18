import {
  UserProfile,
  DatasetMetadata,
  DatasetOverview,
  DataPreviewResponse,
  CleaningOperation,
  CleanResponse,
  ChartRecommendation,
  ChartDataRequest,
  ChartDataResponse,
  ChatMessage
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function getHeaders(isFormData = false): HeadersInit {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const err = await res.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch {
      errorDetail = res.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // --- Auth ---
  register: async (data: { email: string; password: string; name: string }) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ token: string; user: UserProfile }>(res);
  },

  login: async (data: { email: string; password: string }) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ token: string; user: UserProfile }>(res);
  },

  forgotPassword: async (email: string) => {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse<{ message: string }>(res);
  },

  resetPassword: async (data: { email: string; confirmation_code: string; new_password: string }) => {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string }>(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse<UserProfile>(res);
  },

  // --- Datasets ---
  getDatasets: async () => {
    const res = await fetch(`${API_BASE}/api/datasets`, {
      headers: getHeaders(),
    });
    return handleResponse<DatasetMetadata[]>(res);
  },

  getDataset: async (id: string) => {
    const res = await fetch(`${API_BASE}/api/datasets/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse<DatasetMetadata>(res);
  },

  uploadDataset: async (file: File, name?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);

    const res = await fetch(`${API_BASE}/api/datasets/upload`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData,
    });
    return handleResponse<DatasetMetadata>(res);
  },

  deleteDataset: async (id: string) => {
    const res = await fetch(`${API_BASE}/api/datasets/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  seedSamples: async () => {
    const res = await fetch(`${API_BASE}/api/datasets/seed-samples`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<DatasetMetadata[]>(res);
  },

  getDownloadUrl: (storageKey: string, filename: string) => {
    return `${API_BASE}/api/datasets/download/${storageKey}?filename=${encodeURIComponent(filename)}`;
  },

  // --- Analysis ---
  getAnalysis: async (datasetId: string) => {
    const res = await fetch(`${API_BASE}/api/analysis/${datasetId}`, {
      headers: getHeaders(),
    });
    return handleResponse<DatasetOverview>(res);
  },

  getPreview: async (datasetId: string, page = 1, pageSize = 15, search = '') => {
    const url = new URL(`${API_BASE}/api/analysis/${datasetId}/preview`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', String(pageSize));
    if (search) url.searchParams.set('search', search);

    const res = await fetch(url.toString(), {
      headers: getHeaders(),
    });
    return handleResponse<DataPreviewResponse>(res);
  },

  // --- Cleaning ---
  cleanDataset: async (datasetId: string, ops: CleaningOperation) => {
    const res = await fetch(`${API_BASE}/api/cleaning/${datasetId}/clean`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(ops),
    });
    return handleResponse<CleanResponse>(res);
  },

  // --- Visualizations ---
  getRecommendations: async (datasetId: string) => {
    const res = await fetch(`${API_BASE}/api/visualization/${datasetId}/recommendations`, {
      headers: getHeaders(),
    });
    return handleResponse<ChartRecommendation[]>(res);
  },

  getChartData: async (req: ChartDataRequest) => {
    const res = await fetch(`${API_BASE}/api/visualization/data`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(req),
    });
    return handleResponse<ChartDataResponse>(res);
  },

  // --- Chatbot ---
  sendChatMessage: async (datasetId: string, message: string, conversationId?: string) => {
    const res = await fetch(`${API_BASE}/api/chatbot/message`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        dataset_id: datasetId,
        message,
        conversation_id: conversationId,
      }),
    });
    return handleResponse<ChatMessage>(res);
  },

  getChatHistory: async (datasetId: string, conversationId?: string) => {
    const url = new URL(`${API_BASE}/api/chatbot/history/${datasetId}`);
    if (conversationId) url.searchParams.set('conversation_id', conversationId);

    const res = await fetch(url.toString(), {
      headers: getHeaders(),
    });
    return handleResponse<ChatMessage[]>(res);
  },

  clearChatHistory: async (datasetId: string, conversationId?: string) => {
    const url = new URL(`${API_BASE}/api/chatbot/history/${datasetId}`);
    if (conversationId) url.searchParams.set('conversation_id', conversationId);

    const res = await fetch(url.toString(), {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // --- Reports ---
  getReportDownloadUrl: (datasetId: string) => {
    return `${API_BASE}/api/reports/${datasetId}/generate`;
  },
};

