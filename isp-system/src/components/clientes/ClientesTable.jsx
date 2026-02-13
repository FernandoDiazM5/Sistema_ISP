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

    return (
        <div className="flex flex-col flex-1 min-h-0 w-full">
            <div className="flex-1 overflow-auto rounded-xl border border-border bg-bg-card">
                <table className="w-full border-collapse text-[13px]">
                    <thead className="bg-bg-secondary sticky top-0 z-10">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th
                                        key={header.id}
                                        className="py-2.5 px-3.5 text-left font-semibold text-[11px] text-text-secondary uppercase tracking-wide border-b border-border select-none group whitespace-nowrap"
                                        style={{ width: header.getSize() }}
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        <div className={`flex items-center gap-1.5 ${header.column.getCanSort() ? 'cursor-pointer' : ''}`}>
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
                                    onClick={() => navigate(`/clientes/${row.original.id}`)}
                                    className="border-b border-border cursor-pointer transition-colors hover:bg-bg-card-hover"
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="py-2.5 px-3.5">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between mt-4 px-2">
                <span className="text-xs text-text-muted">
                    Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount().toLocaleString()}
                    <span className="mx-2">•</span>
                    Total: {table.getFilteredRowModel().rows.length} registros
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
