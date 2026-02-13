import { useMemo } from 'react';
import { AlertTriangle, TrendingDown, WifiOff, AlertCircle } from 'lucide-react';
import useStore from '../../store/useStore';

export default function AlertsPanel() {
    const clients = useStore(s => s.clients);
    const averias = useStore(s => s.averias);

    const alerts = useMemo(() => {
        const list = [];

        // 1. Detección de Averías Masivas (más de 3 reportes en la misma zona hoy)
        const averiasPorZona = {};
        const hoy = new Date().toISOString().split('T')[0];
        averias.forEach(a => {
            if (a.estado !== 'Resuelta' && a.fecha === hoy) {
                averiasPorZona[a.zona] = (averiasPorZona[a.zona] || 0) + 1;
            }
        });
        Object.entries(averiasPorZona).forEach(([zona, count]) => {
            if (count >= 3) {
                list.push({
                    id: `av-${zona}`,
                    type: 'critical',
                    icon: <WifiOff size={18} />,
                    title: `Posible Caída en ${zona}`,
                    desc: `${count} reportes de avería registrados hoy en esta zona.`,
                });
            }
        });

        // 2. Clientes con deuda crítica (> 3 meses)
        const morososCriticos = clients.filter(c => c.deuda_meses >= 3 && c.estado_servicio !== 'Cortado').length;
        if (morososCriticos > 0) {
            list.push({
                id: 'debt-critical',
                type: 'warning',
                icon: <TrendingDown size={18} />,
                title: 'Gestión de Corte Requerida',
                desc: `${morososCriticos} clientes tienen 3 o más meses de deuda y siguen activos.`,
            });
        }

        // 3. Tecnicos inactivos con tickets asignados
        // (Lógica simulada: Si hubiera técnicos marcados como "Inactivo" pero con tickets "En Proceso")

        // 4. Clientes sin Plan asignado
        const sinPlan = clients.filter(c => !c.plan || c.plan === 'Sin Plan').length;
        if (sinPlan > 0) {
            list.push({
                id: 'no-plan',
                type: 'info',
                icon: <AlertCircle size={18} />,
                title: 'Datos Incompletos',
                desc: `${sinPlan} clientes no tienen un plan de internet asignado.`,
            });
        }

        return list;
    }, [clients, averias]);

    if (alerts.length === 0) return null;

    return (
        <div className="mb-6 grid gap-3">
            {alerts.map(alert => (
                <div key={alert.id} className={`
          flex items-start gap-3 p-4 rounded-xl border
          ${alert.type === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-200' : ''}
          ${alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : ''}
          ${alert.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-200' : ''}
        `}>
                    <div className={`mt-0.5 p-1.5 rounded-full 
            ${alert.type === 'critical' ? 'bg-red-500/20 text-red-400' : ''}
            ${alert.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : ''}
            ${alert.type === 'info' ? 'bg-blue-500/20 text-blue-400' : ''}
          `}>
                        {alert.icon}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold mb-0.5">{alert.title}</h4>
                        <p className="text-xs opacity-90">{alert.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
