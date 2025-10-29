// types.ts

export interface Task {
  id: string;
  content: string;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[]; // Cada coluna terá um array de tarefas
}