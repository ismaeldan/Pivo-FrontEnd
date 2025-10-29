"use client";

import TaskCard from '../TaskCard/TaskCard';
import styles from './Column.module.css';
import { Column as ColumnType, Task } from '@/types'; 
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState, useEffect } from 'react'; 

interface ColumnProps {
  column: ColumnType;
  activeTask: Task | null;
  onAddTask: (columnId: string) => void; 
  onUpdateTask: (id: string, content: string) => void;
  onUpdateColumnTitle: (id: string, newTitle: string) => void;
  onRequestDeleteTask: (task: Task) => void; 
  onRequestDeleteColumn: (column: ColumnType) => void;
}

export default function Column({ 
  column, 
  activeTask, 
  onAddTask, 
  onUpdateTask,
  onUpdateColumnTitle,
  onRequestDeleteTask, // Recebe a função
  onRequestDeleteColumn // Recebe a função
}: ColumnProps) { 
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(column.title);
  const [mounted, setMounted] = useState(false);

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
    disabled: !!activeTask || isEditingTitle, 
  });

  const { 
    setNodeRef: setDroppableNodeRef, 
    isOver 
  } = useDroppable({
    id: column.id, 
    data: { type: 'Column', column: column, },
    // 'disabled' removido para permitir drop em colunas vazias
  });

  const taskIds = useMemo(() => column.tasks.map(task => task.id), [column.tasks]);

  useEffect(() => {
    if (!isEditingTitle) {
      setEditedTitle(column.title);
    }
  }, [column.title, isEditingTitle]);

  const handleTitleSave = () => { /* ... (igual) ... */ };
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { /* ... (igual) ... */ };
  const style = { transform: CSS.Transform.toString(transform), transition, };

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
      {/* Container do Cabeçalho da Coluna */}
      <div className={styles.columnHeader}>
        {isEditingTitle ? (
          <input 
            className={styles.columnTitleInput}
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            autoFocus
          />
        ) : (
          <h2 
            {...(mounted ? { ...attributes, ...listeners } : {})} // Aplica DND listeners só no cliente
            className={styles.columnTitle}
            onDoubleClick={() => setIsEditingTitle(true)}
          >
            {column.title}
          </h2>
        )}
        {/* Botão de Deletar Coluna (só aparece se não estiver editando título) */}
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
      
      {/* Contexto para reordenação VERTICAL das tarefas */}
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
              onUpdateTask={onUpdateTask}
              onRequestDelete={onRequestDeleteTask}
            />
          ))}
        </div>
      </SortableContext>

      {/* Botão para Adicionar Tarefa (chama o Modal) */}
      <button 
        className={styles.addNewTaskButton}
        onClick={() => onAddTask(column.id)} 
      >
        + Adicionar Tarefa
      </button>

    </div>
  );
}