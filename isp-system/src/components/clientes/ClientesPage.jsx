import { useState, useMemo } from 'react';
import { Settings2, X, Filter, Search } from 'lucide-react';
import useStore from '../../store/useStore';
import { useFilters } from '../../hooks/useFilters';
import ClientesTable from './ClientesTable';
import { columns } from './columns';
// SkeletonLoader removed — useFilters handles debounce internally

// UI Components
import Input from '../ui/Input';
import Button from '../ui/Button';

const SEARCH_FIELDS = [
  { key: 'id', label: 'ID' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'dni', label: 'DNI' },
  { key: 'tecnologia', label: 'Tecnología' },
  { key: 'plan', label: 'Plan' },
  { key: 'precio', label: 'Precio' },
  { key: 'estado_cuenta', label: 'Estado' },
  { key: 'status', label: 'Conexión' },
  { key: 'deuda_monto', label: 'Deuda' },
  { key: 'movil_1', label: 'Teléfono' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'zona', label: 'Zona' },
  { key: 'nodo', label: 'Nodo' },
];

export default function ClientesPage() {
  const clients = useStore(s => s.clients);
  const columnPrefs = useStore(s => s.columnPrefs);
  const setColumnPrefs = useStore(s => s.setColumnPrefs);

  // Search Scope State (Specific to this page, so kept local)
  const [searchScope, setSearchScope] = useState(SEARCH_FIELDS.map(f => f.key));
  const [showSearchScope, setShowSearchScope] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Custom Hook
  const {
    filteredData,
    searchInput,
    setSearchInput,
    pagination,
    setPagination,
    resetFilters,
    hasActiveSearch
  } = useFilters(clients, {
    searchFields: searchScope,
    pageSize: 20
  });

  // Filter visible columns
  const visibleColumns = useMemo(() => {
    if (!columnPrefs.visible) return columns;
    const visibleSet = new Set(columnPrefs.visible);
    return columns.filter(col => {
      if (col.id === 'actions') return true;
      if (col.accessorKey && visibleSet.has(col.accessorKey)) return true;
      return false;
    });
  }, [columnPrefs.visible]);

  return (
    <div className="p-6 px-8 h-full flex flex-col animate-fade">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-text-primary">Clientes</h1>
          <p className="text-text-secondary text-sm mt-1">
            {filteredData.length} de {clients.length} clientes
            {hasActiveSearch && (
              <button
                onClick={resetFilters}
                className="ml-3 text-accent-blue text-[11px] hover:underline cursor-pointer border-none bg-transparent"
              >
                Limpiar búsqueda
              </button>
            )}
          </p>
        </div>

        <div className="flex gap-3">
          {/* SEARCH & SCOPE */}
          <div className="flex gap-2">
            <div className="w-[320px]">
              <Input
                placeholder="Buscar..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                icon={Search}
              />
            </div>

            <div className="relative">
              <Button
                variant={showSearchScope ? 'primary' : 'outline'}
                onClick={() => setShowSearchScope(!showSearchScope)}
                className="h-full"
                title="Seleccionar campos de búsqueda"
                icon={Filter}
              >
                Buscar en
              </Button>

              {showSearchScope && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSearchScope(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-[200px] bg-bg-card border border-border rounded-xl shadow-2xl shadow-black/30 py-2 max-h-[400px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3.5 py-2 border-b border-border mb-1 flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Campos</span>
                      <button
                        onClick={() => setSearchScope(SEARCH_FIELDS.map(f => f.key))}
                        className="text-[10px] text-accent-blue hover:underline cursor-pointer bg-transparent border-none"
                      >
                        Todos
                      </button>
                    </div>
                    {SEARCH_FIELDS.map(field => {
                      const isChecked = searchScope.includes(field.key);
                      return (
                        <label
                          key={field.key}
                          className="flex items-center gap-2.5 px-3.5 py-[7px] hover:bg-bg-card-hover cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSearchScope(searchScope.filter(k => k !== field.key));
                              } else {
                                setSearchScope([...searchScope, field.key]);
                              }
                            }}
                            className="w-3.5 h-3.5 rounded border-border accent-accent-blue cursor-pointer"
                          />
                          <span className={`text-[13px] ${isChecked ? 'text-text-primary' : 'text-text-muted'}`}>
                            {field.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* COLUMN SELECTOR */}
          <div className="relative">
            <Button
              variant={showColumnSelector ? 'primary' : 'outline'}
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="h-full"
              icon={Settings2}
            >
              Columnas
            </Button>

            {showColumnSelector && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowColumnSelector(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-[220px] bg-bg-card border border-border rounded-xl shadow-2xl shadow-black/30 py-2 max-h-[400px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 border-b border-border mb-1">
                    <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                      Columnas visibles
                    </span>
                  </div>
                  {columns.map(col => {
                    if (col.id === 'actions') return null;

                    const colKey = col.accessorKey || col.id;
                    const label = typeof col.header === 'string' ? col.header : colKey;
                    const isVisible = columnPrefs.visible.includes(colKey);

                    return (
                      <label
                        key={colKey}
                        className="flex items-center gap-2.5 px-3.5 py-[7px] hover:bg-bg-card-hover cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => {
                            const newVisible = isVisible
                              ? columnPrefs.visible.filter(k => k !== colKey)
                              : [...columnPrefs.visible, colKey];
                            setColumnPrefs({ ...columnPrefs, visible: newVisible });
                          }}
                          className="w-3.5 h-3.5 rounded border-border accent-accent-blue cursor-pointer"
                        />
                        <span className={`text-[13px] ${isVisible ? 'text-text-primary' : 'text-text-muted'}`}>
                          {label}
                        </span>
                      </label>
                    );
                  })}
                  <div className="border-t border-border mt-1 pt-1 px-3.5 py-2">
                    <button
                      onClick={() => {
                        setColumnPrefs({
                          ...columnPrefs,
                          visible: columns.filter(c => c.id !== 'actions').map(c => c.accessorKey || c.id)
                        });
                      }}
                      className="text-[11px] text-accent-blue hover:underline cursor-pointer bg-transparent border-none"
                    >
                      Mostrar todas
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* TABLE */}
      {/* Removed "isFiltering" skeleton logic because useFilters is fast and debounce is handled inside. 
          If we wanted loading state, useFilters doesn't provide it yet, but it's client side so instant. 
      */}
      <ClientesTable
        data={filteredData}
        columns={visibleColumns}
        pagination={pagination}
        setPagination={setPagination}
      />
    </div>
  );
}
