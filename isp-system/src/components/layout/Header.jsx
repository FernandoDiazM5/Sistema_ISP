import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../auth/GoogleAuthProvider';
import useStore from '../../store/useStore';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const dataSource = useStore(s => s.dataSource);
  const lastImport = useStore(s => s.lastImport);

  const syncLabel = lastImport
    ? `Última: ${new Date(lastImport.date).toLocaleDateString('es-PE')}`
    : dataSource === 'demo'
      ? 'Demo'
      : 'Sincronizado';

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
    }
  };

  return (
    <div className="h-14 border-b border-border bg-bg-secondary flex items-center justify-between px-4 lg:px-6 shrink-0 relative z-10 text-text-primary">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-text-secondary hover:bg-white/5 rounded-lg active:scale-95 transition-all"
        >
          <Menu size={20} />
        </button>

        <div className="text-xs text-text-muted flex flex-col sm:flex-row sm:items-center sm:gap-1">
          <span className="hidden sm:inline">Zona:</span>
          <span className="text-text-primary font-medium">CARABAYLLO</span>
          <span className="hidden sm:inline">·</span>
          <span className="text-accent-green text-[10px] sm:text-xs bg-accent-green/10 px-2 py-0.5 rounded-full mt-0.5 sm:mt-0 w-fit">
            {syncLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-text-secondary hidden sm:block">{user?.email}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer border border-red-500/20 hover:border-red-500/40 bg-transparent font-medium"
          title="Cerrar sesión"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
