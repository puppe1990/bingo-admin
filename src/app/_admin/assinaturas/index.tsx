import { createFileRoute } from '@tanstack/react-router';
import { SubscriptionsPage } from '@/src/pages/SubscriptionsPage';

export const Route = createFileRoute('/_admin/assinaturas/')({
  component: SubscriptionsPage,
});
