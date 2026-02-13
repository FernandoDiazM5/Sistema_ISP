import { Loader2 } from 'lucide-react';

export default function ImportProgress({ current, total, stage }) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  const stages = {
    reading: 'Leyendo archivo Excel...',
    transforming: 'Aplicando reglas ETL...',
    comparing: 'Comparando con datos actuales...',
    done: 'Procesamiento completado',
  };

  return (
    <div className="bg-bg-card rounded-2xl border border-border p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Loader2 size={20} className="text-accent-blue animate-spin" />
        <div>
          <p className="text-sm font-semibold">{stages[stage] || 'Procesando...'}</p>
          <p className="text-[11px] text-text-muted">{current} de {total} registros</p>
        </div>
        <span className="ml-auto text-lg font-bold text-accent-blue font-mono">{percent}%</span>
      </div>

      <div className="w-full h-2.5 bg-bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent-blue to-accent-purple rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
