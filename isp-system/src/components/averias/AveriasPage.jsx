import { useState, useMemo, useEffect } from 'react';
import { Plus, Zap, AlertTriangle, Wrench, CheckCircle2, Users, X, MapPin, Calendar, Kanban, ArrowUpRight, ShieldAlert } from 'lucide-react';
import useStore from '../../store/useStore';
import Adjuntos, { AdjuntosCount } from '../common/Adjuntos';
import ResolutionModal from '../common/ResolutionModal';
import CopyButton from '../common/CopyButton';
import { formatAveria } from '../../utils/whatsappFormats';

const ESTADO_STYLE = {
  'Activa': { bg: 'bg-accent-red/20', text: 'text-accent-red', dot: 'bg-accent-red' },
  'En reparación': { bg: 'bg-accent-yellow/20', text: 'text-accent-yellow', dot: 'bg-accent-yellow' },
  'Coordinando': { bg: 'bg-accent-blue/20', text: 'text-accent-blue', dot: 'bg-accent-blue' },
  'Resuelta': { bg: 'bg-accent-green/20', text: 'text-accent-green', dot: 'bg-accent-green' },
};

export default function AveriasPage() {
  const averias = useStore(s => s.averias);
  const addAveria = useStore(s => s.addAveria);
  const updateAveria = useStore(s => s.updateAveria);

  const [showForm, setShowForm] = useState(false);
  const [selectedAveria, setSelectedAveria] = useState(null);
  const [filterEstado, setFilterEstado] = useState('all');
  const [newAdjuntos, setNewAdjuntos] = useState([]);

  // Resolution Modal State
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionTargetId, setResolutionTargetId] = useState(null);

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
    return filterEstado === 'all' ? averias : averias.filter(a => a.estado === filterEstado);
  }, [averias, filterEstado]);

  const stats = useMemo(() => ({
    activas: averias.filter(a => a.estado === 'Activa').length,
    enReparacion: averias.filter(a => a.estado === 'En reparación').length,
    resueltas: averias.filter(a => a.estado === 'Resuelta').length,
    totalAfectados: averias.filter(a => a.estado !== 'Resuelta').reduce((s, a) => s + a.clientesAfectados, 0),
  }), [averias]);

  const handleNewAveria = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    addAveria({
      tipo: form.get('tipo'),
      zona: form.get('zona'),
      nodo: form.get('nodo'),
      clientesAfectados: parseInt(form.get('afectados')) || 0,
      estado: 'Activa',
      prioridad: form.get('prioridad'),
      reportadoPor: form.get('reportado'),
      tecnicoAsignado: form.get('tecnico'),
      descripcion: form.get('descripcion'),
      adjuntos: newAdjuntos,
    });
    setShowForm(false);
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
    if (resolutionTargetId) {
      updateAveria(resolutionTargetId, {
        estado: 'Resuelta',
        fechaResolucion: new Date().toISOString().split('T')[0],
        solucion,
        accionesRealizadas, // Optional extra field if store supports it or just merge into desc
        adjuntosResolucion,
        _historyComment: 'Avería resuelta con informe de solución'
      });
      setShowResolutionModal(false);
      setResolutionTargetId(null);
    }
  };

  return (
    <div className="animate-fade p-4 sm:p-6 sm:px-8 h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-[26px] font-bold tracking-tight">Averias e Incidencias</h1>
          <p className="text-text-secondary text-sm mt-1">Gestión de fallas de red e infraestructura</p>
        </div>
        <button onClick={() => setShowForm(true)}
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

      {/* Filters */}
      <div className="flex gap-2 sm:gap-3 mb-5 flex-wrap">
        {['all', 'Activa', 'En reparación', 'Coordinando', 'Resuelta'].map(e => (
          <button key={e} onClick={() => setFilterEstado(e)}
            className={`py-1.5 px-3 sm:px-4 rounded-lg text-[11px] sm:text-xs font-semibold border cursor-pointer transition-colors
              ${filterEstado === e ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' : 'bg-bg-secondary border-border text-text-secondary hover:border-accent-blue/50'}`}>
            {e === 'all' ? 'Todas' : e}
          </button>
        ))}
      </div>

      {/* Averias List */}
      <div className="flex flex-col gap-3">
        {filtered.map(a => {
          const es = ESTADO_STYLE[a.estado] || ESTADO_STYLE['Activa'];
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
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${es.bg} ${es.text}`}>{a.estado}</span>
                      <span className={`text-[11px] font-bold ${a.prioridad === 'Crítica' ? 'text-accent-red' : 'text-accent-yellow'}`}>{a.prioridad}</span>
                    </div>
                    <p className="text-sm font-semibold mt-0.5">{a.tipo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton getTextFn={() => formatAveria(a, null)} />
                  <span className="text-[11px] text-text-muted">{a.fecha}</span>
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

      {/* Modal: Nueva Avería */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-bg-card rounded-2xl p-6 w-full max-w-[500px] border border-border max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Reportar Avería</h3>
            <form onSubmit={handleNewAveria} className="flex flex-col gap-3">
              <select name="tipo" required className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg p-2.5 text-sm outline-none focus:border-accent-blue">
                <option value="Corte de fibra">Corte de fibra</option>
                <option value="Caída de nodo">Caída de nodo</option>
                <option value="Interferencia">Interferencia</option>
                <option value="Falla eléctrica">Falla eléctrica</option>
                <option value="Daño de equipo">Daño de equipo</option>
                <option value="Otra">Otra</option>
              </select>
              <input name="zona" placeholder="Zona afectada (ej: PLANICIE 1)" required className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg p-2.5 text-sm outline-none focus:border-accent-blue" />
              <input name="nodo" placeholder="Nodo/Torre afectado (ej: PLA1/ND2)" required className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg p-2.5 text-sm outline-none focus:border-accent-blue" />
              <input name="afectados" type="number" placeholder="Clientes afectados (estimado)" required className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg p-2.5 text-sm outline-none focus:border-accent-blue" />
              <select name="prioridad" required className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg p-2.5 text-sm outline-none focus:border-accent-blue">
                <option value="Crítica">Crítica</option>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
              </select>
              <input name="reportado" placeholder="Reportado por" required className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg p-2.5 text-sm outline-none focus:border-accent-blue" />
              <input name="tecnico" placeholder="Técnico asignado" required className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg p-2.5 text-sm outline-none focus:border-accent-blue" />
              <textarea name="descripcion" placeholder="Descripción de la avería..."
                className="bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[80px] resize-y outline-none focus:border-accent-blue w-full" required />

              <Adjuntos value={newAdjuntos} onChange={setNewAdjuntos} max={5} />

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm hover:text-text-primary transition-colors">Cancelar</button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-accent-red border-none text-white cursor-pointer text-sm font-semibold hover:opacity-90 transition-opacity">Reportar</button>
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
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${ESTADO_STYLE[selectedAveria.estado]?.bg || ''} ${ESTADO_STYLE[selectedAveria.estado]?.text || ''}`}>
                  {selectedAveria.estado}
                </span>
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
                <p className="text-sm font-bold text-accent-red">{selectedAveria.clientesAfectados}</p>
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
                          <span className={`w-2 h-2 rounded-full ${ESTADO_STYLE[h.estadoNuevo]?.dot || 'bg-gray-400'}`}></span>
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
              <div className="flex gap-2">
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
