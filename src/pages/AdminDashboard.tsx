import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Users, AlertTriangle } from 'lucide-react';
import { getClientAccessStatsFn, listClientsFn } from '../server/clients.functions';
import { ClientsList } from './ClientsList';
import type { ClientListItem } from '../server/clients.server';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    expired: 0,
    expiringIn7Days: 0,
    expiringIn30Days: 0,
  });
  const [expiringSoon, setExpiringSoon] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsData, clients] = await Promise.all([
          getClientAccessStatsFn(),
          listClientsFn({ data: {} }),
        ]);
        setStats(statsData);

        const now = new Date();
        const in30Days = new Date(now);
        in30Days.setDate(in30Days.getDate() + 30);

        setExpiringSoon(
          clients
            .filter((client) => {
              if (!client.accessExpiresAt || !client.isActive) return false;
              return client.accessExpiresAt >= now && client.accessExpiresAt <= in30Days;
            })
            .sort((a, b) => {
              const aTime = a.accessExpiresAt?.getTime() ?? 0;
              const bTime = b.accessExpiresAt?.getTime() ?? 0;
              return aTime - bTime;
            })
            .slice(0, 5),
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = [
    { label: 'Ativos', value: stats.active, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Inativos', value: stats.inactive, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Expirados', value: stats.expired, color: 'text-red-600', bg: 'bg-red-50' },
    {
      label: 'Vence em 7 dias',
      value: stats.expiringIn7Days,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-indigo-900 leading-tight uppercase">
            Painel Admin
          </h1>
          <p className="text-indigo-600 font-medium">
            Gerencie o acesso dos usuários: ativo, inativo ou com data de validade.
          </p>
        </div>
        <Link
          to="/clientes"
          className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all transform active:scale-95 uppercase text-sm"
        >
          <Users className="w-5 h-5 font-black" />
          Ver Clientes
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} p-6 rounded-[2rem] border-2 border-indigo-50 shadow-sm`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className={`w-5 h-5 ${card.color}`} />
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
            {stats.expiringIn7Days} usuário(s) com acesso expirando nos próximos 7 dias.
          </p>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-black text-indigo-900 uppercase mb-4">
          Acessos expirando em breve
        </h2>
        <ClientsList items={expiringSoon} loading={loading} />
      </div>
    </div>
  );
}
