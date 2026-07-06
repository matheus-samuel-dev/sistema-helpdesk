import { afterEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../config/app';
import type { User } from '../types';
import { clearStoredAuth, getStoredToken, getStoredUser, persistAuth } from './authStorage';

const user: User = {
  id: 1,
  name: 'Admin',
  email: 'admin@helpdesk.com',
  role: 'ADMIN',
  active: true,
};

describe('authStorage', () => {
  afterEach(() => {
    clearStoredAuth();
  });

  it('persists remembered sessions in localStorage', () => {
    persistAuth({ token: 'token-local', user }, true);

    expect(localStorage.getItem(STORAGE_KEYS.token)).toBe('token-local');
    expect(sessionStorage.getItem(STORAGE_KEYS.token)).toBeNull();
    expect(getStoredToken()).toBe('token-local');
    expect(getStoredUser()).toEqual(user);
  });

  it('persists temporary sessions in sessionStorage', () => {
    persistAuth({ token: 'token-session', user }, false);

    expect(localStorage.getItem(STORAGE_KEYS.token)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.token)).toBe('token-session');
    expect(getStoredToken()).toBe('token-session');
  });

  it('clears auth data from both storages', () => {
    localStorage.setItem(STORAGE_KEYS.token, 'local');
    sessionStorage.setItem(STORAGE_KEYS.token, 'session');

    clearStoredAuth();

    expect(localStorage.getItem(STORAGE_KEYS.token)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.token)).toBeNull();
  });
});

