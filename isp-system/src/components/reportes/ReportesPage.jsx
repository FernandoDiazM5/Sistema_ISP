import { useMemo } from 'react';
import { Download, DollarSign, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import useStore from '../../store/useStore';
import KPICard from '../common/KPICard';

export default function ReportesPage() {
  const clients = useStore(s => s.clients);
  const tickets = useStore(s => s.tickets);
  const averias = useStore(s => s.averias);

  const cobranza = useMemo(() => {
    const conDeuda = clients.filter(c => c.deuda_monto > 0);
    const totalDeuda = conDeuda.reduce((s, c) => s + c.deuda_monto, 0);
    const ingresoMensual = clients.reduce((s, c) => s + c.precio, 0);
    const cortados = clients.filter(c => c.estado_servicio === 'Cortado').length;
    const suspendidos = clients.filter(c => c.estado_cuenta === 'SUSPENDIDO').length;

    // Deuda por zona
    const porZona = {};
    conDeuda.forEach(c => {
      if (!porZona[c.zona]) porZona[c.zona] = { clientes: 0, monto: 0 };
      porZona[c.zona].clientes++;
      porZona[c.zona].monto += c.deuda_monto;
    });
    const zonas = Object.entries(porZona).sort((a, b) => b[1].monto - a[1].monto);

    // Por tecnología
    const radioClients = clients.filter(c => c.tecnologia === 'Radio Enlace');
    const fibraClients = clients.filter(c => c.tecnologia === 'Fibra Óptica');
    const ingresoRadio = radioClients.reduce((s, c) => s + c.precio, 0);
    const ingresoFibra = fibraClients.reduce((s, c) => s + c.precio, 0);

    // Clientes morosos (deuda > 0 ordenados por monto)
    const morosos = [...conDeuda].sort((a, b) => b.deuda_monto - a.deuda_monto).slice(0, 10);

    return { conDeuda: conDeuda.length, totalDeuda, ingresoMensual, cortados, suspendidos, zonas, ingresoRadio, ingresoFibra, radioCount: radioClients.length, fibraCount: fibraClients.length, morosos };
  }, [clients]);

  const exportReport = (type) => {
    let data, filename;

    if (type === 'cobranza') {
      data = clients.filter(c => c.deuda_monto > 0).map(c => ({
        'ID': c.id, 'Nombre': c.nombre, 'Móvil': c.movil_1, 'Plan': c.plan,
        'Meses Deuda': c.deuda_meses, 'Monto Deuda': c.deuda_monto,
        'Último Pago': c.ultimo_pago, 'Estado': c.estado_cuenta, 'Zona': c.zona,
      }));
      filename = 'Reporte_Cobranza.xlsx';
    } else if (type === 'clientes') {
      data = clients.map(c => ({
        'ID': c.id, 'Nombre': c.nombre, 'DNI': c.dni, 'Móvil': c.movil_1,
        'Plan': c.plan, 'Precio': c.precio, 'Tecnología': c.tecnologia,
        'Estado': c.estado_cuenta, 'Conexión': c.status, 'Zona': c.zona,
        'Nodo': c.nodo_router, 'Deuda': c.deuda_monto,
      }));
      filename = 'Reporte_Clientes_Completo.xlsx';
    } else {
      data = clients.filter(c => c.estado_cuenta === 'SUSPENDIDO' || c.estado_servicio === 'Cortado').map(c => ({
        'ID': c.id, 'Nombre': c.nombre, 'Móvil': c.movil_1, 'Estado Cuenta': c.estado_cuenta,
        'Estado Servicio': c.estado_servicio, 'Deuda': c.deuda_monto, 'Zona': c.zona,
      }));
      filename = 'Reporte_Suspendidos_Cortados.xlsx';
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="animate-fade p-6 px-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Reportes & Cobranza</h1>
          <p className="text-text-secondary text-sm mt-1">Análisis financiero y operativo</p>
        </div>
      </div>

      {/* KPIs Financieros */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="animate-fade stagger-1">
          <KPICard title="Ingreso Mensual" value={`S/. ${cobranza.ingresoMensual.toLocaleString()}`}
            subtitle="Facturación estimada" icon={<DollarSign size={20} />} color="#10b981" />
        </div>
        <div className="animate-fade stagger-2">
          <KPICard title="Deuda Total" value={`S/. ${cobranza.totalDeuda.toLocaleString()}`}
            subtitle={`${cobranza.conDeuda} clientes morosos`} icon={<AlertTriangle size={20} />} color="#ef4444" />
        </div>
        <div className="animate-fade stagger-3">
          <KPICard title="Cortados" value={cobranza.cortados}
            subtitle="Por deuda" icon={<Users size={20} />} color="#f59e0b" />
        </div>
        <div className="animate-fade stagger-4">
          <KPICard title="Tickets Abiertos" value={tickets.filter(t => t.estado === 'Abierto').length}
            subtitle={`${averias.filter(a => a.estado !== 'Resuelta').length} averías activas`} icon={<TrendingUp size={20} />} color="#8b5cf6" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Ingreso por tecnología */}
        <div className="bg-bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-sm font-semibold mb-4 text-text-secondary">Ingreso por Tecnología</h3>
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between mb-1.5 text-sm">
                <span className="text-accent-blue font-semibold">Radio Enlace ({cobranza.radioCount})</span>
                <span className="font-mono">S/. {cobranza.ingresoRadio.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-bg-secondary rounded">
                <div className="h-full bg-accent-blue rounded transition-all" style={{ width: `${cobranza.ingresoMensual ? (cobranza.ingresoRadio / cobranza.ingresoMensual * 100) : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1.5 text-sm">
                <span className="text-accent-purple font-semibold">Fibra Óptica ({cobranza.fibraCount})</span>
                <span className="font-mono">S/. {cobranza.ingresoFibra.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-bg-secondary rounded">
                <div className="h-full bg-accent-purple rounded transition-all" style={{ width: `${cobranza.ingresoMensual ? (cobranza.ingresoFibra / cobranza.ingresoMensual * 100) : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Deuda por zona */}
        <div className="bg-bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-sm font-semibold mb-4 text-text-secondary">Deuda por Zona</h3>
          <div className="flex flex-col gap-2">
            {cobranza.zonas.map(([zona, info]) => (
              <div key={zona} className="flex items-center justify-between py-1.5 text-xs">
                <span className="font-medium">{zona}</span>
                <div className="flex items-center gap-4">
                  <span className="text-text-muted">{info.clientes} clientes</span>
                  <span className="font-mono text-accent-red font-semibold">S/. {info.monto.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top morosos */}
      <div className="bg-bg-card rounded-2xl p-6 border border-border mb-6">
        <h3 className="text-sm font-semibold mb-4 text-text-secondary">Top 10 Clientes con Mayor Deuda</h3>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] text-text-muted uppercase">
              <th className="py-2 px-3">ID</th>
              <th className="py-2 px-3">Nombre</th>
              <th className="py-2 px-3">Móvil</th>
              <th className="py-2 px-3">Plan</th>
              <th className="py-2 px-3">Meses</th>
              <th className="py-2 px-3">Monto</th>
              <th className="py-2 px-3">Último Pago</th>
            </tr>
          </thead>
          <tbody>
            {cobranza.morosos.map(c => (
              <tr key={c.id} className="border-t border-border">
                <td className="py-2 px-3 font-mono text-text-muted text-[11px]">{c.id}</td>
                <td className="py-2 px-3 font-medium">{c.nombre}</td>
                <td className="py-2 px-3 font-mono text-xs">{c.movil_1}</td>
                <td className="py-2 px-3 text-[11px] text-text-secondary max-w-[200px] truncate">{c.plan}</td>
                <td className="py-2 px-3 text-center font-mono">{c.deuda_meses}</td>
                <td className="py-2 px-3 font-mono text-accent-red font-semibold">S/. {c.deuda_monto.toFixed(2)}</td>
                <td className="py-2 px-3 text-text-muted text-xs">{c.ultimo_pago || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Exportar */}
      <div className="bg-bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-sm font-semibold mb-4 text-text-secondary">Exportar Reportes</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { type: 'cobranza', label: 'Reporte de Cobranza', desc: 'Clientes con deuda pendiente', color: 'bg-accent-red' },
            { type: 'clientes', label: 'Reporte Completo', desc: 'Todos los clientes con detalles', color: 'bg-accent-blue' },
            { type: 'cortados', label: 'Suspendidos / Cortados', desc: 'Clientes sin servicio activo', color: 'bg-accent-yellow' },
          ].map(r => (
            <button key={r.type} onClick={() => exportReport(r.type)}
              className="flex items-center gap-3 p-4 rounded-xl bg-bg-secondary border border-border text-left cursor-pointer transition-all hover:border-accent-blue/50 group">
              <div className={`w-10 h-10 rounded-lg ${r.color}/15 flex items-center justify-center`}>
                <Download size={18} className={r.color.replace('bg-', 'text-')} />
              </div>
              <div>
                <p className="text-sm font-semibold">{r.label}</p>
                <p className="text-[11px] text-text-muted">{r.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
