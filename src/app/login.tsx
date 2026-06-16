import { createFileRoute } from '@tanstack/react-router';
import { AdminLoginPage } from '@/src/features/auth/admin-login-page';

export const Route = createFileRoute('/login')({
  component: AdminLoginPage,
});
