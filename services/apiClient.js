// Centralized API client for communicating with the AdaptEd Mind backend.
// All AI and data requests should go through this client.

import { auth } from '../config/firebase';
import { AI_CONFIG } from '../constants/Config';

const BASE_URL = AI_CONFIG.BACKEND_API_URL;

/**
 * Get the current Firebase user's ID token for authenticating
 * requests to the backend.
 */
const getAuthToken = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  try {
    return await currentUser.getIdToken(/* forceRefresh */ false);
  } catch (error) {
    console.error('Failed to get auth token:', error.message);
    return null;
  }
};

/**
 * Make an authenticated API request to the backend.
 *
 * @param {string} endpoint - API path (e.g. '/api/tests/generate')
 * @param {object} options - { method, body, headers, requireAuth }
 * @returns {Promise<object>} Parsed JSON response
 */
const apiRequest = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body = null,
    headers = {},
    requireAuth = true,
    timeout = 30000,
  } = options;

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Attach auth token if required
  if (requireAuth) {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated. Please sign in.' };
    }
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    // Add request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    fetchOptions.signal = controller.signal;

    const response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);
    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      console.error(`API Error [${response.status}] ${endpoint}:`, data.error);
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
        status: response.status,
      };
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Request timed out. Please try again.' };
    }
    console.error(`API Request failed [${endpoint}]:`, error.message);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
};

// ─── Convenience methods ─────────────────────────────────────────────

const api = {
  get: (endpoint, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'GET' }),

  post: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'POST', body }),

  put: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'PUT', body }),

  delete: (endpoint, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
export { apiRequest, getAuthToken };
