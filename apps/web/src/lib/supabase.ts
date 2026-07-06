const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const STORAGE_KEY = 'sb_session';

export type SupabaseUser = {
  id: string;
  email: string;
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
  const h: Record<string, string> = { apikey: ANON_KEY, 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function authPost(path: string, body: object, token?: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST', headers: headers(token), body: JSON.stringify(body),
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || data.error_description || data.error || 'Auth failed');
  return data;
}

function saveSession(s: Session) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function loadSession(): Session | null {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}

function clearSession() { try { localStorage.removeItem(STORAGE_KEY); } catch {} }

function toUser(u: any): SupabaseUser {
  return { id: u.id || u.sub || '', email: u.email || '' };
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
      const d = await authPost('token', { grant_type: 'refresh_token', refresh_token: session.refresh_token });
      const s: Session = { access_token: d.access_token, refresh_token: d.refresh_token, user: toUser(d.user) };
      saveSession(s);
      _user = s.user;
      notify();
      return _user;
    } catch {}
  }
  clearSession();
  return null;
}

export async function signUpWithEmail(email: string, password: string) {
  const data = await authPost('signup', { email, password });
  if (data.access_token) {
    const s: Session = { access_token: data.access_token, refresh_token: data.refresh_token, user: toUser(data.user) };
    saveSession(s);
    _user = s.user;
    notify();
    return { user: _user, needsConfirmation: false };
  }
  return { user: null, needsConfirmation: true };
}

export async function signInWithEmail(email: string, password: string) {
  const data = await authPost('token', { grant_type: 'password', email, password });
  const s: Session = { access_token: data.access_token, refresh_token: data.refresh_token, user: toUser(data.user) };
  saveSession(s);
  _user = s.user;
  notify();
  return _user;
}

export function signInWithOAuth(provider: 'google' | 'github') {
  const redirectTo = `${window.location.origin}/auth/callback`;
  window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`;
}

export async function signOut() {
  const s = loadSession();
  if (s) { try { await authPost('logout', {}, s.access_token); } catch {} }
  clearSession();
  _user = null;
  notify();
}

export function persistSessionFromHash() {
  const hash = new URLSearchParams(window.location.hash.substring(1));
  const token = hash.get('access_token');
  const refresh = hash.get('refresh_token');
  if (!token) return null;
  let u: SupabaseUser = { id: '', email: '' };
  try {
    const p = JSON.parse(atob(token.split('.')[1]));
    u = { id: p.sub, email: p.email || '' };
  } catch {}
  const s: Session = { access_token: token, refresh_token: refresh || '', user: u };
  saveSession(s);
  _user = u;
  notify();
  return u;
}

export function onAuthStateChanged(fn: (u: SupabaseUser | null) => void) {
  listeners.add(fn);
  if (_user) fn(_user);
  return () => { listeners.delete(fn); };
}

export function getCurrentUser() { return _user; }
