"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Column } from '@/types'; // Importe apenas o tipo Column

// 1. REMOVA a interface BoardResponse
// interface BoardResponse { ... }

// 2. Altere a função de fetch para esperar 'Column[]'
const fetchBoard = async (): Promise<Column[]> => {
  // Chamada de API (token adicionado automaticamente)
  const response = await apiClient('/board'); 
  
  if (!response.ok) {
    throw new Error('Falha ao buscar os dados do board');
  }
  
  // 3. Retorne o JSON diretamente (que deve ser o array)
  return response.json();
};

// Nosso custom hook
export const useBoard = () => {
  // 4. Altere o tipo genérico para Column[]
  return useQuery<Column[], Error>({
    queryKey: ['board'], // A chave única para esta query
    queryFn: fetchBoard, // A função que busca os dados
  });
};