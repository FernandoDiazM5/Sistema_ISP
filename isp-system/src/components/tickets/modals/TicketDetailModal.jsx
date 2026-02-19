import { useState } from 'react';
import {
    X, Edit3, Trash2, MapPin, Monitor, CheckCircle2,
    Clock, FileText, Kanban, ArrowUpRight
} from 'lucide-react';
import Adjuntos from '../../common/Adjuntos';
import CopyButton from '../../common/CopyButton';
import { formatTicket } from '../../../utils/whatsappFormats';
import useStore from '../../../store/useStore';

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

export default function TicketDetailModal({
    ticket,
    onClose,
    onEdit,
    onDelete,
    onStatusChange,
    onGenerateVisita,
    onGenerateSoporte,
    onViewHistoryItem
}) {
    const clients = useStore(s => s.clients);
    const visitas = useStore(s => s.visitas);
    const sesionesRemoto = useStore(s => s.sesionesRemoto);

    if (!ticket) return null;

    const clientInfo = clients.find(c => c.id === ticket.clienteId);
    const relatedVisitas = visitas.filter(v => v.ticketId === ticket.id);
    const relatedSesiones = sesionesRemoto.filter(s => s.ticketId === ticket.id);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade" onClick={onClose}>
            <div className="bg-bg-card rounded-2xl p-6 w-[600px] border border-border max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                    <div className="flex-1">
                        <span className="font-mono text-sm text-text-muted">{ticket.id}</span>
                        <h3 className="text-lg font-bold mt-1">{ticket.clienteNombre}</h3>
                        <span className="text-xs text-text-muted font-mono">ID: {ticket.clienteId}</span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                            <CopyButton getTextFn={() => formatTicket(ticket, clientInfo)} />
                            <button onClick={() => onEdit(ticket)} className="p-1.5 text-text-muted hover:text-accent-blue transition-colors bg-transparent border-none cursor-pointer" title="Editar">
                                <Edit3 size={16} />
                            </button>
                            <button onClick={() => onDelete(ticket.id)} className="p-1.5 text-text-muted hover:text-accent-red transition-colors bg-transparent border-none cursor-pointer" title="Eliminar">
                                <Trash2 size={16} />
                            </button>
                            <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${(ESTADOS_COLOR[ticket.estado] || ESTADOS_COLOR['Abierto']).bg} ${(ESTADOS_COLOR[ticket.estado] || ESTADOS_COLOR['Abierto']).text}`}>
                            {ticket.estado}
                        </span>
                    </div>
                </div>

                {/* Client Info */}
                {clientInfo && (
                    <div className="bg-bg-secondary rounded-lg p-3 mb-4 border border-border/50">
                        <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2 font-semibold">Información del Cliente</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span className="text-text-muted">Plan: </span><span className="text-text-primary font-medium">{clientInfo.plan || 'N/A'}</span></div>
                            <div><span className="text-text-muted">Tecnología: </span><span className="text-text-primary font-medium">{clientInfo.tecnologia || 'N/A'}</span></div>
                            <div><span className="text-text-muted">Dirección: </span><span className="text-text-primary font-medium">{clientInfo.direccion || 'N/A'}</span></div>
                            <div><span className="text-text-muted">Estado: </span><span className="text-text-primary font-medium">{clientInfo.estado_cuenta || 'N/A'}</span></div>
                            {clientInfo.movil_1 && (
                              <div><span className="text-text-muted">Teléfono: </span><span className="text-text-primary font-medium">{clientInfo.movil_1}</span></div>
                            )}
                            {clientInfo.nodo_router && (
                              <div><span className="text-text-muted">Nodo: </span><span className="text-text-primary font-medium">{clientInfo.nodo_router}</span></div>
                            )}
                        </div>
                    </div>
                )}

                {/* Ticket Details Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
                    <div>
                        <span className="text-text-muted block mb-0.5">Prioridad</span>
                        <span className={`font-semibold ${(PRIORIDAD_COLOR[ticket.prioridad] || PRIORIDAD_COLOR['Media']).text}`}>{ticket.prioridad}</span>
                    </div>
                    <div>
                        <span className="text-text-muted block mb-0.5">Tipo</span>
                        <span className="font-medium">{ticket.tipoAtencion || ticket.tipo}</span>
                    </div>
                    <div>
                        <span className="text-text-muted block mb-0.5">Asignado</span>
                        <span className="font-medium">{ticket.asignado || 'Sin asignar'}</span>
                    </div>
                    {ticket.categoriaNombre && (
                        <div>
                            <span className="text-text-muted block mb-0.5">Categoría</span>
                            <span className="font-medium">{ticket.categoriaNombre}</span>
                        </div>
                    )}
                    {ticket.subcategoriaNombre && (
                        <div>
                            <span className="text-text-muted block mb-0.5">Subcategoría</span>
                            <span className="font-medium">{ticket.subcategoriaNombre}</span>
                        </div>
                    )}
                    <div>
                        <span className="text-text-muted block mb-0.5">Fecha</span>
                        <span className="font-medium">{ticket.fecha}</span>
                    </div>
                    {ticket.fechaUpdate && ticket.fechaUpdate !== ticket.fecha && (
                        <div>
                            <span className="text-text-muted block mb-0.5">Actualizado</span>
                            <span className="font-medium">{ticket.fechaUpdate}</span>
                        </div>
                    )}
                </div>

                {/* SLA Info */}
                {(ticket.slaTiempoLimite || ticket.slaImpacto) && (
                    <div className="bg-accent-yellow/10 rounded-lg p-3 mb-4 border border-accent-yellow/20">
                        <p className="text-[10px] text-accent-yellow uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                            <Clock size={12} /> SLA
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                            {ticket.slaTiempoLimite && <div><span className="text-text-muted">Tiempo límite: </span><span className="text-accent-yellow font-semibold">{ticket.slaTiempoLimite}</span></div>}
                            {ticket.slaImpacto && <div><span className="text-text-muted">Impacto: </span><span className="text-text-primary font-medium">{ticket.slaImpacto}</span></div>}
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="mb-5">
                    <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2 flex items-center gap-1"><FileText size={12} /> Reporte</p>
                    <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                        <p className="text-sm text-text-primary leading-relaxed">{ticket.descripcion}</p>
                        {ticket.adjuntos && ticket.adjuntos.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                                <p className="text-[10px] text-text-muted mb-2">Evidencia:</p>
                                <Adjuntos value={ticket.adjuntos} readOnly max={5} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Resolution */}
                {(ticket.solucion || ticket.accionesRealizadas || (ticket.adjuntosResolucion?.length > 0)) && (
                    <div className="mb-5">
                        <p className="text-[10px] text-green-400 uppercase tracking-wide mb-2 font-semibold flex items-center gap-1"><CheckCircle2 size={12} /> Resolución</p>
                        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                            {ticket.solucion && <div className="mb-3"><p className="text-[10px] text-text-muted mb-0.5">Solución:</p><p className="text-sm text-text-secondary">{ticket.solucion}</p></div>}
                            {ticket.accionesRealizadas && <div className="mb-3"><p className="text-[10px] text-text-muted mb-0.5">Acciones:</p><p className="text-sm text-text-secondary">{ticket.accionesRealizadas}</p></div>}
                            {ticket.adjuntosResolucion?.length > 0 && (
                                <div className="mt-2"><p className="text-[10px] text-text-muted mb-2">Evidencia:</p><Adjuntos value={ticket.adjuntosResolucion} readOnly max={5} /></div>
                            )}
                        </div>
                    </div>
                )}

                {/* History Route */}
                {ticket.historial && ticket.historial.length > 0 && (
                    <div className="bg-bg-secondary rounded-lg p-3 mb-5 border border-border/50">
                        <p className="text-[10px] text-text-muted uppercase tracking-wide mb-3 font-semibold flex items-center gap-1"><Kanban size={12} /> Ruta</p>
                        <div className="flex flex-wrap items-center gap-2">
                            {[...ticket.historial].reverse().map((h, i, arr) => (
                                <div key={i} className="flex items-center">
                                    <div className="group relative flex items-center gap-2 bg-bg-card border border-border/60 rounded-full px-3 py-1.5 cursor-help transition-colors hover:border-accent-blue/50 hover:bg-bg-secondary" title={h.motivo}>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${h.estadoNuevo.startsWith('Escalado')
                                                ? ESTADOS_COLOR['Escalado']?.dot
                                                : (ESTADOS_COLOR[h.estadoNuevo]?.dot || 'bg-gray-400')
                                                }`}></span>
                                            <span className="text-xs font-medium text-text-primary">{h.estadoNuevo}</span>
                                        </div>
                                        <span className="text-border mx-1">|</span>
                                        <span className="text-[10px] text-text-muted font-mono leading-none">
                                            {new Date(h.fecha).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {i < arr.length - 1 && <div className="mx-1 text-text-muted/40"><ArrowUpRight size={14} /></div>}
                                </div>
                            ))}
                            <div className="mx-1 text-text-muted/40"><ArrowUpRight size={14} /></div>
                            <div className="px-2 py-1 rounded bg-accent-blue/10 border border-accent-blue/30 text-[10px] font-bold text-accent-blue uppercase tracking-wider">Actual</div>
                        </div>
                    </div>
                )}

                {/* Related Attention (Visits/Support) */}
                {(relatedVisitas.length > 0 || relatedSesiones.length > 0) && (
                    <div className="mb-4">
                        <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2">Historial de Atención</p>
                        <div className="flex flex-col gap-2">
                            {relatedSesiones.map(s => (
                                <div key={s.id} onClick={() => onViewHistoryItem({ type: 'soporte', data: s })} className="bg-bg-secondary rounded-lg p-3 border border-border/50 cursor-pointer hover:bg-bg-card-hover transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-accent-cyan/15 text-accent-cyan flex items-center justify-center"><Monitor size={16} /></div>
                                        <div>
                                            <div className="flex items-center gap-2"><p className="text-xs font-medium text-text-primary">Soporte Remoto</p><span className="text-[10px] text-text-muted font-mono">{s.id}</span></div>
                                            <p className="text-[10px] text-text-muted">{s.fecha} · {s.tecnico}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.estado === 'Completada' ? 'bg-green-500/20 text-green-400' : s.estado === 'Fallida' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{s.estado}</span>
                                </div>
                            ))}
                            {relatedVisitas.map(v => (
                                <div key={v.id} onClick={() => onViewHistoryItem({ type: 'visita', data: v })} className="bg-bg-secondary rounded-lg p-3 border border-border/50 cursor-pointer hover:bg-bg-card-hover transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-accent-purple/15 text-accent-purple flex items-center justify-center"><MapPin size={16} /></div>
                                        <div>
                                            <div className="flex items-center gap-2"><p className="text-xs font-medium text-text-primary">Visita Técnica</p><span className="text-[10px] text-text-muted font-mono">{v.id}</span></div>
                                            <p className="text-[10px] text-text-muted">{v.fecha} · {v.tecnicoNombre}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.estado === 'Completada' ? 'bg-green-500/20 text-green-400' : v.estado === 'Cancelada' ? 'bg-gray-500/20 text-gray-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{v.estado}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
                    <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-1">Cambiar estado</p>
                    <div className="flex gap-2 flex-wrap">
                        {ticket.estado === 'Abierto' && (
                            <>
                                <button onClick={() => onStatusChange(ticket.id, 'En Proceso')} className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 border-none text-xs font-semibold cursor-pointer hover:bg-yellow-500/30">Pasar a En Proceso</button>
                                <button onClick={() => onStatusChange(ticket.id, 'Escalado')} className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 border-none text-xs font-semibold cursor-pointer hover:bg-orange-500/30">Escalar</button>
                                <button onClick={() => onStatusChange(ticket.id, 'Cancelado')} className="px-4 py-2 rounded-lg bg-gray-500/20 text-gray-400 border-none text-xs font-semibold cursor-pointer hover:bg-gray-500/30">Cancelar</button>
                            </>
                        )}
                        {ticket.estado === 'En Proceso' && (
                            <>
                                <button onClick={() => onStatusChange(ticket.id, 'Resuelto')} className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 border-none text-xs font-semibold cursor-pointer hover:bg-green-500/30">Resolver</button>
                                <button onClick={() => onStatusChange(ticket.id, 'Escalado')} className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 border-none text-xs font-semibold cursor-pointer hover:bg-orange-500/30">Escalar</button>
                                <button onClick={() => onStatusChange(ticket.id, 'Abierto')} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border-none text-xs font-semibold cursor-pointer hover:bg-red-500/30">Devolver a Abierto</button>
                            </>
                        )}
                        {ticket.estado === 'Escalado' && (
                            <>
                                <button onClick={() => onStatusChange(ticket.id, 'Resuelto')} className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 border-none text-xs font-semibold cursor-pointer hover:bg-green-500/30">Resolver</button>
                                <button onClick={() => onStatusChange(ticket.id, 'En Proceso')} className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 border-none text-xs font-semibold cursor-pointer hover:bg-yellow-500/30">Devolver a En Proceso</button>
                            </>
                        )}
                        {ticket.estado === 'Resuelto' && (
                            <>
                                <button onClick={() => onStatusChange(ticket.id, 'Cerrado')} className="px-4 py-2 rounded-lg bg-gray-500/20 text-gray-400 border-none text-xs font-semibold cursor-pointer hover:bg-gray-500/30">Cerrar Ticket</button>
                                <button onClick={() => onStatusChange(ticket.id, 'Abierto')} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border-none text-xs font-semibold cursor-pointer hover:bg-red-500/30">Reabrir</button>
                            </>
                        )}
                    </div>
                </div>

                {/* Inline Actions */}
                {ticket.estado !== 'Cerrado' && ticket.estado !== 'Cancelado' && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-2">Acciones relacionadas</p>
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => onGenerateVisita(ticket)} className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 border-none text-xs font-semibold cursor-pointer hover:bg-purple-500/30 flex items-center gap-1.5">
                                <MapPin size={12} /> Generar Visita Técnica
                            </button>
                            <button onClick={() => onGenerateSoporte(ticket)} className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border-none text-xs font-semibold cursor-pointer hover:bg-cyan-500/30 flex items-center gap-1.5">
                                <Monitor size={12} /> Generar Soporte Remoto
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-5 pt-4 border-t border-border">
                    <button onClick={onClose} className="w-full py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary text-sm cursor-pointer hover:bg-bg-card-hover transition-colors">Cerrar</button>
                </div>

            </div>
        </div>
    );
}
