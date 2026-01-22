/**
 * API Configuration
 * Automatically determines the correct API URL based on environment
 */

// Get the API base URL dynamically
const getApiBaseUrl = (): string => {
  // In development, Vite proxy handles /api requests
  if (import.meta.env.DEV) {
    return '/api';
  }

  // In production, use the same host but with port 5001 for the backend
  // This allows the app to work on any server without hardcoding the URL
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const backendPort = 5001;

  return `${protocol}//${hostname}:${backendPort}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Helper function to make API requests
 */
export const apiFetch = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const url = endpoint.startsWith('/')
    ? `${API_BASE_URL}${endpoint}`
    : `${API_BASE_URL}/${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
};

export default API_BASE_URL;
