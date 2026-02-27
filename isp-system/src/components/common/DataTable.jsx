import { useState, useMemo } from 'react';

export default function DataTable({ columns, data, onRowClick, pageSize = 20 }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize);
  const paged = useMemo(
    () => data.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [data, currentPage, pageSize]
  );

  // Reset page when data changes
  useMemo(() => setCurrentPage(1), [data.length]);

  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-bg-card">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-bg-secondary sticky top-0 z-10">
              {columns.map(col => (
                <th key={col.key} className="py-2.5 px-3.5 text-left font-semibold text-[11px] text-text-secondary uppercase tracking-wide border-b border-border">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => (
              <tr key={row.id ?? row._id ?? row.uid ?? JSON.stringify(row)}
                onClick={() => onRowClick?.(row)}
                className="border-b border-border cursor-pointer transition-colors hover:bg-bg-card-hover">
                {columns.map(col => (
                  <td key={col.key} className={`py-2.5 px-3.5 ${col.className || ''}`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-text-muted">
                  No se encontraron resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-text-muted">
            Mostrando {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, data.length)} de {data.length}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page;
              if (totalPages <= 7) page = i + 1;
              else if (currentPage <= 4) page = i + 1;
              else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
              else page = currentPage - 3 + i;
              return (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg border text-xs cursor-pointer transition-colors
                    ${currentPage === page
                      ? 'bg-accent-blue border-accent-blue text-white font-semibold'
                      : 'bg-bg-secondary border-border text-text-secondary hover:border-accent-blue'
                    }`}>
                  {page}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
