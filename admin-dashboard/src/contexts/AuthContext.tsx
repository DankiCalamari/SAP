import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = localStorage.getItem('admin_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      setToken(storedToken);

      // Verify token and get user data
      const currentUser = await api.auth.getCurrentUser();

      // Check if user has admin/manager role
      if (currentUser.role !== 'manager' && currentUser.role !== 'admin') {
        // Not authorized
        localStorage.removeItem('admin_token');
        setToken(null);
        setUser(null);
      } else {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('admin_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.auth.login(email, password);

      // Check role
      if (response.user.role !== 'manager' && response.user.role !== 'admin') {
        throw new Error('Admin access required. Only managers and admins can access this dashboard.');
      }

      localStorage.setItem('admin_token', response.token);
      setToken(response.token);
      setUser(response.user);
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    api.auth.logout().catch(console.error);
    localStorage.removeItem('admin_token');
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
