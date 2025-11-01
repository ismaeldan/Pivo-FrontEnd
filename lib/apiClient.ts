function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('access_token');
}

export const apiClient = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  
  const token = getAuthToken();
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (defaultHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const API_BASE_URL = 'http://localhost:3100';
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/'; 
      throw new Error('Sessão expirada. Redirecionando para o login...');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Ocorreu um erro na API.');
  }

  return response;
};