import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings2, X, Filter, Search, TicketPlus, ShoppingBag, User } from 'lucide-react';
import useStore from '../../store/useStore';
import { useFilters } from '../../hooks/useFilters';
import ClientesTable from './ClientesTable';
import { buildColumns, columns as defaultColumns } from './columns';
import TicketCreateModal from '../tickets/modals/TicketCreateModal';

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

const TIPO_SERVICIO_PV = [
  'Punto Adicional CATV',
  'Configuración IPTV',
  'Repetidor WiFi',
  'Cambio de Plan',
  'Traslado de Servicio',
  'Reconexión',
];

export default function ClientesPage() {
  const clients = useStore(s => s.clients);
  const columnPrefs = useStore(s => s.columnPrefs);
  const setColumnPrefs = useStore(s => s.setColumnPrefs);
  const addTicket = useStore(s => s.addTicket);
  const addPostVenta = useStore(s => s.addPostVenta);
  const addToast = useStore(s => s.addToast);
  const tecnicos = useStore(s => s.tecnicos);

  // Search Scope State
  const [searchScope, setSearchScope] = useState(SEARCH_FIELDS.map(f => f.key));
  const [showSearchScope, setShowSearchScope] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Ticket creation modal
  const [ticketClient, setTicketClient] = useState(null);

  // PostVenta quick modal
  const [pvClient, setPvClient] = useState(null);
  const [pvServicio, setPvServicio] = useState('');
  const [pvTecnico, setPvTecnico] = useState('');
  const [pvDescripcion, setPvDescripcion] = useState('');

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

  // Build columns with action callbacks
  const onCreateTicket = useCallback((client) => {
    setTicketClient(client);
  }, []);

  const onCreatePostVenta = useCallback((client) => {
    setPvClient(client);
    setPvServicio('');
    setPvTecnico('');
    setPvDescripcion('');
  }, []);

  const navigate = useNavigate();

  const onViewDetail = useCallback((client) => {
    navigate(`/clientes/${client.id}`);
  }, [navigate]);

  const tableColumns = useMemo(() => {
    return buildColumns({ onCreateTicket, onCreatePostVenta, onViewDetail });
  }, [onCreateTicket, onCreatePostVenta, onViewDetail]);

  // Filter visible columns
  const visibleColumns = useMemo(() => {
    if (!columnPrefs.visible) return tableColumns;
    const visibleSet = new Set(columnPrefs.visible);
    return tableColumns.filter(col => {
      // Always show action columns
      if (col.id === 'actions') return true;
      if (col.accessorKey && visibleSet.has(col.accessorKey)) return true;
      return false;
    });
  }, [columnPrefs.visible, tableColumns]);

  // Handle PostVenta submit
  const handleSubmitPV = () => {
    if (!pvClient || !pvServicio) return;
    const tecObj = pvTecnico ? tecnicos.find(t => t.id === pvTecnico) : null;
    addPostVenta({
      clienteId: pvClient.id,
      clienteNombre: pvClient.nombre,
      tipoServicio: pvServicio,
      estado: 'Pendiente',
      tecnicoId: tecObj?.id || null,
      tecnicoNombre: tecObj?.nombre || null,
      descripcion: pvDescripcion,
      costoEstimado: null,
      costoReal: null,
      fechaEjecucion: null,
      observaciones: '',
    });
    addToast({ type: 'success', message: `Post-Venta creado para ${pvClient.nombre}` });
    setPvClient(null);
  };

  // Handle Ticket success
  const handleTicketSuccess = () => {
    addToast({ type: 'success', message: `Ticket creado para ${ticketClient?.nombre || 'cliente'}` });
    setTicketClient(null);
  };

  const activeTecnicos = useMemo(() => tecnicos.filter(t => t.estado === 'Activo'), [tecnicos]);

  return (
    <div className="p-6 px-8 h-full flex flex-col animate-fade">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-[26px] font-bold tracking-tight text-text-primary">Clientes</h1>
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

        <div className="flex flex-col sm:flex-row gap-3">
          {/* SEARCH & SCOPE */}
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-[320px]">
              <Input
                placeholder="Buscar..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                icon={Search}
                className="w-full"
              />
            </div>

            <div className="relative">
              <Button
                variant={showSearchScope ? 'primary' : 'outline'}
                onClick={() => setShowSearchScope(!showSearchScope)}
                className="h-full px-3"
                title="Seleccionar campos de búsqueda"
                icon={Filter}
              >
                <span className="sr-only sm:not-sr-only">Filtros</span>
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
          <div className="relative hidden sm:block">
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
                  {defaultColumns.map(col => {
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
                          visible: defaultColumns.filter(c => c.id !== 'actions').map(c => c.accessorKey || c.id)
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
      <ClientesTable
        data={filteredData}
        columns={visibleColumns}
        pagination={pagination}
        setPagination={setPagination}
      />

      {/* ====== MODAL: Crear Ticket desde Cliente ====== */}
      {ticketClient && (
        <TicketCreateModal
          onClose={() => setTicketClient(null)}
          onSuccess={handleTicketSuccess}
          initialData={{
            clienteId: ticketClient.id,
            clienteNombre: ticketClient.nombre,
          }}
        />
      )}

      {/* ====== MODAL: Crear Post-Venta desde Cliente ====== */}
      {pvClient && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border rounded-2xl w-full max-w-[440px] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-accent-purple/10 p-5 flex items-center gap-3 border-b border-accent-purple/20">
              <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
                <ShoppingBag size={18} className="text-accent-purple" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-text-primary">Nuevo Servicio Post-Venta</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <User size={11} className="text-text-muted" />
                  <span className="text-[11px] text-text-muted">{pvClient.nombre}</span>
                  <span className="text-[10px] text-text-muted font-mono">({pvClient.id})</span>
                </div>
              </div>
              <button
                onClick={() => setPvClient(null)}
                className="p-1.5 rounded-lg hover:bg-accent-purple/20 text-text-muted hover:text-accent-purple transition-colors cursor-pointer bg-transparent border-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Tipo de Servicio *</label>
                <select
                  value={pvServicio}
                  onChange={e => setPvServicio(e.target.value)}
                  className="w-full py-2.5 px-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-purple cursor-pointer"
                >
                  <option value="">— Seleccionar —</option>
                  {TIPO_SERVICIO_PV.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Técnico Asignado</label>
                <select
                  value={pvTecnico}
                  onChange={e => setPvTecnico(e.target.value)}
                  className="w-full py-2.5 px-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-purple cursor-pointer"
                >
                  <option value="">— Sin asignar —</option>
                  {activeTecnicos.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Descripción</label>
                <textarea
                  value={pvDescripcion}
                  onChange={e => setPvDescripcion(e.target.value)}
                  placeholder="Detalles del servicio..."
                  rows={3}
                  className="w-full py-2.5 px-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-purple resize-none placeholder:text-text-muted"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 p-4 border-t border-border">
              <button
                onClick={() => setPvClient(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-bg-secondary border border-border text-sm font-semibold text-text-secondary hover:bg-bg-tertiary transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitPV}
                disabled={!pvServicio}
                className="flex-1 py-2.5 px-4 rounded-xl bg-accent-purple border-none text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingBag size={14} />
                Crear Post-Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
