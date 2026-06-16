import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AdminLayout } from '@/src/components/AdminLayout';
import { signOut } from '@/src/lib/auth-client';
import { getSessionFn } from '@/src/server/auth.functions';

export const Route = createFileRoute('/_admin')({
  beforeLoad: async () => {
    const session = await getSessionFn();
    if (!session) {
      throw redirect({ to: '/login' });
    }
    if (session.user.role !== 'admin') {
      throw redirect({ to: '/login', search: { error: 'forbidden' } });
    }
    return { session };
  },
  component: AdminShell,
});

function AdminShell() {
  const { session } = Route.useRouteContext();

  return (
    <AdminLayout userName={session.user.name} onLogout={async () => { await signOut(); }}>
      <Outlet />
    </AdminLayout>
  );
}
