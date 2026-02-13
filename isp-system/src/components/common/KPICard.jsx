export default function KPICard({ title, value, subtitle, icon, color = '#3b82f6', trend }) {
  return (
    <div className="bg-bg-card rounded-2xl py-5 px-6 border border-border transition-all hover:-translate-y-0.5 cursor-default group"
      style={{ '--hover-color': color }}
      onMouseOver={e => e.currentTarget.style.borderColor = color}
      onMouseOut={e => e.currentTarget.style.borderColor = ''}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-text-secondary mb-2 uppercase tracking-wide font-medium">{title}</p>
          <p className="text-[28px] font-bold tracking-tight font-mono">{value}</p>
          {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: color + '15', color }}>
          {icon}
        </div>
      </div>
      {trend != null && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span style={{ color: trend > 0 ? '#10b981' : '#ef4444' }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-text-muted">vs mes anterior</span>
        </div>
      )}
    </div>
  );
}
