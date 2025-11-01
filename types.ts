export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
}