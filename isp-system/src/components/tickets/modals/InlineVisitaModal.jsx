import { useState, useEffect, useMemo } from 'react';
import { MapPin, CheckCircle2 } from 'lucide-react';
import useStore from '../../../store/useStore';
import Adjuntos from '../../common/Adjuntos';
import DiagnosticFields, { getEmptyDiag } from '../../common/DiagnosticFields';

export default function InlineVisitaModal({ ticket, client, onClose, onSuccess, diagnostico: initialDiag }) {
    const tecnicos = useStore(s => s.tecnicos);
    const addVisita = useStore(s => s.addVisita);

    const [visitaTecnico, setVisitaTecnico] = useState('');
    const [visitaTipo, setVisitaTipo] = useState('Reparación');
    const [visitaPrioridad, setVisitaPrioridad] = useState('Media');
    const [visitaFecha, setVisitaFecha] = useState('');
    const [visitaHora, setVisitaHora] = useState('');
    const [visitaDireccion, setVisitaDireccion] = useState('');
    const [visitaDescripcion, setVisitaDescripcion] = useState('');
    const [visitaAdjuntos, setVisitaAdjuntos] = useState([]);
    const [diagnostico, setDiagnostico] = useState(getEmptyDiag());
    const [success, setSuccess] = useState(false);

    // Initialize form
    useEffect(() => {
        if (ticket) {
            setVisitaTecnico('');
            setVisitaTipo('Reparación');
            setVisitaPrioridad('Media');
            setVisitaFecha('');
            setVisitaHora('');
            setVisitaDireccion(client?.direccion || '');
            setVisitaDescripcion(`Visita por ticket ${ticket.id}: ${ticket.descripcion}`);
            setVisitaAdjuntos(ticket.adjuntos || []);
            setDiagnostico(initialDiag || getEmptyDiag());
            setSuccess(false);
        }
    }, [ticket, client, initialDiag]);

    const activeTecnicos = useMemo(() => {
        return tecnicos.filter(t => t.estado === 'Activo');
    }, [tecnicos]);

    const handleSubmit = () => {
        if (!visitaTecnico || !visitaFecha || !visitaHora) return;
        const tec = tecnicos.find(t => t.id === visitaTecnico);

        addVisita({
            clienteId: ticket.clienteId,
            clienteNombre: ticket.clienteNombre,
            ticketId: ticket.id,
            tecnicoId: visitaTecnico,
            tecnicoNombre: tec ? tec.nombre : '',
            tipo: visitaTipo,
            prioridad: visitaPrioridad,
            fecha: visitaFecha,
            horaInicio: visitaHora,
            direccion: visitaDireccion,
            descripcion: visitaDescripcion,
            estado: 'Programada',
            nodo: client?.nodo || client?.nodo_router || '',
            plan: client?.plan || '',
            tecnologia: client?.tecnologia || '',
            adjuntos: visitaAdjuntos,
            diagnosticoCompleto: diagnostico, // Guardamos el objeto completo
            ...diagnostico, // Y también expandido para búsquedas fáciles si se requiere
        });

        setSuccess(true);
        setTimeout(() => {
            onSuccess();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className={`bg-bg-card rounded-2xl p-6 w-[640px] border max-h-[90vh] overflow-y-auto transition-colors duration-500 ${success ? 'border-green-500/60' : 'border-border'}`} onClick={e => e.stopPropagation()}>
                {success ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center"><CheckCircle2 size={28} className="text-green-400" /></div>
                        <p className="text-lg font-bold text-green-400">Visita Técnica Creada</p>
                        <p className="text-sm text-text-secondary">La visita fue generada exitosamente desde el ticket.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-accent-purple/20 flex items-center justify-center"><MapPin size={18} className="text-accent-purple" /></div>
                                <div><h3 className="text-lg font-bold">Generar Visita Técnica</h3><p className="text-xs text-text-muted">Crear visita desde ticket</p></div>
                            </div>
                            <button onClick={onClose} className="text-text-muted hover:text-text-primary text-lg border-none bg-transparent cursor-pointer font-bold leading-none">&times;</button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                                <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-1.5">Cliente</p>
                                <p className="text-sm font-medium text-text-primary">{ticket.clienteNombre}</p>
                                <p className="text-[11px] text-text-muted font-mono mt-0.5">ID: {ticket.clienteId}</p>
                            </div>
                            <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                                <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-1.5">Ticket</p>
                                <p className="text-sm font-medium text-text-primary font-mono">{ticket.id}</p>
                                <p className="text-[11px] text-text-muted mt-0.5">{ticket.estado} — {ticket.prioridad}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-text-secondary font-medium mb-1.5 block">Técnico asignado *</label>
                                    <select value={visitaTecnico} onChange={e => setVisitaTecnico(e.target.value)} className="w-full">
                                        <option value="">Seleccionar técnico...</option>
                                        {activeTecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-text-secondary font-medium mb-1.5 block">Tipo de visita</label>
                                    <select value={visitaTipo} onChange={e => setVisitaTipo(e.target.value)} className="w-full">
                                        <option value="Reparación">Reparación</option>
                                        <option value="Diagnóstico">Diagnóstico</option>
                                        <option value="Instalación">Instalación</option>
                                        <option value="Cambio de plan">Cambio de plan</option>
                                        <option value="Mantenimiento">Mantenimiento</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-text-secondary font-medium mb-1.5 block">Prioridad</label>
                                    <select value={visitaPrioridad} onChange={e => setVisitaPrioridad(e.target.value)} className="w-full">
                                        <option value="Alta">Alta</option>
                                        <option value="Media">Media</option>
                                        <option value="Baja">Baja</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-text-secondary font-medium mb-1.5 block">Fecha *</label>
                                    <input type="date" value={visitaFecha} onChange={e => setVisitaFecha(e.target.value)} className="w-full" />
                                </div>
                                <div>
                                    <label className="text-xs text-text-secondary font-medium mb-1.5 block">Hora *</label>
                                    <input type="time" value={visitaHora} onChange={e => setVisitaHora(e.target.value)} className="w-full" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-text-secondary font-medium mb-1.5 block">Dirección</label>
                                <input type="text" value={visitaDireccion} onChange={e => setVisitaDireccion(e.target.value)} className="w-full" />
                            </div>

                            <div>
                                <label className="text-xs text-text-secondary font-medium mb-1.5 block">Descripción</label>
                                <textarea value={visitaDescripcion} onChange={e => setVisitaDescripcion(e.target.value)} className="bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[80px] resize-y outline-none focus:border-accent-blue w-full" />
                            </div>

                            <DiagnosticFields
                                tecnologia={client?.tecnologia}
                                value={diagnostico}
                                onChange={setDiagnostico}
                            />

                            <Adjuntos value={visitaAdjuntos} onChange={setVisitaAdjuntos} max={5} />

                            <div className="flex gap-3 mt-1">
                                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm hover:bg-bg-card-hover transition-colors">Cancelar</button>
                                <button type="button" onClick={handleSubmit} disabled={!visitaTecnico || !visitaFecha || !visitaHora} className="flex-1 py-2.5 rounded-lg bg-accent-purple border-none text-white cursor-pointer text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                                    Crear Visita Técnica
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
