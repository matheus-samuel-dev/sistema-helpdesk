import axios from 'axios';
import { clearStoredAuth, getStoredToken } from './utils/authStorage';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8081/api',
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

export const errorMessage = (error: unknown) =>
  axios.isAxiosError(error)
    ? error.response?.data?.message ?? 'Não foi possível concluir a operação.'
    : 'Erro inesperado.';
