import { useState, useEffect, useMemo } from 'react';
import { Monitor, CheckCircle2 } from 'lucide-react';
import useStore from '../../../store/useStore';
import Adjuntos from '../../common/Adjuntos';
import DiagnosticFields, { getEmptyDiag } from '../../common/DiagnosticFields';

export default function InlineSoporteModal({ ticket, client, onClose, onSuccess }) {
    const tecnicos = useStore(s => s.tecnicos);
    const addSesionRemoto = useStore(s => s.addSesionRemoto);
    const addVisita = useStore(s => s.addVisita);

    const [soporteTipo, setSoporteTipo] = useState('Diagnóstico');
    const [soporteTecnico, setSoporteTecnico] = useState('');
    const [soporteIP, setSoporteIP] = useState('');
    const [soporteObservaciones, setSoporteObservaciones] = useState('');
    const [soporteDerivar, setSoporteDerivar] = useState(false);
    const [soporteAdjuntos, setSoporteAdjuntos] = useState([]);
    const [diagnostico, setDiagnostico] = useState(getEmptyDiag());
    const [success, setSuccess] = useState(false);

    // Initialize form
    useEffect(() => {
        if (ticket) {
            setSoporteTipo('Diagnóstico');
            setSoporteTecnico('');
            setSoporteIP(client?.ip || '');
            setSoporteObservaciones('');
            setSoporteDerivar(false);
            setSoporteAdjuntos([]);
            setDiagnostico(getEmptyDiag());
            setSuccess(false);
        }
    }, [ticket, client]);

    const activeTecnicos = useMemo(() => {
        return tecnicos.filter(t => t.estado === 'Activo');
    }, [tecnicos]);

    const handleSubmit = () => {
        if (!soporteTecnico) return;
        const tec = tecnicos.find(t => t.id === soporteTecnico);

        addSesionRemoto({
            clienteId: ticket.clienteId,
            clienteNombre: ticket.clienteNombre,
            ticketId: ticket.id,
            tipo: soporteTipo,
            tecnicoId: soporteTecnico,
            tecnicoNombre: tec ? tec.nombre : '',
            ip: soporteIP,
            tecnologia: client?.tecnologia || '',
            diagnosticoCompleto: diagnostico, // Guardamos el objeto completo
            ...diagnostico, // Y también expandido para búsquedas fáciles si se requiere
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
                fecha: new Date().toISOString().split('T')[0],
                horaInicio: '',
                direccion: client?.direccion || '',
                descripcion: `Derivado desde soporte remoto — Ticket ${ticket.id}: ${soporteObservaciones || ticket.descripcion}`,
                estado: 'Programada',
                nodo: client?.nodo || client?.nodo_router || '',
                plan: client?.plan || '',
                tecnologia: client?.tecnologia || '',
                adjuntos: soporteAdjuntos,
                diagnosticoCompleto: diagnostico,
                ...diagnostico,
            });
        }

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
                        <p className="text-lg font-bold text-green-400">Soporte Remoto Registrado</p>
                        <p className="text-sm text-text-secondary">{soporteDerivar ? 'Sesión registrada y visita técnica derivada exitosamente.' : 'La sesión de soporte remoto fue registrada exitosamente.'}</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-accent-cyan/20 flex items-center justify-center"><Monitor size={18} className="text-accent-cyan" /></div>
                                <div><h3 className="text-lg font-bold">Generar Soporte Remoto</h3><p className="text-xs text-text-muted">Sesión remota desde ticket</p></div>
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
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-text-secondary font-medium mb-1.5 block">Tipo de sesión</label>
                                    <select value={soporteTipo} onChange={e => setSoporteTipo(e.target.value)} className="w-full">
                                        <option value="Diagnóstico">Diagnóstico</option>
                                        <option value="Configuración">Configuración</option>
                                        <option value="Monitoreo">Monitoreo</option>
                                        <option value="Reinicio remoto">Reinicio remoto</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-text-secondary font-medium mb-1.5 block">Técnico *</label>
                                    <select value={soporteTecnico} onChange={e => setSoporteTecnico(e.target.value)} className="w-full">
                                        <option value="">Seleccionar...</option>
                                        {activeTecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre} — {t.especialidad}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-text-secondary font-medium mb-1.5 block">IP del equipo</label>
                                    <input type="text" value={soporteIP} onChange={e => setSoporteIP(e.target.value)} placeholder="192.168.x.x" className="w-full" />
                                </div>
                            </div>

                            <DiagnosticFields
                                tecnologia={client?.tecnologia}
                                value={diagnostico}
                                onChange={setDiagnostico}
                            />

                            <div>
                                <label className="text-xs text-text-secondary font-medium mb-1.5 block">Observaciones / Resultado</label>
                                <textarea value={soporteObservaciones} onChange={e => setSoporteObservaciones(e.target.value)} className="bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[80px] resize-y outline-none focus:border-accent-blue w-full" placeholder="Resultados de la sesión..." />
                            </div>

                            <Adjuntos value={soporteAdjuntos} onChange={setSoporteAdjuntos} max={5} />

                            <label className="flex items-center gap-2.5 cursor-pointer bg-bg-secondary rounded-lg p-3 border border-border/50 hover:border-accent-purple/40 transition-colors">
                                <input type="checkbox" checked={soporteDerivar} onChange={e => setSoporteDerivar(e.target.checked)} className="w-4 h-4 accent-accent-purple cursor-pointer" />
                                <div>
                                    <p className="text-sm font-medium text-text-primary">Derivar a Visita Técnica</p>
                                    <p className="text-[11px] text-text-muted">Al guardar, también se creará una visita técnica.</p>
                                </div>
                            </label>

                            <div className="flex gap-3 mt-1">
                                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm hover:bg-bg-card-hover transition-colors">Cancelar</button>
                                <button type="button" onClick={handleSubmit} disabled={!soporteTecnico} className="flex-1 py-2.5 rounded-lg bg-accent-cyan border-none text-white cursor-pointer text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                                    {soporteDerivar ? 'Registrar y Derivar' : 'Registrar Soporte Remoto'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
