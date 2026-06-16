import { describe, it, expect } from 'vitest';
import { resolveUserAccess } from './user-access';

const now = new Date('2026-06-15T12:00:00Z');

describe('resolveUserAccess', () => {
  it('returns inactive when isActive is false', () => {
    expect(resolveUserAccess({ isActive: false, accessExpiresAt: null }, now)).toEqual({
      effectiveStatus: 'inactive',
      canAccess: false,
    });
  });

  it('returns active when isActive true and no expiry', () => {
    expect(resolveUserAccess({ isActive: true, accessExpiresAt: null }, now)).toEqual({
      effectiveStatus: 'active',
      canAccess: true,
    });
  });

  it('returns expired when date is in the past', () => {
    expect(
      resolveUserAccess({ isActive: true, accessExpiresAt: new Date('2026-01-01') }, now),
    ).toEqual({ effectiveStatus: 'expired', canAccess: false });
  });

  it('returns active when date is in the future', () => {
    expect(
      resolveUserAccess({ isActive: true, accessExpiresAt: new Date('2026-12-31') }, now),
    ).toEqual({ effectiveStatus: 'active', canAccess: true });
  });
});
