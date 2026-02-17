import { useState, useMemo } from 'react';
import { Plus, Search, Cable, Wifi, MapPin, AlertTriangle, CheckCircle2, Clock, Wrench, X } from 'lucide-react';
import useStore from '../../store/useStore';
import Adjuntos, { AdjuntosCount } from '../common/Adjuntos';
import ResolutionModal from '../common/ResolutionModal';

const ESTADO_STYLE = {
  'Pendiente': { bg: 'bg-accent-yellow/20', text: 'text-accent-yellow', dot: 'bg-accent-yellow' },
  'En progreso': { bg: 'bg-accent-blue/20', text: 'text-accent-blue', dot: 'bg-accent-blue' },
  'Reprogramada': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  'Completada': { bg: 'bg-accent-green/20', text: 'text-accent-green', dot: 'bg-accent-green' },
  'Cancelada': { bg: 'bg-text-muted/20', text: 'text-text-muted', dot: 'bg-text-muted' },
};

const PRIORIDAD_STYLE = {
  'Crítica': 'text-accent-red font-bold',
  'Alta': 'text-accent-red',
  'Media': 'text-accent-yellow',
  'Baja': 'text-accent-green',
};

const TIPOS_DERIVACION = [
  'Tendido de fibra',
  'Reparación de poste',
  'AP Saturado',
  'Corte de fibra',
  'Atenuación excesiva',
  'Mantenimiento NAP',
  'Extensión de red',
];

const FIBRA_TIPOS = ['Tendido de fibra', 'Corte de fibra', 'Atenuación excesiva', 'Mantenimiento NAP', 'Extensión de red'];
const RADIO_TIPOS = ['AP Saturado'];

function getTipoCategoria(tipo) {
  if (FIBRA_TIPOS.includes(tipo)) return 'fibra';
  if (RADIO_TIPOS.includes(tipo)) return 'radio';
  return 'otro';
}

export default function PlantaExternaPage() {
  const derivaciones = useStore(s => s.derivaciones);
  const addDerivacion = useStore(s => s.addDerivacion);
  const updateDerivacion = useStore(s => s.updateDerivacion);
  const tecnicos = useStore(s => s.tecnicos);
  const instalaciones = useStore(s => s.instalaciones);
  const updateTicket = useStore(s => s.updateTicket);

  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterZona, setFilterZona] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterPrioridad, setFilterPrioridad] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedDerivacion, setSelectedDerivacion] = useState(null);
  const [formInstSearch, setFormInstSearch] = useState('');
  const [showFormInstDropdown, setShowFormInstDropdown] = useState(false);
  const [formInstalacionId, setFormInstalacionId] = useState('');
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [completionData, setCompletionData] = useState({
    metricaAntes: '',
    metricaDespues: '',
    observaciones: '',
  });
  const [formAdjuntos, setFormAdjuntos] = useState([]);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionTarget, setResolutionTarget] = useState(null);

  const zonas = useMemo(() => {
    const z = new Set(derivaciones.map(d => d.zona));
    return Array.from(z).sort();
  }, [derivaciones]);

  const stats = useMemo(() => ({
    total: derivaciones.length,
    enProgreso: derivaciones.filter(d => d.estado === 'En progreso').length,
    completadas: derivaciones.filter(d => d.estado === 'Completada').length,
    pendientes: derivaciones.filter(d => d.estado === 'Pendiente').length,
  }), [derivaciones]);

  const filteredInstalaciones = useMemo(() => {
    if (!formInstSearch || formInstSearch.length < 2) return [];
    const q = formInstSearch.toLowerCase();
    return instalaciones.filter(i =>
      i.id.toLowerCase().includes(q) ||
      (i.clienteNombre && i.clienteNombre.toLowerCase().includes(q)) ||
      (i.prospectoNombre && i.prospectoNombre.toLowerCase().includes(q)) ||
      (i.zona && i.zona.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [instalaciones, formInstSearch]);

  const filtered = useMemo(() => {
    return derivaciones.filter(d => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        d.id.toLowerCase().includes(q) ||
        d.tipo.toLowerCase().includes(q) ||
        d.zona.toLowerCase().includes(q) ||
        d.direccion.toLowerCase().includes(q) ||
        d.tecnicoNombre.toLowerCase().includes(q) ||
        (d.material && d.material.toLowerCase().includes(q));

      let matchTipo = true;
      if (filterTipo === 'radio') matchTipo = getTipoCategoria(d.tipo) === 'radio';
      else if (filterTipo === 'fibra') matchTipo = getTipoCategoria(d.tipo) === 'fibra' || getTipoCategoria(d.tipo) === 'otro';

      const matchZona = filterZona === 'all' || d.zona === filterZona;
      const matchEstado = filterEstado === 'all' || d.estado === filterEstado;
      const matchPrioridad = filterPrioridad === 'all' || d.prioridad === filterPrioridad;

      return matchSearch && matchTipo && matchZona && matchEstado && matchPrioridad;
    });
  }, [derivaciones, search, filterTipo, filterZona, filterEstado, filterPrioridad]);

  const handleNewDerivacion = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const tecnicoId = form.get('tecnicoId');
    const tecnico = tecnicos.find(t => t.id === tecnicoId);
    addDerivacion({
      tipo: form.get('tipo'),
      zona: form.get('zona'),
      direccion: form.get('direccion'),
      tecnicoId: tecnicoId,
      tecnicoNombre: tecnico ? tecnico.nombre : '',
      estado: 'Pendiente',
      prioridad: form.get('prioridad'),
      descripcion: form.get('descripcion'),
      instalacionId: form.get('instalacionId') || null,
      clienteRelacionado: form.get('instalacionId') || null,
      metraje: parseInt(form.get('metraje')) || 0,
      material: form.get('material'),
      adjuntos: formAdjuntos,
    });
    setShowForm(false);
    setFormInstSearch('');
    setShowFormInstDropdown(false);
    setFormInstalacionId('');
    setFormAdjuntos([]);
  };

  const handleStatusChange = (id, nuevoEstado) => {
    if (nuevoEstado === 'Completada') {
      setResolutionTarget({ derivacionId: id, nuevoEstado });
      setShowResolutionModal(true);
    } else {
      const updates = { estado: nuevoEstado, _historyComment: `Cambio de estado manual a ${nuevoEstado}` };
      updateDerivacion(id, updates);
      if (selectedDerivacion && selectedDerivacion.id === id) {
        setSelectedDerivacion({ ...selectedDerivacion, estado: nuevoEstado });
      }
    }
  };

  const handleResolutionConfirm = (resolutionData) => {
    if (!resolutionTarget) return;
    updateDerivacion(resolutionTarget.derivacionId, {
      estado: resolutionTarget.nuevoEstado,
      fechaCompletado: new Date().toISOString().split('T')[0],
      ...resolutionData,
      _historyComment: resolutionData.solucion || 'Derivación completada'
    });
    // Propagate to parent ticket
    const deriv = derivaciones.find(d => d.id === resolutionTarget.derivacionId);
    if (deriv?.ticketId) {
      updateTicket(deriv.ticketId, {
        estado: 'Resuelto',
        _historyComment: `Resuelto desde Planta Externa (${deriv.id})`
      });
    }
    if (deriv && selectedDerivacion) {
      setSelectedDerivacion({ ...deriv, estado: 'Completada', ...resolutionData });
    }
    setShowResolutionModal(false);
    setResolutionTarget(null);
    setShowCompletionForm(false);
  };

  const handleCompletion = () => {
    if (!selectedDerivacion) return;
    updateDerivacion(selectedDerivacion.id, {
      estado: 'Completada',
      fechaCompletado: new Date().toISOString().split('T')[0],
      metricaAntes: completionData.metricaAntes,
      metricaDespues: completionData.metricaDespues,
      observacionesCierre: completionData.observaciones,
    });
    setSelectedDerivacion({
      ...selectedDerivacion,
      estado: 'Completada',
      fechaCompletado: new Date().toISOString().split('T')[0],
      metricaAntes: completionData.metricaAntes,
      metricaDespues: completionData.metricaDespues,
      observacionesCierre: completionData.observaciones,
    });
    setShowCompletionForm(false);
    setCompletionData({ metricaAntes: '', metricaDespues: '', observaciones: '' });
  };

  const getRelatedInstallation = (instalacionId) => {
    if (!instalacionId) return null;
    return instalaciones.find(i => i.id === instalacionId) || null;
  };

  const getTipoIcon = (tipo) => {
    const cat = getTipoCategoria(tipo);
    if (cat === 'radio') return <Wifi size={16} />;
    if (cat === 'fibra') return <Cable size={16} />;
    return <Wrench size={16} />;
  };

  return (
    <div className="animate-fade p-4 sm:p-6 sm:px-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-[26px] font-bold tracking-tight">Planta Externa</h1>
          <p className="text-text-secondary text-sm mt-1">Derivaciones de infraestructura y trabajos de campo</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto justify-center py-2.5 px-4 rounded-xl bg-accent-purple border-none text-white text-sm font-semibold cursor-pointer flex items-center gap-2 hover:opacity-90"
        >
          <Plus size={16} /> Nueva Derivación
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-purple/15 text-accent-purple">
            <Cable size={16} />
          </div>
          <div>
            <p className="text-lg font-bold font-mono">{stats.total}</p>
            <p className="text-[10px] text-text-muted uppercase">Total Derivaciones</p>
          </div>
        </div>
        <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-blue/15 text-accent-blue">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-lg font-bold font-mono">{stats.enProgreso}</p>
            <p className="text-[10px] text-text-muted uppercase">En Progreso</p>
          </div>
        </div>
        <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-green/15 text-accent-green">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-lg font-bold font-mono">{stats.completadas}</p>
            <p className="text-[10px] text-text-muted uppercase">Completadas</p>
          </div>
        </div>
        <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-yellow/15 text-accent-yellow">
            <AlertTriangle size={16} />
          </div>
          <div>
            <p className="text-lg font-bold font-mono">{stats.pendientes}</p>
            <p className="text-[10px] text-text-muted uppercase">Pendientes</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs (by tipo category) */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: 'Todas', icon: <Cable size={14} /> },
          { key: 'radio', label: 'Radio Enlace', icon: <Wifi size={14} /> },
          { key: 'fibra', label: 'Fibra Óptica', icon: <Cable size={14} /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterTipo(tab.key)}
            className={`py-1.5 px-4 rounded-lg text-xs font-semibold border cursor-pointer transition-colors flex items-center gap-1.5
              ${filterTipo === tab.key
                ? 'bg-accent-purple/20 border-accent-purple text-accent-purple'
                : 'bg-bg-secondary border-border text-text-secondary hover:border-accent-purple/50'
              }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Filters Row */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            placeholder="Buscar por ID, tipo, zona, dirección, técnico, material..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9"
          />
        </div>
        <select value={filterZona} onChange={e => setFilterZona(e.target.value)} className="min-w-[140px]">
          <option value="all">Todas las zonas</option>
          {zonas.map(z => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="min-w-[140px]">
          <option value="all">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En progreso">En progreso</option>
          <option value="Completada">Completada</option>
          <option value="Cancelada">Cancelada</option>
        </select>
        <select value={filterPrioridad} onChange={e => setFilterPrioridad(e.target.value)} className="min-w-[120px]">
          <option value="all">Prioridad</option>
          <option value="Crítica">Crítica</option>
          <option value="Alta">Alta</option>
          <option value="Media">Media</option>
          <option value="Baja">Baja</option>
        </select>
      </div>

      {/* Derivation Cards */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="bg-bg-card rounded-xl p-8 border border-border text-center">
            <Cable size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-text-secondary text-sm">No se encontraron derivaciones con los filtros seleccionados.</p>
          </div>
        )}
        {filtered.map(d => {
          const es = ESTADO_STYLE[d.estado] || ESTADO_STYLE['Pendiente'];
          const cat = getTipoCategoria(d.tipo);
          return (
            <div
              key={d.id}
              onClick={() => setSelectedDerivacion(d)}
              className="bg-bg-card rounded-xl p-5 border border-border cursor-pointer transition-all hover:border-accent-purple/40 hover:bg-bg-card-hover"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat === 'radio'
                    ? 'bg-accent-blue/15 text-accent-blue'
                    : cat === 'fibra'
                      ? 'bg-accent-purple/15 text-accent-purple'
                      : 'bg-accent-yellow/15 text-accent-yellow'
                    }`}>
                    {getTipoIcon(d.tipo)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-text-muted">{d.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${es.bg} ${es.text}`}>{d.estado}</span>
                      <span className={`text-[11px] font-semibold ${PRIORIDAD_STYLE[d.prioridad]}`}>{d.prioridad}</span>
                      <span className="text-[11px] text-text-muted bg-bg-secondary px-2 py-0.5 rounded">
                        {cat === 'radio' ? 'Radio Enlace' : cat === 'fibra' ? 'Fibra Óptica' : 'Infraestructura'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold mt-0.5">{d.tipo}</p>
                  </div>
                </div>
                <span className="text-[11px] text-text-muted">{d.fecha}</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-2">
                <MapPin size={12} className="text-text-muted" />
                <span>{d.zona} - {d.direccion}</span>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-text-muted flex-wrap">
                <span>Técnico: <span className="text-text-secondary font-medium">{d.tecnicoNombre}</span></span>
                {d.metraje > 0 && (
                  <span>Metraje: <span className="text-text-secondary font-medium">{d.metraje}m</span></span>
                )}
                {d.material && (
                  <span>Material: <span className="text-text-secondary font-medium">{d.material}</span></span>
                )}
                {d.instalacionId && (
                  <span>Instalación: <span className="text-accent-cyan font-medium">{d.instalacionId}</span></span>
                )}
                <AdjuntosCount count={d.adjuntos?.length} />
              </div>

              {d.estado !== 'Completada' && d.estado !== 'Cancelada' && (
                <div className="flex gap-2 mt-3">
                  {d.estado === 'Pendiente' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(d.id, 'En progreso'); }}
                      className="py-1.5 px-3 rounded-lg bg-accent-blue/20 text-accent-blue border-none text-[11px] font-semibold cursor-pointer hover:bg-accent-blue/30"
                    >
                      Iniciar trabajo
                    </button>
                  )}
                  {d.estado === 'En progreso' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(d.id, 'Completada'); }}
                      className="py-1.5 px-3 rounded-lg bg-accent-green/20 text-accent-green border-none text-[11px] font-semibold cursor-pointer hover:bg-accent-green/30"
                    >
                      Marcar completada
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Nueva Derivación */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowForm(false); setFormInstSearch(''); setShowFormInstDropdown(false); setFormInstalacionId(''); setFormAdjuntos([]); }}>
          <div className="bg-bg-card rounded-2xl p-6 w-full max-w-[540px] border border-border max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Nueva Derivación</h3>
              <button onClick={() => { setShowForm(false); setFormInstSearch(''); setShowFormInstDropdown(false); setFormInstalacionId(''); setFormAdjuntos([]); }} className="text-text-muted hover:text-text-primary cursor-pointer bg-transparent border-none">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleNewDerivacion} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-text-muted block mb-1">Tipo de trabajo</label>
                <select name="tipo" required className="w-full">
                  <option value="">Seleccionar tipo...</option>
                  {TIPOS_DERIVACION.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-muted block mb-1">Zona</label>
                  <input name="zona" placeholder="Ej: PLANICIE 1" required className="w-full" />
                </div>
                <div>
                  <label className="text-xs text-text-muted block mb-1">Prioridad</label>
                  <select name="prioridad" required className="w-full">
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1">Dirección</label>
                <input name="direccion" placeholder="Dirección o ubicación del trabajo" required className="w-full" />
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1">Técnico asignado</label>
                <select name="tecnicoId" required className="w-full">
                  <option value="">Seleccionar técnico...</option>
                  {tecnicos.filter(t => t.estado === 'Activo').map(t => (
                    <option key={t.id} value={t.id}>{t.nombre} — {t.especialidad} ({t.zona})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1">Instalacion relacionada (opcional)</label>
                <input type="hidden" name="instalacionId" value={formInstalacionId} />
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Buscar instalacion por ID, cliente o zona..."
                    value={formInstSearch}
                    onChange={e => {
                      setFormInstSearch(e.target.value);
                      setShowFormInstDropdown(true);
                      if (!e.target.value) {
                        setFormInstalacionId('');
                      }
                    }}
                    onFocus={() => { if (formInstSearch.length >= 2) setShowFormInstDropdown(true); }}
                    className="w-full pl-9 bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-blue"
                  />
                  {formInstalacionId && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormInstalacionId('');
                        setFormInstSearch('');
                        setShowFormInstDropdown(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer bg-transparent border-none p-0"
                    >
                      <X size={14} />
                    </button>
                  )}
                  {showFormInstDropdown && filteredInstalaciones.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-lg shadow-xl z-50 max-h-[200px] overflow-y-auto">
                      {filteredInstalaciones.map(i => (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => {
                            setFormInstalacionId(i.id);
                            setFormInstSearch(`${i.id} — ${i.clienteNombre || i.prospectoNombre || ''} (${i.zona || ''})`);
                            setShowFormInstDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary cursor-pointer border-none bg-transparent text-text-primary transition-colors flex items-center justify-between"
                        >
                          <span className="truncate">{i.id} — {i.clienteNombre || i.prospectoNombre || 'Sin cliente'}</span>
                          <span className="text-[10px] text-text-muted font-mono ml-2">{i.zona || ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-muted block mb-1">Metraje estimado (m)</label>
                  <input name="metraje" type="number" placeholder="0" min="0" className="w-full" />
                </div>
                <div>
                  <label className="text-xs text-text-muted block mb-1">Material requerido</label>
                  <input name="material" placeholder="Ej: Fibra monomodo 12 hilos" className="w-full" />
                </div>
              </div>
              {/* Adjuntos */}
              <div>
                <label className="text-xs text-text-muted block mb-1">Adjuntos del problema (opcional)</label>
                <Adjuntos
                  value={formAdjuntos}
                  onChange={setFormAdjuntos}
                  max={5}
                  compact
                />
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  placeholder="Describe el trabajo a realizar..."
                  required
                  className="bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[80px] resize-y outline-none focus:border-accent-blue w-full font-[inherit]"
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormInstSearch(''); setShowFormInstDropdown(false); setFormInstalacionId(''); setFormAdjuntos([]); }}
                  className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-accent-purple border-none text-white cursor-pointer text-sm font-semibold hover:opacity-90"
                >
                  Crear Derivación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalle Derivación */}
      {selectedDerivacion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setSelectedDerivacion(null); setShowCompletionForm(false); }}>
          <div className="bg-bg-card rounded-2xl p-6 w-full max-w-[600px] border border-border max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm text-text-muted">{selectedDerivacion.id}</span>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${(ESTADO_STYLE[selectedDerivacion.estado] || ESTADO_STYLE['Pendiente']).bg} ${(ESTADO_STYLE[selectedDerivacion.estado] || ESTADO_STYLE['Pendiente']).text}`}>
                    {selectedDerivacion.estado}
                  </span>
                </div>
                <h3 className="text-lg font-bold">{selectedDerivacion.tipo}</h3>
              </div>
              <button
                onClick={() => { setSelectedDerivacion(null); setShowCompletionForm(false); }}
                className="text-text-muted hover:text-text-primary cursor-pointer bg-transparent border-none"
              >
                <X size={20} />
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="text-xs">
                <span className="text-text-muted block mb-0.5">Zona</span>
                <span className="font-medium flex items-center gap-1"><MapPin size={12} /> {selectedDerivacion.zona}</span>
              </div>
              <div className="text-xs">
                <span className="text-text-muted block mb-0.5">Prioridad</span>
                <span className={`font-semibold ${PRIORIDAD_STYLE[selectedDerivacion.prioridad]}`}>{selectedDerivacion.prioridad}</span>
              </div>
              <div className="text-xs">
                <span className="text-text-muted block mb-0.5">Dirección</span>
                <span className="font-medium">{selectedDerivacion.direccion}</span>
              </div>
              <div className="text-xs">
                <span className="text-text-muted block mb-0.5">Técnico asignado</span>
                <span className="font-medium">{selectedDerivacion.tecnicoNombre}</span>
              </div>
              <div className="text-xs">
                <span className="text-text-muted block mb-0.5">Fecha de creación</span>
                <span className="font-medium">{selectedDerivacion.fecha}</span>
              </div>
              <div className="text-xs">
                <span className="text-text-muted block mb-0.5">Fecha completado</span>
                <span className="font-medium">{selectedDerivacion.fechaCompletado || '—'}</span>
              </div>
              {selectedDerivacion.metraje > 0 && (
                <div className="text-xs">
                  <span className="text-text-muted block mb-0.5">Metraje estimado</span>
                  <span className="font-medium">{selectedDerivacion.metraje} metros</span>
                </div>
              )}
              {selectedDerivacion.material && (
                <div className="text-xs">
                  <span className="text-text-muted block mb-0.5">Material requerido</span>
                  <span className="font-medium">{selectedDerivacion.material}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-bg-secondary rounded-lg p-3 mb-4">
              <p className="text-xs text-text-muted mb-1">Descripción</p>
              <p className="text-sm">{selectedDerivacion.descripcion}</p>
            </div>

            {/* Adjuntos */}
            {selectedDerivacion.adjuntos && selectedDerivacion.adjuntos.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2">Adjuntos / Evidencia</p>
                <Adjuntos value={selectedDerivacion.adjuntos} onChange={() => { }} readOnly max={5} />
              </div>
            )}

            {/* Related Installation */}
            {selectedDerivacion.instalacionId && (() => {
              const inst = getRelatedInstallation(selectedDerivacion.instalacionId);
              if (!inst) return null;
              return (
                <div className="bg-bg-secondary rounded-lg p-3 mb-4 border border-border">
                  <p className="text-xs text-text-muted mb-2 flex items-center gap-1.5">
                    <Cable size={12} /> Instalación relacionada
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-text-muted">ID:</span>{' '}
                      <span className="font-mono text-accent-cyan">{inst.id}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Cliente:</span>{' '}
                      <span className="font-medium">{inst.clienteNombre}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Tipo:</span>{' '}
                      <span className="font-medium">{inst.tipo}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Tecnología:</span>{' '}
                      <span className="font-medium">{inst.tecnologia}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Plan:</span>{' '}
                      <span className="font-medium">{inst.plan}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Estado:</span>{' '}
                      <span className="font-medium">{inst.estado}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-text-muted">Dirección:</span>{' '}
                      <span className="font-medium">{inst.direccion}</span>
                    </div>
                    {inst.observaciones && (
                      <div className="col-span-2">
                        <span className="text-text-muted">Observaciones:</span>{' '}
                        <span className="text-text-secondary">{inst.observaciones}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Completion metrics if already completed */}
            {selectedDerivacion.estado === 'Completada' && selectedDerivacion.metricaAntes && (
              <div className="bg-accent-green/10 rounded-lg p-3 mb-4 border border-accent-green/20">
                <p className="text-xs text-accent-green font-semibold mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> Métricas de cierre
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-text-muted">Métrica antes:</span>{' '}
                    <span className="font-medium">{selectedDerivacion.metricaAntes}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Métrica después:</span>{' '}
                    <span className="font-medium text-accent-green">{selectedDerivacion.metricaDespues}</span>
                  </div>
                  {selectedDerivacion.observacionesCierre && (
                    <div className="col-span-2">
                      <span className="text-text-muted">Observaciones:</span>{' '}
                      <span className="text-text-secondary">{selectedDerivacion.observacionesCierre}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Completion Form */}
            {showCompletionForm && selectedDerivacion.estado !== 'Completada' && selectedDerivacion.estado !== 'Cancelada' && (
              <div className="bg-bg-secondary rounded-lg p-4 mb-4 border border-accent-green/30">
                <p className="text-xs text-accent-green font-semibold mb-3">Formulario de cierre</p>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Métrica antes</label>
                      <input
                        placeholder="Ej: -18dBm, 25Mbps"
                        value={completionData.metricaAntes}
                        onChange={e => setCompletionData(p => ({ ...p, metricaAntes: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Métrica después</label>
                      <input
                        placeholder="Ej: -14dBm, 95Mbps"
                        value={completionData.metricaDespues}
                        onChange={e => setCompletionData(p => ({ ...p, metricaDespues: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Observaciones de cierre</label>
                    <textarea
                      placeholder="Descripción del trabajo realizado, observaciones..."
                      value={completionData.observaciones}
                      onChange={e => setCompletionData(p => ({ ...p, observaciones: e.target.value }))}
                      className="bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[60px] resize-y outline-none focus:border-accent-green w-full font-[inherit]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCompletionForm(false)}
                      className="flex-1 py-2 rounded-lg bg-bg-card border border-border text-text-secondary text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCompletion}
                      className="flex-1 py-2 rounded-lg bg-accent-green border-none text-white text-xs font-semibold cursor-pointer hover:opacity-90"
                    >
                      Completar con métricas
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {selectedDerivacion.estado === 'Pendiente' && (
                <>
                  <button
                    onClick={() => handleStatusChange(selectedDerivacion.id, 'En progreso')}
                    className="flex-1 py-2.5 rounded-lg bg-accent-blue/20 text-accent-blue border-none text-xs font-semibold cursor-pointer hover:bg-accent-blue/30"
                  >
                    Pasar a En progreso
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedDerivacion.id, 'Cancelada')}
                    className="py-2.5 px-4 rounded-lg bg-bg-secondary border border-border text-text-muted text-xs cursor-pointer hover:text-text-secondary"
                  >
                    Cancelar
                  </button>
                </>
              )}
              {selectedDerivacion.estado === 'En progreso' && (
                <>
                  {!showCompletionForm && (
                    <button
                      onClick={() => setShowCompletionForm(true)}
                      className="flex-1 py-2.5 rounded-lg bg-accent-green/20 text-accent-green border-none text-xs font-semibold cursor-pointer hover:bg-accent-green/30"
                    >
                      Completar con métricas
                    </button>
                  )}
                  {!showCompletionForm && (
                    <button
                      onClick={() => handleStatusChange(selectedDerivacion.id, 'Completada')}
                      className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary text-xs cursor-pointer hover:border-accent-green/50"
                    >
                      Marcar Completada
                    </button>
                  )}
                  {!showCompletionForm && (
                    <button
                      onClick={() => handleStatusChange(selectedDerivacion.id, 'Reprogramada')}
                      className="py-2.5 px-4 rounded-lg bg-cyan-500/20 text-cyan-400 border-none text-xs font-semibold cursor-pointer hover:bg-cyan-500/30"
                    >
                      Reprogramar
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusChange(selectedDerivacion.id, 'Cancelada')}
                    className="py-2.5 px-4 rounded-lg bg-bg-secondary border border-border text-text-muted text-xs cursor-pointer hover:text-text-secondary"
                  >
                    Cancelar
                  </button>
                </>
              )}
              {(selectedDerivacion.estado === 'Completada' || selectedDerivacion.estado === 'Cancelada') && (
                <button
                  onClick={() => { setSelectedDerivacion(null); setShowCompletionForm(false); }}
                  className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary text-xs cursor-pointer"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      <ResolutionModal
        open={showResolutionModal}
        onClose={() => {
          setShowResolutionModal(false);
          setResolutionTarget(null);
        }}
        onConfirm={handleResolutionConfirm}
        title="Completar Trabajo de Planta Externa"
        entityId={resolutionTarget ? derivaciones.find(d => d.id === resolutionTarget.derivacionId)?.id : ''}
        entityLabel="Derivacion"
        newStatus="Completada"
        accentColor="accent-purple"
      />
    </div>
  );
}
