import type { UserPayload } from '../providers';
import { logger } from '@learning-platform/shared';

export class AuthMiddleware {
  private excludedPaths: string[] = ['/api/auth/login', '/api/auth/register', '/health'];

  constructor(private verifyToken: (token: string) => UserPayload) {}

  addExcludedPath(path: string): void {
    this.excludedPaths.push(path);
  }

  async handle(request: { headers: Record<string, string>; path: string }): Promise<{ authorized: boolean; user?: UserPayload; error?: string }> {
    if (this.excludedPaths.some(p => request.path.startsWith(p))) {
      return { authorized: true };
    }
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authorized: false, error: 'Missing or invalid authorization header' };
    }
    try {
      const token = authHeader.substring(7);
      const user = this.verifyToken(token);
      return { authorized: true, user };
    } catch (error) {
      logger.warn('Token verification failed', { metadata: { error: error instanceof Error ? error.message : String(error) } });
      return { authorized: false, error: 'Invalid or expired token' };
    }
  }
}

export class RoleGuard {
  constructor(private allowedRoles: string[]) {}

  check(user: UserPayload): boolean {
    return this.allowedRoles.includes(user.role);
  }

  static admin(): RoleGuard {
    return new RoleGuard(['admin']);
  }

  static educator(): RoleGuard {
    return new RoleGuard(['admin', 'educator']);
  }

  static all(): RoleGuard {
    return new RoleGuard(['admin', 'educator', 'student']);
  }
}