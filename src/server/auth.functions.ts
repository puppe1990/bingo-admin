import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { getAuth } from '../lib/auth.server';

export const getSessionFn = createServerFn({ method: 'GET' }).handler(async () => {
  const auth = await getAuth();
  return auth.api.getSession({ headers: getRequest().headers });
});
