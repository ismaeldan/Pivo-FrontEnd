"use client";

import { useState, useEffect, FormEvent } from 'react';
import Modal from '../Modal/Modal';
import { Task } from '@/types';
import styles from './EditTaskModal.module.css';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em Progresso' },
  { value: 'completed', label: 'Concluído' },
];

export interface EditTaskData {
  title: string;
  description: string | null;
  status: string;
  moveToTop: boolean;
}

interface EditTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EditTaskData) => void; 
  isPending: boolean;
}

export default function EditTaskModal({ 
  task, 
  isOpen, 
  onClose, 
  onSave,
  isPending
}: EditTaskModalProps) {
  
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status);
  const [moveToTop, setMoveToTop] = useState(false);
  
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setMoveToTop(false);
    }
  }, [task]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isPending) return;

    onSave({
      title: title.trim(),
      description: description.trim() || null,
      status: status,
      moveToTop: moveToTop,
    });
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Tarefa">
      <form onSubmit={handleSubmit} className={styles.form}>
        
        <div className={styles.formGroup}>
          <label htmlFor="edit-title">Título</label>
          <input
            id="edit-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
            disabled={isPending}
            autoFocus
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="edit-description">Descrição</label>
          <textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.textarea}
            rows={5}
            placeholder="Adicione uma descrição mais detalhada..."
            disabled={isPending}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="edit-status">Status</label>
          <select
            id="edit-status"
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
        
        <div className={styles.checkboxGroup}>
          <input 
            type="checkbox" 
            id="move-to-top"
            checked={moveToTop}
            onChange={(e) => setMoveToTop(e.target.checked)}
            disabled={isPending}
            className={styles.checkboxInput}
          />
          <label htmlFor="move-to-top">Mover para o topo da coluna</label>
        </div>
        
        <div className={styles.buttonGroup}>
          <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isPending}>
            Cancelar
          </button>
          <button type="submit" className={styles.saveButton} disabled={isPending || !title.trim()}>
            {isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

      </form>
    </Modal>
  );
}