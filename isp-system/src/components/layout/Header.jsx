import { useAuth } from '../../auth/GoogleAuthProvider';
import useStore from '../../store/useStore';

export default function Header() {
  const { user } = useAuth();
  const dataSource = useStore(s => s.dataSource);
  const lastImport = useStore(s => s.lastImport);

  const syncLabel = lastImport
    ? `Última sync: ${new Date(lastImport.date).toLocaleDateString('es-PE')}`
    : dataSource === 'demo'
      ? 'Datos demo'
      : 'Sincronizado';

  return (
    <div className="h-14 border-b border-border bg-bg-secondary flex items-center justify-between px-6">
      <div className="text-xs text-text-muted">
        Zona: <span className="text-text-primary font-medium">CARABAYLLO</span> ·{' '}
        <span className="text-accent-green">{syncLabel}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-text-secondary">{user?.email}</span>
      </div>
    </div>
  );
}
