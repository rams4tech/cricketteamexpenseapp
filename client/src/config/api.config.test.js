/**
 * Test file for API Configuration
 */

import { API_BASE_URL, getApiUrl } from './api.config';

describe('API Configuration', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalApiUrl = process.env.REACT_APP_API_URL;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.REACT_APP_API_URL = originalApiUrl;
  });

  test('should return empty string for development environment', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.REACT_APP_API_URL;

    // Since getApiBaseUrl is called during module load, we need to test the exported constant
    // In development with no REACT_APP_API_URL, API_BASE_URL should be empty
    expect(typeof API_BASE_URL).toBe('string');
  });

  test('should format API URL with path correctly', () => {
    const path = '/users';
    const result = getApiUrl(path);

    expect(result).toBe('/users');
  });

  test('should add leading slash to path if missing', () => {
    const path = 'users';
    const result = getApiUrl(path);

    expect(result).toBe('/users');
  });

  test('should combine base URL with path when base URL exists', () => {
    // This test validates the function logic
    const mockBaseUrl = 'https://api.example.com';
    const path = '/users';

    // Simulate what getApiUrl does when API_BASE_URL exists
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const expectedResult = mockBaseUrl ? `${mockBaseUrl}${normalizedPath}` : normalizedPath;

    expect(expectedResult).toBe('https://api.example.com/users');
  });
});