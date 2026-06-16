import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { CreditCard, Plus, AlertTriangle } from 'lucide-react';
import { getSubscriptionStatsFn, listSubscriptionsFn } from '../server/subscriptions.functions';
import { SubscriptionsList } from './SubscriptionsList';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    active: 0,
    expiringIn7Days: 0,
    expiringIn30Days: 0,
    expired: 0,
    cancelled: 0,
  });
  const [upcoming, setUpcoming] = useState<Awaited<ReturnType<typeof listSubscriptionsFn>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsData, listData] = await Promise.all([
          getSubscriptionStatsFn(),
          listSubscriptionsFn({ data: { sort: 'expiresAt_asc' } }),
        ]);
        setStats(statsData);
        setUpcoming(listData.slice(0, 5));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = [
    { label: 'Ativas', value: stats.active, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    {
      label: 'Expira em 7 dias',
      value: stats.expiringIn7Days,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    { label: 'Expiradas', value: stats.expired, color: 'text-red-600', bg: 'bg-red-50' },
    {
      label: 'Canceladas',
      value: stats.cancelled,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-indigo-900 leading-tight uppercase">
            Painel Admin
          </h1>
          <p className="text-indigo-600 font-medium">Gerencie assinaturas por data de expiração.</p>
        </div>
        <Link
          to="/assinaturas/nova"
          search={{ userId: undefined, email: undefined }}
          className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all transform active:scale-95 uppercase text-sm"
        >
          <Plus className="w-5 h-5 font-black" />
          Nova Assinatura
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} p-6 rounded-[2rem] border-2 border-indigo-50 shadow-sm`}
          >
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className={`w-5 h-5 ${card.color}`} />
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                {card.label}
              </p>
            </div>
            <p className={`text-4xl font-black ${card.color}`}>{loading ? '—' : card.value}</p>
          </div>
        ))}
      </div>

      {stats.expiringIn7Days > 0 && (
        <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <p className="font-bold text-amber-800 text-sm">
            {stats.expiringIn7Days} assinatura(s) expiram nos próximos 7 dias.
          </p>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-black text-indigo-900 uppercase mb-4">Próximas a vencer</h2>
        <SubscriptionsList items={upcoming} loading={loading} />
      </div>
    </div>
  );
}
