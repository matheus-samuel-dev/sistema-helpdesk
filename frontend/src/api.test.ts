import { afterEach, describe, expect, it } from 'vitest';
import { API_BASE_URL, api, errorMessage, loginErrorMessage } from './api';
import { createDemoSession, resetDemoDataForTests } from './demo/demoApi';
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
    resetDemoDataForTests();
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
    expect(loginErrorMessage({ isAxiosError: true })).toBe(
      'Não foi possível conectar ao servidor. Tente novamente em alguns instantes.'
    );
  });

  it('serves dashboard and tickets from local demo data when using a demo token', async () => {
    const demoSession = createDemoSession();
    persistAuth(demoSession, true);

    const dashboard = await api.get('/dashboard');
    expect(dashboard.data.total).toBeGreaterThanOrEqual(20);
    expect(dashboard.data.technicianProductivity.length).toBeGreaterThanOrEqual(3);

    const created = await api.post('/tickets', {
      title: 'Chamado criado no teste demo',
      description: 'Fluxo local de demonstracao com dados persistidos no navegador.',
      priority: 'MEDIA',
      category: 'SOFTWARE',
    });

    const detail = await api.get(`/tickets/${created.data.id}`);
    expect(detail.data.title).toBe('Chamado criado no teste demo');
  });

  it('simulates the main HelpDesk flows in demo mode', async () => {
    const demoSession = createDemoSession();
    persistAuth(demoSession, true);

    const users = await api.get('/users', { params: { role: 'TECNICO', active: true, size: 100 } });
    expect(users.data.content.length).toBeGreaterThanOrEqual(3);

    const tickets = await api.get('/tickets', { params: { size: 10, sortBy: 'updatedAt', direction: 'desc' } });
    const ticket = tickets.data.content[0];
    expect(ticket).toBeTruthy();

    const updated = await api.patch(`/tickets/${ticket.id}`, {
      status: 'EM_ANDAMENTO',
      technicianId: users.data.content[0].id,
      title: `${ticket.title} atualizado`,
    });
    expect(updated.data.status).toBe('EM_ANDAMENTO');
    expect(updated.data.technician.id).toBe(users.data.content[0].id);

    const comment = await api.post(`/tickets/${ticket.id}/comments`, {
      text: 'Comentario criado no modo demo.',
      internal: false,
    });
    expect(comment.data.text).toContain('modo demo');

    const editedComment = await api.put(`/tickets/${ticket.id}/comments/${comment.data.id}`, {
      text: 'Comentario editado no modo demo.',
      internal: true,
    });
    expect(editedComment.data.internal).toBe(true);

    const file = new File(['demo'], 'evidencia-demo.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', file);
    const attachment = await api.post(`/tickets/${ticket.id}/attachments`, formData);
    expect(attachment.data.name).toBe('evidencia-demo.pdf');

    const history = await api.get(`/tickets/${ticket.id}/history`);
    expect(history.data.length).toBeGreaterThan(0);

    const activities = await api.get('/activities', { params: { text: String(ticket.id), size: 10 } });
    expect(activities.data.content.length).toBeGreaterThan(0);

    const search = await api.get('/search', { params: { q: String(ticket.id) } });
    expect(search.data.tickets.length).toBeGreaterThan(0);

    const newUser = await api.post('/users', {
      name: 'Usuario Demo Teste',
      email: 'usuario.demo.teste@helpdesk.com',
      password: 'Admin@123',
      role: 'CLIENTE',
      active: true,
    });
    expect(newUser.data.email).toBe('usuario.demo.teste@helpdesk.com');

    const blockedUser = await api.put(`/users/${newUser.data.id}`, {
      ...newUser.data,
      active: false,
      password: null,
    });
    expect(blockedUser.data.active).toBe(false);
  });
});
