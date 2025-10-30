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
  // 1. Renomeamos a prop: ela não atualiza mais, ela ABRE o modal
  onOpenEditModal: (task: Task) => void; 
}

export default function TaskCard({ 
  task, 
  isOverlayDragging, 
  onRequestDelete,
  onOpenEditModal // 2. Receba a nova prop
}: TaskCardProps) {
  
  // 3. REMOVEMOS os estados 'isEditing' e 'editedTitle'
  
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
    // 4. A edição não desabilita mais o DND, então a lógica é mais simples
    disabled: isOverlayDragging, 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 5. REMOVEMOS 'useEffect' para 'editedTitle', 'handleSave', 'handleKeyDown'

  if (isSortableDragging) {
    return <div ref={setNodeRef} style={style} className={styles.taskCardDragging} />;
  }
  
  return (
    // 6. 'onClick' agora chama a função para ABRIR O MODAL
    <div 
      ref={setNodeRef}
      style={style}
      {...(mounted ? { ...attributes } : {})} 
      {...(mounted ? listeners : {})} // Não precisamos mais da lógica '!isEditing'
      className={styles.taskCard}
      // 7. REMOVIDO 'onDoubleClick', ADICIONADO 'onClick'
      onClick={() => onOpenEditModal(task)} 
    >
      {/* 8. Renderização não é mais condicional */}
      <div className={styles.taskContent}>
        <p className={styles.taskTitle}>{task.title}</p>
        {task.description && (
          <p className={styles.taskDescription}>{task.description}</p>
        )}
      </div>
      
      {/* 9. Botão de Status (baseado na API) */}
      <div className={`${styles.statusBadge} ${styles[task.status]}`}>
        {task.status}
      </div>

      <button 
        // 10. IMPORTANTE: Adiciona e.stopPropagation()
        //     para evitar que o modal abra ao clicar em deletar
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