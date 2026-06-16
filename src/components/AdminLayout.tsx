import type { ReactNode } from 'react';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { BrandMark } from '../lib/ui/brand-mark';
import { LayoutDashboard, CreditCard, LogOut, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AdminLayoutProps = {
  children?: ReactNode;
  userName?: string;
  onLogout: () => Promise<void>;
};

export function AdminLayout({ children, userName, onLogout }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const isActive = (path: string) => location.pathname === path;
  const userInitial = userName?.charAt(0)?.toUpperCase() ?? 'A';

  const handleLogout = async () => {
    await onLogout();
    navigate({ to: '/login' });
  };

  return (
    <div className="flex min-h-screen bg-yellow-50 font-sans pb-20 md:pb-0">
      <aside className="hidden md:flex w-64 bg-indigo-800 text-white flex-col fixed inset-y-0 z-50">
        <div className="p-6 flex items-center gap-3">
          <BrandMark className="w-10 h-10" letterClassName="text-xl" letter="A" />
          <h1 className="text-xl font-black tracking-tight uppercase">Bingo Admin</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link
            to="/"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              isActive('/')
                ? 'bg-indigo-700/50 border-l-4 border-amber-400 font-bold'
                : 'hover:bg-indigo-700/30 text-indigo-100'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 text-amber-400" />
            Dashboard
          </Link>
          <Link
            to="/clientes"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              isActive('/clientes') || location.pathname.startsWith('/clientes')
                ? 'bg-indigo-700/50 border-l-4 border-amber-400 font-bold'
                : 'hover:bg-indigo-700/30 text-indigo-100'
            }`}
          >
            <Users className="w-5 h-5 text-amber-400" />
            Clientes
          </Link>
          <Link
            to="/assinaturas"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              isActive('/assinaturas') || location.pathname.startsWith('/assinaturas')
                ? 'bg-indigo-700/50 border-l-4 border-amber-400 font-bold'
                : 'hover:bg-indigo-700/30 text-indigo-100'
            }`}
          >
            <CreditCard className="w-5 h-5 text-amber-400" />
            Assinaturas
          </Link>
        </nav>

        <div className="p-6 bg-indigo-900 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-700 bg-amber-400 flex items-center justify-center text-indigo-900 font-black">
              {userInitial}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate leading-none">{userName}</p>
              <p className="text-[10px] text-indigo-300 truncate mt-1">ADMIN • Assinaturas</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-indigo-800 hover:bg-red-600 px-3 py-2 rounded-lg text-sm font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-indigo-800 border-t border-indigo-700 flex justify-around p-2 z-50">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${isActive('/') ? 'text-amber-400' : 'text-indigo-300'}`}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase">Início</span>
        </Link>
        <Link
          to="/clientes"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${isActive('/clientes') || location.pathname.startsWith('/clientes') ? 'text-amber-400' : 'text-indigo-300'}`}
        >
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase">Clientes</span>
        </Link>
        <Link
          to="/assinaturas"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${isActive('/assinaturas') || location.pathname.startsWith('/assinaturas') ? 'text-amber-400' : 'text-indigo-300'}`}
        >
          <CreditCard className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase">Assinaturas</span>
        </Link>
      </nav>

      <main className="flex-1 md:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {children ?? <Outlet />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
