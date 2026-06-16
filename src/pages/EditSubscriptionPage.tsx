import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  extendSubscriptionFn,
  getSubscriptionFn,
  updateSubscriptionFn,
} from '../server/subscriptions.functions';
import type { SubscriptionListItem } from '../server/subscriptions.server';

type EditSubscriptionPageProps = {
  subscriptionId: string;
};

export function EditSubscriptionPage({ subscriptionId }: EditSubscriptionPageProps) {
  const navigate = useNavigate();
  const [item, setItem] = useState<SubscriptionListItem | null>(null);
  const [plan, setPlan] = useState<'free' | 'pro' | 'platinum'>('pro');
  const [status, setStatus] = useState<'active' | 'expired' | 'cancelled'>('active');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSubscriptionFn({ data: { id: subscriptionId } })
      .then((data) => {
        setItem(data);
        setPlan(data.plan);
        setStatus(data.effectiveStatus);
        setExpiresAt(data.expiresAt.toISOString().slice(0, 10));
        setNotes(data.notes ?? '');
      })
      .catch(() => setError('Assinatura não encontrada.'))
      .finally(() => setLoading(false));
  }, [subscriptionId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateSubscriptionFn({
        data: { id: subscriptionId, plan, status, expiresAt, notes },
      });
      navigate({ to: '/assinaturas' });
    } catch {
      setError('Não foi possível salvar.');
      setSaving(false);
    }
  };

  const handleExtend = async (days: number) => {
    setSaving(true);
    try {
      await extendSubscriptionFn({ data: { id: subscriptionId, days } });
      const data = await getSubscriptionFn({ data: { id: subscriptionId } });
      setItem(data);
      setExpiresAt(data.expiresAt.toISOString().slice(0, 10));
      setStatus(data.effectiveStatus);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!item) {
    return <p className="text-red-600 font-bold">{error || 'Assinatura não encontrada.'}</p>;
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-4xl font-black text-indigo-900 uppercase">Editar Assinatura</h1>
        <p className="text-indigo-600 font-medium">
          {item.userName} — {item.userEmail}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-50 space-y-6"
      >
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
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
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="w-full px-6 py-4 bg-indigo-50 rounded-2xl font-bold text-indigo-900 outline-none"
            >
              <option value="active">Ativa</option>
              <option value="expired">Expirada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
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
                disabled={saving}
                onClick={() => handleExtend(days)}
                className="px-4 py-2 bg-amber-100 text-amber-800 rounded-xl text-xs font-black uppercase disabled:opacity-50"
              >
                Estender +{days}d
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">
            Notas
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
            disabled={saving}
            className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <Link
            to="/assinaturas"
            className="px-8 py-4 rounded-2xl font-black uppercase text-indigo-500 hover:bg-indigo-50"
          >
            Voltar
          </Link>
        </div>
      </form>
    </div>
  );
}
