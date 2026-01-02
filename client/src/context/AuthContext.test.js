/**
 * Test file for AuthContext
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// Mock component to test the context
const TestComponent = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();

  return (
    <div>
      <div data-testid="authenticated">{isAuthenticated() ? 'true' : 'false'}</div>
      <div data-testid="admin">{isAdmin() ? 'true' : 'false'}</div>
      <div data-testid="username">{user?.username || 'none'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('should provide default unauthenticated state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('admin')).toHaveTextContent('false');
    expect(screen.getByTestId('username')).toHaveTextContent('none');
  });

  test('should restore user from localStorage on mount', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      role: 'player'
    };
    const mockToken = 'mock-token-123';

    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', mockToken);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('username')).toHaveTextContent('testuser');
    });
  });

  test('should identify admin user correctly', async () => {
    const mockAdminUser = {
      id: 1,
      username: 'admin',
      role: 'admin'
    };
    const mockToken = 'mock-token-123';

    localStorage.setItem('user', JSON.stringify(mockAdminUser));
    localStorage.setItem('token', mockToken);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin')).toHaveTextContent('true');
    });
  });
});