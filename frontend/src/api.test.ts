import { afterEach, describe, expect, it } from 'vitest';
import { API_BASE_URL, api, errorMessage, loginErrorMessage } from './api';
import type { User } from './types';
import { clearStoredAuth, persistAuth } from './utils/authStorage';

const user: User = {
  id: 1,
  name: 'Admin',
  email: 'admin@helpdesk.com',
  role: 'ADMIN',
  active: true,
};

describe('api client', () => {
  afterEach(() => {
    clearStoredAuth();
  });

  it('adds bearer token to authenticated requests', async () => {
    persistAuth({ token: 'jwt-token', user }, true);

    await api.get('/tickets', {
      adapter: async (config) => {
        expect(config.headers.Authorization).toBe('Bearer jwt-token');
        return {
          data: { ok: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      },
    });
  });

  it('uses the configured API base URL and request timeout', () => {
    expect(API_BASE_URL).toBeTruthy();
    expect(api.defaults.timeout).toBeGreaterThanOrEqual(1000);
  });

  it('normalizes backend error messages', () => {
    const message = errorMessage({
      isAxiosError: true,
      response: { data: { message: 'Falha de validação.' } },
    });

    expect(message).toBe('Falha de validação.');
  });

  it('maps login errors to friendly messages', () => {
    expect(loginErrorMessage({ isAxiosError: true, response: { status: 401, data: {} } })).toBe(
      'E-mail ou senha inválidos.'
    );
    expect(loginErrorMessage({ isAxiosError: true, code: 'ECONNABORTED' })).toBe(
      'Servidor indisponível no momento.'
    );
    expect(loginErrorMessage({ isAxiosError: true })).toBe('Não foi possível conectar ao servidor.');
  });
});

