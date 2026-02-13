import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Calendar, List, Clock, ChevronLeft, ChevronRight, MapPin, User, X, FileText, CheckCircle2, Info } from 'lucide-react';
import useStore from '../../store/useStore';
import Adjuntos, { AdjuntosCount } from '../common/Adjuntos';
import ResolutionModal from '../common/ResolutionModal';

const ESTADO_COLORS = {
  'Programada': { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400', hex: '#3b82f6' },
  'En Ruta': { bg: 'bg-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400', hex: '#8b5cf6' },
  'En Sitio': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400', hex: '#f59e0b' },
  'Completada': { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-400', hex: '#10b981' },
  'Cancelada': { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-400', hex: '#6b7280' },
  'Ausente': { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-400', hex: '#f97316' },
};

const PRIORIDAD_COLOR = {
  'Alta': { text: 'text-red-400', hex: '#ef4444' },
  'Media': { text: 'text-yellow-400', hex: '#f59e0b' },
  'Baja': { text: 'text-green-400', hex: '#10b981' },
};

const TECNICO_COLORS = [
  { bg: '#3b82f620', border: '#3b82f6', text: '#93c5fd' },
  { bg: '#8b5cf620', border: '#8b5cf6', text: '#c4b5fd' },
  { bg: '#10b98120', border: '#10b981', text: '#6ee7b7' },
  { bg: '#f59e0b20', border: '#f59e0b', text: '#fcd34d' },
  { bg: '#ef444420', border: '#ef4444', text: '#fca5a5' },
];

const TIPOS_VISITA = ['Reparacion', 'Diagnostico', 'Instalacion', 'Cambio de plan', 'Mantenimiento'];
const TIPOS_VISITA_DISPLAY = {
  'Reparacion': 'Reparacion',
  'Diagnostico': 'Diagnostico',
  'Instalacion': 'Instalacion',
  'Cambio de plan': 'Cambio de plan',
  'Mantenimiento': 'Mantenimiento',
  'Reparación': 'Reparación',
  'Diagnóstico': 'Diagnóstico',
  'Instalación': 'Instalación',
};

const DAYS_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateStr(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(d) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getWeekDays(monday) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: formatDateStr(start), end: formatDateStr(end) };
}

export default function VisitasTecnicasPage() {
  const visitas = useStore(s => s.visitas);
  const addVisita = useStore(s => s.addVisita);
  const updateVisita = useStore(s => s.updateVisita);
  const clients = useStore(s => s.clients);
  const tecnicos = useStore(s => s.tecnicos);
  const tickets = useStore(s => s.tickets);

  const [viewMode, setViewMode] = useState('calendar');
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterTecnico, setFilterTecnico] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedVisita, setSelectedVisita] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const [formClientSearch, setFormClientSearch] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formClientNombre, setFormClientNombre] = useState('');
  const [formTecnicoId, setFormTecnicoId] = useState('');
  const [formTipo, setFormTipo] = useState('Reparación');
  const [formPrioridad, setFormPrioridad] = useState('Media');
  const [formFecha, setFormFecha] = useState(formatDateStr(new Date()));
  const [formHoraInicio, setFormHoraInicio] = useState('09:00');
  const [formHoraFin, setFormHoraFin] = useState('10:00');
  const [formDireccion, setFormDireccion] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formTicketId, setFormTicketId] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [formTicketSearch, setFormTicketSearch] = useState('');
  const [showTicketDropdown, setShowTicketDropdown] = useState(false);
  const [formAdjuntos, setFormAdjuntos] = useState([]);

  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionTarget, setResolutionTarget] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleAdjuntos, setRescheduleAdjuntos] = useState([]);
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [absentReason, setAbsentReason] = useState('');
  const [absentAdjuntos, setAbsentAdjuntos] = useState([]);
  const [hideCancelled, setHideCancelled] = useState(false);

  const prefillVisita = useStore(s => s.prefillVisita);
  const clearPrefillVisita = useStore(s => s.clearPrefillVisita);

  useEffect(() => {
    if (prefillVisita) {
      setFormClientId(prefillVisita.clienteId);
      setFormClientNombre(prefillVisita.clienteNombre);
      setFormClientSearch(prefillVisita.clienteNombre);
      setFormTicketId(prefillVisita.ticketId || '');
      setFormDescripcion(prefillVisita.descripcion || '');
      setShowNewModal(true);
      clearPrefillVisita();
    }
  }, [prefillVisita]);

  // Sync selectedVisita with store updates (moved from JSX)
  useEffect(() => {
    if (selectedVisita) {
      const updated = visitas.find(v => v.id === selectedVisita.id);
      if (updated && updated !== selectedVisita) {
        setSelectedVisita(updated);
      }
    }
  }, [visitas, selectedVisita]);

  const currentMonday = useMemo(() => {
    const today = new Date();
    const monday = getMonday(today);
    monday.setDate(monday.getDate() + weekOffset * 7);
    return monday;
  }, [weekOffset]);

  const weekDays = useMemo(() => getWeekDays(currentMonday), [currentMonday]);

  const tecnicoColorMap = useMemo(() => {
    const map = {};
    const uniqueTecnicos = [...new Set(visitas.map(v => v.tecnicoId))];
    uniqueTecnicos.forEach((id, i) => {
      map[id] = TECNICO_COLORS[i % TECNICO_COLORS.length];
    });
    return map;
  }, [visitas]);

  const monthRange = useMemo(() => getMonthRange(), []);

  const stats = useMemo(() => {
    const monthVisitas = visitas.filter(v => v.fecha >= monthRange.start && v.fecha <= monthRange.end);
    return {
      programadas: visitas.filter(v => v.estado === 'Programada').length,
      enRuta: visitas.filter(v => v.estado === 'En Ruta').length,
      completadas: visitas.filter(v => v.estado === 'Completada').length,
      totalMes: monthVisitas.length,
    };
  }, [visitas, monthRange]);

  const filteredVisitas = useMemo(() => {
    return visitas.filter(v => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        v.clienteNombre.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q) ||
        (v.tecnicoNombre && v.tecnicoNombre.toLowerCase().includes(q)) ||
        (v.direccion && v.direccion.toLowerCase().includes(q));
      const matchEstado = filterEstado === 'all' || v.estado === filterEstado;
      const matchTipo = filterTipo === 'all' || v.tipo === filterTipo;
      const matchTecnico = filterTecnico === 'all' || v.tecnicoId === filterTecnico;
      return matchSearch && matchEstado && matchTipo && matchTecnico;
    });
  }, [visitas, search, filterEstado, filterTipo, filterTecnico]);

  const calendarVisitas = useMemo(() => {
    const weekStart = formatDateStr(weekDays[0]);
    const weekEnd = formatDateStr(weekDays[5]);
    return visitas.filter(v => {
      if (v.fecha < weekStart || v.fecha > weekEnd) return false;
      if (hideCancelled && (v.estado === 'Cancelada' || v.estado === 'Ausente')) return false;
      return true;
    });
  }, [visitas, weekDays, hideCancelled]);

  const filteredClients = useMemo(() => {
    if (!formClientSearch || formClientSearch.length < 2) return [];
    const q = formClientSearch.toLowerCase();
    return clients.filter(c =>
      (c.nombre && c.nombre.toLowerCase().includes(q)) ||
      (c.id && c.id.includes(q))
    ).slice(0, 8);
  }, [clients, formClientSearch]);

  const filteredTickets = useMemo(() => {
    if (!formTicketSearch || formTicketSearch.length < 2) return [];
    const q = formTicketSearch.toLowerCase();
    return tickets.filter(t =>
      t.id.toLowerCase().includes(q) ||
      t.clienteNombre.toLowerCase().includes(q) ||
      t.descripcion.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [tickets, formTicketSearch]);

  const activeTecnicos = useMemo(() => {
    return tecnicos.filter(t => t.estado === 'Activo');
  }, [tecnicos]);

  function resetForm() {
    setFormClientSearch('');
    setFormClientId('');
    setFormClientNombre('');
    setFormTecnicoId('');
    setFormTipo('Reparación');
    setFormPrioridad('Media');
    setFormFecha(formatDateStr(new Date()));
    setFormHoraInicio('09:00');
    setFormHoraFin('10:00');
    setFormDireccion('');
    setFormDescripcion('');
    setFormTicketId('');
    setShowClientDropdown(false);
    setFormTicketSearch('');
    setShowTicketDropdown(false);
    setFormAdjuntos([]);
  }

  function handleSelectClient(client) {
    setFormClientId(client.id);
    setFormClientNombre(client.nombre);
    setFormClientSearch(client.nombre);
    setFormDireccion(client.direccion || client.sector || '');
    setShowClientDropdown(false);
  }

  function handleCreateVisita(e) {
    e.preventDefault();
    if (!formClientId || !formTecnicoId) return;
    const tecnico = tecnicos.find(t => t.id === formTecnicoId);
    addVisita({
      clienteId: formClientId,
      clienteNombre: formClientNombre,
      tecnicoId: formTecnicoId,
      tecnicoNombre: tecnico ? tecnico.nombre : '',
      tipo: formTipo,
      estado: 'Programada',
      prioridad: formPrioridad,
      direccion: formDireccion,
      descripcion: formDescripcion,
      resultado: '',
      fecha: formFecha,
      horaInicio: formHoraInicio,
      horaFin: formHoraFin || null,
      ticketId: formTicketId || null,
      adjuntos: formAdjuntos,
    });
    setShowNewModal(false);
    resetForm();
  }

  const handleStatusChange = (id, newEstado) => {
    if (newEstado === 'Completada') {
      setResolutionTarget({ visitaId: id, newEstado });
      setShowResolutionModal(true);
    } else {
      updateVisita(id, {
        estado: newEstado,
        _historyComment: 'Cambio de estado manual'
      });
    }
  };

  const handleResolutionConfirm = (resolutionData) => {
    if (!resolutionTarget) return;

    updateVisita(resolutionTarget.visitaId, {
      estado: resolutionTarget.newEstado,
      ...resolutionData,
      _historyComment: resolutionData.solucion // This will be captured as 'motivo' in store
    });

    setShowResolutionModal(false);
    setResolutionTarget(null);
  };

  const handleRescheduleClick = () => {
    setRescheduleDate('');
    setRescheduleTime('');
    setRescheduleReason('');
    setRescheduleAdjuntos([]);
    setShowRescheduleModal(true);
  };

  const confirmReschedule = async () => {
    if (!selectedVisita) return;

    // Subir adjuntos si los hay (mock)
    const uploadedUrls = [];
    if (rescheduleAdjuntos.length > 0) {
      for (const file of rescheduleAdjuntos) {
        uploadedUrls.push({ name: file.name, url: file.dataUrl, type: file.type });
      }
    }

    const updates = {
      estado: 'Programada', // Al reprogramar vuelve a programada
      fecha: rescheduleDate || selectedVisita.fecha,
      horaInicio: rescheduleTime || selectedVisita.horaInicio,
      motivoReprogramacion: rescheduleReason,
      evidenciaReprogramacion: uploadedUrls,
      _historyComment: `Reprogramado: ${rescheduleReason}` // Store will append this to history
    };

    updateVisita(selectedVisita.id, updates);
    setShowRescheduleModal(false);
  };

  const handleAbsentClick = () => {
    setAbsentReason('');
    setAbsentAdjuntos([]);
    setShowAbsentModal(true);
  };

  const confirmAbsent = async () => {
    if (!selectedVisita) return;

    const uploadedUrls = [];
    if (absentAdjuntos.length > 0) {
      for (const file of absentAdjuntos) {
        uploadedUrls.push({ name: file.name, url: file.dataUrl, type: file.type });
      }
    }

    updateVisita(selectedVisita.id, {
      estado: 'Cancelada',
      resultado: `Cliente Ausente: ${absentReason}`,
      evidenciaResultado: uploadedUrls,
      _historyComment: `Cliente Ausente: ${absentReason}`
    });

    setShowAbsentModal(false);
  };

  function getVisitaForSlot(dayStr, hour) {
    return calendarVisitas.filter(v => {
      if (v.fecha !== dayStr) return false;
      if (!v.horaInicio) return false;
      const visitaHour = parseInt(v.horaInicio.split(':')[0], 10);
      return visitaHour === hour;
    });
  }

  function getStatusTransitions(estado) {
    switch (estado) {
      case 'Programada': return ['En Ruta'];
      case 'En Ruta': return ['En Sitio'];
      case 'En Sitio': return ['Completada'];
      default: return [];
    }
  }

  const weekLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[5];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${monthNames[start.getMonth()]} ${start.getFullYear()}`;
    }
    return `${start.getDate()} ${monthNames[start.getMonth()]} - ${end.getDate()} ${monthNames[end.getMonth()]} ${start.getFullYear()}`;
  }, [weekDays]);

  const todayStr = formatDateStr(new Date());

  return (
    <div className="animate-fade p-6 px-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Visitas Técnicas</h1>
          <p className="text-text-secondary text-sm mt-1">
            {stats.totalMes} visitas este mes &mdash; {stats.programadas} programadas, {stats.enRuta} en ruta
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-bg-secondary rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 flex items-center gap-1.5 text-xs font-medium cursor-pointer border-none transition-colors ${viewMode === 'calendar'
                ? 'bg-accent-blue text-white'
                : 'bg-transparent text-text-secondary hover:text-text-primary'
                }`}
            >
              <Calendar size={14} /> Calendario
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 flex items-center gap-1.5 text-xs font-medium cursor-pointer border-none transition-colors ${viewMode === 'list'
                ? 'bg-accent-blue text-white'
                : 'bg-transparent text-text-secondary hover:text-text-primary'
                }`}
            >
              <List size={14} /> Lista
            </button>
          </div>
          <button
            onClick={() => { resetForm(); setShowNewModal(true); }}
            className="py-2.5 px-4 rounded-xl bg-accent-blue border-none text-white text-sm font-semibold cursor-pointer flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Nueva Visita
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Programadas', value: stats.programadas, color: '#3b82f6', icon: <Calendar size={16} /> },
          { label: 'En Ruta', value: stats.enRuta, color: '#8b5cf6', icon: <MapPin size={16} /> },
          { label: 'Completadas', value: stats.completadas, color: '#10b981', icon: <Clock size={16} /> },
          { label: 'Total del mes', value: stats.totalMes, color: '#f59e0b', icon: <List size={16} /> },
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

      {/* Search + Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            placeholder="Buscar por cliente, técnico, dirección..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-blue"
          />
        </div>
        <select
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value)}
          className="min-w-[150px] bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-blue"
        >
          <option value="all">Todos los estados</option>
          <option value="Programada">Programada</option>
          <option value="En Ruta">En Ruta</option>
          <option value="En Sitio">En Sitio</option>
          <option value="Completada">Completada</option>
          <option value="Cancelada">Cancelada</option>
          <option value="Ausente">Ausente</option>
        </select>
        <select
          value={filterTipo}
          onChange={e => setFilterTipo(e.target.value)}
          className="min-w-[150px] bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-blue"
        >
          <option value="all">Todos los tipos</option>
          <option value="Reparación">Reparación</option>
          <option value="Diagnóstico">Diagnóstico</option>
          <option value="Instalación">Instalación</option>
          <option value="Cambio de plan">Cambio de plan</option>
          <option value="Mantenimiento">Mantenimiento</option>
        </select>
        <select
          value={filterTecnico}
          onChange={e => setFilterTecnico(e.target.value)}
          className="min-w-[150px] bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-blue"
        >
          <option value="all">Todos los técnicos</option>
          {tecnicos.map(t => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
      </div>

      {/* ==================== CALENDAR VIEW ==================== */}
      {viewMode === 'calendar' && (
        <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
          {/* Week navigation */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <button
              onClick={() => setWeekOffset(o => o - 1)}
              className="p-1.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer hover:text-text-primary hover:border-accent-blue/50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">{weekLabel}</span>
              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="text-[11px] text-accent-blue cursor-pointer bg-accent-blue/10 px-2 py-0.5 rounded border-none hover:bg-accent-blue/20 transition-colors"
                >
                  Hoy
                </button>
              )}
            </div>
            <button
              onClick={() => setWeekOffset(o => o + 1)}
              className="p-1.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer hover:text-text-primary hover:border-accent-blue/50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Tecnico legend */}
          <div className="flex items-center justify-between px-5 py-2 border-b border-border bg-bg-secondary/50">
            <div className="flex items-center gap-4 overflow-hidden">
              <span className="text-[10px] text-text-muted uppercase tracking-wide flex-shrink-0">Técnicos:</span>
              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
                {[...new Set(calendarVisitas.map(v => v.tecnicoId))].map(tid => {
                  const tec = tecnicos.find(t => t.id === tid);
                  const color = tecnicoColorMap[tid];
                  if (!tec || !color) return null;
                  return (
                    <div key={tid} className="flex items-center gap-1.5 whitespace-nowrap">
                      <span
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ background: color.border }}
                      />
                      <span className="text-[11px] text-text-secondary">{tec.nombre}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer ml-4 pl-4 border-l border-border/50 flex-shrink-0">
              <input
                type="checkbox"
                checked={hideCancelled}
                onChange={e => setHideCancelled(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-border accent-accent-blue cursor-pointer"
              />
              <span className="text-[10px] text-text-secondary font-medium">Ocultar Canceladas/Ausentes</span>
            </label>
          </div>

          {/* Calendar grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Day headers */}
              <div className="grid grid-cols-[60px_repeat(6,1fr)] border-b border-border">
                <div className="p-2 text-center text-[10px] text-text-muted uppercase" />
                {weekDays.map((day, i) => {
                  const dayStr = formatDateStr(day);
                  const isToday = dayStr === todayStr;
                  return (
                    <div
                      key={i}
                      className={`p-2 text-center border-l border-border ${isToday ? 'bg-accent-blue/5' : ''}`}
                    >
                      <span className="text-[10px] text-text-muted uppercase tracking-wide block">
                        {DAYS_LABELS[i]}
                      </span>
                      <span
                        className={`text-sm font-semibold ${isToday ? 'text-accent-blue' : 'text-text-primary'
                          }`}
                      >
                        {formatDateDisplay(day)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Time slots */}
              {HOURS.map(hour => (
                <div key={hour} className="grid grid-cols-[60px_repeat(6,1fr)] border-b border-border last:border-b-0">
                  <div className="p-2 text-right pr-3 text-[11px] text-text-muted font-mono flex items-start justify-end pt-1">
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  {weekDays.map((day, dayIdx) => {
                    const dayStr = formatDateStr(day);
                    const isToday = dayStr === todayStr;
                    const slotVisitas = getVisitaForSlot(dayStr, hour);
                    return (
                      <div
                        key={dayIdx}
                        className={`border-l border-border min-h-[52px] p-0.5 ${isToday ? 'bg-accent-blue/5' : ''
                          }`}
                      >
                        {slotVisitas.map(v => {
                          const color = tecnicoColorMap[v.tecnicoId] || TECNICO_COLORS[0];
                          const estadoColor = ESTADO_COLORS[v.estado];
                          return (
                            <div
                              key={v.id}
                              onClick={() => setSelectedVisita(v)}
                              className="rounded-md px-1.5 py-1 mb-0.5 cursor-pointer transition-all hover:opacity-80 hover:scale-[1.02]"
                              style={{
                                background: color.bg,
                                borderLeft: `3px solid ${color.border}`,
                              }}
                              title={`${v.clienteNombre} - ${v.tipo} (${v.tecnicoNombre})`}
                            >
                              <p
                                className="text-[10px] font-semibold truncate leading-tight"
                                style={{ color: color.text }}
                              >
                                {v.clienteNombre.length > 18
                                  ? v.clienteNombre.substring(0, 18) + '...'
                                  : v.clienteNombre}
                              </p>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-[9px] truncate" style={{ color: color.text, opacity: 0.8 }}>
                                  {v.tipo}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span
                                    className="text-[8px] px-1 rounded font-semibold"
                                    style={{ background: estadoColor ? estadoColor.hex + '30' : '#6b728030', color: estadoColor ? estadoColor.hex : '#6b7280' }}
                                  >
                                    {v.estado === 'En Ruta' ? 'Ruta' : v.estado === 'En Sitio' ? 'Sitio' : v.estado === 'Programada' ? 'Prog' : v.estado === 'Completada' ? 'OK' : v.estado}
                                  </span>
                                  <AdjuntosCount count={v.adjuntos?.length} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== LIST VIEW ==================== */}
      {viewMode === 'list' && (
        <div className="flex flex-col gap-3">
          {filteredVisitas.length === 0 && (
            <div className="bg-bg-card rounded-xl border border-border p-8 text-center">
              <p className="text-text-muted text-sm">No se encontraron visitas con los filtros seleccionados.</p>
            </div>
          )}
          {filteredVisitas.map(v => {
            const ec = ESTADO_COLORS[v.estado] || ESTADO_COLORS['Programada'];
            const pc = PRIORIDAD_COLOR[v.prioridad] || PRIORIDAD_COLOR['Media'];
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVisita(v)}
                className="bg-bg-card rounded-xl p-4 border border-border cursor-pointer transition-all hover:border-accent-blue/50 hover:bg-bg-card/80"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs text-text-muted">{v.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${ec.bg} ${ec.text}`}
                    >
                      {v.estado}
                    </span>
                    <span className={`text-[11px] font-semibold ${pc.text}`}>{v.prioridad}</span>
                    <span className="text-[11px] text-text-muted bg-bg-secondary px-2 py-0.5 rounded">
                      {v.tipo}
                    </span>
                    <AdjuntosCount count={v.adjuntos?.length} />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-text-muted block">{v.fecha}</span>
                    <span className="text-[11px] text-text-secondary font-mono">
                      {v.horaInicio}{v.horaFin ? ` - ${v.horaFin}` : ''}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium mb-1">{v.clienteNombre}</p>
                {v.descripcion && (
                  <p className="text-xs text-text-secondary line-clamp-1 mb-2">{v.descripcion}</p>
                )}
                <div className="flex items-center gap-4 text-[11px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <User size={11} />
                    <span className="text-text-secondary">{v.tecnicoNombre}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={11} />
                    <span className="text-text-secondary truncate max-w-[250px]">{v.direccion}</span>
                  </span>
                  {v.ticketId && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      <span className="text-accent-blue">{v.ticketId}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== NEW VISIT MODAL ==================== */}
      {showNewModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => { setShowNewModal(false); resetForm(); }}
        >
          <div
            className="bg-bg-card rounded-2xl p-6 w-[560px] border border-border max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Nueva Visita Técnica</h3>
              <button
                onClick={() => { setShowNewModal(false); resetForm(); }}
                className="p-1.5 rounded-lg bg-bg-secondary border border-border text-text-muted cursor-pointer hover:text-text-primary transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateVisita} className="flex flex-col gap-4">
              {/* Client search autocomplete */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block uppercase tracking-wide font-medium">
                  Cliente *
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Buscar cliente por nombre o ID..."
                    value={formClientSearch}
                    onChange={e => {
                      setFormClientSearch(e.target.value);
                      setShowClientDropdown(true);
                      if (!e.target.value) {
                        setFormClientId('');
                        setFormClientNombre('');
                        setFormDireccion('');
                      }
                    }}
                    onFocus={() => { if (formClientSearch.length >= 2) setShowClientDropdown(true); }}
                    className="w-full pl-9 bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-blue"
                    required
                  />
                  {formClientId && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-accent-green font-mono">
                      {formClientId}
                    </span>
                  )}
                  {showClientDropdown && filteredClients.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-lg shadow-xl z-50 max-h-[200px] overflow-y-auto">
                      {filteredClients.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectClient(c)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary cursor-pointer border-none bg-transparent text-text-primary transition-colors flex items-center justify-between"
                        >
                          <span className="truncate">{c.nombre}</span>
                          <span className="text-[10px] text-text-muted font-mono ml-2">{c.id}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tecnico */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block uppercase tracking-wide font-medium">
                  Técnico *
                </label>
                <select
                  value={formTecnicoId}
                  onChange={e => setFormTecnicoId(e.target.value)}
                  className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-blue"
                  required
                >
                  <option value="">Seleccionar técnico...</option>
                  {activeTecnicos.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} - {t.zona} ({t.especialidad})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo + Prioridad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block uppercase tracking-wide font-medium">
                    Tipo *
                  </label>
                  <select
                    value={formTipo}
                    onChange={e => setFormTipo(e.target.value)}
                    className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-blue"
                    required
                  >
                    <option value="Reparación">Reparación</option>
                    <option value="Diagnóstico">Diagnóstico</option>
                    <option value="Instalación">Instalación</option>
                    <option value="Cambio de plan">Cambio de plan</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block uppercase tracking-wide font-medium">
                    Prioridad *
                  </label>
                  <select
                    value={formPrioridad}
                    onChange={e => setFormPrioridad(e.target.value)}
                    className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-blue"
                    required
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </div>

              {/* Fecha + Horas */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block uppercase tracking-wide font-medium">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formFecha}
                    onChange={e => setFormFecha(e.target.value)}
                    className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-blue"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block uppercase tracking-wide font-medium">
                    Hora inicio *
                  </label>
                  <input
                    type="time"
                    value={formHoraInicio}
                    onChange={e => setFormHoraInicio(e.target.value)}
                    className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-blue"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block uppercase tracking-wide font-medium">
                    Hora fin
                  </label>
                  <input
                    type="time"
                    value={formHoraFin}
                    onChange={e => setFormHoraFin(e.target.value)}
                    className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-blue"
                  />
                </div>
              </div>

              {/* Direccion */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block uppercase tracking-wide font-medium">
                  Dirección
                </label>
                <input
                  type="text"
                  placeholder="Dirección de la visita..."
                  value={formDireccion}
                  onChange={e => setFormDireccion(e.target.value)}
                  className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-blue"
                />
              </div>

              {/* Descripcion */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block uppercase tracking-wide font-medium">
                  Descripción
                </label>
                <textarea
                  placeholder="Describe el motivo de la visita..."
                  value={formDescripcion}
                  onChange={e => setFormDescripcion(e.target.value)}
                  className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm min-h-[80px] resize-y outline-none focus:border-accent-blue"
                />
              </div>

              {/* Ticket relacionado */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block uppercase tracking-wide font-medium">
                  Ticket relacionado (opcional)
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Buscar ticket por ID, cliente o descripcion..."
                    value={formTicketSearch}
                    onChange={e => {
                      setFormTicketSearch(e.target.value);
                      setShowTicketDropdown(true);
                      if (!e.target.value) {
                        setFormTicketId('');
                      }
                    }}
                    onFocus={() => { if (formTicketSearch.length >= 2) setShowTicketDropdown(true); }}
                    className="w-full pl-9 bg-bg-secondary border border-border text-text-primary rounded-lg py-2.5 px-3 text-sm outline-none focus:border-accent-blue"
                  />
                  {formTicketId && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormTicketId('');
                        setFormTicketSearch('');
                        setShowTicketDropdown(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer bg-transparent border-none p-0"
                    >
                      <X size={14} />
                    </button>
                  )}
                  {showTicketDropdown && filteredTickets.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-lg shadow-xl z-50 max-h-[200px] overflow-y-auto">
                      {filteredTickets.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setFormTicketId(t.id);
                            setFormTicketSearch(`${t.id} - ${t.clienteNombre} (${t.estado})`);
                            setShowTicketDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary cursor-pointer border-none bg-transparent text-text-primary transition-colors flex items-center justify-between"
                        >
                          <span className="truncate">{t.id} - {t.clienteNombre}</span>
                          <span className="text-[10px] text-text-muted font-mono ml-2">{t.estado}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Adjuntos */}
              <Adjuntos
                value={formAdjuntos}
                onChange={setFormAdjuntos}
                max={5}
              />

              {/* Form buttons */}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => { setShowNewModal(false); resetForm(); }}
                  className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm hover:text-text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!formClientId || !formTecnicoId}
                  className="flex-1 py-2.5 rounded-lg bg-accent-blue border-none text-white cursor-pointer text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  Crear Visita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DETAIL MODAL ==================== */}
      {selectedVisita && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setSelectedVisita(null)}
        >
          <div
            className="bg-bg-card rounded-2xl p-6 w-[580px] border border-border max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="font-mono text-sm text-text-muted">{selectedVisita.id}</span>
                <h3 className="text-lg font-bold mt-1">{selectedVisita.clienteNombre}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${ESTADO_COLORS[selectedVisita.estado]?.bg || ''
                    } ${ESTADO_COLORS[selectedVisita.estado]?.text || ''}`}
                >
                  {selectedVisita.estado}
                </span>
                <button
                  onClick={() => setSelectedVisita(null)}
                  className="p-1.5 rounded-lg bg-bg-secondary border border-border text-text-muted cursor-pointer hover:text-text-primary transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Tipo</p>
                <p className="text-sm font-medium">{selectedVisita.tipo}</p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Prioridad</p>
                <p
                  className={`text-sm font-semibold ${PRIORIDAD_COLOR[selectedVisita.prioridad]?.text || ''
                    }`}
                >
                  {selectedVisita.prioridad}
                </p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Técnico</p>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <User size={12} className="text-text-muted" />
                  {selectedVisita.tecnicoNombre}
                </p>
              </div>
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Fecha y Hora</p>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Clock size={12} className="text-text-muted" />
                  {selectedVisita.fecha} {selectedVisita.horaInicio}
                  {selectedVisita.horaFin ? ` - ${selectedVisita.horaFin}` : ''}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="bg-bg-secondary rounded-lg p-3 mb-4">
              <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Dirección</p>
              <p className="text-sm flex items-center gap-1.5">
                <MapPin size={12} className="text-text-muted flex-shrink-0" />
                {selectedVisita.direccion || 'No especificada'}
              </p>
            </div>

            {/* Detalle del Reporte (Problema + Fotos Iniciales) */}
            <div className="mb-5">
              <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2 flex items-center gap-1">
                <FileText size={12} /> Detalle del Reporte
              </p>
              <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                {selectedVisita.descripcion ? (
                  <p className="text-sm text-text-primary leading-relaxed">{selectedVisita.descripcion}</p>
                ) : (
                  <p className="text-sm text-text-muted italic">Sin descripción</p>
                )}

                {selectedVisita.adjuntos && selectedVisita.adjuntos.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-[10px] text-text-muted mb-2">Evidencia Inicial:</p>
                    <Adjuntos value={selectedVisita.adjuntos} onChange={() => { }} readOnly max={5} />
                  </div>
                )}
              </div>
            </div>

            {/* Resolución Técnica (Solución + Fotos Cierre) */}
            {(selectedVisita.resultado || selectedVisita.solucion || selectedVisita.accionesRealizadas || (selectedVisita.adjuntosResolucion && selectedVisita.adjuntosResolucion.length > 0)) && (
              <div className="mb-5">
                <p className="text-[10px] text-green-400 uppercase tracking-wide font-semibold mb-2 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Resolución Técnica
                </p>
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                  {(selectedVisita.resultado || selectedVisita.solucion) && (
                    <div className="mb-3">
                      <p className="text-[10px] text-text-muted mb-0.5">Solución / Resultado:</p>
                      <p className="text-sm text-text-secondary">{selectedVisita.solucion || selectedVisita.resultado}</p>
                    </div>
                  )}

                  {selectedVisita.accionesRealizadas && (
                    <div className="mb-3">
                      <p className="text-[10px] text-text-muted mb-0.5">Acciones Realizadas:</p>
                      <p className="text-sm text-text-secondary">{selectedVisita.accionesRealizadas}</p>
                    </div>
                  )}

                  {selectedVisita.adjuntosResolucion && selectedVisita.adjuntosResolucion.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] text-text-muted mb-2">Evidencia de Cierre:</p>
                      <Adjuntos value={selectedVisita.adjuntosResolucion} onChange={() => { }} readOnly max={5} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ticket link */}
            {selectedVisita.ticketId && (
              <div className="bg-bg-secondary rounded-lg p-3 mb-4">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Ticket Relacionado</p>
                <p className="text-sm font-mono text-accent-blue">{selectedVisita.ticketId}</p>
              </div>
            )}



            {/* Historial de Estados (Ruta de Proceso / Process Route) */}
            {selectedVisita.historial && selectedVisita.historial.length > 0 && (
              <div className="bg-bg-secondary rounded-lg p-3 mb-5 border border-border/50">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-3 font-semibold flex items-center gap-1">
                  <Kanban size={12} /> Ruta de la Visita
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Render history in chronological order (Oldest -> Newest) */}
                  {[...selectedVisita.historial].reverse().map((h, i, arr) => (
                    <div key={i} className="flex items-center">
                      <div
                        className="group relative flex items-center gap-2 bg-bg-card border border-border/60 rounded-full px-3 py-1.5 cursor-help transition-colors hover:border-accent-blue/50 hover:bg-bg-secondary"
                        title={h.motivo || 'Sin motivo registrado'}
                      >
                        {/* Estado Dot + Texto */}
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${ESTADO_COLORS[h.estadoNuevo]?.dot || 'bg-gray-400'}`}></span>
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

            {/* Status change actions */}
            {selectedVisita.estado === 'Programada' && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleStatusChange(selectedVisita.id, 'En Ruta')}
                  className="flex-1 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-semibold cursor-pointer hover:bg-purple-500/30 transition-colors"
                >
                  Iniciar Ruta
                </button>
              </div>
            )}
            {selectedVisita.estado === 'En Ruta' && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleStatusChange(selectedVisita.id, 'Programada')}
                  className="flex-1 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-semibold cursor-pointer hover:bg-blue-500/30 transition-colors"
                >
                  Volver a Programada
                </button>
                <button
                  onClick={() => handleStatusChange(selectedVisita.id, 'En Sitio')}
                  className="flex-1 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-semibold cursor-pointer hover:bg-yellow-500/30 transition-colors"
                >
                  Marcar En Sitio
                </button>
              </div>
            )}
            {selectedVisita.estado === 'En Sitio' && (
              <div className="flex flex-col gap-2 mt-3">
                <button
                  onClick={() => handleStatusChange(selectedVisita.id, 'Completada')}
                  className="w-full py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-semibold cursor-pointer hover:bg-green-500/30 transition-colors"
                >
                  Completar Visita
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedVisita.id, 'En Ruta')}
                    className="flex-1 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-semibold cursor-pointer hover:bg-purple-500/30 transition-colors"
                  >
                    Volver a En Ruta
                  </button>
                  <button
                    onClick={handleRescheduleClick}
                    className="flex-1 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-semibold cursor-pointer hover:bg-blue-500/30 transition-colors"
                  >
                    Reprogramar
                  </button>
                  <button
                    onClick={handleAbsentClick}
                    className="flex-1 py-2 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-semibold cursor-pointer hover:bg-orange-500/30 transition-colors"
                  >
                    Cliente Ausente
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 mt-3">
              {selectedVisita.estado !== 'Cancelada' && selectedVisita.estado !== 'Completada' && (
                <button
                  onClick={() => handleStatusChange(selectedVisita.id, 'Cancelada')}
                  className="py-2.5 px-4 rounded-lg border border-border text-xs text-text-muted cursor-pointer bg-transparent hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={() => setSelectedVisita(null)}
                className="flex-1 py-2.5 px-4 rounded-lg bg-bg-secondary border border-border text-text-secondary text-xs cursor-pointer hover:text-text-primary transition-colors"
              >
                Cerrar
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
          setResolutionTarget(null);
        }}
        onConfirm={handleResolutionConfirm}
        title="Completar Visita Tecnica"
        entityId={resolutionTarget ? visitas.find(v => v.id === resolutionTarget.visitaId)?.id : ''}
        entityLabel="Visita"
        newStatus="Completada"
        accentColor="accent-green"
      />

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]" onClick={() => setShowRescheduleModal(false)}>
          <div className="bg-bg-card rounded-2xl p-6 w-[450px] border border-border max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Reprogramar Visita</h3>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block font-medium">Nueva Fecha</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={e => setRescheduleDate(e.target.value)}
                    className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg py-2 px-3 text-sm outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block font-medium">Nueva Hora</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={e => setRescheduleTime(e.target.value)}
                    className="w-full bg-bg-secondary border border-border text-text-primary rounded-lg py-2 px-3 text-sm outline-none focus:border-accent-blue"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-text-muted mb-1.5 block font-medium">
                  Motivo {(rescheduleDate && rescheduleTime) ? '(opcional)' : '(obligatorio si no hay fecha)'}
                </label>
                <textarea
                  value={rescheduleReason}
                  onChange={e => setRescheduleReason(e.target.value)}
                  placeholder="Indica el motivo de la reprogramación..."
                  className="w-full bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[80px] resize-y outline-none focus:border-accent-blue"
                />
              </div>

              <Adjuntos
                value={rescheduleAdjuntos}
                onChange={setRescheduleAdjuntos}
                max={5}
                label="Evidencia (opcional)"
              />

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm hover:text-text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmReschedule}
                  disabled={!((rescheduleDate && rescheduleTime) || rescheduleReason.trim())}
                  className="flex-1 py-2.5 rounded-lg bg-accent-blue border-none text-white cursor-pointer text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Absent Modal */}
      {showAbsentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]" onClick={() => setShowAbsentModal(false)}>
          <div className="bg-bg-card rounded-2xl p-6 w-[450px] border border-border" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-orange-400 flex items-center gap-2">
              <User size={20} /> Cliente Ausente
            </h3>

            <div className="flex flex-col gap-4">
              <p className="text-xs text-text-secondary">
                Se registrará la visita como <strong>Ausente</strong>. Es obligatorio indicar una observación y se recomienda adjuntar evidencia (foto de fachada/medidor).
              </p>

              <div>
                <label className="text-xs text-text-muted mb-1.5 block font-medium">Observaciones *</label>
                <textarea
                  value={absentReason}
                  onChange={e => setAbsentReason(e.target.value)}
                  placeholder="Ej: Se tocó timbre por 10 min, se llamó al cliente y no contestó..."
                  className="w-full bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[80px] resize-y outline-none focus:border-accent-blue"
                  autoFocus
                />
              </div>

              <Adjuntos value={absentAdjuntos} onChange={setAbsentAdjuntos} max={5} label="Evidencia de visita (opcional)" />

              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowAbsentModal(false)} className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm hover:text-text-primary transition-colors">Cancelar</button>
                <button onClick={confirmAbsent} disabled={!absentReason.trim()} className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white cursor-pointer text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">Confirmar Ausencia</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
