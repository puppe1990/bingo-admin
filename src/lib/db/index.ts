import type { Client } from '@libsql/client/web';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { migrateClient } from './migrate';

export type AppDatabase = LibSQLDatabase<typeof schema>;

let client: Client | null = null;
let dbInstance: AppDatabase | null = null;

function isRemoteLibsqlUrl(url: string): boolean {
  return url.startsWith('libsql://') || url.startsWith('https://') || url.startsWith('http://');
}

function isServerlessRuntime(): boolean {
  return process.env.NETLIFY === 'true' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function resolveDatabaseConfig(): { url: string; authToken?: string } {
  const url = process.env.TURSO_DATABASE_URL;

  if (isServerlessRuntime()) {
    if (!url || !process.env.TURSO_AUTH_TOKEN) {
      throw new Error(
        'Turso is required on Netlify. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.',
      );
    }
    return { url, authToken: process.env.TURSO_AUTH_TOKEN };
  }

  if (url && isRemoteLibsqlUrl(url)) {
    if (!process.env.TURSO_AUTH_TOKEN) {
      throw new Error('TURSO_AUTH_TOKEN is required when using a remote Turso URL.');
    }
    return { url, authToken: process.env.TURSO_AUTH_TOKEN };
  }

  return { url: url ?? 'file:../bingo-facil-turso/data/bingo-facil.sqlite' };
}

async function createConnection(url: string, authToken?: string) {
  if (isRemoteLibsqlUrl(url) || isServerlessRuntime()) {
    const { createClient } = await import('@libsql/client/web');
    const { drizzle } = await import('drizzle-orm/libsql/web');
    const libsql = createClient({ url, authToken: authToken || undefined });
    return { client: libsql, db: drizzle(libsql, { schema }) };
  }

  const isDev = import.meta.env?.DEV ?? process.env.NODE_ENV !== 'production';
  if (isDev) {
    const { createLocalLibsqlClient } = await import('./local-client');
    return createLocalLibsqlClient(url, authToken);
  }

  throw new Error('Local SQLite is only available in development.');
}

let initPromise: Promise<AppDatabase> | null = null;

export async function getDbReady(): Promise<AppDatabase> {
  if (!dbInstance) {
    if (!initPromise) {
      initPromise = (async () => {
        const { url, authToken } = resolveDatabaseConfig();
        const connection = await createConnection(url, authToken);
        client = connection.client;
        await migrateClient(client);
        dbInstance = connection.db;
        return dbInstance;
      })();
    }
    await initPromise;
  }
  return dbInstance!;
}

export function getDb(): AppDatabase {
  if (!dbInstance) {
    throw new Error('Database not ready. Call getDbReady() first.');
  }
  return dbInstance;
}

export function resetDbForTests(): void {
  if (client && !client.closed) {
    client.close();
  }
  client = null;
  dbInstance = null;
  initPromise = null;
}
