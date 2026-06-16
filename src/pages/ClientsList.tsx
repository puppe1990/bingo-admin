import { Link } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatStatusLabel, getExpirationBadgeClass } from '../lib/ui/subscription-badges';
import { formatUserAccessLabel, getUserAccessBadgeClass } from '../lib/ui/user-access-badges';
import type { ClientListItem } from '../server/subscriptions.server';

type ClientsListProps = {
  items: ClientListItem[];
  loading: boolean;
};

export function ClientsList({ items, loading }: ClientsListProps) {
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
        <p className="text-indigo-400 font-bold">Nenhum cliente cadastrado.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border-2 border-indigo-50 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-indigo-400">
            <tr>
              <th className="p-4">Cliente</th>
              <th className="p-4">Cadastro</th>
              <th className="p-4">Acesso</th>
              <th className="p-4">Válido até</th>
              <th className="p-4">Status</th>
              <th className="p-4">Expira em</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-indigo-50 hover:bg-yellow-50/50">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-indigo-900">{item.name}</p>
                    {item.role === 'admin' && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-indigo-400 font-medium">{item.email}</p>
                </td>
                <td className="p-4 font-bold text-indigo-600 text-sm">
                  {format(item.createdAt, 'dd/MM/yyyy', { locale: ptBR })}
                </td>
                <td className="p-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getUserAccessBadgeClass(item.effectiveStatus)}`}
                  >
                    {formatUserAccessLabel(item.effectiveStatus)}
                  </span>
                </td>
                <td className="p-4 font-bold text-indigo-700">
                  {item.accessExpiresAt
                    ? format(item.accessExpiresAt, 'dd/MM/yyyy', { locale: ptBR })
                    : '—'}
                </td>
                <td className="p-4">
                  {item.subscriptionEffectiveStatus ? (
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getExpirationBadgeClass(item.subscriptionEffectiveStatus, item.daysRemaining ?? 0)}`}
                    >
                      {formatStatusLabel(item.subscriptionEffectiveStatus)}
                    </span>
                  ) : (
                    <span className="text-indigo-300 font-bold text-sm">Sem assinatura</span>
                  )}
                </td>
                <td className="p-4 font-bold text-indigo-700">
                  {item.expiresAt ? format(item.expiresAt, 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <Link
                      to="/clientes/$id"
                      params={{ id: item.id }}
                      className="text-sm font-black text-indigo-600 hover:text-amber-600 uppercase"
                    >
                      Gerenciar
                    </Link>
                    {item.subscriptionId ? (
                      <Link
                        to="/assinaturas/$id"
                        params={{ id: item.subscriptionId }}
                        className="text-sm font-black text-indigo-400 hover:text-amber-600 uppercase"
                      >
                        Ver assinatura
                      </Link>
                    ) : (
                      <Link
                        to="/assinaturas/nova"
                        search={{ userId: item.id, email: item.email }}
                        className="text-sm font-black text-emerald-600 hover:text-emerald-700 uppercase"
                      >
                        Criar assinatura
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
