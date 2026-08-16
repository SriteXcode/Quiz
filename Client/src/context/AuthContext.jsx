import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiLogin, apiRegister, apiGetCurrentUser } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('quiz_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  // Validate existing token & load user profile on mount
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await apiGetCurrentUser();
          if (response.success && response.user) {
            setUser(response.user);
          }
        } catch (error) {
          console.warn('[AuthInit Warning]: Session expired or invalid token');
          localStorage.removeItem('quiz_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  // Login handler
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const data = await apiLogin(email, password);
      if (data.success && data.token) {
        localStorage.setItem('quiz_token', data.token);
        setToken(data.token);
        setUser(data.user);
        addToast(data.message || `Welcome back, ${data.user.name}! 🚀`, 'success');
        return { success: true, user: data.user };
      }
    } catch (error) {
      addToast(error.message || 'Login failed. Please check your credentials.', 'error');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  // Register handler
  const register = useCallback(async (formData) => {
    setIsLoading(true);
    try {
      const data = await apiRegister(formData);
      if (data.success && data.token) {
        localStorage.setItem('quiz_token', data.token);
        setToken(data.token);
        setUser(data.user);
        addToast(data.message || `Registration Successful! Welcome, ${data.user.name}. 🎉`, 'success');
        return { success: true, user: data.user };
      }
    } catch (error) {
      addToast(error.message || 'Registration failed. Please try again.', 'error');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem('quiz_token');
    setToken(null);
    setUser(null);
    addToast('Logged out successfully', 'info');
  }, [addToast]);

  // Update user state directly
  const updateUserData = useCallback((updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  }, []);

  const value = {
    user,
    token,
    role: user?.role || 'student',
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
