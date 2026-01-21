import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;  // Added: true while loading user from localStorage
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isPM: () => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);  // Start as loading

  useEffect(() => {
    // Try to load user from localStorage on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);  // Done loading
  }, []);

  const hasRole = (role: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  const isAdmin = (): boolean => {
    return hasRole('ADMIN');
  };

  const isPM = (): boolean => {
    return hasRole('PRODUCT_MANAGER');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  };

  const value: AuthContextType = {
    user,
    setUser: (newUser) => {
      setUser(newUser);
      if (newUser) {
        localStorage.setItem('user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('user');
      }
    },
    isAuthenticated: !!user,
    isLoading,
    hasRole,
    isAdmin,
    isPM,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
