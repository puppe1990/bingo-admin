import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Plus, Filter } from 'lucide-react';
import { listSubscriptionsFn } from '../server/subscriptions.functions';
import { SubscriptionsList } from './SubscriptionsList';
import type { SubscriptionListItem } from '../server/subscriptions.server';

export function SubscriptionsPage() {
  const [items, setItems] = useState<SubscriptionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [expiresBefore, setExpiresBefore] = useState('');
  const [expiresAfter, setExpiresAfter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await listSubscriptionsFn({
        data: {
          search: search || undefined,
          status: status ? (status as 'active' | 'expired' | 'cancelled') : undefined,
          expiresBefore: expiresBefore || undefined,
          expiresAfter: expiresAfter || undefined,
          sort: 'expiresAt_asc',
        },
      });
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-indigo-900 uppercase">Assinaturas</h1>
          <p className="text-indigo-600 font-medium">Filtre e gerencie por data de expiração.</p>
        </div>
        <Link
          to="/assinaturas/nova"
          search={{ userId: undefined, email: undefined }}
          className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all uppercase text-sm"
        >
          <Plus className="w-5 h-5" />
          Nova
        </Link>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border-2 border-indigo-50 space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 font-black uppercase text-[10px] tracking-widest">
          <Filter className="w-4 h-4" />
          Filtros
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="search"
            placeholder="Buscar e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-3 bg-indigo-50 rounded-2xl font-bold text-indigo-900 outline-none"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-3 bg-indigo-50 rounded-2xl font-bold text-indigo-900 outline-none"
          >
            <option value="">Todos os status</option>
            <option value="active">Ativa</option>
            <option value="expired">Expirada</option>
            <option value="cancelled">Cancelada</option>
          </select>
          <input
            type="date"
            value={expiresAfter}
            onChange={(e) => setExpiresAfter(e.target.value)}
            className="px-4 py-3 bg-indigo-50 rounded-2xl font-bold text-indigo-900 outline-none"
            aria-label="Expira depois de"
          />
          <input
            type="date"
            value={expiresBefore}
            onChange={(e) => setExpiresBefore(e.target.value)}
            className="px-4 py-3 bg-indigo-50 rounded-2xl font-bold text-indigo-900 outline-none"
            aria-label="Expira antes de"
          />
        </div>
        <button
          type="button"
          onClick={load}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-sm hover:bg-indigo-700 transition-all"
        >
          Aplicar filtros
        </button>
      </div>

      <SubscriptionsList items={items} loading={loading} />
    </div>
  );
}
