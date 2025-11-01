"use client";

import { useState } from 'react';
import styles from './AddColumnForm.module.css';

interface AddColumnFormProps {
  
  onSave: (title: string, taskContents: string[]) => void;
  onCancel: () => void;
  isPending: boolean;
}

export default function AddColumnForm({ onSave, onCancel, isPending }: AddColumnFormProps) {
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState<string[]>([]);
  const [currentTaskContent, setCurrentTaskContent] = useState('');
  
  const handleAddTask = () => {
    if (currentTaskContent.trim()) {
      setTasks([...tasks, currentTaskContent.trim()]);
      setCurrentTaskContent('');
    }
  };
  
  const handleSaveColumn = () => {
    if (title.trim() && !isPending) {
      onSave(title.trim(), tasks);
      setTitle('');
      setTasks([]);
      setCurrentTaskContent('');
    } else {
      alert('O título da coluna é obrigatório.');
    }
  };

  const handleTaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTask();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className={styles.formContainer}>
      
      <label htmlFor="col-title" className={styles.label}>Título da Coluna (Obrigatório)</label>
      <input
        id="col-title"
        className={styles.input}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
        placeholder="Digite o título da coluna..."
        autoFocus
        disabled={isPending}
      />
      
      <label className={styles.label}>Tarefas (Opcional)</label>
      <ul className={styles.taskList}>
        {tasks.map((taskContent, index) => (
          <li key={index} className={styles.taskListItem}>
            {taskContent}
          </li>
        ))}
      </ul>
      
      <div className={styles.taskInputGroup}>
        <input
          className={styles.inputTask}
          type="text"
          value={currentTaskContent}
          onChange={(e) => setCurrentTaskContent(e.target.value)}
          onKeyDown={handleTaskKeyDown}
          placeholder="Adicionar uma tarefa..."
          disabled={isPending}
        />
        <button onClick={handleAddTask} className={styles.addTaskButton} disabled={isPending}>
          Adicionar
        </button>
      </div>
      
      <div className={styles.buttonGroup}>
        <button onClick={handleSaveColumn} className={styles.saveButton} disabled={isPending}>
          Salvar Coluna
        </button>
        <button onClick={onCancel} className={styles.cancelButton} disabled={isPending}>
          Cancelar
        </button>
      </div>
    </div>
  );
}