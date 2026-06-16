import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getDb, getDbReady } from '../lib/db/index';
import { getSessionFn } from './auth.functions';
import {
  requireAdmin,
  listClients,
  getClientAccessStats,
  getUserAccess,
  updateUserAccess,
} from './clients.server';

async function adminDb() {
  await getDbReady();
  return getDb();
}

async function adminSession() {
  return getSessionFn();
}

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

export const getClientAccessStatsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await adminSession();
  requireAdmin(session);
  const db = await adminDb();
  return getClientAccessStats(db);
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
