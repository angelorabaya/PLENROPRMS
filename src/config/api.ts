/**
 * API Configuration
 * Automatically determines the correct API URL based on environment
 */

// Get the API base URL dynamically
const getApiBaseUrl = (): string => {
  // Use the same-origin /api path so IIS can reverse proxy in production.
  return '/api';
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
