"use client"; 

import Column from '../Column/Column';
import styles from './BoardArea.module.css';
import { useState, useMemo, useEffect } from 'react'; 
import { Column as ColumnType, Task } from '@/types'; 
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent, 
  PointerSensor, 
  useSensor, 
  useSensors,
} from '@dnd-kit/core';
import TaskCard from '../TaskCard/TaskCard';
import { 
  arrayMove, 
  SortableContext, 
  horizontalListSortingStrategy 
} from '@dnd-kit/sortable';
import Modal from '../Modal/Modal';
import AddColumnForm from '../AddColumnForm/AddColumnForm';
import AddTaskForm, { AddTaskData } from '../AddTaskForm/AddTaskForm';
import EditTaskModal, { EditTaskData } from '../EditTaskModal/EditTaskModal';
import { useBoard } from '@/hooks/useBoard'; 
import { useDebounce } from '@/hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

type ModalType = 
  | null
  | { type: 'addColumn' }
  | { type: 'addTask', columnId: string };

type ConfirmationModalData = 
  | null
  | { type: 'task', id: string, name: string }
  | { type: 'column', id: string, name: string };

interface CreateTaskPayload {
  title: string;
  columnId: string;
  description?: string | null; 
  status?: string;
  order?: number;
}

interface CreateTaskResponse extends Task {}

interface UpdateTaskPayload {
  taskId: string;
  data: {
    order?: number;
    columnId?: string;
    title?: string;
    description?: string | null;
    status?: string;
  }
}

interface CreateColumnPayload {
  title: string;
  order?: number;
}

interface UpdateColumnPayload {
  columnId: string;
  data: {
    title?: string;
    order?: number;
  }
}

const createTaskOnAPI = async (payload: CreateTaskPayload): Promise<CreateTaskResponse> => {
  const response = await apiClient('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Falha ao criar a tarefa');
  return response.json();
};

const updateTaskOnAPI = async ({ taskId, data }: UpdateTaskPayload) => {
  const response = await apiClient(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Falha ao atualizar a tarefa');
  return response.json();
};

const deleteTaskOnAPI = async (taskId: string) => {
  const response = await apiClient(`/tasks/${taskId}`, {
    method: 'DELETE',
  });
  if (!response.ok && response.status !== 404) {
    throw new Error('Falha ao deletar a tarefa');
  }
  return { success: true };
};

const createColumnOnAPI = async (payload: CreateColumnPayload) => {
  const response = await apiClient('/columns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Falha ao criar a coluna');
  return response.json();
};

const updateColumnTitleOnAPI = async ({ columnId, data }: UpdateColumnPayload) => {
  const response = await apiClient(`/columns/${columnId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Falha ao atualizar o título da coluna');
  return response.json();
};

const deleteColumnOnAPI = async (columnId: string) => {
  const response = await apiClient(`/columns/${columnId}`, {
    method: 'DELETE',
  });
  if (!response.ok && response.status !== 404) {
    throw new Error('Falha ao deletar a coluna');
  }
  return { success: true };
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em Progresso' },
  { value: 'completed', label: 'Concluído' },
];

export default function BoardArea() {
  const [columns, setColumns] = useState<ColumnType[]>([]); 
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [confirmationModalData, setConfirmationModalData] = useState<ConfirmationModalData>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const queryClient = useQueryClient();
  
  const { 
    data: columnsFromAPI, 
    isLoading: isLoadingBoard,
    isError: isErrorBoard 
  } = useBoard({
    status: statusFilter, 
    q: debouncedSearchQuery || undefined,
  });
  
  useEffect(() => {
    if (columnsFromAPI) {
      setColumns(columnsFromAPI); 
    }
  }, [columnsFromAPI]);
  
  const createTaskMutation = useMutation({
    mutationFn: createTaskOnAPI,
    onError: (error) => {
      console.error("Erro ao criar tarefa:", error);
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: updateTaskOnAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      closeEditModal();
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar tarefa:", error);
      alert(`Erro ao mover/atualizar: ${error.message}. Revertendo.`);
      queryClient.invalidateQueries({ queryKey: ['board'] }); 
    }
  });

  const createColumnMutation = useMutation({
    mutationFn: createColumnOnAPI,
    onError: (error) => {
      console.error("Erro ao criar coluna:", error);
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });

  const updateColumnMutation = useMutation({
    mutationFn: updateColumnTitleOnAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar coluna:", error);
      queryClient.invalidateQueries({ queryKey: ['board'] }); 
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTaskOnAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
    onError: (error) => {
      console.error("Erro ao deletar tarefa:", error);
      alert("Não foi possível deletar a tarefa.");
    }
  });

  const deleteColumnMutation = useMutation({
    mutationFn: deleteColumnOnAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
    onError: (error) => {
      console.error("Erro ao deletar coluna:", error);
      alert("Não foi possível deletar a coluna.");
    }
  });

  const columnIds = useMemo(() => columns.map(col => col.id), [columns]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  );
  
  function handleCreateColumn(title: string, taskContents: string[]) {
    const hasTasks = taskContents.length > 0;
    
    const newOrder = columns.length; 

    createColumnMutation.mutate(
      { title: title, order: newOrder },
      {
        onSuccess: (newColumnData) => {
          
          const newColumnId = (newColumnData as ColumnType).id;
          
          if (hasTasks && newColumnId) {
            const taskCreationPromises = taskContents.map((taskTitle, index) => 
              createTaskMutation.mutateAsync({ 
                title: taskTitle,
                description: null,
                status: 'pending', 
                columnId: newColumnId,
                order: index,
              })
            );
            
            Promise.all(taskCreationPromises)
              .finally(() => {
                queryClient.invalidateQueries({ queryKey: ['board'] });
                closeModal();
              });
          } else {
            
            queryClient.invalidateQueries({ queryKey: ['board'] });
            closeModal();
          }
        },
      }
    );
  }

  function handleCreateTask(columnId: string, data: AddTaskData) {
    createTaskMutation.mutate({
      title: data.title,
      description: data.description,
      status: data.status,
      columnId: columnId,
      
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['board'] });
        closeModal(); 
      }
    });
  }

  function handleUpdateTaskDetails(data: EditTaskData) {
    if (!editingTask) return;

    const { title, description, status, moveToTop } = data;
    const changes: UpdateTaskPayload['data'] = {
      title,
      description,
      status,
    };

    if (moveToTop) {
      changes.order = 0; 
    }
    
    const dataHasChanged = 
      changes.title !== editingTask.title ||
      changes.description !== (editingTask.description || null) ||
      changes.status !== editingTask.status;

    if (!dataHasChanged && !moveToTop) {
      closeEditModal();
      return;
    }
    
    updateTaskMutation.mutate({
      taskId: editingTask.id,
      data: changes
    });
  }

  function updateColumnTitle(columnId: string, newTitle: string) {
    updateColumnMutation.mutate({
      columnId: columnId,
      data: { title: newTitle }
    });
  }
  
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    if (active.data.current?.type === 'Task' && active.data.current.task) {
      setActiveTask(active.data.current.task as Task);
      return;
    }
    if (active.data.current?.type === 'Column' && active.data.current.column) {
      setActiveColumn(active.data.current.column as ColumnType);
      return;
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveTask(null);
    setActiveColumn(null);

    if (!over) return;
    if (active.id === over.id) return;
    
    const isActiveColumn = active.data.current?.type === 'Column';
    if (isActiveColumn) {
      const activeColumnIndex = columns.findIndex(col => col.id === active.id);
      const overColumnIndex = columns.findIndex(col => col.id === over.id);

      if (activeColumnIndex !== -1 && overColumnIndex !== -1 && activeColumnIndex !== overColumnIndex) {
        
        setColumns(prevColumns => {
          return arrayMove(prevColumns, activeColumnIndex, overColumnIndex);
        });
        
        updateColumnMutation.mutate({
          columnId: active.id as string,
          data: { order: overColumnIndex } 
        });
      }
      return;
    }
    
    const isActiveTask = active.data.current?.type === 'Task';
    if (isActiveTask && active.data.current?.task) {
      
      const taskToMove = active.data.current.task as Task;

      const activeColumn = columns.find(col => 
        col.tasks.some(task => task.id === active.id)
      );
      if (!activeColumn) return;
      const activeIndex = activeColumn.tasks.findIndex(t => t.id === active.id);

      let targetColumnId: string;
      let targetIndex: number;
      
      if (over.data.current?.type === 'Task') {
        const overTaskColumn = columns.find(col => col.tasks.some(t => t.id === over.id));
        if (!overTaskColumn) return;
        
        targetColumnId = overTaskColumn.id;
        targetIndex = overTaskColumn.tasks.findIndex(t => t.id === over.id);
      } 
      
      else if (over.data.current?.type === 'Column') {
        targetColumnId = over.id as string;
        const overColumn = columns.find(col => col.id === targetColumnId);
        if (!overColumn) return;
        
        targetIndex = overColumn.tasks.length; // Adiciona ao final
      } 
      else {
        return;
      }
      
      if (activeColumn.id === targetColumnId && activeIndex === targetIndex) {
        return;
      }
      
      setColumns((prev) => {
        const prevActiveCol = prev.find(c => c.id === activeColumn.id);
        const prevTargetCol = prev.find(c => c.id === targetColumnId);

        if (!prevActiveCol || !prevTargetCol) return prev;

        if (prevActiveCol.id === prevTargetCol.id) {
          const newTasks = arrayMove(prevActiveCol.tasks, activeIndex, targetIndex);
          return prev.map(c => c.id === prevActiveCol.id ? {...c, tasks: newTasks} : c);
        } 
        else {
          const newActiveTasks = prevActiveCol.tasks.filter(t => t.id !== active.id);
          const newTargetTasks = [...prevTargetCol.tasks];
          newTargetTasks.splice(targetIndex, 0, taskToMove);
          
          return prev.map(c => {
            if (c.id === prevActiveCol.id) return {...c, tasks: newActiveTasks};
            if (c.id === prevTargetCol.id) return {...c, tasks: newTargetTasks};
            return c;
          });
        }
      });
      
      updateTaskMutation.mutate({
          taskId: active.id as string,
          data: {
              columnId: targetColumnId,
              order: targetIndex
          }
      });
    }
  }
  
  const openAddColumnModal = () => setActiveModal({ type: 'addColumn' });
  const openAddTaskModal = (columnId: string) => setActiveModal({ type: 'addTask', columnId });
  const closeModal = () => setActiveModal(null);

  const openEditModal = (task: Task) => {
    setEditingTask(task);
  };
  const closeEditModal = () => {
    setEditingTask(null);
  };
  
  const requestDeleteTask = (task: Task) => {
    setConfirmationModalData({ type: 'task', id: task.id, name: task.title });
  };
  const requestDeleteColumn = (column: ColumnType) => {
    setConfirmationModalData({ type: 'column', id: column.id, name: column.title });
  };
  const cancelDeletion = () => {
    setConfirmationModalData(null);
  };
  
  const confirmDeletion = () => {
    if (!confirmationModalData) return; 

    if (confirmationModalData.type === 'task') {
      deleteTaskMutation.mutate(confirmationModalData.id);
    } else if (confirmationModalData.type === 'column') {
      deleteColumnMutation.mutate(confirmationModalData.id);
    }
    
    setConfirmationModalData(null);
  };
  
  if (isLoadingBoard && columns.length === 0) {
    return <div className={styles.boardLoading}>Carregando seu board...</div>;
  }
  
  if (isErrorBoard && columns.length === 0) {
    return <div className={styles.boardError}>Houve um erro ao carregar o board.</div>;
  }

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className={styles.boardContainer}>
        
        <div className={styles.boardHeader}>
          <h1 className={styles.boardTitle}>Board</h1>
          
          <div className={styles.boardControls}>
            
            <div className={styles.filterGroup}>
              <label htmlFor="status-filter">Filtrar por:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.select}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.searchGroup}>
              <label htmlFor="search-tasks">Buscar:</label>
              <input
                id="search-tasks"
                type="text"
                placeholder="Buscar por título..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.input}
              />
            </div>
            
            <button 
              onClick={openAddColumnModal} 
              className={styles.primaryButton}
            >
              + Adicionar Coluna
            </button>
          </div>
        </div>
        
        <div className={styles.columnsWrapper}>
          <SortableContext 
            items={columnIds} 
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((column) => (
              <Column 
                key={column.id} 
                column={column} 
                activeTask={activeTask} 
                onAddTask={openAddTaskModal} 
                onOpenEditModal={openEditModal} 
                onUpdateColumnTitle={updateColumnTitle} 
                onRequestDeleteTask={requestDeleteTask} 
                onRequestDeleteColumn={requestDeleteColumn} 
              />
            ))}
          </SortableContext>
        </div>
      </div>

      <DragOverlay>
        {activeColumn && (
          <Column 
            column={activeColumn} 
            activeTask={null} 
            onAddTask={openAddTaskModal}
            onOpenEditModal={openEditModal}
            onUpdateColumnTitle={updateColumnTitle}
            onRequestDeleteTask={requestDeleteTask}
            onRequestDeleteColumn={requestDeleteColumn}
          />
        )}
        {activeTask && (
          <TaskCard 
            task={activeTask} 
            onOpenEditModal={openEditModal}
            onRequestDelete={requestDeleteTask}
          />
        )}
      </DragOverlay>
      
      <Modal 
        isOpen={!!activeModal} 
        onClose={closeModal}
        title={
          activeModal?.type === 'addColumn' 
            ? 'Criar Nova Coluna'
            : 'Adicionar Nova Tarefa'
        }
      >
        {activeModal?.type === 'addColumn' && (
          <AddColumnForm 
            onSave={handleCreateColumn}
            onCancel={closeModal}
            isPending={createColumnMutation.isPending} 
          />
        )}
        {activeModal?.type === 'addTask' && (
          <AddTaskForm 
            onSave={(data) => handleCreateTask(activeModal.columnId, data)}
            onCancel={closeModal}
            isPending={createTaskMutation.isPending}
          />
        )}
      </Modal>
      
      <Modal
        isOpen={!!confirmationModalData}
        onClose={cancelDeletion}
        title={`Confirmar Exclusão`}
      >
        {confirmationModalData && ( 
          <div className={styles.confirmationContent}>
            <p>
              Tem certeza que deseja excluir 
              <strong> "{confirmationModalData.name}"</strong>?
            </p>
            {confirmationModalData.type === 'column' && (
              <p className={styles.warningText}>
                (Todas as tarefas dentro desta coluna também serão excluídas!)
              </p> 
            )}
            <div className={styles.confirmationButtons}>
              <button 
                onClick={cancelDeletion} 
                className={styles.cancelButton}
                disabled={deleteTaskMutation.isPending || deleteColumnMutation.isPending}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeletion} 
                className={styles.confirmDeleteButton}
                disabled={deleteTaskMutation.isPending || deleteColumnMutation.isPending}
              >
                {(deleteTaskMutation.isPending || deleteColumnMutation.isPending) 
                  ? 'Excluindo...' 
                  : 'Excluir'}
              </button>
            </div>
          </div>
        )}
      </Modal>
      
      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          onClose={closeEditModal}
          task={editingTask}
          onSave={handleUpdateTaskDetails}
          isPending={updateTaskMutation.isPending}
        />
      )}

    </DndContext>
  );
}