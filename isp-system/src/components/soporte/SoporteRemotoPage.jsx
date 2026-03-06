import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Monitor, Plus, Wifi, Terminal, Activity, CheckCircle2,
  Search, Gauge, Signal, X, Eye,
  AlertTriangle, Clock, FileText
} from 'lucide-react';
import useStore from '../../store/useStore';
import useToast from '../../hooks/useToast';
import Adjuntos, { AdjuntosCount } from '../common/Adjuntos';
import ResolutionModal from '../common/ResolutionModal';
import DiagnosticFields, { getEmptyDiag } from '../common/DiagnosticFields';
import CopyButton from '../common/CopyButton';
import StatusBadge from '../ui/StatusBadge';
import { formatSoporteRemoto } from '../../utils/whatsappFormats';

/* ========================= CONSTANTS ========================= */
const TIPO_STYLE = {
  'Diagnóstico': { bg: 'bg-accent-cyan/15', text: 'text-accent-cyan' },
  'Configuración': { bg: 'bg-accent-purple/15', text: 'text-accent-purple' },
  'Monitoreo': { bg: 'bg-accent-blue/15', text: 'text-accent-blue' },
  'Reinicio remoto': { bg: 'bg-accent-orange/15', text: 'text-accent-orange' },
};

// TIPOS_SESION viene del store (tiposSesionSoporte)

/* ========================= AUTOCOMPLETE COMPONENT ========================= */
function Autocomplete({ label, placeholder, items, value, onChange, renderItem, filterFn, disabled, readOnlyDisplay }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query || query.length < 2) return [];
    return items.filter(item => filterFn(item, query.toLowerCase())).slice(0, 15);
  }, [items, query, filterFn]);

  if (disabled && readOnlyDisplay) {
    return (
      <div>
        <label className="text-xs text-text-secondary font-medium mb-1.5 block">{label}</label>
        <div className="w-full px-3 py-2.5 rounded-lg bg-bg-secondary/50 border border-border text-sm text-text-secondary cursor-not-allowed">
          {readOnlyDisplay}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <label className="text-xs text-text-secondary font-medium mb-1.5 block">{label}</label>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder={placeholder}
          value={value ? (renderItem ? renderItem(value) : value) : query}
          onChange={(e) => {
            if (value) onChange(null);
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => { if (query.length >= 2) setOpen(true); }}
          className="w-full pl-9 pr-8 py-2.5 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
        />
        {value && (
          <button type="button" onClick={() => { onChange(null); setQuery(''); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary bg-transparent border-none cursor-pointer p-1">
            <X size={14} />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-bg-card border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {filtered.map((item, idx) => (
            <button key={idx} type="button"
              onClick={() => { onChange(item); setQuery(''); setOpen(false); }}
              className="w-full px-3 py-2 text-left hover:bg-bg-secondary text-sm text-text-primary border-none bg-transparent cursor-pointer border-b border-b-border/30 last:border-b-0">
              {renderItem ? renderItem(item) : String(item)}
            </button>
          ))}
        </div>
      )}
      {open && query.length >= 2 && filtered.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-bg-card border border-border rounded-lg shadow-xl p-3 text-sm text-text-muted text-center">
          Sin resultados
        </div>
      )}
    </div>
  );
}

/* ========================= DIAGNOSTIC INPUT ========================= */


/* ========================= MAIN COMPONENT ========================= */
export default function SoporteRemotoPage() {
  const toast = useToast();
  const sesiones = useStore(s => s.sesionesRemoto);
  const addSesion = useStore(s => s.addSesionRemoto);
  const updateSesion = useStore(s => s.updateSesionRemoto);
  const tiposSesionSoporte = useStore(s => s.tiposSesionSoporte);
  const clients = useStore(s => s.clients);
  const tickets = useStore(s => s.tickets);
  const updateTicket = useStore(s => s.updateTicket);
  const resolveTicketChain = useStore(s => s.resolveTicketChain);
  const tecnicos = useStore(s => s.tecnicos);
  const addVisita = useStore(s => s.addVisita);
  const addDerivacion = useStore(s => s.addDerivacion);
  const prefillSoporte = useStore(s => s.prefillSoporte);
  const clearPrefillSoporte = useStore(s => s.clearPrefillSoporte);
  const deleteSesionRemoto = useStore(s => s.deleteSesionRemoto);

  const [showForm, setShowForm] = useState(false);
  const [selectedSesion, setSelectedSesion] = useState(null);

  /* ---- Filters ---- */
  const [search, setSearch] = useState('');

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  /* ---- Form State ---- */
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [tipoSesion, setTipoSesion] = useState('Diagnóstico');
  const [ipAddress, setIpAddress] = useState('');
  const [tecnicoId, setTecnicoId] = useState('');
  const [resultado, setResultado] = useState('');
  const [derivarVisita, setDerivarVisita] = useState(false);
  const [adjuntos, setAdjuntos] = useState([]);
  const [tecnologiaSesion, setTecnologiaSesion] = useState('');

  /* ---- Resolution Modal State ---- */
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionTarget, setResolutionTarget] = useState(null);
  const [derivacionDiag, setDerivacionDiag] = useState(getEmptyDiag());
  const [derivacionTecnologia, setDerivacionTecnologia] = useState('');

  /* ---- Confirmación de derivación ---- */
  const [confirmDerivacion, setConfirmDerivacion] = useState(null); // null | { type: 'visita'|'planta' }

  /* ---- Diagnostic State ---- */
  const [diag, setDiag] = useState(getEmptyDiag());

  // Reset and prefill diag when selecting session
  useEffect(() => {
    if (selectedSesion) {
      setDerivacionDiag(selectedSesion.diagnosticos ? { ...selectedSesion.diagnosticos } : getEmptyDiag());
      setDerivacionTecnologia(selectedSesion.tecnologia || '');
    }
  }, [selectedSesion]);

  // Sync technology from client
  useEffect(() => {
    if (selectedClient) {
      setTecnologiaSesion(selectedClient.tecnologia || '');
    } else {
      setTecnologiaSesion('');
    }
  }, [selectedClient]);

  /* ---- Derived ---- */
  const activeTecnicos = useMemo(() => tecnicos.filter(t => t.estado === 'Activo'), [tecnicos]);

  const clientTech = useMemo(() => {
    if (!selectedClient) return { isRadio: false, isFibra: false };
    const tech = (selectedClient.tecnologia || '').toLowerCase();
    return {
      isRadio: tech.includes('radio'),
      isFibra: tech.includes('fibra'),
    };
  }, [selectedClient]);

  const stats = useMemo(() => ({
    pendiente: sesiones.filter(s => s.estado === 'Pendiente').length,
    enCurso: sesiones.filter(s => s.estado === 'En curso').length,
    completadas: sesiones.filter(s => s.estado === 'Completada').length,
    fallidas: sesiones.filter(s => s.estado === 'Fallida' || s.estado?.startsWith('Derivado')).length,
    total: sesiones.length,
  }), [sesiones]);

  const filteredSesiones = useMemo(() => {
    return sesiones.filter(s => {
      const matchesSearch = !search ||
        s.clienteNombre.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase()) ||
        (s.ticketId && s.ticketId.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || s.estado === filterStatus;
      const matchesType = filterType === 'all' || s.tipo === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [sesiones, search, filterStatus, filterType]);

  /* ---- Prefill from store ---- */
  useEffect(() => {
    if (prefillSoporte) {
      resetForm();

      if (prefillSoporte.ticketId) {
        const tk = tickets.find(t => t.id === prefillSoporte.ticketId);
        if (tk) {
          setSelectedTicket(tk);
          const cl = clients.find(c => c.id === tk.clienteId);
          if (cl) {
            setSelectedClient(cl);
            setIpAddress(cl.ip || '');
          }
        }
      } else if (prefillSoporte.clienteId) {
        const cl = clients.find(c => c.id === prefillSoporte.clienteId);
        if (cl) {
          setSelectedClient(cl);
          setIpAddress(cl.ip || '');
        }
      }

      setShowForm(true);
      clearPrefillSoporte();
    }
  }, [prefillSoporte, tickets, clients, clearPrefillSoporte]);

  /* ---- Reset Form ---- */
  const resetForm = () => {
    setSelectedTicket(null);
    setSelectedClient(null);
    setTipoSesion('Diagnóstico');
    setIpAddress('');
    setTecnicoId('');
    setResultado('');
    setDerivarVisita(false);
    setAdjuntos([]);
    setTecnologiaSesion('');
    setDiag(getEmptyDiag());
  };

  /* ---- Ticket autocomplete handlers ---- */
  const handleTicketSelect = (ticket) => {
    setSelectedTicket(ticket);
    if (ticket) {
      const cl = clients.find(c => c.id === ticket.clienteId);
      if (cl) {
        setSelectedClient(cl);
        setIpAddress(cl.ip || '');
      }
    } else {
      setSelectedClient(null);
      setIpAddress('');
    }
  };

  /* ---- Client autocomplete handler ---- */
  const handleClientSelect = (client) => {
    setSelectedClient(client);
    if (client) {
      setIpAddress(client.ip || '');
    } else {
      setIpAddress('');
    }
  };

  /* ---- Submit ---- */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedClient) return;

    const tecnicoObj = tecnicos.find(t => t.id === tecnicoId);
    const hasDiag = Object.values(diag).some(v => v !== '' && v !== null && v !== undefined);

    const diagnosticos = hasDiag ? { ...diag } : null;

    const sesionData = {
      clienteId: selectedClient.id,
      clienteNombre: selectedClient.nombre || 'N/A',
      tipo: tipoSesion,
      ip: ipAddress,
      estado: 'En curso',
      fechaInicio: new Date().toISOString(),
      tecnico: tecnicoObj?.nombre || 'Sin asignar',
      tecnicoId: tecnicoId,
      duracion: '—',
      resultado: resultado,
      ticketId: selectedTicket?.id || null,
      ticketDesc: selectedTicket?.descripcion || null,
      tecnologia: tecnologiaSesion || selectedClient.tecnologia || '',
      plan: selectedClient.plan || '',
      direccion: selectedClient.direccion || '',
      nodo: selectedClient.nodo || '',
      diagnosticos: diagnosticos,
      adjuntos: adjuntos,
    };

    addSesion(sesionData);
    toast.success(`Sesión ${tipoSesion} iniciada para ${selectedClient.nombre}`);

    if (derivarVisita && selectedClient) {
      addVisita({
        clienteId: selectedClient.id,
        clienteNombre: selectedClient.nombre,
        tecnicoId: tecnicoId,
        tecnicoNombre: tecnicoObj?.nombre || 'Sin asignar',
        tipo: 'Diagnóstico',
        estado: 'Programada',
        prioridad: 'Media',
        direccion: selectedClient.direccion || '',
        descripcion: `Derivado de sesión remota (${tipoSesion}). ${resultado}`,
        resultado: '',
        horaInicio: null,
        horaFin: null,
        ticketId: selectedTicket?.id || null,
      });
    }

    setShowForm(false);
    resetForm();
  };

  /* ---- Status Change Handler ---- */
  const handleStatusChange = (sesionId, newEstado) => {
    if (newEstado === 'Completada' || newEstado === 'Fallida') {
      // Ambos estados usan el modal para capturar motivo/solución
      setResolutionTarget({ sesionId, newEstado });
      setShowResolutionModal(true);
    } else {
      const extras = { estado: newEstado, _historyComment: 'Cambio de estado manual' };
      if (newEstado === 'En curso') extras.fechaInicio = new Date().toISOString();
      updateSesion(sesionId, extras);
      // Leer estado fresco del store (la actualización de Zustand es síncrona)
      const fresh = useStore.getState().sesionesRemoto.find(s => s.id === sesionId);
      if (fresh) setSelectedSesion(fresh);
    }
  };

  /* ---- Derivation Handlers ---- */
  const handleDerivarVisita = (sesion) => {
    // 1. Update soporte session state + history
    updateSesion(sesion.id, {
      estado: 'Derivado a Visita',
      fechaFin: new Date().toISOString(),
      _historyComment: 'Derivado a Visita Técnica - requiere atención presencial'
    });
    // 2. Create the Visita Técnica
    const client = clients.find(c => c.id === sesion.clienteId);
    const tecnicoObj = tecnicos.find(t => t.id === sesion.tecnicoId);
    addVisita({
      clienteId: sesion.clienteId,
      clienteNombre: sesion.clienteNombre || client?.nombre || '',
      direccion: sesion.direccion || client?.direccion || '',
      tipo: 'Reparación',
      prioridad: 'Alta',
      estado: 'Programada',
      tecnicoId: sesion.tecnicoId || null,
      tecnicoNombre: tecnicoObj?.nombre || sesion.tecnico || '',
      descripcion: `Derivado de Soporte Remoto (${sesion.id}). ${sesion.resultado || ''}`,
      ticketId: sesion.ticketId || null,
      sesionOrigenId: sesion.id,
      tecnologia: derivacionTecnologia,
      diagnosticoCompleto: derivacionDiag,
      ...derivacionDiag,
    });
    // 3. Update parent ticket history
    if (sesion.ticketId) {
      updateTicket(sesion.ticketId, {
        estado: 'Escalado',
        _historyEstadoLabel: 'Escalado - Visita Técnica',
        _historyComment: `Derivado desde Soporte Remoto (${sesion.id}) a Visita Técnica`
      });
    }
    const fresh = useStore.getState().sesionesRemoto.find(s => s.id === sesion.id);
    setSelectedSesion(fresh || { ...sesion, estado: 'Derivado a Visita' });
  };

  const handleDerivarPlanta = (sesion) => {
    // 1. Update soporte session
    updateSesion(sesion.id, {
      estado: 'Derivado a Planta Externa',
      fechaFin: new Date().toISOString(),
      _historyComment: 'Derivado a Planta Externa - problema de infraestructura'
    });
    // 2. Create derivación in Planta Externa
    const client = clients.find(c => c.id === sesion.clienteId);
    addDerivacion({
      clienteId: sesion.clienteId,
      clienteNombre: sesion.clienteNombre || client?.nombre || '',
      zona: client?.nodo_router || sesion.nodo || '',
      tipo: client?.tecnologia || 'Fibra Óptica',
      prioridad: 'Alta',
      estado: 'Pendiente',
      descripcion: `Derivado de Soporte Remoto (${sesion.id}). ${sesion.resultado || ''}`,
      ticketId: sesion.ticketId || null,
      sesionOrigenId: sesion.id,
      tecnologia: derivacionTecnologia,
      diagnosticoCompleto: derivacionDiag,
      ...derivacionDiag,
    });
    // 3. Update parent ticket history
    if (sesion.ticketId) {
      updateTicket(sesion.ticketId, {
        estado: 'Escalado',
        _historyEstadoLabel: 'Escalado - Planta Externa',
        _historyComment: `Derivado desde Soporte Remoto (${sesion.id}) a Planta Externa`
      });
    }
    const fresh = useStore.getState().sesionesRemoto.find(s => s.id === sesion.id);
    setSelectedSesion(fresh || { ...sesion, estado: 'Derivado a Planta Externa' });
  };

  const handleResolutionConfirm = (resolutionData) => {
    if (!resolutionTarget) return;
    // Buscar la sesión ANTES del update para obtener ticketId
    const sesionPrev = sesiones.find(s => s.id === resolutionTarget.sesionId);
    const esFallida = resolutionTarget.newEstado === 'Fallida';
    updateSesion(resolutionTarget.sesionId, {
      estado: resolutionTarget.newEstado,
      fechaFin: new Date().toISOString(),
      ...resolutionData,
      _historyComment: esFallida
        ? resolutionData.solucion || 'Sesión fallida'
        : resolutionData.solucion || 'Sesión completada'
    });
    // Solo propagar al ticket si se completó exitosamente, no si falló
    if (!esFallida && sesionPrev?.ticketId) {
      resolveTicketChain(sesionPrev.ticketId, `Resuelto desde Soporte Remoto (${sesionPrev.id})`);
    }
    // Leer estado fresco del store
    const fresh = useStore.getState().sesionesRemoto.find(s => s.id === resolutionTarget.sesionId);
    if (fresh) setSelectedSesion(fresh);
    setShowResolutionModal(false);
    setResolutionTarget(null);
  };

  const handleDeleteSesion = (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta sesión remota? Esta acción no se puede deshacer.')) return;
    if (deleteSesionRemoto) deleteSesionRemoto(id);
    setSelectedSesion(null);
  };

  /* ---- Diagnostic warning logic ---- */
  const getDiagWarnings = (d) => {
    if (!d) return {};
    const w = {};
    if (d.pingMax && parseFloat(d.pingMax) > 80) w.pingMax = true;
    if (d.perdidaPaquetes && parseFloat(d.perdidaPaquetes) > 5) w.perdidaPaquetes = true;
    if (d.velocidadBajada && parseFloat(d.velocidadBajada) < 10) w.velocidadBajada = true;
    if (d.velocidadSubida && parseFloat(d.velocidadSubida) < 5) w.velocidadSubida = true;
    // Señal radio
    if (d.senalAP && parseFloat(d.senalAP) < -75) w.senalAP = true;
    if (d.senalCPE && parseFloat(d.senalCPE) < -75) w.senalCPE = true;
    if (d.ccq && parseFloat(d.ccq) < 85) w.ccq = true;
    // Fibra
    if (d.nivelONT && parseFloat(d.nivelONT) < -27) w.nivelONT = true;
    if (d.nivelOLT && parseFloat(d.nivelOLT) < -27) w.nivelOLT = true;
    if (d.atenuacion && parseFloat(d.atenuacion) > 28) w.atenuacion = true;
    return w;
  };

  /* ---- Duración calculada ---- */
  const calcDuracion = (fechaInicio, fechaFin) => {
    if (!fechaInicio) return '—';
    const fin = fechaFin ? new Date(fechaFin) : new Date();
    const mins = Math.round((fin - new Date(fechaInicio)) / 60000);
    if (mins < 1) return '< 1 min';
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  /* ========================= RENDER ========================= */
  return (
    <div className="animate-fade p-4 sm:p-6 sm:px-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-[26px] font-bold tracking-tight">Soporte Remoto</h1>
          <p className="text-text-secondary text-sm mt-1">Diagnóstico y configuración remota de equipos</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="w-full sm:w-auto justify-center py-2.5 px-4 rounded-xl bg-accent-cyan border-none text-white text-sm font-semibold cursor-pointer flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Plus size={16} /> Nueva Sesión
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-orange/15 text-accent-orange"><Clock size={16} /></div>
          <div><p className="text-lg font-bold font-mono">{stats.pendiente}</p><p className="text-[10px] text-text-muted uppercase">Pendientes</p></div>
        </div>
        <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-blue/15 text-accent-blue"><Activity size={16} /></div>
          <div><p className="text-lg font-bold font-mono">{stats.enCurso}</p><p className="text-[10px] text-text-muted uppercase">En curso</p></div>
        </div>
        <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-green/15 text-accent-green"><CheckCircle2 size={16} /></div>
          <div><p className="text-lg font-bold font-mono">{stats.completadas}</p><p className="text-[10px] text-text-muted uppercase">Completadas</p></div>
        </div>
        <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-purple/15 text-accent-purple"><Monitor size={16} /></div>
          <div>
            <p className="text-lg font-bold font-mono">{stats.total}</p>
            <p className="text-[10px] text-text-muted uppercase">Total {stats.fallidas > 0 && <span className="text-accent-red">· {stats.fallidas} fallidas</span>}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            placeholder="Buscar por cliente, ID, ticket..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-cyan"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="min-w-[160px] bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-cyan"
        >
          <option value="all">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En curso">En curso</option>
          <option value="Completada">Completada</option>
          <option value="Fallida">Fallida</option>
          <option value="Derivado a Visita">Derivado a Visita</option>
          <option value="Derivado a Planta Externa">Derivado a Planta</option>
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="min-w-[150px] bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-cyan"
        >
          <option value="all">Todos los tipos</option>
          {tiposSesionSoporte.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
        </select>
      </div>

      {/* Sessions List */}
      <div className="flex flex-col gap-3">
        {filteredSesiones.length === 0 && (
          <div className="bg-bg-card rounded-xl p-8 border border-border text-center">
            <Monitor size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-text-secondary text-sm">No se encontraron sesiones</p>
          </div>
        )}
        {filteredSesiones.map(s => {
          const ts = TIPO_STYLE[s.tipo] || { bg: 'bg-bg-secondary', text: 'text-text-secondary' };
          const hasDiag = s.diagnosticos && Object.values(s.diagnosticos).some(v => v !== '' && v !== null && v !== undefined);
          const warns = getDiagWarnings(s.diagnosticos);
          const hasWarnings = Object.keys(warns).length > 0;

          return (
            <div key={s.id} onClick={() => setSelectedSesion(s)}
              className="bg-bg-card rounded-xl p-4 border border-border cursor-pointer transition-all hover:border-accent-cyan/40 group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-cyan/15 text-accent-cyan">
                    <Terminal size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-text-muted">{s.id}</span>
                      <StatusBadge status={s.estado} />
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${ts.bg} ${ts.text}`}>{s.tipo}</span>
                      {s.ticketId && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-accent-orange/15 text-accent-orange flex items-center gap-1">
                          <FileText size={10} /> {s.ticketId}
                        </span>
                      )}
                      {hasWarnings && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-accent-orange/15 text-accent-orange flex items-center gap-1">
                          <AlertTriangle size={10} /> Alertas
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold mt-0.5">{s.clienteNombre}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton getTextFn={() => formatSoporteRemoto(s, clients.find(c => c.id === s.clienteId))} />
                  <span className="text-[11px] text-text-muted">{s.fecha}</span>
                  <Eye size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="flex items-center gap-6 text-[11px] text-text-muted mt-1 flex-wrap">
                <span className="flex items-center gap-1"><Wifi size={10} /> IP: <span className="text-accent-cyan font-mono">{s.ip}</span></span>
                <span>Técnico: <span className="text-text-secondary">{s.tecnico}</span></span>
                <span className="flex items-center gap-1"><Clock size={10} /> Duración: <span className="text-text-secondary">{calcDuracion(s.fechaInicio, s.fechaFin)}</span></span>
                <AdjuntosCount count={s.adjuntos?.length} />
              </div>

              {/* Diagnostic summary */}
              {hasDiag && (
                <div className="mt-2 p-2 bg-bg-secondary rounded-lg flex items-center gap-4 text-[11px] flex-wrap">
                  <span className="text-text-muted font-semibold uppercase tracking-wide flex items-center gap-1"><Gauge size={10} /> Diag:</span>
                  {s.diagnosticos.pingMax && (
                    <span className={warns.pingMax ? 'text-accent-orange' : 'text-text-secondary'}>
                      Ping: <span className="font-mono">{s.diagnosticos.pingMax}ms</span>
                    </span>
                  )}
                  {s.diagnosticos.perdidaPaquetes && (
                    <span className={warns.perdidaPaquetes ? 'text-accent-orange' : 'text-text-secondary'}>
                      PL: <span className="font-mono">{s.diagnosticos.perdidaPaquetes}%</span>
                    </span>
                  )}
                  {s.diagnosticos.velocidadBajada && (
                    <span className={warns.velocidadBajada ? 'text-accent-orange' : 'text-text-secondary'}>
                      DL: <span className="font-mono">{s.diagnosticos.velocidadBajada}Mbps</span>
                    </span>
                  )}
                  {s.diagnosticos.velocidadSubida && (
                    <span className={warns.velocidadSubida ? 'text-accent-orange' : 'text-text-secondary'}>
                      UL: <span className="font-mono">{s.diagnosticos.velocidadSubida}Mbps</span>
                    </span>
                  )}
                  {s.diagnosticos.senalRecibida && (
                    <span className={warns.senalRecibida ? 'text-accent-orange' : 'text-text-secondary'}>
                      <Signal size={10} className="inline mr-0.5" />
                      <span className="font-mono">{s.diagnosticos.senalRecibida}dBm</span>
                    </span>
                  )}
                  {s.diagnosticos.potenciaRx && (
                    <span className={warns.potenciaRx ? 'text-accent-orange' : 'text-text-secondary'}>
                      Rx: <span className="font-mono">{s.diagnosticos.potenciaRx}dBm</span>
                    </span>
                  )}
                </div>
              )}

              {s.resultado && !hasDiag && (
                <div className="mt-2 p-2 bg-bg-secondary rounded-lg text-xs text-text-secondary">
                  {s.resultado}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ========================= MODAL: NUEVA SESION ========================= */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="bg-bg-card rounded-2xl p-6 w-full max-w-[640px] border border-border max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-cyan/15 text-accent-cyan">
                  <Terminal size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Nueva Sesión Remota</h3>
                  <p className="text-xs text-text-muted">Complete los datos del diagnóstico</p>
                </div>
              </div>
              <button onClick={() => { setShowForm(false); resetForm(); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-secondary border border-border text-text-muted hover:text-text-primary cursor-pointer transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Ticket Vinculado */}
              <Autocomplete
                label="Ticket vinculado (opcional)"
                placeholder="Buscar ticket por ID o descripción..."
                items={tickets}
                value={selectedTicket}
                onChange={handleTicketSelect}
                renderItem={(tk) => `${tk.id} — ${tk.clienteNombre} — ${tk.descripcion?.slice(0, 50)}...`}
                filterFn={(tk, q) =>
                  tk.id.toLowerCase().includes(q) ||
                  (tk.clienteNombre || '').toLowerCase().includes(q) ||
                  (tk.descripcion || '').toLowerCase().includes(q)
                }
              />

              {/* Cliente */}
              <Autocomplete
                label="Cliente"
                placeholder="Buscar por nombre o ID de cliente..."
                items={clients}
                value={selectedClient}
                onChange={handleClientSelect}
                renderItem={(cl) => `${cl.id} — ${cl.nombre}${cl.ip ? ` (${cl.ip})` : ''}`}
                filterFn={(cl, q) =>
                  cl.id.toLowerCase().includes(q) ||
                  (cl.nombre || '').toLowerCase().includes(q)
                }
                disabled={!!selectedTicket}
                readOnlyDisplay={selectedTicket && selectedClient ? `${selectedClient.id} — ${selectedClient.nombre}` : null}
              />

              {/* Client info badge */}
              {selectedClient && (
                <div className="bg-bg-secondary rounded-lg p-3 border border-border/50 flex items-center gap-4 flex-wrap text-[11px]">
                  <span className="text-text-muted">Tecnología: <span className="text-accent-cyan font-semibold">{selectedClient.tecnologia || '—'}</span></span>
                  <span className="text-text-muted">Plan: <span className="text-text-secondary font-semibold">{selectedClient.plan || '—'}</span></span>
                  <span className="text-text-muted">Nodo: <span className="text-text-secondary font-mono">{selectedClient.nodo || '—'}</span></span>
                  <span className="text-text-muted">Dirección: <span className="text-text-secondary">{selectedClient.direccion || '—'}</span></span>
                </div>
              )}

              {/* Tipo + IP + Tecnico row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary font-medium mb-1.5 block">Tipo de sesión</label>
                  <select value={tipoSesion} onChange={(e) => setTipoSesion(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-cyan/50">
                    {tiposSesionSoporte.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-secondary font-medium mb-1.5 block">IP del equipo</label>
                  <input type="text" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="Se auto-llena al elegir cliente"
                    className="w-full px-3 py-2.5 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50" />
                </div>
              </div>

              <div>
                <label className="text-xs text-text-secondary font-medium mb-1.5 block">Técnico responsable</label>
                <select value={tecnicoId} onChange={(e) => setTecnicoId(e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-cyan/50">
                  <option value="">Seleccionar técnico...</option>
                  {activeTecnicos.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre} — {t.especialidad} ({t.zona})</option>
                  ))}
                </select>
              </div>

              {/* ========================= DIAGNOSTIC PARAMETERS ========================= */}
              <div className="mt-4">
                <DiagnosticFields
                  tecnologia={tecnologiaSesion}
                  onTecnologiaChange={setTecnologiaSesion}
                  value={diag}
                  onChange={setDiag}
                />
              </div>

              {/* Resultado */}
              <div>
                <label className="text-xs text-text-secondary font-medium mb-1.5 block">Resultado / Observaciones</label>
                <textarea value={resultado} onChange={(e) => setResultado(e.target.value)}
                  placeholder="Describa el resultado del diagnóstico..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 resize-none" />
              </div>

              {/* Adjuntos */}
              <Adjuntos
                value={adjuntos}
                onChange={setAdjuntos}
                max={5}
              />

              {/* Derivar a Visita */}
              <label className="flex items-center gap-2 cursor-pointer bg-bg-secondary rounded-lg p-3 border border-border/50 hover:border-accent-cyan/30 transition-colors">
                <input type="checkbox" checked={derivarVisita} onChange={(e) => setDerivarVisita(e.target.checked)}
                  className="w-4 h-4 rounded accent-accent-cyan" />
                <div>
                  <span className="text-sm text-text-primary font-medium">Derivar a Visita Técnica</span>
                  <p className="text-[11px] text-text-muted mt-0.5">Se creará automáticamente una visita técnica al registrar la sesión</p>
                </div>
              </label>

              {/* Actions */}
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm font-semibold hover:bg-bg-secondary/80 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={!selectedClient}
                  className="flex-1 py-2.5 rounded-lg bg-accent-cyan border-none text-white cursor-pointer text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <Monitor size={16} /> Iniciar Sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================= MODAL: DETAIL ========================= */}
      {selectedSesion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setSelectedSesion(null); setConfirmDerivacion(null); }}>
          <div className="bg-bg-card rounded-2xl p-6 w-full max-w-[640px] border border-border max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {(() => {
              const s = selectedSesion;
              const ts = TIPO_STYLE[s.tipo] || { bg: 'bg-bg-secondary', text: 'text-text-secondary' };
              const d = s.diagnosticos;
              const warns = getDiagWarnings(d);
              const hasWarnings = Object.keys(warns).length > 0;
              const hasDiag = d && Object.values(d).some(v => v !== '' && v !== null && v !== undefined);
              const techStr = (s.tecnologia || '').toLowerCase();

              return (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent-cyan/15 text-accent-cyan">
                        <Terminal size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-text-muted font-bold">{s.id}</span>
                          <StatusBadge status={s.estado} />
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">{s.fecha}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CopyButton
                        getTextFn={() => formatSoporteRemoto(selectedSesion, clients.find(c => c.id === selectedSesion.clienteId))}
                        size="md"
                        title="Copiar para WhatsApp"
                      />
                      <button onClick={() => setSelectedSesion(null)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-secondary border border-border text-text-muted hover:text-text-primary cursor-pointer transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Client Info Section */}
                  <div className="mb-4">
                    <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2">Información del cliente</p>
                    <div className="bg-bg-secondary/60 rounded-xl p-4 border border-border/50 shadow-sm">
                      <p className="text-[15px] font-bold text-text-primary mb-1.5">{s.clienteNombre}</p>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4 flex-wrap text-[11px] text-text-muted">
                          <span>ID: <span className="text-text-secondary font-mono">{s.clienteId}</span></span>
                          {s.tecnologia && <span>Tecnología: <span className="text-accent-cyan font-semibold">{s.tecnologia}</span></span>}
                          {s.plan && <span>Plan: <span className="text-text-secondary">{s.plan}</span></span>}
                          {s.nodo && <span>Nodo: <span className="text-text-secondary font-mono">{s.nodo}</span></span>}
                        </div>
                        {s.direccion && (
                          <div className="text-[11px] text-text-muted pt-1 border-t border-border/30">
                            Dirección: <span className="text-text-secondary">{s.direccion}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ticket vinculado */}
                  {s.ticketId && (
                    <div className="mb-4">
                      <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2">Ticket vinculado</p>
                      <div className="bg-bg-secondary rounded-lg p-3 border border-border/50 flex items-center gap-2">
                        <FileText size={14} className="text-accent-orange" />
                        <span className="text-sm font-mono font-semibold text-accent-orange">{s.ticketId}</span>
                        {s.ticketDesc && <span className="text-xs text-text-secondary ml-2">{s.ticketDesc}</span>}
                      </div>
                    </div>
                  )}

                  {/* Session details */}
                  <div className="mb-4">
                    <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2 flex items-center gap-1.5">
                      <Activity size={12} /> Detalles de sesión
                    </p>
                    <div className="bg-bg-secondary/40 rounded-xl p-4 border border-border/50 shadow-sm">
                      <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                        <div>
                          <p className="text-[10px] text-text-muted uppercase tracking-wide font-medium mb-1.5">Tipo</p>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${ts.bg} ${ts.text}`}>{s.tipo}</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-text-muted uppercase tracking-wide font-medium mb-1.5">Dirección IP</p>
                          <p className="text-[14px] font-mono font-medium text-accent-cyan">{s.ip || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-text-muted uppercase tracking-wide font-medium mb-1.5">Técnico Asignado</p>
                          <p className="text-[13px] font-medium text-text-primary flex items-center gap-1.5"><Monitor size={12} className="text-text-muted" /> {s.tecnico}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-text-muted uppercase tracking-wide font-medium mb-1.5">Duración</p>
                          <p className="text-[13px] font-medium text-text-secondary flex items-center gap-1.5"><Clock size={12} className="text-text-muted" /> {s.duracion}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resultado */}
                  {s.resultado && (
                    <div className="mb-4">
                      <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2">Motivo / Resultado (Reporte Inicial)</p>
                      <div className="bg-bg-secondary/40 rounded-xl p-4 border border-border/50 shadow-sm">
                        <div className="relative">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-blue/50 rounded-l-md"></div>
                          <div className="pl-4 py-1 text-[13px] text-text-secondary leading-relaxed">
                            {s.resultado}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Adjuntos del Ticket / Motivo original */}
                  {s.adjuntos && s.adjuntos.length > 0 && (
                    <div className="mb-6">
                      <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2">Evidencia de Origen</p>
                      <Adjuntos value={s.adjuntos} onChange={() => { }} readOnly max={5} />
                    </div>
                  )}

                  {/* ============ Full Diagnostic Report (via Component) ============ */}
                  {(hasDiag || s.estado === 'En curso') && (
                    <div className="border-t border-border pt-4 mb-4">
                      {/* Warnings banner (Movido aquí para contexto) */}
                      {hasWarnings && (
                        <div className="bg-accent-orange/5 border border-accent-orange/20 rounded-lg p-3 mb-4 flex items-start gap-2 animate-fade-in shadow-sm">
                          <AlertTriangle size={14} className="text-accent-orange mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-accent-orange/90 font-medium leading-tight">
                            Se detectaron valores fuera de rango en los parámetros técnicos reportados. Compruebe los indicadores correspondientes.
                          </p>
                        </div>
                      )}
                      <DiagnosticFields
                        tecnologia={s.tecnologia}
                        value={d}
                        onChange={(newVal) => {
                          const updatedS = { ...s, diagnosticos: typeof newVal === 'function' ? newVal(d) : newVal };
                          updateSesionRemoto(updatedS.id, updatedS);
                        }}
                        onTecnologiaChange={(t) => {
                          const updatedS = { ...s, tecnologia: t };
                          updateSesionRemoto(updatedS.id, updatedS);
                        }}
                        warnings={warns}
                        readOnly={s.estado === 'Completada' || s.estado === 'Fallida'}
                      />
                    </div>
                  )}

                  {/* Resolution Info */}
                  {(s.solucion || s.accionesRealizadas) && (
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 mb-6">
                      <p className="text-[10px] text-green-400 uppercase tracking-wide mb-3 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Resolución de Incidencia
                      </p>
                      <div className="space-y-3">
                        {s.solucion && (
                          <div>
                            <p className="text-[10px] text-text-muted mb-0.5 font-medium">Solución aplicada:</p>
                            <p className="text-sm text-text-primary leading-relaxed">{s.solucion}</p>
                          </div>
                        )}
                        {s.accionesRealizadas && (
                          <div>
                            <p className="text-[10px] text-text-muted mb-0.5 font-medium">Acciones Realizadas:</p>
                            <p className="text-sm text-text-secondary leading-relaxed">{s.accionesRealizadas}</p>
                          </div>
                        )}
                        {s.adjuntosResolucion && s.adjuntosResolucion.length > 0 && (
                          <div className="pt-2 border-t border-green-500/10">
                            <p className="text-[10px] text-text-muted mb-2 font-medium">Evidencia fotográfica:</p>
                            <Adjuntos value={s.adjuntosResolucion} onChange={() => { }} readOnly max={5} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Iniciar sesión pendiente */}
                  {s.estado === 'Pendiente' && (
                    <div className="mb-3">
                      <button
                        onClick={() => handleStatusChange(s.id, 'En curso')}
                        className="w-full py-2.5 rounded-lg bg-accent-blue/20 text-accent-blue border border-accent-blue/30 text-xs font-semibold cursor-pointer hover:bg-accent-blue/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <Activity size={13} /> Iniciar Sesión
                      </button>
                    </div>
                  )}

                  {/* Status change actions */}
                  {s.estado === 'En curso' && (
                    <div className="mb-4">
                      {/* ==== SECCIÓN 1: RESOLUCIÓN DIRECTA ==== */}
                      <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2">Resolución de Sesión</p>
                      <div className="flex gap-3 mb-4">
                        <button
                          onClick={() => handleStatusChange(s.id, 'Completada')}
                          className="flex-1 py-2.5 rounded-lg bg-accent-green/10 text-accent-green border border-accent-green/20 text-xs font-bold cursor-pointer hover:bg-accent-green hover:text-white transition-all flex justify-center items-center gap-2 shadow-sm"
                        >
                          <CheckCircle2 size={14} /> Marcar Completada
                        </button>
                        <button
                          onClick={() => handleStatusChange(s.id, 'Fallida')}
                          className="flex-1 py-2.5 rounded-lg bg-transparent text-accent-red border border-accent-red/40 text-xs font-semibold cursor-pointer hover:bg-accent-red/10 transition-all flex justify-center items-center gap-2"
                        >
                          <X size={14} /> Marcar Fallida
                        </button>
                      </div>

                      {/* ==== SECCIÓN 2: ESCALAMIENTO ==== */}
                      <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2 flex items-center gap-1"><Terminal size={12} /> Escalar Ticket</p>

                      {/* Campos de diagnóstico para derivación (MOVIDO AL MODAL DE DERIVACION) */}
                      {confirmDerivacion ? (
                        <div className="bg-accent-orange/5 border border-accent-orange/20 rounded-xl p-4 shadow-sm animate-fade-in">
                          <p className="text-sm text-accent-orange font-bold mb-1 flex items-center gap-2">
                            <AlertTriangle size={14} /> ¿Derivar a {confirmDerivacion.type === 'visita' ? 'Visita Técnica' : 'Planta Externa'}?
                          </p>
                          <p className="text-[11px] text-text-secondary mb-4 leading-relaxed">
                            Esta acción cerrará la sesión actual y creará un nuevo ticket de campo adjuntando todo el diagnóstico actual.
                          </p>
                          <div className="mb-4 bg-bg-primary/50 rounded-lg p-2 border border-border">
                            <DiagnosticFields
                              tecnologia={derivacionTecnologia}
                              onTecnologiaChange={setDerivacionTecnologia}
                              value={derivacionDiag}
                              onChange={setDerivacionDiag}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setConfirmDerivacion(null)}
                              className="px-4 py-1.5 rounded-lg bg-bg-secondary border border-border text-xs text-text-primary font-medium cursor-pointer hover:bg-bg-secondary/80"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => {
                                confirmDerivacion.type === 'visita' ? handleDerivarVisita(s) : handleDerivarPlanta(s);
                                setConfirmDerivacion(null);
                              }}
                              className="px-4 py-1.5 rounded-lg bg-accent-orange text-white border-none text-xs font-bold cursor-pointer hover:bg-accent-orange/90 shadow-sm"
                            >
                              Confirmar Derivación
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button
                            onClick={() => setConfirmDerivacion({ type: 'visita' })}
                            className="flex-1 py-2.5 rounded-lg bg-bg-secondary text-text-primary border border-border text-xs font-semibold cursor-pointer hover:border-purple-500/50 hover:text-purple-400 transition-all flex justify-center items-center gap-2"
                          >
                            Derivar a Visita
                          </button>
                          <button
                            onClick={() => setConfirmDerivacion({ type: 'planta' })}
                            className="flex-1 py-2.5 rounded-lg bg-bg-secondary text-text-primary border border-border text-xs font-semibold cursor-pointer hover:border-orange-500/50 hover:text-orange-400 transition-all flex justify-center items-center gap-2"
                          >
                            Derivar a Planta
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                    <button
                      onClick={() => handleDeleteSesion(s.id)}
                      className="py-2.5 px-4 rounded-lg border border-red-500/30 text-xs text-red-400 cursor-pointer bg-transparent hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
                    >
                      <X size={12} /> Eliminar
                    </button>
                    <button onClick={() => { setSelectedSesion(null); setConfirmDerivacion(null); }}
                      className="flex-1 py-2.5 px-6 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm font-semibold hover:bg-bg-secondary/80 transition-colors">
                      Cerrar
                    </button>
                  </div>
                </>
              );
            })()}
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
        title={resolutionTarget?.newEstado === 'Fallida' ? 'Registrar Motivo de Falla' : 'Completar Sesión Remota'}
        entityId={resolutionTarget ? sesiones.find(s => s.id === resolutionTarget.sesionId)?.id : ''}
        entityLabel="Sesión"
        newStatus={resolutionTarget?.newEstado || 'Completada'}
        accentColor={resolutionTarget?.newEstado === 'Fallida' ? 'accent-red' : 'accent-cyan'}
      />
    </div>
  );
}
