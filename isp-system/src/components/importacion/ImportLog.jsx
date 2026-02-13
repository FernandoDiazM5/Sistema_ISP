import { History, FileSpreadsheet } from 'lucide-react';
import useStore from '../../store/useStore';

export default function ImportLog() {
  const importHistory = useStore(s => s.importHistory);

  if (importHistory.length === 0) return null;

  return (
    <div className="bg-bg-card rounded-2xl border border-border p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <History size={18} className="text-accent-blue" />
        <h3 className="text-sm font-semibold">Historial de Importaciones</h3>
        <span className="ml-auto text-[11px] text-text-muted">{importHistory.length} registros</span>
      </div>

      <div className="max-h-[200px] overflow-y-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-[10px] text-text-muted uppercase border-b border-border">
              <th className="py-2 px-3">ID</th>
              <th className="py-2 px-3">Fecha</th>
              <th className="py-2 px-3">Archivo</th>
              <th className="py-2 px-3 text-center">Total</th>
              <th className="py-2 px-3 text-center">Nuevos</th>
              <th className="py-2 px-3 text-center">Modif.</th>
              <th className="py-2 px-3 text-center">Sin cambios</th>
              <th className="py-2 px-3">Modo</th>
            </tr>
          </thead>
          <tbody>
            {importHistory.map(record => (
              <tr key={record.id} className="border-b border-border">
                <td className="py-2 px-3 font-mono text-text-muted">{record.id}</td>
                <td className="py-2 px-3 text-text-secondary">
                  {new Date(record.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet size={12} className="text-accent-green" />
                    <span className="font-medium truncate max-w-[150px]">{record.fileName}</span>
                  </div>
                </td>
                <td className="py-2 px-3 text-center font-mono">{record.total}</td>
                <td className="py-2 px-3 text-center font-mono text-accent-green">{record.new}</td>
                <td className="py-2 px-3 text-center font-mono text-accent-yellow">{record.modified}</td>
                <td className="py-2 px-3 text-center font-mono text-text-muted">{record.unchanged}</td>
                <td className="py-2 px-3">
                  <span className="py-0.5 px-2 rounded text-[10px] font-semibold bg-accent-blue/15 text-accent-blue">
                    {record.mode || 'Completa'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
