import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, User, Phone, MapPin, Wrench, Edit3, Trash2, X, Mail, Briefcase, Wifi, Radio, Shield, Eye, Calendar, Clock, CheckCircle2, AlertCircle, Activity } from 'lucide-react';
import useStore from '../../store/useStore';

const ESTADO_COLORS = {
  'Activo': { bg: 'bg-accent-green/15', text: 'text-accent-green', dot: 'bg-accent-green' },
  'Inactivo': { bg: 'bg-accent-red/15', text: 'text-accent-red', dot: 'bg-accent-red' },
  'Vacaciones': { bg: 'bg-accent-yellow/15', text: 'text-accent-yellow', dot: 'bg-accent-yellow' },
};

const ESPECIALIDAD_ICONS = {
  'Radio Enlace': Radio,
  'Fibra Óptica': Wifi,
  'General': Wrench,
};

const ESPECIALIDAD_COLORS = {
  'Radio Enlace': '#f59e0b',
  'Fibra Óptica': '#3b82f6',
  'General': '#8b5cf6',
};

const CARGOS = ['Técnico de Campo', 'Supervisor Técnico', 'Técnico de Planta'];
const ESPECIALIDADES = ['Radio Enlace', 'Fibra Óptica', 'General'];
const ESTADOS = ['Activo', 'Inactivo', 'Vacaciones'];

const EMPTY_FORM = {
  nombre: '',
  cargo: 'Técnico de Campo',
  especialidad: 'General',
  telefono: '',
  email: '',
  zona: '',
  estado: 'Activo',
};

export default function TecnicosPage() {
  const tecnicos = useStore(s => s.tecnicos);
  const addTecnico = useStore(s => s.addTecnico);
  const updateTecnico = useStore(s => s.updateTecnico);
  const deleteTecnico = useStore(s => s.deleteTecnico);
  const visitas = useStore(s => s.visitas);
  const tickets = useStore(s => s.tickets);

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedTecnico, setSelectedTecnico] = useState(null);

  useEffect(() => {
    if (selectedTecnico) {
      const updated = tecnicos.find(a => a.id === selectedTecnico.id);
      if (updated && updated !== selectedTecnico) {
        setSelectedTecnico(updated);
      }
    }
  }, [tecnicos, selectedTecnico]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [detailTab, setDetailTab] = useState('info');

  // ==================== STATS ====================
  const stats = useMemo(() => {
    const total = tecnicos.length;
    const activos = tecnicos.filter(t => t.estado === 'Activo').length;
    const inactivos = tecnicos.filter(t => t.estado === 'Inactivo').length;
    const vacaciones = tecnicos.filter(t => t.estado === 'Vacaciones').length;

    const enCampo = tecnicos.filter(t => {
      if (t.estado !== 'Activo') return false;
      return visitas.some(v => v.tecnicoId === t.id && (v.estado === 'Programada' || v.estado === 'En Ruta' || v.estado === 'En Sitio'));
    }).length;

    return { total, activos, enCampo, inactivos, vacaciones };
  }, [tecnicos, visitas]);

  // ==================== FILTERED LIST ====================
  const filtered = useMemo(() => {
    if (!search) return tecnicos;
    const q = search.toLowerCase();
    return tecnicos.filter(t =>
      (t.nombre && t.nombre.toLowerCase().includes(q)) ||
      (t.especialidad && t.especialidad.toLowerCase().includes(q)) ||
      (t.zona && t.zona.toLowerCase().includes(q)) ||
      (t.cargo && t.cargo.toLowerCase().includes(q))
    );
  }, [tecnicos, search]);

  // ==================== HANDLERS ====================
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (tecnico) => {
    setEditingId(tecnico.id);
    setForm({
      nombre: tecnico.nombre,
      cargo: tecnico.cargo,
      especialidad: tecnico.especialidad,
      telefono: tecnico.telefono,
      email: tecnico.email,
      zona: tecnico.zona,
      estado: tecnico.estado,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.nombre.trim() || !form.telefono.trim()) return;
    if (editingId) {
      updateTecnico(editingId, { ...form });
      if (selectedTecnico && selectedTecnico.id === editingId) {
        setSelectedTecnico({ ...selectedTecnico, ...form });
      }
    } else {
      addTecnico({ ...form });
    }
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleDelete = (id) => {
    deleteTecnico(id);
    setShowDeleteConfirm(null);
    if (selectedTecnico && selectedTecnico.id === id) {
      setSelectedTecnico(null);
    }
  };

  const openDetail = (tecnico) => {
    setSelectedTecnico(tecnico);
    setDetailTab('info');
  };

  // ==================== DETAIL HELPERS ====================
  const getTecnicoVisitas = (tecnicoId) => {
    return visitas.filter(v => v.tecnicoId === tecnicoId);
  };

  const getTecnicoTickets = (tecnicoId) => {
    return tickets.filter(t => t.tecnicoId === tecnicoId);
  };

  const getTecnicoStats = (tecnicoId) => {
    const tecVisitas = getTecnicoVisitas(tecnicoId);
    const tecTickets = getTecnicoTickets(tecnicoId);
    const completadas = tecVisitas.filter(v => v.estado === 'Completada').length;
    const programadas = tecVisitas.filter(v => v.estado === 'Programada').length;
    const ticketsAbiertos = tecTickets.filter(t => t.estado === 'Abierto' || t.estado === 'En Proceso').length;
    const ticketsResueltos = tecTickets.filter(t => t.estado === 'Resuelto' || t.estado === 'Cerrado').length;
    return { completadas, programadas, ticketsAbiertos, ticketsResueltos, totalVisitas: tecVisitas.length, totalTickets: tecTickets.length };
  };

  // ==================== RENDER ====================
  return (
    <div className="animate-fade p-4 sm:p-6 sm:px-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-[26px] font-bold tracking-tight">Técnicos</h1>
          <p className="text-text-secondary text-sm mt-1">
            {stats.total} técnicos registrados — {stats.activos} activos
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-accent-blue text-white rounded-xl font-semibold text-sm border-none cursor-pointer hover:opacity-90 transition-opacity w-full sm:w-auto"
        >
          <Plus size={16} /> Nuevo Técnico
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Técnicos', value: stats.total, icon: <User size={16} />, color: '#3b82f6' },
          { label: 'Activos', value: stats.activos, icon: <CheckCircle2 size={16} />, color: '#10b981' },
          { label: 'En Campo', value: stats.enCampo, icon: <MapPin size={16} />, color: '#8b5cf6' },
          { label: 'Inactivos', value: stats.inactivos, icon: <AlertCircle size={16} />, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: s.color + '15', color: s.color }}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-lg font-bold font-mono">{s.value}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full py-2.5 pl-9 pr-4 rounded-xl bg-bg-secondary border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-blue/50"
            placeholder="Buscar por nombre, especialidad, zona..."
          />
        </div>
      </div>

      {/* Technician Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(tecnico => {
          const ec = ESTADO_COLORS[tecnico.estado] || ESTADO_COLORS['Activo'];
          const EspIcon = ESPECIALIDAD_ICONS[tecnico.especialidad] || Wrench;
          const espColor = ESPECIALIDAD_COLORS[tecnico.especialidad] || '#8b5cf6';
          const tecStats = getTecnicoStats(tecnico.id);

          return (
            <div
              key={tecnico.id}
              className="bg-bg-card rounded-2xl border border-border p-5 transition-all hover:border-accent-blue/40 hover:bg-bg-card-hover group"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: espColor + '15', color: espColor }}
                  >
                    <EspIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary leading-tight">{tecnico.nombre}</h3>
                    <p className="text-[11px] text-text-muted mt-0.5">{tecnico.cargo}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${ec.bg} ${ec.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${ec.dot}`} />
                  {tecnico.estado}
                </span>
              </div>

              {/* Card Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Wrench size={12} className="text-text-muted flex-shrink-0" />
                  <span>{tecnico.especialidad}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <MapPin size={12} className="text-text-muted flex-shrink-0" />
                  <span>{tecnico.zona}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Phone size={12} className="text-text-muted flex-shrink-0" />
                  <span>{tecnico.telefono}</span>
                </div>
              </div>

              {/* Mini Stats */}
              <div className="flex items-center gap-3 py-2.5 px-3 bg-bg-secondary rounded-lg mb-3">
                <div className="flex-1 text-center">
                  <p className="text-xs font-bold font-mono">{tecStats.totalVisitas}</p>
                  <p className="text-[9px] text-text-muted uppercase">Visitas</p>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="flex-1 text-center">
                  <p className="text-xs font-bold font-mono">{tecStats.totalTickets}</p>
                  <p className="text-[9px] text-text-muted uppercase">Tickets</p>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="flex-1 text-center">
                  <p className="text-xs font-bold font-mono">{tecStats.completadas}</p>
                  <p className="text-[9px] text-text-muted uppercase">Completadas</p>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openDetail(tecnico)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-accent-blue/10 text-accent-blue text-xs font-semibold border-none cursor-pointer hover:bg-accent-blue/20 transition-colors"
                >
                  <Eye size={13} /> Ver Detalle
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(tecnico); }}
                  className="p-2 rounded-lg bg-transparent border-none cursor-pointer text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-all"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(tecnico); }}
                  className="p-2 rounded-lg bg-transparent border-none cursor-pointer text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <User size={40} className="mx-auto mb-3 text-text-muted opacity-40" />
            <p className="text-text-muted text-sm">No se encontraron técnicos</p>
            <p className="text-text-muted text-xs mt-1">Intenta con otros términos de búsqueda</p>
          </div>
        )}
      </div>

      {/* ==================== CREATE/EDIT MODAL ==================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold">{editingId ? 'Editar Técnico' : 'Nuevo Técnico'}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-text-primary cursor-pointer bg-transparent border-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4">
              {/* Nombre */}
              <div>
                <label className="text-[11px] text-text-muted uppercase mb-1 block">Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full py-2 px-3 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-blue/50"
                  placeholder="Nombre completo del técnico"
                />
              </div>

              {/* Cargo + Especialidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-text-muted uppercase mb-1 block">Cargo</label>
                  <select
                    value={form.cargo}
                    onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-blue/50"
                  >
                    {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-text-muted uppercase mb-1 block">Especialidad</label>
                  <select
                    value={form.especialidad}
                    onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-blue/50"
                  >
                    {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>

              {/* Telefono + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-text-muted uppercase mb-1 block">Teléfono *</label>
                  <input
                    value={form.telefono}
                    onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-blue/50"
                    placeholder="987654321"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-text-muted uppercase mb-1 block">Email</label>
                  <input
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-blue/50"
                    placeholder="tecnico@isp.com"
                  />
                </div>
              </div>

              {/* Zona + Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-text-muted uppercase mb-1 block">Zona</label>
                  <input
                    value={form.zona}
                    onChange={e => setForm(f => ({ ...f, zona: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-blue/50"
                    placeholder="ej. PLANICIE 1"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-text-muted uppercase mb-1 block">Estado</label>
                  <select
                    value={form.estado}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-blue/50"
                  >
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="py-2 px-4 rounded-lg bg-bg-secondary text-text-secondary text-sm border border-border cursor-pointer hover:bg-white/[0.04] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 py-2 px-4 rounded-lg bg-accent-blue text-white text-sm font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity"
              >
                <Plus size={14} /> {editingId ? 'Guardar Cambios' : 'Crear Técnico'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DETAIL MODAL ==================== */}
      {selectedTecnico && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedTecnico(null)}>
          <div
            className="bg-bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Detail Header */}
            <div className="flex justify-between items-start px-6 py-5 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: (ESPECIALIDAD_COLORS[selectedTecnico.especialidad] || '#8b5cf6') + '15',
                    color: ESPECIALIDAD_COLORS[selectedTecnico.especialidad] || '#8b5cf6',
                  }}
                >
                  {(() => {
                    const Icon = ESPECIALIDAD_ICONS[selectedTecnico.especialidad] || Wrench;
                    return <Icon size={22} />;
                  })()}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedTecnico.nombre}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-text-muted">{selectedTecnico.id}</span>
                    <span className="text-text-muted">|</span>
                    <span className="text-xs text-text-secondary">{selectedTecnico.cargo}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const ec = ESTADO_COLORS[selectedTecnico.estado] || ESTADO_COLORS['Activo'];
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${ec.bg} ${ec.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ec.dot}`} />
                      {selectedTecnico.estado}
                    </span>
                  );
                })()}
                <button
                  onClick={() => setSelectedTecnico(null)}
                  className="text-text-muted hover:text-text-primary cursor-pointer bg-transparent border-none ml-2"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-3 border-b border-border flex-shrink-0">
              {[
                { key: 'info', label: 'Información' },
                { key: 'visitas', label: 'Visitas' },
                { key: 'tickets', label: 'Tickets' },
                { key: 'estadisticas', label: 'Estadísticas' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setDetailTab(tab.key)}
                  className={`px-4 py-2.5 text-xs font-semibold border-none cursor-pointer transition-colors rounded-t-lg ${
                    detailTab === tab.key
                      ? 'bg-bg-secondary text-accent-blue border-b-2 border-b-accent-blue'
                      : 'bg-transparent text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* INFO TAB */}
              {detailTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-bg-secondary rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase size={13} className="text-text-muted" />
                        <span className="text-[10px] text-text-muted uppercase">Cargo</span>
                      </div>
                      <p className="text-sm font-medium">{selectedTecnico.cargo}</p>
                    </div>
                    <div className="bg-bg-secondary rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Wrench size={13} className="text-text-muted" />
                        <span className="text-[10px] text-text-muted uppercase">Especialidad</span>
                      </div>
                      <p className="text-sm font-medium">{selectedTecnico.especialidad}</p>
                    </div>
                    <div className="bg-bg-secondary rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone size={13} className="text-text-muted" />
                        <span className="text-[10px] text-text-muted uppercase">Teléfono</span>
                      </div>
                      <p className="text-sm font-medium">{selectedTecnico.telefono}</p>
                    </div>
                    <div className="bg-bg-secondary rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail size={13} className="text-text-muted" />
                        <span className="text-[10px] text-text-muted uppercase">Email</span>
                      </div>
                      <p className="text-sm font-medium">{selectedTecnico.email || '—'}</p>
                    </div>
                    <div className="bg-bg-secondary rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin size={13} className="text-text-muted" />
                        <span className="text-[10px] text-text-muted uppercase">Zona</span>
                      </div>
                      <p className="text-sm font-medium">{selectedTecnico.zona}</p>
                    </div>
                    <div className="bg-bg-secondary rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield size={13} className="text-text-muted" />
                        <span className="text-[10px] text-text-muted uppercase">Estado</span>
                      </div>
                      <p className="text-sm font-medium">{selectedTecnico.estado}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => { openEdit(selectedTecnico); }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent-blue/10 text-accent-blue text-xs font-semibold border-none cursor-pointer hover:bg-accent-blue/20 transition-colors"
                    >
                      <Edit3 size={13} /> Editar Técnico
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(selectedTecnico)}
                      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-accent-red/10 text-accent-red text-xs font-semibold border-none cursor-pointer hover:bg-accent-red/20 transition-colors"
                    >
                      <Trash2 size={13} /> Eliminar
                    </button>
                  </div>
                </div>
              )}

              {/* VISITAS TAB */}
              {detailTab === 'visitas' && (() => {
                const tecVisitas = getTecnicoVisitas(selectedTecnico.id);
                return (
                  <div className="space-y-3">
                    {tecVisitas.length === 0 && (
                      <div className="text-center py-10">
                        <Calendar size={32} className="mx-auto mb-2 text-text-muted opacity-40" />
                        <p className="text-text-muted text-sm">Sin visitas asignadas</p>
                      </div>
                    )}
                    {tecVisitas.map(v => {
                      const visitaEstadoColor = v.estado === 'Completada'
                        ? 'bg-accent-green/15 text-accent-green'
                        : v.estado === 'Programada'
                          ? 'bg-accent-blue/15 text-accent-blue'
                          : v.estado === 'Cancelada'
                            ? 'bg-accent-red/15 text-accent-red'
                            : 'bg-accent-yellow/15 text-accent-yellow';
                      return (
                        <div key={v.id} className="bg-bg-secondary rounded-xl p-4 border border-border">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-text-muted">{v.id}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${visitaEstadoColor}`}>
                                {v.estado}
                              </span>
                            </div>
                            <span className="text-[11px] text-text-muted">{v.fecha}</span>
                          </div>
                          <p className="text-sm font-medium mb-1">{v.clienteNombre}</p>
                          <p className="text-xs text-text-secondary mb-2">{v.descripcion}</p>
                          <div className="flex items-center gap-4 text-[11px] text-text-muted">
                            <span className="flex items-center gap-1">
                              <Clock size={10} /> {v.horaInicio}{v.horaFin ? ` - ${v.horaFin}` : ''}
                            </span>
                            <span>{v.tipo}</span>
                            <span className="text-text-secondary">{v.direccion}</span>
                          </div>
                          {v.resultado && (
                            <div className="mt-2 pt-2 border-t border-border">
                              <p className="text-[11px] text-text-muted">Resultado:</p>
                              <p className="text-xs text-text-secondary">{v.resultado}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* TICKETS TAB */}
              {detailTab === 'tickets' && (() => {
                const tecTickets = getTecnicoTickets(selectedTecnico.id);
                return (
                  <div className="space-y-3">
                    {tecTickets.length === 0 && (
                      <div className="text-center py-10">
                        <AlertCircle size={32} className="mx-auto mb-2 text-text-muted opacity-40" />
                        <p className="text-text-muted text-sm">Sin tickets asignados</p>
                      </div>
                    )}
                    {tecTickets.map(t => {
                      const ticketColor = t.estado === 'Abierto'
                        ? 'bg-accent-red/15 text-accent-red'
                        : t.estado === 'En Proceso'
                          ? 'bg-accent-yellow/15 text-accent-yellow'
                          : t.estado === 'Resuelto'
                            ? 'bg-accent-green/15 text-accent-green'
                            : 'bg-text-muted/15 text-text-muted';
                      const prioridadColor = t.prioridad === 'Alta' || t.prioridad === 'Critica'
                        ? 'text-accent-red'
                        : t.prioridad === 'Media'
                          ? 'text-accent-yellow'
                          : 'text-accent-green';
                      return (
                        <div key={t.id} className="bg-bg-secondary rounded-xl p-4 border border-border">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-text-muted">{t.id}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ticketColor}`}>
                                {t.estado}
                              </span>
                              <span className={`text-[10px] font-semibold ${prioridadColor}`}>
                                {t.prioridad}
                              </span>
                            </div>
                            <span className="text-[11px] text-text-muted">{t.fecha}</span>
                          </div>
                          <p className="text-sm font-medium mb-1">{t.clienteNombre}</p>
                          <p className="text-xs text-text-secondary line-clamp-2">{t.descripcion}</p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-text-muted">
                            <span>{t.tipo}</span>
                            <span>Actualizado: {t.fechaUpdate}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* ESTADISTICAS TAB */}
              {detailTab === 'estadisticas' && (() => {
                const st = getTecnicoStats(selectedTecnico.id);
                const tecVisitas = getTecnicoVisitas(selectedTecnico.id);
                const tecTickets = getTecnicoTickets(selectedTecnico.id);

                const visitasPorTipo = tecVisitas.reduce((acc, v) => {
                  acc[v.tipo] = (acc[v.tipo] || 0) + 1;
                  return acc;
                }, {});

                const ticketsPorEstado = tecTickets.reduce((acc, t) => {
                  acc[t.estado] = (acc[t.estado] || 0) + 1;
                  return acc;
                }, {});

                return (
                  <div className="space-y-5">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                      <div className="bg-bg-secondary rounded-xl p-4 text-center">
                        <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center bg-accent-blue/10">
                          <Activity size={18} className="text-accent-blue" />
                        </div>
                        <p className="text-xl font-bold font-mono">{st.totalVisitas}</p>
                        <p className="text-[10px] text-text-muted uppercase">Total Visitas</p>
                      </div>
                      <div className="bg-bg-secondary rounded-xl p-4 text-center">
                        <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center bg-accent-green/10">
                          <CheckCircle2 size={18} className="text-accent-green" />
                        </div>
                        <p className="text-xl font-bold font-mono">{st.completadas}</p>
                        <p className="text-[10px] text-text-muted uppercase">Completadas</p>
                      </div>
                      <div className="bg-bg-secondary rounded-xl p-4 text-center">
                        <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center bg-accent-yellow/10">
                          <AlertCircle size={18} className="text-accent-yellow" />
                        </div>
                        <p className="text-xl font-bold font-mono">{st.ticketsAbiertos}</p>
                        <p className="text-[10px] text-text-muted uppercase">Tickets Abiertos</p>
                      </div>
                      <div className="bg-bg-secondary rounded-xl p-4 text-center">
                        <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center bg-accent-green/10">
                          <CheckCircle2 size={18} className="text-accent-green" />
                        </div>
                        <p className="text-xl font-bold font-mono">{st.ticketsResueltos}</p>
                        <p className="text-[10px] text-text-muted uppercase">Tickets Resueltos</p>
                      </div>
                    </div>

                    {/* Tasa de completado */}
                    <div className="bg-bg-secondary rounded-xl p-4">
                      <p className="text-[11px] text-text-muted uppercase mb-2">Tasa de Completado (Visitas)</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-green rounded-full transition-all"
                            style={{ width: `${st.totalVisitas > 0 ? Math.round((st.completadas / st.totalVisitas) * 100) : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold font-mono text-accent-green">
                          {st.totalVisitas > 0 ? Math.round((st.completadas / st.totalVisitas) * 100) : 0}%
                        </span>
                      </div>
                    </div>

                    {/* Visitas por Tipo */}
                    {Object.keys(visitasPorTipo).length > 0 && (
                      <div className="bg-bg-secondary rounded-xl p-4">
                        <p className="text-[11px] text-text-muted uppercase mb-3">Visitas por Tipo</p>
                        <div className="space-y-2">
                          {Object.entries(visitasPorTipo).map(([tipo, count]) => (
                            <div key={tipo} className="flex items-center justify-between">
                              <span className="text-xs text-text-secondary">{tipo}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-accent-blue rounded-full"
                                    style={{ width: `${(count / st.totalVisitas) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-mono font-bold w-6 text-right">{count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tickets por Estado */}
                    {Object.keys(ticketsPorEstado).length > 0 && (
                      <div className="bg-bg-secondary rounded-xl p-4">
                        <p className="text-[11px] text-text-muted uppercase mb-3">Tickets por Estado</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(ticketsPorEstado).map(([estado, count]) => {
                            const colorMap = {
                              'Abierto': 'bg-accent-red/15 text-accent-red',
                              'En Proceso': 'bg-accent-yellow/15 text-accent-yellow',
                              'Resuelto': 'bg-accent-green/15 text-accent-green',
                              'Cerrado': 'bg-text-muted/15 text-text-muted',
                            };
                            return (
                              <span
                                key={estado}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${colorMap[estado] || 'bg-bg-card text-text-secondary'}`}
                              >
                                {estado}: {count}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Empty state for stats */}
                    {st.totalVisitas === 0 && st.totalTickets === 0 && (
                      <div className="text-center py-8">
                        <Activity size={32} className="mx-auto mb-2 text-text-muted opacity-40" />
                        <p className="text-text-muted text-sm">Sin actividad registrada</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION ==================== */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-bg-card rounded-2xl border border-border w-full max-w-sm shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent-red/10 mx-auto mb-4">
              <Trash2 size={22} className="text-accent-red" />
            </div>
            <h3 className="text-base font-bold text-center mb-2">Eliminar Técnico</h3>
            <p className="text-sm text-text-secondary text-center mb-1">
              Esta acción no se puede deshacer.
            </p>
            <p className="text-sm text-text-primary text-center font-semibold mb-5">
              {showDeleteConfirm.nombre}
            </p>

            {(() => {
              const assignedVisitas = getTecnicoVisitas(showDeleteConfirm.id).filter(v => v.estado === 'Programada' || v.estado === 'En Ruta' || v.estado === 'En Sitio');
              const assignedTickets = getTecnicoTickets(showDeleteConfirm.id).filter(t => t.estado === 'Abierto' || t.estado === 'En Proceso');
              if (assignedVisitas.length > 0 || assignedTickets.length > 0) {
                return (
                  <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg p-3 mb-4">
                    <p className="text-[11px] text-accent-yellow font-semibold mb-1">Advertencia</p>
                    <p className="text-[11px] text-text-secondary">
                      Este técnico tiene {assignedVisitas.length > 0 ? `${assignedVisitas.length} visita(s) activa(s)` : ''}
                      {assignedVisitas.length > 0 && assignedTickets.length > 0 ? ' y ' : ''}
                      {assignedTickets.length > 0 ? `${assignedTickets.length} ticket(s) abierto(s)` : ''}.
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary text-sm cursor-pointer hover:bg-white/[0.04] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm.id)}
                className="flex-1 py-2.5 rounded-lg bg-accent-red text-white text-sm font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
