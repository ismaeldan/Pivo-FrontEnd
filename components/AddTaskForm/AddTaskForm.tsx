"use client";

import { useState } from 'react';
import styles from './AddTaskForm.module.css';

interface AddTaskFormProps {
  // Envia o novo conteúdo para ser salvo
  onSave: (content: string) => void; 
  // Função para fechar o formulário
  onCancel: () => void;
  isPending: boolean;
}

export default function AddTaskForm({ onSave, onCancel, isPending }: AddTaskFormProps) {
  const [content, setContent] = useState('');

  const handleSave = () => {
    if (content.trim() && !isPending) {
      onSave(content.trim());
      setContent(''); // Limpa o form
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Salva com "Enter" (sem "Shift" para permitir quebra de linha)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Evita a quebra de linha
      handleSave();
    }
    // Cancela com "Escape"
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className={styles.formContainer}>
      <textarea
        className={styles.textArea}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Digite o conteúdo da tarefa..."
        autoFocus
        disabled={isPending}
      />
      <div className={styles.buttonGroup}>
        <button onClick={handleSave} className={styles.saveButton} disabled={isPending}>
          {isPending ? 'Salvando...' : 'Adicionar'}
        </button>
        <button onClick={onCancel} className={styles.cancelButton} disabled={isPending}>
          Cancelar
        </button>
      </div>
    </div>
  );
}