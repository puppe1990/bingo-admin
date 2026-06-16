import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { createSubscriptionFn, listUsersFn } from '../server/subscriptions.functions';

export function CreateSubscriptionPage() {
  const navigate = useNavigate();
  const prefill = useSearch({ from: '/_admin/assinaturas/nova' });
  const [search, setSearch] = useState(prefill.email ?? '');
  const [users, setUsers] = useState<Awaited<ReturnType<typeof listUsersFn>>>([]);
  const [userId, setUserId] = useState(prefill.userId ?? '');
  const [plan, setPlan] = useState<'free' | 'pro' | 'platinum'>('pro');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listUsersFn({ data: { search: search.length >= 2 ? search : undefined } })
      .then(setUsers)
      .catch(console.error);
  }, [search]);

  const addDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setExpiresAt(date.toISOString().slice(0, 10));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId || !expiresAt) {
      setError('Selecione um usuário e data de expiração.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createSubscriptionFn({
        data: { userId, plan, expiresAt, notes: notes || undefined },
      });
      navigate({ to: '/assinaturas' });
    } catch {
      setError('Não foi possível criar a assinatura.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-4xl font-black text-indigo-900 uppercase">Nova Assinatura</h1>
        <p className="text-indigo-600 font-medium">Vincule um plano a um usuário.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-50 space-y-6"
      >
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border-2 border-red-100">
            {error}
          </div>
        )}

        <div>
          <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">
            Buscar usuário
          </label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-6 py-4 bg-indigo-50 rounded-2xl font-bold text-indigo-900 outline-none"
            placeholder="E-mail ou nome..."
          />
          {users.length > 0 && (
            <div className="mt-2 border-2 border-indigo-50 rounded-2xl overflow-hidden">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setUserId(u.id);
                    setSearch(u.email);
                    setUsers([]);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-yellow-50 font-bold ${userId === u.id ? 'bg-amber-50 text-indigo-900' : 'text-indigo-600'}`}
                >
                  {u.name} — {u.email}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">
            Plano
          </label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value as typeof plan)}
            className="w-full px-6 py-4 bg-indigo-50 rounded-2xl font-bold text-indigo-900 outline-none"
          >
            <option value="free">Gratuito</option>
            <option value="pro">Pro</option>
            <option value="platinum">Platinum</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">
            Data de expiração
          </label>
          <input
            type="date"
            required
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full px-6 py-4 bg-indigo-50 rounded-2xl font-bold text-indigo-900 outline-none"
          />
          <div className="flex gap-2 mt-3">
            {[30, 90, 365].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => addDays(days)}
                className="px-4 py-2 bg-amber-100 text-amber-800 rounded-xl text-xs font-black uppercase"
              >
                +{days}d
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">
            Notas internas
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-6 py-4 bg-indigo-50 rounded-2xl font-bold text-indigo-900 outline-none min-h-24"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Criar assinatura'}
          </button>
          <Link
            to="/assinaturas"
            className="px-8 py-4 rounded-2xl font-black uppercase text-indigo-500 hover:bg-indigo-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
