"use client"; 

import Image from 'next/image';
import styles from './Login.module.css';
import { useState, FormEvent } from 'react'; 
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Importe useQueryClient
import { useRouter } from 'next/navigation'; 

interface LoginCredentials {
  email: string;
  password: string;
}

// 1. Defina a resposta esperada da API (baseado na sua imagem)
interface LoginResponse {
  access_token: string;
}

// 2. A função que o useMutation vai chamar
async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  // !!! IMPORTANTE !!!
  // Troque esta URL pela URL completa do seu backend
  const API_URL = 'http://localhost:3100/auth/login';

  const response = await fetch(API_URL, { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Email ou senha inválidos.');
  }

  return response.json(); 
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); 
  const queryClient = useQueryClient(); // Para limpar o cache de autenticação

  const mutation = useMutation({
    mutationFn: loginUser, 
    
    // 3. Gerenciar Sessão (Salvar Token e Redirecionar)
    onSuccess: (data) => {
      // 4. Salve o token no localStorage
      localStorage.setItem('access_token', data.access_token);
      
      // 5. Invalide qualquer query antiga de 'authMe' (que vamos criar)
      queryClient.invalidateQueries({ queryKey: ['authMe'] });

      // 6. Redirecione o usuário para o board
      router.push('/home');
    },
    onError: (error) => {
      console.error('Erro no login:', error.message);
    }
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault(); 
    if (!email || !password) return;
    mutation.mutate({ email, password });
  };

  return (
    <div className={styles.loginContainer}>
      <form onSubmit={handleSubmit} className={styles.loginBox}>
        <Image 
          src="/logo.png"
          alt="Pivô Logo" 
          width={100}
          height={100}
          className={styles.logo}
          priority 
        />
        
        <h1>Pivô Board</h1>
        <p>Acesse sua conta</p>
        
        <input 
          type="email" 
          placeholder="Email" 
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={mutation.isPending}
        />
        <input 
          type="password" 
          placeholder="Senha" 
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={mutation.isPending}
        />
        
        {mutation.isError && (
          <p className={styles.errorMessage}>
            {mutation.error.message || 'Ocorreu um erro.'}
          </p>
        )}

        <button 
          type="submit" 
          className={styles.button}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}