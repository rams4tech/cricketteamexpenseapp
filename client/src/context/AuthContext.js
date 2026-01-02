import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { getLogger } from '../services/logger';

const AuthContext = createContext();
const logger = getLogger();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Set axios default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Set user context in logger
    logger.setUser(userData.id, userData.username);

    // Track login event
    logger.trackEvent('UserLogin', {
      userId: userData.id,
      username: userData.username,
      role: userData.role
    });

    logger.info('User logged in', {
      userId: userData.id,
      username: userData.username,
      role: userData.role
    });
  };

  const logout = () => {
    const userId = user?.id;
    const username = user?.username;

    // Track logout event before clearing user
    logger.trackEvent('UserLogout', {
      userId,
      username
    });

    logger.info('User logged out', {
      userId,
      username
    });

    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];

    // Clear user context in logger
    logger.clearUser();
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isPlayer = () => {
    return user?.role === 'player';
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin,
    isPlayer,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
