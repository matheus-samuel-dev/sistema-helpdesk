import axios from 'axios';
import { clearStoredAuth, getStoredToken } from './utils/authStorage';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = configuredApiUrl || (import.meta.env.PROD ? `${window.location.origin}/api` : 'http://localhost:8081/api');
export const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 10000);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number.isFinite(API_TIMEOUT_MS) && API_TIMEOUT_MS > 0 ? API_TIMEOUT_MS : 10000,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      clearStoredAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function logTechnicalError(context: string, error: unknown) {
  console.error(`[HelpDesk] ${context}`, error);
}

export const errorMessage = (error: unknown) =>
  axios.isAxiosError(error)
    ? error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
      ? 'Servidor indisponível no momento.'
      : !error.response
        ? 'Não foi possível conectar ao servidor.'
        : error.response.status >= 500
          ? 'Servidor indisponível no momento.'
          : error.response?.data?.message ?? 'Não foi possível concluir a operação.'
    : 'Erro inesperado.';

export function loginErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return 'Não foi possível concluir o login.';
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return 'Servidor indisponível no momento.';
  }

  if (!error.response) {
    return 'Não foi possível conectar ao servidor.';
  }

  if (error.response.status === 401 || error.response.status === 403) {
    return 'E-mail ou senha inválidos.';
  }

  if (error.response.status === 404 || error.response.status >= 500) {
    return 'Servidor indisponível no momento.';
  }

  return error.response.data?.message ?? 'Não foi possível concluir o login.';
}
