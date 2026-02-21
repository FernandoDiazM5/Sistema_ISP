export default function KPICard({ title, value, subtitle, icon, color = '#3b82f6', trend }) {
  return (
    <div className="bento-card py-5 px-6 cursor-default group"
      style={{ '--hover-color': color }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-text-secondary mb-2 uppercase tracking-wide font-bold">{title}</p>
          <p className="text-[28px] font-bold tracking-tight font-mono">{value}</p>
          {subtitle && <p className="text-[11px] text-text-muted mt-1 font-medium">{subtitle}</p>}
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm"
          style={{ background: color + '15', color, border: `1px solid ${color}30` }}>
          {icon}
        </div>
      </div>
      {trend != null && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold">
          <span style={{ color: trend > 0 ? '#10b981' : '#ef4444' }} className="bg-bg-secondary px-1.5 py-0.5 rounded-md">
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </span>
          <span className="text-text-muted">vs mes anterior</span>
        </div>
      )}
    </div>
  );
}
