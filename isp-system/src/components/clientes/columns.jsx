import { createColumnHelper } from '@tanstack/react-table';
import { Eye, TicketPlus, ShoppingBag } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const columnHelper = createColumnHelper();

// Helper para formatear moneda
const formatMoney = (val) => {
    const num = Number(val);
    return isNaN(num) ? 'S/. 0.00' : `S/. ${num.toFixed(2)}`;
};

// Columnas de datos
const dataColumns = [
    columnHelper.accessor('id', {
        header: 'ID',
        cell: info => <span className="font-mono text-[11px] text-text-muted">{info.getValue()}</span>,
        size: 60,
    }),
    columnHelper.accessor('nombre', {
        header: 'Nombre',
        cell: info => (
            <span className="font-medium max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap block" title={info.getValue()}>
                {info.getValue()}
            </span>
        ),
        size: 200,
    }),
    columnHelper.accessor('dni', {
        header: 'DNI',
        cell: info => <span className="font-mono text-[12px]">{info.getValue()}</span>,
        size: 90,
    }),
    columnHelper.accessor('tecnologia', {
        header: 'Tecnología',
        cell: info => <StatusBadge status={info.getValue()} />,
        size: 110,
    }),
    columnHelper.accessor('plan', {
        header: 'Plan',
        cell: info => <span className="text-[11px] max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap block">{info.getValue()}</span>,
        size: 130,
    }),
    columnHelper.accessor('precio', {
        header: 'Precio',
        cell: info => <span className="font-mono text-xs">{formatMoney(info.getValue())}</span>,
        size: 80,
    }),
    columnHelper.accessor('estado_cuenta', {
        header: 'Estado',
        cell: info => <StatusBadge status={info.getValue()} />,
        size: 100,
    }),
    columnHelper.accessor('status', {
        header: 'Conexión',
        cell: info => <StatusBadge status={info.getValue()} />,
        size: 100,
    }),
    columnHelper.accessor('deuda_monto', {
        header: 'Deuda',
        cell: info => {
            const deuda = Number(info.getValue());
            const hasDeuda = !isNaN(deuda) && deuda > 0;
            return (
                <span className={`font-mono text-xs ${hasDeuda ? 'text-accent-red font-semibold' : 'text-text-muted'}`}>
                    {hasDeuda ? formatMoney(deuda) : '—'}
                </span>
            );
        },
        size: 90,
    }),
    columnHelper.accessor('direccion', {
        header: 'Dirección',
        cell: info => <span className="text-[11px] max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap block" title={info.getValue()}>{info.getValue() || '—'}</span>,
        size: 180,
    }),
    columnHelper.accessor('zona', {
        header: 'Zona',
        cell: info => <span className="text-[12px] max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap block">{info.getValue() || '—'}</span>,
        size: 120,
    }),
    columnHelper.accessor('nodo', {
        header: 'Nodo',
        cell: info => <span className="text-[11px] font-mono max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap block">{info.row.original.nodo || info.row.original.nodo_router || '—'}</span>,
        size: 100,
    }),
    columnHelper.accessor('movil_1', {
        header: 'Teléfono',
        cell: info => <span className="font-mono text-[12px]">{info.getValue() || '—'}</span>,
        size: 95,
    }),
];

// Columna unificada de acciones
export function buildColumns({ onCreateTicket, onCreatePostVenta, onViewDetail } = {}) {
    const hasActions = onCreateTicket || onCreatePostVenta;

    const actionsColumn = columnHelper.display({
        id: 'actions',
        header: () => hasActions ? <span className="text-[10px]">ACCIONES</span> : '',
        cell: ({ row }) => (
            <div className="flex items-center gap-1.5 justify-center">
                {onCreateTicket && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onCreateTicket(row.original); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent-blue/10 text-accent-blue text-[10px] font-bold hover:bg-accent-blue/25 transition-colors cursor-pointer border-none whitespace-nowrap"
                        title={`Crear ticket para ${row.original.nombre}`}
                    >
                        <TicketPlus size={12} />
                        <span>Ticket</span>
                    </button>
                )}
                {onCreatePostVenta && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onCreatePostVenta(row.original); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent-purple/10 text-accent-purple text-[10px] font-bold hover:bg-accent-purple/25 transition-colors cursor-pointer border-none whitespace-nowrap"
                        title={`Crear post-venta para ${row.original.nombre}`}
                    >
                        <ShoppingBag size={12} />
                        <span>PV</span>
                    </button>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); onViewDetail?.(row.original); }}
                    className="flex items-center justify-center p-1.5 rounded-lg hover:bg-accent-blue/15 text-accent-blue transition-colors cursor-pointer bg-transparent border-none ml-1"
                    title={`Ver detalle de ${row.original.nombre}`}
                >
                    <Eye size={15} />
                </button>
            </div>
        ),
        size: hasActions ? 190 : 50,
        enableSorting: false,
    });

    return [...dataColumns, actionsColumn];
}

// Exportar columnas por defecto (backward compatibility)
export const columns = buildColumns();

