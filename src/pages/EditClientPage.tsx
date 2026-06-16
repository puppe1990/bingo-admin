import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { getUserAccessFn, updateUserAccessFn } from '../server/subscriptions.functions';
import type { UserAccessView } from '../server/subscriptions.server';
import { formatUserAccessLabel, getUserAccessBadgeClass } from '../lib/ui/user-access-badges';

type EditClientPageProps = {
  userId: string;
};

function addDays(base: Date, days: number): string {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function EditClientPage({ userId }: EditClientPageProps) {
  const navigate = useNavigate();
  const [item, setItem] = useState<UserAccessView | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [accessExpiresAt, setAccessExpiresAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getUserAccessFn({ data: { userId } })
      .then((data) => {
        setItem(data);
        setIsActive(data.isActive);
        setAccessExpiresAt(data.accessExpiresAt?.toISOString().slice(0, 10) ?? '');
      })
      .catch(() => setError('Cliente não encontrado.'))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateUserAccessFn({
        data: {
          userId,
          isActive,
          accessExpiresAt: accessExpiresAt || null,
        },
      });
      navigate({ to: '/clientes' });
    } catch {
      setError('Não foi possível salvar.');
      setSaving(false);
    }
  };

  const handleQuickExtend = (days: number) => {
    setAccessExpiresAt(addDays(new Date(), days));
    setIsActive(true);
  };

  const handleDeactivate = () => {
    setIsActive(false);
    setAccessExpiresAt('');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!item) {
    return <p className="text-red-600 font-bold">{error || 'Cliente não encontrado.'}</p>;
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-4xl font-black text-indigo-900 uppercase">Gerenciar Acesso</h1>
        <p className="text-indigo-600 font-medium">
          {item.name} — {item.email}
        </p>
        <span
          className={`inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getUserAccessBadgeClass(item.effectiveStatus)}`}
        >
          {formatUserAccessLabel(item.effectiveStatus)}
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-50 space-y-6"
      >
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold">{error}</div>
        )}

        <div>
          <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">
            Status de acesso
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsActive(true)}
              className={`flex-1 px-6 py-4 rounded-2xl font-black uppercase text-sm transition-all ${
                isActive
                  ? 'bg-emerald-500 text-white'
                  : 'bg-indigo-50 text-indigo-400 hover:bg-indigo-100'
              }`}
            >
              Ativo
            </button>
            <button
              type="button"
              onClick={() => setIsActive(false)}
              className={`flex-1 px-6 py-4 rounded-2xl font-black uppercase text-sm transition-all ${
                !isActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-400 hover:bg-indigo-100'
              }`}
            >
              Desativado
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">
            Válido até
          </label>
          <input
            type="date"
            value={accessExpiresAt}
            onChange={(e) => setAccessExpiresAt(e.target.value)}
            className="w-full px-6 py-4 bg-indigo-50 rounded-2xl font-bold text-indigo-900 outline-none"
          />
          <p className="text-xs text-indigo-400 font-medium mt-2">
            Deixe em branco para acesso sem data de expiração.
          </p>
          <div className="flex gap-2 mt-3">
            {[30, 90, 365].map((days) => (
              <button
                key={days}
                type="button"
                disabled={saving}
                onClick={() => handleQuickExtend(days)}
                className="px-4 py-2 bg-amber-100 text-amber-800 rounded-xl text-xs font-black uppercase disabled:opacity-50"
              >
                +{days}d
              </button>
            ))}
          </div>
        </div>

        <div>
          <button
            type="button"
            disabled={saving}
            onClick={handleDeactivate}
            className="w-full px-6 py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-sm hover:bg-red-100 disabled:opacity-50"
          >
            Desativar agora
          </button>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <Link
            to="/clientes"
            className="px-8 py-4 rounded-2xl font-black uppercase text-indigo-500 hover:bg-indigo-50"
          >
            Voltar
          </Link>
        </div>
      </form>
    </div>
  );
}
