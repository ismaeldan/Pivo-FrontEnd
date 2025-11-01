"use client";

import styles from './Sidebar.module.css';
import { useAuth } from '../AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import EditProfileModal, { EditProfileData } from '../EditProfileModal/EditProfileModal';

const updateUserOnAPI = async (data: EditProfileData) => {
  const response = await apiClient('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Falha ao atualizar o perfil');
  return response.json();
};


export default function Sidebar() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const updateProfileMutation = useMutation({
    mutationFn: updateUserOnAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authMe'] });
      setIsModalOpen(false);
    },
    onError: (error) => {
      console.error("Erro ao atualizar perfil:", error);
      alert("Não foi possível atualizar o perfil.");
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    queryClient.invalidateQueries({ queryKey: ['authMe'] });
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
            <button 
              className={styles.actionButton} 
              onClick={() => setIsModalOpen(true)}
              disabled={isLoading || !user}
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