"use client";

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Criamos uma instância do client usando useState para garantir
  // que ele só seja criado uma vez, na primeira renderização do cliente.
  const [queryClient] = useState(() => new QueryClient({
    // Configurações globais (opcional, mas bom)
    defaultOptions: {
      queries: {
        // Evita que ele tente buscar dados novamente logo que o componente monta
        // Isso pode ser útil para evitar chamadas duplicadas
        refetchOnWindowFocus: false, 
        // Os dados não ficarão "stale" (velhos) imediatamente
        staleTime: 1000 * 60 * 5, // 5 minutos
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Ferramentas de dev, só aparecem em desenvolvimento */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}