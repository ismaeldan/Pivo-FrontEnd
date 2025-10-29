"use client";

import { useState } from 'react';
import styles from './AddColumnForm.module.css';

interface AddColumnFormProps {
  // 1. A assinatura 'onSave' agora envia o título E um array de strings (conteúdo das tarefas)
  onSave: (title: string, taskContents: string[]) => void;
  onCancel: () => void;
}

export default function AddColumnForm({ onSave, onCancel }: AddColumnFormProps) {
  // Estado para o título da coluna
  const [title, setTitle] = useState('');
  
  // Estados para a lista de tarefas
  const [tasks, setTasks] = useState<string[]>([]); // Lista de tarefas a adicionar
  const [currentTaskContent, setCurrentTaskContent] = useState(''); // O input da tarefa atual

  // Função para adicionar a tarefa atual à lista 'tasks'
  const handleAddTask = () => {
    if (currentTaskContent.trim()) {
      setTasks([...tasks, currentTaskContent.trim()]);
      setCurrentTaskContent(''); // Limpa o input para a próxima tarefa
    }
  };

  // Salva a coluna inteira
  const handleSaveColumn = () => {
    // 2. Só salva se o título for preenchido
    if (title.trim()) {
      onSave(title.trim(), tasks);
      // Limpa tudo
      setTitle('');
      setTasks([]);
      setCurrentTaskContent('');
    } else {
      // (Opcional) Adicionar feedback de erro aqui
      alert('O título da coluna é obrigatório.');
    }
  };

  const handleTaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Adiciona a tarefa ao pressionar 'Enter'
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
      
      {/* 1. Input do Título da Coluna */}
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
      />

      {/* 2. Lista de Tarefas Adicionadas */}
      <label className={styles.label}>Tarefas (Opcional)</label>
      <ul className={styles.taskList}>
        {tasks.map((taskContent, index) => (
          <li key={index} className={styles.taskListItem}>
            {taskContent}
          </li>
        ))}
      </ul>

      {/* 3. Input para Adicionar Nova Tarefa */}
      <div className={styles.taskInputGroup}>
        <input
          className={styles.inputTask}
          type="text"
          value={currentTaskContent}
          onChange={(e) => setCurrentTaskContent(e.target.value)}
          onKeyDown={handleTaskKeyDown}
          placeholder="Adicionar uma tarefa..."
        />
        <button onClick={handleAddTask} className={styles.addTaskButton}>
          Adicionar
        </button>
      </div>

      {/* 4. Botões de Ação */}
      <div className={styles.buttonGroup}>
        <button onClick={handleSaveColumn} className={styles.saveButton}>
          Salvar Coluna
        </button>
        <button onClick={onCancel} className={styles.cancelButton}>
          Cancelar
        </button>
      </div>
    </div>
  );
}