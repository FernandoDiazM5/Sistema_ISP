import { useState, useMemo, useEffect } from 'react';
import { Plus, Zap, AlertTriangle, Wrench, CheckCircle2, Users, X, MapPin, Calendar, Kanban, ArrowUpRight, ShieldAlert, Search, Pencil, Eye, Edit3, Trash2 } from 'lucide-react';
import useStore from '../../store/useStore';
import Adjuntos, { AdjuntosCount } from '../common/Adjuntos';
import ResolutionModal from '../common/ResolutionModal';
import CopyButton from '../common/CopyButton';
import { formatAveria } from '../../utils/whatsappFormats';
import StatusBadge from '../ui/StatusBadge';
import useToast from '../../hooks/useToast';

const DOT_COLORS = {
  'Activa': 'bg-accent-red',
  'En reparación': 'bg-accent-yellow',
  'Coordinando': 'bg-accent-blue',
  'Resuelta': 'bg-accent-green',
};

export default function AveriasPage() {
  const averias = useStore(s => s.averias);
  const addAveria = useStore(s => s.addAveria);
  const updateAveria = useStore(s => s.updateAveria);
  const tickets = useStore(s => s.tickets);
  const clients = useStore(s => s.clients);
  const updateTicket = useStore(s => s.updateTicket);
  // Selector reactivo — reemplaza useStore.getState() en render (bug #10)
  const tecnicos = useStore(s => s.tecnicos);
  const averiasTipos = useStore(s => s.averiasTipos);
  const deleteAveria = useStore(s => s.deleteAveria);
  const toast = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingAveria, setEditingAveria] = useState(null);
  const [selectedAveria, setSelectedAveria] = useState(null);
  const [filterEstado, setFilterEstado] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newAdjuntos, setNewAdjuntos] = useState([]);

  // Resolution Modal State
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionTargetId, setResolutionTargetId] = useState(null);
  // Smart Resolve: confirmación no-bloqueante (reemplaza window.confirm/alert)
  const [smartResolveState, setSmartResolveState] = useState(null); // { averia, ticketsToResolve }

  // Sync selectedAveria with store updates (Real-time reactivity)
  useEffect(() => {
    if (selectedAveria) {
      const updated = averias.find(a => a.id === selectedAveria.id);
      if (updated && updated !== selectedAveria) {
        setSelectedAveria(updated);
      }
    }
  }, [averias, selectedAveria]);

  const filtered = useMemo(() => {
    let list = filterEstado === 'all' ? averias : averias.filter(a => a.estado === filterEstado);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(a =>
        (a.tipo || '').toLowerCase().includes(term) ||
        (a.zona || '').toLowerCase().includes(term) ||
        (a.nodo || '').toLowerCase().includes(term) ||
        (a.descripcion || '').toLowerCase().includes(term) ||
        (a.tecnicoAsignado || '').toLowerCase().includes(term) ||
        (a.id || '').toLowerCase().includes(term)
      );
    }
    return list;
  }, [averias, filterEstado, searchTerm]);

  const stats = useMemo(() => ({
    activas: averias.filter(a => a.estado === 'Activa').length,
    enReparacion: averias.filter(a => a.estado === 'En reparación').length,
    resueltas: averias.filter(a => a.estado === 'Resuelta').length,
    totalAfectados: averias.filter(a => a.estado !== 'Resuelta').reduce((s, a) => s + (a.clientesAfectados || 0), 0),
  }), [averias]);

  const openCreateForm = () => {
    setEditingAveria(null);
    setNewAdjuntos([]);
    setShowForm(true);
  };

  const openEditForm = (averia) => {
    setEditingAveria(averia);
    setNewAdjuntos(averia.adjuntos || []);
    setSelectedAveria(null);
    setShowForm(true);
  };

  const handleSubmitAveria = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = {
      tipo: form.get('tipo'),
      zona: form.get('zona'),
      nodo: form.get('nodo'),
      clientesAfectados: parseInt(form.get('afectados')) || 0,
      prioridad: form.get('prioridad'),
      reportadoPor: form.get('reportado'),
      tecnicoAsignado: form.get('tecnico'),
      descripcion: form.get('descripcion'),
      fecha: form.get('fechaReporte') || new Date().toISOString().split('T')[0],
      horaReporte: form.get('horaReporte') || null,
      adjuntos: newAdjuntos,
    };

    if (editingAveria) {
      updateAveria(editingAveria.id, { ...data, _historyComment: 'Avería editada manualmente' });
    } else {
      addAveria({ ...data, estado: 'Activa' });
    }
    setShowForm(false);
    setEditingAveria(null);
    setNewAdjuntos([]);
  };

  const handleStatusChange = (id, newEstado) => {
    if (newEstado === 'Resuelta') {
      setResolutionTargetId(id);
      setShowResolutionModal(true);
    } else {
      updateAveria(id, {
        estado: newEstado,
        _historyComment: 'Cambio de estado manual desde detalle'
      });
    }
  };

  const handleResolutionConfirm = ({ solucion, accionesRealizadas, adjuntosResolucion }) => {
    if (!resolutionTargetId) return;
    const averia = averias.find(a => a.id === resolutionTargetId);

    // 1. Resolver la avería
    updateAveria(resolutionTargetId, {
      estado: 'Resuelta',
      fechaResolucion: new Date().toISOString().split('T')[0],
      solucion,
      accionesRealizadas,
      adjuntosResolucion,
      _historyComment: 'Avería resuelta con informe de solución'
    });

    setShowResolutionModal(false);
    setResolutionTargetId(null);

    // 2. Smart Resolve: calcular tickets afectados y mostrar modal no-bloqueante
    if (averia) {
      const affectedClientIds = clients
        .filter(c =>
          c.zona?.toLowerCase().trim() === averia.zona?.toLowerCase().trim() &&
          c.nodo?.toLowerCase().trim() === averia.nodo?.toLowerCase().trim()
        )
        .map(c => c.id);

      const ticketsToResolve = tickets.filter(t =>
        (t.estado === 'Abierto' || t.estado === 'En Proceso' || t.estado === 'Escalado') &&
        affectedClientIds.includes(t.clienteId)
      );

      if (ticketsToResolve.length > 0) {
        setSmartResolveState({ averia, ticketsToResolve });
      } else {
        toast.info('Avería resuelta. No se encontraron tickets activos vinculados a la zona/nodo afectada.');
      }
    }
  };

  const handleSmartResolveConfirm = () => {
    if (!smartResolveState) return;
    const { averia, ticketsToResolve } = smartResolveState;
    ticketsToResolve.forEach(t => {
      updateTicket(t.id, {
        estado: 'Resuelto',
        _historyComment: `Autocierre corporativo por solución de Avería Masiva (${averia.id})`
      });
    });
    toast.success(`Se resolvieron automáticamente ${ticketsToResolve.length} ticket${ticketsToResolve.length > 1 ? 's' : ''} vinculados a la avería ${averia.id}.`);
    setSmartResolveState(null);
  };

  const handleSmartResolveCancel = () => {
    toast.info('Resolución registrada. Los tickets de la zona quedan sin cambios.');
    setSmartResolveState(null);
  };

  return (
    <div className="animate-fade p-4 sm:p-6 sm:px-8 h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-[26px] font-bold tracking-tight">Averias e Incidencias</h1>
          <p className="text-text-secondary text-sm mt-1">Gestión de fallas de red e infraestructura</p>
        </div>
        <button onClick={openCreateForm}
          className="py-2.5 px-4 rounded-xl bg-accent-red border-none text-white text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 transition-opacity w-full sm:w-auto">
          <Plus size={16} /> Reportar Avería
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-red/15 text-accent-red"><Zap size={16} /></div>
          <div><p className="text-lg font-bold font-mono">{stats.activas}</p><p className="text-[10px] text-text-muted uppercase">Activas</p></div>
        </div>
        <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-yellow/15 text-accent-yellow"><Wrench size={16} /></div>
          <div><p className="text-lg font-bold font-mono">{stats.enReparacion}</p><p className="text-[10px] text-text-muted uppercase">En reparación</p></div>
        </div>
        <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-green/15 text-accent-green"><CheckCircle2 size={16} /></div>
          <div><p className="text-lg font-bold font-mono">{stats.resueltas}</p><p className="text-[10px] text-text-muted uppercase">Resueltas</p></div>
        </div>
        <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-purple/15 text-accent-purple"><Users size={16} /></div>
          <div><p className="text-lg font-bold font-mono">{stats.totalAfectados}</p><p className="text-[10px] text-text-muted uppercase">Afectados</p></div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por tipo, zona, nodo, técnico..."
            className="w-full py-2 pl-9 pr-3 bg-bg-secondary border border-border text-text-primary rounded-lg text-xs outline-none focus:border-accent-blue placeholder:text-text-muted"
          />
        </div>
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          {['all', 'Activa', 'En reparación', 'Coordinando', 'Resuelta'].map(e => (
            <button key={e} onClick={() => setFilterEstado(e)}
              className={`py-1.5 px-3 sm:px-4 rounded-lg text-[11px] sm:text-xs font-semibold border cursor-pointer transition-colors
                ${filterEstado === e ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' : 'bg-bg-secondary border-border text-text-secondary hover:border-accent-blue/50'}`}>
              {e === 'all' ? 'Todas' : e}
            </button>
          ))}
        </div>
      </div>

      {/* Averias List */}
      <div className="flex flex-col gap-3">
        {filtered.map(a => {
          return (
            <div
              key={a.id}
              onClick={() => setSelectedAveria(a)}
              className="bg-bg-card rounded-xl p-5 border border-border transition-all hover:border-accent-red/30 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-red/15 text-accent-red group-hover:bg-accent-red/25 transition-colors">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-text-muted">{a.id}</span>
                      <StatusBadge status={a.estado} />
                      <span className={`text-[11px] font-bold ${a.prioridad === 'Crítica' ? 'text-accent-red' : 'text-accent-yellow'}`}>{a.prioridad}</span>
                    </div>
                    <p className="text-sm font-semibold mt-0.5">{a.tipo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton getTextFn={() => formatAveria(a, null)} />
                  <span className="text-[11px] text-text-muted">{a.fecha}</span>
                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedAveria(a); }}
                      className="p-1.5 rounded-md bg-transparent border border-transparent text-text-muted hover:text-text-primary hover:bg-bg-secondary hover:border-border transition-colors cursor-pointer"
                      title="Ver Detalles"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditForm(a); }}
                      className="p-1.5 rounded-md bg-transparent border border-transparent text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 hover:border-accent-blue/30 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`¿Eliminar la avería ${a.id}? Esta acción no se puede deshacer.`)) {
                          if (deleteAveria) deleteAveria(a.id);
                        }
                      }}
                      className="p-1.5 rounded-md bg-transparent border border-transparent text-text-muted hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-text-secondary mb-3">{a.descripcion}</p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-muted">
                <span>Zona: <span className="text-text-secondary font-medium">{a.zona}</span></span>
                <span>Nodo: <span className="text-text-secondary font-medium font-mono">{a.nodo}</span></span>
                <span>Afectados: <span className="text-accent-red font-bold">{a.clientesAfectados}</span></span>
                <span>Técnico: <span className="text-text-secondary">{a.tecnicoAsignado}</span></span>
                <AdjuntosCount count={a.adjuntos?.length} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Nueva / Editar Avería */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowForm(false); setEditingAveria(null); }}>
          <div className="bg-bg-card rounded-2xl p-6 w-full max-w-[500px] border border-border max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editingAveria ? 'Editar Avería' : 'Reportar Avería'}</h3>
            <form onSubmit={handleSubmitAveria} className="flex flex-col gap-3">
              <select name="tipo" defaultValue={editingAveria?.tipo || (averiasTipos[0]?.nombre || '')} required className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg p-2.5 text-sm outline-none focus:border-accent-blue">
                {averiasTipos.map(t => (
                  <option key={t.id} value={t.nombre}>{t.nombre}</option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <input name="zona" defaultValue={editingAveria?.zona || ''} placeholder="Zona afectada (Mínimo 3 letras)" minLength={3} required className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg p-2.5 text-sm outline-none focus:border-accent-blue" />
                <input name="nodo" defaultValue={editingAveria?.nodo || ''} placeholder="Nodo/Torre (ej: PLA1)" minLength={2} required className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg p-2.5 text-sm outline-none focus:border-accent-blue" />
              </div>

              <input name="afectados" defaultValue={editingAveria?.clientesAfectados || ''} type="number" min="0" step="1" placeholder="Clientes afectados (estimado)" required className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg p-2.5 text-sm outline-none focus:border-accent-blue" />

              {/* Fecha y Hora de Reporte */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-muted block mb-1">Fecha de reporte</label>
                  <input name="fechaReporte" type="date" defaultValue={editingAveria?.fecha || new Date().toISOString().split('T')[0]} required className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg p-2.5 text-sm outline-none focus:border-accent-blue" />
                </div>
                <div>
                  <label className="text-xs text-text-muted block mb-1">Hora de reporte</label>
                  <input name="horaReporte" type="time" defaultValue={editingAveria?.horaReporte || new Date().toTimeString().slice(0, 5)} className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg p-2.5 text-sm outline-none focus:border-accent-blue" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select name="prioridad" defaultValue={editingAveria?.prioridad || 'Crítica'} required className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg p-2.5 text-sm outline-none focus:border-accent-blue">
                  <option value="Crítica">Crítica</option>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                </select>
                <select name="tecnico" defaultValue={editingAveria?.tecnicoAsignado || ''} required className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg p-2.5 text-sm outline-none focus:border-accent-blue">
                  <option value="" disabled>Asignar Técnico...</option>
                  {tecnicos.filter(t => t.estado === 'Activo').map((t, idx) => (
                    <option key={idx} value={t.nombre}>{t.nombre}</option>
                  ))}
                  <option value="Sin asignar">Sin asignar (Pendiente)</option>
                </select>
              </div>

              <input name="reportado" defaultValue={editingAveria?.reportadoPor || ''} placeholder="Reportado por" minLength={3} required className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg p-2.5 text-sm outline-none focus:border-accent-blue" />
              <textarea name="descripcion" defaultValue={editingAveria?.descripcion || ''} placeholder="Descripción de la avería..." minLength={10}
                className="bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[80px] resize-y outline-none focus:border-accent-blue w-full" required />

              <Adjuntos value={newAdjuntos} onChange={setNewAdjuntos} max={5} />

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingAveria(null); }}
                  className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm hover:text-text-primary transition-colors">Cancelar</button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-accent-red border-none text-white cursor-pointer text-sm font-semibold hover:opacity-90 transition-opacity">
                  {editingAveria ? 'Guardar Cambios' : 'Reportar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL with History Visualization */}
      {selectedAveria && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={() => setSelectedAveria(null)}>
          <div className="bg-bg-card rounded-2xl p-4 sm:p-6 w-full max-w-[600px] border border-border max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="font-mono text-sm text-text-muted">{selectedAveria.id}</span>
                <h3 className="text-lg font-bold mt-1 text-accent-red flex items-center gap-2">
                  <AlertTriangle size={20} /> {selectedAveria.tipo}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedAveria.estado} />
                <CopyButton getTextFn={() => formatAveria(selectedAveria, null)} />
                <button
                  onClick={() => setSelectedAveria(null)}
                  className="p-1.5 rounded-lg bg-bg-secondary border border-border text-text-muted cursor-pointer hover:text-text-primary transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5">
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1 flex items-center gap-1">
                  <MapPin size={10} /> Zona / Nodo
                </p>
                <p className="text-sm font-medium">{selectedAveria.zona} <span className="text-text-muted mx-1">•</span> {selectedAveria.nodo}</p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Users size={10} /> Clientes Afectados
                </p>
                <p className="text-sm font-bold text-accent-red">{selectedAveria.clientesAfectados || 0}</p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1 flex items-center gap-1">
                  <ShieldAlert size={10} /> Prioridad
                </p>
                <p className={`text-sm font-bold ${selectedAveria.prioridad === 'Crítica' ? 'text-accent-red' : 'text-accent-yellow'}`}>
                  {selectedAveria.prioridad}
                </p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Calendar size={10} /> Fecha Reporte
                </p>
                <p className="text-sm font-medium">{selectedAveria.fecha}</p>
              </div>
              {selectedAveria.tecnicoAsignado && (
                <div className="bg-bg-secondary rounded-lg p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Técnico Asignado</p>
                  <p className="text-sm font-medium">{selectedAveria.tecnicoAsignado}</p>
                </div>
              )}
              {selectedAveria.reportadoPor && (
                <div className="bg-bg-secondary rounded-lg p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Reportado Por</p>
                  <p className="text-sm font-medium">{selectedAveria.reportadoPor}</p>
                </div>
              )}
              {selectedAveria.fechaResolucion && (
                <div className="bg-bg-secondary rounded-lg p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Fecha Resolución</p>
                  <p className="text-sm font-medium text-accent-green">{selectedAveria.fechaResolucion}</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-5">
              <p className="text-xs text-text-muted font-bold mb-2 uppercase tracking-wide">Descripción del Problema</p>
              <div className="bg-bg-secondary rounded-lg p-3 border border-border/50 text-sm text-text-primary leading-relaxed">
                {selectedAveria.descripcion}
              </div>
              {selectedAveria.adjuntos && selectedAveria.adjuntos.length > 0 && (
                <div className="mt-3">
                  <Adjuntos value={selectedAveria.adjuntos} onChange={() => { }} readOnly max={5} />
                </div>
              )}
            </div>

            {/* Resolución (si fue resuelta) */}
            {selectedAveria.solucion && (
              <div className="mb-5 bg-accent-green/5 border border-accent-green/20 rounded-lg p-3">
                <p className="text-xs text-accent-green font-bold mb-2 uppercase tracking-wide">Informe de Resolución</p>
                <div className="text-sm text-text-primary leading-relaxed mb-2">{selectedAveria.solucion}</div>
                {selectedAveria.accionesRealizadas && selectedAveria.accionesRealizadas.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Acciones Realizadas</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedAveria.accionesRealizadas.map((a, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green text-[10px] font-medium">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedAveria.adjuntosResolucion && selectedAveria.adjuntosResolucion.length > 0 && (
                  <div className="mt-3">
                    <Adjuntos value={selectedAveria.adjuntosResolucion} onChange={() => { }} readOnly max={5} />
                  </div>
                )}
              </div>
            )}

            {/* Historial (Process Route) */}
            {selectedAveria.historial && selectedAveria.historial.length > 0 && (
              <div className="bg-bg-secondary rounded-lg p-3 mb-5 border border-border/50">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-3 font-semibold flex items-center gap-1">
                  <Kanban size={12} /> Ruta de Atención
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {[...selectedAveria.historial].reverse().map((h, i, arr) => (
                    <div key={i} className="flex items-center">
                      <div
                        className="group relative flex items-center gap-2 bg-bg-card border border-border/60 rounded-full px-3 py-1.5 cursor-help transition-colors hover:border-accent-blue/50 hover:bg-bg-secondary"
                        title={h.motivo || 'Sin motivo registrado'}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${DOT_COLORS[h.estadoNuevo] || 'bg-gray-400'}`}></span>
                          <span className="text-xs font-medium text-text-primary">{h.estadoNuevo}</span>
                        </div>
                        <span className="text-border mx-1">|</span>
                        <span className="text-[10px] text-text-muted font-mono leading-none">
                          {new Date(h.fecha).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {/* Tooltip */}
                        {h.motivo && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] hidden group-hover:block z-50">
                            <div className="bg-gray-900 text-white text-[10px] p-2 rounded shadow-xl border border-white/10 relative">
                              {h.motivo}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        )}
                      </div>
                      {i < arr.length - 1 && (
                        <div className="mx-1 text-text-muted/40">
                          <ArrowUpRight size={14} strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="mx-1 text-text-muted/40">
                    <ArrowUpRight size={14} strokeWidth={1.5} />
                  </div>
                  <div className="px-2 py-1 rounded bg-accent-blue/10 border border-accent-blue/30 text-[10px] font-bold text-accent-blue uppercase tracking-wider">
                    Actual
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-border mt-5 pt-4">
              <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2">Acciones</p>
              <div className="flex gap-2 flex-wrap">
                {selectedAveria.estado === 'Activa' && (
                  <button
                    onClick={() => handleStatusChange(selectedAveria.id, 'En reparación')}
                    className="flex-1 py-2.5 rounded-lg bg-accent-yellow/20 text-accent-yellow border-none text-xs font-bold cursor-pointer hover:bg-accent-yellow/30 transition-colors"
                  >
                    Iniciar Reparación
                  </button>
                )}
                {selectedAveria.estado === 'En reparación' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedAveria.id, 'Resuelta')}
                      className="flex-1 py-2.5 rounded-lg bg-accent-green/20 text-accent-green border-none text-xs font-bold cursor-pointer hover:bg-accent-green/30 transition-colors"
                    >
                      Marcar Resuelta
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedAveria.id, 'Coordinando')}
                      className="flex-1 py-2.5 rounded-lg bg-accent-blue/20 text-accent-blue border-none text-xs font-bold cursor-pointer hover:bg-accent-blue/30 transition-colors"
                    >
                      Coordinando / Reprogramar
                    </button>
                  </>
                )}
                {selectedAveria.estado === 'Coordinando' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedAveria.id, 'En reparación')}
                      className="flex-1 py-2.5 rounded-lg bg-accent-yellow/20 text-accent-yellow border-none text-xs font-bold cursor-pointer hover:bg-accent-yellow/30 transition-colors"
                    >
                      Retomar Reparación
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedAveria.id, 'Resuelta')}
                      className="flex-1 py-2.5 rounded-lg bg-accent-green/20 text-accent-green border-none text-xs font-bold cursor-pointer hover:bg-accent-green/30 transition-colors"
                    >
                      Marcar Resuelta
                    </button>
                  </>
                )}
                {selectedAveria.estado === 'Resuelta' && (
                  <button
                    onClick={() => handleStatusChange(selectedAveria.id, 'Activa')}
                    className="flex-1 py-2.5 rounded-lg bg-accent-red/20 text-accent-red border-none text-xs font-bold cursor-pointer hover:bg-accent-red/30 transition-colors"
                  >
                    Reabrir Avería
                  </button>
                )}
                {selectedAveria.estado !== 'Resuelta' && (
                  <button
                    onClick={() => openEditForm(selectedAveria)}
                    className="py-2.5 px-4 rounded-lg bg-accent-blue/20 text-accent-blue border-none text-xs font-bold cursor-pointer hover:bg-accent-blue/30 transition-colors flex items-center gap-1"
                  >
                    <Pencil size={12} /> Editar
                  </button>
                )}
                <button
                  onClick={() => setSelectedAveria(null)}
                  className="py-2.5 px-4 rounded-lg bg-bg-secondary border border-border text-text-secondary font-medium text-xs cursor-pointer hover:bg-bg-card-hover transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
      {/* Smart Resolve — confirmación no-bloqueante para cierre automático de tickets */}
      {smartResolveState && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-card border border-accent-yellow/30 rounded-2xl w-full max-w-[460px] shadow-2xl overflow-hidden">
            <div className="bg-accent-yellow/10 p-5 flex items-center gap-3 border-b border-accent-yellow/20">
              <div className="w-11 h-11 rounded-xl bg-accent-yellow/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={22} className="text-accent-yellow" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Cierre automático de tickets</h3>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Zona: {smartResolveState.averia.zona} — Nodo: {smartResolveState.averia.nodo}
                </p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-text-secondary mb-4">
                Se encontraron{' '}
                <span className="font-bold text-text-primary">
                  {smartResolveState.ticketsToResolve.length} ticket{smartResolveState.ticketsToResolve.length > 1 ? 's' : ''}
                </span>{' '}
                activos vinculados a los clientes de esta zona/nodo. ¿Marcarlos como{' '}
                <span className="font-semibold text-accent-green">Resueltos</span> automáticamente?
              </p>
              <div className="max-h-[120px] overflow-y-auto flex flex-col gap-1 mb-4">
                {smartResolveState.ticketsToResolve.map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-xs bg-bg-secondary rounded-lg px-3 py-1.5">
                    <span className="font-mono text-text-muted">{t.id}</span>
                    <span className="text-text-primary truncate">{t.clienteNombre}</span>
                    <StatusBadge status={t.estado} size="sm" className="ml-auto" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border-t border-border">
              <button
                onClick={handleSmartResolveCancel}
                className="flex-1 py-2.5 px-4 rounded-xl bg-bg-secondary border border-border text-sm font-semibold text-text-secondary hover:bg-bg-tertiary transition-colors cursor-pointer"
              >
                Solo la avería
              </button>
              <button
                onClick={handleSmartResolveConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-accent-green border-none text-white text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={14} />
                Resolver {smartResolveState.ticketsToResolve.length} ticket{smartResolveState.ticketsToResolve.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      <ResolutionModal
        open={showResolutionModal}
        onClose={() => {
          setShowResolutionModal(false);
          setResolutionTargetId(null);
        }}
        onConfirm={handleResolutionConfirm}
        title="Resolver Avería"
        entityId={resolutionTargetId}
        entityLabel="Avería"
        newStatus="Resuelta"
        accentColor="accent-green"
      />
    </div>
  );
}
