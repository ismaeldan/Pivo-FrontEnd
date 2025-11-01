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
  onOpenEditModal: (task: Task) => void; 
  onUpdateColumnTitle: (id: string, newTitle: string) => void;
  onRequestDeleteTask: (task: Task) => void; 
  onRequestDeleteColumn: (column: ColumnType) => void;
}

export default function Column({ 
  column, 
  activeTask, 
  onAddTask, 
  onOpenEditModal,
  onUpdateColumnTitle,
  onRequestDeleteTask,
  onRequestDeleteColumn
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
  });

  const taskIds = useMemo(() => column.tasks.map(task => task.id), [column.tasks]);

  useEffect(() => {
    if (!isEditingTitle) {
      setEditedTitle(column.title);
    }
  }, [column.title, isEditingTitle]);
  
  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== column.title) {
      onUpdateColumnTitle(column.id, editedTitle); 
    }
    setIsEditingTitle(false);
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(column.title);
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
            {...(mounted ? { ...attributes, ...listeners } : {})} 
            className={styles.columnTitle}
            onDoubleClick={() => setIsEditingTitle(true)}
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