"use client";

import { useState, FormEvent } from 'react';
import styles from './AddTaskForm.module.css';

// 1. Tipos de Status (igual ao EditTaskModal)
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em Progresso' },
  { value: 'completed', label: 'Concluído' },
];

// 2. Define a estrutura dos dados que o onSave enviará
export interface AddTaskData {
  title: string;
  description: string | null;
  status: string;
}

interface AddTaskFormProps {
  // 3. onSave agora envia um objeto AddTaskData
  onSave: (data: AddTaskData) => void; 
  onCancel: () => void;
  isPending: boolean;
}

export default function AddTaskForm({ onSave, onCancel, isPending }: AddTaskFormProps) {
  
  // 4. Estados para os novos campos
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending'); // Default para 'pending'

  const handleSave = (e: FormEvent) => {
    e.preventDefault(); // É um formulário agora
    
    if (title.trim() && !isPending) {
      onSave({
        title: title.trim(),
        description: description.trim() || null,
        status: status,
      });
      // Limpa o form
      setTitle('');
      setDescription('');
      setStatus('pending');
    }
  };

  return (
    // 5. Atualiza o JSX para ser um formulário completo
    <form onSubmit={handleSave} className={styles.formContainer}>
      
      {/* Título */}
      <div className={styles.formGroup}>
        <label htmlFor="add-title">Título (Obrigatório)</label>
        <input
          id="add-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={styles.input}
          disabled={isPending}
          autoFocus
        />
      </div>

      {/* Descrição */}
      <div className={styles.formGroup}>
        <label htmlFor="add-description">Descrição</label>
        <textarea
          id="add-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.textarea}
          rows={4}
          placeholder="Adicione uma descrição..."
          disabled={isPending}
        />
      </div>

      {/* Status */}
      <div className={styles.formGroup}>
        <label htmlFor="add-status">Status Inicial</label>
        <select
          id="add-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={styles.select}
          disabled={isPending}
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Botões */}
      <div className={styles.buttonGroup}>
        <button type="button" onClick={onCancel} className={styles.cancelButton} disabled={isPending}>
          Cancelar
        </button>
        <button type="submit" className={styles.saveButton} disabled={isPending || !title.trim()}>
          {isPending ? 'Salvando...' : 'Adicionar Tarefa'}
        </button>
      </div>
    </form>
  );
}