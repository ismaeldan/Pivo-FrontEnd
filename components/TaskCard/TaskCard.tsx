"use client";

import styles from './TaskCard.module.css';
import { Task } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect } from 'react'; 

interface TaskCardProps {
  task: Task;
  isOverlayDragging?: boolean; 
  onRequestDelete: (task: Task) => void;
  onOpenEditModal: (task: Task) => void; 
}

export default function TaskCard({ 
  task, 
  isOverlayDragging, 
  onRequestDelete,
  onOpenEditModal
}: TaskCardProps) {
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { 
    attributes, listeners, setNodeRef, 
    transform, transition, 
    isDragging: isSortableDragging 
  } = useSortable({
    id: task.id, 
    data: { type: 'Task', task: task },
    disabled: isOverlayDragging, 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  if (isSortableDragging) {
    return <div ref={setNodeRef} style={style} className={styles.taskCardDragging} />;
  }
  
  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...(mounted ? { ...attributes } : {})} 
      {...(mounted ? listeners : {})}
      className={styles.taskCard}
      onClick={() => onOpenEditModal(task)} 
    >
      
      <div className={styles.taskContent}>
        <p className={styles.taskTitle}>{task.title}</p>
        {task.description && (
          <p className={styles.taskDescription}>{task.description}</p>
        )}
      </div>
      
      <div className={`${styles.statusBadge} ${styles[task.status]}`}>
        {task.status}
      </div>

      <button 
        onClick={(e) => {
          e.stopPropagation(); 
          onRequestDelete(task);
        }} 
        className={styles.deleteTaskButton}
        aria-label="Deletar tarefa"
      >
        &times; 
      </button>
    </div>
  );
}