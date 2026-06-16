import { createFileRoute } from '@tanstack/react-router';
import { EditSubscriptionPage } from '@/src/pages/EditSubscriptionPage';

export const Route = createFileRoute('/_admin/assinaturas/$id')({
  component: EditRoute,
});

function EditRoute() {
  const { id } = Route.useParams();
  return <EditSubscriptionPage subscriptionId={id} />;
}
