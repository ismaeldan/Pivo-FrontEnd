"use client";

import styles from './Sidebar.module.css';
import { useAuth } from '../AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react'; // <-- 1. Importar useState
import { useMutation, useQueryClient } from '@tanstack/react-query'; // <-- 2. Importar hooks
import { apiClient } from '@/lib/apiClient'; // <-- 3. Importar apiClient
import EditProfileModal, { EditProfileData } from '../EditProfileModal/EditProfileModal'; // <-- 4. Importar o novo Modal

// 5. Função da API para (PATCH /users/me)
const updateUserOnAPI = async (data: EditProfileData) => {
  const response = await apiClient('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Falha ao atualizar o perfil');
  return response.json();
};


export default function Sidebar() {
  const { user, isLoading } = useAuth(); // 'isLoading' para evitar flicker
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient(); // <-- 6. Pegar o QueryClient

  // 7. Estado para controlar o modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 8. Mutação para atualizar o perfil
  const updateProfileMutation = useMutation({
    mutationFn: updateUserOnAPI,
    onSuccess: () => {
      // 9. MUITO IMPORTANTE: Invalida o cache 'authMe'
      //    Isso força o AuthProvider a buscar os dados de novo (com o novo nome)
      queryClient.invalidateQueries({ queryKey: ['authMe'] });
      setIsModalOpen(false); // Fecha o modal
    },
    onError: (error) => {
      console.error("Erro ao atualizar perfil:", error);
      alert("Não foi possível atualizar o perfil.");
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    queryClient.invalidateQueries({ queryKey: ['authMe'] }); // Limpa o cache
    router.push('/');
  };

  const userInitials = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <>
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.logo}>Pivô</div>
          <nav className={styles.nav}>
            <Link 
              href="/board" 
              className={`${styles.navLink} ${pathname === '/board' ? styles.navLinkActive : ''}`}
            >
              Dashboard
            </Link>
          </nav>
        </div>

        <div className={styles.profileSection}>
          <div className={styles.profileInfo}>
            <div className={styles.profileAvatar}>
              {userInitials}
            </div>
            <span className={styles.profileName}>
              {isLoading ? 'Carregando...' : (user ? user.name : 'Visitante')}
            </span>
          </div>

          <div className={styles.profileActions}>
            {/* 10. Botão agora abre o modal */}
            <button 
              className={styles.actionButton} 
              onClick={() => setIsModalOpen(true)} // <-- AÇÃO
              disabled={isLoading || !user} // Desabilita se não estiver carregado
              title="Editar seu perfil"
            >
              Editar Perfil
            </button>

            <button onClick={handleLogout} className={styles.logoutButton}>
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* 11. Renderiza o Modal (ele só é visível se 'isModalOpen' for true) */}
      <EditProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        onSave={(data) => updateProfileMutation.mutate(data)}
        isPending={updateProfileMutation.isPending}
      />
    </>
  );
}