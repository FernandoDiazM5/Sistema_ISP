import { useState, useMemo, useEffect } from 'react';
import {
  Plus, AlertCircle, Loader2, CheckCircle2, ArrowUpRight,
  LayoutList, Kanban, Clock, X, Search
} from 'lucide-react';
import useStore from '../../store/useStore';
import { useFilters } from '../../hooks/useFilters';
import { AdjuntosCount } from '../common/Adjuntos';
import ResolutionModal from '../common/ResolutionModal';

// UI Components
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

// Modals
import TicketCreateModal from './modals/TicketCreateModal';
import TicketDetailModal from './modals/TicketDetailModal';
import InlineVisitaModal from './modals/InlineVisitaModal';
import InlineSoporteModal from './modals/InlineSoporteModal';
import HistoryItemModal from './modals/HistoryItemModal';

const ESTADOS_COLOR = {
  'Abierto': 'danger',
  'En Proceso': 'warning',
  'Escalado': 'orange',
  'Resuelto': 'success',
  'Cerrado': 'default',
  'Cancelado': 'default',
};

const ESTADOS_KANBAN_MAP = {
  'Abierto': { bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-500' },
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
  const updateTicket = useStore(s => s.updateTicket);
  const visitas = useStore(s => s.visitas);
  const sesionesRemoto = useStore(s => s.sesionesRemoto);

  const [viewMode, setViewMode] = useState('list');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Custom Hook for Filters
  const {
    filteredData,
    searchInput,
    setSearchInput,
    filters,
    updateFilter,
    resetFilters
  } = useFilters(tickets, {
    searchFields: ['clienteNombre', 'id', 'clienteId', 'descripcion', 'asignado'],
    initialFilters: { estado: 'all', prioridad: 'all' }
  });

  // Additional Date Filtering
  const finalFiltered = useMemo(() => {
    return filteredData.filter(t => {
      const matchStart = !dateRange.start || t.fecha >= dateRange.start;
      const matchEnd = !dateRange.end || t.fecha <= dateRange.end;
      const matchKanban = viewMode === 'list' || filters.estado === 'all' || t.estado === filters.estado;
      return matchStart && matchEnd && matchKanban;
    });
  }, [filteredData, dateRange, viewMode, filters.estado]);

  // Kanban grouped tickets
  const kanbanData = useMemo(() => {
    const grouped = {};
    KANBAN_COLUMNS.forEach(col => {
      // Filter by date range and search, but ignore status filter for Kanban columns
      grouped[col] = tickets.filter(t => {
        const matchesSearch = !searchInput ||
          t.clienteNombre.toLowerCase().includes(searchInput.toLowerCase()) ||
          t.id.toLowerCase().includes(searchInput.toLowerCase());
        const matchStart = !dateRange.start || t.fecha >= dateRange.start;
        const matchEnd = !dateRange.end || t.fecha <= dateRange.end;
        const matchPrioridad = filters.prioridad === 'all' || t.prioridad === filters.prioridad;

        return t.estado === col && matchesSearch && matchStart && matchEnd && matchPrioridad;
      });
    });
    return grouped;
  }, [tickets, searchInput, dateRange, filters.prioridad]);

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

  const handleStatusChange = (ticketId, newEstado) => {
    if (newEstado === 'Resuelto' || newEstado === 'Cerrado') {
      setResolutionTarget({ ticketId, newEstado });
      setShowResolutionModal(true);
    } else {
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
    <div className="animate-fade p-6 px-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Tickets & Soporte</h1>
          <p className="text-text-secondary text-sm mt-1">{tickets.length} tickets en total — {stats.abiertos} abiertos, {stats.enProceso} en proceso</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-bg-secondary rounded-lg border border-border p-0.5">
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              icon={LayoutList}
            >
              Lista
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              icon={Kanban}
            >
              Kanban
            </Button>
          </div>
          <Button onClick={() => { setEditingTicket(null); setShowCreateModal(true); }} icon={Plus}>
            Nuevo Ticket
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Abiertos', value: stats.abiertos, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
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

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <div className="flex-[1_1_280px]">
          <Input
            icon={Search}
            placeholder="Buscar por cliente, ID, descripción..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            containerClassName="w-full"
          />
        </div>

        {viewMode === 'list' && (
          <div className="min-w-[150px]">
            <select
              value={filters.estado}
              onChange={e => updateFilter('estado', e.target.value)}
              className="w-full h-[42px] px-3 rounded-xl bg-bg-secondary border border-border text-sm text-text-primary focus:border-accent-blue outline-none"
            >
              <option value="all">Todos los estados</option>
              {Object.keys(ESTADOS_COLOR).map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        )}

        <div className="min-w-[140px]">
          <select
            value={filters.prioridad}
            onChange={e => updateFilter('prioridad', e.target.value)}
            className="w-full h-[42px] px-3 rounded-xl bg-bg-secondary border border-border text-sm text-text-primary focus:border-accent-blue outline-none"
          >
            <option value="all">Toda prioridad</option>
            {Object.keys(PRIORIDAD_COLOR).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-bg-secondary rounded-xl border border-border px-3 h-[42px]">
          <span className="text-[10px] text-text-muted uppercase font-semibold">Fecha:</span>
          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="bg-transparent border-none text-xs text-text-primary outline-none w-24"
          />
          <span className="text-text-muted">-</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="bg-transparent border-none text-xs text-text-primary outline-none w-24"
          />
          {(dateRange.start || dateRange.end) && (
            <button onClick={() => setDateRange({ start: '', end: '' })} className="text-text-muted hover:text-text-primary border-none bg-transparent cursor-pointer ml-1">
              <X size={12} />
            </button>
          )}
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
          {finalFiltered.map(t => (
            <Card key={t.id} padding="p-4" onClick={() => setSelectedTicket(t)} className="cursor-pointer hover:border-accent-blue/50 hover:bg-bg-card-hover">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs text-text-muted">{t.id}</span>
                  <Badge variant={ESTADOS_COLOR[t.estado]}>{t.estado}</Badge>
                  <Badge variant={PRIORIDAD_COLOR[t.prioridad]}>{t.prioridad}</Badge>
                  {(t.tipoAtencion || t.tipo) && <Badge variant="default" size="sm">{t.tipoAtencion || t.tipo}</Badge>}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-text-muted">
                  {t.slaTiempoLimite && <span className="flex items-center gap-1 text-accent-yellow"><Clock size={12} /> SLA: {t.slaTiempoLimite}</span>}
                  <span>{t.fecha}</span>
                  <AdjuntosCount count={t.adjuntos?.length} />
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
          ))}
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
          onClose={() => setInlineVisitaData(null)}
          onSuccess={() => setInlineVisitaData(null)}
        />
      )}

      {inlineSoporteData && (
        <InlineSoporteModal
          ticket={inlineSoporteData.ticket}
          client={inlineSoporteData.client}
          onClose={() => setInlineSoporteData(null)}
          onSuccess={() => setInlineSoporteData(null)}
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
    </div>
  );
}
