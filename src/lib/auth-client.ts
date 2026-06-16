import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
};
