const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const STORAGE_KEY = 'sb_session';

export type SupabaseUser = {
  id: string;
  email: string;
  user_metadata: Record<string, any>;
};

type Session = {
  access_token: string;
  refresh_token: string;
  user: SupabaseUser;
};

let _user: SupabaseUser | null = null;
const listeners = new Set<(u: SupabaseUser | null) => void>();

function notify() { listeners.forEach(fn => fn(_user)); }

function headers(token?: string): Record<string, string> {
  const h: Record<string, string> = { 'apikey': ANON_KEY, 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function authPost(path: string, body: object, token?: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST', headers: headers(token), body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || data.error || 'Auth failed');
  return data;
}

function saveSession(s: Session) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function loadSession(): Session | null {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function clearSession() { try { localStorage.removeItem(STORAGE_KEY); } catch {} }

function toUser(u: any): SupabaseUser {
  return { id: u.id, email: u.email || '', user_metadata: u.user_metadata || {} };
}

export async function initAuth() {
  if (typeof window === 'undefined') return null;
  const session = loadSession();
  if (!session) return null;
  try {
    const data = await authPost('user', {}, session.access_token);
    _user = toUser(data);
    notify();
    return _user;
  } catch {
    try {
      const refreshData = await authPost('token', {
        grant_type: 'refresh_token', refresh_token: session.refresh_token,
      });
      const newSession: Session = {
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token,
        user: toUser(refreshData.user),
      };
      saveSession(newSession);
      _user = newSession.user;
      notify();
      return _user;
    } catch {}
  }
  clearSession();
  return null;
}

export async function signUpWithEmail(email: string, password: string) {
  const data = await authPost('signup', { email, password });
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const data = await authPost('token', { grant_type: 'password', email, password });
  const session: Session = { access_token: data.access_token, refresh_token: data.refresh_token, user: toUser(data.user) };
  saveSession(session);
  _user = session.user;
  notify();
  return _user;
}

export function signInWithOAuth(provider: 'google' | 'github') {
  const redirectTo = `${window.location.origin}/auth/callback`;
  window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`;
}

export async function signOut() {
  const session = loadSession();
  if (session) {
    try { await authPost('logout', {}, session.access_token); } catch {}
  }
  clearSession();
  _user = null;
  notify();
}

export function onAuthStateChanged(fn: (u: SupabaseUser | null) => void) {
  listeners.add(fn);
  if (_user) fn(_user);
  return () => { listeners.delete(fn); };
}

export function getCurrentUser() { return _user; }
