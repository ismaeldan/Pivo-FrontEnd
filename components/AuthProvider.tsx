"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  isError: boolean;
}

const fetchAuthStatus = async (): Promise<AuthContextType> => {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, user: null, isLoading: true, isError: false };
  }
  
  const token = localStorage.getItem('access_token');

  if (!token) {
    return { isAuthenticated: false, user: null, isLoading: false, isError: false };
  }

  try {
    const response = await apiClient('/users/me', { method: 'GET' });
    
    const user = await response.json();
    return { isAuthenticated: true, user: user, isLoading: false, isError: false };

  } catch (error) {
    return { isAuthenticated: false, user: null, isLoading: false, isError: true };
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['authMe'],
    queryFn: fetchAuthStatus,
    retry: false, 
    refetchOnWindowFocus: true, 
    staleTime: 1000 * 60 * 15,
  });

  const value: AuthContextType = data || {
    isAuthenticated: false,
    user: null,
    isLoading: isLoading || isFetching, 
    isError: isError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};