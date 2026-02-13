import { useState, useMemo, useEffect } from 'react';
import { Search, Eye, Settings2, ArrowUpDown, ArrowUp, ArrowDown, GripVertical, X } from 'lucide-react';
import useStore from '../../store/useStore';
import StatusBadge from '../common/StatusBadge';
import ClienteDetalle from './ClienteDetalle';

const ALL_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'dni', label: 'DNI' },
  { key: 'tecnologia', label: 'Tecnologia' },
  { key: 'plan', label: 'Plan' },
  { key: 'precio', label: 'Precio' },
  { key: 'estado_cuenta', label: 'Estado' },
  { key: 'status', label: 'Conexion' },
  { key: 'deuda_monto', label: 'Deuda' },
  { key: 'movil_1', label: 'Telefono' },
  { key: 'direccion', label: 'Direccion' },
  { key: 'zona', label: 'Zona' },
  { key: 'nodo', label: 'Nodo' },
];

const COLUMN_MAP = {};
ALL_COLUMNS.forEach(c => { COLUMN_MAP[c.key] = c.label; });

const PAGE_SIZE = 20;

function renderCell(client, colKey) {
  switch (colKey) {
    case 'id':
      return <span className="font-mono text-[11px] text-text-muted">{client.id}</span>;
    case 'nombre':
      return <span className="font-medium max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap block">{client.nombre}</span>;
    case 'dni':
      return <span className="font-mono text-[12px]">{client.dni}</span>;
    case 'tecnologia':
      return <StatusBadge status={client.tecnologia} />;
    case 'plan':
      return <span className="text-[11px] max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap block">{client.plan}</span>;
    case 'precio':
      const precio = Number(client.precio);
      return <span className="font-mono text-xs">S/. {!isNaN(precio) ? precio.toFixed(2) : '0.00'}</span>;
    case 'estado_cuenta':
      return <StatusBadge status={client.estado_cuenta} />;
    case 'status':
      return <StatusBadge status={client.status} />;
    case 'deuda_monto':
      const deuda = Number(client.deuda_monto);
      const hasDeuda = !isNaN(deuda) && deuda > 0;
      return (
        <span className={`font-mono text-xs ${hasDeuda ? 'text-accent-red' : 'text-text-muted'}`}>
          {hasDeuda ? `S/. ${deuda.toFixed(2)}` : '\u2014'}
        </span>
      );
    case 'movil_1':
      return <span className="font-mono text-[12px]">{client.movil_1 || '\u2014'}</span>;
    case 'direccion':
      return <span className="text-[11px] max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap block">{client.direccion || '\u2014'}</span>;
    case 'zona':
      return <span className="text-[12px]">{client.zona || '\u2014'}</span>;
    case 'nodo':
      return <span className="text-[11px] font-mono">{client.nodo || client.nodo_router || '\u2014'}</span>;
    default:
      return <span>{String(client[colKey] ?? '\u2014')}</span>;
  }
}

function getSortValue(client, colKey) {
  switch (colKey) {
    case 'precio':
    case 'deuda_monto':
      return typeof client[colKey] === 'number' ? client[colKey] : 0;
    case 'nombre':
    case 'dni':
    case 'tecnologia':
    case 'plan':
    case 'estado_cuenta':
    case 'status':
    case 'movil_1':
    case 'direccion':
    case 'zona':
    case 'nodo':
      return (client[colKey] || '').toLowerCase();
    default:
      return client[colKey] ?? '';
  }
}

export default function ClientesPage() {
  const clients = useStore(s => s.clients);
  const columnPrefs = useStore(s => s.columnPrefs);
  const setColumnPrefs = useStore(s => s.setColumnPrefs);

  const [searchInput, setSearchInput] = useState(''); // Valor del input (inmediato)
  const [searchQuery, setSearchQuery] = useState(''); // Valor para filtrar (con retraso)
  const [filterTech, setFilterTech] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterConexion, setFilterConexion] = useState('all');
  const [filterDeuda, setFilterDeuda] = useState('all');
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [draggedCol, setDraggedCol] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Optimización: Debounce para evitar filtrar en cada tecla con muchos datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 300); // Esperar 300ms después de dejar de escribir
    return () => clearTimeout(timer);
  }, [searchInput]);

  const visibleSet = useMemo(() => new Set(columnPrefs.visible), [columnPrefs.visible]);
  const orderedColumns = useMemo(() => {
    return columnPrefs.order.filter(key => visibleSet.has(key));
  }, [columnPrefs.order, visibleSet]);

  const filtered = useMemo(() => {
    return clients.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !searchQuery ||
        (c.nombre && c.nombre.toLowerCase().includes(q)) ||
        (c.dni && c.dni.includes(searchQuery)) ||
        (c.codigo && c.codigo.includes(searchQuery)) ||
        (c.id && c.id.includes(searchQuery)) ||
        (c.movil_1 && c.movil_1.includes(searchQuery)) ||
        (c.direccion && c.direccion.toLowerCase().includes(q));
      const matchTech = filterTech === 'all' || c.tecnologia === filterTech;
      const matchStatus = filterStatus === 'all' || c.estado_cuenta === filterStatus;
      const matchConexion = filterConexion === 'all' || c.status === filterConexion;
      const matchDeuda = filterDeuda === 'all' ||
        (filterDeuda === 'con_deuda' && c.deuda_monto > 0) ||
        (filterDeuda === 'sin_deuda' && (c.deuda_monto === 0 || c.deuda_monto == null));
      return matchSearch && matchTech && matchStatus && matchConexion && matchDeuda;
    });
  }, [clients, searchQuery, filterTech, filterStatus, filterConexion, filterDeuda]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const aVal = getSortValue(a, sortCol);
      const bVal = getSortValue(b, sortCol);
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal), 'es', { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSort(colKey) {
    if (sortCol === colKey) {
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(colKey);
      setSortDir('asc');
    }
    setCurrentPage(1);
  }

  function toggleColumnVisibility(colKey) {
    const newVisible = visibleSet.has(colKey)
      ? columnPrefs.visible.filter(k => k !== colKey)
      : [...columnPrefs.visible, colKey];
    setColumnPrefs({ ...columnPrefs, visible: newVisible });
  }

  function handleDragStart(e, colKey) {
    setDraggedCol(colKey);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', colKey);
  }

  function handleDragOver(e, colKey) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (colKey !== draggedCol) {
      setDragOverCol(colKey);
    }
  }

  function handleDragLeave() {
    setDragOverCol(null);
  }

  function handleDrop(e, targetCol) {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedCol || draggedCol === targetCol) {
      setDraggedCol(null);
      return;
    }
    const newOrder = [...columnPrefs.order];
    const fromIdx = newOrder.indexOf(draggedCol);
    const toIdx = newOrder.indexOf(targetCol);
    if (fromIdx === -1 || toIdx === -1) {
      setDraggedCol(null);
      return;
    }
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggedCol);
    setColumnPrefs({ ...columnPrefs, order: newOrder });
    setDraggedCol(null);
  }

  function handleDragEnd() {
    setDraggedCol(null);
    setDragOverCol(null);
  }

  function resetFilters() {
    setSearchInput('');
    setSearchQuery('');
    setFilterTech('all');
    setFilterStatus('all');
    setFilterConexion('all');
    setFilterDeuda('all');
    setCurrentPage(1);
    setSortCol(null);
    setSortDir('asc');
  }

  function renderSortIcon(colKey) {
    if (sortCol !== colKey) {
      return <ArrowUpDown size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    if (sortDir === 'asc') {
      return <ArrowUp size={12} className="text-accent-blue" />;
    }
    return <ArrowDown size={12} className="text-accent-blue" />;
  }

  function renderPaginationButtons() {
    const buttons = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(i);
      }
    } else if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) buttons.push(i);
      buttons.push(null);
      buttons.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      buttons.push(1);
      buttons.push(null);
      for (let i = totalPages - 4; i <= totalPages; i++) buttons.push(i);
    } else {
      buttons.push(1);
      buttons.push(null);
      for (let i = currentPage - 1; i <= currentPage + 1; i++) buttons.push(i);
      buttons.push(null);
      buttons.push(totalPages);
    }

    return buttons.map((page, idx) => {
      if (page === null) {
        return (
          <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-text-muted text-xs">
            ...
          </span>
        );
      }
      return (
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`w-8 h-8 rounded-lg border text-xs cursor-pointer transition-colors
            ${currentPage === page
              ? 'bg-accent-blue border-accent-blue text-white font-semibold'
              : 'bg-bg-secondary border-border text-text-secondary hover:border-text-muted'
            }`}
        >
          {page}
        </button>
      );
    });
  }

  if (selectedCliente) {
    return <ClienteDetalle cliente={selectedCliente} onBack={() => setSelectedCliente(null)} />;
  }

  const hasActiveFilters = filterTech !== 'all' || filterStatus !== 'all' || filterConexion !== 'all' || filterDeuda !== 'all' || searchInput !== '';

  return (
    <div className="p-6 px-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-text-primary">Clientes</h1>
          <p className="text-text-secondary text-sm mt-1">
            {sorted.length} de {clients.length} clientes
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="ml-3 text-accent-blue text-[11px] hover:underline cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="flex items-center gap-2 bg-bg-card border border-border rounded-[10px] py-2 px-3.5 text-text-secondary text-[13px] cursor-pointer hover:border-accent-blue hover:text-text-primary transition-colors"
          >
            <Settings2 size={15} />
            <span>Columnas</span>
          </button>
          {showColumnSelector && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowColumnSelector(false)}
              />
              <div className="absolute right-0 top-full mt-2 z-50 w-[220px] bg-bg-card border border-border rounded-xl shadow-2xl shadow-black/30 py-2 max-h-[400px] overflow-y-auto">
                <div className="px-3.5 py-2 border-b border-border mb-1">
                  <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                    Columnas visibles
                  </span>
                </div>
                {ALL_COLUMNS.map(col => {
                  const isVisible = visibleSet.has(col.key);
                  return (
                    <label
                      key={col.key}
                      className="flex items-center gap-2.5 px-3.5 py-[7px] hover:bg-bg-card-hover cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleColumnVisibility(col.key)}
                        className="w-3.5 h-3.5 rounded border-border accent-accent-blue cursor-pointer"
                      />
                      <span className={`text-[13px] ${isVisible ? 'text-text-primary' : 'text-text-muted'}`}>
                        {col.label}
                      </span>
                    </label>
                  );
                })}
                <div className="border-t border-border mt-1 pt-1 px-3.5 py-2">
                  <button
                    onClick={() => {
                      setColumnPrefs({
                        visible: ALL_COLUMNS.map(c => c.key),
                        order: ALL_COLUMNS.map(c => c.key),
                      });
                    }}
                    className="text-[11px] text-accent-blue hover:underline cursor-pointer"
                  >
                    Mostrar todas
                  </button>
                  <span className="text-text-muted mx-2">|</span>
                  <button
                    onClick={() => {
                      setColumnPrefs({
                        visible: ['id', 'nombre', 'tecnologia', 'plan', 'precio', 'estado_cuenta', 'status', 'deuda_monto'],
                        order: ['id', 'nombre', 'tecnologia', 'plan', 'precio', 'estado_cuenta', 'status', 'deuda_monto'],
                      });
                    }}
                    className="text-[11px] text-text-muted hover:text-text-secondary hover:underline cursor-pointer"
                  >
                    Restablecer
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <div className="relative flex-[1_1_280px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <Search size={16} />
          </span>
          <input
            placeholder="Buscar por nombre, DNI, codigo, telefono, direccion..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-9 bg-bg-card border border-border rounded-[10px] py-2.5 px-3.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent-blue transition-colors"
          />
          {searchInput && (
            <button 
              onClick={() => { setSearchInput(''); setSearchQuery(''); setCurrentPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer bg-transparent border-none p-0 flex items-center justify-center">
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={filterTech}
          onChange={e => { setFilterTech(e.target.value); setCurrentPage(1); }}
          className="min-w-[140px] bg-bg-card border border-border rounded-[10px] py-2.5 px-3 text-[13px] text-text-primary outline-none focus:border-accent-blue cursor-pointer transition-colors"
        >
          <option value="all">Toda Tecnologia</option>
          <option value="Radio Enlace">Radio Enlace</option>
          <option value="Fibra Optica">Fibra Optica</option>
          <option value="No Determinado">No Determinado</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          className="min-w-[120px] bg-bg-card border border-border rounded-[10px] py-2.5 px-3 text-[13px] text-text-primary outline-none focus:border-accent-blue cursor-pointer transition-colors"
        >
          <option value="all">Todo Estado</option>
          <option value="ACTIVO">Activo</option>
          <option value="SUSPENDIDO">Suspendido</option>
        </select>
        <select
          value={filterConexion}
          onChange={e => { setFilterConexion(e.target.value); setCurrentPage(1); }}
          className="min-w-[120px] bg-bg-card border border-border rounded-[10px] py-2.5 px-3 text-[13px] text-text-primary outline-none focus:border-accent-blue cursor-pointer transition-colors"
        >
          <option value="all">Toda Conexion</option>
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">Offline</option>
        </select>
        <select
          value={filterDeuda}
          onChange={e => { setFilterDeuda(e.target.value); setCurrentPage(1); }}
          className="min-w-[120px] bg-bg-card border border-border rounded-[10px] py-2.5 px-3 text-[13px] text-text-primary outline-none focus:border-accent-blue cursor-pointer transition-colors"
        >
          <option value="all">Toda Deuda</option>
          <option value="con_deuda">Con deuda</option>
          <option value="sin_deuda">Sin deuda</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-border bg-bg-card">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-bg-secondary sticky top-0 z-10">
              {orderedColumns.map(colKey => (
                <th
                  key={colKey}
                  draggable
                  onDragStart={e => handleDragStart(e, colKey)}
                  onDragOver={e => handleDragOver(e, colKey)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, colKey)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleSort(colKey)}
                  className={`py-2.5 px-3.5 text-left font-semibold text-[11px] text-text-secondary uppercase tracking-wide border-b border-border cursor-pointer select-none group whitespace-nowrap transition-colors
                    ${dragOverCol === colKey ? 'bg-accent-blue/10 border-l-2 border-l-accent-blue' : ''}
                    ${draggedCol === colKey ? 'opacity-40' : ''}
                  `}
                >
                  <div className="flex items-center gap-1.5">
                    <GripVertical
                      size={12}
                      className="text-text-muted opacity-0 group-hover:opacity-60 transition-opacity cursor-grab flex-shrink-0"
                    />
                    <span>{COLUMN_MAP[colKey] || colKey}</span>
                    {renderSortIcon(colKey)}
                  </div>
                </th>
              ))}
              <th className="py-2.5 px-3.5 text-left font-semibold text-[11px] text-text-secondary uppercase tracking-wide border-b border-border w-10" />
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={orderedColumns.length + 1}
                  className="py-16 text-center text-text-muted text-sm"
                >
                  No se encontraron clientes con los filtros aplicados.
                </td>
              </tr>
            ) : (
              paged.map((c, i) => (
                <tr
                  key={`${c.id}-${i}`}
                  onClick={() => setSelectedCliente(c)}
                  className="border-b border-border cursor-pointer transition-colors hover:bg-bg-card-hover"
                >
                  {orderedColumns.map(colKey => (
                    <td key={colKey} className="py-2.5 px-3.5">
                      {renderCell(c, colKey)}
                    </td>
                  ))}
                  <td className="py-2.5 px-3.5 text-accent-blue">
                    <Eye size={14} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-text-muted">
            Mostrando {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, sorted.length)} de {sorted.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`w-8 h-8 rounded-lg border text-xs cursor-pointer transition-colors flex items-center justify-center
                ${currentPage === 1
                  ? 'bg-bg-secondary border-border text-text-muted cursor-not-allowed opacity-50'
                  : 'bg-bg-secondary border-border text-text-secondary hover:border-text-muted'
                }`}
            >
              &lt;
            </button>
            {renderPaginationButtons()}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`w-8 h-8 rounded-lg border text-xs cursor-pointer transition-colors flex items-center justify-center
                ${currentPage === totalPages
                  ? 'bg-bg-secondary border-border text-text-muted cursor-not-allowed opacity-50'
                  : 'bg-bg-secondary border-border text-text-secondary hover:border-text-muted'
                }`}
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
