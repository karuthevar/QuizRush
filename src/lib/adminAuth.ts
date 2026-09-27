'use client';

// Default authorized emails and master key (can be overridden via environment variables)
const DEFAULT_ADMIN_EMAIL = 'karuthevar22@gmail.com';
const DEFAULT_ADMIN_PASSKEY = 'QuizRush@Admin2026!';
const ADMIN_STORAGE_KEY = 'quizrush_admin_session_token';
const ADMIN_SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface AdminSession {
  authenticated: boolean;
  adminEmail?: string;
  expiresAt: number;
}

export const getAuthorizedAdminEmail = (): string => {
  return process.env.NEXT_PUBLIC_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
};

export const getAdminPasskey = (): string => {
  return process.env.ADMIN_SECRET_KEY || DEFAULT_ADMIN_PASSKEY;
};

export const verifyAdminSession = (): boolean => {
  if (typeof window === 'undefined') return false;

  const raw = sessionStorage.getItem(ADMIN_STORAGE_KEY) || localStorage.getItem(ADMIN_STORAGE_KEY);
  if (!raw) return false;

  try {
    const session: AdminSession = JSON.parse(raw);
    if (!session.authenticated || Date.now() > session.expiresAt) {
      clearAdminSession();
      return false;
    }
    return true;
  } catch {
    clearAdminSession();
    return false;
  }
};

export const createAdminSession = (email?: string, remember: boolean = true): void => {
  if (typeof window === 'undefined') return;

  const session: AdminSession = {
    authenticated: true,
    adminEmail: email || 'super-admin',
    expiresAt: Date.now() + ADMIN_SESSION_DURATION_MS,
  };

  const payload = JSON.stringify(session);
  sessionStorage.setItem(ADMIN_STORAGE_KEY, payload);
  if (remember) {
    localStorage.setItem(ADMIN_STORAGE_KEY, payload);
  }
  window.dispatchEvent(new Event('quizrush_admin_auth_change'));
};

export const clearAdminSession = (): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ADMIN_STORAGE_KEY);
  localStorage.removeItem(ADMIN_STORAGE_KEY);
  window.dispatchEvent(new Event('quizrush_admin_auth_change'));
};

export const authenticateWithPasskey = (passkey: string): boolean => {
  const cleanKey = passkey.trim();
  // Validates against configured or default admin passkey
  if (cleanKey === DEFAULT_ADMIN_PASSKEY || cleanKey === process.env.NEXT_PUBLIC_ADMIN_PASSKEY) {
    createAdminSession('admin-passkey-user');
    return true;
  }
  return false;
};

export const authenticateWithGoogleEmail = (email: string): boolean => {
  const authorized = getAuthorizedAdminEmail().toLowerCase();
  if (email.trim().toLowerCase() === authorized) {
    createAdminSession(email);
    return true;
  }
  return false;
};
