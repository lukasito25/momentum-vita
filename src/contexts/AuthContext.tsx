import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DatabaseService } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  provider: 'email' | 'google' | 'apple';
  isPremium?: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

// Create context with default values to prevent undefined errors
const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  updateUser: async () => {}
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // More detailed error for debugging
    console.error('useAuth called outside AuthProvider. Make sure AuthProvider wraps your component.');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on app start
  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        const storedUser = localStorage.getItem('momentum_vita_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          // Validate user data structure
          if (userData && typeof userData === 'object' && userData.id && userData.email) {
            setUser(userData);
            DatabaseService.setUserId(userData.id);
          } else {
            console.warn('Invalid user data in localStorage, clearing...');
            localStorage.removeItem('momentum_vita_user');
          }
        }
      } catch (error) {
        console.error('Error loading stored user:', error);
        localStorage.removeItem('momentum_vita_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredUser();
  }, []);

  const login = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    try {
      setIsLoading(true);

      // In a real app, this would make an API call to authenticate
      // For now, we'll create a mock user object with premium status based on provider
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...userData,
        createdAt: new Date().toISOString(),
        isPremium: userData.provider === 'google' || userData.provider === 'apple' ? true : false // Premium for social logins
      };

      // Store user data
      localStorage.setItem('momentum_vita_user', JSON.stringify(newUser));
      setUser(newUser);
      DatabaseService.setUserId(newUser.id);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      // Clear stored data
      localStorage.removeItem('momentum_vita_user');
      setUser(null);
      DatabaseService.setUserId('anonymous');

      // Clear all user-specific localStorage data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('program_progress_') || key.startsWith('enhanced_') || key.includes('workout') || key.includes('session'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // In a real app, you might also clear other user-specific data
      // or make an API call to invalidate the session

      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error('No user to update');

      const updatedUser = { ...user, ...updates };
      localStorage.setItem('momentum_vita_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      DatabaseService.setUserId(updatedUser.id);

      // In a real app, you'd make an API call here
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('User update failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Enhanced features are now handled directly in components using isAuthenticated
// This hook is no longer needed to avoid circular dependencies