"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

// Interface para os dados do usuário (ajuste conforme sua API)
interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  isError: boolean;
}

// A nova função de verificação
const fetchAuthStatus = async (): Promise<AuthContextType> => {
  // localStorage só existe no navegador
  if (typeof window === 'undefined') {
    // No servidor, sempre retornamos carregando
    return { isAuthenticated: false, user: null, isLoading: true, isError: false };
  }
  
  const token = localStorage.getItem('access_token');

  if (!token) {
    // Se não há token, não está logado
    return { isAuthenticated: false, user: null, isLoading: false, isError: false };
  }

  // --- TODO: VERIFICAÇÃO REAL DO TOKEN ---
  // Aqui é onde você deve chamar seu backend (ex: GET /auth/profile)
  // try {
  //   const response = await fetch('http://SEU_BACKEND_URL/auth/profile', {
  //     headers: { 'Authorization': `Bearer ${token}` }
  //   });
  //   if (!response.ok) throw new Error('Token inválido');
  //   const user = await response.json();
  //   return { isAuthenticated: true, user: user, isLoading: false, isError: false };
  // } catch (error) {
  //   localStorage.removeItem('access_token'); // Limpa o token inválido
  //   return { isAuthenticated: false, user: null, isLoading: false, isError: true };
  // }
  // -------------------------------------

  // Por enquanto (INSEGURO, APENAS PARA TESTE):
  // Se o token existe, assumimos que está logado.
  const mockUser = { id: '123', name: 'Usuário (Mock)', email: 'user@email.com' };
  return Promise.resolve({ isAuthenticated: true, user: mockUser, isLoading: false, isError: false });
};

// 1. Criar o Contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Criar o Provedor (Componente)
export function AuthProvider({ children }: { children: ReactNode }) {
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ['authMe'], // Chave de cache
    queryFn: fetchAuthStatus, // A nova função de verificação
    retry: false, 
    refetchOnWindowFocus: true, // Bom para revalidar se o usuário voltar
    staleTime: 1000 * 60 * 15, // 15 minutos
  });

  const value: AuthContextType = data || {
    isAuthenticated: false,
    user: null,
    isLoading: isLoading,
    isError: isError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Criar o Hook (useAuth)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};