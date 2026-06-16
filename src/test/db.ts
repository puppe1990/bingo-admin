import { unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrateClient } from '../lib/db/migrate';
import * as schema from '../lib/db/schema';

export async function createTestDb() {
  const dbPath = join(tmpdir(), `bingo-admin-test-${crypto.randomUUID()}.sqlite`);
  const client = createClient({ url: `file:${dbPath}` });
  await migrateClient(client);
  const db = drizzle(client, { schema });
  return { db, client, dbPath };
}

export function destroyTestDb(client: Client, dbPath: string) {
  if (!client.closed) {
    client.close();
  }
  try {
    unlinkSync(dbPath);
  } catch {
    // ignore cleanup errors in tests
  }
}
