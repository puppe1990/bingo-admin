import type { SQL } from 'drizzle-orm';
import { and, desc, eq, like, or } from 'drizzle-orm';
import type { AppDatabase } from '../lib/db/index';
import { user } from '../lib/db/schema';
import { resolveUserAccess } from '../../shared/user-access';
import type { UserAccessStatus, UserRole } from '../lib/db/types';

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super('Forbidden');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

type AdminSession = {
  user: { id: string; role?: string | null };
} | null;

export function requireAdmin(session: AdminSession): string {
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  if (session.user.role !== 'admin') {
    throw new ForbiddenError();
  }
  return session.user.id;
}

export type UserAccessView = {
  userId: string;
  name: string;
  email: string;
  isActive: boolean;
  accessExpiresAt: Date | null;
  effectiveStatus: UserAccessStatus;
  canAccess: boolean;
};

export type ClientListItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  isActive: boolean;
  accessExpiresAt: Date | null;
  effectiveStatus: UserAccessStatus;
  canAccess: boolean;
};

export type ClientAccessStats = {
  total: number;
  active: number;
  inactive: number;
  expired: number;
  expiringIn7Days: number;
  expiringIn30Days: number;
};

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export async function getUserAccess(
  db: AppDatabase,
  userId: string,
  now: Date = new Date(),
): Promise<UserAccessView> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      accessExpiresAt: user.accessExpiresAt,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const row = rows[0]!;
  const resolved = resolveUserAccess(
    { isActive: row.isActive, accessExpiresAt: row.accessExpiresAt },
    now,
  );

  return {
    userId: row.id,
    name: row.name,
    email: row.email,
    isActive: row.isActive,
    accessExpiresAt: row.accessExpiresAt,
    ...resolved,
  };
}

export async function updateUserAccess(
  db: AppDatabase,
  userId: string,
  input: { isActive: boolean; accessExpiresAt: Date | null },
): Promise<void> {
  const existing = await db.select({ id: user.id }).from(user).where(eq(user.id, userId)).limit(1);

  if (existing.length === 0) {
    throw new NotFoundError('User not found');
  }

  await db
    .update(user)
    .set({
      isActive: input.isActive,
      accessExpiresAt: input.accessExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));
}

export async function listClients(
  db: AppDatabase,
  filters: { search?: string; now?: Date } = {},
): Promise<ClientListItem[]> {
  const now = filters.now ?? new Date();
  const conditions: SQL[] = [];

  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(or(like(user.email, term), like(user.name, term))!);
  }

  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      isActive: user.isActive,
      accessExpiresAt: user.accessExpiresAt,
    })
    .from(user)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(user.createdAt));

  return users.map((row) => {
    const access = resolveUserAccess(
      { isActive: row.isActive, accessExpiresAt: row.accessExpiresAt },
      now,
    );
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as UserRole,
      createdAt: row.createdAt,
      isActive: row.isActive,
      accessExpiresAt: row.accessExpiresAt,
      effectiveStatus: access.effectiveStatus,
      canAccess: access.canAccess,
    };
  });
}

export async function getClientAccessStats(
  db: AppDatabase,
  now: Date = new Date(),
): Promise<ClientAccessStats> {
  const users = await db
    .select({
      isActive: user.isActive,
      accessExpiresAt: user.accessExpiresAt,
    })
    .from(user);

  const stats: ClientAccessStats = {
    total: users.length,
    active: 0,
    inactive: 0,
    expired: 0,
    expiringIn7Days: 0,
    expiringIn30Days: 0,
  };

  for (const row of users) {
    const access = resolveUserAccess(row, now);
    if (access.effectiveStatus === 'active') stats.active++;
    if (access.effectiveStatus === 'inactive') stats.inactive++;
    if (access.effectiveStatus === 'expired') stats.expired++;

    if (row.accessExpiresAt && row.accessExpiresAt >= now) {
      const days = daysBetween(now, row.accessExpiresAt);
      if (days <= 7) stats.expiringIn7Days++;
      if (days <= 30) stats.expiringIn30Days++;
    }
  }

  return stats;
}
