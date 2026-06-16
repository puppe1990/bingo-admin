import { createFileRoute } from '@tanstack/react-router';
import { CreateSubscriptionPage } from '@/src/pages/CreateSubscriptionPage';

export const Route = createFileRoute('/_admin/assinaturas/nova')({
  validateSearch: (search: Record<string, unknown>) => ({
    userId: typeof search.userId === 'string' ? search.userId : undefined,
    email: typeof search.email === 'string' ? search.email : undefined,
  }),
  component: CreateSubscriptionPage,
});
