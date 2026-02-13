import { useState, useEffect, useMemo } from 'react';
import { Monitor, CheckCircle2 } from 'lucide-react';
import useStore from '../../../store/useStore';
import Adjuntos from '../../common/Adjuntos';

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
    const [success, setSuccess] = useState(false);

    // Diagnostic params
    const [diagPing, setDiagPing] = useState('');
    const [diagDownload, setDiagDownload] = useState('');
    const [diagUpload, setDiagUpload] = useState('');
    const [diagPacketLoss, setDiagPacketLoss] = useState('');
    const [diagJitter, setDiagJitter] = useState('');

    // Radio params
    const [diagSenalRecibida, setDiagSenalRecibida] = useState('');
    const [diagNoiseFloor, setDiagNoiseFloor] = useState('');
    const [diagCCQ, setDiagCCQ] = useState('');
    const [diagFrecuencia, setDiagFrecuencia] = useState('');
    const [diagCanal, setDiagCanal] = useState('');

    // Fibra params
    const [diagPotenciaRx, setDiagPotenciaRx] = useState('');
    const [diagPotenciaTx, setDiagPotenciaTx] = useState('');
    const [diagAtenuacion, setDiagAtenuacion] = useState('');
    const [diagPuertoOLT, setDiagPuertoOLT] = useState('');

    // Initialize form
    useEffect(() => {
        if (ticket) {
            setSoporteTipo('Diagnóstico');
            setSoporteTecnico('');
            setSoporteIP(client?.ip || '');
            setSoporteObservaciones('');
            setSoporteDerivar(false);
            setSoporteAdjuntos([]);
            setSuccess(false);

            // Reset diags
            setDiagPing(''); setDiagDownload(''); setDiagUpload('');
            setDiagPacketLoss(''); setDiagJitter('');
            setDiagSenalRecibida(''); setDiagNoiseFloor(''); setDiagCCQ('');
            setDiagFrecuencia(''); setDiagCanal('');
            setDiagPotenciaRx(''); setDiagPotenciaTx(''); setDiagAtenuacion('');
            setDiagPuertoOLT('');
        }
    }, [ticket, client]);

    const activeTecnicos = useMemo(() => {
        return tecnicos.filter(t => t.estado === 'Activo');
    }, [tecnicos]);

    const handleSubmit = () => {
        if (!soporteTecnico) return;
        const tec = tecnicos.find(t => t.id === soporteTecnico);
        const tecnologia = client?.tecnologia || '';

        const diagnosticos = {
            ping: diagPing ? parseFloat(diagPing) : null,
            download: diagDownload ? parseFloat(diagDownload) : null,
            upload: diagUpload ? parseFloat(diagUpload) : null,
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
                fecha: new Date().toISOString().split('T')[0],
                horaInicio: '',
                direccion: client?.direccion || '',
                descripcion: `Derivado desde soporte remoto — Ticket ${ticket.id}: ${soporteObservaciones || ticket.descripcion}`,
                estado: 'Programada',
                nodo: client?.nodo || client?.nodo_router || '',
                plan: client?.plan || '',
                tecnologia: tecnologia,
                adjuntos: soporteAdjuntos,
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

                            {/* Diagnostic Parameters */}
                            <div className="border border-border rounded-lg p-4 bg-bg-secondary/50">
                                <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-3">Parámetros de Diagnóstico</p>

                                <p className="text-[10px] text-accent-blue uppercase tracking-wide font-semibold mb-2">Parámetros comunes</p>
                                <div className="grid grid-cols-5 gap-2 mb-4">
                                    <div><label className="text-xs text-text-secondary mb-1 block">Ping (ms)</label><input type="number" value={diagPing} onChange={e => setDiagPing(e.target.value)} className="w-full" step="any" placeholder="0" /></div>
                                    <div><label className="text-xs text-text-secondary mb-1 block">Down (Mbps)</label><input type="number" value={diagDownload} onChange={e => setDiagDownload(e.target.value)} className="w-full" step="any" placeholder="0" /></div>
                                    <div><label className="text-xs text-text-secondary mb-1 block">Up (Mbps)</label><input type="number" value={diagUpload} onChange={e => setDiagUpload(e.target.value)} className="w-full" step="any" placeholder="0" /></div>
                                    <div><label className="text-xs text-text-secondary mb-1 block">Pkt Loss (%)</label><input type="number" value={diagPacketLoss} onChange={e => setDiagPacketLoss(e.target.value)} className="w-full" step="any" placeholder="0" /></div>
                                    <div><label className="text-xs text-text-secondary mb-1 block">Jitter (ms)</label><input type="number" value={diagJitter} onChange={e => setDiagJitter(e.target.value)} className="w-full" step="any" placeholder="0" /></div>
                                </div>

                                {client?.tecnologia === 'Radio Enlace' && (
                                    <>
                                        <p className="text-[10px] text-accent-purple uppercase tracking-wide font-semibold mb-2">Radio Enlace</p>
                                        <div className="grid grid-cols-5 gap-2">
                                            <div><label className="text-xs text-text-secondary mb-1 block">Señal Rx</label><input type="number" value={diagSenalRecibida} onChange={e => setDiagSenalRecibida(e.target.value)} className="w-full" step="any" placeholder="-65" /></div>
                                            <div><label className="text-xs text-text-secondary mb-1 block">Noise</label><input type="number" value={diagNoiseFloor} onChange={e => setDiagNoiseFloor(e.target.value)} className="w-full" step="any" placeholder="-95" /></div>
                                            <div><label className="text-xs text-text-secondary mb-1 block">CCQ (%)</label><input type="number" value={diagCCQ} onChange={e => setDiagCCQ(e.target.value)} className="w-full" step="any" placeholder="100" /></div>
                                            <div><label className="text-xs text-text-secondary mb-1 block">Frec (GHz)</label><input type="number" value={diagFrecuencia} onChange={e => setDiagFrecuencia(e.target.value)} className="w-full" step="any" placeholder="5.8" /></div>
                                            <div><label className="text-xs text-text-secondary mb-1 block">Canal</label><input type="text" value={diagCanal} onChange={e => setDiagCanal(e.target.value)} className="w-full" placeholder="Auto" /></div>
                                        </div>
                                    </>
                                )}

                                {client?.tecnologia === 'Fibra Óptica' && (
                                    <>
                                        <p className="text-[10px] text-accent-green uppercase tracking-wide font-semibold mb-2">Fibra Óptica</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            <div><label className="text-xs text-text-secondary mb-1 block">Pot Rx</label><input type="number" value={diagPotenciaRx} onChange={e => setDiagPotenciaRx(e.target.value)} className="w-full" step="any" placeholder="-18" /></div>
                                            <div><label className="text-xs text-text-secondary mb-1 block">Pot Tx</label><input type="number" value={diagPotenciaTx} onChange={e => setDiagPotenciaTx(e.target.value)} className="w-full" step="any" placeholder="2.5" /></div>
                                            <div><label className="text-xs text-text-secondary mb-1 block">Atenuación</label><input type="number" value={diagAtenuacion} onChange={e => setDiagAtenuacion(e.target.value)} className="w-full" step="any" placeholder="0" /></div>
                                            <div><label className="text-xs text-text-secondary mb-1 block">Puerto OLT</label><input type="text" value={diagPuertoOLT} onChange={e => setDiagPuertoOLT(e.target.value)} className="w-full" placeholder="GPON 0/1/1" /></div>
                                        </div>
                                    </>
                                )}
                            </div>

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
