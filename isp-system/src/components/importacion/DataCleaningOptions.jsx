import { Settings } from 'lucide-react';
import useStore from '../../store/useStore';

const RULES = [
  { key: 'separateNameStatus', label: 'Separar Nombre y Estado', desc: 'Extrae el estado (ACTIVO/SUSPENDIDO) del campo Nombre' },
  { key: 'classifyEmail', label: 'Clasificar Email', desc: 'Detecta si el campo Correo contiene email real o notas técnicas' },
  { key: 'splitMobile', label: 'Separar Móviles', desc: 'Divide números múltiples en móvil principal y secundario' },
  { key: 'parseDebt', label: 'Parsear Deuda', desc: 'Extrae meses y monto de deuda del campo "Deuda actual"' },
  { key: 'parsePrices', label: 'Parsear Precios', desc: 'Convierte "S/. 65.00" → número 65' },
  { key: 'inferTechnology', label: 'Inferir Tecnología', desc: 'Detecta Radio Enlace vs Fibra Óptica desde el nodo/router' },
  { key: 'separateTV', label: 'Separar TV Cable', desc: 'Extrae servicio de TV Cable y cantidad de decos del plan' },
  { key: 'normalizeCortePorDeuda', label: 'Normalizar Corte', desc: 'Detecta "Cortado por deuda" desde la combinación de campos' },
  { key: 'formatDNI', label: 'Formatear DNI', desc: 'Limpia y normaliza el campo Cédula/DNI' },
];

export default function DataCleaningOptions() {
  const cleaningOptions = useStore(s => s.cleaningOptions);
  const setCleaningOptions = useStore(s => s.setCleaningOptions);

  const toggle = (key) => {
    setCleaningOptions({ ...cleaningOptions, [key]: !cleaningOptions[key] });
  };

  const enabledCount = Object.values(cleaningOptions).filter(Boolean).length;

  return (
    <div className="bg-bg-card rounded-2xl border border-border p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-accent-purple" />
          <h3 className="text-sm font-semibold">Reglas de Limpieza ETL</h3>
        </div>
        <span className="text-[11px] text-text-muted bg-bg-secondary py-1 px-2.5 rounded-lg">
          {enabledCount}/{RULES.length} activas
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {RULES.map(rule => (
          <label key={rule.key}
            className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all
              ${cleaningOptions[rule.key]
                ? 'border-accent-purple/30 bg-accent-purple/5'
                : 'border-border bg-bg-secondary hover:border-border'
              }`}>
            <input
              type="checkbox"
              checked={cleaningOptions[rule.key]}
              onChange={() => toggle(rule.key)}
              className="mt-0.5 accent-accent-purple"
            />
            <div>
              <p className="text-xs font-semibold">{rule.label}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{rule.desc}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
