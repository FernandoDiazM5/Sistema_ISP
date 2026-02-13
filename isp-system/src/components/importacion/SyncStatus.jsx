import { RefreshCw, CheckCircle, CloudOff, Clock } from 'lucide-react';
import useStore from '../../store/useStore';

export default function SyncStatus() {
  const lastImport = useStore(s => s.lastImport);
  const dataSource = useStore(s => s.dataSource);
  const clients = useStore(s => s.clients);

  const getStatusInfo = () => {
    if (!lastImport) {
      return {
        icon: <CloudOff size={16} />,
        label: 'Sin sincronizar',
        color: 'text-text-muted',
        bg: 'bg-bg-secondary',
        detail: 'No se ha realizado ninguna importación',
      };
    }

    const lastDate = new Date(lastImport.date);
    const diffHours = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) {
      return {
        icon: <CheckCircle size={16} />,
        label: 'Sincronizado',
        color: 'text-accent-green',
        bg: 'bg-accent-green/10',
        detail: `Hace ${Math.round(diffHours * 60)} minutos`,
      };
    }

    if (diffHours < 24) {
      return {
        icon: <Clock size={16} />,
        label: 'Actualizado hoy',
        color: 'text-accent-blue',
        bg: 'bg-accent-blue/10',
        detail: lastDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      };
    }

    return {
      icon: <RefreshCw size={16} />,
      label: 'Desactualizado',
      color: 'text-accent-yellow',
      bg: 'bg-accent-yellow/10',
      detail: lastDate.toLocaleDateString('es-PE'),
    };
  };

  const status = getStatusInfo();

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${status.bg} border border-border mb-6`}>
      <div className={status.color}>{status.icon}</div>
      <div className="flex-1">
        <p className={`text-xs font-semibold ${status.color}`}>{status.label}</p>
        <p className="text-[10px] text-text-muted">{status.detail}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] text-text-muted">Fuente: <span className="font-semibold text-text-secondary">{dataSource === 'excel' ? 'Excel' : 'Demo'}</span></p>
        <p className="text-[10px] text-text-muted">{clients.length} clientes cargados</p>
      </div>
      {lastImport && (
        <div className="text-right border-l border-border pl-3">
          <p className="text-[10px] text-text-muted">Último: <span className="font-mono">{lastImport.fileName}</span></p>
          <p className="text-[10px] text-text-muted">
            <span className="text-accent-green">{lastImport.new} nuevos</span> · <span className="text-accent-yellow">{lastImport.modified} modif.</span>
          </p>
        </div>
      )}
    </div>
  );
}
