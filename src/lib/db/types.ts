export interface BingoCard {
  B: number[];
  I: number[];
  N: (number | 'FREE')[];
  G: number[];
  O: number[];
}

export type UserRole = 'user' | 'admin';
export type SubscriptionPlan = 'free' | 'pro' | 'platinum';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type UserAccessStatus = 'active' | 'inactive' | 'expired';
