import { LogOut } from 'lucide-react';
import { useAuth } from '../../auth/GoogleAuthProvider';
import useStore from '../../store/useStore';

export default function Header() {
  const { user, logout } = useAuth();
  const dataSource = useStore(s => s.dataSource);
  const lastImport = useStore(s => s.lastImport);

  const syncLabel = lastImport
    ? `Última sync: ${new Date(lastImport.date).toLocaleDateString('es-PE')}`
    : dataSource === 'demo'
      ? 'Datos demo'
      : 'Sincronizado';

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
    }
  };

  return (
    <div className="h-14 border-b border-border bg-bg-secondary flex items-center justify-between px-6">
      <div className="text-xs text-text-muted">
        Zona: <span className="text-text-primary font-medium">CARABAYLLO</span> ·{' '}
        <span className="text-accent-green">{syncLabel}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-text-secondary">{user?.email}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer border border-red-500/20 hover:border-red-500/40 bg-transparent font-medium"
          title="Cerrar sesión"
        >
          <LogOut size={14} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
