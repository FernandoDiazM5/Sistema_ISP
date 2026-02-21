import { useMemo } from 'react';
import { Users, Wifi, AlertTriangle, Box, Signal } from 'lucide-react';
import useStore from '../../store/useStore';
import KPICard from '../common/KPICard';

import AlertsPanel from './AlertsPanel';

export default function DashboardPage() {
  const clients = useStore(s => s.clients);

  const stats = useMemo(() => {
    const total = clients.length;
    const online = clients.filter(c => c.status === 'ONLINE').length;
    const offline = total - online;
    const radio = clients.filter(c => c.tecnologia === 'Radio Enlace').length;
    const fibra = clients.filter(c => c.tecnologia === 'Fibra Óptica').length;
    const conDeuda = clients.filter(c => (c.deuda_monto || 0) > 0).length;
    const totalDeuda = clients.reduce((s, c) => s + (c.deuda_monto || 0), 0);
    const activos = clients.filter(c => c.estado_cuenta === 'ACTIVO').length;
    const suspendidos = clients.filter(c => c.estado_cuenta === 'SUSPENDIDO').length;
    const conTV = clients.filter(c => c.servicios_adicionales?.length > 0).length;

    const nodos = {};
    clients.forEach(c => { if (c.nodo_router) nodos[c.nodo_router] = (nodos[c.nodo_router] || 0) + 1; });
    const topNodos = Object.entries(nodos).sort((a, b) => b[1] - a[1]).slice(0, 8);

    const planes = {};
    clients.forEach(c => { if (c.plan) planes[c.plan] = (planes[c.plan] || 0) + 1; });
    const topPlanes = Object.entries(planes).sort((a, b) => b[1] - a[1]).slice(0, 6);

    return { total, online, offline, radio, fibra, conDeuda, totalDeuda, activos, suspendidos, conTV, topNodos, topPlanes };
  }, [clients]);

  const pct = (v) => stats.total ? (v / stats.total * 100).toFixed(1) : '0.0';

  return (
    <div className="p-4 sm:p-6 sm:px-8 overflow-y-auto h-full">
      <div className="mb-7">
        <h1 className="text-xl sm:text-[26px] font-bold tracking-tight">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">Resumen operativo del ISP — {stats.total} clientes registrados</p>
      </div>

      {/* Alertas Automáticas */}
      <AlertsPanel />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-7">
        <div className="animate-fade stagger-1">
          <KPICard title="Total Clientes" value={stats.total}
            subtitle={`${stats.activos} activos · ${stats.suspendidos} suspendidos`}
            icon={<Users size={20} />} color="#3b82f6" />
        </div>
        <div className="animate-fade stagger-2">
          <KPICard title="En Línea" value={stats.online}
            subtitle={`${pct(stats.online)}% conectados`}
            icon={<Wifi size={20} />} color="#10b981" />
        </div>
        <div className="animate-fade stagger-3">
          <KPICard title="Fuera de Línea" value={stats.offline}
            subtitle={`${pct(stats.offline)}% desconectados`}
            icon={<AlertTriangle size={20} />} color="#ef4444" />
        </div>
        <div className="animate-fade stagger-4">
          <KPICard title="Deuda Total" value={`S/. ${stats.totalDeuda.toLocaleString()}`}
            subtitle={`${stats.conDeuda} clientes con deuda`}
            icon={<Box size={20} />} color="#f59e0b" />
        </div>
      </div>



      {/* Row 2: Tech + Connections + TV */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-7">
        {/* Tech distribution */}
        <div className="animate-fade stagger-3 bento-card p-6">
          <h3 className="text-sm font-bold mb-5 text-text-secondary uppercase tracking-wide">Distribución por Tecnología</h3>
          <div className="flex flex-col gap-4">
            {[
              { label: 'Radio Enlace', count: stats.radio, color: '#3b82f6' },
              { label: 'Fibra Óptica', count: stats.fibra, color: '#8b5cf6' },
              { label: 'No Determinado', count: stats.total - stats.radio - stats.fibra, color: '#6b7280' },
            ].map(t => (
              <div key={t.label} className="group cursor-default">
                <div className="flex justify-between mb-1.5 text-[13px]">
                  <span className="font-semibold transition-colors" style={{ color: t.color }}>{t.label}</span>
                  <span className="font-mono text-xs font-bold text-text-primary group-hover:text-accent-blue transition-colors">{t.count} ({pct(t.count)}%)</span>
                </div>
                <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${pct(t.count)}%`, background: t.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connection status donut */}
        <div className="animate-fade stagger-4 bento-card p-6">
          <h3 className="text-sm font-bold mb-5 text-text-secondary uppercase tracking-wide">Estado de Conexiones</h3>
          <div className="flex items-center justify-center gap-8 h-[calc(100%-40px)]">
            <div className="text-center">
              <div className="w-[100px] h-[100px] rounded-full flex items-center justify-center relative shadow-inner"
                style={{
                  background: `conic-gradient(#10b981 ${stats.online / (stats.total || 1) * 360}deg, var(--color-bg-secondary) ${stats.online / (stats.total || 1) * 360}deg)`,
                }}>
                <div className="w-[76px] h-[76px] rounded-full bg-bg-card flex items-center justify-center shadow-sm">
                  <span className="font-mono text-xl font-bold text-text-primary">{pct(stats.online)}%</span>
                </div>
              </div>
              <p className="text-[11px] font-bold text-text-muted mt-3 tracking-wider">ONLINE RATES</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 bg-bg-secondary/50 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-green shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                <span className="text-xs font-semibold text-text-primary">Online: {stats.online}</span>
              </div>
              <div className="flex items-center gap-2.5 bg-bg-secondary/50 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="w-2.5 h-2.5 rounded-full bg-bg-secondary border-2 border-text-muted" />
                <span className="text-xs font-semibold text-text-secondary">Offline: {stats.offline}</span>
              </div>
            </div>
          </div>
        </div>

        {/* TV services */}
        <div className="animate-fade stagger-5 bento-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold mb-5 text-text-secondary uppercase tracking-wide">Servicios Adicionales</h3>
            <div className="text-center mb-6">
              <p className="text-[42px] leading-tight font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-blue drop-shadow-sm">{stats.conTV}</p>
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mt-1">Suscripciones TV/IPTV</p>
            </div>
          </div>
          <div className="flex justify-center gap-3">
            <div className="flex-1 text-center py-2.5 px-2 bg-bg-secondary/60 rounded-xl border border-white/5 hover:bg-bg-secondary transition-colors">
              <p className="text-lg font-bold text-text-primary">{stats.total - stats.conTV}</p>
              <p className="text-[10px] uppercase tracking-wide font-semibold text-text-muted mt-0.5">Solo Internet</p>
            </div>
            <div className="flex-1 text-center py-2.5 px-2 bg-bg-secondary/60 rounded-xl border border-white/5 hover:bg-bg-secondary transition-colors">
              <p className="text-lg font-bold text-text-primary">{pct(stats.conTV)}%</p>
              <p className="text-[10px] uppercase tracking-wide font-semibold text-text-muted mt-0.5">Penetración</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Top nodos + Top planes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="animate-fade stagger-5 bento-card p-6">
          <h3 className="text-sm font-bold mb-4 text-text-secondary tracking-wide uppercase">Top Nodos / Torres</h3>
          <div className="flex flex-col gap-3">
            {stats.topNodos.map(([nodo, count], i) => (
              <div key={nodo} className="flex items-center gap-3 py-1.5">
                <span className="font-mono text-[11px] text-text-muted w-5 bg-bg-secondary w-6 h-6 flex items-center justify-center rounded-md font-bold">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-semibold text-text-primary">{nodo}</span>
                    <span className="font-mono text-[11px] text-text-secondary font-bold">{count}</span>
                  </div>
                  <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-accent-blue rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(count / (stats.topNodos[0]?.[1] || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade stagger-6 bento-card p-6">
          <h3 className="text-sm font-bold mb-4 text-text-secondary tracking-wide uppercase">Top Planes Contratados</h3>
          <div className="flex flex-col gap-3">
            {stats.topPlanes.map(([plan, count], i) => (
              <div key={plan} className="flex items-center gap-3 py-1.5">
                <span className="font-mono text-[11px] text-text-muted w-5 bg-bg-secondary w-6 h-6 flex items-center justify-center rounded-md font-bold">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-text-primary max-w-[75%] overflow-hidden text-ellipsis whitespace-nowrap">{plan}</span>
                    <span className="font-mono text-[11px] text-text-secondary font-bold">{count}</span>
                  </div>
                  <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-accent-purple rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(count / (stats.topPlanes[0]?.[1] || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
