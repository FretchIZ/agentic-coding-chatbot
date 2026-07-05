export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: 'USER' | 'ADMIN';
}

export interface AuthSession {
  user: AuthUser;
  expiresAt: Date;
}

export interface AuthProvider {
  getSession(): Promise<AuthSession | null>;
  signIn(provider: string): Promise<void>;
  signOut(): Promise<void>;
  getUser(): Promise<AuthUser | null>;
}

export type AuthConfig = {
  secret: string;
  jwtSecret?: string;
  providers: ('google' | 'github' | 'email')[];
  appUrl: string;
};

export function createAuth(config: AuthConfig): AuthProvider {
  return {
    async getSession() {
      return null;
    },
    async signIn(provider: string) {},
    async signOut() {},
    async getUser() {
      return null;
    },
  };
}

export function hashToken(token: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  return Array.from(new Uint8Array(data))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
