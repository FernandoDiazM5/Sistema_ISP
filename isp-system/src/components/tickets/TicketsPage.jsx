import { useState, useMemo, useEffect } from 'react';
import {
  Plus, AlertCircle, Loader2, CheckCircle2, ArrowUpRight,
  LayoutList, Kanban, Clock, X, Search, Trash2, AlertTriangle, Calendar
} from 'lucide-react';
import useStore from '../../store/useStore';
import { useFilters } from '../../hooks/useFilters';
import { AdjuntosCount } from '../common/Adjuntos';
import ResolutionModal from '../common/ResolutionModal';
import CopyButton from '../common/CopyButton';
import { formatTicket } from '../../utils/whatsappFormats';

// UI Components
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import MultiSelect from '../ui/MultiSelect';
import DateRangePicker from '../ui/DateRangePicker';

// Modals
import TicketCreateModal from './modals/TicketCreateModal';
import TicketDetailModal from './modals/TicketDetailModal';
import InlineVisitaModal from './modals/InlineVisitaModal';
import InlineSoporteModal from './modals/InlineSoporteModal';
import HistoryItemModal from './modals/HistoryItemModal';
import EscalationModal from './modals/EscalationModal';

const ESTADOS_COLOR = {
  'Abierto': 'info',
  'En Proceso': 'warning',
  'Escalado': 'orange',
  'Resuelto': 'success',
  'Cerrado': 'default',
  'Cancelado': 'default',
  'Derivado a Visita': 'purple',
  'Derivado a Planta Externa': 'orange',
};

const ESTADOS_KANBAN_MAP = {
  'Abierto': { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-500' },
  'En Proceso': { bg: 'bg-yellow-500/10', text: 'text-yellow-500', dot: 'bg-yellow-500' },
  'Escalado': { bg: 'bg-orange-500/10', text: 'text-orange-500', dot: 'bg-orange-500' },
  'Resuelto': { bg: 'bg-green-500/10', text: 'text-green-500', dot: 'bg-green-500' },
  'Cerrado': { bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-500' },
}

const PRIORIDAD_COLOR = {
  'Crítica': 'danger',
  'Alta': 'orange',
  'Media': 'warning',
  'Baja': 'success',
};

const KANBAN_COLUMNS = ['Abierto', 'En Proceso', 'Escalado', 'Resuelto', 'Cerrado'];

export default function TicketsPage() {
  const tickets = useStore(s => s.tickets);
  const clients = useStore(s => s.clients);
  const deleteTicket = useStore(s => s.deleteTicket);
  const deleteTicketCascade = useStore(s => s.deleteTicketCascade);
  const updateTicket = useStore(s => s.updateTicket);
  const visitas = useStore(s => s.visitas);
  const sesionesRemoto = useStore(s => s.sesionesRemoto);
  const addRequerimiento = useStore(s => s.addRequerimiento);
  const tiposRequerimiento = useStore(s => s.tiposRequerimiento);

  const [viewMode, setViewMode] = useState('list');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Search Columns State
  const [searchColumns, setSearchColumns] = useState(['clienteNombre', 'id', 'clienteId', 'descripcion']);

  const SEARCH_OPTIONS = [
    { label: 'ID Ticket', value: 'id' },
    { label: 'Cliente', value: 'clienteNombre' },
    { label: 'ID Cliente', value: 'clienteId' },
    { label: 'Descripción', value: 'descripcion' },
    { label: 'Asignado a', value: 'asignado' },
  ];

  // Custom Hook for Filters
  const {
    filteredData,
    searchInput,
    setSearchInput,
    filters,
    updateFilter,
    resetFilters
  } = useFilters(tickets, {
    searchFields: searchColumns, // Dynamic search columns
    initialFilters: {} // Don't pass filters here, we handle them manually for MultiSelect
  });

  // Manually manage filter state since we aren't passing it to the hook
  const [localFilters, setLocalFilters] = useState({ estado: [], prioridad: [] });

  const updateLocalFilter = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  // Additional Date Filtering & MultiSelect Logic
  const finalFiltered = useMemo(() => {
    return filteredData.filter(t => {
      const matchStart = !dateRange.start || t.fecha >= dateRange.start;
      const matchEnd = !dateRange.end || t.fecha <= dateRange.end;

      // MultiSelect Logic: empty array = all
      const matchStatus = localFilters.estado.length === 0 || localFilters.estado.includes(t.estado);
      const matchPrioridad = localFilters.prioridad.length === 0 || localFilters.prioridad.includes(t.prioridad);

      return matchStart && matchEnd && matchStatus && matchPrioridad;
    });
  }, [filteredData, dateRange, viewMode, localFilters]);

  // Kanban grouped tickets (updated for multiselect)
  const kanbanData = useMemo(() => {
    const grouped = {};
    KANBAN_COLUMNS.forEach(col => {
      grouped[col] = tickets.filter(t => {
        // Search logic manually applied here since useFilters handles the main list
        const matchesSearch = searchColumns.some(field =>
          String(t[field] || '').toLowerCase().includes(searchInput.toLowerCase())
        );

        const matchStart = !dateRange.start || t.fecha >= dateRange.start;
        const matchEnd = !dateRange.end || t.fecha <= dateRange.end;

        // MultiSelect Priority Logic
        const matchPrioridad = localFilters.prioridad.length === 0 || localFilters.prioridad.includes(t.prioridad);

        return t.estado === col && matchesSearch && matchStart && matchEnd && matchPrioridad;
      });
    });
    return grouped;
  }, [tickets, searchInput, dateRange, localFilters.prioridad, searchColumns]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editingTicket, setEditingTicket] = useState(null);
  const [viewingHistoryItem, setViewingHistoryItem] = useState(null);
  const [inlineVisitaData, setInlineVisitaData] = useState(null);
  const [inlineSoporteData, setInlineSoporteData] = useState(null);

  // Resolution modal
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionTarget, setResolutionTarget] = useState(null);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [escalationTarget, setEscalationTarget] = useState(null);

  // Cascade delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(null); // { ticketId, ticket, relatedVisitas, relatedSesiones }

  // Stats
  const stats = useMemo(() => ({
    abiertos: tickets.filter(t => t.estado === 'Abierto').length,
    enProceso: tickets.filter(t => t.estado === 'En Proceso').length,
    escalados: tickets.filter(t => t.estado === 'Escalado').length,
    resueltos: tickets.filter(t => t.estado === 'Resuelto').length,
  }), [tickets]);

  // Actions
  const handleEditTicket = (ticket) => {
    setEditingTicket(ticket);
    setSelectedTicket(null);
    setShowCreateModal(true);
  };

  const handleDeleteTicket = (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    const relatedVisitas = visitas.filter(v => v.ticketId === ticketId);
    const relatedSesiones = sesionesRemoto.filter(s => s.ticketId === ticketId);

    if (relatedVisitas.length > 0 || relatedSesiones.length > 0) {
      // Tiene dependencias — mostrar modal de confirmación en cascada
      setConfirmDelete({ ticketId, ticket, relatedVisitas, relatedSesiones });
    } else {
      // Sin dependencias — confirmación simple
      if (window.confirm('¿Estás seguro de eliminar este ticket? Esta acción no se puede deshacer.')) {
        deleteTicket(ticketId);
        setSelectedTicket(null);
      }
    }
  };

  const handleConfirmCascadeDelete = () => {
    if (!confirmDelete) return;
    deleteTicketCascade(confirmDelete.ticketId);
    setSelectedTicket(null);
    setConfirmDelete(null);
  };

  const handleStatusChange = (ticketId, newEstado) => {
    if (newEstado === 'Resuelto' || newEstado === 'Cerrado') {
      setResolutionTarget({ ticketId, newEstado });
      setShowResolutionModal(true);
    } else if (newEstado === 'Escalado') {
      setEscalationTarget({ ticketId, newEstado });
      setShowEscalationModal(true);
    } else {
      updateTicket(ticketId, {
        estado: newEstado,
        _historyComment: 'Cambio de estado manual'
      });
    }
  };

  const handleEscalationConfirm = ({ tipo, motivo, diagnostico }) => {
    if (!escalationTarget) return;
    const ticketId = escalationTarget.ticketId;
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const tipoLabel = tipo === 'visita' ? 'Visita Técnica' : tipo === 'soporte' ? 'Soporte Remoto' : tipo === 'requerimiento' ? 'Req. Administrativo' : 'Planta Externa';

    const escalationPayload = {
      estado: 'Escalado',
      _historyEstadoLabel: `Escalado - ${tipoLabel}`,
      _historyComment: `Derivado a ${tipoLabel}: ${motivo}`
    };

    setShowEscalationModal(false);
    setEscalationTarget(null);

    // Si es visita o soporte, abrir modal de creación y guardar payload para confirmación
    if (tipo === 'visita') {
      setInlineVisitaData({ ticket, client: getClientInfo(ticket.clienteId), diagnostico, escalationPayload });
    } else if (tipo === 'soporte') {
      setInlineSoporteData({ ticket, client: getClientInfo(ticket.clienteId), diagnostico, escalationPayload });
    } else if (tipo === 'requerimiento' || tipo === 'planta_externa') {
      // Como no hay modal intermedio para estos dos, se actualiza el ticket de inmediato
      updateTicket(ticketId, escalationPayload);
      if (tipo === 'requerimiento') {
        const defaultTipo = tiposRequerimiento.length > 0 ? tiposRequerimiento[0].nombre : 'Otro';
        addRequerimiento({
          titulo: `[${ticketId}] ${motivo}`,
          tipo: defaultTipo,
          prioridad: ticket.prioridad || 'Media',
          solicitante: ticket.asignado || ticket.clienteNombre || '',
          descripcion: `Requerimiento generado desde ticket ${ticketId}.\nCliente: ${ticket.clienteNombre || 'N/A'}\nMotivo: ${motivo}`,
          montoEstimado: 0,
          estado: 'Pendiente',
          fechaLimite: null,
          ticketOrigen: ticketId,
        });
      }
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

  // Sync selectedTicket
  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find(t => t.id === selectedTicket.id);
      if (updated && updated !== selectedTicket) {
        setSelectedTicket(updated);
      }
    }
  }, [tickets, selectedTicket]);

  const getClientInfo = (clienteId) => clients.find(c => c.id === clienteId) || null;

  return (
    <div className="animate-fade p-4 sm:p-6 sm:px-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight">Tickets & Soporte</h1>
          <p className="text-text-secondary text-sm mt-1">{tickets.length} tickets en total — {stats.abiertos} abiertos, {stats.enProceso} en proceso</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex bg-bg-secondary rounded-lg border border-border p-0.5 shrink-0 justify-center">
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              icon={LayoutList}
              className="flex-1 sm:flex-none justify-center"
            >
              Lista
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              icon={Kanban}
              className="flex-1 sm:flex-none justify-center"
            >
              Kanban
            </Button>
          </div>
          <Button onClick={() => { setEditingTicket(null); setShowCreateModal(true); }} icon={Plus} className="justify-center sm:w-auto">
            Nuevo Ticket
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Abiertos', value: stats.abiertos, icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'En Proceso', value: stats.enProceso, icon: Loader2, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Escalados', value: stats.escalados, icon: ArrowUpRight, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Resueltos', value: stats.resueltos, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
        ].map(s => (
          <Card key={s.label} padding="p-4" className="flex items-center gap-3 hover:-translate-y-0.5 transition-transform">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.bg} ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-xl font-bold font-mono">{s.value}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 mb-5">
        {/* Search & Columns */}
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="flex-[2]">
            <Input
              icon={Search}
              placeholder="Buscar..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              containerClassName="w-full"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <MultiSelect
              placeholder="Columnas..."
              options={SEARCH_OPTIONS}
              value={searchColumns}
              onChange={setSearchColumns}
              maxDisplay={1}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Date Range Filter */}
          <div className="w-full sm:w-auto">
            <DateRangePicker
              dateRange={{
                from: dateRange.start ? new Date(dateRange.start + 'T00:00:00') : undefined,
                to: dateRange.end ? new Date(dateRange.end + 'T00:00:00') : undefined
              }}
              onChange={(range) => {
                setDateRange({
                  start: range?.from ? range.from.toISOString().split('T')[0] : '',
                  end: range?.to ? range.to.toISOString().split('T')[0] : ''
                });
              }}
              placeholder="Filtrar por fecha..."
            />
          </div>
        </div>
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="flex flex-col gap-3">
          {finalFiltered.length === 0 && (
            <div className="bg-bg-card rounded-xl p-12 border border-border text-center">
              <p className="text-text-muted text-sm">No se encontraron tickets con los filtros aplicados.</p>
            </div>
          )}
          {finalFiltered.map(t => {
            const client = getClientInfo(t.clienteId);
            return (
              <Card key={t.id} padding="p-4" onClick={() => setSelectedTicket(t)} className="cursor-pointer hover:border-accent-blue/50 hover:bg-bg-card-hover">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs text-text-muted">{t.id}</span>
                    <Badge variant={ESTADOS_COLOR[t.estado]}>{t.estado}</Badge>
                    <Badge variant={PRIORIDAD_COLOR[t.prioridad]}>{t.prioridad}</Badge>
                    {(t.tipoAtencion || t.tipo) && <Badge variant="default" size="sm">{t.tipoAtencion || t.tipo}</Badge>}
                    {client?.tecnologia && (
                      <Badge variant="default" size="sm" className="bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20">
                        {client.tecnologia}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-text-muted">
                    {t.slaTiempoLimite && <span className="flex items-center gap-1 text-accent-yellow"><Clock size={12} /> SLA: {t.slaTiempoLimite}</span>}
                    <span>{t.fecha}</span>
                    <AdjuntosCount count={t.adjuntos?.length} />
                    <CopyButton getTextFn={() => formatTicket(t, clients.find(c => c.id === t.clienteId))} />
                  </div>
                </div>
                <p className="text-sm font-medium mb-1">{t.clienteNombre}</p>
                <p className="text-xs text-text-secondary line-clamp-1">{t.descripcion}</p>
                <div className="mt-2 flex items-center gap-4 text-[11px] text-text-muted">
                  <span>Asignado: <span className="text-text-secondary">{t.asignado || 'Sin asignar'}</span></span>
                  {t.categoriaNombre && <span>Cat: <span className="text-text-secondary">{t.categoriaNombre}</span></span>}
                  <span>Actualizado: {t.fechaUpdate}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 380px)' }}>
          {KANBAN_COLUMNS.map(estado => {
            const ec = ESTADOS_KANBAN_MAP[estado];
            const columnTickets = kanbanData[estado] || [];
            return (
              <div key={estado} className="flex-shrink-0 w-[280px] flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${ec.bg.replace('/10', '')}`} style={{ backgroundColor: ec.dot.replace('bg-', 'rgb(') }}></span>
                    <span className="text-sm font-semibold text-text-primary">{estado}</span>
                  </div>
                  <Badge variant="default" size="sm">{columnTickets.length}</Badge>
                </div>
                <div className="flex-1 flex flex-col gap-2 bg-bg-secondary/50 rounded-xl p-2 border border-border/50 min-h-[200px]">
                  {columnTickets.length === 0 && <div className="flex-1 flex items-center justify-center"><p className="text-[11px] text-text-muted">Sin tickets</p></div>}
                  {columnTickets.map(t => (
                    <Card key={t.id} padding="p-3" onClick={() => setSelectedTicket(t)} className="cursor-pointer hover:border-accent-blue/50 hover:bg-bg-card-hover">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[10px] text-text-muted">{t.id}</span>
                        <Badge variant={PRIORIDAD_COLOR[t.prioridad]} size="sm">{t.prioridad}</Badge>
                      </div>
                      <p className="text-xs font-medium mb-1 text-text-primary truncate">{t.clienteNombre}</p>
                      {(t.tipoAtencion || t.tipo) && <span className="text-[10px] text-text-muted bg-bg-secondary px-1.5 py-0.5 rounded inline-block mb-1.5">{t.tipoAtencion || t.tipo}</span>}
                      {t.slaTiempoLimite && <div className="flex items-center gap-1 text-[10px] text-accent-yellow mt-1"><Clock size={10} /><span>SLA: {t.slaTiempoLimite}</span></div>}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALS */}
      {showCreateModal && (
        <TicketCreateModal
          initialData={editingTicket}
          onClose={() => { setShowCreateModal(false); setEditingTicket(null); }}
          onSuccess={() => { setShowCreateModal(false); setEditingTicket(null); }}
        />
      )}

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onEdit={handleEditTicket}
          onDelete={handleDeleteTicket}
          onStatusChange={handleStatusChange}
          onGenerateVisita={(ticket) => {
            const client = getClientInfo(ticket.clienteId);
            setInlineVisitaData({ ticket, client });
            setSelectedTicket(null);
          }}
          onGenerateSoporte={(ticket) => {
            const client = getClientInfo(ticket.clienteId);
            setInlineSoporteData({ ticket, client });
            setSelectedTicket(null);
          }}
          onViewHistoryItem={(itemWrapper) => setViewingHistoryItem(itemWrapper)}
        />
      )}

      {inlineVisitaData && (
        <InlineVisitaModal
          ticket={inlineVisitaData.ticket}
          client={inlineVisitaData.client}
          diagnostico={inlineVisitaData.diagnostico}
          onClose={() => setInlineVisitaData(null)}
          onSuccess={() => {
            if (inlineVisitaData.escalationPayload) {
              updateTicket(inlineVisitaData.ticket.id, inlineVisitaData.escalationPayload);
            }
            setInlineVisitaData(null);
          }}
        />
      )}

      {inlineSoporteData && (
        <InlineSoporteModal
          ticket={inlineSoporteData.ticket}
          client={inlineSoporteData.client}
          diagnostico={inlineSoporteData.diagnostico}
          onClose={() => setInlineSoporteData(null)}
          onSuccess={() => {
            if (inlineSoporteData.escalationPayload) {
              updateTicket(inlineSoporteData.ticket.id, inlineSoporteData.escalationPayload);
            }
            setInlineSoporteData(null);
          }}
        />
      )}

      {viewingHistoryItem && (
        <HistoryItemModal
          item={viewingHistoryItem.data}
          type={viewingHistoryItem.type}
          onClose={() => setViewingHistoryItem(null)}
        />
      )}

      <ResolutionModal
        open={showResolutionModal}
        onClose={() => { setShowResolutionModal(false); setResolutionTarget(null); }}
        onConfirm={handleResolutionConfirm}
        title={resolutionTarget?.newEstado === 'Cerrado' ? 'Cerrar Ticket' : 'Resolver Ticket'}
        entityId={resolutionTarget ? tickets.find(t => t.id === resolutionTarget.ticketId)?.id : ''}
        entityLabel="Ticket"
        newStatus={resolutionTarget?.newEstado || ''}
        accentColor={resolutionTarget?.newEstado === 'Cerrado' ? 'accent-gray' : 'accent-green'}
      />

      <EscalationModal
        open={showEscalationModal}
        onClose={() => { setShowEscalationModal(false); setEscalationTarget(null); }}
        onConfirm={handleEscalationConfirm}
        ticketId={escalationTarget?.ticketId}
      />

      {/* ====== MODAL CONFIRMACIÓN ELIMINACIÓN EN CASCADA ====== */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-card border border-red-500/30 rounded-2xl w-full max-w-[460px] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-red-500/10 p-5 flex items-center gap-3 border-b border-red-500/20">
              <div className="w-11 h-11 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Eliminar ticket y datos asociados</h3>
                <p className="text-[11px] text-text-muted mt-0.5">Esta acción no se puede deshacer</p>
              </div>
              <button
                onClick={() => setConfirmDelete(null)}
                className="ml-auto p-1.5 rounded-lg hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors cursor-pointer bg-transparent border-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              <p className="text-sm text-text-secondary mb-4">
                El ticket <span className="font-bold text-text-primary">{confirmDelete.ticketId}</span>
                {confirmDelete.ticket?.clienteNombre && (
                  <span> de <span className="font-semibold text-text-primary">{confirmDelete.ticket.clienteNombre}</span></span>
                )} tiene registros asociados que también serán eliminados:
              </p>

              <div className="flex flex-col gap-2 mb-4">
                {confirmDelete.relatedVisitas.length > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center flex-shrink-0">
                      <Trash2 size={14} className="text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">
                        {confirmDelete.relatedVisitas.length} Visita{confirmDelete.relatedVisitas.length > 1 ? 's' : ''} Técnica{confirmDelete.relatedVisitas.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {confirmDelete.relatedVisitas.map(v => v.id).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {confirmDelete.relatedSesiones.length > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                      <Trash2 size={14} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">
                        {confirmDelete.relatedSesiones.length} Sesión{confirmDelete.relatedSesiones.length > 1 ? 'es' : ''} de Soporte Remoto
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {confirmDelete.relatedSesiones.map(s => s.id).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
                <p className="text-[11px] text-yellow-300 leading-relaxed">
                  <strong>⚠ Advertencia:</strong> Se eliminará el ticket junto con todas las visitas técnicas y sesiones de soporte remoto listadas. Esta acción es irreversible.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 p-4 border-t border-border">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-bg-secondary border border-border text-sm font-semibold text-text-secondary hover:bg-bg-tertiary transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmCascadeDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 border-none text-white text-sm font-bold hover:bg-red-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                Eliminar Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
