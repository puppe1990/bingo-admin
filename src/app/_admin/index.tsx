import { createFileRoute } from '@tanstack/react-router';
import { AdminDashboard } from '@/src/pages/AdminDashboard';

export const Route = createFileRoute('/_admin/')({
  component: AdminDashboard,
});
