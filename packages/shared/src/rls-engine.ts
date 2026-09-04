import { getPrisma } from '@codeagent/database';
import { Logger } from './api-gateway';

/**
 * Row-Level Security (RLS) Implementation
 * This module provides database-level access control through Prisma middleware
 */

const logger = new Logger('RLS');

export interface RLSContext {
  userId: string;
  role: string;
  projectId?: string;
}

export type RLSCheckResult = 'allow' | 'deny' | 'check';

/**
 * RLS Policy Evaluator
 * Enforces access control for all database operations
 */
export class RLSPolicyEngine {
  /**
   * Check if user can read a resource
   */
  static canRead(context: RLSContext, resource: 'User' | 'Project' | 'File' | 'Task', data: any): RLSCheckResult {
    const { userId, role, projectId } = context;

    // Admins can read everything
    if (role === 'ADMIN') return 'allow';

    switch (resource) {
      case 'User':
        // Users can only read their own profile
        if (data.id === userId) return 'allow';
        // Admins can read all users (covered above)
        return 'deny';

      case 'Project':
        // Owner can always read
        if (data.userId === userId) return 'allow';
        // Check project visibility and membership
        if (data.visibility === 'PUBLIC') return 'allow';
        if (data.visibility === 'INTERNAL') return 'check'; // Need membership check
        return 'deny';

      case 'File':
      case 'Task':
        // Must be project owner or member
        if (data.project?.userId === userId) return 'allow';
        // Check project membership
        if (projectId && data.projectId === projectId) return 'check';
        return 'deny';

      default:
        return 'deny';
    }
  }

  /**
   * Check if user can write/update a resource
   */
  static canWrite(context: RLSContext, resource: string, data: any): RLSCheckResult {
    const { userId, role, projectId } = context;

    // Admins can write everything
    if (role === 'ADMIN') return 'allow';

    switch (resource) {
      case 'User':
        // Users can only update their own profile
        if (data.id === userId) return 'allow';
        return 'deny';

      case 'Project':
        // Only owner can modify
        if (data.userId === userId) return 'allow';
        return 'deny';

      case 'File':
      case 'Task':
        // Must be project owner or have EDITOR role
        if (data.project?.userId === userId) return 'allow';
        if (projectId && data.projectId === projectId) return 'check'; // Verify EDITOR role
        return 'deny';

      default:
        return 'deny';
    }
  }

  /**
   * Check if user can delete a resource
   */
  static canDelete(context: RLSContext, resource: string, data: any): RLSCheckResult {
    const { userId, role } = context;

    // Admins can delete everything
    if (role === 'ADMIN') return 'allow';

    switch (resource) {
      case 'Project':
      case 'User':
        // Only owner can delete
        if (data.userId === userId || data.id === userId) return 'allow';
        return 'deny';

      default:
        return 'deny';
    }
  }
}

/**
 * Enhanced Prisma Client with RLS
 */
export function createRLSEnabledClient(userId: string, role: string, projectId?: string) {
  const prisma = getPrisma();
  const context: RLSContext = { userId, role, projectId };

  // Wrap query methods with RLS checks
  return {
    async getProject(id: string) {
      const project = await prisma.project.findUnique({ where: { id } });
      if (!project) return null;
      if (RLSPolicyEngine.canRead(context, 'Project', project) === 'deny') {
        throw new Error('Access denied');
      }
      return project;
    },

    async getUserProjects(limit: number = 10, offset: number = 0) {
      return prisma.project.findMany({
        where: { userId },
        take: limit,
        skip: offset,
      });
    },

    async getProjectFiles(projectId: string) {
      const project = await this.getProject(projectId);
      if (!project) throw new Error('Project not found');

      return prisma.file.findMany({
        where: { projectId },
      });
    },

    async updateFile(fileId: string, data: any) {
      const file = await prisma.file.findUnique({ where: { id: fileId } });
      if (!file) throw new Error('File not found');

      if (RLSPolicyEngine.canWrite(context, 'File', { ...file, projectId: file.projectId }) === 'deny') {
        throw new Error('Access denied');
      }

      return prisma.file.update({ where: { id: fileId }, data });
    },

    async deleteProject(projectId: string) {
      const project = await this.getProject(projectId);
      if (!project) throw new Error('Project not found');

      if (RLSPolicyEngine.canDelete(context, 'Project', project) === 'deny') {
        throw new Error('Access denied');
      }

      return prisma.project.delete({ where: { id: projectId } });
    },
  };
}

/**
 * SQL-Level RLS Policies (for direct SQL or additional layer)
 * These would be applied via Prisma migration
 */
export const RLS_POLICIES = `
-- Enable RLS for all tables
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- User table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_read ON "User" FOR SELECT
  USING (auth.uid() = id OR auth.role() = 'admin');
CREATE POLICY user_update ON "User" FOR UPDATE
  USING (auth.uid() = id);
CREATE POLICY user_delete ON "User" FOR DELETE
  USING (auth.uid() = id);

-- Project table
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_read ON "Project" FOR SELECT
  USING (
    "userId" = auth.uid() 
    OR visibility = 'PUBLIC'
    OR (visibility = 'INTERNAL' AND EXISTS (
      SELECT 1 FROM "ProjectMember" WHERE "projectId" = "Project"."id" 
      AND email = auth.email()
    ))
  );
CREATE POLICY project_write ON "Project" FOR UPDATE
  USING ("userId" = auth.uid());
CREATE POLICY project_delete ON "Project" FOR DELETE
  USING ("userId" = auth.uid());

-- File table
ALTER TABLE "File" ENABLE ROW LEVEL SECURITY;
CREATE POLICY file_read ON "File" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "Project" 
    WHERE "Project"."id" = "File"."projectId"
    AND ("Project"."userId" = auth.uid() OR "Project"."visibility" = 'PUBLIC')
  ));
CREATE POLICY file_write ON "File" FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM "Project" 
    WHERE "Project"."id" = "File"."projectId"
    AND "Project"."userId" = auth.uid()
  ));

-- Task table
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
CREATE POLICY task_read ON "Task" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "Project" 
    WHERE "Project"."id" = "Task"."projectId"
    AND ("Project"."userId" = auth.uid())
  ));
CREATE POLICY task_write ON "Task" FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM "Project" 
    WHERE "Project"."id" = "Task"."projectId"
    AND "Project"."userId" = auth.uid()
  ));

-- AuditLog table (append-only, users can read their own)
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_log_read ON "AuditLog" FOR SELECT
  USING ("userId" = auth.uid() OR auth.role() = 'admin');

-- Create indexes for RLS queries
CREATE INDEX project_user_id_idx ON "Project"("userId");
CREATE INDEX file_project_id_idx ON "File"("projectId");
CREATE INDEX task_project_id_idx ON "Task"("projectId");
CREATE INDEX project_member_project_id_idx ON "ProjectMember"("projectId");
CREATE INDEX audit_log_user_id_idx ON "AuditLog"("userId");
`;

/**
 * Audit logging helper
 */
export async function logAudit(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  changes?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
) {
  const prisma = getPrisma();

  try {
    await (prisma as any).auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        changes,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    logger.error('Failed to log audit event', error);
  }
}

/**
 * Soft delete helper (for GDPR compliance)
 */
export async function softDeleteUser(userId: string) {
  const prisma = getPrisma();

  await (prisma as any).user.update({
    where: { id: userId },
    data: {
      status: 'DELETED',
      // Anonymize sensitive data
      email: `deleted-${userId}@example.com`,
      name: null,
      image: null,
    },
  });

  // Log audit event
  await logAudit(userId, 'DELETE', 'User', userId);
}

/**
 * Check if user is project member with specific role
 */
export async function hasProjectAccess(
  userId: string,
  projectId: string,
  requiredRole: 'VIEWER' | 'EDITOR' | 'ADMIN' = 'VIEWER'
): Promise<boolean> {
  const prisma = getPrisma();

  // Project owner always has access
  const project = await (prisma as any).project.findUnique({ where: { id: projectId } });
  if (project?.userId === userId) return true;

  // Check membership
  const roleHierarchy: Record<string, number> = { VIEWER: 0, EDITOR: 1, ADMIN: 2 };
  const member = await (prisma as any).projectMember.findFirst({
    where: {
      projectId,
      email: ((await (prisma as any).user.findUnique({ where: { id: userId } })) as any)?.email,
    },
  });

  if (!member) return false;
  return (roleHierarchy[member.role] || 0) >= (roleHierarchy[requiredRole] || 0);
}
