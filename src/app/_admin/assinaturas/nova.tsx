import { createFileRoute } from '@tanstack/react-router';
import { CreateSubscriptionPage } from '@/src/pages/CreateSubscriptionPage';

export const Route = createFileRoute('/_admin/assinaturas/nova')({
  component: CreateSubscriptionPage,
});
