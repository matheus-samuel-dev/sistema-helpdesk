import type { User } from '../types';
import { STORAGE_KEYS } from '../config/app';

type AuthPayload = {
  token: string;
  user: User;
};

function getStoredValue(key: string) {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

export function getStoredToken() {
  return getStoredValue(STORAGE_KEYS.token);
}

export function getStoredUser() {
  const raw = getStoredValue(STORAGE_KEYS.user);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function persistAuth({ token, user }: AuthPayload, remember: boolean) {
  clearStoredAuth();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(STORAGE_KEYS.token, token);
  storage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export function clearStoredAuth() {
  [localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem(STORAGE_KEYS.token);
    storage.removeItem(STORAGE_KEYS.user);
  });
}
