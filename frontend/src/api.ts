import axios from 'axios';
import { clearStoredAuth, getStoredToken } from './utils/authStorage';
import { isDemoToken, maybeHandleDemoRequest } from './demo/demoApi';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = configuredApiUrl || (import.meta.env.PROD ? `${window.location.origin}/api` : 'http://localhost:8081/api');
export const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 10000);
const defaultAdapter = axios.getAdapter(axios.defaults.adapter);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number.isFinite(API_TIMEOUT_MS) && API_TIMEOUT_MS > 0 ? API_TIMEOUT_MS : 10000,
  adapter: async (config) => {
    const demoResponse = await maybeHandleDemoRequest(config);
    return demoResponse ?? defaultAdapter(config);
  },
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
    const token = getStoredToken();
    if (
      error.response?.status === 401 &&
      !isDemoToken(token) &&
      !error.config?.url?.includes('/auth/login')
    ) {
      clearStoredAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function logTechnicalError(context: string, error: unknown) {
  const status = axios.isAxiosError(error) ? error.response?.status ?? 'sem resposta' : 'erro não HTTP';
  const cause = error instanceof Error ? error.message : String(error);
  console.error(`[HelpDesk] ${context}`, {
    apiUrl: API_BASE_URL,
    status,
    cause,
    error,
  });
}

export const errorMessage = (error: unknown) =>
  axios.isAxiosError(error)
    ? error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
      ? 'Servidor indisponível no momento.'
      : !error.response
        ? 'Não foi possível conectar ao servidor. Tente novamente em alguns instantes.'
        : error.response.status >= 500
          ? 'Servidor indisponível no momento.'
          : error.response?.data?.message ?? 'Não foi possível concluir a operação.'
    : 'Erro inesperado.';

export function loginErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return 'Não foi possível conectar ao servidor. Tente novamente em alguns instantes.';
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return 'Servidor indisponível no momento.';
  }

  if (!error.response) {
    return 'Não foi possível conectar ao servidor. Tente novamente em alguns instantes.';
  }

  if (error.response.status === 401 || error.response.status === 403) {
    return 'E-mail ou senha inválidos.';
  }

  if (error.response.status === 404 || error.response.status >= 500) {
    return 'Servidor indisponível no momento.';
  }

  return error.response.data?.message ?? 'Não foi possível conectar ao servidor. Tente novamente em alguns instantes.';
}
