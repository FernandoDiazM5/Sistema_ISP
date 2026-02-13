import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, AlertCircle, Loader2, CheckCircle2, Clock, LayoutList, Kanban, ArrowUpRight, MapPin, Monitor, X, Edit3, Trash2, Gauge, Signal, Radio, Zap, AlertTriangle, ExternalLink, FileText, List, Info } from 'lucide-react';
import useStore from '../../store/useStore';
import Adjuntos, { AdjuntosCount } from '../common/Adjuntos';
import ResolutionModal from '../common/ResolutionModal';

const ESTADOS_COLOR = {
  'Abierto': { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
  'En Proceso': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  'Escalado': { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-400' },
  'Resuelto': { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-400' },
  'Cerrado': { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-400' },
  'Cancelado': { bg: 'bg-gray-500/20', text: 'text-gray-500', dot: 'bg-gray-500' },
};

const PRIORIDAD_COLOR = {
  'Crítica': { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Critica' },
  'Alta': { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Alta' },
  'Media': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Media' },
  'Baja': { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Baja' },
};

const KANBAN_COLUMNS = ['Abierto', 'En Proceso', 'Escalado', 'Resuelto', 'Cerrado'];

/* ========================= HELPERS DIAGNOSTICO ========================= */
function DiagValue({ label, value, unit, warn }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className={`bg-bg-secondary rounded-lg p-2.5 border ${warn ? 'border-accent-orange/50' : 'border-border/50'}`}>
      <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-0.5">{label}</p>
      <p className={`text-sm font-mono font-semibold ${warn ? 'text-accent-orange' : 'text-text-primary'}`}>
        {value}{unit ? ` ${unit}` : ''}
        {warn && <AlertTriangle size={12} className="inline ml-1 text-accent-orange" />}
      </p>
    </div>
  );
}

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

export default function TicketsPage() {
  const tickets = useStore(s => s.tickets);
  const addTicket = useStore(s => s.addTicket);
  const updateTicket = useStore(s => s.updateTicket);
  const deleteTicket = useStore(s => s.deleteTicket);
  const clients = useStore(s => s.clients);
  const tecnicos = useStore(s => s.tecnicos);
  const categorias = useStore(s => s.categorias);
  const subcategorias = useStore(s => s.subcategorias);
  const getSLABySubcategoria = useStore(s => s.getSLABySubcategoria);
  const addVisita = useStore(s => s.addVisita);
  const addSesionRemoto = useStore(s => s.addSesionRemoto);
  const visitas = useStore(s => s.visitas);
  const sesionesRemoto = useStore(s => s.sesionesRemoto);

  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterPrioridad, setFilterPrioridad] = useState('all');
  const [filterFechaInicio, setFilterFechaInicio] = useState('');
  const [filterFechaFin, setFilterFechaFin] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [viewingHistoryItem, setViewingHistoryItem] = useState(null);

  // Inline modal states
  const [inlineVisitaData, setInlineVisitaData] = useState(null);
  const [inlineSoporteData, setInlineSoporteData] = useState(null);

  // Visita form state
  const [visitaTecnico, setVisitaTecnico] = useState('');
  const [visitaTipo, setVisitaTipo] = useState('Reparación');
  const [visitaPrioridad, setVisitaPrioridad] = useState('Media');
  const [visitaFecha, setVisitaFecha] = useState('');
  const [visitaHora, setVisitaHora] = useState('');
  const [visitaDireccion, setVisitaDireccion] = useState('');
  const [visitaDescripcion, setVisitaDescripcion] = useState('');
  const [visitaSuccess, setVisitaSuccess] = useState(false);
  const [visitaAdjuntos, setVisitaAdjuntos] = useState([]);

  // Soporte form state
  const [soporteTipo, setSoporteTipo] = useState('Diagnóstico');
  const [soporteTecnico, setSoporteTecnico] = useState('');
  const [soporteIP, setSoporteIP] = useState('');
  const [soporteObservaciones, setSoporteObservaciones] = useState('');
  const [soporteDerivar, setSoporteDerivar] = useState(false);
  const [soporteSuccess, setSoporteSuccess] = useState(false);
  const [soporteAdjuntos, setSoporteAdjuntos] = useState([]);
  // Common diagnostic params
  const [diagPing, setDiagPing] = useState('');
  const [diagDownload, setDiagDownload] = useState('');
  const [diagUpload, setDiagUpload] = useState('');
  const [diagPacketLoss, setDiagPacketLoss] = useState('');
  const [diagJitter, setDiagJitter] = useState('');
  // Radio Enlace params
  const [diagSenalRecibida, setDiagSenalRecibida] = useState('');
  const [diagNoiseFloor, setDiagNoiseFloor] = useState('');
  const [diagCCQ, setDiagCCQ] = useState('');
  const [diagFrecuencia, setDiagFrecuencia] = useState('');
  const [diagCanal, setDiagCanal] = useState('');
  // Fibra Óptica params
  const [diagPotenciaRx, setDiagPotenciaRx] = useState('');
  const [diagPotenciaTx, setDiagPotenciaTx] = useState('');
  const [diagAtenuacion, setDiagAtenuacion] = useState('');
  const [diagPuertoOLT, setDiagPuertoOLT] = useState('');

  // Create modal state
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [selectedSubcategoria, setSelectedSubcategoria] = useState('');
  const [selectedTecnico, setSelectedTecnico] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAdjuntos, setNewAdjuntos] = useState([]);
  const [editingTicketId, setEditingTicketId] = useState(null);

  // Resolution modal state
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionTarget, setResolutionTarget] = useState(null); // {ticketId, newStatus}

  // Pre-fill visita form when inlineVisitaData changes
  useEffect(() => {
    if (inlineVisitaData) {
      const { ticket, client } = inlineVisitaData;
      setVisitaTecnico('');
      setVisitaTipo('Reparación');
      setVisitaPrioridad('Media');
      setVisitaFecha('');
      setVisitaHora('');
      setVisitaDireccion(client?.direccion || '');
      setVisitaDescripcion(`Visita por ticket ${ticket.id}: ${ticket.descripcion}`);
      setVisitaAdjuntos(ticket.adjuntos || []);
      setVisitaSuccess(false);
    }
  }, [inlineVisitaData]);

  // Pre-fill soporte form when inlineSoporteData changes
  useEffect(() => {
    if (inlineSoporteData) {
      const { client } = inlineSoporteData;
      setSoporteTipo('Diagnóstico');
      setSoporteTecnico('');
      setSoporteIP(client?.ip || '');
      setSoporteObservaciones('');
      setSoporteDerivar(false);
      setSoporteSuccess(false);
      setSoporteAdjuntos([]);
      setDiagPing('');
      setDiagDownload('');
      setDiagUpload('');
      setDiagPacketLoss('');
      setDiagJitter('');
      setDiagSenalRecibida('');
      setDiagNoiseFloor('');
      setDiagCCQ('');
      setDiagFrecuencia('');
      setDiagCanal('');
      setDiagPotenciaRx('');
      setDiagPotenciaTx('');
      setDiagAtenuacion('');
      setDiagPuertoOLT('');
    }
  }, [inlineSoporteData]);

  // Filtered tickets
  const filtered = useMemo(() => {
    return tickets.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        t.clienteNombre.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.clienteId.toLowerCase().includes(q) ||
        t.descripcion.toLowerCase().includes(q);

      // En Kanban mostramos todas las columnas, por lo que ignoramos el filtro de estado
      const matchEstado = viewMode === 'kanban' || filterEstado === 'all' || t.estado === filterEstado;
      const matchPrioridad = filterPrioridad === 'all' || t.prioridad === filterPrioridad;
      const matchFechaInicio = !filterFechaInicio || t.fecha >= filterFechaInicio;
      const matchFechaFin = !filterFechaFin || t.fecha <= filterFechaFin;
      return matchSearch && matchEstado && matchPrioridad && matchFechaInicio && matchFechaFin;
    });
  }, [tickets, search, filterEstado, filterPrioridad, filterFechaInicio, filterFechaFin, viewMode]);

  // Stats
  const stats = useMemo(() => ({
    abiertos: tickets.filter(t => t.estado === 'Abierto').length,
    enProceso: tickets.filter(t => t.estado === 'En Proceso').length,
    escalados: tickets.filter(t => t.estado === 'Escalado').length,
    resueltos: tickets.filter(t => t.estado === 'Resuelto').length,
  }), [tickets]);

  // Client autocomplete results
  const clientResults = useMemo(() => {
    if (clientSearch.length < 2) return [];
    const q = clientSearch.toLowerCase();
    return clients.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.movil_1 && c.movil_1.includes(q))
    ).slice(0, 10);
  }, [clients, clientSearch]);

  // Subcategorias filtered by selected categoria
  const filteredSubcategorias = useMemo(() => {
    if (!selectedCategoria) return [];
    return subcategorias.filter(s => s.categoriaId === selectedCategoria);
  }, [subcategorias, selectedCategoria]);

  // Auto-assigned SLA info
  const slaInfo = useMemo(() => {
    if (!selectedSubcategoria) return null;
    return getSLABySubcategoria(selectedSubcategoria);
  }, [selectedSubcategoria, getSLABySubcategoria]);

  // Auto-assigned tipo from subcategoria
  const autoTipoAtencion = useMemo(() => {
    if (!selectedSubcategoria) return '';
    const sub = subcategorias.find(s => s.id === selectedSubcategoria);
    return sub ? sub.tipoAtencion : '';
  }, [selectedSubcategoria, subcategorias]);

  // Active tecnicos only
  const activeTecnicos = useMemo(() => {
    return tecnicos.filter(t => t.estado === 'Activo');
  }, [tecnicos]);

  // Kanban grouped tickets
  const kanbanData = useMemo(() => {
    const grouped = {};
    KANBAN_COLUMNS.forEach(col => {
      grouped[col] = filtered.filter(t => t.estado === col);
    });
    return grouped;
  }, [filtered]);

  const resetCreateForm = () => {
    setClientSearch('');
    setSelectedClient(null);
    setShowClientDropdown(false);
    setSelectedCategoria('');
    setSelectedSubcategoria('');
    setSelectedTecnico('');
    setNewDescription('');
    setNewAdjuntos([]);
    setEditingTicketId(null);
  };

  const handleCreateTicket = () => {
    if (!selectedClient || !selectedCategoria || !selectedSubcategoria || !newDescription.trim()) return;

    const sub = subcategorias.find(s => s.id === selectedSubcategoria);
    const cat = categorias.find(c => c.id === selectedCategoria);
    const tec = tecnicos.find(t => t.id === selectedTecnico);

    const ticketData = {
      clienteId: selectedClient.id,
      clienteNombre: selectedClient.nombre,
      tipo: autoTipoAtencion || 'Soporte',
      prioridad: slaInfo ? slaInfo.prioridad : 'Media',
      estado: 'Abierto',
      asignado: tec ? tec.nombre : 'Sin asignar',
      tecnicoId: tec ? tec.id : null,
      descripcion: newDescription,
      categoriaId: selectedCategoria,
      categoriaNombre: cat ? cat.nombre : '',
      subcategoriaId: selectedSubcategoria,
      subcategoriaNombre: sub ? sub.nombre : '',
      tipoAtencion: autoTipoAtencion,
      slaTiempoLimite: slaInfo ? slaInfo.tiempoLimite : null,
      slaImpacto: slaInfo ? slaInfo.impacto : null,
      adjuntos: newAdjuntos,
    };

    if (editingTicketId) {
      updateTicket(editingTicketId, ticketData);
    } else {
      addTicket(ticketData);
    }

    resetCreateForm();
    setShowCreateModal(false);
  };

  const handleEditTicket = (ticket) => {
    const client = clients.find(c => c.id === ticket.clienteId);
    setSelectedClient(client || { id: ticket.clienteId, nombre: ticket.clienteNombre }); // Fallback if client not found
    setClientSearch(ticket.clienteNombre);
    setSelectedCategoria(ticket.categoriaId || '');
    setSelectedSubcategoria(ticket.subcategoriaId || '');
    setSelectedTecnico(ticket.tecnicoId || '');
    setNewDescription(ticket.descripcion || '');
    setNewAdjuntos(ticket.adjuntos || []);
    setEditingTicketId(ticket.id);

    setSelectedTicket(null); // Close detail modal
    setShowCreateModal(true); // Open form modal
  };

  const handleDeleteTicket = (ticketId) => {
    const hasVisitas = visitas.some(v => v.ticketId === ticketId);
    const hasSoporte = sesionesRemoto.some(s => s.ticketId === ticketId);

    if (hasVisitas || hasSoporte) {
      alert('No se puede eliminar este ticket porque tiene visitas técnicas o sesiones de soporte asociadas.');
      return;
    }

    if (window.confirm('¿Estás seguro de eliminar este ticket? Esta acción no se puede deshacer.')) {
      deleteTicket(ticketId);
      setSelectedTicket(null);
    }
  };

  const clearDateFilters = () => {
    setFilterFechaInicio('');
    setFilterFechaFin('');
  }

  // Sync selectedTicket with store updates to ensure history and status are real-time
  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find(t => t.id === selectedTicket.id);
      // Only update if the object reference changed (Zustand immutable updates)
      if (updated && updated !== selectedTicket) {
        setSelectedTicket(updated);
      }
    }
  }, [tickets, selectedTicket]);

  const handleStatusChange = (ticketId, newEstado) => {
    // If changing to Resuelto or Cerrado, require resolution report
    if (newEstado === 'Resuelto' || newEstado === 'Cerrado') {
      setResolutionTarget({ ticketId, newEstado });
      setShowResolutionModal(true);
    } else {
      // Direct update: store handles history generation
      updateTicket(ticketId, {
        estado: newEstado,
        _historyComment: 'Cambio de estado manual'
      });
    }
  };

  const handleResolutionConfirm = (resolutionData) => {
    if (!resolutionTarget) return;

    updateTicket(resolutionTarget.ticketId, {
      estado: resolutionTarget.newEstado,
      ...resolutionData,
      _historyComment: resolutionData.solucion
    });

    setShowResolutionModal(false);
    setResolutionTarget(null);
  };
  // ... (skip to render part)


  // Find client info for detail modal
  const getClientInfo = (clienteId) => {
    return clients.find(c => c.id === clienteId) || null;
  };

  // Handle inline visita submit
  const handleSubmitVisita = () => {
    if (!inlineVisitaData || !visitaTecnico || !visitaFecha || !visitaHora) return;
    const { ticket, client } = inlineVisitaData;
    const tec = tecnicos.find(t => t.id === visitaTecnico);

    addVisita({
      clienteId: ticket.clienteId,
      clienteNombre: ticket.clienteNombre,
      ticketId: ticket.id,
      tecnicoId: visitaTecnico,
      tecnicoNombre: tec ? tec.nombre : '',
      tipo: visitaTipo,
      prioridad: visitaPrioridad,
      fecha: visitaFecha, // CORRECCION: El sistema usa 'fecha', no 'fechaProgramada'
      horaInicio: visitaHora,
      direccion: visitaDireccion,
      descripcion: visitaDescripcion,
      estado: 'Programada',
      nodo: client?.nodo || client?.nodo_router || '',
      plan: client?.plan || '',
      tecnologia: client?.tecnologia || '',
      adjuntos: visitaAdjuntos,
    });

    setVisitaSuccess(true);
    setTimeout(() => {
      setInlineVisitaData(null);
      setVisitaSuccess(false);
    }, 1500);
  };

  // Handle inline soporte submit
  const handleSubmitSoporte = () => {
    if (!inlineSoporteData || !soporteTecnico) return;
    const { ticket, client } = inlineSoporteData;
    const tec = tecnicos.find(t => t.id === soporteTecnico);
    const tecnologia = client?.tecnologia || '';

    const diagnosticos = {
      ping: diagPing ? parseFloat(diagPing) : null,
      download: diagDownload ? parseFloat(diagDownload) : null, // CORRECCION: Estandarizar a 'download'
      upload: diagUpload ? parseFloat(diagUpload) : null,       // CORRECCION: Estandarizar a 'upload'
      packetLoss: diagPacketLoss ? parseFloat(diagPacketLoss) : null,
      jitter: diagJitter ? parseFloat(diagJitter) : null,
    };

    if (tecnologia === 'Radio Enlace') {
      diagnosticos.senalRecibida = diagSenalRecibida ? parseFloat(diagSenalRecibida) : null;
      diagnosticos.noiseFloor = diagNoiseFloor ? parseFloat(diagNoiseFloor) : null;
      diagnosticos.ccq = diagCCQ ? parseFloat(diagCCQ) : null;
      diagnosticos.frecuencia = diagFrecuencia ? parseFloat(diagFrecuencia) : null;
      diagnosticos.canal = diagCanal || null;
    } else if (tecnologia === 'Fibra Óptica') {
      diagnosticos.potenciaRx = diagPotenciaRx ? parseFloat(diagPotenciaRx) : null;
      diagnosticos.potenciaTx = diagPotenciaTx ? parseFloat(diagPotenciaTx) : null;
      diagnosticos.atenuacion = diagAtenuacion ? parseFloat(diagAtenuacion) : null;
      diagnosticos.puertoOLT = diagPuertoOLT || null;
    }

    addSesionRemoto({
      clienteId: ticket.clienteId,
      clienteNombre: ticket.clienteNombre,
      ticketId: ticket.id,
      tipo: soporteTipo,
      tecnicoId: soporteTecnico,
      tecnicoNombre: tec ? tec.nombre : '',
      ip: soporteIP,
      tecnologia: tecnologia,
      diagnosticos,
      observaciones: soporteObservaciones,
      estado: 'Completada',
      plan: client?.plan || '',
      nodo: client?.nodo || client?.nodo_router || '',
      adjuntos: soporteAdjuntos,
    });

    if (soporteDerivar) {
      addVisita({
        clienteId: ticket.clienteId,
        clienteNombre: ticket.clienteNombre,
        ticketId: ticket.id,
        tecnicoId: soporteTecnico,
        tecnicoNombre: tec ? tec.nombre : '',
        tipo: 'Diagnóstico',
        prioridad: 'Alta',
        fecha: new Date().toISOString().split('T')[0], // CORRECCION: Usar fecha actual por defecto si es derivación inmediata
        horaInicio: '',
        direccion: client?.direccion || '',
        descripcion: `Derivado desde soporte remoto — Ticket ${ticket.id}: ${soporteObservaciones || ticket.descripcion}`,
        estado: 'Programada',
        nodo: client?.nodo || client?.nodo_router || '',
        plan: client?.plan || '',
        tecnologia: tecnologia,
        adjuntos: soporteAdjuntos, // Heredar adjuntos a la visita derivada
      });
    }

    setSoporteSuccess(true);
    setTimeout(() => {
      setInlineSoporteData(null);
      setSoporteSuccess(false);
    }, 1500);
  };

  return (
    <div className="animate-fade p-6 px-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Tickets & Soporte</h1>
          <p className="text-text-secondary text-sm mt-1">
            {tickets.length} tickets en total — {stats.abiertos} abiertos, {stats.enProceso} en proceso
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-bg-secondary rounded-lg border border-border p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer border-none transition-colors ${viewMode === 'list'
                ? 'bg-accent-blue text-white'
                : 'bg-transparent text-text-secondary hover:text-text-primary'
                }`}
            >
              <LayoutList size={14} />
              Lista
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer border-none transition-colors ${viewMode === 'kanban'
                ? 'bg-accent-blue text-white'
                : 'bg-transparent text-text-secondary hover:text-text-primary'
                }`}
            >
              <Kanban size={14} />
              Kanban
            </button>
          </div>
          <button
            onClick={() => { resetCreateForm(); setShowCreateModal(true); }}
            className="py-2.5 px-4 rounded-xl bg-accent-blue border-none text-white text-sm font-semibold cursor-pointer flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Nuevo Ticket
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Abiertos', value: stats.abiertos, icon: <AlertCircle size={16} />, color: '#ef4444' },
          { label: 'En Proceso', value: stats.enProceso, icon: <Loader2 size={16} />, color: '#f59e0b' },
          { label: 'Escalados', value: stats.escalados, icon: <ArrowUpRight size={16} />, color: '#f97316' },
          { label: 'Resueltos', value: stats.resueltos, icon: <CheckCircle2 size={16} />, color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3 transition-all hover:-translate-y-0.5">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: s.color + '15', color: s.color }}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-xl font-bold font-mono">{s.value}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <div className="relative flex-[1_1_280px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            placeholder="Buscar por cliente, ID, descripcion..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9"
          />
        </div>
        {viewMode === 'list' && (
          <select
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value)}
            className="min-w-[150px]"
          >
            <option value="all">Todos los estados</option>
            <option value="Abierto">Abierto</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Escalado">Escalado</option>
            <option value="Resuelto">Resuelto</option>
            <option value="Cerrado">Cerrado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        )}
        <select
          value={filterPrioridad}
          onChange={e => setFilterPrioridad(e.target.value)}
          className="min-w-[140px]"
        >
          <option value="all">Toda prioridad</option>
          <option value="Critica">Critica</option>
          <option value="Alta">Alta</option>
          <option value="Media">Media</option>
          <option value="Baja">Baja</option>
        </select>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2 bg-bg-secondary rounded-lg border border-border px-2 py-1.5">
          <span className="text-[10px] text-text-muted uppercase font-semibold">Fecha:</span>
          <input
            type="date"
            value={filterFechaInicio}
            onChange={e => setFilterFechaInicio(e.target.value)}
            className="bg-transparent border-none text-xs text-text-primary outline-none w-24"
          />
          <span className="text-text-muted">-</span>
          <input
            type="date"
            value={filterFechaFin}
            onChange={e => setFilterFechaFin(e.target.value)}
            className="bg-transparent border-none text-xs text-text-primary outline-none w-24"
          />
          {(filterFechaInicio || filterFechaFin) && <button onClick={clearDateFilters} className="text-text-muted hover:text-text-primary"><X size={12} /></button>}
        </div>
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="flex flex-col gap-3">
          {filtered.length === 0 && (
            <div className="bg-bg-card rounded-xl p-12 border border-border text-center">
              <p className="text-text-muted text-sm">No se encontraron tickets con los filtros aplicados.</p>
            </div>
          )}
          {filtered.map(t => {
            const ec = ESTADOS_COLOR[t.estado] || ESTADOS_COLOR['Abierto'];
            const pc = PRIORIDAD_COLOR[t.prioridad] || PRIORIDAD_COLOR['Media'];
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className="bg-bg-card rounded-xl p-4 border border-border cursor-pointer transition-all hover:border-accent-blue/50 hover:bg-bg-card-hover"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs text-text-muted">{t.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${ec.bg} ${ec.text}`}>
                      {t.estado}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${pc.bg} ${pc.text}`}>
                      {t.prioridad}
                    </span>
                    {t.tipoAtencion && (
                      <span className="text-[11px] text-text-muted bg-bg-secondary px-2 py-0.5 rounded">
                        {t.tipoAtencion}
                      </span>
                    )}
                    {!t.tipoAtencion && t.tipo && (
                      <span className="text-[11px] text-text-muted bg-bg-secondary px-2 py-0.5 rounded">
                        {t.tipo}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-text-muted">
                    {t.slaTiempoLimite && (
                      <span className="flex items-center gap-1 text-accent-yellow">
                        <Clock size={12} />
                        SLA: {t.slaTiempoLimite}
                      </span>
                    )}
                    <span>{t.fecha}</span>
                    <AdjuntosCount count={t.adjuntos?.length} />
                  </div>
                </div>
                <p className="text-sm font-medium mb-1">{t.clienteNombre}</p>
                <p className="text-xs text-text-secondary line-clamp-1">{t.descripcion}</p>
                <div className="mt-2 flex items-center gap-4 text-[11px] text-text-muted">
                  <span>Asignado: <span className="text-text-secondary">{t.asignado || 'Sin asignar'}</span></span>
                  {t.categoriaNombre && (
                    <span>Cat: <span className="text-text-secondary">{t.categoriaNombre}</span></span>
                  )}
                  <span>Actualizado: {t.fechaUpdate}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 380px)' }}>
          {KANBAN_COLUMNS.map(estado => {
            const ec = ESTADOS_COLOR[estado] || ESTADOS_COLOR['Abierto'];
            const columnTickets = kanbanData[estado] || [];
            return (
              <div
                key={estado}
                className="flex-shrink-0 w-[280px] flex flex-col"
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${ec.bg.replace('/20', '')}`}
                      style={{
                        backgroundColor:
                          estado === 'Abierto' ? '#ef4444' :
                            estado === 'En Proceso' ? '#eab308' :
                              estado === 'Escalado' ? '#f97316' :
                                estado === 'Resuelto' ? '#22c55e' :
                                  '#6b7280'
                      }}
                    />
                    <span className="text-sm font-semibold text-text-primary">{estado}</span>
                  </div>
                  <span className="text-[11px] font-mono text-text-muted bg-bg-secondary px-2 py-0.5 rounded-full">
                    {columnTickets.length}
                  </span>
                </div>

                {/* Column body */}
                <div className="flex-1 flex flex-col gap-2 bg-bg-secondary/50 rounded-xl p-2 border border-border/50 min-h-[200px]">
                  {columnTickets.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-[11px] text-text-muted">Sin tickets</p>
                    </div>
                  )}
                  {columnTickets.map(t => {
                    const pc = PRIORIDAD_COLOR[t.prioridad] || PRIORIDAD_COLOR['Media'];
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className="bg-bg-card rounded-lg p-3 border border-border cursor-pointer transition-all hover:border-accent-blue/50 hover:bg-bg-card-hover"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[10px] text-text-muted">{t.id}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pc.bg} ${pc.text}`}>
                            {t.prioridad}
                          </span>
                        </div>
                        <p className="text-xs font-medium mb-1 text-text-primary truncate">{t.clienteNombre}</p>
                        {(t.tipoAtencion || t.tipo) && (
                          <span className="text-[10px] text-text-muted bg-bg-secondary px-1.5 py-0.5 rounded inline-block mb-1.5">
                            {t.tipoAtencion || t.tipo}
                          </span>
                        )}
                        {t.slaTiempoLimite && (
                          <div className="flex items-center gap-1 text-[10px] text-accent-yellow mt-1">
                            <Clock size={10} />
                            <span>SLA: {t.slaTiempoLimite}</span>
                          </div>
                        )}
                        {!t.slaTiempoLimite && (
                          <div className="flex items-center gap-1 text-[10px] text-text-muted mt-1">
                            <Clock size={10} />
                            <span>{t.fecha}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => { resetCreateForm(); setShowCreateModal(false); }}
        >
          <div
            className="bg-bg-card rounded-2xl p-6 w-[560px] border border-border max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-5">{editingTicketId ? 'Editar Ticket' : 'Nuevo Ticket'}</h3>

            <div className="flex flex-col gap-4">
              {/* Client search autocomplete */}
              <div>
                <label className="text-xs text-text-secondary font-medium mb-1.5 block">Cliente *</label>
                {selectedClient ? (
                  <div className="flex items-center justify-between bg-bg-secondary rounded-lg p-3 border border-border">
                    <div>
                      <p className="text-sm font-medium">{selectedClient.nombre}</p>
                      <p className="text-[11px] text-text-muted font-mono">
                        ID: {selectedClient.id}
                        {selectedClient.movil_1 && <span className="ml-2 text-text-secondary">📱 {selectedClient.movil_1}</span>}
                      </p>
                      {selectedClient.direccion && (
                        <p className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1"><MapPin size={10} /> {selectedClient.direccion}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => { setSelectedClient(null); setClientSearch(''); }}
                        className="text-xs text-accent-red cursor-pointer bg-transparent border-none hover:underline"
                      >
                        Cambiar
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open(`/?page=clientes&search=${selectedClient.id}`, '_blank')}
                        className="text-xs text-accent-blue cursor-pointer bg-transparent border-none hover:underline flex items-center gap-1"
                      >
                        <ExternalLink size={12} /> Ver Perfil
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      placeholder="Buscar cliente por nombre, ID o celular (min. 2 caracteres)..."
                      value={clientSearch}
                      onChange={e => {
                        setClientSearch(e.target.value);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      className="w-full pl-9"
                    />
                    {showClientDropdown && clientResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-lg shadow-xl z-10 max-h-[200px] overflow-y-auto">
                        {clientResults.map(c => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedClient(c);
                              setClientSearch('');
                              setShowClientDropdown(false);
                            }}
                            className="px-3 py-2.5 cursor-pointer hover:bg-bg-card-hover transition-colors border-b border-border/50 last:border-0"
                          >
                            <p className="text-sm font-medium">{c.nombre}</p>
                            <p className="text-[11px] text-text-muted font-mono">
                              ID: {c.id}
                              {c.movil_1 && <span className="ml-2 font-sans">| 📱 {c.movil_1}</span>}
                              {c.direccion && <span className="ml-2 font-sans">| {c.direccion}</span>}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    {showClientDropdown && clientSearch.length >= 2 && clientResults.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-lg shadow-xl z-10 p-3">
                        <p className="text-xs text-text-muted text-center">No se encontraron clientes</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Categoria */}
              <div>
                <label className="text-xs text-text-secondary font-medium mb-1.5 block">Categoria *</label>
                <select
                  value={selectedCategoria}
                  onChange={e => {
                    setSelectedCategoria(e.target.value);
                    setSelectedSubcategoria('');
                  }}
                  className="w-full"
                >
                  <option value="">Seleccionar categoria...</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Subcategoria */}
              <div>
                <label className="text-xs text-text-secondary font-medium mb-1.5 block">Subcategoria *</label>
                <select
                  value={selectedSubcategoria}
                  onChange={e => setSelectedSubcategoria(e.target.value)}
                  className="w-full"
                  disabled={!selectedCategoria}
                >
                  <option value="">
                    {selectedCategoria ? 'Seleccionar subcategoria...' : 'Primero seleccione una categoria'}
                  </option>
                  {filteredSubcategorias.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Auto-assigned info row */}
              {selectedSubcategoria && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                    <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Prioridad (SLA)</p>
                    {slaInfo ? (
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${(PRIORIDAD_COLOR[slaInfo.prioridad] || PRIORIDAD_COLOR['Media']).bg
                          } ${(PRIORIDAD_COLOR[slaInfo.prioridad] || PRIORIDAD_COLOR['Media']).text
                          }`}>
                          {slaInfo.prioridad}
                        </span>
                        <p className="text-[10px] text-text-muted mt-1">Tiempo: {slaInfo.tiempoLimite}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted">Media (sin SLA definido)</span>
                    )}
                  </div>
                  <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                    <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Tipo de Atencion</p>
                    <span className="text-sm font-medium">
                      {autoTipoAtencion || 'No definido'}
                    </span>
                  </div>
                </div>
              )}

              {/* Tecnico */}
              <div>
                <label className="text-xs text-text-secondary font-medium mb-1.5 block">Tecnico asignado</label>
                <select
                  value={selectedTecnico}
                  onChange={e => setSelectedTecnico(e.target.value)}
                  className="w-full"
                >
                  <option value="">Sin asignar</option>
                  {activeTecnicos.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} — {t.especialidad} ({t.zona})
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-text-secondary font-medium mb-1.5 block">Descripcion *</label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Describa el problema o solicitud del cliente..."
                  className="bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[100px] resize-y outline-none focus:border-accent-blue w-full"
                />
              </div>

              {/* Adjuntos */}
              <Adjuntos
                value={newAdjuntos}
                onChange={setNewAdjuntos}
                max={5}
              />

              {/* Buttons */}
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => { resetCreateForm(); setShowCreateModal(false); }}
                  className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm hover:bg-bg-card-hover transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateTicket}
                  disabled={!selectedClient || !selectedCategoria || !selectedSubcategoria || !newDescription.trim()}
                  className="flex-1 py-2.5 rounded-lg bg-accent-blue border-none text-white cursor-pointer text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editingTicketId ? 'Guardar Cambios' : 'Crear Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TICKET DETAIL MODAL */}
      {selectedTicket && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="bg-bg-card rounded-2xl p-6 w-[600px] border border-border max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-5">
              <div className="flex-1">
                <span className="font-mono text-sm text-text-muted">{selectedTicket.id}</span>
                <h3 className="text-lg font-bold mt-1">{selectedTicket.clienteNombre}</h3>
                <span className="text-xs text-text-muted font-mono">ID Cliente: {selectedTicket.clienteId}</span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEditTicket(selectedTicket)} className="p-1.5 text-text-muted hover:text-accent-blue transition-colors" title="Editar">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDeleteTicket(selectedTicket.id)} className="p-1.5 text-text-muted hover:text-accent-red transition-colors" title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => setSelectedTicket(null)} className="p-1.5 text-text-muted hover:text-text-primary transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${(ESTADOS_COLOR[selectedTicket.estado] || ESTADOS_COLOR['Abierto']).bg
                  } ${(ESTADOS_COLOR[selectedTicket.estado] || ESTADOS_COLOR['Abierto']).text
                  }`}>
                  {selectedTicket.estado}
                </span>
              </div>
            </div>

            {/* Client Info */}
            {(() => {
              const clientInfo = getClientInfo(selectedTicket.clienteId);
              if (!clientInfo) return null;
              return (
                <div className="bg-bg-secondary rounded-lg p-3 mb-4 border border-border/50">
                  <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2 font-semibold">Informacion del Cliente</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-text-muted">Plan: </span>
                      <span className="text-text-primary font-medium">{clientInfo.plan || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Tecnologia: </span>
                      <span className="text-text-primary font-medium">{clientInfo.tecnologia || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Direccion: </span>
                      <span className="text-text-primary font-medium">{clientInfo.direccion || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Estado: </span>
                      <span className="text-text-primary font-medium">{clientInfo.estado_cuenta || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Ticket details grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-xs">
                <span className="text-text-muted block mb-0.5">Prioridad</span>
                <span className={`font-semibold ${(PRIORIDAD_COLOR[selectedTicket.prioridad] || PRIORIDAD_COLOR['Media']).text
                  }`}>
                  {selectedTicket.prioridad}
                </span>
              </div>
              <div className="text-xs">
                <span className="text-text-muted block mb-0.5">Tipo</span>
                <span className="font-medium">{selectedTicket.tipoAtencion || selectedTicket.tipo}</span>
              </div>
              <div className="text-xs">
                <span className="text-text-muted block mb-0.5">Asignado</span>
                <span className="font-medium">{selectedTicket.asignado || 'Sin asignar'}</span>
              </div>
              {selectedTicket.categoriaNombre && (
                <div className="text-xs">
                  <span className="text-text-muted block mb-0.5">Categoria</span>
                  <span className="font-medium">{selectedTicket.categoriaNombre}</span>
                </div>
              )}
              {selectedTicket.subcategoriaNombre && (
                <div className="text-xs">
                  <span className="text-text-muted block mb-0.5">Subcategoria</span>
                  <span className="font-medium">{selectedTicket.subcategoriaNombre}</span>
                </div>
              )}
              <div className="text-xs">
                <span className="text-text-muted block mb-0.5">Fecha</span>
                <span className="font-medium">{selectedTicket.fecha}</span>
              </div>
            </div>

            {/* SLA Info */}
            {(selectedTicket.slaTiempoLimite || selectedTicket.slaImpacto) && (
              <div className="bg-accent-yellow/10 rounded-lg p-3 mb-4 border border-accent-yellow/20">
                <p className="text-[10px] text-accent-yellow uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                  <Clock size={12} />
                  SLA
                </p>
                <div className="flex items-center gap-4 text-xs">
                  {selectedTicket.slaTiempoLimite && (
                    <div>
                      <span className="text-text-muted">Tiempo limite: </span>
                      <span className="text-accent-yellow font-semibold">{selectedTicket.slaTiempoLimite}</span>
                    </div>
                  )}
                  {selectedTicket.slaImpacto && (
                    <div>
                      <span className="text-text-muted">Impacto: </span>
                      <span className="text-text-primary font-medium">{selectedTicket.slaImpacto}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Detalle del Reporte (Problema + Fotos Iniciales) */}
            <div className="mb-5">
              <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2 flex items-center gap-1">
                <FileText size={12} /> Detalle del Reporte
              </p>
              <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                <p className="text-sm text-text-primary leading-relaxed">{selectedTicket.descripcion}</p>

                {selectedTicket.adjuntos && selectedTicket.adjuntos.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-[10px] text-text-muted mb-2">Evidencia del Problema:</p>
                    <Adjuntos value={selectedTicket.adjuntos} onChange={() => { }} readOnly max={5} />
                  </div>
                )}
              </div>
            </div>

            {/* Resolución Técnica (Solución + Fotos Cierre) */}
            {(selectedTicket.solucion || selectedTicket.accionesRealizadas || (selectedTicket.adjuntosResolucion && selectedTicket.adjuntosResolucion.length > 0)) && (
              <div className="mb-5">
                <p className="text-[10px] text-green-400 uppercase tracking-wide mb-2 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Resolución
                </p>
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                  {selectedTicket.solucion && (
                    <div className="mb-3">
                      <p className="text-[10px] text-text-muted mb-0.5">Solución:</p>
                      <p className="text-sm text-text-secondary">{selectedTicket.solucion}</p>
                    </div>
                  )}
                  {selectedTicket.accionesRealizadas && (
                    <div className="mb-3">
                      <p className="text-[10px] text-text-muted mb-0.5">Acciones Realizadas:</p>
                      <p className="text-sm text-text-secondary">{selectedTicket.accionesRealizadas}</p>
                    </div>
                  )}
                  {selectedTicket.adjuntosResolucion && selectedTicket.adjuntosResolucion.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] text-text-muted mb-2">Evidencia de Resolución:</p>
                      <Adjuntos value={selectedTicket.adjuntosResolucion} onChange={() => { }} readOnly max={5} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Historial de Estados */}
            {/* Historial de Estados (Ruta de Proceso / Process Route) */}
            {selectedTicket.historial && selectedTicket.historial.length > 0 && (
              <div className="bg-bg-secondary rounded-lg p-3 mb-5 border border-border/50">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-3 font-semibold flex items-center gap-1">
                  <Kanban size={12} /> Ruta del Ticket
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Render history in chronological order (Oldest -> Newest) */}
                  {[...selectedTicket.historial].reverse().map((h, i, arr) => (
                    <div key={i} className="flex items-center">
                      <div
                        className="group relative flex items-center gap-2 bg-bg-card border border-border/60 rounded-full px-3 py-1.5 cursor-help transition-colors hover:border-accent-blue/50 hover:bg-bg-secondary"
                        title={h.motivo || 'Sin motivo registrado'}
                      >
                        {/* Estado Dot + Texto */}
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${ESTADOS_COLOR[h.estadoNuevo]?.dot || 'bg-gray-400'}`}></span>
                          <span className="text-xs font-medium text-text-primary">{h.estadoNuevo}</span>
                        </div>

                        {/* Separator & Time */}
                        <span className="text-border mx-1">|</span>
                        <span className="text-[10px] text-text-muted font-mono leading-none">
                          {new Date(h.fecha).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {/* Tooltip on Hover */}
                        {h.motivo && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] hidden group-hover:block z-50">
                            <div className="bg-gray-900 text-white text-[10px] p-2 rounded shadow-xl border border-white/10 relative">
                              {h.motivo}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Connector Arrow (if not last item) */}
                      {i < arr.length - 1 && (
                        <div className="mx-1 text-text-muted/40">
                          <ArrowUpRight size={14} strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Current State Indicator (Active) */}
                  <div className="mx-1 text-text-muted/40">
                    <ArrowUpRight size={14} strokeWidth={1.5} />
                  </div>
                  <div className="px-2 py-1 rounded bg-accent-blue/10 border border-accent-blue/30 text-[10px] font-bold text-accent-blue uppercase tracking-wider">
                    Actual
                  </div>
                </div>
              </div>
            )}

            {/* Historial de Atención (Visitas y Soporte) */}
            {(() => {
              const relatedVisitas = visitas.filter(v => v.ticketId === selectedTicket.id);
              const relatedSesiones = sesionesRemoto.filter(s => s.ticketId === selectedTicket.id);

              if (relatedVisitas.length === 0 && relatedSesiones.length === 0) return null;

              return (
                <div className="mb-4">
                  <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2">Historial de Atención</p>
                  <div className="flex flex-col gap-2">
                    {relatedSesiones.map(s => (
                      <div
                        key={s.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingHistoryItem({ type: 'soporte', data: s });
                        }}
                        className="bg-bg-secondary rounded-lg p-3 border border-border/50 cursor-pointer hover:bg-bg-card-hover transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent-cyan/15 text-accent-cyan flex items-center justify-center">
                              <Monitor size={16} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-medium text-text-primary">Soporte Remoto</p>
                                <span className="text-[10px] text-text-muted font-mono">{s.id}</span>
                              </div>
                              <p className="text-[10px] text-text-muted">{s.fecha} · {s.tecnico}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.estado === 'Completada' ? 'bg-green-500/20 text-green-400' :
                            s.estado === 'Fallida' ? 'bg-red-500/20 text-red-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                            {s.estado}
                          </span>
                        </div>
                        {(s.adjuntos?.length > 0 || s.adjuntosResolucion?.length > 0) && (
                          <div className="mt-3 pt-2 border-t border-border/50" onClick={e => e.stopPropagation()}>
                            {s.adjuntos?.length > 0 && (
                              <div className="mb-2">
                                <p className="text-[10px] text-text-muted mb-1">Evidencia Inicial:</p>
                                <Adjuntos value={s.adjuntos} onChange={() => { }} readOnly compact label={false} />
                              </div>
                            )}
                            {s.adjuntosResolucion?.length > 0 && (
                              <div>
                                <p className="text-[10px] text-text-muted mb-1">Evidencia Solución:</p>
                                <Adjuntos value={s.adjuntosResolucion} onChange={() => { }} readOnly compact label={false} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {relatedVisitas.map(v => (
                      <div
                        key={v.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingHistoryItem({ type: 'visita', data: v });
                        }}
                        className="bg-bg-secondary rounded-lg p-3 border border-border/50 cursor-pointer hover:bg-bg-card-hover transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent-purple/15 text-accent-purple flex items-center justify-center">
                              <MapPin size={16} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-medium text-text-primary">Visita Técnica</p>
                                <span className="text-[10px] text-text-muted font-mono">{v.id}</span>
                              </div>
                              <p className="text-[10px] text-text-muted">{v.fecha} · {v.tecnicoNombre}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.estado === 'Completada' ? 'bg-green-500/20 text-green-400' :
                            v.estado === 'Cancelada' ? 'bg-gray-500/20 text-gray-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                            {v.estado}
                          </span>
                        </div>
                        {(v.adjuntos?.length > 0 || v.adjuntosResolucion?.length > 0) && (
                          <div className="mt-3 pt-2 border-t border-border/50" onClick={e => e.stopPropagation()}>
                            {v.adjuntos?.length > 0 && (
                              <div className="mb-2">
                                <p className="text-[10px] text-text-muted mb-1">Evidencia Inicial:</p>
                                <Adjuntos value={v.adjuntos} onChange={() => { }} readOnly compact label={false} />
                              </div>
                            )}
                            {v.adjuntosResolucion?.length > 0 && (
                              <div>
                                <p className="text-[10px] text-text-muted mb-1">Evidencia Solución:</p>
                                <Adjuntos value={v.adjuntosResolucion} onChange={() => { }} readOnly compact label={false} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Status change buttons */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-1">Cambiar estado</p>
              <div className="flex gap-2 flex-wrap">
                {selectedTicket.estado === 'Abierto' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedTicket.id, 'En Proceso')}
                      className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 border-none text-xs font-semibold cursor-pointer hover:bg-yellow-500/30 transition-colors"
                    >
                      Pasar a En Proceso
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedTicket.id, 'Escalado')}
                      className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 border-none text-xs font-semibold cursor-pointer hover:bg-orange-500/30 transition-colors"
                    >
                      Escalar
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedTicket.id, 'Cancelado')}
                      className="px-4 py-2 rounded-lg bg-gray-500/20 text-gray-400 border-none text-xs font-semibold cursor-pointer hover:bg-gray-500/30 transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {selectedTicket.estado === 'En Proceso' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedTicket.id, 'Resuelto')}
                      className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 border-none text-xs font-semibold cursor-pointer hover:bg-green-500/30 transition-colors"
                    >
                      Marcar Resuelto
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedTicket.id, 'Escalado')}
                      className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 border-none text-xs font-semibold cursor-pointer hover:bg-orange-500/30 transition-colors"
                    >
                      Escalar
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedTicket.id, 'Abierto')}
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border-none text-xs font-semibold cursor-pointer hover:bg-red-500/30 transition-colors"
                    >
                      Devolver a Abierto
                    </button>
                  </>
                )}
                {selectedTicket.estado === 'Escalado' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedTicket.id, 'En Proceso')}
                      className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 border-none text-xs font-semibold cursor-pointer hover:bg-yellow-500/30 transition-colors"
                    >
                      Devolver a En Proceso
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedTicket.id, 'Resuelto')}
                      className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 border-none text-xs font-semibold cursor-pointer hover:bg-green-500/30 transition-colors"
                    >
                      Marcar Resuelto
                    </button>
                  </>
                )}
                {selectedTicket.estado === 'Resuelto' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedTicket.id, 'Cerrado')}
                      className="px-4 py-2 rounded-lg bg-gray-500/20 text-gray-400 border-none text-xs font-semibold cursor-pointer hover:bg-gray-500/30 transition-colors"
                    >
                      Cerrar Ticket
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedTicket.id, 'Abierto')}
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border-none text-xs font-semibold cursor-pointer hover:bg-red-500/30 transition-colors"
                    >
                      Reabrir
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Inline Action Buttons — Generar Visita / Soporte Remoto */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2">Acciones relacionadas</p>
              <div className="flex gap-2 flex-wrap">
                {selectedTicket.estado !== 'Cerrado' && selectedTicket.estado !== 'Cancelado' && (
                  <>
                    <button
                      onClick={() => {
                        const client = getClientInfo(selectedTicket.clienteId);
                        setInlineVisitaData({ ticket: selectedTicket, client });
                        setSelectedTicket(null);
                      }}
                      className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 border-none text-xs font-semibold cursor-pointer hover:bg-purple-500/30 transition-colors flex items-center gap-1.5"
                    >
                      <MapPin size={12} />
                      Generar Visita Tecnica
                    </button>
                    <button
                      onClick={() => {
                        const client = getClientInfo(selectedTicket.clienteId);
                        setInlineSoporteData({ ticket: selectedTicket, client });
                        setSelectedTicket(null);
                      }}
                      className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border-none text-xs font-semibold cursor-pointer hover:bg-cyan-500/30 transition-colors flex items-center gap-1.5"
                    >
                      <Monitor size={12} />
                      Generar Soporte Remoto
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Close modal button */}
            <div className="mt-5 pt-4 border-t border-border">
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary text-sm cursor-pointer hover:bg-bg-card-hover transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INLINE MODAL — GENERAR VISITA TECNICA */}
      {inlineVisitaData && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setInlineVisitaData(null)}
        >
          <div
            className={`bg-bg-card rounded-2xl p-6 w-[640px] border max-h-[90vh] overflow-y-auto transition-colors duration-500 ${visitaSuccess ? 'border-green-500/60' : 'border-border'
              }`}
            onClick={e => e.stopPropagation()}
          >
            {visitaSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-green-400" />
                </div>
                <p className="text-lg font-bold text-green-400">Visita Tecnica Creada</p>
                <p className="text-sm text-text-secondary">La visita fue generada exitosamente desde el ticket.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent-purple/20 flex items-center justify-center">
                      <MapPin size={18} className="text-accent-purple" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Generar Visita Tecnica</h3>
                      <p className="text-xs text-text-muted">Crear visita desde ticket</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setInlineVisitaData(null)}
                    className="text-text-muted hover:text-text-primary text-lg cursor-pointer bg-transparent border-none font-bold leading-none"
                  >
                    &times;
                  </button>
                </div>

                {/* Read-only info cards */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                    <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-1.5">Cliente</p>
                    <p className="text-sm font-medium text-text-primary">{inlineVisitaData.ticket.clienteNombre}</p>
                    <p className="text-[11px] text-text-muted font-mono mt-0.5">ID: {inlineVisitaData.ticket.clienteId}</p>
                  </div>
                  <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                    <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-1.5">Ticket</p>
                    <p className="text-sm font-medium text-text-primary font-mono">{inlineVisitaData.ticket.id}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">{inlineVisitaData.ticket.estado} — {inlineVisitaData.ticket.prioridad}</p>
                  </div>
                  {inlineVisitaData.client && (
                    <>
                      <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                        <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-1.5">Plan / Tecnologia</p>
                        <p className="text-sm font-medium text-text-primary">{inlineVisitaData.client.plan || 'N/A'}</p>
                        <p className="text-[11px] text-text-muted mt-0.5">{inlineVisitaData.client.tecnologia || 'N/A'}</p>
                      </div>
                      <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                        <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-1.5">Nodo</p>
                        <p className="text-sm font-medium text-text-primary">{inlineVisitaData.client.nodo || 'N/A'}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Form fields */}
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-text-secondary font-medium mb-1.5 block">Tecnico asignado *</label>
                      <select
                        value={visitaTecnico}
                        onChange={e => setVisitaTecnico(e.target.value)}
                        className="w-full"
                      >
                        <option value="">Seleccionar tecnico...</option>
                        {activeTecnicos.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.nombre} — {t.especialidad} ({t.zona})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary font-medium mb-1.5 block">Tipo de visita</label>
                      <select
                        value={visitaTipo}
                        onChange={e => setVisitaTipo(e.target.value)}
                        className="w-full"
                      >
                        <option value="Reparación">Reparacion</option>
                        <option value="Diagnóstico">Diagnostico</option>
                        <option value="Instalación">Instalacion</option>
                        <option value="Cambio de plan">Cambio de plan</option>
                        <option value="Mantenimiento">Mantenimiento</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-text-secondary font-medium mb-1.5 block">Prioridad</label>
                      <select
                        value={visitaPrioridad}
                        onChange={e => setVisitaPrioridad(e.target.value)}
                        className="w-full"
                      >
                        <option value="Alta">Alta</option>
                        <option value="Media">Media</option>
                        <option value="Baja">Baja</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary font-medium mb-1.5 block">Fecha programada *</label>
                      <input
                        type="date"
                        value={visitaFecha}
                        onChange={e => setVisitaFecha(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary font-medium mb-1.5 block">Hora inicio *</label>
                      <input
                        type="time"
                        value={visitaHora}
                        onChange={e => setVisitaHora(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-text-secondary font-medium mb-1.5 block">Direccion</label>
                    <input
                      type="text"
                      value={visitaDireccion}
                      onChange={e => setVisitaDireccion(e.target.value)}
                      placeholder="Direccion del cliente..."
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-text-secondary font-medium mb-1.5 block">Descripcion</label>
                    <textarea
                      value={visitaDescripcion}
                      onChange={e => setVisitaDescripcion(e.target.value)}
                      placeholder="Detalles de la visita..."
                      className="bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[80px] resize-y outline-none focus:border-accent-blue w-full"
                    />
                  </div>

                  {/* Adjuntos */}
                  <Adjuntos
                    value={visitaAdjuntos}
                    onChange={setVisitaAdjuntos}
                    max={5}
                  />

                  {/* Buttons */}
                  <div className="flex gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setInlineVisitaData(null)}
                      className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm hover:bg-bg-card-hover transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitVisita}
                      disabled={!visitaTecnico || !visitaFecha || !visitaHora}
                      className="flex-1 py-2.5 rounded-lg bg-accent-purple border-none text-white cursor-pointer text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Crear Visita Tecnica
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* INLINE MODAL — GENERAR SOPORTE REMOTO */}
      {inlineSoporteData && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setInlineSoporteData(null)}
        >
          <div
            className={`bg-bg-card rounded-2xl p-6 w-[640px] border max-h-[90vh] overflow-y-auto transition-colors duration-500 ${soporteSuccess ? 'border-green-500/60' : 'border-border'
              }`}
            onClick={e => e.stopPropagation()}
          >
            {soporteSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-green-400" />
                </div>
                <p className="text-lg font-bold text-green-400">Soporte Remoto Registrado</p>
                <p className="text-sm text-text-secondary">
                  {soporteDerivar
                    ? 'Sesion registrada y visita tecnica derivada exitosamente.'
                    : 'La sesion de soporte remoto fue registrada exitosamente.'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent-cyan/20 flex items-center justify-center">
                      <Monitor size={18} className="text-accent-cyan" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Generar Soporte Remoto</h3>
                      <p className="text-xs text-text-muted">Sesion remota desde ticket</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setInlineSoporteData(null)}
                    className="text-text-muted hover:text-text-primary text-lg cursor-pointer bg-transparent border-none font-bold leading-none"
                  >
                    &times;
                  </button>
                </div>

                {/* Read-only info cards */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                    <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-1.5">Cliente</p>
                    <p className="text-sm font-medium text-text-primary">{inlineSoporteData.ticket.clienteNombre}</p>
                    <p className="text-[11px] text-text-muted font-mono mt-0.5">ID: {inlineSoporteData.ticket.clienteId}</p>
                  </div>
                  <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                    <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-1.5">Ticket</p>
                    <p className="text-sm font-medium text-text-primary font-mono">{inlineSoporteData.ticket.id}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">{inlineSoporteData.ticket.estado} — {inlineSoporteData.ticket.prioridad}</p>
                  </div>
                  {inlineSoporteData.client && (
                    <>
                      <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                        <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-1.5">Tecnologia / Plan</p>
                        <p className="text-sm font-medium text-text-primary">{inlineSoporteData.client.tecnologia || 'N/A'}</p>
                        <p className="text-[11px] text-text-muted mt-0.5">{inlineSoporteData.client.plan || 'N/A'}</p>
                      </div>
                      <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                        <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-1.5">IP / Nodo</p>
                        <p className="text-sm font-medium text-text-primary font-mono">{inlineSoporteData.client.ip || 'N/A'}</p>
                        <p className="text-[11px] text-text-muted mt-0.5">{inlineSoporteData.client.nodo || 'N/A'}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Form fields */}
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-text-secondary font-medium mb-1.5 block">Tipo de sesion</label>
                      <select
                        value={soporteTipo}
                        onChange={e => setSoporteTipo(e.target.value)}
                        className="w-full"
                      >
                        <option value="Diagnóstico">Diagnostico</option>
                        <option value="Configuración">Configuracion</option>
                        <option value="Monitoreo">Monitoreo</option>
                        <option value="Reinicio remoto">Reinicio remoto</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary font-medium mb-1.5 block">Tecnico *</label>
                      <select
                        value={soporteTecnico}
                        onChange={e => setSoporteTecnico(e.target.value)}
                        className="w-full"
                      >
                        <option value="">Seleccionar...</option>
                        {activeTecnicos.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.nombre} — {t.especialidad}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary font-medium mb-1.5 block">IP del equipo</label>
                      <input
                        type="text"
                        value={soporteIP}
                        onChange={e => setSoporteIP(e.target.value)}
                        placeholder="192.168.x.x"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* DIAGNOSTIC PARAMETERS */}
                  <div className="border border-border rounded-lg p-4 bg-bg-secondary/50">
                    <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-3">Parametros de Diagnostico</p>

                    {/* Common parameters */}
                    <p className="text-[10px] text-accent-blue uppercase tracking-wide font-semibold mb-2">Parametros comunes</p>
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      <div>
                        <label className="text-xs text-text-secondary font-medium mb-1.5 block">Ping (ms)</label>
                        <input
                          type="number"
                          value={diagPing}
                          onChange={e => setDiagPing(e.target.value)}
                          placeholder="0"
                          className="w-full"
                          step="any"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-secondary font-medium mb-1.5 block">Download (Mbps)</label>
                        <input
                          type="number"
                          value={diagDownload}
                          onChange={e => setDiagDownload(e.target.value)}
                          placeholder="0"
                          className="w-full"
                          step="any"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-secondary font-medium mb-1.5 block">Upload (Mbps)</label>
                        <input
                          type="number"
                          value={diagUpload}
                          onChange={e => setDiagUpload(e.target.value)}
                          placeholder="0"
                          className="w-full"
                          step="any"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-secondary font-medium mb-1.5 block">Pkt Loss (%)</label>
                        <input
                          type="number"
                          value={diagPacketLoss}
                          onChange={e => setDiagPacketLoss(e.target.value)}
                          placeholder="0"
                          className="w-full"
                          step="any"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-secondary font-medium mb-1.5 block">Jitter (ms)</label>
                        <input
                          type="number"
                          value={diagJitter}
                          onChange={e => setDiagJitter(e.target.value)}
                          placeholder="0"
                          className="w-full"
                          step="any"
                        />
                      </div>
                    </div>

                    {/* Technology-specific parameters */}
                    {inlineSoporteData.client?.tecnologia === 'Radio Enlace' && (
                      <>
                        <p className="text-[10px] text-accent-purple uppercase tracking-wide font-semibold mb-2">Radio Enlace</p>
                        <div className="grid grid-cols-5 gap-2">
                          <div>
                            <label className="text-xs text-text-secondary font-medium mb-1.5 block">Senal Rx (dBm)</label>
                            <input
                              type="number"
                              value={diagSenalRecibida}
                              onChange={e => setDiagSenalRecibida(e.target.value)}
                              placeholder="-65"
                              className="w-full"
                              step="any"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-text-secondary font-medium mb-1.5 block">Noise (dBm)</label>
                            <input
                              type="number"
                              value={diagNoiseFloor}
                              onChange={e => setDiagNoiseFloor(e.target.value)}
                              placeholder="-95"
                              className="w-full"
                              step="any"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-text-secondary font-medium mb-1.5 block">CCQ (%)</label>
                            <input
                              type="number"
                              value={diagCCQ}
                              onChange={e => setDiagCCQ(e.target.value)}
                              placeholder="100"
                              className="w-full"
                              step="any"
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-text-secondary font-medium mb-1.5 block">Frec. (GHz)</label>
                            <input
                              type="number"
                              value={diagFrecuencia}
                              onChange={e => setDiagFrecuencia(e.target.value)}
                              placeholder="5.8"
                              className="w-full"
                              step="any"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-text-secondary font-medium mb-1.5 block">Canal</label>
                            <input
                              type="text"
                              value={diagCanal}
                              onChange={e => setDiagCanal(e.target.value)}
                              placeholder="Auto"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {inlineSoporteData.client?.tecnologia === 'Fibra Óptica' && (
                      <>
                        <p className="text-[10px] text-accent-green uppercase tracking-wide font-semibold mb-2">Fibra Optica</p>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="text-xs text-text-secondary font-medium mb-1.5 block">Pot. Rx (dBm)</label>
                            <input
                              type="number"
                              value={diagPotenciaRx}
                              onChange={e => setDiagPotenciaRx(e.target.value)}
                              placeholder="-18"
                              className="w-full"
                              step="any"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-text-secondary font-medium mb-1.5 block">Pot. Tx (dBm)</label>
                            <input
                              type="number"
                              value={diagPotenciaTx}
                              onChange={e => setDiagPotenciaTx(e.target.value)}
                              placeholder="2.5"
                              className="w-full"
                              step="any"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-text-secondary font-medium mb-1.5 block">Atenuacion (dB)</label>
                            <input
                              type="number"
                              value={diagAtenuacion}
                              onChange={e => setDiagAtenuacion(e.target.value)}
                              placeholder="0"
                              className="w-full"
                              step="any"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-text-secondary font-medium mb-1.5 block">Puerto OLT</label>
                            <input
                              type="text"
                              value={diagPuertoOLT}
                              onChange={e => setDiagPuertoOLT(e.target.value)}
                              placeholder="GPON 0/1/1"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="text-xs text-text-secondary font-medium mb-1.5 block">Observaciones / Resultado</label>
                    <textarea
                      value={soporteObservaciones}
                      onChange={e => setSoporteObservaciones(e.target.value)}
                      placeholder="Resultados de la sesion, observaciones, acciones tomadas..."
                      className="bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[80px] resize-y outline-none focus:border-accent-blue w-full"
                    />
                  </div>

                  {/* Adjuntos */}
                  <Adjuntos
                    value={soporteAdjuntos}
                    onChange={setSoporteAdjuntos}
                    max={5}
                  />

                  {/* Derivar a visita */}
                  <label className="flex items-center gap-2.5 cursor-pointer bg-bg-secondary rounded-lg p-3 border border-border/50 hover:border-accent-purple/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={soporteDerivar}
                      onChange={e => setSoporteDerivar(e.target.checked)}
                      className="w-4 h-4 accent-accent-purple cursor-pointer"
                    />
                    <div>
                      <p className="text-sm font-medium text-text-primary">Derivar a Visita Tecnica</p>
                      <p className="text-[11px] text-text-muted">Al guardar, tambien se creara una visita tecnica con los datos de este ticket.</p>
                    </div>
                  </label>

                  {/* Buttons */}
                  <div className="flex gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setInlineSoporteData(null)}
                      className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm hover:bg-bg-card-hover transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitSoporte}
                      disabled={!soporteTecnico}
                      className="flex-1 py-2.5 rounded-lg bg-accent-cyan border-none text-white cursor-pointer text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {soporteDerivar ? 'Registrar y Derivar' : 'Registrar Soporte Remoto'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* HISTORY ITEM DETAIL MODAL (z-index 60 to appear above ticket modal) */}
      {viewingHistoryItem && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center"
          style={{ zIndex: 60 }}
          onClick={() => setViewingHistoryItem(null)}
        >
          <div
            className="bg-bg-card rounded-2xl p-6 w-[500px] border border-border max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {(() => {
              const item = viewingHistoryItem.data;
              const isVisita = viewingHistoryItem.type === 'visita';
              const d = item.diagnosticos;
              const warns = getDiagWarnings(d);
              const hasDiag = d && Object.values(d).some(v => v !== '' && v !== null && v !== undefined);
              const techStr = (item.tecnologia || '').toLowerCase();
              const showRadio = techStr.includes('radio');
              const showFibra = techStr.includes('fibra');

              return (
                <>
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-text-muted">{item.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.estado === 'Completada' ? 'bg-green-500/20 text-green-400' :
                          item.estado === 'Fallida' || item.estado === 'Cancelada' ? 'bg-red-500/20 text-red-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                          {item.estado}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold">
                        {isVisita ? 'Detalle de Visita' : 'Detalle de Soporte Remoto'}
                      </h3>
                    </div>
                    <button onClick={() => setViewingHistoryItem(null)} className="text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-bg-secondary rounded-lg p-3">
                        <p className="text-[10px] text-text-muted uppercase mb-0.5">Técnico</p>
                        <p className="text-sm font-medium">{item.tecnico || item.tecnicoNombre}</p>
                      </div>
                      <div className="bg-bg-secondary rounded-lg p-3">
                        <p className="text-[10px] text-text-muted uppercase mb-0.5">Fecha</p>
                        <p className="text-sm font-medium">
                          {item.fecha}
                          {isVisita && item.horaInicio && (
                            <span className="block text-xs text-text-muted mt-0.5">
                              {item.horaInicio} {item.horaFin ? `- ${item.horaFin}` : ''}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {isVisita ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-bg-secondary rounded-lg p-3">
                            <p className="text-[10px] text-text-muted uppercase mb-0.5">Tipo</p>
                            <p className="text-sm font-medium">{item.tipo}</p>
                          </div>
                          <div className="bg-bg-secondary rounded-lg p-3">
                            <p className="text-[10px] text-text-muted uppercase mb-0.5">Prioridad</p>
                            <p className="text-sm font-medium">{item.prioridad}</p>
                          </div>
                        </div>
                        <div className="bg-bg-secondary rounded-lg p-3">
                          <p className="text-[10px] text-text-muted uppercase mb-0.5">Dirección</p>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <MapPin size={12} className="text-text-muted" />
                            {item.direccion}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-bg-secondary rounded-lg p-3">
                          <p className="text-[10px] text-text-muted uppercase mb-0.5">Tipo</p>
                          <p className="text-sm font-medium">{item.tipo}</p>
                        </div>
                        <div className="bg-bg-secondary rounded-lg p-3">
                          <p className="text-[10px] text-text-muted uppercase mb-0.5">IP</p>
                          <p className="text-sm font-mono text-accent-cyan">{item.ip}</p>
                        </div>
                      </div>
                    )}

                    {item.descripcion && (
                      <div className="bg-bg-secondary rounded-lg p-3">
                        <p className="text-[10px] text-text-muted uppercase mb-1">Descripción</p>
                        <p className="text-sm text-text-secondary">{item.descripcion}</p>
                      </div>
                    )}

                    {(item.resultado || item.observaciones) && (
                      <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                        <p className="text-[10px] text-green-400 uppercase mb-1">Resultado / Observaciones</p>
                        <p className="text-sm text-text-secondary">{item.resultado || item.observaciones}</p>
                      </div>
                    )}

                    {/* Resolution Info for History Item */}
                    {(item.solucion || item.accionesRealizadas) && (
                      <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                        <p className="text-[10px] text-green-400 uppercase mb-1 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Resolución
                        </p>
                        {item.solucion && (
                          <div className="mb-2">
                            <p className="text-[10px] text-text-muted mb-0.5">Solución:</p>
                            <p className="text-sm text-text-secondary">{item.solucion}</p>
                          </div>
                        )}
                        {item.accionesRealizadas && (
                          <div className="mb-2">
                            <p className="text-[10px] text-text-muted mb-0.5">Acciones:</p>
                            <p className="text-sm text-text-secondary">{item.accionesRealizadas}</p>
                          </div>
                        )}
                        {item.adjuntosResolucion && item.adjuntosResolucion.length > 0 && (
                          <div className="mt-2">
                            <p className="text-[10px] text-text-muted mb-1">Evidencia de Resolución:</p>
                            <Adjuntos value={item.adjuntosResolucion} onChange={() => { }} readOnly max={5} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Full Diagnostic Report for Soporte Remoto */}
                    {!isVisita && hasDiag && (
                      <div className="border-t border-border pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Gauge size={16} className="text-accent-cyan" />
                          <h4 className="text-sm font-bold text-text-primary">Reporte de Diagnóstico</h4>
                        </div>

                        {/* General */}
                        {(d.ping || d.download || d.upload || d.packetLoss || d.jitter) && (
                          <div className="mb-4">
                            <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2">Parámetros generales</p>
                            <div className="grid grid-cols-3 gap-2">
                              <DiagValue label="Ping" value={d.ping} unit="ms" warn={warns.ping} />
                              <DiagValue label="Download" value={d.download} unit="Mbps" warn={warns.download} />
                              <DiagValue label="Upload" value={d.upload} unit="Mbps" warn={warns.upload} />
                              <DiagValue label="Packet Loss" value={d.packetLoss} unit="%" warn={warns.packetLoss} />
                              <DiagValue label="Jitter" value={d.jitter} unit="ms" warn={warns.jitter} />
                            </div>
                          </div>
                        )}

                        {/* Radio */}
                        {showRadio && (d.senalRecibida || d.noiseFloor || d.ccq || d.frecuencia || d.canal || d.anchoBandaEnlace) && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Radio size={12} className="text-accent-purple" />
                              <p className="text-[10px] text-accent-purple uppercase tracking-wide font-semibold">Radio Enlace</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <DiagValue label="Señal Recibida" value={d.senalRecibida} unit="dBm" warn={warns.senalRecibida} />
                              <DiagValue label="Noise Floor" value={d.noiseFloor} unit="dBm" />
                              <DiagValue label="CCQ" value={d.ccq} unit="%" warn={warns.ccq} />
                              <DiagValue label="Frecuencia" value={d.frecuencia} unit="GHz" />
                              <DiagValue label="Canal" value={d.canal} />
                              <DiagValue label="Ancho de Banda" value={d.anchoBandaEnlace} />
                            </div>
                          </div>
                        )}

                        {/* Fibra */}
                        {showFibra && (d.potenciaRx || d.potenciaTx || d.atenuacion || d.puertoOLT || d.estadoONU) && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap size={12} className="text-accent-green" />
                              <p className="text-[10px] text-accent-green uppercase tracking-wide font-semibold">Fibra Óptica</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <DiagValue label="Potencia Rx" value={d.potenciaRx} unit="dBm" warn={warns.potenciaRx} />
                              <DiagValue label="Potencia Tx" value={d.potenciaTx} unit="dBm" />
                              <DiagValue label="Atenuación" value={d.atenuacion} unit="dB" warn={warns.atenuacion} />
                              <DiagValue label="Puerto OLT" value={d.puertoOLT} />
                              <DiagValue label="Estado ONU" value={d.estadoONU} warn={warns.estadoONU} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {item.adjuntos && item.adjuntos.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] text-text-muted mb-1">Imágenes de la Avería / Iniciales:</p>
                        <Adjuntos value={item.adjuntos} onChange={() => { }} readOnly max={5} />
                      </div>
                    )}
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
        title={resolutionTarget?.newEstado === 'Cerrado' ? 'Cerrar Ticket' : 'Resolver Ticket'}
        entityId={resolutionTarget ? tickets.find(t => t.id === resolutionTarget.ticketId)?.id : ''}
        entityLabel="Ticket"
        newStatus={resolutionTarget?.newEstado || ''}
        accentColor={resolutionTarget?.newEstado === 'Cerrado' ? 'accent-gray' : 'accent-green'}
      />
    </div>
  );
}
