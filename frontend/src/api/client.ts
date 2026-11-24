import axios, { AxiosError } from 'axios';

// Get base URL with defensive fallback
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '');
export const API_BASE_URL = cleanBaseUrl.endsWith('/api')
  ? cleanBaseUrl
  : `${cleanBaseUrl}/api`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Helper to extract clean error message
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      return (data as any).message || (data as any).error || error.message;
    }
    if (typeof data === 'string' && data.length < 200) {
      return data;
    }
    if (error.response?.status === 404) {
      return 'Requested resource not found (404)';
    }
    if (error.response?.status === 500) {
      return 'Internal server error (500)';
    }
    return error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};
