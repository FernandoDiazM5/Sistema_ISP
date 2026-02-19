import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, ShoppingBag, Tv, Wifi, ArrowUpDown, MapPin, X, Settings, Pencil, Trash2, DollarSign } from 'lucide-react';
import useStore from '../../store/useStore';
import CopyButton from '../common/CopyButton';
import { formatPostVenta } from '../../utils/whatsappFormats';

const ESTADO_COLORS = {
  'Pendiente': { bg: 'bg-accent-yellow/20', text: 'text-accent-yellow', dot: 'bg-accent-yellow' },
  'Aprobada': { bg: 'bg-accent-blue/20', text: 'text-accent-blue', dot: 'bg-accent-blue' },
  'En Ejecución': { bg: 'bg-accent-purple/20', text: 'text-accent-purple', dot: 'bg-accent-purple' },
  'Reprogramada': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  'Ejecutada': { bg: 'bg-accent-green/20', text: 'text-accent-green', dot: 'bg-accent-green' },
  'Rechazada': { bg: 'bg-accent-red/20', text: 'text-accent-red', dot: 'bg-accent-red' },
};

const SERVICIO_ICON = {
  'Punto Adicional CATV': <Tv size={14} />,
  'Punto Adicional Red': <Wifi size={14} />,
  'Traslado de Servicio': <MapPin size={14} />,
  'Configuración IPTV': <Tv size={14} />,
  'Repetidor WiFi': <Wifi size={14} />,
  'Cambio de Plan': <ArrowUpDown size={14} />,
  'Reconexión': <ShoppingBag size={14} />,
};

const FILTER_TABS = [
  { key: 'Todas', label: 'Todas' },
  { key: 'Punto CATV', label: 'Punto CATV', match: 'Punto Adicional CATV' },
  { key: 'Config IPTV', label: 'Config IPTV', match: 'Configuración IPTV' },
  { key: 'Repetidor WiFi', label: 'Repetidor WiFi', match: 'Repetidor WiFi' },
  { key: 'Cambio Plan', label: 'Cambio Plan', match: 'Cambio de Plan' },
  { key: 'Reubicación', label: 'Reubicación', match: 'Traslado de Servicio' },
];

export default function PostVentaPage() {
  const postVenta = useStore(s => s.postVenta);
  const addPostVenta = useStore(s => s.addPostVenta);
  const updatePostVenta = useStore(s => s.updatePostVenta);
  const clients = useStore(s => s.clients);
  const tecnicos = useStore(s => s.tecnicos);
  const catalogoServicios = useStore(s => s.catalogoServicios);
  const addServicioCatalogo = useStore(s => s.addServicioCatalogo);
  const updateServicioCatalogo = useStore(s => s.updateServicioCatalogo);
  const deleteServicioCatalogo = useStore(s => s.deleteServicioCatalogo);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Todas');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedPV, setSelectedPV] = useState(null);

  useEffect(() => {
    if (selectedPV) {
      const updated = postVenta.find(a => a.id === selectedPV.id);
      if (updated && updated !== selectedPV) {
        setSelectedPV(updated);
      }
    }
  }, [postVenta, selectedPV]);

  // --- New request form state ---
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [formServicio, setFormServicio] = useState('');
  const [formTecnico, setFormTecnico] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formObservaciones, setFormObservaciones] = useState('');

  // --- Detail modal state ---
  const [detailCostoReal, setDetailCostoReal] = useState('');
  const [detailMateriales, setDetailMateriales] = useState([]);

  // --- Catalog Management ---
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogForm, setCatalogForm] = useState({ nombre: '', tipo: 'Presencial', precio: '', descripcion: '', costoManoObra: '', materiales: [] });
  const [editingCatalogId, setEditingCatalogId] = useState(null);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialUnit, setNewMaterialUnit] = useState('unidad');
  const [newMaterialPrice, setNewMaterialPrice] = useState('');

  // ===================== COMPUTED =====================

  const stats = useMemo(() => ({
    total: postVenta.length,
    pendientes: postVenta.filter(p => p.estado === 'Pendiente').length,
    enEjecucion: postVenta.filter(p => p.estado === 'En Ejecución').length,
    ejecutadas: postVenta.filter(p => p.estado === 'Ejecutada').length,
  }), [postVenta]);

  const filtered = useMemo(() => {
    return postVenta.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !search || p.clienteNombre.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);

      const currentTab = FILTER_TABS.find(t => t.key === activeTab);
      const matchTab = activeTab === 'Todas' || p.tipoServicio === currentTab?.match;

      return matchSearch && matchTab;
    });
  }, [postVenta, search, activeTab]);

  const filteredClients = useMemo(() => {
    if (!clientSearch || clientSearch.length < 2) return [];
    const q = clientSearch.toLowerCase();
    return clients.filter(c =>
      c.nombre.toLowerCase().includes(q) || c.id.includes(q)
    ).slice(0, 8);
  }, [clients, clientSearch]);

  const selectedServicioCatalog = useMemo(() => {
    return catalogoServicios.find(s => s.id === formServicio);
  }, [catalogoServicios, formServicio]);

  const activeTecnicos = useMemo(() => {
    return tecnicos.filter(t => t.estado === 'Activo');
  }, [tecnicos]);

  // ===================== HANDLERS =====================

  const resetNewForm = () => {
    setClientSearch('');
    setSelectedClient(null);
    setShowClientDropdown(false);
    setFormServicio('');
    setFormTecnico('');
    setFormDescripcion('');
    setFormObservaciones('');
  };

  const openNewModal = () => {
    resetNewForm();
    setShowNewModal(true);
  };

  const closeNewModal = () => {
    setShowNewModal(false);
    resetNewForm();
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setClientSearch(client.nombre);
    setShowClientDropdown(false);
  };

  const handleSubmitNew = (e) => {
    e.preventDefault();
    if (!selectedClient || !formServicio) return;

    const servicio = catalogoServicios.find(s => s.id === formServicio);
    if (!servicio) return;

    const tecnicoObj = formTecnico ? tecnicos.find(t => t.id === formTecnico) : null;

    addPostVenta({
      clienteId: selectedClient.id,
      clienteNombre: selectedClient.nombre,
      tipoServicio: servicio.nombre,
      estado: 'Pendiente',
      tecnicoId: tecnicoObj?.id || null,
      tecnicoNombre: tecnicoObj?.nombre || null,
      descripcion: formDescripcion,
      costoEstimado: servicio.precio,
      costoReal: null,
      fechaEjecucion: null,
      observaciones: formObservaciones,
    });

    closeNewModal();
  };

  const openDetail = (pv) => {
    setSelectedPV(pv);
    setDetailCostoReal(pv.costoReal != null ? String(pv.costoReal) : '');
  };

  const closeDetail = () => {
    setSelectedPV(null);
    setDetailCostoReal('');
  };

  const handleStatusChange = (newEstado) => {
    if (!selectedPV) return;

    const updates = { estado: newEstado, _historyComment: `Cambio de estado a ${newEstado}` };

    if (newEstado === 'Ejecutada') {
      updates.fechaEjecucion = new Date().toISOString().split('T')[0];
      const parsedCosto = parseFloat(detailCostoReal);
      if (!isNaN(parsedCosto)) {
        updates.costoReal = parsedCosto;
      } else {
        updates.costoReal = selectedPV.costoEstimado;
      }
      if (detailMateriales.length > 0) {
        updates.materialesUsados = detailMateriales;
        updates.costoMateriales = detailMateriales.reduce((sum, m) => sum + (m.cantidad * m.precioUnitario), 0);
      }
      updates._historyComment = 'Servicio ejecutado con registro de costos';
    }

    updatePostVenta(selectedPV.id, updates);
    setSelectedPV({ ...selectedPV, ...updates });
  };

  const getNextEstado = (current) => {
    const flow = {
      'Pendiente': 'Aprobada',
      'Aprobada': 'En Ejecución',
      'En Ejecución': 'Ejecutada',
      'Reprogramada': 'En Ejecución',
    };
    return flow[current] || null;
  };

  const getNextEstadoLabel = (current) => {
    const labels = {
      'Pendiente': 'Aprobar Solicitud',
      'Aprobada': 'Iniciar Ejecución',
      'En Ejecución': 'Marcar Ejecutada',
      'Reprogramada': 'Retomar Ejecución',
    };
    return labels[current] || null;
  };

  const getNextEstadoButtonStyle = (current) => {
    const styles = {
      'Pendiente': 'bg-accent-blue/20 text-accent-blue',
      'Aprobada': 'bg-accent-purple/20 text-accent-purple',
      'En Ejecución': 'bg-accent-green/20 text-accent-green',
      'Reprogramada': 'bg-accent-purple/20 text-accent-purple',
    };
    return styles[current] || '';
  };

  // --- Catalog Handlers ---
  const handleAddMaterialToCatalog = () => {
    if (!newMaterialName || !newMaterialPrice) return;
    setCatalogForm(prev => ({
      ...prev,
      materiales: [...prev.materiales, { nombre: newMaterialName, unidad: newMaterialUnit, precioUnitario: parseFloat(newMaterialPrice) || 0 }]
    }));
    setNewMaterialName('');
    setNewMaterialUnit('unidad');
    setNewMaterialPrice('');
  };

  const handleSaveCatalogItem = () => {
    const item = {
      nombre: catalogForm.nombre,
      tipo: catalogForm.tipo,
      precio: parseFloat(catalogForm.precio) || 0,
      descripcion: catalogForm.descripcion,
      costoManoObra: parseFloat(catalogForm.costoManoObra) || 0,
      materiales: catalogForm.materiales,
    };
    if (editingCatalogId) {
      updateServicioCatalogo(editingCatalogId, item);
    } else {
      addServicioCatalogo(item);
    }
    setCatalogForm({ nombre: '', tipo: 'Presencial', precio: '', descripcion: '', costoManoObra: '', materiales: [] });
    setEditingCatalogId(null);
  };

  const handleEditCatalogItem = (srv) => {
    setCatalogForm({
      nombre: srv.nombre,
      tipo: srv.tipo,
      precio: String(srv.precio || 0),
      descripcion: srv.descripcion || '',
      costoManoObra: String(srv.costoManoObra || 0),
      materiales: srv.materiales || [],
    });
    setEditingCatalogId(srv.id);
  };

  // ===================== RENDER =====================

  return (
    <div className="animate-fade p-4 sm:p-6 sm:px-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-[26px] font-bold tracking-tight">Post-Venta</h1>
          <p className="text-text-secondary text-sm mt-1">
            Servicios adicionales para clientes existentes
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowCatalog(true)}
            className="w-full sm:w-auto justify-center py-2.5 px-4 rounded-xl bg-bg-secondary border border-border text-text-secondary text-sm font-semibold cursor-pointer flex items-center gap-2 hover:border-accent-purple/50 transition-colors"
          >
            <Settings size={16} /> Catálogo
          </button>
          <button
            onClick={openNewModal}
            className="w-full sm:w-auto justify-center py-2.5 px-4 rounded-xl bg-accent-purple border-none text-white text-sm font-semibold cursor-pointer flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Nueva Solicitud
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-blue/15 text-accent-blue">
            <ShoppingBag size={16} />
          </div>
          <div>
            <p className="text-lg font-bold font-mono">{stats.total}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wide">Total Solicitudes</p>
          </div>
        </div>
        <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-yellow/15 text-accent-yellow">
            <ShoppingBag size={16} />
          </div>
          <div>
            <p className="text-lg font-bold font-mono">{stats.pendientes}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wide">Pendientes</p>
          </div>
        </div>
        <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-purple/15 text-accent-purple">
            <ShoppingBag size={16} />
          </div>
          <div>
            <p className="text-lg font-bold font-mono">{stats.enEjecucion}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wide">En Ejecucion</p>
          </div>
        </div>
        <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-green/15 text-accent-green">
            <ShoppingBag size={16} />
          </div>
          <div>
            <p className="text-lg font-bold font-mono">{stats.ejecutadas}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wide">Ejecutadas</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-2 flex-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-1.5 px-4 rounded-lg text-xs font-semibold border cursor-pointer transition-colors
                ${activeTab === tab.key
                  ? 'bg-accent-purple/20 border-accent-purple text-accent-purple'
                  : 'bg-bg-secondary border-border text-text-secondary hover:border-accent-purple/50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-[260px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            placeholder="Buscar por cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-purple placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* Request Cards */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="bg-bg-card rounded-xl p-8 border border-border text-center">
            <p className="text-text-muted text-sm">No se encontraron solicitudes</p>
          </div>
        )}
        {filtered.map(pv => {
          const ec = ESTADO_COLORS[pv.estado] || ESTADO_COLORS['Pendiente'];
          const icon = SERVICIO_ICON[pv.tipoServicio] || <ShoppingBag size={14} />;
          return (
            <div
              key={pv.id}
              onClick={() => openDetail(pv)}
              className="bg-bg-card rounded-xl p-4 border border-border cursor-pointer transition-all hover:border-accent-purple/40 hover:bg-bg-card-hover"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-purple/15 text-accent-purple">
                    {icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-text-muted">{pv.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${ec.bg} ${ec.text}`}>
                        {pv.estado}
                      </span>
                    </div>
                    <p className="text-sm font-semibold mt-0.5">{pv.clienteNombre}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton getTextFn={() => formatPostVenta(pv, clients.find(c => c.id === pv.clienteId))} />
                  <span className="text-[11px] text-text-muted">{pv.fecha}</span>
                </div>
              </div>

              <p className="text-xs text-text-secondary mb-2 line-clamp-1">{pv.descripcion}</p>

              <div className="flex items-center gap-5 text-[11px] text-text-muted">
                <span>
                  Servicio: <span className="text-text-secondary font-medium">{pv.tipoServicio}</span>
                </span>
                <span>
                  Costo: <span className="text-accent-green font-bold">
                    {pv.costoEstimado > 0 ? `S/ ${pv.costoEstimado.toFixed(2)}` : 'Gratis'}
                  </span>
                </span>
                {pv.tecnicoNombre && (
                  <span>
                    Tecnico: <span className="text-text-secondary">{pv.tecnicoNombre}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ===================== MODAL: Nueva Solicitud ===================== */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeNewModal}>
          <div
            className="bg-bg-card rounded-2xl p-4 sm:p-6 w-full max-w-[540px] mx-4 border border-border max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold">Nueva Solicitud Post-Venta</h3>
              <button
                onClick={closeNewModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-secondary border border-border text-text-muted cursor-pointer hover:text-text-primary transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="flex flex-col gap-4">
              {/* Client Autocomplete */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block font-medium">Cliente</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Buscar cliente por nombre o ID..."
                    value={clientSearch}
                    onChange={e => {
                      setClientSearch(e.target.value);
                      setShowClientDropdown(true);
                      if (!e.target.value) setSelectedClient(null);
                    }}
                    onFocus={() => { if (clientSearch.length >= 2) setShowClientDropdown(true); }}
                    className="w-full pl-9 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-purple placeholder:text-text-muted"
                  />
                  {selectedClient && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClient(null);
                        setClientSearch('');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center bg-bg-secondary text-text-muted cursor-pointer border-none hover:text-text-primary"
                    >
                      <X size={12} />
                    </button>
                  )}
                  {showClientDropdown && filteredClients.length > 0 && !selectedClient && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-lg shadow-xl z-10 max-h-[200px] overflow-y-auto">
                      {filteredClients.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleClientSelect(c)}
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-bg-secondary cursor-pointer border-none bg-transparent text-text-primary transition-colors flex items-center gap-2"
                        >
                          <span className="font-mono text-[11px] text-text-muted">{c.id}</span>
                          <span className="truncate">{c.nombre}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedClient && (
                  <p className="text-[11px] text-accent-green mt-1">
                    Seleccionado: {selectedClient.id} - {selectedClient.nombre}
                  </p>
                )}
              </div>

              {/* Tipo de Servicio */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block font-medium">Tipo de Servicio</label>
                <select
                  value={formServicio}
                  onChange={e => setFormServicio(e.target.value)}
                  required
                  className="w-full py-2.5 px-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-purple cursor-pointer"
                >
                  <option value="">Seleccionar servicio...</option>
                  {catalogoServicios.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} {s.precio > 0 ? `- S/ ${s.precio.toFixed(2)}` : '- Gratis'} ({s.tipo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto-fill price info */}
              {selectedServicioCatalog && (
                <div className="bg-bg-secondary rounded-lg p-3 border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-text-muted">Precio del servicio</p>
                      <p className="text-sm font-bold text-accent-green mt-0.5">
                        {selectedServicioCatalog.precio > 0
                          ? `S/ ${selectedServicioCatalog.precio.toFixed(2)}`
                          : 'Gratis'
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-muted">Tipo de atencion</p>
                      <p className={`text-xs font-semibold mt-0.5 ${selectedServicioCatalog.tipo === 'Presencial'
                        ? 'text-accent-purple'
                        : 'text-accent-blue'
                        }`}>
                        {selectedServicioCatalog.tipo}
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-text-muted mt-2">{selectedServicioCatalog.descripcion}</p>
                </div>
              )}

              {/* Tecnico (only required for Presencial) */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block font-medium">
                  Tecnico Asignado
                  {selectedServicioCatalog?.tipo === 'Presencial' && (
                    <span className="text-accent-red ml-1">*</span>
                  )}
                  {selectedServicioCatalog?.tipo === 'Remoto' && (
                    <span className="text-text-muted ml-1">(opcional)</span>
                  )}
                </label>
                <select
                  value={formTecnico}
                  onChange={e => setFormTecnico(e.target.value)}
                  required={selectedServicioCatalog?.tipo === 'Presencial'}
                  className="w-full py-2.5 px-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-purple cursor-pointer"
                >
                  <option value="">Seleccionar tecnico...</option>
                  {activeTecnicos.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} - {t.especialidad} ({t.zona})
                    </option>
                  ))}
                </select>
              </div>

              {/* Descripcion */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block font-medium">Descripcion</label>
                <textarea
                  value={formDescripcion}
                  onChange={e => setFormDescripcion(e.target.value)}
                  placeholder="Describa el servicio solicitado..."
                  required
                  className="w-full bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[80px] resize-y outline-none focus:border-accent-purple placeholder:text-text-muted"
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block font-medium">Observaciones</label>
                <textarea
                  value={formObservaciones}
                  onChange={e => setFormObservaciones(e.target.value)}
                  placeholder="Observaciones adicionales (opcional)..."
                  className="w-full bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[60px] resize-y outline-none focus:border-accent-purple placeholder:text-text-muted"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={closeNewModal}
                  className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm hover:bg-bg-secondary/80 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedClient || !formServicio}
                  className="flex-1 py-2.5 rounded-lg bg-accent-purple border-none text-white cursor-pointer text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Crear Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: Detalle Solicitud ===================== */}
      {selectedPV && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeDetail}>
          <div
            className="bg-bg-card rounded-2xl p-6 w-[580px] border border-border max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-5">
              <div>
                <span className="font-mono text-sm text-text-muted">{selectedPV.id}</span>
                <h3 className="text-lg font-bold mt-1">{selectedPV.clienteNombre}</h3>
              </div>
              <div className="flex items-center gap-2">
                <CopyButton getTextFn={() => formatPostVenta(selectedPV, clients.find(c => c.id === selectedPV.clienteId))} size="md" />
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${ESTADO_COLORS[selectedPV.estado]?.bg} ${ESTADO_COLORS[selectedPV.estado]?.text}`}>
                  {selectedPV.estado}
                </span>
                <button
                  onClick={closeDetail}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-secondary border border-border text-text-muted cursor-pointer hover:text-text-primary transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[11px] text-text-muted mb-0.5">Tipo de Servicio</p>
                <p className="text-sm font-medium">{selectedPV.tipoServicio}</p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[11px] text-text-muted mb-0.5">Cliente ID</p>
                <p className="text-sm font-medium font-mono">{selectedPV.clienteId}</p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[11px] text-text-muted mb-0.5">Fecha Solicitud</p>
                <p className="text-sm font-medium">{selectedPV.fecha}</p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[11px] text-text-muted mb-0.5">Fecha Ejecucion</p>
                <p className="text-sm font-medium">{selectedPV.fechaEjecucion || '---'}</p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[11px] text-text-muted mb-0.5">Tecnico Asignado</p>
                <p className="text-sm font-medium">{selectedPV.tecnicoNombre || 'Sin asignar'}</p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[11px] text-text-muted mb-0.5">Tecnico ID</p>
                <p className="text-sm font-medium font-mono">{selectedPV.tecnicoId || '---'}</p>
              </div>
            </div>

            {/* Descripcion */}
            <div className="bg-bg-secondary rounded-lg p-3 mb-4">
              <p className="text-[11px] text-text-muted mb-1">Descripcion</p>
              <p className="text-sm text-text-primary">{selectedPV.descripcion || 'Sin descripcion'}</p>
            </div>

            {/* Observaciones */}
            {selectedPV.observaciones && (
              <div className="bg-bg-secondary rounded-lg p-3 mb-4">
                <p className="text-[11px] text-text-muted mb-1">Observaciones</p>
                <p className="text-sm text-text-primary">{selectedPV.observaciones}</p>
              </div>
            )}

            {/* Cost Comparison */}
            <div className="bg-bg-secondary rounded-lg p-4 mb-5 border border-border">
              <p className="text-xs text-text-muted mb-3 font-medium uppercase tracking-wide">Comparacion de Costos</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-text-muted mb-0.5">Costo Estimado</p>
                  <p className="text-xl font-bold font-mono text-accent-blue">
                    {selectedPV.costoEstimado > 0 ? `S/ ${selectedPV.costoEstimado.toFixed(2)}` : 'Gratis'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-text-muted mb-0.5">Costo Real</p>
                  {selectedPV.costoReal != null ? (
                    <p className={`text-xl font-bold font-mono ${selectedPV.costoReal > selectedPV.costoEstimado
                      ? 'text-accent-red'
                      : 'text-accent-green'
                      }`}>
                      S/ {selectedPV.costoReal.toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-xl font-bold font-mono text-text-muted">---</p>
                  )}
                </div>
              </div>
              {selectedPV.costoReal != null && selectedPV.costoEstimado > 0 && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-[11px] text-text-muted">
                    Diferencia:{' '}
                    <span className={`font-bold ${selectedPV.costoReal - selectedPV.costoEstimado > 0
                      ? 'text-accent-red'
                      : selectedPV.costoReal - selectedPV.costoEstimado < 0
                        ? 'text-accent-green'
                        : 'text-text-secondary'
                      }`}>
                      {selectedPV.costoReal - selectedPV.costoEstimado > 0 ? '+' : ''}
                      S/ {(selectedPV.costoReal - selectedPV.costoEstimado).toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Costo Real input for En Ejecucion state */}
            {selectedPV.estado === 'En Ejecución' && (
              <div className="mb-4">
                <label className="text-xs text-text-muted mb-1.5 block font-medium">
                  Costo Real (S/) - se registra al marcar Ejecutada
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={detailCostoReal}
                  onChange={e => setDetailCostoReal(e.target.value)}
                  placeholder={`Estimado: ${selectedPV.costoEstimado}`}
                  className="w-full py-2.5 px-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-purple placeholder:text-text-muted"
                />
              </div>
            )}

            {/* Status Change Buttons */}
            <div className="flex gap-2">
              {getNextEstado(selectedPV.estado) && (
                <button
                  onClick={() => handleStatusChange(getNextEstado(selectedPV.estado))}
                  className={`flex-1 py-2.5 rounded-lg border-none text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80 ${getNextEstadoButtonStyle(selectedPV.estado)}`}
                >
                  {getNextEstadoLabel(selectedPV.estado)}
                </button>
              )}
              {selectedPV.estado === 'Pendiente' && (
                <button
                  onClick={() => handleStatusChange('Rechazada')}
                  className="flex-1 py-2.5 rounded-lg bg-accent-red/20 text-accent-red border-none text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
                >
                  Rechazar
                </button>
              )}
              {selectedPV.estado === 'En Ejecución' && (
                <button
                  onClick={() => handleStatusChange('Reprogramada')}
                  className="py-2.5 px-4 rounded-lg bg-cyan-500/20 text-cyan-400 border-none text-xs font-semibold cursor-pointer hover:bg-cyan-500/30 transition-colors"
                >
                  Reprogramar
                </button>
              )}
              <button
                onClick={closeDetail}
                className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary text-xs cursor-pointer hover:bg-bg-secondary/80 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: Catálogo de Servicios ===================== */}
      {showCatalog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCatalog(false)}>
          <div
            className="bg-bg-card rounded-2xl p-4 sm:p-6 w-full max-w-[700px] mx-4 border border-border max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-bold">Catálogo de Servicios</h3>
                <p className="text-xs text-text-muted mt-0.5">Gestiona los servicios post-venta disponibles</p>
              </div>
              <button
                onClick={() => setShowCatalog(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-secondary border border-border text-text-muted cursor-pointer hover:text-text-primary transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Existing Services */}
            <div className="flex flex-col gap-2 mb-5">
              {catalogoServicios.map(srv => (
                <div key={srv.id} className="bg-bg-secondary rounded-lg p-3 border border-border flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-text-muted">{srv.id}</span>
                      <span className="text-sm font-semibold">{srv.nombre}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${srv.tipo === 'Presencial' ? 'bg-accent-purple/20 text-accent-purple' : 'bg-accent-blue/20 text-accent-blue'}`}>
                        {srv.tipo}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-accent-green font-bold">
                        {srv.precio > 0 ? `S/ ${srv.precio.toFixed(2)}` : 'Gratis'}
                      </span>
                      {srv.costoManoObra > 0 && (
                        <span className="text-[10px] text-text-muted">Mano de obra: S/ {srv.costoManoObra.toFixed(2)}</span>
                      )}
                      {srv.materiales && srv.materiales.length > 0 && (
                        <span className="text-[10px] text-text-muted">{srv.materiales.length} material(es)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditCatalogItem(srv)}
                      className="w-7 h-7 rounded flex items-center justify-center bg-accent-blue/15 text-accent-blue border-none cursor-pointer hover:bg-accent-blue/25 transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => deleteServicioCatalogo(srv.id)}
                      className="w-7 h-7 rounded flex items-center justify-center bg-accent-red/15 text-accent-red border-none cursor-pointer hover:bg-accent-red/25 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add/Edit Form */}
            <div className="bg-bg-secondary rounded-lg p-4 border border-border">
              <p className="text-xs font-semibold text-text-secondary mb-3">
                {editingCatalogId ? 'Editar Servicio' : 'Agregar Servicio'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] text-text-muted block mb-1">Nombre</label>
                  <input
                    value={catalogForm.nombre}
                    onChange={e => setCatalogForm(p => ({ ...p, nombre: e.target.value }))}
                    placeholder="Nombre del servicio"
                    className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-xs text-text-primary outline-none focus:border-accent-purple placeholder:text-text-muted"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted block mb-1">Tipo</label>
                  <select
                    value={catalogForm.tipo}
                    onChange={e => setCatalogForm(p => ({ ...p, tipo: e.target.value }))}
                    className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-xs text-text-primary outline-none focus:border-accent-purple cursor-pointer"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Remoto">Remoto</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-text-muted block mb-1">Precio Total (S/)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={catalogForm.precio}
                    onChange={e => setCatalogForm(p => ({ ...p, precio: e.target.value }))}
                    placeholder="0.00"
                    className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-xs text-text-primary outline-none focus:border-accent-purple placeholder:text-text-muted"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted block mb-1">Costo Mano de Obra (S/)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={catalogForm.costoManoObra}
                    onChange={e => setCatalogForm(p => ({ ...p, costoManoObra: e.target.value }))}
                    placeholder="0.00"
                    className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-xs text-text-primary outline-none focus:border-accent-purple placeholder:text-text-muted"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-[10px] text-text-muted block mb-1">Descripción</label>
                <input
                  value={catalogForm.descripcion}
                  onChange={e => setCatalogForm(p => ({ ...p, descripcion: e.target.value }))}
                  placeholder="Descripción del servicio"
                  className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-xs text-text-primary outline-none focus:border-accent-purple placeholder:text-text-muted"
                />
              </div>

              {/* Materials */}
              <div className="mb-3">
                <p className="text-[10px] text-text-muted mb-1.5 flex items-center gap-1">
                  <DollarSign size={10} /> Materiales del servicio
                </p>
                {catalogForm.materiales.length > 0 && (
                  <div className="flex flex-col gap-1 mb-2">
                    {catalogForm.materiales.map((m, i) => (
                      <div key={i} className="flex items-center justify-between bg-bg-card rounded px-2 py-1.5 text-[11px]">
                        <span>{m.nombre} ({m.unidad})</span>
                        <div className="flex items-center gap-2">
                          <span className="text-accent-green font-bold">S/ {m.precioUnitario.toFixed(2)}</span>
                          <button
                            onClick={() => setCatalogForm(p => ({ ...p, materiales: p.materiales.filter((_, idx) => idx !== i) }))}
                            className="text-accent-red cursor-pointer border-none bg-transparent hover:opacity-70"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={newMaterialName}
                    onChange={e => setNewMaterialName(e.target.value)}
                    placeholder="Material"
                    className="flex-1 py-1.5 px-2 bg-bg-card border border-border rounded text-[11px] text-text-primary outline-none focus:border-accent-purple placeholder:text-text-muted"
                  />
                  <select
                    value={newMaterialUnit}
                    onChange={e => setNewMaterialUnit(e.target.value)}
                    className="py-1.5 px-2 bg-bg-card border border-border rounded text-[11px] text-text-primary outline-none cursor-pointer"
                  >
                    <option value="unidad">unidad</option>
                    <option value="metro">metro</option>
                    <option value="rollo">rollo</option>
                    <option value="pieza">pieza</option>
                  </select>
                  <input
                    type="number" step="0.01" min="0"
                    value={newMaterialPrice}
                    onChange={e => setNewMaterialPrice(e.target.value)}
                    placeholder="S/"
                    className="w-20 py-1.5 px-2 bg-bg-card border border-border rounded text-[11px] text-text-primary outline-none focus:border-accent-purple placeholder:text-text-muted"
                  />
                  <button
                    type="button"
                    onClick={handleAddMaterialToCatalog}
                    className="py-1.5 px-3 rounded bg-accent-green/20 text-accent-green border-none text-[11px] font-semibold cursor-pointer hover:bg-accent-green/30 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveCatalogItem}
                  disabled={!catalogForm.nombre}
                  className="flex-1 py-2 rounded-lg bg-accent-purple/20 text-accent-purple border-none text-xs font-semibold cursor-pointer hover:bg-accent-purple/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editingCatalogId ? 'Guardar Cambios' : 'Agregar Servicio'}
                </button>
                {editingCatalogId && (
                  <button
                    onClick={() => {
                      setCatalogForm({ nombre: '', tipo: 'Presencial', precio: '', descripcion: '', costoManoObra: '', materiales: [] });
                      setEditingCatalogId(null);
                    }}
                    className="py-2 px-4 rounded-lg bg-bg-card border border-border text-text-muted text-xs cursor-pointer hover:text-text-primary"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
