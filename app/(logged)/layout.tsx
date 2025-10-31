// Em app/(logged)/layout.tsx
"use client"; 

import Sidebar from '@/components/Sidebar/Sidebar'; // <-- MUDANÇA AQUI
import styles from './LoggedLayout.module.css';
import { useAuth } from '@/components/AuthProvider'; 
import { useRouter } from 'next/navigation'; 
import { useEffect } from 'react'; 

export default function LoggedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/'); 
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Carregando sessão...</p> 
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      // O container agora tem a classe 'appLayout'
      <div className={styles.appLayout}> 
        <Sidebar /> 
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    );
  }

  return null;
}