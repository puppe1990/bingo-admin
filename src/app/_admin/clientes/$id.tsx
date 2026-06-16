import { createFileRoute } from '@tanstack/react-router';
import { EditClientPage } from '@/src/pages/EditClientPage';

export const Route = createFileRoute('/_admin/clientes/$id')({
  component: EditRoute,
});

function EditRoute() {
  const { id } = Route.useParams();
  return <EditClientPage userId={id} />;
}