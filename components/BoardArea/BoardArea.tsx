"use client"; 

import Column from '../Column/Column';
import styles from './BoardArea.module.css';
import { useState, useMemo } from 'react';
import { Column as ColumnType, Task } from '@/types'; 
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverEvent // Mantemos o import caso queira reativar onDragOver depois
} from '@dnd-kit/core';
import { mockColumns } from '@/data/mock-data'; // Dados iniciais
import TaskCard from '../TaskCard/TaskCard';
import { 
  arrayMove, 
  SortableContext, 
  horizontalListSortingStrategy 
} from '@dnd-kit/sortable';

// Importa os componentes do Modal e Formulários
import Modal from '../Modal/Modal';
import AddColumnForm from '../AddColumnForm/AddColumnForm';
import AddTaskForm from '../AddTaskForm/AddTaskForm';

// Define os tipos de modal que podem estar abertos
type ModalType = 
  | null
  | { type: 'addColumn' }
  | { type: 'addTask', columnId: string };

  type ConfirmationModalData = 
  | null
  | { type: 'task', id: string, name: string } // Adicionamos 'name' para exibir no modal
  | { type: 'column', id: string, name: string };

export default function BoardArea() {
  const [columns, setColumns] = useState<ColumnType[]>(mockColumns);
  const [activeTask, setActiveTask] = useState<Task | null>(null); // Tarefa sendo arrastada
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null); // Coluna sendo arrastada
  const [activeModal, setActiveModal] = useState<ModalType>(null); // Qual modal está aberto
  const [originalColumn, setOriginalColumn] = useState<ColumnType | null>(null); // Coluna original da tarefa (para reverter DND)
  const [confirmationModalData, setConfirmationModalData] = useState<ConfirmationModalData>(null);

  // Memoiza os IDs das colunas para o SortableContext (otimização)
  const columnIds = useMemo(() => columns.map(col => col.id), [columns]);

  // Configura os sensores de DND (mouse/touch)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Exige mover 10px para iniciar o arraste
      },
    })
  );

  // --- FUNÇÕES DE CRUD ---
  
  // Cria uma nova coluna (chamada pelo modal AddColumnForm)
  function handleCreateColumn(title: string, taskContents: string[]) {
    const newColumnId = `col-${Date.now()}`; // ID único baseado no tempo
    
    // Cria os objetos Task a partir do array de strings
    const newTasks: Task[] = taskContents.map((content, index) => {
      const newTaskId = `task-${Date.now()}-${index}`; // ID único para a tarefa
      return { id: newTaskId, content };
    });

    const newColumn: ColumnType = { 
      id: newColumnId, 
      title: title, 
      tasks: newTasks 
    };

    setColumns([...columns, newColumn]); // Adiciona a nova coluna ao estado
    setActiveModal(null); // Fecha o modal
  }

  // Cria uma nova tarefa (chamada pelo modal AddTaskForm)
  function handleCreateTask(columnId: string, content: string) {
    const newTaskId = `task-${Date.now()}`; // ID único baseado no tempo
    const newTask: Task = { id: newTaskId, content: content };
    
    setColumns(prevColumns => {
      return prevColumns.map(col => {
        if (col.id === columnId) {
          // Adiciona a nova tarefa ao final da coluna correta
          return { ...col, tasks: [...col.tasks, newTask] };
        }
        return col;
      });
    });
    setActiveModal(null); // Fecha o modal
  }

  // Atualiza o conteúdo de uma tarefa existente (chamada pelo TaskCard)
  function updateTaskContent(taskId: string, newContent: string) {
    setColumns(prevColumns => {
      return prevColumns.map(col => ({
        ...col,
        tasks: col.tasks.map(task => {
          if (task.id === taskId) {
            return { ...task, content: newContent }; // Atualiza o conteúdo
          }
          return task;
        })
      }));
    });
  }

  // Atualiza o título de uma coluna existente (chamada pela Column)
  function updateColumnTitle(columnId: string, newTitle: string) {
    setColumns(prevColumns => {
      return prevColumns.map(col => {
        if (col.id === columnId) {
          return { ...col, title: newTitle }; // Atualiza o título
        }
        return col;
      });
    });
  }
  
  // Deleta uma tarefa (chamada pelo TaskCard)
  function deleteTask(taskId: string) {
    setColumns(prevColumns => 
      prevColumns.map(col => ({
        ...col,
        tasks: col.tasks.filter(task => task.id !== taskId) 
      }))
    );
  }

  function deleteColumn(columnId: string) {
    setColumns(prevColumns => 
      prevColumns.filter(col => col.id !== columnId) 
    );
  }

  // --- FUNÇÕES DO DND-KIT ---

  // Chamada quando o arraste começa
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    // Se for uma Tarefa
    if (active.data.current?.type === 'Task') {
      const task = active.data.current.task as Task;
      setActiveTask(task);
      // Guarda a coluna original para possível reversão no onDragEnd
      setOriginalColumn(
        columns.find(col => col.tasks.some(t => t.id === task.id)) || null
      );
      return;
    }
    // Se for uma Coluna
    if (active.data.current?.type === 'Column') {
      setActiveColumn(active.data.current.column as ColumnType);
      return;
    }
  }

  // Chamada quando o arraste termina (o usuário solta o item)
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    // LÓGICA DE REVERSÃO: Se soltou fora de uma zona válida E era uma tarefa sendo arrastada
    if (!over && activeTask && originalColumn) {
      setColumns(prevColumns => {
        // Encontra a coluna atual onde a tarefa pode ter parado (se onDragOver estivesse ativo)
        const currentCol = prevColumns.find(col => 
          col.tasks.some(task => task.id === active.id)
        );
        // Se já está na coluna original, não faz nada
        if (currentCol?.id === originalColumn.id) return prevColumns;

        // Remove da coluna atual (se existir)
        let newColumns = prevColumns.map(col => {
          if (col.id === currentCol?.id) {
            return { ...col, tasks: col.tasks.filter(t => t.id !== active.id) };
          }
          return col;
        });
        // Adiciona de volta à coluna original
        newColumns = newColumns.map(col => {
          if (col.id === originalColumn.id) {
             const existingTaskIndex = col.tasks.findIndex(t => t.id === activeTask.id);
             // Prevenção extra para não duplicar se algo der errado
             if(existingTaskIndex > -1) return col; 
            // Adiciona ao final (poderia ser mais complexo para manter a ordem original)
            return { ...col, tasks: [...col.tasks, activeTask] };
          }
          return col;
        });
        return newColumns;
      });
      // Limpa estados e finaliza a função
      setActiveTask(null);
      setActiveColumn(null);
      setOriginalColumn(null);
      return;
    }
    
    // Limpa estados ativos após o arraste (mesmo se soltou no mesmo lugar ou drop inválido sobre algo)
    setActiveTask(null);
    setActiveColumn(null);
    setOriginalColumn(null);
    
    if (!over) return; // Se soltou fora e não era tarefa, apenas ignora
    if (active.id === over.id) return; // Soltou sobre si mesmo

    // --- LÓGICA DE ARRASTAR COLUNA ---
    const isActiveColumn = active.data.current?.type === 'Column';
    if (isActiveColumn) {
      setColumns(prevColumns => {
        const activeColumnIndex = prevColumns.findIndex(col => col.id === active.id);
        const overColumnIndex = prevColumns.findIndex(col => col.id === over.id);
        // Segurança: verifica se os índices foram encontrados
        if (activeColumnIndex === -1 || overColumnIndex === -1) return prevColumns;
        // Usa 'arrayMove' do dnd-kit para reordenar o array de colunas
        return arrayMove(prevColumns, activeColumnIndex, overColumnIndex);
      });
      return; // Finaliza a função após reordenar coluna
    }

    // --- LÓGICA DE ARRASTAR TAREFA ---
    const isActiveTask = active.data.current?.type === 'Task';
    if (isActiveTask) {
      setColumns((prevColumns) => {
        // Encontra a coluna de origem da tarefa
        const activeColumn = prevColumns.find(col => col.tasks.some(task => task.id === active.id));
        if (!activeColumn) return prevColumns; // Segurança

        // Encontra a coluna de destino (pode ser a coluna em si ou a coluna da tarefa sobre a qual soltou)
        const overColumn = prevColumns.find(col => 
          col.id === over.id || col.tasks.some(task => task.id === over.id)
        );
        if (!overColumn) return prevColumns; // Segurança

        // CASO 1: REORDENAÇÃO (Soltou na mesma coluna)
        if (activeColumn.id === overColumn.id) {
          const activeIndex = activeColumn.tasks.findIndex(t => t.id === active.id);
          const overIndex = overColumn.tasks.findIndex(t => t.id === over.id);
          if (activeIndex === -1 || overIndex === -1) return prevColumns; // Segurança
          // Usa 'arrayMove' para reordenar o array de tarefas da coluna
          const newTasks = arrayMove(activeColumn.tasks, activeIndex, overIndex);
          return prevColumns.map(col => {
            if (col.id === activeColumn.id) {
              return { ...col, tasks: newTasks };
            }
            return col;
          });
        }

        // CASO 2: MOVIMENTAÇÃO (Soltou em coluna diferente)
        const taskToMove = activeColumn.tasks.find(t => t.id === active.id);
        if (!taskToMove) return prevColumns; // Segurança

        // Remove a tarefa da coluna de origem
        const newActiveColumnTasks = activeColumn.tasks.filter(t => t.id !== active.id);
        // Encontra o índice onde soltou na coluna de destino
        const overIndex = overColumn.tasks.findIndex(t => t.id === over.id);
        const newOverColumnTasks = [...overColumn.tasks];

        // Insere a tarefa na coluna de destino
        if (overIndex === -1) { // Se soltou na coluna (não sobre uma tarefa específica)
          newOverColumnTasks.push(taskToMove); // Adiciona no final
        } else { // Se soltou sobre uma tarefa específica
          newOverColumnTasks.splice(overIndex, 0, taskToMove); // Insere na posição
        }
        
        // Atualiza o estado das duas colunas modificadas
        return prevColumns.map(col => {
          if (col.id === activeColumn.id) {
            return { ...col, tasks: newActiveColumnTasks }; // Coluna de origem sem a tarefa
          }
          if (col.id === overColumn.id) {
            return { ...col, tasks: newOverColumnTasks }; // Coluna de destino com a tarefa
          }
          return col; // Outras colunas permanecem iguais
        });
      });
    }
  }
  
  // REMOVIDO/COMENTADO PARA EVITAR LOOP DE RENDERIZAÇÃO E BUG DE REVERSÃO
  // A atualização visual agora só acontece no onDragEnd
  // function handleDragOver(event: DragOverEvent) { /* ... */ }

  // --- FUNÇÕES DO MODAL ---
  const openAddColumnModal = () => setActiveModal({ type: 'addColumn' });
  const openAddTaskModal = (columnId: string) => setActiveModal({ type: 'addTask', columnId });
  const closeModal = () => setActiveModal(null);

  // --- 3. NOVAS FUNÇÕES PARA O MODAL DE CONFIRMAÇÃO ---
  
  // Abre o modal de confirmação para deletar Tarefa
  const requestDeleteTask = (task: Task) => {
    setConfirmationModalData({ type: 'task', id: task.id, name: task.content });
  };
  // Abre o modal de confirmação para deletar Coluna
  const requestDeleteColumn = (column: ColumnType) => {
    setConfirmationModalData({ type: 'column', id: column.id, name: column.title });
  };
  // Fecha o modal de confirmação
  const cancelDeletion = () => {
    setConfirmationModalData(null);
  };
  // Executa a deleção confirmada
  const confirmDeletion = () => {
    if (!confirmationModalData) return; // Segurança

    if (confirmationModalData.type === 'task') {
      deleteTask(confirmationModalData.id);
    } else if (confirmationModalData.type === 'column') {
      deleteColumn(confirmationModalData.id);
    }
    
    setConfirmationModalData(null); // Fecha o modal após deletar
  };

  // --- RENDER ---
  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
      // onDragOver={handleDragOver} // Removido
    >
      <div className={styles.boardContainer}>
        <h1 className={styles.boardTitle}>Meu Board</h1>
        {/* Wrapper das Colunas com rolagem horizontal */}
        <div className={styles.columnsWrapper}>
          
          {/* Contexto para reordenação HORIZONTAL das colunas */}
          <SortableContext 
            items={columnIds} 
            strategy={horizontalListSortingStrategy}
          >
            {/* Mapeia e renderiza cada coluna */}
            {columns.map((column) => (
              <Column 
                key={column.id} 
                column={column} 
                activeTask={activeTask} 
                onAddTask={openAddTaskModal} // Passa função para abrir modal de tarefa
                onUpdateTask={updateTaskContent} // Passa função de editar tarefa
                onUpdateColumnTitle={updateColumnTitle} // Passa função de editar coluna
                onRequestDeleteTask={requestDeleteTask} 
                onRequestDeleteColumn={requestDeleteColumn}
              />
            ))}
          </SortableContext>

          {/* Botão "+ Adicionar Coluna" sempre visível */}
          {/* onClick agora chama a função que abre o modal */}
          <button 
            onClick={openAddColumnModal} 
            className={styles.addNewColumnButton}
          >
            + Adicionar Coluna
          </button>
          
        </div>
      </div>

      {/* Overlay (fantasma) para itens arrastados */}
      <DragOverlay>
        {/* Renderiza um clone da Coluna se uma coluna estiver ativa */}
        {activeColumn && (
          <Column 
            column={activeColumn} 
            activeTask={null} 
            onAddTask={openAddTaskModal}
            onUpdateTask={updateTaskContent}
            onUpdateColumnTitle={updateColumnTitle}
            onRequestDeleteTask={requestDeleteTask} 
            onRequestDeleteColumn={requestDeleteColumn}
          />
        )}
        {/* Renderiza um clone da Tarefa se uma tarefa estiver ativa */}
        {activeTask && (
          <TaskCard 
            task={activeTask} 
            onUpdateTask={updateTaskContent} 
            onRequestDelete={requestDeleteTask}
          />
        )}
      </DragOverlay>

      {/* Modal para Adicionar Coluna ou Tarefa */}
      <Modal 
        isOpen={!!activeModal} 
        onClose={closeModal}
        title={
          // Define o título do modal dinamicamente
          activeModal?.type === 'addColumn' 
            ? 'Criar Nova Coluna'
            : 'Adicionar Nova Tarefa'
        }
      >
        {/* Renderiza o formulário correto dentro do modal */}
        {activeModal?.type === 'addColumn' && (
          <AddColumnForm 
            onSave={handleCreateColumn} // Chama a função de criar coluna
            onCancel={closeModal} // Fecha o modal
          />
        )}
        {activeModal?.type === 'addTask' && (
          <AddTaskForm 
            // Chama a função de criar tarefa, passando o ID da coluna ativa
            onSave={(content) => handleCreateTask(activeModal.columnId, content)}
            onCancel={closeModal} // Fecha o modal
          />
        )}
      </Modal>

      <Modal
        isOpen={!!confirmationModalData}
        onClose={cancelDeletion}
        title={`Confirmar Exclusão`}
      >
        {confirmationModalData && ( // Renderiza conteúdo só se houver dados
          <div className={styles.confirmationContent}>
            <p>
              Tem certeza que deseja excluir 
              <strong> "{confirmationModalData.name}"</strong>?
            </p>
            {/* Mensagem extra se for coluna */}
            {confirmationModalData.type === 'column' && (
              <p className={styles.warningText}>
                (Todas as tarefas dentro desta coluna também serão excluídas!)
              </p>
            )}
            <div className={styles.confirmationButtons}>
              <button onClick={cancelDeletion} className={styles.cancelButton}>
                Cancelar
              </button>
              <button onClick={confirmDeletion} className={styles.confirmDeleteButton}>
                Excluir
              </button>
            </div>
          </div>
        )}
      </Modal>

    </DndContext>
  );
}