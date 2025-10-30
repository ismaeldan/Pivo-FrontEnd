// lib/apiClient.ts

// Função para pegar o token do localStorage (só funciona no cliente)
function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('access_token');
}

// Nosso wrapper de fetch personalizado
export const apiClient = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  
  const token = getAuthToken();

  // Define os headers padrão
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers, // Permite sobrescrever
  };

  // Adiciona o token de autorização se ele existir
  if (token) {
    (defaultHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // Define a URL base da sua API (!!! MUDE PARA A URL DO SEU BACKEND !!!)
  const API_BASE_URL = 'http://localhost:3100';
  
  // Monta a URL completa
  const url = `${API_BASE_URL}${endpoint}`; // O endpoint deve começar com '/' (ex: '/board')

  // Faz a chamada fetch
  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
  });

  // --- Manipulação de Erro Global ---

  // Se a resposta NÃO for OK (ex: 400, 404, 500)
  if (!response.ok) {
    
    // Se o erro for 401 (Não Autorizado), nosso token é inválido ou expirou
    if (response.status === 401) {
      // Limpa o token "podre"
      localStorage.removeItem('access_token');
      
      // Força o redirecionamento para a página de login
      // (Isso recarrega a aplicação e o AuthProvider fará o resto)
      window.location.href = '/'; 
      
      // Lança um erro para parar a execução do código (ex: no React Query)
      throw new Error('Sessão expirada. Redirecionando para o login...');
    }
    
    // Para outros erros, apenas joga o erro para o React Query tratar
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Ocorreu um erro na API.');
  }

  // Se a resposta for OK
  return response;
};