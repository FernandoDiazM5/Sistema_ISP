import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Monitor, Plus, Wifi, Terminal, Activity, CheckCircle2,
  Search, ArrowRight, Gauge, Signal, Radio, X, Eye,
  AlertTriangle, Zap, Clock, FileText, ChevronDown
} from 'lucide-react';
import useStore from '../../store/useStore';
import Adjuntos, { AdjuntosCount } from '../common/Adjuntos';
import ResolutionModal from '../common/ResolutionModal';
import DiagnosticFields, { getEmptyDiag } from '../common/DiagnosticFields';

/* ========================= CONSTANTS ========================= */
const ESTADO_STYLE = {
  'En curso': { bg: 'bg-accent-blue/20', text: 'text-accent-blue' },
  'Completada': { bg: 'bg-accent-green/20', text: 'text-accent-green' },
  'Fallida': { bg: 'bg-accent-red/20', text: 'text-accent-red' },
  'Derivado a Visita': { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  'Derivado a Planta Externa': { bg: 'bg-orange-500/20', text: 'text-orange-400' },
};

const TIPO_STYLE = {
  'Diagnóstico': { bg: 'bg-accent-cyan/15', text: 'text-accent-cyan' },
  'Configuración': { bg: 'bg-accent-purple/15', text: 'text-accent-purple' },
  'Monitoreo': { bg: 'bg-accent-blue/15', text: 'text-accent-blue' },
  'Reinicio remoto': { bg: 'bg-accent-orange/15', text: 'text-accent-orange' },
};

const TIPOS_SESION = ['Diagnóstico', 'Configuración', 'Monitoreo', 'Reinicio remoto'];

const FRECUENCIAS = ['2.4', '5.8'];
const ANCHOS_BANDA = ['20MHz', '40MHz'];
const ESTADOS_ONU = ['Online', 'Offline', 'LOS', 'Dying Gasp'];

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
  const sesiones = useStore(s => s.sesionesRemoto);
  const addSesion = useStore(s => s.addSesionRemoto);
  const updateSesion = useStore(s => s.updateSesionRemoto);
  const clients = useStore(s => s.clients);
  const tickets = useStore(s => s.tickets);
  const updateTicket = useStore(s => s.updateTicket);
  const tecnicos = useStore(s => s.tecnicos);
  const addVisita = useStore(s => s.addVisita);
  const addDerivacion = useStore(s => s.addDerivacion);
  const prefillSoporte = useStore(s => s.prefillSoporte);
  const clearPrefillSoporte = useStore(s => s.clearPrefillSoporte);

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

  // Reset diag when selecting session
  // Reset diag when selecting session
  useEffect(() => {
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

    /* ---- Diagnostic State ---- */
    const [diag, setDiag] = useState(getEmptyDiag());

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
      enCurso: sesiones.filter(s => s.estado === 'En curso').length,
      completadas: sesiones.filter(s => s.estado === 'Completada').length,
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
      if (newEstado === 'Completada') {
        setResolutionTarget({ sesionId, newEstado });
        setShowResolutionModal(true);
      } else {
        updateSesion(sesionId, { estado: newEstado, _historyComment: 'Cambio de estado manual' });
        const updated = sesiones.find(s => s.id === sesionId);
        if (updated) {
          setSelectedSesion({ ...updated, estado: newEstado });
        }
      }
    };

    /* ---- Derivation Handlers ---- */
    const handleDerivarVisita = (sesion) => {
      // 1. Update soporte session state + history
      updateSesion(sesion.id, {
        estado: 'Derivado a Visita',
        _historyComment: 'Derivado a Visita Técnica - requiere atención presencial'
      });
      // 2. Create the Visita Técnica
      const client = clients.find(c => c.id === sesion.clienteId);
      addVisita({
        clienteId: sesion.clienteId,
        clienteNombre: sesion.clienteNombre || client?.NOMBRE || '',
        direccion: sesion.direccion || client?.DIRECCION_INSTALACION || '',
        tipo: 'Reparación',
        prioridad: 'Alta',
        estado: 'Programada',
        tecnicoId: sesion.tecnicoId || null,
        descripcion: `Derivado de Soporte Remoto (${sesion.id}). ${sesion.resultado || ''}`,
        ticketId: sesion.ticketId || null,
        sesionOrigenId: sesion.id,
        sesionOrigenId: sesion.id,
        tecnologia: derivacionTecnologia, // Pass updated technology
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
      setSelectedSesion({ ...sesion, estado: 'Derivado a Visita' });
    };

    const handleDerivarPlanta = (sesion) => {
      // 1. Update soporte session
      updateSesion(sesion.id, {
        estado: 'Derivado a Planta Externa',
        _historyComment: 'Derivado a Planta Externa - problema de infraestructura'
      });
      // 2. Create derivación in Planta Externa
      const client = clients.find(c => c.id === sesion.clienteId);
      addDerivacion({
        clienteId: sesion.clienteId,
        clienteNombre: sesion.clienteNombre || client?.NOMBRE || '',
        zona: client?.NODO || sesion.nodo || '',
        tipo: 'Fibra Óptica',
        prioridad: 'Alta',
        estado: 'Pendiente',
        descripcion: `Derivado de Soporte Remoto (${sesion.id}). ${sesion.resultado || ''}`,
        ticketId: sesion.ticketId || null,
        sesionOrigenId: sesion.id,
        sesionOrigenId: sesion.id,
        tecnologia: derivacionTecnologia, // Pass updated technology
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
      setSelectedSesion({ ...sesion, estado: 'Derivado a Planta Externa' });
    };

    const handleResolutionConfirm = (resolutionData) => {
      if (!resolutionTarget) return;
      updateSesion(resolutionTarget.sesionId, {
        estado: resolutionTarget.newEstado,
        ...resolutionData,
        _historyComment: resolutionData.solucion || 'Sesión completada'
      });
      // Propagate resolution to parent ticket
      const sesion = sesiones.find(s => s.id === resolutionTarget.sesionId);
      if (sesion?.ticketId) {
        updateTicket(sesion.ticketId, {
          estado: 'Resuelto',
          _historyComment: `Resuelto desde Soporte Remoto (${sesion.id})`
        });
      }
      if (sesion) {
        setSelectedSesion({ ...sesion, estado: resolutionTarget.newEstado, ...resolutionData });
      }
      setShowResolutionModal(false);
      setResolutionTarget(null);
    };

    /* ---- Diagnostic warning logic ---- */
    const getDiagWarnings = (d) => {
      if (!d) return {};
      const w = {};
      if (d.ping && parseFloat(d.ping) > 80) w.ping = true;
      if (d.download && parseFloat(d.download) < 10) w.download = true;
      if (d.upload && parseFloat(d.upload) < 5) w.upload = true;
      if (d.packetLoss && parseFloat(d.packetLoss) > 2) w.packetLoss = true;
      if (d.jitter && parseFloat(d.jitter) > 15) w.jitter = true;
      if (d.senalRecibida && parseFloat(d.senalRecibida) < -75) w.senalRecibida = true;
      if (d.ccq && parseFloat(d.ccq) < 85) w.ccq = true;
      if (d.potenciaRx && parseFloat(d.potenciaRx) < -25) w.potenciaRx = true;
      if (d.atenuacion && parseFloat(d.atenuacion) > 28) w.atenuacion = true;
      if (d.estadoONU && d.estadoONU !== 'Online') w.estadoONU = true;
      return w;
    };

    /* ========================= RENDER ========================= */
    return (
      <div className="animate-fade p-6 px-8 h-full overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight">Soporte Remoto</h1>
            <p className="text-text-secondary text-sm mt-1">Diagnóstico y configuración remota de equipos</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="py-2.5 px-4 rounded-xl bg-accent-cyan border-none text-white text-sm font-semibold cursor-pointer flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Plus size={16} /> Nueva Sesión
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
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
            <div><p className="text-lg font-bold font-mono">{stats.total}</p><p className="text-[10px] text-text-muted uppercase">Total sesiones</p></div>
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
            className="min-w-[150px] bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-cyan"
          >
            <option value="all">Todos los estados</option>
            <option value="En curso">En curso</option>
            <option value="Completada">Completada</option>
            <option value="Fallida">Fallida</option>
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="min-w-[150px] bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-cyan"
          >
            <option value="all">Todos los tipos</option>
            {TIPOS_SESION.map(t => <option key={t} value={t}>{t}</option>)}
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
            const es = ESTADO_STYLE[s.estado] || ESTADO_STYLE['Completada'];
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
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${es.bg} ${es.text}`}>{s.estado}</span>
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
                    <span className="text-[11px] text-text-muted">{s.fecha}</span>
                    <Eye size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="flex items-center gap-6 text-[11px] text-text-muted mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><Wifi size={10} /> IP: <span className="text-accent-cyan font-mono">{s.ip}</span></span>
                  <span>Técnico: <span className="text-text-secondary">{s.tecnico}</span></span>
                  <span className="flex items-center gap-1"><Clock size={10} /> Duración: <span className="text-text-secondary">{s.duracion}</span></span>
                  <AdjuntosCount count={s.adjuntos?.length} />
                </div>

                {/* Diagnostic summary */}
                {hasDiag && (
                  <div className="mt-2 p-2 bg-bg-secondary rounded-lg flex items-center gap-4 text-[11px] flex-wrap">
                    <span className="text-text-muted font-semibold uppercase tracking-wide flex items-center gap-1"><Gauge size={10} /> Diag:</span>
                    {s.diagnosticos.ping && (
                      <span className={warns.ping ? 'text-accent-orange' : 'text-text-secondary'}>
                        Ping: <span className="font-mono">{s.diagnosticos.ping}ms</span>
                      </span>
                    )}
                    {s.diagnosticos.download && (
                      <span className={warns.download ? 'text-accent-orange' : 'text-text-secondary'}>
                        DL: <span className="font-mono">{s.diagnosticos.download}Mbps</span>
                      </span>
                    )}
                    {s.diagnosticos.upload && (
                      <span className={warns.upload ? 'text-accent-orange' : 'text-text-secondary'}>
                        UL: <span className="font-mono">{s.diagnosticos.upload}Mbps</span>
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
            <div className="bg-bg-card rounded-2xl p-6 w-[640px] border border-border max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-secondary font-medium mb-1.5 block">Tipo de sesión</label>
                    <select value={tipoSesion} onChange={(e) => setTipoSesion(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-cyan/50">
                      {TIPOS_SESION.map(t => <option key={t} value={t}>{t}</option>)}
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
                    <p className="text-[11px] text-text-muted mt-0.5">Se creará automáticamente una visita técnica al iniciar la sesión</p>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedSesion(null)}>
            <div className="bg-bg-card rounded-2xl p-6 w-[640px] border border-border max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {(() => {
                const s = selectedSesion;
                const es = ESTADO_STYLE[s.estado] || ESTADO_STYLE['Completada'];
                const ts = TIPO_STYLE[s.tipo] || { bg: 'bg-bg-secondary', text: 'text-text-secondary' };
                const d = s.diagnosticos;
                const warns = getDiagWarnings(d);
                const hasWarnings = Object.keys(warns).length > 0;
                const hasDiag = d && Object.values(d).some(v => v !== '' && v !== null && v !== undefined);
                const techStr = (s.tecnologia || '').toLowerCase();
                const showRadio = techStr.includes('radio');
                const showFibra = techStr.includes('fibra');

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
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${es.bg} ${es.text}`}>{s.estado}</span>
                          </div>
                          <p className="text-xs text-text-muted mt-0.5">{s.fecha}</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedSesion(null)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-secondary border border-border text-text-muted hover:text-text-primary cursor-pointer transition-colors">
                        <X size={16} />
                      </button>
                    </div>

                    {/* Warnings banner */}
                    {hasWarnings && (
                      <div className="bg-accent-orange/10 border border-accent-orange/30 rounded-lg p-3 mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-accent-orange flex-shrink-0" />
                        <p className="text-xs text-accent-orange font-medium">
                          Se detectaron valores fuera de rango en los parámetros de diagnóstico. Revise los indicadores marcados.
                        </p>
                      </div>
                    )}

                    {/* Client Info Section */}
                    <div className="mb-4">
                      <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2">Información del cliente</p>
                      <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                        <p className="text-sm font-semibold text-text-primary mb-1">{s.clienteNombre}</p>
                        <div className="flex items-center gap-4 flex-wrap text-[11px] text-text-muted">
                          <span>ID: <span className="text-text-secondary font-mono">{s.clienteId}</span></span>
                          {s.tecnologia && <span>Tecnología: <span className="text-accent-cyan font-semibold">{s.tecnologia}</span></span>}
                          {s.plan && <span>Plan: <span className="text-text-secondary">{s.plan}</span></span>}
                          {s.direccion && <span>Dir: <span className="text-text-secondary">{s.direccion}</span></span>}
                          {s.nodo && <span>Nodo: <span className="text-text-secondary font-mono">{s.nodo}</span></span>}
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
                      <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2">Detalles de sesión</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-bg-secondary rounded-lg p-2.5 border border-border/50">
                          <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-0.5">Tipo</p>
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${ts.bg} ${ts.text}`}>{s.tipo}</span>
                        </div>
                        <div className="bg-bg-secondary rounded-lg p-2.5 border border-border/50">
                          <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-0.5">IP</p>
                          <p className="text-sm font-mono text-accent-cyan">{s.ip || '—'}</p>
                        </div>
                        <div className="bg-bg-secondary rounded-lg p-2.5 border border-border/50">
                          <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-0.5">Técnico</p>
                          <p className="text-sm text-text-primary">{s.tecnico}</p>
                        </div>
                        <div className="bg-bg-secondary rounded-lg p-2.5 border border-border/50">
                          <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-0.5">Duración</p>
                          <p className="text-sm text-text-primary font-mono">{s.duracion}</p>
                        </div>
                      </div>
                    </div>

                    {/* Resultado */}
                    {s.resultado && (
                      <div className="mb-4">
                        <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2">Resultado</p>
                        <div className="bg-bg-secondary rounded-lg p-3 border border-border/50 text-sm text-text-secondary leading-relaxed">
                          {s.resultado}
                        </div>
                      </div>
                    )}

                    {/* Resolution Info */}
                    {(s.solucion || s.accionesRealizadas) && (
                      <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 mb-4">
                        <p className="text-[10px] text-green-400 uppercase tracking-wide mb-2 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Resolución
                        </p>
                        {s.solucion && (
                          <div className="mb-2">
                            <p className="text-[10px] text-text-muted mb-0.5">Solución:</p>
                            <p className="text-sm text-text-secondary">{s.solucion}</p>
                          </div>
                        )}
                        {s.accionesRealizadas && (
                          <div className="mb-2">
                            <p className="text-[10px] text-text-muted mb-0.5">Acciones Realizadas:</p>
                            <p className="text-sm text-text-secondary">{s.accionesRealizadas}</p>
                          </div>
                        )}
                        {s.adjuntosResolucion && s.adjuntosResolucion.length > 0 && (
                          <div className="mt-2">
                            <p className="text-[10px] text-text-muted mb-1">Evidencia:</p>
                            <Adjuntos value={s.adjuntosResolucion} onChange={() => { }} readOnly max={5} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Adjuntos */}
                    {s.adjuntos && s.adjuntos.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2">Adjuntos / Evidencia</p>
                        <Adjuntos value={s.adjuntos} onChange={() => { }} readOnly max={5} />
                      </div>
                    )}

                    {/* ============ Full Diagnostic Report (via Component) ============ */}
                    {hasDiag && (
                      <div className="border-t border-border pt-4">
                        <DiagnosticFields
                          tecnologia={s.tecnologia}
                          value={d}
                          onChange={() => { }} // Read-only
                          onTecnologiaChange={null} // Read-only
                          warnings={warns}
                          readOnly={true}
                        />
                      </div>
                    )}

                    {/* Status change actions */}
                    {s.estado === 'En curso' && (
                      <div className="mb-3">
                        <div className="flex gap-2 mb-2">
                          <button
                            onClick={() => handleStatusChange(s.id, 'Completada')}
                            className="flex-1 py-2 rounded-lg bg-accent-green/20 text-accent-green border-none text-xs font-semibold cursor-pointer hover:bg-accent-green/30"
                          >
                            Marcar Completada
                          </button>
                          <button
                            onClick={() => handleStatusChange(s.id, 'Fallida')}
                            className="flex-1 py-2 rounded-lg bg-accent-red/20 text-accent-red border-none text-xs font-semibold cursor-pointer hover:bg-accent-red/30"
                          >
                            Marcar Fallida
                          </button>
                        </div>

                        {/* Campos de diagnóstico para derivación */}
                        <div className="mb-3">
                          <DiagnosticFields
                            tecnologia={derivacionTecnologia}
                            onTecnologiaChange={setDerivacionTecnologia}
                            value={derivacionDiag}
                            onChange={setDerivacionDiag}
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDerivarVisita(s)}
                            className="flex-1 py-2 rounded-lg bg-purple-500/20 text-purple-400 border-none text-xs font-semibold cursor-pointer hover:bg-purple-500/30"
                          >
                            Derivar a Visita Técnica
                          </button>
                          <button
                            onClick={() => handleDerivarPlanta(s)}
                            className="flex-1 py-2 rounded-lg bg-orange-500/20 text-orange-400 border-none text-xs font-semibold cursor-pointer hover:bg-orange-500/30"
                          >
                            Derivar a Planta Externa
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Close button */}
                    <div className="flex justify-end mt-4 pt-3 border-t border-border">
                      <button onClick={() => setSelectedSesion(null)}
                        className="py-2.5 px-6 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm font-semibold hover:bg-bg-secondary/80 transition-colors">
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
          title="Completar Sesion Remota"
          entityId={resolutionTarget ? sesiones.find(s => s.id === resolutionTarget.sesionId)?.id : ''}
          entityLabel="Sesion"
          newStatus="Completada"
          accentColor="accent-cyan"
        />
      </div>
    );
  }
