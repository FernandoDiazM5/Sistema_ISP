import { useMemo } from 'react';
import { Download, DollarSign, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import useStore from '../../store/useStore';
import KPICard from '../common/KPICard';

// UI Components
import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function ReportesPage() {
  const clients = useStore(s => s.clients);
  const tickets = useStore(s => s.tickets);
  const averias = useStore(s => s.averias);

  const cobranza = useMemo(() => {
    const conDeuda = clients.filter(c => (c.deuda_monto || 0) > 0);
    const totalDeuda = conDeuda.reduce((s, c) => s + (c.deuda_monto || 0), 0);
    const ingresoMensual = clients.reduce((s, c) => s + (c.precio || 0), 0);
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
    const ingresoRadio = radioClients.reduce((s, c) => s + (c.precio || 0), 0);
    const ingresoFibra = fibraClients.reduce((s, c) => s + (c.precio || 0), 0);

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
    <div className="animate-fade p-4 sm:p-6 sm:px-8 h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-[26px] font-bold tracking-tight">Reportes & Cobranza</h1>
          <p className="text-text-secondary text-sm mt-1">Análisis financiero y operativo</p>
        </div>
      </div>

      {/* KPIs Financieros */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Ingreso Mensual" value={`S/. ${cobranza.ingresoMensual.toLocaleString()}`}
          subtitle="Facturación estimada" icon={<DollarSign size={20} />} color="#10b981" />
        <KPICard title="Deuda Total" value={`S/. ${cobranza.totalDeuda.toLocaleString()}`}
          subtitle={`${cobranza.conDeuda} clientes morosos`} icon={<AlertTriangle size={20} />} color="#ef4444" />
        <KPICard title="Cortados" value={cobranza.cortados}
          subtitle="Por deuda" icon={<Users size={20} />} color="#f59e0b" />
        <KPICard title="Tickets Abiertos" value={tickets.filter(t => t.estado === 'Abierto').length}
          subtitle={`${averias.filter(a => a.estado !== 'Resuelta').length} averías activas`} icon={<TrendingUp size={20} />} color="#8b5cf6" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Ingreso por tecnología */}
        <Card title="Ingreso por Tecnología" subtitle="Distribución por tipo de conexión">
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-accent-blue font-bold">Radio Enlace ({cobranza.radioCount})</span>
                <span className="font-mono text-text-primary">S/. {cobranza.ingresoRadio.toLocaleString()}</span>
              </div>
              <div className="h-2.5 bg-bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-accent-blue rounded-full transition-all duration-500" style={{ width: `${cobranza.ingresoMensual ? (cobranza.ingresoRadio / cobranza.ingresoMensual * 100) : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-accent-purple font-bold">Fibra Óptica ({cobranza.fibraCount})</span>
                <span className="font-mono text-text-primary">S/. {cobranza.ingresoFibra.toLocaleString()}</span>
              </div>
              <div className="h-2.5 bg-bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-accent-purple rounded-full transition-all duration-500" style={{ width: `${cobranza.ingresoMensual ? (cobranza.ingresoFibra / cobranza.ingresoMensual * 100) : 0}%` }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Deuda por zona */}
        <Card title="Deuda por Zona" subtitle="Zonas con mayor morosidad">
          <div className="flex flex-col gap-1 overflow-y-auto max-h-[160px] pr-2 custom-scrollbar">
            {cobranza.zonas.map(([zona, info]) => (
              <div key={zona} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-sm font-medium text-text-primary">{zona}</span>
                <div className="flex items-center gap-4">
                  <Badge variant="default" size="sm" className="bg-bg-secondary">{info.clientes} cl.</Badge>
                  <span className="font-mono text-red-500 font-bold text-sm">S/. {info.monto.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top morosos */}
      <Card title="Top 10 Clientes con Mayor Deuda" subtitle="Seguimiento de cobranza crítica" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] text-text-muted uppercase tracking-wider">
                <th className="py-3 px-3 font-semibold">ID</th>
                <th className="py-3 px-3 font-semibold">Nombre</th>
                <th className="py-3 px-3 font-semibold">Móvil</th>
                <th className="py-3 px-3 font-semibold">Plan</th>
                <th className="py-3 px-3 font-semibold text-center">Meses</th>
                <th className="py-3 px-3 font-semibold text-right">Monto</th>
                <th className="py-3 px-3 font-semibold">Último Pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {cobranza.morosos.map(c => (
                <tr key={c.id} className="hover:bg-bg-card-hover transition-colors">
                  <td className="py-3 px-3 font-mono text-text-muted text-[11px]">{c.id}</td>
                  <td className="py-3 px-3 font-medium text-text-primary">{c.nombre}</td>
                  <td className="py-3 px-3 font-mono text-xs text-text-secondary">{c.movil_1}</td>
                  <td className="py-3 px-3 text-[11px] text-text-secondary max-w-[200px] truncate">{c.plan}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-text-primary">{c.deuda_meses}</td>
                  <td className="py-3 px-3 text-right font-mono text-red-500 font-bold">S/. {c.deuda_monto.toFixed(2)}</td>
                  <td className="py-3 px-3 text-text-muted text-xs italic">{c.ultimo_pago || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Exportar */}
      <Card title="Exportar Reportes" subtitle="Descarga de datos en formato Excel">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { type: 'cobranza', label: 'Reporte de Cobranza', desc: 'Clientes con deuda pendiente', bgColor: 'bg-red-500/10', textColor: 'text-red-500' },
            { type: 'clientes', label: 'Reporte Completo', desc: 'Base de datos completa', bgColor: 'bg-blue-500/10', textColor: 'text-blue-500' },
            { type: 'cortados', label: 'Suspendidos / Cortados', desc: 'Clientes sin servicio activo', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-500' },
          ].map(r => (
            <button
              key={r.type}
              onClick={() => exportReport(r.type)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-bg-secondary/50 border border-border text-left cursor-pointer transition-all hover:border-accent-blue/50 hover:bg-bg-secondary group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${r.bgColor} group-hover:scale-110 transition-transform`}>
                <Download size={20} className={r.textColor} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-text-primary group-hover:text-accent-blue transition-colors">{r.label}</p>
                <p className="text-[11px] text-text-muted leading-tight mt-0.5">{r.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
