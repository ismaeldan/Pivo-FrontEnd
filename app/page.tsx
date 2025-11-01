"use client"; 

import Image from 'next/image';
import styles from './Login.module.css';
import { useState, FormEvent } from 'react'; 
import { useMutation, useQueryClient } from '@tanstack/react-query'; 
import { useRouter } from 'next/navigation'; 
import Link from 'next/link';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
}

async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
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
  const queryClient = useQueryClient(); 

  const mutation = useMutation({
    mutationFn: loginUser, 
    
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token);
      queryClient.invalidateQueries({ queryKey: ['authMe'] });
      router.push('/board');
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
          src="Pivo-logo.svg"
          alt="Pivô Logo"
          width={200}
          height={150}
          className={styles.logo}
          priority 
        />
        
        <h1>Pivô Board</h1>
        <p className={styles.p}>Acesse sua conta</p>
        
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
        
        <div className={styles.signupLink}>
          Não tem uma conta? <Link href="/signup">Crie uma</Link>
        </div>
                
      </form>
    </div>
  );
}