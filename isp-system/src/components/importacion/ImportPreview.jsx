import { Users, Settings, Wifi, Box, CheckCircle } from 'lucide-react';
import KPICard from '../common/KPICard';

export default function ImportPreview({ stats, changes, onConfirm, onCancel }) {
  const MAX_PREVIEW = 100;
  const displayedChanges = changes.slice(0, MAX_PREVIEW);

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Registros Leídos" value={stats.total} icon={<Box size={20} />} color="#6b7280" />
        <KPICard title="Nuevos Clientes" value={stats.new} icon={<Users size={20} />} color="#10b981" />
        <KPICard title="Modificados" value={stats.modified} icon={<Settings size={20} />} color="#f59e0b" />
        <KPICard title="Sin Cambios" value={stats.unchanged} icon={<Wifi size={20} />} color="#3b82f6" />
      </div>

      {/* Changes Table */}
      <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
        <div className="py-4 px-6 border-b border-border flex justify-between items-center">
          <h3 className="text-sm font-semibold">Detalle de Cambios Detectados</h3>
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="py-2 px-4 rounded-lg bg-bg-secondary border border-border text-text-secondary text-xs font-semibold cursor-pointer hover:border-accent-red transition-colors">
              Cancelar
            </button>
            <button onClick={onConfirm}
              className="py-2 px-4 rounded-lg bg-accent-green border-none text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-opacity">
              <CheckCircle size={14} />
              Confirmar Importación
            </button>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-bg-secondary text-left sticky top-0">
                <th className="py-3 px-6 w-20 text-[11px] text-text-secondary uppercase">Tipo</th>
                <th className="py-3 px-6 text-[11px] text-text-secondary uppercase">Cliente</th>
                <th className="py-3 px-6 text-[11px] text-text-secondary uppercase">Detalle del Cambio</th>
              </tr>
            </thead>
            <tbody>
              {displayedChanges.map((c, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="py-3 px-6">
                    <span className={`py-1 px-2 rounded text-[11px] font-bold
                      ${c.type === 'NEW'
                        ? 'bg-accent-green/20 text-accent-green'
                        : 'bg-accent-yellow/20 text-accent-yellow'
                      }`}>
                      {c.type === 'NEW' ? 'NUEVO' : 'MODIF'}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <div className="font-medium">{c.type === 'NEW' ? c.data.nombre : c.nombre}</div>
                    <div className="text-[11px] text-text-muted">ID: {c.type === 'NEW' ? c.data.id : c.id}</div>
                  </td>
                  <td className="py-3 px-6">
                    {c.type === 'NEW' ? (
                      <span className="text-text-muted">Registro completo nuevo</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {c.diffs.map((d, j) => (
                          <div key={j} className="text-xs">
                            <span className="text-text-secondary">{d.field}:</span>{' '}
                            <span className="line-through text-text-muted">{d.old}</span>{' '}
                            → <span className="text-text-primary font-medium">{d.new}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {changes.length > MAX_PREVIEW && (
                <tr>
                  <td colSpan="3" className="py-5 text-center bg-bg-secondary/20">
                    <span className="text-[12px] font-semibold text-text-primary">+{changes.length - MAX_PREVIEW} registros adicionales</span>
                    <p className="text-[11px] text-text-muted mt-1">Se han omitido en la previsualización para mantener el rendimiento.</p>
                  </td>
                </tr>
              )}
              {changes.length === 0 && (
                <tr>
                  <td colSpan="3" className="py-6 text-center text-text-muted">
                    No se detectaron cambios significativos entre la data actual y el archivo importado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
