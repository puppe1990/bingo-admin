import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { listClientsFn } from '../server/clients.functions';
import type { ClientListItem } from '../server/clients.server';
import { ClientsList } from './ClientsList';

export function ClientsPage() {
  const [items, setItems] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function load(query?: string) {
    setLoading(true);
    try {
      const data = await listClientsFn({ data: { search: query || undefined } });
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
      <div>
        <h1 className="text-4xl font-black text-indigo-900 uppercase">Clientes</h1>
        <p className="text-indigo-600 font-medium">
          Todos os usuários cadastrados. Ative ou desative o acesso individualmente.
        </p>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border-2 border-indigo-50">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
            <input
              type="search"
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-indigo-50 rounded-2xl font-bold text-indigo-900 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => load(search)}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-sm hover:bg-indigo-700 transition-all"
          >
            Buscar
          </button>
        </div>
      </div>

      <ClientsList items={items} loading={loading} />
    </div>
  );
}
