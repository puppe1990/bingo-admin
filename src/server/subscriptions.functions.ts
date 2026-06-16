import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getDb, getDbReady } from '../lib/db/index';
import { getSessionFn } from './auth.functions';
import {
  requireAdmin,
  listSubscriptions,
  getSubscriptionStats,
  createSubscription,
  updateSubscription,
  extendSubscription,
  listUsers,
  listClients,
  getUserAccess,
  updateUserAccess,
  listSubscriptions as listSubscriptionsQuery,
} from './subscriptions.server';

async function adminDb() {
  await getDbReady();
  return getDb();
}

async function adminSession() {
  return getSessionFn();
}

export const listSubscriptionsFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z
      .object({
        status: z.enum(['active', 'expired', 'cancelled']).optional(),
        expiresBefore: z.string().optional(),
        expiresAfter: z.string().optional(),
        search: z.string().optional(),
        sort: z.enum(['expiresAt_asc', 'expiresAt_desc']).optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const session = await adminSession();
    requireAdmin(session);
    const db = await adminDb();
    return listSubscriptions(db, {
      status: data?.status,
      expiresBefore: data?.expiresBefore ? new Date(data.expiresBefore) : undefined,
      expiresAfter: data?.expiresAfter ? new Date(data.expiresAfter) : undefined,
      search: data?.search,
      sort: data?.sort,
    });
  });

export const getSubscriptionStatsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await adminSession();
  requireAdmin(session);
  const db = await adminDb();
  return getSubscriptionStats(db);
});

export const listClientsFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z
      .object({
        search: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const session = await adminSession();
    requireAdmin(session);
    const db = await adminDb();
    return listClients(db, { search: data?.search });
  });

export const listUsersFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ search: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const session = await adminSession();
    requireAdmin(session);
    const db = await adminDb();
    return listUsers(db, data?.search);
  });

export const createSubscriptionFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      userId: z.string(),
      expiresAt: z.string(),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await adminSession();
    requireAdmin(session);
    const db = await adminDb();
    return createSubscription(db, {
      userId: data.userId,
      expiresAt: new Date(data.expiresAt),
      notes: data.notes,
    });
  });

export const updateSubscriptionFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      status: z.enum(['active', 'expired', 'cancelled']).optional(),
      expiresAt: z.string().optional(),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await adminSession();
    requireAdmin(session);
    const db = await adminDb();
    await updateSubscription(db, data.id, {
      status: data.status,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      notes: data.notes,
    });
    return { ok: true };
  });

export const extendSubscriptionFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string(), days: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const session = await adminSession();
    requireAdmin(session);
    const db = await adminDb();
    await extendSubscription(db, data.id, data.days);
    return { ok: true };
  });

export const getUserAccessFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const session = await adminSession();
    requireAdmin(session);
    const db = await adminDb();
    return getUserAccess(db, data.userId);
  });

export const updateUserAccessFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      userId: z.string(),
      isActive: z.boolean(),
      accessExpiresAt: z.string().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await adminSession();
    requireAdmin(session);
    const db = await adminDb();
    await updateUserAccess(db, data.userId, {
      isActive: data.isActive,
      accessExpiresAt: data.accessExpiresAt ? new Date(data.accessExpiresAt) : null,
    });
    return { ok: true };
  });

export const getSubscriptionFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const session = await adminSession();
    requireAdmin(session);
    const db = await adminDb();
    const items = await listSubscriptionsQuery(db, {});
    const item = items.find((s) => s.id === data.id);
    if (!item) {
      throw new Error('Subscription not found');
    }
    return item;
  });
