import { Link } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  formatStatusLabel,
  getExpirationBadgeClass,
  formatPlanLabel,
} from '../lib/ui/subscription-badges';
import type { SubscriptionListItem } from '../server/subscriptions.server';

type SubscriptionsListProps = {
  items: SubscriptionListItem[];
  loading: boolean;
};

export function SubscriptionsList({ items, loading }: SubscriptionsListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[2.5rem] border-2 border-indigo-50 text-center">
        <p className="text-indigo-400 font-bold">Nenhuma assinatura encontrada.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border-2 border-indigo-50 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-indigo-400">
            <tr>
              <th className="p-4">Usuário</th>
              <th className="p-4">Plano</th>
              <th className="p-4">Status</th>
              <th className="p-4">Expira em</th>
              <th className="p-4">Dias</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-indigo-50 hover:bg-yellow-50/50">
                <td className="p-4">
                  <p className="font-black text-indigo-900">{item.userName}</p>
                  <p className="text-sm text-indigo-400 font-medium">{item.userEmail}</p>
                </td>
                <td className="p-4 font-bold text-indigo-700">{formatPlanLabel(item.plan)}</td>
                <td className="p-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getExpirationBadgeClass(item.effectiveStatus, item.daysRemaining)}`}
                  >
                    {formatStatusLabel(item.effectiveStatus)}
                  </span>
                </td>
                <td className="p-4 font-bold text-indigo-700">
                  {format(item.expiresAt, 'dd/MM/yyyy', { locale: ptBR })}
                </td>
                <td className="p-4 font-bold text-indigo-500">{item.daysRemaining}d</td>
                <td className="p-4">
                  <Link
                    to="/assinaturas/$id"
                    params={{ id: item.id }}
                    className="text-sm font-black text-indigo-600 hover:text-amber-600 uppercase"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
