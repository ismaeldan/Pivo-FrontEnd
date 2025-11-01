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
  DragOverEvent 
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

// --- Tipos para os Modais ---
type ModalType = 
  | null
  | { type: 'addColumn' }
  | { type: 'addTask', columnId: string };

type ConfirmationModalData = 
  | null
  | { type: 'task', id: string, name: string }
  | { type: 'column', id: string, name: string }; 
// --- Fim dos Tipos ---


// --- Definições de Payload da API ---
interface CreateTaskPayload {
  title: string;
  columnId: string;
  description?: string | null; 
  status?: string;
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

interface UpdateColumnPayload {
  columnId: string;
  data: {
    title?: string;
    order?: number;
  }
}
// --- Fim dos Payloads ---


// --- Funções da API (Definidas fora do componente) ---

// POST /tasks
const createTaskOnAPI = async (payload: CreateTaskPayload): Promise<CreateTaskResponse> => {
  const response = await apiClient('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Falha ao criar a tarefa');
  return response.json();
};

// PATCH /tasks/:taskId
const updateTaskOnAPI = async ({ taskId, data }: UpdateTaskPayload) => {
  const response = await apiClient(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Falha ao atualizar a tarefa');
  return response.json();
};

// DELETE /tasks/:taskId
const deleteTaskOnAPI = async (taskId: string) => {
  const response = await apiClient(`/tasks/${taskId}`, {
    method: 'DELETE',
  });
  if (!response.ok && response.status !== 404) {
    throw new Error('Falha ao deletar a tarefa');
  }
  return { success: true };
};

// POST /columns
const createColumnOnAPI = async (payload: { title: string }) => {
  const response = await apiClient('/columns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Falha ao criar a coluna');
  return response.json();
};

// PATCH /columns/:columnId
const updateColumnTitleOnAPI = async ({ columnId, data }: UpdateColumnPayload) => {
  const response = await apiClient(`/columns/${columnId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Falha ao atualizar o título da coluna');
  return response.json();
};

// DELETE /columns/:columnId
const deleteColumnOnAPI = async (columnId: string) => {
  const response = await apiClient(`/columns/${columnId}`, {
    method: 'DELETE',
  });
  if (!response.ok && response.status !== 404) {
    throw new Error('Falha ao deletar a coluna');
  }
  return { success: true };
};
// --- Fim das Funções da API ---


export default function BoardArea() {
  const [columns, setColumns] = useState<ColumnType[]>([]); 
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  // Removido 'originalColumn' pois a nova lógica não precisa dele
  const [confirmationModalData, setConfirmationModalData] = useState<ConfirmationModalData>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const queryClient = useQueryClient();

  // --- Hooks do React Query ---

  const { 
    data: columnsFromAPI, 
    isLoading: isLoadingBoard,
    isError: isErrorBoard 
  } = useBoard();

  useEffect(() => {
    if (columnsFromAPI) {
      setColumns(columnsFromAPI); 
    }
  }, [columnsFromAPI]);

  const createTaskMutation = useMutation({
    mutationFn: createTaskOnAPI,
    onError: (error) => console.error("Erro ao criar tarefa:", error),
  });

  const updateTaskMutation = useMutation({
    mutationFn: updateTaskOnAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      closeEditModal();
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar tarefa:", error);
      // Exibe o alerta de erro
      alert(`Erro ao mover/atualizar: ${error.message}. Revertendo.`);
      // Força a reversão da UI otimista buscando os dados do servidor
      queryClient.invalidateQueries({ queryKey: ['board'] }); 
    }
  });

  const createColumnMutation = useMutation({
    mutationFn: createColumnOnAPI,
    onSuccess: (newColumnData) => {
      // Adicionada lógica para lidar com criação de tarefas
      queryClient.invalidateQueries({ queryKey: ['board'] });
      closeModal();
    },
    onError: (error) => console.error("Erro ao criar coluna:", error),
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

  // --- Fim dos Hooks ---

  const columnIds = useMemo(() => columns.map(col => col.id), [columns]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  );

  // --- FUNÇÕES DE CRUD (Conectadas às Mutações) ---
  
  function handleCreateColumn(title: string, taskContents: string[]) {
    const hasTasks = taskContents.length > 0;

    createColumnMutation.mutate(
      { title: title },
      {
        onSuccess: (newColumnData) => {
          const newColumnId = (newColumnData as ColumnType).id;

          if (hasTasks && newColumnId) {
            const taskCreationPromises = taskContents.map(taskTitle => 
              createTaskMutation.mutateAsync({ 
                title: taskTitle,
                description: null,
                status: 'pending', 
                columnId: newColumnId,
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
        onError: (error) => {
          console.error("Falha ao criar a coluna (etapa 1):", error);
        }
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

  
  // --- FUNÇÕES DO DND-KIT ---
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    // CORREÇÃO: Adiciona verificação se 'task' ou 'column' existem
    if (active.data.current?.type === 'Task' && active.data.current.task) {
      setActiveTask(active.data.current.task as Task);
      return;
    }
    if (active.data.current?.type === 'Column' && active.data.current.column) {
      setActiveColumn(active.data.current.column as ColumnType);
      return;
    }
  }

  //
  // --- FUNÇÃO handleDragEnd TOTALMENTE CORRIGIDA ---
  //
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    // 1. Limpa estados de "arrasto"
    setActiveTask(null);
    setActiveColumn(null);
    // (originalColumn não é mais necessário)

    // 2. Condições de saída
    if (!over) return; // Soltou fora de uma zona válida
    if (active.id === over.id) return; // Soltou no mesmo lugar

    // --- LÓGICA DE ARRASTAR COLUNA ---
    const isActiveColumn = active.data.current?.type === 'Column';
    if (isActiveColumn) {
      const activeColumnIndex = columns.findIndex(col => col.id === active.id);
      const overColumnIndex = columns.findIndex(col => col.id === over.id);

      if (activeColumnIndex !== -1 && overColumnIndex !== -1 && activeColumnIndex !== overColumnIndex) {
        
        // A. Atualização Otimista (Visual)
        setColumns(prevColumns => {
          return arrayMove(prevColumns, activeColumnIndex, overColumnIndex);
        });

        // B. Chamada de API (Backend)
        updateColumnMutation.mutate({
          columnId: active.id as string,
          data: { order: overColumnIndex }
        });
      }
      return; // Finaliza a função
    }


    // --- LÓGICA DE ARRASTAR TAREFA ---
    // CORREÇÃO: Verifica se a task existe em active.data.current
    const isActiveTask = active.data.current?.type === 'Task';
    if (isActiveTask && active.data.current?.task) {
      
      const taskToMove = active.data.current.task as Task;

      // A. Encontrar coluna de ORIGEM
      const activeColumn = columns.find(col => 
        col.tasks.some(task => task.id === active.id)
      );
      if (!activeColumn) return; // Failsafe
      const activeIndex = activeColumn.tasks.findIndex(t => t.id === active.id);


      // B. Encontrar coluna de DESTINO e ÍNDICE
      //    Esta é a correção principal
      let targetColumnId: string;
      let targetIndex: number;

      // Cenário 1: Soltou sobre uma TAREFA
      if (over.data.current?.type === 'Task') {
        const overTaskColumn = columns.find(col => col.tasks.some(t => t.id === over.id));
        if (!overTaskColumn) return; // Failsafe
        
        targetColumnId = overTaskColumn.id; // <-- ID da COLUNA da tarefa
        targetIndex = overTaskColumn.tasks.findIndex(t => t.id === over.id);
      } 
      // Cenário 2: Soltou sobre uma COLUNA
      else if (over.data.current?.type === 'Column') {
        targetColumnId = over.id as string; // <-- ID da COLUNA
        const overColumn = columns.find(col => col.id === targetColumnId);
        if (!overColumn) return; // Failsafe
        
        targetIndex = overColumn.tasks.length; // Adiciona ao final
      } 
      // Cenário 3: Alvo inválido
      else {
        console.error("Alvo de drop desconhecido:", over);
        return;
      }
      
      // C. Verificar se algo realmente mudou
      if (activeColumn.id === targetColumnId && activeIndex === targetIndex) {
        return;
      }
      
      // D. Atualização Otimista (Visual)
      setColumns((prev) => {
        const prevActiveCol = prev.find(c => c.id === activeColumn.id);
        const prevTargetCol = prev.find(c => c.id === targetColumnId);

        if (!prevActiveCol || !prevTargetCol) return prev; // Failsafe

        // Mesma coluna (Reordenação)
        if (prevActiveCol.id === prevTargetCol.id) {
          const newTasks = arrayMove(prevActiveCol.tasks, activeIndex, targetIndex);
          return prev.map(c => c.id === prevActiveCol.id ? {...c, tasks: newTasks} : c);
        } 
        // Colunas diferentes (Movimentação)
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

      // E. Chamada de API (Backend)
      //    Agora 'targetColumnId' é garantido ser um UUID de coluna.
      updateTaskMutation.mutate({
          taskId: active.id as string,
          data: {
              columnId: targetColumnId,
              order: targetIndex
          }
      });
    }
  }


  // --- FUNÇÕES DO MODAL ---
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

  // --- RENDER ---

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
        
        {/* Header do Board */}
        <div className={styles.boardHeader}>
          <h1 className={styles.boardTitle}>Board</h1>
          
          <div className={styles.boardControls}>
            {/* TODO: Adicionar SearchBar e Filtros aqui */}
            <button 
              onClick={openAddColumnModal} 
              className={styles.primaryButton}
            >
              + Adicionar Coluna
            </button>
          </div>
        </div>
        
        {/* Contêiner das Colunas */}
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

      {/* Modal de Adicionar Coluna/Tarefa */}
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

      {/* Modal de Confirmação de Exclusão */}
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
            {/* CORREÇÃO: Trocado </a> por </p> */}
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

      {/* Modal de Editar Tarefa */}
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