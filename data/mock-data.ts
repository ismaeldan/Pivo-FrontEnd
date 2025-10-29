// data/mock-data.ts
import { Column } from '@/types'; // Importa o tipo que acabamos de criar

export const mockColumns: Column[] = [
  {
    id: 'col-1',
    title: 'A Fazer',
    tasks: [
      { id: 'task-1', content: 'Analisar requisitos do Pivô' },
      { id: 'task-2', content: 'Criar layout estático do board' },
    ],
  },
  {
    id: 'col-2',
    title: 'Em Progresso',
    tasks: [
      { id: 'task-3', content: 'Desenvolver componentes Column e TaskCard' },
    ],
  },
  {
    id: 'col-3',
    title: 'Concluído',
    tasks: [
      { id: 'task-4', content: 'Configurar o projeto Next.js' },
      { id: 'task-5', content: 'Remover Tailwind CSS' },
    ],
  },
];