const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';

export type FirebaseUser = {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
};

let _user: FirebaseUser | null = null;
const listeners = new Set<(u: FirebaseUser | null) => void>();

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

export async function signUpWithEmail(email: string, password: string) {
  const data = await api('signUp', { email, password, returnSecureToken: true });
  _user = toUser(data);
  notify();
  return _user;
}

export async function signInWithEmail(email: string, password: string) {
  const data = await api('signInWithPassword', { email, password, returnSecureToken: true });
  _user = toUser(data);
  notify();
  return _user;
}

export async function signOut() { _user = null; notify(); }

export function onAuthStateChanged(fn: (u: FirebaseUser | null) => void) {
  listeners.add(fn);
  fn(_user);
  return () => { listeners.delete(fn); };
}

export function getCurrentUser() { return _user; }
