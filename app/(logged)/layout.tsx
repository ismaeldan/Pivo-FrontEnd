"use client"; // 1. Precisa ser um Client Component para usar hooks

import Header from '@/components/Header/Header';
import styles from './LoggedLayout.module.css';
import { useAuth } from '@/components/AuthProvider'; // 2. Importe o hook
import { useRouter } from 'next/navigation'; // 3. Importe o router
import { useEffect } from 'react'; // 4. Importe o useEffect

export default function LoggedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth(); // 5. Use o hook
  const router = useRouter();

  useEffect(() => {
    // 6. Lógica de Redirecionamento
    // Se não estiver carregando E não estiver autenticado...
    if (!isLoading && !isAuthenticated) {
      router.push('/'); // ...redirecione para a página de login
    }
  }, [isAuthenticated, isLoading, router]);

  // 7. Mostrar um "Carregando..." enquanto verifica a sessão
  if (isLoading) {
    // (Você pode criar um componente Spinner/Loading mais bonito)
    return (
      <div className={styles.loadingContainer}>
        <p>Carregando sessão...</p> 
      </div>
    );
  }

  // 8. Se estiver autenticado, mostre o layout normal
  if (isAuthenticated) {
    return (
      <div className={styles.appContainer}>
        <Header />
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    );
  }

  // Se não estiver carregando e não estiver autenticado,
  // retorna null (o useEffect já está cuidando do redirecionamento)
  return null;
}