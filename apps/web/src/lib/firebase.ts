const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';

export type FirebaseUser = {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
};

let _user: FirebaseUser | null = null;
const listeners = new Set<(u: FirebaseUser | null) => void>();
const tokenRefresh = new Map<string, string>();

function notify() { listeners.forEach(fn => fn(_user)); }

async function api(endpoint: string, body: object) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

function toUser(d: any): FirebaseUser {
  return { uid: d.localId, email: d.email || '', displayName: d.displayName || null, photoURL: d.photoUrl || null };
}

// ── Email / Password ──

export async function signUpWithEmail(email: string, password: string) {
  const data = await api('signUp', { email, password, returnSecureToken: true });
  tokenRefresh.set(data.localId, data.refreshToken);
  _user = toUser(data);
  notify();
  return _user;
}

export async function signInWithEmail(email: string, password: string) {
  const data = await api('signInWithPassword', { email, password, returnSecureToken: true });
  tokenRefresh.set(data.localId, data.refreshToken);
  _user = toUser(data);
  notify();
  return _user;
}

// ── OAuth helpers ──

function oauthPopup(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const w = window.open(url, 'oauth', 'width=600,height=700');
    if (!w) { reject(new Error('Popup blocked')); return; }
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data;
      if (d?.type === 'oauth' && d?.accessToken) {
        window.removeEventListener('message', handler);
        clearInterval(timer);
        resolve(d.accessToken);
      }
    };
    window.addEventListener('message', handler);
    const timer = setInterval(() => {
      if (w.closed) { clearInterval(timer); window.removeEventListener('message', handler); reject(new Error('Popup closed')); }
    }, 500);
  });
}

async function signInWithProvider(providerId: string, accessToken: string) {
  const data = await api('signInWithIdp', {
    requestUri: window.location.origin + '/auth/callback',
    postBody: `access_token=${accessToken}&providerId=${providerId}`,
    returnSecureToken: true,
  });
  _user = toUser(data);
  notify();
  return _user;
}

// ── Google OAuth ──

export async function signInWithGoogle() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Set NEXT_PUBLIC_GOOGLE_CLIENT_ID');
  const redirectUri = `${window.location.origin}/auth/callback?provider=google.com`;
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=email%20profile`;
  const accessToken = await oauthPopup(url);
  return signInWithProvider('google.com', accessToken);
}

// ── GitHub OAuth ──

export async function signInWithGithub() {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  if (!clientId) throw new Error('Set NEXT_PUBLIC_GITHUB_CLIENT_ID');
  const redirectUri = `${window.location.origin}/auth/callback?provider=github.com`;
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
  const accessToken = await oauthPopup(url);
  return signInWithProvider('github.com', accessToken);
}

// ── Sign out / state ──

export async function signOut() { _user = null; notify(); }

export function onAuthStateChanged(fn: (u: FirebaseUser | null) => void) {
  listeners.add(fn);
  fn(_user);
  return () => { listeners.delete(fn); };
}

export function getCurrentUser() { return _user; }
