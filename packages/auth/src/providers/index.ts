import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { logger } from '@learning-platform/shared';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
});

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export class JWTProvider {
  private secret: string;
  private refreshSecret: string;
  private accessExpiry: number = 900;
  private refreshExpiry: number = 604800;

  constructor(secret: string, refreshSecret?: string) {
    this.secret = secret;
    this.refreshSecret = refreshSecret || secret + '-refresh';
  }

  generateTokens(payload: UserPayload): AuthTokens {
    const accessToken = jwt.sign(payload, this.secret, { expiresIn: this.accessExpiry });
    const refreshToken = jwt.sign({ id: payload.id }, this.refreshSecret, { expiresIn: this.refreshExpiry });
    return { accessToken, refreshToken, expiresIn: this.accessExpiry };
  }

  verifyAccessToken(token: string): UserPayload {
    return jwt.verify(token, this.secret) as UserPayload;
  }

  verifyRefreshToken(token: string): { id: string } {
    return jwt.verify(token, this.refreshSecret) as { id: string };
  }

  refreshTokens(refreshToken: string): AuthTokens | null {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      const payload: UserPayload = { id: decoded.id, email: '', name: '', role: 'student' };
      return this.generateTokens(payload);
    } catch {
      return null;
    }
  }
}

export class PasswordHasher {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

export class ClerkProvider {
  private apiKey: string;
  private baseUrl = 'https://api.clerk.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async verifySession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch (error) {
      logger.error('Clerk session verification failed', error instanceof Error ? error : undefined);
      return false;
    }
  }

  async getUser(userId: string): Promise<UserPayload | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!response.ok) return null;
      const data: Record<string, unknown> = (await response.json()) as Record<string, unknown>;
      const emailAddresses = data.email_addresses as Array<Record<string, unknown>> | undefined;
      return { id: data.id as string, email: (emailAddresses?.[0]?.email_address as string) || '', name: `${data.first_name || ''} ${data.last_name || ''}`.trim(), role: (data.public_metadata as Record<string, unknown>)?.role as string || 'student' };
    } catch {
      return null;
    }
  }
}

export function validateLogin(email: string, password: string): { success: boolean; error?: string } {
  const result = LoginSchema.safeParse({ email, password });
  return result.success ? { success: true } : { success: false, error: result.error.errors[0].message };
}

export function validateRegistration(email: string, password: string, name: string): { success: boolean; error?: string } {
  const result = RegisterSchema.safeParse({ email, password, name });
  return result.success ? { success: true } : { success: false, error: result.error.errors[0].message };
}