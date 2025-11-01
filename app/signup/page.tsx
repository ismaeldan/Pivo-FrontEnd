"use client"; 

import Image from 'next/image';
import styles from '../Login.module.css'; //
import { useState, FormEvent } from 'react'; 
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation'; 
import Link from 'next/link';

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
}

async function createUser(credentials: CreateUserPayload): Promise<any> {
  const API_URL = 'http://localhost:3100/users'; 

  const response = await fetch(API_URL, { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Falha ao criar usuário.');
  }

  return response.json(); 
}

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); 
  const router = useRouter(); 

  const mutation = useMutation({
    mutationFn: createUser, 
    
    onSuccess: (data) => {
      
      setSuccessMessage('Conta criada com sucesso! Redirecionando para o login...');
      
      setTimeout(() => {
        router.push('/'); 
      }, 2000);
    },
    onError: (error) => {
      
      setSuccessMessage('');
      console.error('Erro ao criar conta:', error.message);
    }
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault(); 
    if (!name || !email || !password || mutation.isPending) return;
    
    setSuccessMessage('');
    mutation.mutate({ name, email, password });
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
        <p className={styles.p}>Crie sua conta</p>
        
        <input 
          type="text" 
          placeholder="Nome Completo" 
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={mutation.isPending}
        />
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
        
        {successMessage && (
          <p className={styles.successMessage}>
            {successMessage}
          </p>
        )}

        <button 
          type="submit" 
          className={styles.button}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Criando...' : 'Criar conta'}
        </button>

        <div className={styles.signupLink}>
          Já tem uma conta? <Link href="/">Faça o login</Link>
        </div>
      </form>
    </div>
  );
}