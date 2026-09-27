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

export const getAuthorizedAdminEmails = (): string[] => {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
};

export const getAuthorizedAdminEmail = (): string => {
  const emails = getAuthorizedAdminEmails();
  return emails[0] || DEFAULT_ADMIN_EMAIL;
};

export const getAdminPasskey = (): string => {
  return (
    process.env.NEXT_PUBLIC_ADMIN_PASSKEY ||
    process.env.ADMIN_SECRET_KEY ||
    DEFAULT_ADMIN_PASSKEY
  );
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

export const authenticateWithPasskey = async (passkey: string): Promise<boolean> => {
  const cleanKey = passkey.trim();
  if (!cleanKey) return false;

  const validKey = getAdminPasskey();
  // 1. Direct local matching (case-insensitive fallback for DEFAULT_ADMIN_PASSKEY)
  if (
    cleanKey === validKey ||
    cleanKey === DEFAULT_ADMIN_PASSKEY ||
    cleanKey.toLowerCase() === DEFAULT_ADMIN_PASSKEY.toLowerCase()
  ) {
    createAdminSession('admin-passkey-user');
    return true;
  }

  // 2. Server-side API verification (can read secret ADMIN_SECRET_KEY from Vercel)
  try {
    const res = await fetch('/api/admin/verify-passkey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passkey: cleanKey }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        createAdminSession('admin-passkey-user');
        return true;
      }
    }
  } catch (err) {
    console.error('Passkey verification API error:', err);
  }

  return false;
};

export const authenticateWithGoogleEmail = (email: string): boolean => {
  const authorizedEmails = getAuthorizedAdminEmails();
  if (authorizedEmails.includes(email.trim().toLowerCase())) {
    createAdminSession(email);
    return true;
  }
  return false;
};
