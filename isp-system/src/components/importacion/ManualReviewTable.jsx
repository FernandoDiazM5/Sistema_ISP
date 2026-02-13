import { AlertTriangle, Edit3 } from 'lucide-react';

export default function ManualReviewTable({ items, onFix }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-bg-card rounded-2xl border border-accent-yellow/30 p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={18} className="text-accent-yellow" />
        <h3 className="text-sm font-semibold">Revisión Manual Requerida</h3>
        <span className="ml-auto text-[11px] text-accent-yellow font-semibold bg-accent-yellow/10 py-1 px-2.5 rounded-lg">
          {items.length} registros
        </span>
      </div>

      <p className="text-[11px] text-text-muted mb-3">
        Estos registros tienen datos que no pudieron ser procesados automáticamente por las reglas ETL.
      </p>

      <div className="max-h-[250px] overflow-y-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-[10px] text-text-muted uppercase border-b border-border sticky top-0 bg-bg-card">
              <th className="py-2 px-3">ID</th>
              <th className="py-2 px-3">Nombre</th>
              <th className="py-2 px-3">Problema</th>
              <th className="py-2 px-3">Campo</th>
              <th className="py-2 px-3">Valor Original</th>
              <th className="py-2 px-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-border">
                <td className="py-2 px-3 font-mono text-text-muted text-[11px]">{item.id}</td>
                <td className="py-2 px-3 font-medium">{item.nombre}</td>
                <td className="py-2 px-3">
                  <span className={`py-0.5 px-2 rounded text-[10px] font-semibold
                    ${item.tipo === 'movil' ? 'bg-accent-red/15 text-accent-red' :
                      item.tipo === 'tecnologia' ? 'bg-accent-yellow/15 text-accent-yellow' :
                      'bg-accent-blue/15 text-accent-blue'}`}>
                    {item.tipo === 'movil' ? 'Móvil inválido' :
                     item.tipo === 'tecnologia' ? 'Tecnología no detectada' :
                     item.tipo === 'deuda' ? 'Deuda no parseable' : item.tipo}
                  </span>
                </td>
                <td className="py-2 px-3 text-text-secondary">{item.campo}</td>
                <td className="py-2 px-3 font-mono text-[11px] text-accent-red">{item.valorOriginal}</td>
                <td className="py-2 px-3 text-center">
                  {onFix && (
                    <button onClick={() => onFix(item)}
                      className="p-1 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer hover:border-accent-blue hover:text-accent-blue transition-colors">
                      <Edit3 size={12} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
