import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

export function createLocalLibsqlClient(url: string, authToken?: string) {
  const libsql = createClient({ url, authToken: authToken || undefined });
  return { client: libsql, db: drizzle(libsql, { schema }) };
}
