"use client"; 

import Image from 'next/image';
import styles from '../Login.module.css'; // Vamos reusar o CSS do login
import { useState, FormEvent } from 'react'; 
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation'; 
import Link from 'next/link'; // Para o link de "Voltar"

// 1. Interface para o payload da API de criação
interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
}

// 2. A função que o useMutation vai chamar (baseado em image_e58bd9.png)
async function createUser(credentials: CreateUserPayload): Promise<any> {
  
  // NOTE: Estamos usando 'fetch' direto, pois o 'apiClient'
  // é para chamadas autenticadas (que já têm token).
  //
  const API_URL = 'http://localhost:3100/users'; // Endpoint de 'image_e58bd9.png'

  const response = await fetch(API_URL, { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // Usa a mensagem de erro da API (ex: "Um usuário com este e-mail já existe.")
    //
    throw new Error(errorData.message || 'Falha ao criar usuário.');
  }

  return response.json(); 
}

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); 

  const mutation = useMutation({
    mutationFn: createUser, 
    
    // 3. Sucesso: Avisa e redireciona para o Login
    onSuccess: (data) => {
      // Você pode trocar o alert por um 'toast' se preferir
      alert('Conta criada com sucesso! Faça o login.');
      router.push('/'); // Redireciona para a página de login
    },
    onError: (error) => {
      // O erro já vem tratado da função 'createUser'
      console.error('Erro ao criar conta:', error.message);
    }
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault(); 
    if (!name || !email || !password) return;
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