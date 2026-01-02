/**
 * API Configuration
 *
 * Determines the base URL for API calls based on the environment.
 * - Development: Uses proxy (http://localhost:5000)
 * - Production: Uses REACT_APP_API_URL environment variable
 */

const getApiBaseUrl = () => {
  // In production, use the environment variable set during build
  if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // In development, return empty string to use the proxy
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Export a configured axios instance
export const getApiUrl = (path) => {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // If we have a base URL, combine it with the path
  if (API_BASE_URL) {
    return `${API_BASE_URL}${normalizedPath}`;
  }

  // Otherwise, return the path as-is (for proxy)
  return normalizedPath;
};

const apiConfig = {
  API_BASE_URL,
  getApiUrl
};

export default apiConfig;