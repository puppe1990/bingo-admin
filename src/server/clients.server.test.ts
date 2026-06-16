import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, destroyTestDb } from '../test/db';
import type { AppDatabase } from '../lib/db/index';
import { user } from '../lib/db/schema';
import {
  listClients,
  getUserAccess,
  updateUserAccess,
  getClientAccessStats,
  requireAdmin,
  ForbiddenError,
  UnauthorizedError,
} from './clients.server';

async function seedUser(
  db: AppDatabase,
  id: string,
  email: string,
  name: string,
  role: 'user' | 'admin' = 'user',
  options: { isActive?: boolean; accessExpiresAt?: Date | null } = {},
) {
  const now = new Date();
  await db.insert(user).values({
    id,
    name,
    email,
    emailVerified: true,
    role,
    isActive: options.isActive ?? false,
    accessExpiresAt: options.accessExpiresAt ?? null,
    createdAt: now,
    updatedAt: now,
  });
}

describe('clients.server', () => {
  let db: AppDatabase;
  let client: Awaited<ReturnType<typeof createTestDb>>['client'];
  let dbPath: string;
  const now = new Date('2026-06-14T12:00:00Z');

  beforeEach(async () => {
    const testDb = await createTestDb();
    db = testDb.db;
    client = testDb.client;
    dbPath = testDb.dbPath;

    await seedUser(db, 'u1', 'maria@test.com', 'Maria', 'user', {
      isActive: true,
      accessExpiresAt: new Date('2026-12-31T00:00:00Z'),
    });
    await seedUser(db, 'u2', 'joao@test.com', 'João');
    await seedUser(db, 'u3', 'expirado@test.com', 'Expirado', 'user', {
      isActive: true,
      accessExpiresAt: new Date('2026-05-01T00:00:00Z'),
    });
    await seedUser(db, 'admin1', 'admin@test.com', 'Admin', 'admin', {
      isActive: true,
      accessExpiresAt: new Date('2026-06-18T00:00:00Z'),
    });
  });

  afterEach(() => {
    destroyTestDb(client, dbPath);
  });

  describe('getClientAccessStats', () => {
    it('counts active, inactive and expired users', async () => {
      const stats = await getClientAccessStats(db, now);

      expect(stats).toEqual({
        total: 4,
        active: 2,
        inactive: 1,
        expired: 1,
        expiringIn7Days: 1,
        expiringIn30Days: 1,
      });
    });
  });

  describe('listClients', () => {
    it('lists all registered users', async () => {
      const clients = await listClients(db, { now });
      expect(clients).toHaveLength(4);
      expect(clients.find((c) => c.email === 'maria@test.com')).toMatchObject({
        effectiveStatus: 'active',
        canAccess: true,
      });
    });

    it('includes admin users', async () => {
      const clients = await listClients(db, { now });
      const admin = clients.find((c) => c.email === 'admin@test.com');
      expect(admin).toMatchObject({ name: 'Admin', role: 'admin' });
    });

    it('searches by email', async () => {
      const clients = await listClients(db, { search: 'maria', now });
      expect(clients).toHaveLength(1);
      expect(clients[0]?.email).toBe('maria@test.com');
    });
  });

  describe('user access admin', () => {
    it('updates isActive and accessExpiresAt', async () => {
      const expires = new Date('2026-12-31');
      await updateUserAccess(db, 'u2', { isActive: true, accessExpiresAt: expires });
      const access = await getUserAccess(db, 'u2', now);
      expect(access.isActive).toBe(true);
      expect(access.accessExpiresAt).toEqual(expires);
      expect(access.effectiveStatus).toBe('active');
      expect(access.canAccess).toBe(true);
    });

    it('defaults new users to inactive', async () => {
      await seedUser(db, 'u-new', 'new@test.com', 'Novo');
      const access = await getUserAccess(db, 'u-new', now);
      expect(access.isActive).toBe(false);
      expect(access.canAccess).toBe(false);
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
