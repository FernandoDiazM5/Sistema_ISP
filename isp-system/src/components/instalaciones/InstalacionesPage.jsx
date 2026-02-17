import { useState, useMemo } from 'react';
import { Plus, Search, Wifi, Cable, MapPin, Calendar, User, ChevronRight, X, Clock, CheckCircle2, AlertCircle, Loader2, Wrench, ArrowRight, FileText } from 'lucide-react';
import useStore from '../../store/useStore';

const ESTADOS = ['Pendiente', 'Aprobada', 'Programada', 'En Instalación', 'Completada', 'Derivada', 'Cancelada'];

const ESTADO_COLOR = {
  'Pendiente':       { bg: '#f59e0b20', text: '#f59e0b', tailBg: 'bg-yellow-500/20', tailText: 'text-yellow-400' },
  'Aprobada':        { bg: '#3b82f620', text: '#3b82f6', tailBg: 'bg-blue-500/20', tailText: 'text-blue-400' },
  'Programada':      { bg: '#8b5cf620', text: '#8b5cf6', tailBg: 'bg-purple-500/20', tailText: 'text-purple-400' },
  'En Instalación':  { bg: '#f9731620', text: '#f97316', tailBg: 'bg-orange-500/20', tailText: 'text-orange-400' },
  'Completada':      { bg: '#10b98120', text: '#10b981', tailBg: 'bg-green-500/20', tailText: 'text-green-400' },
  'Derivada':        { bg: '#ef444420', text: '#ef4444', tailBg: 'bg-red-500/20', tailText: 'text-red-400' },
  'Cancelada':       { bg: '#6b728020', text: '#6b7280', tailBg: 'bg-gray-500/20', tailText: 'text-gray-400' },
};

const PIPELINE_STAGES = ['Pendiente', 'Aprobada', 'Programada', 'En Instalación', 'Completada'];

const PLANES = [
  'INTERNET FIBRA 100MB',
  'INTERNET FIBRA 200MB',
  'INTERNET FIBRA 300MB',
  'INTERNET RADIO 30MB',
  'INTERNET RADIO 50MB',
  'INTERNET RADIO 65MB',
  'INTERNET RADIO 100MB',
];

const TECNOLOGIAS = ['Radio Enlace', 'Fibra Óptica'];

const ESTADO_TRANSITIONS = {
  'Pendiente':      ['Aprobada', 'Cancelada'],
  'Aprobada':       ['Programada', 'Cancelada'],
  'Programada':     ['En Instalación', 'Cancelada'],
  'En Instalación': ['Completada', 'Derivada'],
  'Completada':     [],
  'Derivada':       ['En Instalación'],
  'Cancelada':      [],
};

function EstadoBadge({ estado, size = 'sm' }) {
  const c = ESTADO_COLOR[estado] || ESTADO_COLOR['Pendiente'];
  const padding = size === 'sm' ? 'py-[3px] px-2.5' : 'py-1 px-3';
  const fontSize = size === 'sm' ? 'text-[11px]' : 'text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${padding} ${fontSize}`}
      style={{ background: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.text, boxShadow: `0 0 6px ${c.text}` }} />
      {estado}
    </span>
  );
}

function TecnologiaBadge({ tecnologia }) {
  const isFibra = tecnologia === 'Fibra Óptica';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full py-[3px] px-2.5 text-[11px] font-semibold whitespace-nowrap ${isFibra ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
      {isFibra ? <Cable size={10} /> : <Wifi size={10} />}
      {tecnologia}
    </span>
  );
}

export default function InstalacionesPage() {
  const instalaciones = useStore(s => s.instalaciones);
  const addInstalacion = useStore(s => s.addInstalacion);
  const updateInstalacion = useStore(s => s.updateInstalacion);
  const clients = useStore(s => s.clients);
  const tecnicos = useStore(s => s.tecnicos);
  const derivaciones = useStore(s => s.derivaciones);

  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterZona, setFilterZona] = useState('all');
  const [filterTecnologia, setFilterTecnologia] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedInstalacion, setSelectedInstalacion] = useState(null);
  const [viewMode, setViewMode] = useState('pipeline');

  const [formData, setFormData] = useState({
    prospectoNombre: '',
    prospectoDNI: '',
    prospectoTelefono: '',
    prospectoEmail: '',
    plan: '',
    tecnologia: '',
    zona: '',
    direccion: '',
    tecnicoId: '',
    tecnicoNombre: '',
    fecha: '',
    observaciones: '',
  });

  const tecnicosActivos = useMemo(() => {
    return tecnicos.filter(t => t.estado === 'Activo');
  }, [tecnicos]);

  const zonas = useMemo(() => {
    const z = new Set(instalaciones.map(i => i.zona).filter(Boolean));
    clients.forEach(c => { if (c.zona) z.add(c.zona); });
    return Array.from(z).sort();
  }, [instalaciones, clients]);

  const stats = useMemo(() => ({
    total: instalaciones.length,
    pendientes: instalaciones.filter(i => i.estado === 'Pendiente' || i.estado === 'Aprobada').length,
    enCurso: instalaciones.filter(i => i.estado === 'Programada' || i.estado === 'En Instalación').length,
    completadas: instalaciones.filter(i => i.estado === 'Completada').length,
  }), [instalaciones]);

  const filtered = useMemo(() => {
    return instalaciones.filter(i => {
      const q = search.toLowerCase();
      const displayName = i.prospectoNombre || i.clienteNombre;
      const matchSearch = !search ||
        (displayName && displayName.toLowerCase().includes(q)) ||
        (i.id && i.id.toLowerCase().includes(q)) ||
        (i.direccion && i.direccion.toLowerCase().includes(q)) ||
        (i.tecnicoNombre && i.tecnicoNombre.toLowerCase().includes(q));
      const matchEstado = filterEstado === 'all' || i.estado === filterEstado;
      const matchZona = filterZona === 'all' || i.zona === filterZona;
      const matchTec = filterTecnologia === 'all' || i.tecnologia === filterTecnologia;
      return matchSearch && matchEstado && matchZona && matchTec;
    });
  }, [instalaciones, search, filterEstado, filterZona, filterTecnologia]);

  const pipelineData = useMemo(() => {
    const stages = {};
    PIPELINE_STAGES.forEach(stage => { stages[stage] = []; });
    stages['Derivada'] = [];
    instalaciones.forEach(inst => {
      if (stages[inst.estado]) {
        stages[inst.estado].push(inst);
      }
    });
    return stages;
  }, [instalaciones]);

  const relatedDerivaciones = useMemo(() => {
    if (!selectedInstalacion) return [];
    return derivaciones.filter(d => d.instalacionId === selectedInstalacion.id);
  }, [derivaciones, selectedInstalacion]);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'tecnicoId') {
      const tec = tecnicos.find(t => t.id === value);
      if (tec) {
        setFormData(prev => ({ ...prev, tecnicoId: value, tecnicoNombre: tec.nombre }));
      }
    }
  };

  const resetFormData = () => {
    setFormData({ prospectoNombre: '', prospectoDNI: '', prospectoTelefono: '', prospectoEmail: '', plan: '', tecnologia: '', zona: '', direccion: '', tecnicoId: '', tecnicoNombre: '', fecha: '', observaciones: '' });
  };

  const handleCreateInstalacion = (e) => {
    e.preventDefault();
    if (!formData.prospectoNombre || !formData.plan || !formData.tecnologia) return;
    addInstalacion({
      prospectoNombre: formData.prospectoNombre,
      prospectoDNI: formData.prospectoDNI,
      prospectoTelefono: formData.prospectoTelefono,
      prospectoEmail: formData.prospectoEmail,
      clienteNombre: formData.prospectoNombre,
      tecnicoId: formData.tecnicoId || null,
      tecnicoNombre: formData.tecnicoNombre || 'Sin asignar',
      tipo: 'Nueva Instalación',
      estado: 'Pendiente',
      plan: formData.plan,
      tecnologia: formData.tecnologia,
      direccion: formData.direccion,
      zona: formData.zona,
      equipoInstalado: '',
      fecha: formData.fecha || new Date().toISOString().split('T')[0],
      horaInicio: null,
      horaFin: null,
      observaciones: formData.observaciones,
    });
    setShowNewModal(false);
    resetFormData();
  };

  const handleStatusChange = (instalacion, newStatus) => {
    updateInstalacion(instalacion.id, { estado: newStatus });
    setSelectedInstalacion(prev => prev ? { ...prev, estado: newStatus } : null);
  };

  return (
    <div className="animate-fade p-4 sm:p-6 sm:px-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-[26px] font-bold tracking-tight">Instalaciones</h1>
          <p className="text-text-secondary text-sm mt-1">
            Pipeline de instalaciones - {stats.total} total, {stats.enCurso} en curso
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-bg-secondary rounded-lg border border-border p-0.5">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`py-1.5 px-3 rounded-md text-xs font-medium cursor-pointer border-none transition-all ${viewMode === 'pipeline' ? 'bg-accent-blue text-white' : 'bg-transparent text-text-secondary hover:text-text-primary'}`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`py-1.5 px-3 rounded-md text-xs font-medium cursor-pointer border-none transition-all ${viewMode === 'list' ? 'bg-accent-blue text-white' : 'bg-transparent text-text-secondary hover:text-text-primary'}`}
            >
              Lista
            </button>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="py-2.5 px-4 rounded-xl bg-accent-blue border-none text-white text-sm font-semibold cursor-pointer flex items-center gap-2 hover:opacity-90"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Nueva</span> Instalación
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: <FileText size={16} />, color: '#3b82f6' },
          { label: 'Pendientes', value: stats.pendientes, icon: <Clock size={16} />, color: '#f59e0b' },
          { label: 'En Curso', value: stats.enCurso, icon: <Loader2 size={16} />, color: '#f97316' },
          { label: 'Completadas', value: stats.completadas, icon: <CheckCircle2 size={16} />, color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: s.color + '15', color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-lg font-bold font-mono">{s.value}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            placeholder="Buscar por prospecto, ID, dirección, técnico..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9"
          />
        </div>
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="flex-1 sm:flex-none sm:min-w-[150px]">
            <option value="all">Todos los estados</option>
            {ESTADOS.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <select value={filterZona} onChange={e => setFilterZona(e.target.value)} className="flex-1 sm:flex-none sm:min-w-[140px]">
            <option value="all">Todas las zonas</option>
            {zonas.map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
          <select value={filterTecnologia} onChange={e => setFilterTecnologia(e.target.value)} className="flex-1 sm:flex-none sm:min-w-[150px]">
            <option value="all">Toda tecnología</option>
            {TECNOLOGIAS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pipeline View */}
      {viewMode === 'pipeline' && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {[...PIPELINE_STAGES, 'Derivada'].map(stage => {
            const items = pipelineData[stage] || [];
            const stageColor = ESTADO_COLOR[stage];
            return (
              <div key={stage} className="min-w-[240px] flex-1">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: stageColor.text }} />
                  <span className="text-xs font-semibold text-text-primary uppercase tracking-wide">{stage}</span>
                  <span
                    className="text-[10px] font-bold rounded-full px-1.5 py-0.5 ml-auto"
                    style={{ background: stageColor.bg, color: stageColor.text }}
                  >
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.length === 0 && (
                    <div className="bg-bg-secondary/50 rounded-lg p-4 border border-border/50 border-dashed text-center">
                      <p className="text-[11px] text-text-muted">Sin instalaciones</p>
                    </div>
                  )}
                  {items.map(inst => (
                    <div
                      key={inst.id}
                      onClick={() => setSelectedInstalacion(inst)}
                      className="bg-bg-card rounded-lg p-3 border border-border cursor-pointer transition-all hover:border-accent-blue/50 hover:bg-bg-card-hover group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[10px] text-text-muted">{inst.id}</span>
                        <ChevronRight size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xs font-semibold mb-1 truncate" title={inst.prospectoNombre || inst.clienteNombre}>
                        {inst.prospectoNombre || inst.clienteNombre}
                      </p>
                      {inst.prospectoDNI && (
                        <p className="text-[10px] text-text-muted mb-1">DNI: {inst.prospectoDNI}</p>
                      )}
                      <div className="flex items-center gap-1 text-[10px] text-text-muted mb-1.5">
                        <MapPin size={9} />
                        <span className="truncate">{inst.zona || 'Sin zona'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <TecnologiaBadge tecnologia={inst.tecnologia} />
                        <span className="text-[10px] text-text-muted flex items-center gap-1">
                          <Calendar size={9} />
                          {inst.fecha}
                        </span>
                      </div>
                      {inst.tecnicoNombre && (
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-text-secondary">
                          <User size={9} />
                          {inst.tecnicoNombre}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="flex flex-col gap-3">
          {filtered.length === 0 && (
            <div className="bg-bg-card rounded-xl p-8 border border-border text-center">
              <p className="text-text-muted text-sm">No se encontraron instalaciones</p>
            </div>
          )}
          {filtered.map(inst => (
            <div
              key={inst.id}
              onClick={() => setSelectedInstalacion(inst)}
              className="bg-bg-card rounded-xl p-4 border border-border cursor-pointer transition-all hover:border-accent-blue/50 hover:bg-bg-card-hover"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-text-muted">{inst.id}</span>
                  <EstadoBadge estado={inst.estado} />
                  <TecnologiaBadge tecnologia={inst.tecnologia} />
                </div>
                <span className="text-[11px] text-text-muted flex items-center gap-1">
                  <Calendar size={11} />
                  {inst.fecha}
                </span>
              </div>
              <p className="text-sm font-semibold mb-1">{inst.prospectoNombre || inst.clienteNombre}</p>
              {inst.prospectoDNI && (
                <p className="text-[11px] text-text-muted mb-1">DNI: {inst.prospectoDNI}</p>
              )}
              <p className="text-xs text-text-secondary mb-2">{inst.plan}</p>
              <div className="flex items-center gap-4 text-[11px] text-text-muted">
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  {inst.direccion || 'Sin dirección'}
                </span>
                <span className="flex items-center gap-1">
                  <User size={11} />
                  {inst.tecnicoNombre || 'Sin asignar'}
                </span>
                {inst.zona && (
                  <span className="bg-bg-secondary px-2 py-0.5 rounded text-[10px]">{inst.zona}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pipeline Flow Indicator */}
      {viewMode === 'pipeline' && (
        <div className="mt-6 flex items-center justify-center gap-1">
          {PIPELINE_STAGES.map((stage, idx) => {
            const stageColor = ESTADO_COLOR[stage];
            return (
              <div key={stage} className="flex items-center gap-1">
                <span
                  className="text-[10px] font-medium px-2 py-1 rounded"
                  style={{ background: stageColor.bg, color: stageColor.text }}
                >
                  {stage}
                </span>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <ArrowRight size={12} className="text-text-muted" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Nueva Instalación */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowNewModal(false)}>
          <div className="bg-bg-card rounded-2xl p-4 sm:p-6 w-full max-w-[560px] border border-border max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Nueva Instalación</h3>
              <button onClick={() => setShowNewModal(false)} className="w-8 h-8 rounded-lg bg-bg-secondary border border-border flex items-center justify-center cursor-pointer text-text-muted hover:text-text-primary">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateInstalacion} className="flex flex-col gap-4">
              {/* Prospect Data */}
              <div>
                <label className="block text-xs text-text-secondary font-medium mb-1.5">Nombre del Prospecto *</label>
                <input
                  type="text"
                  placeholder="Nombre completo del prospecto"
                  value={formData.prospectoNombre}
                  onChange={e => handleFormChange('prospectoNombre', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-secondary font-medium mb-1.5">DNI / Documento</label>
                  <input
                    type="text"
                    placeholder="Número de documento"
                    value={formData.prospectoDNI}
                    onChange={e => handleFormChange('prospectoDNI', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary font-medium mb-1.5">Teléfono / Celular</label>
                  <input
                    type="text"
                    placeholder="Número de contacto"
                    value={formData.prospectoTelefono}
                    onChange={e => handleFormChange('prospectoTelefono', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-secondary font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="Correo electrónico (opcional)"
                  value={formData.prospectoEmail}
                  onChange={e => handleFormChange('prospectoEmail', e.target.value)}
                />
              </div>

              {/* Plan */}
              <div>
                <label className="block text-xs text-text-secondary font-medium mb-1.5">Plan *</label>
                <select
                  value={formData.plan}
                  onChange={e => handleFormChange('plan', e.target.value)}
                  required
                >
                  <option value="">Seleccionar plan...</option>
                  {PLANES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Tecnología */}
              <div>
                <label className="block text-xs text-text-secondary font-medium mb-1.5">Tecnología *</label>
                <select
                  value={formData.tecnologia}
                  onChange={e => handleFormChange('tecnologia', e.target.value)}
                  required
                >
                  <option value="">Seleccionar tecnología...</option>
                  {TECNOLOGIAS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Zona + Dirección */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-secondary font-medium mb-1.5">Zona</label>
                  <input
                    type="text"
                    placeholder="Zona de instalación"
                    value={formData.zona}
                    onChange={e => handleFormChange('zona', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary font-medium mb-1.5">Dirección</label>
                  <input
                    type="text"
                    placeholder="Dirección completa"
                    value={formData.direccion}
                    onChange={e => handleFormChange('direccion', e.target.value)}
                  />
                </div>
              </div>

              {/* Técnico + Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-secondary font-medium mb-1.5">Técnico</label>
                  <select
                    value={formData.tecnicoId}
                    onChange={e => handleFormChange('tecnicoId', e.target.value)}
                  >
                    <option value="">Sin asignar</option>
                    {tecnicosActivos.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre} — {t.especialidad}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-secondary font-medium mb-1.5">Fecha programada</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={e => handleFormChange('fecha', e.target.value)}
                  />
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs text-text-secondary font-medium mb-1.5">Observaciones</label>
                <textarea
                  placeholder="Notas adicionales sobre la instalación..."
                  value={formData.observaciones}
                  onChange={e => handleFormChange('observaciones', e.target.value)}
                  className="bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[80px] resize-y outline-none focus:border-accent-blue w-full"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => { setShowNewModal(false); resetFormData(); }}
                  className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm hover:text-text-primary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!formData.prospectoNombre || !formData.plan || !formData.tecnologia}
                  className="flex-1 py-2.5 rounded-lg bg-accent-blue border-none text-white cursor-pointer text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                >
                  Crear Instalación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalle Instalación */}
      {selectedInstalacion && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedInstalacion(null)}>
          <div className="bg-bg-card rounded-2xl p-4 sm:p-6 w-full max-w-[600px] border border-border max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm text-text-muted">{selectedInstalacion.id}</span>
                  <EstadoBadge estado={selectedInstalacion.estado} size="md" />
                </div>
                <h3 className="text-lg font-bold">{selectedInstalacion.prospectoNombre || selectedInstalacion.clienteNombre}</h3>
              </div>
              <button
                onClick={() => setSelectedInstalacion(null)}
                className="w-8 h-8 rounded-lg bg-bg-secondary border border-border flex items-center justify-center cursor-pointer text-text-muted hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5">
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Prospecto</p>
                <p className="text-sm font-semibold">{selectedInstalacion.prospectoNombre || selectedInstalacion.clienteNombre}</p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">DNI / Documento</p>
                <p className="text-sm font-medium">{selectedInstalacion.prospectoDNI || 'No registrado'}</p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Teléfono</p>
                <p className="text-sm font-medium">{selectedInstalacion.prospectoTelefono || 'No registrado'}</p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Email</p>
                <p className="text-sm font-medium">{selectedInstalacion.prospectoEmail || 'No registrado'}</p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Plan</p>
                <p className="text-sm font-semibold">{selectedInstalacion.plan}</p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Tecnología</p>
                <div className="mt-0.5">
                  <TecnologiaBadge tecnologia={selectedInstalacion.tecnologia} />
                </div>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Dirección</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <MapPin size={12} className="text-text-muted" />
                  {selectedInstalacion.direccion || 'Sin dirección'}
                </p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Zona</p>
                <p className="text-sm font-medium">{selectedInstalacion.zona || 'Sin zona'}</p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Técnico</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <User size={12} className="text-text-muted" />
                  {selectedInstalacion.tecnicoNombre || 'Sin asignar'}
                </p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Fecha</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Calendar size={12} className="text-text-muted" />
                  {selectedInstalacion.fecha}
                </p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Tipo</p>
                <p className="text-sm font-medium">{selectedInstalacion.tipo || 'Nueva Instalación'}</p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Equipo Instalado</p>
                <p className="text-sm font-medium">{selectedInstalacion.equipoInstalado || 'Pendiente'}</p>
              </div>
            </div>

            {/* Horarios */}
            {(selectedInstalacion.horaInicio || selectedInstalacion.horaFin) && (
              <div className="bg-bg-secondary rounded-lg p-3 mb-5 flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-text-muted uppercase">Hora Inicio</p>
                  <p className="text-sm font-mono font-medium">{selectedInstalacion.horaInicio || '—'}</p>
                </div>
                <ArrowRight size={14} className="text-text-muted" />
                <div>
                  <p className="text-[10px] text-text-muted uppercase">Hora Fin</p>
                  <p className="text-sm font-mono font-medium">{selectedInstalacion.horaFin || '—'}</p>
                </div>
              </div>
            )}

            {/* Observaciones */}
            {selectedInstalacion.observaciones && (
              <div className="bg-bg-secondary rounded-lg p-3 mb-5">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Observaciones</p>
                <p className="text-sm text-text-secondary">{selectedInstalacion.observaciones}</p>
              </div>
            )}

            {/* Derivaciones Relacionadas */}
            {relatedDerivaciones.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1">
                  <Wrench size={12} />
                  Derivaciones de Planta Externa ({relatedDerivaciones.length})
                </p>
                <div className="flex flex-col gap-2">
                  {relatedDerivaciones.map(d => (
                    <div key={d.id} className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[11px] text-text-muted">{d.id}</span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: d.estado === 'Completada' ? '#10b98120' : d.estado === 'En progreso' ? '#f9731620' : '#f59e0b20',
                            color: d.estado === 'Completada' ? '#10b981' : d.estado === 'En progreso' ? '#f97316' : '#f59e0b',
                          }}
                        >
                          {d.estado}
                        </span>
                      </div>
                      <p className="text-xs font-medium">{d.tipo}</p>
                      <p className="text-[11px] text-text-muted mt-0.5">{d.descripcion}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-muted">
                        <span className="flex items-center gap-1"><User size={9} />{d.tecnicoNombre}</span>
                        <span className="flex items-center gap-1"><Calendar size={9} />{d.fecha}</span>
                        {d.metraje > 0 && <span>{d.metraje}m</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Progress Bar */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-text-primary mb-3">Progreso de Instalación</p>
              <div className="flex items-center gap-1">
                {PIPELINE_STAGES.map((stage, idx) => {
                  const stageIdx = PIPELINE_STAGES.indexOf(selectedInstalacion.estado);
                  const isActive = idx <= stageIdx;
                  const isCurrent = stage === selectedInstalacion.estado;
                  const stageColor = ESTADO_COLOR[stage];
                  return (
                    <div key={stage} className="flex items-center gap-1 flex-1">
                      <div
                        className={`h-1.5 rounded-full flex-1 transition-all ${isActive ? '' : 'opacity-20'}`}
                        style={{ background: isActive ? stageColor.text : '#6b7280' }}
                      />
                      {isCurrent && (
                        <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: stageColor.text }}>
                          {stage}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Change Buttons */}
            <div className="flex gap-2 flex-wrap">
              {(ESTADO_TRANSITIONS[selectedInstalacion.estado] || []).map(nextState => {
                const nextColor = ESTADO_COLOR[nextState];
                return (
                  <button
                    key={nextState}
                    onClick={() => handleStatusChange(selectedInstalacion, nextState)}
                    className="py-2 px-4 rounded-lg border-none text-xs font-semibold cursor-pointer flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                    style={{ background: nextColor.bg, color: nextColor.text }}
                  >
                    <ChevronRight size={12} />
                    {nextState === 'Cancelada' ? 'Cancelar' : `Mover a ${nextState}`}
                  </button>
                );
              })}
              <button
                onClick={() => setSelectedInstalacion(null)}
                className="py-2 px-4 rounded-lg bg-bg-secondary border border-border text-text-secondary text-xs cursor-pointer ml-auto hover:text-text-primary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
