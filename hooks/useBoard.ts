"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Column } from '@/types';

export interface BoardFilters {
  status?: string;
  q?: string; 
}

const fetchBoard = async (filters: BoardFilters): Promise<Column[]> => {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters.q) {
    params.append('q', filters.q);
  }
  
  const endpoint = `/columns?${params.toString()}`;

  const response = await apiClient(endpoint);
  
  if (!response.ok) {
    throw new Error('Falha ao buscar os dados do board');
  }
  
  return response.json();
};

export const useBoard = (filters: BoardFilters) => {
  return useQuery<Column[], Error>({
    queryKey: ['board', filters], 
    queryFn: () => fetchBoard(filters),
  });
};