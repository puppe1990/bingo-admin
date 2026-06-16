import type { SubscriptionPlan, SubscriptionStatus } from '../db/types';

export function formatPlanLabel(plan: SubscriptionPlan): string {
  const labels: Record<SubscriptionPlan, string> = {
    free: 'Gratuito',
    pro: 'Pro',
    platinum: 'Platinum',
  };
  return labels[plan];
}

export function getExpirationBadgeClass(
  effectiveStatus: SubscriptionStatus,
  daysRemaining: number,
): string {
  if (effectiveStatus === 'cancelled') {
    return 'bg-indigo-100 text-indigo-500';
  }
  if (effectiveStatus === 'expired') {
    return 'bg-red-100 text-red-700';
  }
  if (daysRemaining <= 7) {
    return 'bg-amber-100 text-amber-700';
  }
  return 'bg-emerald-100 text-emerald-700';
}

export function formatStatusLabel(status: SubscriptionStatus): string {
  const labels: Record<SubscriptionStatus, string> = {
    active: 'Ativa',
    expired: 'Expirada',
    cancelled: 'Cancelada',
  };
  return labels[status];
}
