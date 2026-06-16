import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { getDb, getDbReady } from './db/index';
import * as schema from '../lib/db/schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let authInstance: any = null;

function getTrustedOrigins(baseURL: string): string[] {
  const origins = new Set<string>([baseURL]);

  if (process.env.NODE_ENV !== 'production') {
    for (const port of [3000, 3001, 3002, 5173]) {
      origins.add(`http://localhost:${port}`);
      origins.add(`http://127.0.0.1:${port}`);
    }
  }

  return [...origins];
}

export async function getAuth() {
  if (!authInstance) {
    await getDbReady();
    const db = getDb();
    const baseURL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3002';
    authInstance = betterAuth({
      database: drizzleAdapter(db, {
        provider: 'sqlite',
        schema: {
          user: schema.user,
          session: schema.session,
          account: schema.account,
          verification: schema.verification,
        },
      }),
      baseURL,
      basePath: '/api/auth',
      secret: process.env.BETTER_AUTH_SECRET,
      emailAndPassword: {
        enabled: true,
        autoSignIn: true,
      },
      user: {
        additionalFields: {
          role: {
            type: 'string',
            required: false,
            defaultValue: 'user',
            input: false,
          },
        },
      },
      trustedOrigins: getTrustedOrigins(baseURL),
      ...(process.env.NODE_ENV !== 'production' && {
        advanced: { disableOriginCheck: true },
      }),
      plugins: [tanstackStartCookies()],
    });
  }
  return authInstance;
}

export function resetAuthForTests(): void {
  authInstance = null;
}
