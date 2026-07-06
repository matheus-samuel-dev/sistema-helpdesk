import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth';
import { clearStoredAuth } from '../utils/authStorage';
import Login from './Login';

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Login', () => {
  afterEach(() => {
    clearStoredAuth();
  });

  it('renders login actions and remember-me option', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: /helpdesk/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: /lembrar de mim/i })).toBeChecked();
    expect(screen.getByRole('button', { name: /esqueci minha senha/i })).toBeInTheDocument();
  });

  it('opens the password reset flow', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /esqueci minha senha/i }));

    expect(screen.getByRole('dialog')).toHaveTextContent(/recupera/i);
    expect(screen.getByRole('button', { name: /gerar token/i })).toBeDisabled();
  });
});

