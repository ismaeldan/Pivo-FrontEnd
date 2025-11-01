// components/EditProfileModal/EditProfileModal.tsx
"use client";

import { useState, useEffect, FormEvent, useMemo } from 'react';
import Modal from '../Modal/Modal';
import styles from '../EditTaskModal/EditTaskModal.module.css'; 

export interface EditProfileData {
  name: string;
  email: string;
  password?: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface EditProfileModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EditProfileData) => void; 
  isPending: boolean;
}

export default function EditProfileModal({ 
  user, 
  isOpen, 
  onClose, 
  onSave,
  isPending
}: EditProfileModalProps) {
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState(''); 
  const [passwordConfirmation, setPasswordConfirmation] = useState(''); 

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name);
      setEmail(user.email);
      setPassword('');
      setPasswordConfirmation('');
    }
  }, [user, isOpen]);

  const passwordLengthState = useMemo(() => {
    if (!password) return 'neutral';
    return password.length >= 8 ? 'valid' : 'invalid';
  }, [password]);

  const passwordMatchState = useMemo(() => {
    if (passwordLengthState !== 'valid') return 'neutral';
    if (!passwordConfirmation) return 'neutral';
    return password === passwordConfirmation ? 'valid' : 'invalid';
  }, [password, passwordConfirmation, passwordLengthState]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    if (password && passwordLengthState === 'invalid') {
      alert('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password && passwordMatchState === 'invalid') {
      alert('As senhas não conferem.');
      return;
    }

    const data: EditProfileData = {
      name: name.trim(),
      email: email.trim(),
    };

    if (password && passwordLengthState === 'valid' && passwordMatchState === 'valid') {
      data.password = password;
    }

    onSave(data);
  };

  const isSubmitDisabled = 
    isPending ||
    !name.trim() ||
    !email.trim() ||
    (!!password && (passwordLengthState === 'invalid' || passwordMatchState === 'invalid'));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Perfil">
      <form onSubmit={handleSubmit} className={styles.form}>
        
        {/* Nome */}
        <div className={styles.formGroup}>
          <label htmlFor="edit-name">Nome</label>
          <input
            id="edit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            disabled={isPending}
            autoFocus
            autoComplete="name"
          />
          <div className={styles.errorMessage}></div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="edit-email">Email</label>
          <input
            id="edit-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            disabled={isPending}
            autoComplete="email"
          />
          <div className={styles.errorMessage}></div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="edit-password">Nova Senha</label>
          <input
            id="edit-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`
              ${styles.input} 
              ${password && passwordLengthState === 'valid' ? styles.inputValid : ''}
              ${password && passwordLengthState === 'invalid' ? styles.inputError : ''}
            `}
            placeholder="Mínimo 8 caracteres"
            disabled={isPending}
            autoComplete="new-password"
          />
          <div className={styles.errorMessage}>
            {password && passwordLengthState === 'invalid' ? 'A senha deve ter pelo menos 8 caracteres.' : ''}
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="edit-password-confirm">Confirmar Nova Senha</label>
          <input
            id="edit-password-confirm"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            className={`
              ${styles.input}
              ${passwordMatchState === 'valid' ? styles.inputValid : ''}
              ${passwordMatchState === 'invalid' ? styles.inputError : ''}
            `}
            placeholder="Repita a senha"
            disabled={isPending || passwordLengthState !== 'valid'} 
            autoComplete="new-password"
          />
          <div className={styles.errorMessage}>
            {passwordMatchState === 'invalid' ? 'As senhas não conferem.' : ''}
          </div>
        </div>

        {/* Botões */}
        <div className={styles.buttonGroup}>
          <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isPending}>
            Cancelar
          </button>
          <button 
            type="submit" 
            className={styles.saveButton} 
            disabled={isSubmitDisabled} 
          >
            {isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}