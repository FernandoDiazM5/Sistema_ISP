import { useState } from 'react';
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ClientesTable({ data, columns, pagination, setPagination }) {
    const navigate = useNavigate();
    const [sorting, setSorting] = useState([]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            pagination,
        },
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    // Helper to get cell value securely
    const getCellValue = (row, accessorKey) => {
        const cell = row.getVisibleCells().find(c => c.column.id === accessorKey);
        return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 w-full">
            {/* --- MOBILE CARD VIEW (Visible < md) --- */}
            <div className="block md:hidden overflow-y-auto flex-1 space-y-3 pb-20">
                {table.getRowModel().rows.length === 0 ? (
                    <div className="text-center py-10 text-text-muted text-sm">No se encontraron clientes.</div>
                ) : (
                    table.getRowModel().rows.map(row => (
                        <div key={row.id} className="bento-card p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-text-primary text-sm">{row.original.nombre}</p>
                                    <p className="text-xs text-text-muted font-mono">{row.original.id} • {row.original.dni}</p>
                                </div>
                                <div className="shrink-0">
                                    {getCellValue(row, 'status')}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-bg-secondary p-2 rounded-lg">
                                    <span className="text-text-muted block text-[10px] uppercase">Plan</span>
                                    <span className="font-medium text-text-secondary">{row.original.plan || 'N/A'}</span>
                                </div>
                                <div className="bg-bg-secondary p-2 rounded-lg">
                                    <span className="text-text-muted block text-[10px] uppercase">Zona</span>
                                    <span className="font-medium text-text-secondary">{row.original.zona || 'N/A'}</span>
                                </div>
                                <div className="bg-bg-secondary p-2 rounded-lg">
                                    <span className="text-text-muted block text-[10px] uppercase">IP</span>
                                    <span className="font-mono text-text-secondary">{row.original.ip_address || 'N/A'}</span>
                                </div>
                                <div className="bg-bg-secondary p-2 rounded-lg">
                                    <span className="text-text-muted block text-[10px] uppercase">Deuda</span>
                                    <span className="font-bold text-text-primary">S/. {row.original.deuda_monto?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-1">
                                <div className="flex-1">
                                    {getCellValue(row, 'actions')}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* --- DESKTOP TABLE VIEW (Visible >= md) --- */}
            <div className="hidden md:block flex-1 overflow-auto bento-card border border-white/5">
                <table className="w-full border-collapse text-[13px]">
                    <thead className="bg-bg-secondary/85 backdrop-blur-md sticky top-0 z-10 border-b border-border shadow-sm">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th
                                        key={header.id}
                                        className="py-2.5 px-3.5 text-center font-semibold text-[11px] text-text-secondary uppercase tracking-wide border-b border-border select-none group whitespace-nowrap"
                                        style={{ width: header.getSize() }}
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        <div className={`flex items-center justify-center gap-1.5 ${header.column.getCanSort() ? 'cursor-pointer' : ''}`}>
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {{
                                                asc: <ArrowUp size={12} className="text-accent-blue" />,
                                                desc: <ArrowDown size={12} className="text-accent-blue" />,
                                            }[header.column.getIsSorted()] ?? (
                                                    header.column.getCanSort() && (
                                                        <ArrowUpDown size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    )
                                                )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="py-16 text-center text-text-muted text-sm">
                                    No se encontraron registros.
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr
                                    key={row.id}
                                    className="border-b border-border transition-colors hover:bg-bg-card-hover"
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="py-2.5 px-3.5 text-center">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación (Shared) */}
            <div className="flex items-center justify-between mt-4 px-2 pb-6 md:pb-0">
                <span className="text-xs text-text-muted hidden sm:inline">
                    Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount().toLocaleString()}
                    <span className="mx-2">•</span>
                    Total: {table.getFilteredRowModel().rows.length} registros
                </span>
                {/* Mobile pagination text */}
                <span className="text-xs text-text-muted sm:hidden">
                    {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                </span>

                <div className="flex items-center gap-1.5">
                    <button
                        className="p-1.5 rounded-lg border border-border bg-bg-secondary text-text-secondary disabled:opacity-50 hover:bg-bg-card transition-colors"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronsLeft size={16} />
                    </button>
                    <button
                        className="p-1.5 rounded-lg border border-border bg-bg-secondary text-text-secondary disabled:opacity-50 hover:bg-bg-card transition-colors"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        className="p-1.5 rounded-lg border border-border bg-bg-secondary text-text-secondary disabled:opacity-50 hover:bg-bg-card transition-colors"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronRight size={16} />
                    </button>
                    <button
                        className="p-1.5 rounded-lg border border-border bg-bg-secondary text-text-secondary disabled:opacity-50 hover:bg-bg-card transition-colors"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronsRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
