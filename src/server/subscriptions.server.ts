import type { SQL } from 'drizzle-orm';
import { and, asc, desc, eq, gte, like, lte, ne, or, sql } from 'drizzle-orm';
import type { AppDatabase } from '../lib/db/index';
import { subscriptions, user } from '../lib/db/schema';
import type { SubscriptionPlan, SubscriptionStatus } from '../lib/db/types';

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

export function resolveSubscriptionStatus(
  status: SubscriptionStatus,
  expiresAt: Date,
  now: Date = new Date(),
): SubscriptionStatus {
  if (status === 'active' && expiresAt < now) {
    return 'expired';
  }
  return status;
}

export type SubscriptionListItem = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  effectiveStatus: SubscriptionStatus;
  expiresAt: Date;
  notes: string | null;
  daysRemaining: number;
};

export type ListSubscriptionsFilters = {
  status?: SubscriptionStatus;
  plan?: SubscriptionPlan;
  expiresBefore?: Date;
  expiresAfter?: Date;
  search?: string;
  sort?: 'expiresAt_asc' | 'expiresAt_desc';
  now?: Date;
};

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function mapSubscriptionRow(
  row: {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    plan: string;
    status: string;
    expiresAt: Date;
    notes: string | null;
  },
  now: Date,
): SubscriptionListItem {
  const status = row.status as SubscriptionStatus;
  const effectiveStatus = resolveSubscriptionStatus(status, row.expiresAt, now);
  return {
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    userEmail: row.userEmail,
    plan: row.plan as SubscriptionPlan,
    status,
    effectiveStatus,
    expiresAt: row.expiresAt,
    notes: row.notes,
    daysRemaining: daysBetween(now, row.expiresAt),
  };
}

export async function listSubscriptions(
  db: AppDatabase,
  filters: ListSubscriptionsFilters = {},
): Promise<SubscriptionListItem[]> {
  const now = filters.now ?? new Date();
  const conditions: SQL[] = [];

  if (filters.plan) {
    conditions.push(eq(subscriptions.plan, filters.plan));
  }
  if (filters.expiresBefore) {
    conditions.push(lte(subscriptions.expiresAt, filters.expiresBefore));
  }
  if (filters.expiresAfter) {
    conditions.push(gte(subscriptions.expiresAt, filters.expiresAfter));
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(or(like(user.email, term), like(user.name, term)));
  }

  const orderBy =
    filters.sort === 'expiresAt_desc'
      ? desc(subscriptions.expiresAt)
      : asc(subscriptions.expiresAt);

  const rows = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      userName: user.name,
      userEmail: user.email,
      plan: subscriptions.plan,
      status: subscriptions.status,
      expiresAt: subscriptions.expiresAt,
      notes: subscriptions.notes,
    })
    .from(subscriptions)
    .innerJoin(user, eq(subscriptions.userId, user.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderBy);

  let items = rows.map((row) => mapSubscriptionRow(row, now));

  if (filters.status) {
    items = items.filter((item) => item.effectiveStatus === filters.status);
  }

  return items;
}

export type SubscriptionStats = {
  active: number;
  expiringIn7Days: number;
  expiringIn30Days: number;
  expired: number;
  cancelled: number;
};

export async function getSubscriptionStats(
  db: AppDatabase,
  now: Date = new Date(),
): Promise<SubscriptionStats> {
  const items = await listSubscriptions(db, { now });
  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);

  return items.reduce<SubscriptionStats>(
    (acc, item) => {
      if (item.effectiveStatus === 'active') {
        acc.active += 1;
        if (item.expiresAt <= in7Days) {
          acc.expiringIn7Days += 1;
        }
        if (item.expiresAt <= in30Days) {
          acc.expiringIn30Days += 1;
        }
      } else if (item.effectiveStatus === 'expired') {
        acc.expired += 1;
      } else if (item.effectiveStatus === 'cancelled') {
        acc.cancelled += 1;
      }
      return acc;
    },
    { active: 0, expiringIn7Days: 0, expiringIn30Days: 0, expired: 0, cancelled: 0 },
  );
}

export async function createSubscription(
  db: AppDatabase,
  input: { userId: string; plan: SubscriptionPlan; expiresAt: Date; notes?: string },
): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(subscriptions).values({
    id,
    userId: input.userId,
    plan: input.plan,
    status: 'active',
    expiresAt: input.expiresAt,
    notes: input.notes,
    createdAt: new Date(),
  });
  return id;
}

export async function updateSubscription(
  db: AppDatabase,
  id: string,
  input: Partial<{
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    expiresAt: Date;
    notes: string;
  }>,
): Promise<void> {
  const existing = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.id, id))
    .limit(1);

  if (existing.length === 0) {
    throw new NotFoundError('Subscription not found');
  }

  await db
    .update(subscriptions)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, id));
}

export async function extendSubscription(
  db: AppDatabase,
  id: string,
  days: number,
  now: Date = new Date(),
): Promise<void> {
  const existing = await db
    .select({ expiresAt: subscriptions.expiresAt })
    .from(subscriptions)
    .where(eq(subscriptions.id, id))
    .limit(1);

  if (existing.length === 0) {
    throw new NotFoundError('Subscription not found');
  }

  const base = existing[0]!.expiresAt > now ? existing[0]!.expiresAt : now;
  const newExpiresAt = new Date(base);
  newExpiresAt.setDate(newExpiresAt.getDate() + days);

  await updateSubscription(db, id, { expiresAt: newExpiresAt, status: 'active' });
}

export type ClientListItem = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  plan: SubscriptionPlan | null;
  effectiveStatus: SubscriptionStatus | null;
  expiresAt: Date | null;
  daysRemaining: number | null;
  hasSubscription: boolean;
  subscriptionId: string | null;
};

export async function listClients(
  db: AppDatabase,
  filters: { search?: string; now?: Date } = {},
): Promise<ClientListItem[]> {
  const now = filters.now ?? new Date();
  const conditions: SQL[] = [ne(user.role, 'admin')];

  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(or(like(user.email, term), like(user.name, term))!);
  }

  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(and(...conditions))
    .orderBy(desc(user.createdAt));

  const subscriptionsByUser = new Map<string, SubscriptionListItem>();
  for (const sub of await listSubscriptions(db, { now, search: filters.search })) {
    if (!subscriptionsByUser.has(sub.userId)) {
      subscriptionsByUser.set(sub.userId, sub);
    }
  }

  return users.map((row) => {
    const sub = subscriptionsByUser.get(row.id);
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: row.createdAt,
      plan: sub?.plan ?? null,
      effectiveStatus: sub?.effectiveStatus ?? null,
      expiresAt: sub?.expiresAt ?? null,
      daysRemaining: sub?.daysRemaining ?? null,
      hasSubscription: Boolean(sub),
      subscriptionId: sub?.id ?? null,
    };
  });
}

export async function listUsers(db: AppDatabase, search?: string) {
  const conditions: SQL[] = [ne(user.role, 'admin')];

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(or(like(user.email, term), like(user.name, term))!);
  }

  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
    .from(user)
    .where(and(...conditions))
    .orderBy(desc(user.createdAt))
    .limit(50);
}

export async function getUserSubscription(db: AppDatabase, userId: string, now: Date = new Date()) {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.expiresAt))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0]!;
  return {
    ...row,
    effectiveStatus: resolveSubscriptionStatus(row.status as SubscriptionStatus, row.expiresAt, now),
  };
}

export function getExpirationBadgeClass(effectiveStatus: SubscriptionStatus, daysRemaining: number) {
  if (effectiveStatus === 'cancelled') {
    return 'bg-indigo-100 text-indigo-500';
  }
  if (effectiveStatus === 'expired') {
    return 'bg-red-100 text-red-700';
  }
  if (daysRemaining <= 7) {
    return 'bg-amber-100 text-amber-700';
  }
  return 'bg-emerald-100 text-emerald-700';
}
