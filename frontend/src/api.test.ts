import { afterEach, describe, expect, it } from 'vitest';
import { api, errorMessage } from './api';
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

  it('normalizes backend error messages', () => {
    const message = errorMessage({
      isAxiosError: true,
      response: { data: { message: 'Falha de validação.' } },
    });

    expect(message).toBe('Falha de validação.');
  });
});

