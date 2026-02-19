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
        <div className="animate-fade stagger-3 bg-bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-sm font-semibold mb-5 text-text-secondary">Distribución por Tecnología</h3>
          <div className="flex flex-col gap-4">
            {[
              { label: 'Radio Enlace', count: stats.radio, color: '#3b82f6' },
              { label: 'Fibra Óptica', count: stats.fibra, color: '#8b5cf6' },
              { label: 'No Determinado', count: stats.total - stats.radio - stats.fibra, color: '#6b7280' },
            ].map(t => (
              <div key={t.label}>
                <div className="flex justify-between mb-1.5 text-[13px]">
                  <span className="font-semibold" style={{ color: t.color }}>{t.label}</span>
                  <span className="font-mono text-xs">{t.count} ({pct(t.count)}%)</span>
                </div>
                <div className="h-1.5 bg-bg-secondary rounded-sm">
                  <div className="h-full rounded-sm transition-all duration-700"
                    style={{ width: `${pct(t.count)}%`, background: t.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connection status donut */}
        <div className="animate-fade stagger-4 bg-bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-sm font-semibold mb-5 text-text-secondary">Estado de Conexiones</h3>
          <div className="flex items-center justify-center gap-8 h-[calc(100%-40px)]">
            <div className="text-center">
              <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center relative"
                style={{
                  background: `conic-gradient(#10b981 ${stats.online / (stats.total || 1) * 360}deg, #1e293b ${stats.online / (stats.total || 1) * 360}deg)`,
                }}>
                <div className="w-[68px] h-[68px] rounded-full bg-bg-card flex items-center justify-center">
                  <span className="font-mono text-lg font-bold">{pct(stats.online)}%</span>
                </div>
              </div>
              <p className="text-[11px] text-text-muted mt-2">ONLINE</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-green" />
                <span className="text-xs">Online: {stats.online}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-bg-secondary border-2 border-gray-600" />
                <span className="text-xs">Offline: {stats.offline}</span>
              </div>
            </div>
          </div>
        </div>

        {/* TV services */}
        <div className="animate-fade stagger-5 bg-bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-sm font-semibold mb-5 text-text-secondary">Servicios Adicionales</h3>
          <div className="text-center mb-4">
            <p className="text-4xl font-bold font-mono text-accent-cyan">{stats.conTV}</p>
            <p className="text-xs text-text-muted">Clientes con TV/IPTV</p>
          </div>
          <div className="flex justify-center gap-4">
            <div className="text-center py-2 px-4 bg-bg-secondary rounded-[10px]">
              <p className="text-lg font-bold">{stats.total - stats.conTV}</p>
              <p className="text-[10px] text-text-muted">Solo Internet</p>
            </div>
            <div className="text-center py-2 px-4 bg-bg-secondary rounded-[10px]">
              <p className="text-lg font-bold">{pct(stats.conTV)}%</p>
              <p className="text-[10px] text-text-muted">Penetración TV</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Top nodos + Top planes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="animate-fade stagger-5 bg-bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-sm font-semibold mb-4 text-text-secondary">Top Nodos / Torres</h3>
          <div className="flex flex-col gap-2">
            {stats.topNodos.map(([nodo, count], i) => (
              <div key={nodo} className="flex items-center gap-3 py-1.5">
                <span className="font-mono text-[11px] text-text-muted w-5">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium">{nodo}</span>
                    <span className="font-mono text-[11px] text-text-secondary">{count}</span>
                  </div>
                  <div className="h-[3px] bg-bg-secondary rounded-sm">
                    <div className="h-full bg-accent-blue rounded-sm"
                      style={{ width: `${(count / (stats.topNodos[0]?.[1] || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade stagger-6 bg-bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-sm font-semibold mb-4 text-text-secondary">Top Planes Contratados</h3>
          <div className="flex flex-col gap-2">
            {stats.topPlanes.map(([plan, count], i) => (
              <div key={plan} className="flex items-center gap-3 py-1.5">
                <span className="font-mono text-[11px] text-text-muted w-5">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] font-medium max-w-[75%] overflow-hidden text-ellipsis whitespace-nowrap">{plan}</span>
                    <span className="font-mono text-[11px] text-text-secondary">{count}</span>
                  </div>
                  <div className="h-[3px] bg-bg-secondary rounded-sm">
                    <div className="h-full bg-accent-purple rounded-sm"
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
