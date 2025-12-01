import axios, { AxiosError, AxiosResponse } from "axios";

import { getStoredToken } from "@/lib/auth-storage";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const normalizedBaseUrl = rawBaseUrl.endsWith("/api")
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/$/, "")}/api`;

const api = axios.create({
  baseURL: normalizedBaseUrl,
  timeout: 15000, // 15 segundos (reduzido de 30s)
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Interceptor de requisição
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Se a resposta é um blob, retorna diretamente
    if (response.config.responseType === 'blob') {
      return response;
    }
    return response;
  },
  (error: AxiosError) => {
    // Tratamento centralizado de erros
    const handledError = handleApiErrorResponse(error);
    
    // Se o erro é relacionado a blob, tenta converter
    if (error.config?.responseType === 'blob' && error.response?.data) {
      const blob = error.response.data instanceof Blob 
        ? error.response.data 
        : new Blob([String(error.response.data)], { type: 'application/json' });
      return Promise.reject({ ...handledError, blob });
    }
    
    return Promise.reject(handledError);
  }
);

/**
 * Trata erros da API de forma centralizada
 */
function handleApiErrorResponse(error: AxiosError): AxiosError {
  // Erro de rede (sem resposta do servidor)
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      error.message = 'Tempo de requisição excedido. Tente novamente.';
    } else if (error.request) {
      error.message = 'Erro de conexão. Verifique sua internet.';
    } else {
      error.message = 'Erro inesperado ao processar requisição.';
    }
    return error;
  }

  const status = error.response.status;
  const data = error.response.data as { message?: string; errors?: Record<string, string | string[]> };

  // Tratamento por status HTTP
  switch (status) {
    case 401:
      // Não autenticado - redirecionar para home
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      error.message = data?.message || 'Sessão expirada. Faça login novamente.';
      break;

    case 403:
      error.message = data?.message || 'Você não tem permissão para realizar esta ação.';
      break;

    case 404:
      error.message = data?.message || 'Recurso não encontrado.';
      break;

    case 422:
      // Erro de validação
      const validationErrors = extractValidationErrors(data);
      error.message = validationErrors || data?.message || 'Dados inválidos. Verifique os campos.';
      break;

    case 429:
      error.message = 'Muitas requisições. Aguarde um momento e tente novamente.';
      break;

    case 500:
    case 502:
    case 503:
      error.message = 'Erro no servidor. Tente novamente mais tarde.';
      break;

    default:
      error.message = data?.message || 'Erro inesperado. Tente novamente.';
  }

  return error;
}

/**
 * Extrai mensagens de erro de validação
 */
function extractValidationErrors(data: { errors?: Record<string, string | string[]> }): string | null {
  if (!data?.errors) return null;

  const errors = data.errors;
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return null;

  const value = errors[firstKey];
  return Array.isArray(value) ? value[0] : value;
}

export default api;
 
