import type { UserAccessStatus } from '../src/lib/db/types';

export type UserAccessInput = {
  isActive: boolean;
  accessExpiresAt: Date | null;
};

export type UserAccessResult = {
  effectiveStatus: UserAccessStatus;
  canAccess: boolean;
};

export function resolveUserAccess(
  input: UserAccessInput,
  now: Date = new Date(),
): UserAccessResult {
  if (!input.isActive) {
    return { effectiveStatus: 'inactive', canAccess: false };
  }
  if (input.accessExpiresAt && input.accessExpiresAt < now) {
    return { effectiveStatus: 'expired', canAccess: false };
  }
  return { effectiveStatus: 'active', canAccess: true };
}