import { LogOut, Menu, Cloud, CloudOff, Loader2, WifiOff } from 'lucide-react';
import { useAuth } from '../../auth/GoogleAuthProvider';
import useStore from '../../store/useStore';
import useSyncStore from '../../store/syncStore';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const dataSource = useStore(s => s.dataSource);
  const lastImport = useStore(s => s.lastImport);
  const branding = useStore(s => s.branding);
  const liveEnabled = useSyncStore(s => s.liveEnabled);
  const livePushing = useSyncStore(s => s.livePushing);
  const offlineQueue = useSyncStore(s => s.offlineQueue);
  const pendingCount = offlineQueue?.length || 0;

  const defaultSyncLabel = lastImport
    ? `Última: ${new Date(lastImport.date).toLocaleDateString('es-PE')}`
    : dataSource === 'demo'
      ? 'Demo'
      : 'Sincronizado';
  const syncLabel = branding?.syncLabel || defaultSyncLabel;

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
          <span className="text-text-primary font-medium">{branding?.zoneName || 'CARABAYLLO'}</span>
          <span className="hidden sm:inline">·</span>
          <span className="text-accent-green text-[10px] sm:text-xs bg-accent-green/10 px-2 py-0.5 rounded-full mt-0.5 sm:mt-0 w-fit">
            {syncLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Offline Queue Indicator */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-md text-red-500" title={`Reteniendo ${pendingCount} operaciones sin red`}>
            <WifiOff size={14} className="animate-pulse" />
            <span className="text-[10px] font-medium hidden sm:inline">{pendingCount} pdtes.</span>
          </div>
        )}

        {/* Live Sync Indicator */}
        <div className="flex items-center gap-1.5" title={liveEnabled ? (livePushing ? 'Sincronizando...' : 'Sync en vivo activo') : 'Sync desconectado'}>
          {livePushing ? (
            <Loader2 size={14} className="text-accent-blue animate-spin" />
          ) : liveEnabled ? (
            <Cloud size={14} className="text-accent-green" />
          ) : (
            <CloudOff size={14} className="text-text-muted" />
          )}
          <span className={`text-[10px] font-medium hidden sm:inline ${livePushing ? 'text-accent-blue' : liveEnabled ? 'text-accent-green' : 'text-text-muted'}`}>
            {livePushing ? 'Sincronizando' : liveEnabled ? 'En vivo' : 'Offline'}
          </span>
        </div>

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
