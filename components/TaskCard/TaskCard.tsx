"use client";

import styles from './TaskCard.module.css';
import { Task } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect } from 'react'; 

interface TaskCardProps {
  task: Task;
  isOverlayDragging?: boolean; 
  onUpdateTask: (id: string, content: string) => void; 
  onRequestDelete: (task: Task) => void
}

export default function TaskCard({ 
  task, 
  isOverlayDragging, 
  onUpdateTask,
  onRequestDelete // Recebe a função
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(task.content);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging: isSortableDragging 
  } = useSortable({
    id: task.id, 
    data: { type: 'Task', task: task },
    disabled: isOverlayDragging || isEditing, 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (!isEditing) {
      setEditedContent(task.content);
    }
  }, [task.content, isEditing]);

  const handleSave = () => {
    if (editedContent.trim() && editedContent !== task.content) {
      onUpdateTask(task.id, editedContent);
    }
    setIsEditing(false);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditedContent(task.content);
      setIsEditing(false);
    }
  };

  // Placeholder quando a tarefa está sendo arrastada
  if (isSortableDragging) {
    return <div ref={setNodeRef} style={style} className={styles.taskCardDragging} />;
  }
  
  return (
    <div 
      ref={setNodeRef}
      style={style}
      // Aplica atributos DND só no cliente
      {...(mounted ? { ...attributes } : {})} 
      // Aplica listeners DND só no cliente E se não estiver editando
      {...(mounted && !isEditing ? listeners : {})} 
      className={styles.taskCard}
      onDoubleClick={() => setIsEditing(true)}
    >
      {/* Conteúdo editável ou visível */}
      {isEditing ? (
        <input 
          className={styles.taskInput}
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          onBlur={handleSave} 
          onKeyDown={handleKeyDown} 
          autoFocus
        />
      ) : (
        <p className={styles.taskContent}>{task.content}</p> 
      )}
      
      {/* Botão de Deletar Tarefa (só visível se não estiver editando) */}
      {!isEditing && (
        <button 
          onClick={() => onRequestDelete(task)} 
          className={styles.deleteTaskButton}
          aria-label="Deletar tarefa"
        >
          &times; 
        </button>
      )}
    </div>
  );
}