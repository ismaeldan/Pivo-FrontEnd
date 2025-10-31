"use client";

import styles from './Sidebar.module.css';
import { useAuth } from '../AuthProvider'; // 1. Importar o hook de autenticação
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  // 2. Usar o hook para pegar os dados do usuário
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Para saber qual link está ativo

  const handleLogout = () => {
    // 3. Função de Logout
    localStorage.removeItem('access_token');
    router.push('/'); // Redireciona para o login
  };

  // Pega a primeira letra do nome para o Avatar
  const userInitials = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    // 4. Estrutura da Sidebar
    <aside className={styles.sidebar}>
      <div>
        <div className={styles.logo}>Pivô</div>
        <nav className={styles.nav}>
          {/* Usamos o pathname para aplicar a classe 'navLinkActive'
            Iremos usar a rota '/board' que criamos 
          */}
          <Link 
            href="/board" 
            className={`${styles.navLink} ${pathname === '/board' ? styles.navLinkActive : ''}`}
          >
            {/* (Ícone viria aqui) */}
            Dashboard
          </Link>
          {/* Adicione mais links aqui se precisar (ex: /settings) */}
        </nav>
      </div>

      {/* 5. Seção de Perfil na parte de baixo */}
      <div className={styles.profileSection}>
        <div className={styles.profileInfo}>
          <div className={styles.profileAvatar}>
            {userInitials}
          </div>
          {/* 6. Exibe o nome do usuário vindo do hook */}
          <span className={styles.profileName}>
            {user ? user.name : 'Carregando...'}
          </span>
        </div>

        <div className={styles.profileActions}>
          <button 
            className={styles.actionButton} 
            disabled 
            title="Funcionalidade em breve"
          >
            Editar Perfil
          </button>

          {/* 7. Botão de Logout com a função */}
          <button onClick={handleLogout} className={styles.logoutButton}>
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}