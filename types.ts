export interface Task {
  id: string;
  title: string; // <-- MUDANÇA DE 'content' PARA 'title'
  description: string | null; // <-- NOVO CAMPO
  status: string; // <-- NOVO CAMPO
  order: number; // <-- NOVO CAMPO
  // (authorId e columnId são omitidos por enquanto, 
  //  já que a coluna já sabe seu ID e a tarefa está dentro dela)
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
}