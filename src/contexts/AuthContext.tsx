import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
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
          setUser(userData);
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
      // For now, we'll create a mock user object
      const newUser: User = {
        id: `user_${Date.now()}`,
        ...userData,
        createdAt: new Date().toISOString(),
        isPremium: false // Default to free tier
      };

      // Store user data
      localStorage.setItem('momentum_vita_user', JSON.stringify(newUser));
      setUser(newUser);

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

// Hook for checking if enhanced features should be available
export const useEnhancedFeatures = () => {
  const { isAuthenticated } = useAuth();

  return {
    hasEnhancedMode: isAuthenticated,
    hasCloudSync: isAuthenticated,
    hasAdvancedAnalytics: isAuthenticated,
    hasProgressBackup: isAuthenticated
  };
};