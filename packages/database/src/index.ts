import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createClient(): PrismaClient {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set');
  return globalForPrisma.prisma ?? new PrismaClient();
}

export function getPrisma(): PrismaClient {
  const client = createClient();
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client;
  return client;
}

export * from '@prisma/client';
