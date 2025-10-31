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
    // --- ADICIONE OS NOVOS CAMPOS ---
    description?: string | null;
    status?: string;
  }
}

// (Nova) Payload para atualizar coluna
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
  // A interface UpdateTaskPayload já foi atualizada
  const response = await apiClient(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Falha ao atualizar a tarefa');
  return response.json();
};

// (NOVO) DELETE /tasks/:taskId
const deleteTaskOnAPI = async (taskId: string) => {
  const response = await apiClient(`/tasks/${taskId}`, {
    method: 'DELETE',
  });
  if (!response.ok && response.status !== 404) {
    throw new Error('Falha ao deletar a tarefa');
  }
  return { success: true };
};

// (NOVO) POST /columns
const createColumnOnAPI = async (payload: { title: string }) => {
  const response = await apiClient('/columns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Falha ao criar a coluna');
  return response.json();
};

// (NOVO) PATCH /columns/:columnId
const updateColumnTitleOnAPI = async ({ columnId, data }: UpdateColumnPayload) => {
  const response = await apiClient(`/columns/${columnId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Falha ao atualizar o título da coluna');
  return response.json();
};

// (NOVO) DELETE /columns/:columnId
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
  const [originalColumn, setOriginalColumn] = useState<ColumnType | null>(null); 
  const [confirmationModalData, setConfirmationModalData] = useState<ConfirmationModalData>(null);
  // O estado 'editingTask' já existe, ótimo!
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const queryClient = useQueryClient();

  // --- Hooks do React Query ---

  // Query para BUSCAR (GET /board)
  const { 
    data: columnsFromAPI, 
    isLoading: isLoadingBoard,
    isError: isErrorBoard 
  } = useBoard();

  // Sincroniza a API com o estado local
  useEffect(() => {
    if (columnsFromAPI) {
      setColumns(columnsFromAPI); 
    }
  }, [columnsFromAPI]);

  // Mutação para CRIAR TAREFA (POST /tasks)
  const createTaskMutation = useMutation({
    mutationFn: createTaskOnAPI,
    onError: (error) => console.error("Erro ao criar tarefa:", error),
  });

  // Mutação para ATUALIZAR TAREFA (PATCH /tasks/:taskId) (Usada pelo DND e Edição)
  const updateTaskMutation = useMutation({
    mutationFn: updateTaskOnAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      // MODIFICAÇÃO: Fechar o modal de edição ao salvar
      closeEditModal(); 
    },
    onError: (error) => {
      console.error("Erro ao atualizar tarefa:", error);
      // Opcional: Adicionar um toast/alerta de erro aqui
      queryClient.invalidateQueries({ queryKey: ['board'] }); // Reverte
    }
  });

  // (NOVO) Mutação para CRIAR COLUNA (POST /columns)
  const createColumnMutation = useMutation({
    mutationFn: createColumnOnAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      closeModal();
    },
    onError: (error) => console.error("Erro ao criar coluna:", error),
  });

  // (NOVO) Mutação para ATUALIZAR COLUNA (PATCH /columns/:columnId)
  const updateColumnMutation = useMutation({ // 1. Nome mudou
    mutationFn: updateColumnTitleOnAPI, // 2. Função da API mudou
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar coluna:", error);
      queryClient.invalidateQueries({ queryKey: ['board'] }); // Reverte
    }
  });

  // (NOVO) Mutação para DELETAR TAREFA (DELETE /tasks/:taskId)
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

  // (NOVO) Mutação para DELETAR COLUNA (DELETE /columns/:columnId)
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
  
  // (Conectada)
  function handleCreateColumn(title: string, taskContents: string[]) {
    const hasTasks = taskContents.length > 0;

    // 1. Chamamos a mutação para criar a coluna
    createColumnMutation.mutate(
      { title: title },
      {
        // 2. Sobrescrevemos o onSuccess SÓ PARA ESTA CHAMADA
        onSuccess: (newColumnData) => {
          // newColumnData é o objeto retornado pela API (ex: { id: "...", title: "..." })
          //
          const newColumnId = newColumnData.id;

          // 3. Verificamos se é opcionalmente para criar tarefas
          if (hasTasks && newColumnId) {
            
            // Criamos um array de promessas
            const taskCreationPromises = taskContents.map(taskTitle => 
              createTaskMutation.mutateAsync({ // Usamos mutateAsync
                title: taskTitle,
                columnId: newColumnId,
              })
            );

            // 4. Esperamos todas as tarefas serem criadas
            Promise.all(taskCreationPromises)
              .then(() => {
                // 5. Só então invalidamos e fechamos
                queryClient.invalidateQueries({ queryKey: ['board'] });
                closeModal();
              })
              .catch((err) => {
                console.error("Erro ao criar tarefas em lote:", err);
                // A coluna foi criada, mas as tarefas falharam.
                // Mesmo assim, atualizamos o board para mostrar a nova coluna.
                queryClient.invalidateQueries({ queryKey: ['board'] });
                closeModal();
              });

          } else {
            // 3b. Se não tinha tarefas, só invalida e fecha
            queryClient.invalidateQueries({ queryKey: ['board'] });
            closeModal();
          }
        },
        onError: (error) => {
          // O onError definido na mutação já vai rodar,
          // mas podemos adicionar algo específico aqui se quisermos
          console.error("Falha ao criar a coluna (etapa 1):", error);
          // O modal não será fechado, o que é bom.
        }
      }
    );
  }

  // (Conectada)
 function handleCreateTask(columnId: string, data: AddTaskData) {
    createTaskMutation.mutate({
      title: data.title,
      description: data.description,
      status: data.status,
      columnId: columnId,
    }, {
      // Adicionamos a lógica de sucesso aqui, no local da chamada
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['board'] });
        closeModal(); // Fecha o modal "Adicionar Nova Tarefa"
      }
    });
  }

  // (Conectada)
  // Esta função não é mais usada, mas vamos manter por enquanto.
  // A nova handleUpdateTaskDetails faz o trabalho de edição.
  function updateTaskTitle(taskId: string, newTitle: string) {
    updateTaskMutation.mutate({
      taskId: taskId,
      data: { title: newTitle } // Envia o novo título para a API
    });
  }
  
  // (NOVA FUNÇÃO)
  // Chamada quando o modal de edição é salvo
  function handleUpdateTaskDetails(data: EditTaskData) {
    if (!editingTask) return;

    // Compara para enviar apenas o que mudou (otimização opcional)
    const { title, description, status, moveToTop } = data;
    
    // Otimização: Se nada mudou, apenas feche o modal
    const changes: {
      title: string;
      description: string | null;
      status: string;
      order?: number; // O 'order' é opcional
    } = {
      title: title,
      description: description,
      status: status,
    };

    if (moveToTop) {
      changes.order = 0; // Move para o topo
    }
    
    const dataHasChanged = 
      changes.title !== editingTask.title ||
      changes.description !== (editingTask.description || null) ||
      changes.status !== editingTask.status;

    // Se nem os dados mudaram E nem o 'moveToTop' foi marcado, não faz nada
    if (!dataHasChanged && !moveToTop) {
      closeEditModal();
      return;
    }
    
    // 4. Chama a mutação existente com os novos dados
    updateTaskMutation.mutate({
      taskId: editingTask.id,
      data: changes // 'data' agora pode conter { title, description, status, order }
    });
  }


  // (Conectada)
  function updateColumnTitle(columnId: string, newTitle: string) {
    updateColumnMutation.mutate({
      columnId: columnId,
      data: { title: newTitle }
    });
  }

  // (As funções 'deleteTask' e 'deleteColumn' não são mais necessárias aqui,
  //  pois 'confirmDeletion' chama as mutações diretamente)

  
  // --- FUNÇÕES DO DND-KIT ---
function handleDragStart(event: DragStartEvent) {
    const { active } = event;

    // CORREÇÃO: 
    // Adicionamos '&& active.data.current.task' e '&& active.data.current.column'
    // para garantir que os dados existem antes de tentar acessá-los.
    if (active.data.current?.type === 'Task' && active.data.current.task) {
      const task = active.data.current.task as Task;
      setActiveTask(task);
      setOriginalColumn(
        columns.find(col => col.tasks.some(t => t.id === task.id)) || null
      );
      return;
    }
    if (active.data.current?.type === 'Column' && active.data.current.column) {
      setActiveColumn(active.data.current.column as ColumnType);
      return;
    }
  }

  //
  // --- SUBSTITUA TODA A FUNÇÃO handleDragEnd POR ESTA ---
  //
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    // 1. Limpa estados de "arrasto"
    setActiveTask(null);
    setActiveColumn(null);

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
    // - Corrigido 'possibly undefined'
    const isActiveTask = active.data.current?.type === 'Task';
    if (isActiveTask && active.data.current?.task) {
      
      const taskToMove = active.data.current.task as Task;

      // A. Encontrar coluna de ORIGEM e índice
      const activeColumn = columns.find(col => 
        col.tasks.some(task => task.id === active.id)
      );
      if (!activeColumn) return; // Failsafe
      const activeIndex = activeColumn.tasks.findIndex(t => t.id === active.id);


      // B. Encontrar coluna de DESTINO e ÍNDICE
      //    Esta é a correção principal para
      let targetColumnId: string;
      let targetIndex: number;

      // Cenário 1: Soltou sobre uma TAREFA
      if (over.data.current?.type === 'Task') {
        // Encontra a coluna que CONTÉM a tarefa 'over'
        const overTaskColumn = columns.find(col => col.tasks.some(t => t.id === over.id));
        if (!overTaskColumn) return; // Failsafe
        
        targetColumnId = overTaskColumn.id; // <-- Pega o ID da COLUNA
        targetIndex = overTaskColumn.tasks.findIndex(t => t.id === over.id);
      } 
      // Cenário 2: Soltou sobre uma COLUNA
      else if (over.data.current?.type === 'Column') {
        targetColumnId = over.id as string; // <-- O ID de 'over' É o ID da coluna
        const overColumn = columns.find(col => col.id === targetColumnId);
        if (!overColumn) return; // Failsafe
        
        targetIndex = overColumn.tasks.length; // Adiciona ao final da coluna
      } 
      // Cenário 3: Alvo inválido (não deve acontecer)
      else {
        console.error("Alvo de drop desconhecido:", over);
        return;
      }
      
      // C. Verificar se algo realmente mudou
      if (activeColumn.id === targetColumnId && activeIndex === targetIndex) {
        return;
      }
      
      // D. Atualização Otimista (Visual) - SEPARAÇÃO DO SIDE-EFFECT
      setColumns((prev) => {
        const prevActiveCol = prev.find(c => c.id === activeColumn.id);
        const prevTargetCol = prev.find(c => c.id === targetColumnId);

        if (!prevActiveCol || !prevTargetCol) return prev; // Failsafe

        // Caso 1: Mesma coluna (Reordenação)
        if (prevActiveCol.id === prevTargetCol.id) {
          const newTasks = arrayMove(prevActiveCol.tasks, activeIndex, targetIndex);
          return prev.map(c => c.id === prevActiveCol.id ? {...c, tasks: newTasks} : c);
        } 
        // Caso 2: Colunas diferentes (Movimentação)
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

      // E. Chamada de API (Backend) - AGORA DO LADO DE FORA
      //    'targetColumnId' é garantido ser um UUID de coluna, corrigindo o erro.
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

  // Esta função já existe e está correta
  const openEditModal = (task: Task) => {
    setEditingTask(task); // Define a tarefa que o modal deve editar
  };
  // Esta função já existe e está correta
  const closeEditModal = () => {
    setEditingTask(null); // Limpa a tarefa
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
  
  // (Conectado às mutações)
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
        <h1 className={styles.boardTitle}>Meu Board</h1>
        
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
                onOpenEditModal={openEditModal} // Conectado
                onUpdateColumnTitle={updateColumnTitle} // Conectado
                onRequestDeleteTask={requestDeleteTask} // Conectado
                onRequestDeleteColumn={requestDeleteColumn} // Conectado
              />
            ))}
          </SortableContext>

          <button 
            onClick={openAddColumnModal} 
            className={styles.addNewColumnButton}
          >
            + Adicionar Coluna
          </button>
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
            isPending={createColumnMutation.isPending} // Passa o loading
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
                // Desabilita se qualquer deleção estiver ocorrendo
                disabled={deleteTaskMutation.isPending || deleteColumnMutation.isPending}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeletion} 
                className={styles.confirmDeleteButton}
                // Desabilita se qualquer deleção estiver ocorrendo
                disabled={deleteTaskMutation.isPending || deleteColumnMutation.isPending}
              >
                {/* Mostra o texto de loading correto */}
                {(deleteTaskMutation.isPending || deleteColumnMutation.isPending) 
                  ? 'Excluindo...' 
                  : 'Excluir'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* --- NOSSO NOVO MODAL DE EDIÇÃO --- */}
      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          onClose={closeEditModal}
          task={editingTask}
          onSave={handleUpdateTaskDetails}
          isPending={updateTaskMutation.isPending}
        />
      )}
      {/* --- FIM DO NOVO MODAL --- */}

    </DndContext>
  );
}