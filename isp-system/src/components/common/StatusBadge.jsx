const STATUS_COLORS = {
  ONLINE: { bg: '#10b98120', text: '#10b981', dot: true },
  OFFLINE: { bg: '#ef444420', text: '#ef4444', dot: true },
  ACTIVO: { bg: '#10b98120', text: '#10b981' },
  SUSPENDIDO: { bg: '#f59e0b20', text: '#f59e0b' },
  Cortado: { bg: '#ef444420', text: '#ef4444' },
  Activo: { bg: '#10b98120', text: '#10b981' },
  Suspendido: { bg: '#f59e0b20', text: '#f59e0b' },
  'Radio Enlace': { bg: '#3b82f620', text: '#3b82f6' },
  'Fibra Óptica': { bg: '#8b5cf620', text: '#8b5cf6' },
  'No Determinado': { bg: '#6b728020', text: '#6b7280' },
};

const DEFAULT_COLOR = { bg: '#6b728020', text: '#6b7280' };

export default function StatusBadge({ status, size = 'sm' }) {
  const c = STATUS_COLORS[status] || DEFAULT_COLOR;
  const padding = size === 'sm' ? 'py-[3px] px-2.5' : 'py-[5px] px-3.5';
  const fontSize = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <span className={`inline-flex items-center gap-[5px] rounded-full font-semibold whitespace-nowrap ${padding} ${fontSize}`}
      style={{ background: c.bg, color: c.text }}>
      {c.dot && (
        <span className="w-1.5 h-1.5 rounded-full"
          style={{ background: c.text, boxShadow: `0 0 6px ${c.text}` }}
        />
      )}
      {status}
    </span>
  );
}
