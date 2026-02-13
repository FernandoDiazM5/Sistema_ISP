import { createColumnHelper } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const columnHelper = createColumnHelper();

// Helper para formatear moneda
const formatMoney = (val) => {
    const num = Number(val);
    return isNaN(num) ? 'S/. 0.00' : `S/. ${num.toFixed(2)}`;
};

export const columns = [
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
    columnHelper.display({
        id: 'actions',
        header: '',
        cell: () => (
            <div className="flex justify-center text-accent-blue">
                <Eye size={16} />
            </div>
        ),
        size: 40,
        enableSorting: false,
    }),
];
