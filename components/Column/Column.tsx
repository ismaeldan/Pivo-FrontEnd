"use client";

import TaskCard from '../TaskCard/TaskCard';
import styles from './Column.module.css';
import { Column as ColumnType, Task } from '@/types'; 
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState, useEffect } from 'react'; 

// Esta interface deve corresponder a todas as props passadas no BoardArea
interface ColumnProps {
  column: ColumnType;
  activeTask: Task | null;
  onAddTask: (columnId: string) => void; 
  onOpenEditModal: (task: Task) => void; 
  onUpdateColumnTitle: (id: string, newTitle: string) => void; // A prop que queremos usar
  onRequestDeleteTask: (task: Task) => void; 
  onRequestDeleteColumn: (column: ColumnType) => void;
}

export default function Column({ 
  column, 
  activeTask, 
  onAddTask, 
  onOpenEditModal,
  onUpdateColumnTitle, // Recebemos a prop
  onRequestDeleteTask,
  onRequestDeleteColumn
}: ColumnProps) { 
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(column.title);
  const [mounted, setMounted] = useState(false); // Para correção de hidratação

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    setNodeRef: setSortableNodeRef, 
    attributes, 
    listeners,
    transform,
    transition, 
    isDragging: isColumnDragging,
  } = useSortable({
    id: column.id, 
    data: { type: 'Column', column: column, },
    disabled: !!activeTask || isEditingTitle, // Desabilita DND se estiver editando
  });

  const { 
    setNodeRef: setDroppableNodeRef, 
    isOver 
  } = useDroppable({
    id: column.id, 
    data: { type: 'Column', column: column, },
  });

  const taskIds = useMemo(() => column.tasks.map(task => task.id), [column.tasks]);

  useEffect(() => {
    if (!isEditingTitle) {
      setEditedTitle(column.title);
    }
  }, [column.title, isEditingTitle]);

  // Função para salvar o título
  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== column.title) {
      // Chama a prop (que chama a mutação no BoardArea)
      onUpdateColumnTitle(column.id, editedTitle); 
    }
    setIsEditingTitle(false); // Sai do modo de edição
  };

  // Função para salvar com 'Enter' ou cancelar com 'Escape'
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(column.title); // Reverte
      setIsEditingTitle(false);
    }
  };

  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition, 
  };

  if (isColumnDragging) {
    return (
      <div 
        ref={setSortableNodeRef} 
        style={style} 
        className={styles.columnDraggingPlaceholder}
      />
    );
  }

  return (
    <div 
      ref={(node) => {
        setSortableNodeRef(node);
        setDroppableNodeRef(node);
      }} 
      style={style}
      className={`${styles.column} ${isOver && activeTask ? styles.columnOver : ''}`}
    >
      <div className={styles.columnHeader}>
        {isEditingTitle ? (
          // MODO DE EDIÇÃO
          <input 
            className={styles.columnTitleInput}
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            // --- ESTAS SÃO AS LINHAS CRÍTICAS ---
            onBlur={handleTitleSave} // Salva quando clica fora
            onKeyDown={handleTitleKeyDown} // Salva com 'Enter'
            // --- FIM DAS LINHAS CRÍTICAS ---
            autoFocus
          />
        ) : (
          // MODO DE VISUALIZAÇÃO
          <h2 
            {...(mounted ? { ...attributes, ...listeners } : {})} 
            className={styles.columnTitle}
            onDoubleClick={() => setIsEditingTitle(true)} // Entra no modo de edição
          >
            {column.title}
          </h2>
        )}
        {!isEditingTitle && (
          <button
            onClick={() => onRequestDeleteColumn(column)}
            className={styles.deleteColumnButton}
            aria-label="Deletar coluna"
          >
           &times;
          </button>
        )}
      </div>
      
      <SortableContext 
        items={taskIds} 
        strategy={verticalListSortingStrategy}
      >
        <div className={styles.tasksContainer}>
          {column.tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              isOverlayDragging={activeTask?.id === task.id} 
              onOpenEditModal={onOpenEditModal} 
              onRequestDelete={onRequestDeleteTask}
            />
          ))}
        </div>
      </SortableContext>

      <button 
        className={styles.addNewTaskButton}
        onClick={() => onAddTask(column.id)} 
      >
        + Adicionar Tarefa
      </button>

    </div>
  );
}