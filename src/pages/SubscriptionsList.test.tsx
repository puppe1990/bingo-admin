import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubscriptionsList } from '../pages/SubscriptionsList';
import type { SubscriptionListItem } from '../server/subscriptions.server';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: { children: ReactNode; to: string }) => (
    <a href={props.to}>{children}</a>
  ),
}));

const sampleItems: SubscriptionListItem[] = [
  {
    id: 'sub-1',
    userId: 'u1',
    userName: 'Maria',
    userEmail: 'maria@test.com',
    plan: 'pro',
    status: 'active',
    effectiveStatus: 'active',
    expiresAt: new Date('2026-12-31'),
    notes: null,
    daysRemaining: 200,
  },
  {
    id: 'sub-2',
    userId: 'u2',
    userName: 'João',
    userEmail: 'joao@test.com',
    plan: 'platinum',
    status: 'active',
    effectiveStatus: 'active',
    expiresAt: new Date('2026-06-18'),
    notes: null,
    daysRemaining: 4,
  },
  {
    id: 'sub-3',
    userId: 'u3',
    userName: 'Ana',
    userEmail: 'ana@test.com',
    plan: 'pro',
    status: 'active',
    effectiveStatus: 'expired',
    expiresAt: new Date('2026-05-01'),
    notes: null,
    daysRemaining: -44,
  },
];

describe('SubscriptionsList', () => {
  it('renders subscription rows with expiration badges', () => {
    render(<SubscriptionsList items={sampleItems} loading={false} />);

    expect(screen.getByText('maria@test.com')).toBeInTheDocument();
    expect(screen.getByText('joao@test.com')).toBeInTheDocument();
    expect(screen.getByText('ana@test.com')).toBeInTheDocument();

    const activeBadges = screen.getAllByText('Ativa');
    expect(activeBadges[0]).toHaveClass('bg-emerald-100', 'text-emerald-700');
    expect(activeBadges[1]).toHaveClass('bg-amber-100', 'text-amber-700');
    expect(screen.getByText('Expirada')).toHaveClass('bg-red-100', 'text-red-700');
  });

  it('shows loading spinner when loading', () => {
    const { container } = render(<SubscriptionsList items={[]} loading={true} />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
