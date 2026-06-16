import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, destroyTestDb } from '../test/db';
import type { AppDatabase } from '../lib/db/index';
import { user, subscriptions } from '../lib/db/schema';
import {
  resolveSubscriptionStatus,
  listSubscriptions,
  getSubscriptionStats,
  createSubscription,
  updateSubscription,
  extendSubscription,
  listUsers,
  listClients,
  requireAdmin,
  ForbiddenError,
  UnauthorizedError,
} from './subscriptions.server';

async function seedUser(
  db: AppDatabase,
  id: string,
  email: string,
  name: string,
  role: 'user' | 'admin' = 'user',
) {
  const now = new Date();
  await db.insert(user).values({
    id,
    name,
    email,
    emailVerified: true,
    role,
    createdAt: now,
    updatedAt: now,
  });
}

async function seedSubscription(
  db: AppDatabase,
  id: string,
  userId: string,
  plan: 'free' | 'pro' | 'platinum',
  status: 'active' | 'expired' | 'cancelled',
  expiresAt: Date,
) {
  await db.insert(subscriptions).values({
    id,
    userId,
    plan,
    status,
    expiresAt,
    createdAt: new Date(),
  });
}

describe('subscriptions.server', () => {
  let db: AppDatabase;
  let client: Awaited<ReturnType<typeof createTestDb>>['client'];
  let dbPath: string;
  const now = new Date('2026-06-14T12:00:00Z');

  beforeEach(async () => {
    const testDb = await createTestDb();
    db = testDb.db;
    client = testDb.client;
    dbPath = testDb.dbPath;

    await seedUser(db, 'u1', 'maria@test.com', 'Maria');
    await seedUser(db, 'u2', 'joao@test.com', 'João');
    await seedUser(db, 'admin1', 'admin@test.com', 'Admin', 'admin');

    await seedSubscription(
      db,
      'sub-active',
      'u1',
      'pro',
      'active',
      new Date('2026-12-31T00:00:00Z'),
    );
    await seedSubscription(
      db,
      'sub-soon',
      'u2',
      'platinum',
      'active',
      new Date('2026-06-18T00:00:00Z'),
    );
    await seedSubscription(
      db,
      'sub-past',
      'u1',
      'pro',
      'active',
      new Date('2026-05-01T00:00:00Z'),
    );
    await seedSubscription(
      db,
      'sub-cancelled',
      'u2',
      'free',
      'cancelled',
      new Date('2027-01-01T00:00:00Z'),
    );
  });

  afterEach(() => {
    destroyTestDb(client, dbPath);
  });

  describe('resolveSubscriptionStatus', () => {
    it('marks active subscription with past expiresAt as expired', () => {
      expect(
        resolveSubscriptionStatus('active', new Date('2026-05-01T00:00:00Z'), now),
      ).toBe('expired');
    });

    it('keeps active subscription with future expiresAt as active', () => {
      expect(
        resolveSubscriptionStatus('active', new Date('2026-12-31T00:00:00Z'), now),
      ).toBe('active');
    });

    it('keeps cancelled status regardless of date', () => {
      expect(
        resolveSubscriptionStatus('cancelled', new Date('2027-01-01T00:00:00Z'), now),
      ).toBe('cancelled');
    });
  });

  describe('listSubscriptions', () => {
    it('filters subscriptions expiring before a date', async () => {
      const result = await listSubscriptions(db, {
        expiresBefore: new Date('2026-06-20T00:00:00Z'),
        now,
      });

      const ids = result.map((s) => s.id);
      expect(ids).toContain('sub-past');
      expect(ids).toContain('sub-soon');
      expect(ids).not.toContain('sub-active');
    });

    it('filters subscriptions expiring after a date', async () => {
      const result = await listSubscriptions(db, {
        expiresAfter: new Date('2026-07-01T00:00:00Z'),
        now,
      });

      const ids = result.map((s) => s.id);
      expect(ids).toContain('sub-active');
      expect(ids).toContain('sub-cancelled');
      expect(ids).not.toContain('sub-soon');
      expect(ids).not.toContain('sub-past');
    });

    it('searches by user email', async () => {
      const result = await listSubscriptions(db, { search: 'maria@test', now });
      expect(result.every((s) => s.userEmail.includes('maria@test'))).toBe(true);
    });

    it('sorts by expiresAt ascending by default', async () => {
      const result = await listSubscriptions(db, { now });
      const dates = result.map((s) => s.expiresAt.getTime());
      expect([...dates].sort((a, b) => a - b)).toEqual(dates);
    });
  });

  describe('getSubscriptionStats', () => {
    it('counts active, expiring soon, and expired subscriptions', async () => {
      const stats = await getSubscriptionStats(db, now);

      expect(stats.active).toBe(2);
      expect(stats.expiringIn7Days).toBe(1);
      expect(stats.expiringIn30Days).toBe(1);
      expect(stats.expired).toBe(1);
      expect(stats.cancelled).toBe(1);
    });
  });

  describe('createSubscription', () => {
    it('creates a subscription for a user', async () => {
      const expiresAt = new Date('2027-06-14T00:00:00Z');
      const id = await createSubscription(db, {
        userId: 'u2',
        plan: 'pro',
        expiresAt,
      });

      const result = await listSubscriptions(db, { search: 'joao@test', now });
      const created = result.find((s) => s.id === id);
      expect(created?.plan).toBe('pro');
      expect(created?.effectiveStatus).toBe('active');
    });
  });

  describe('updateSubscription', () => {
    it('updates plan and notes', async () => {
      await updateSubscription(db, 'sub-active', {
        plan: 'platinum',
        notes: 'Cliente VIP',
      });

      const result = await listSubscriptions(db, { search: 'maria@test', now });
      const updated = result.find((s) => s.id === 'sub-active');
      expect(updated?.plan).toBe('platinum');
      expect(updated?.notes).toBe('Cliente VIP');
    });
  });

  describe('extendSubscription', () => {
    it('adds days to expiresAt', async () => {
      await extendSubscription(db, 'sub-soon', 30, now);

      const result = await listSubscriptions(db, { search: 'joao@test', now });
      const extended = result.find((s) => s.id === 'sub-soon');
      expect(extended?.expiresAt.toISOString()).toBe('2026-07-18T00:00:00.000Z');
    });
  });

  describe('listUsers', () => {
    it('searches users by email', async () => {
      const users = await listUsers(db, 'maria');
      expect(users).toHaveLength(1);
      expect(users[0]?.email).toBe('maria@test.com');
    });

    it('lists non-admin users without search', async () => {
      const users = await listUsers(db);
      expect(users).toHaveLength(2);
      expect(users.every((u) => u.role !== 'admin')).toBe(true);
    });
  });

  describe('listClients', () => {
    it('lists all registered users including those without subscriptions', async () => {
      await seedUser(db, 'u3', 'sem-plano@test.com', 'Sem Plano');

      const clients = await listClients(db, { now });
      expect(clients).toHaveLength(3);

      const withoutPlan = clients.find((c) => c.email === 'sem-plano@test.com');
      expect(withoutPlan).toMatchObject({
        name: 'Sem Plano',
        hasSubscription: false,
        plan: null,
      });
    });

    it('does not include admin users', async () => {
      const clients = await listClients(db, { now });
      expect(clients.some((c) => c.email === 'admin@test.com')).toBe(false);
    });
  });

  describe('requireAdmin', () => {
    it('throws UnauthorizedError without session', () => {
      expect(() => requireAdmin(null)).toThrow(UnauthorizedError);
    });

    it('throws ForbiddenError for non-admin users', () => {
      expect(() =>
        requireAdmin({
          user: { id: 'u1', role: 'user' },
        }),
      ).toThrow(ForbiddenError);
    });

    it('returns user id for admin session', () => {
      const adminId = requireAdmin({
        user: { id: 'admin1', role: 'admin' },
      });
      expect(adminId).toBe('admin1');
    });
  });
});
