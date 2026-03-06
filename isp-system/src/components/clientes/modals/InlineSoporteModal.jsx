import { useState, useEffect, useMemo } from 'react';
import { Monitor, CheckCircle2 } from 'lucide-react';
import useStore from '../../../store/useStore';
import Adjuntos from '../../common/Adjuntos';
import DiagnosticFields, { getEmptyDiag } from '../../common/DiagnosticFields';

export default function InlineSoporteModal({ client, motivo, onClose, onSuccess }) {
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
        if (client) {
            setSoporteTipo('Diagnóstico');
            setSoporteTecnico('');
            setSoporteIP(client.ip || '');
            setSoporteObservaciones(`Motivo del reporte: ${motivo}`);
            setSoporteDerivar(false);
            setSoporteAdjuntos([]);
            setDiagnostico(getEmptyDiag());
            setSuccess(false);
        }
    }, [client, motivo]);

    const activeTecnicos = useMemo(() => {
        return tecnicos.filter(t => t.estado === 'Activo');
    }, [tecnicos]);

    const handleSubmit = () => {
        if (!soporteTecnico) return;
        const tec = tecnicos.find(t => t.id === soporteTecnico);
        const hasDiag = Object.values(diagnostico).some(v => v !== '' && v !== null && v !== undefined);
        const diagnosticos = hasDiag ? { ...diagnostico } : null;

        addSesionRemoto({
            clienteId: client.id,
            clienteNombre: client.nombre,
            ticketId: null,
            tipo: soporteTipo,
            tecnicoId: soporteTecnico,
            tecnico: tec ? tec.nombre : '',        // campo unificado con SoporteRemotoPage
            ip: soporteIP,
            tecnologia: client.tecnologia || '',
            diagnosticos,                           // estructura unificada bajo esta clave
            resultado: soporteObservaciones,        // campo unificado con SoporteRemotoPage
            estado: 'En curso',
            fechaInicio: new Date().toISOString(),
            duracion: '—',
            plan: client.plan || '',
            nodo: client.nodo || client.nodo_router || '',
            direccion: client.direccion || '',
            adjuntos: soporteAdjuntos,
        });

        if (soporteDerivar) {
            addVisita({
                clienteId: client.id,
                clienteNombre: client.nombre,
                ticketId: null,
                tecnicoId: soporteTecnico,
                tecnicoNombre: tec ? tec.nombre : '',
                tipo: 'Diagnóstico',
                prioridad: 'Alta',
                fecha: new Date().toISOString().split('T')[0],
                horaInicio: '09:00',
                direccion: client.direccion || '',
                descripcion: `Derivado desde soporte remoto — Reporte: ${motivo}\nObservaciones: ${soporteObservaciones}`,
                estado: 'Programada',
                nodo: client.nodo || client.nodo_router || '',
                plan: client.plan || '',
                tecnologia: client.tecnologia || '',
                adjuntos: soporteAdjuntos,
                diagnosticos,                       // estructura unificada
            });
        }

        setSuccess(true);
        setTimeout(() => {
            onSuccess();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70]" onClick={onClose}>
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
                                <div><h3 className="text-lg font-bold">Registrar Soporte Remoto</h3><p className="text-xs text-text-muted">Asistencia técnica en línea</p></div>
                            </div>
                            <button onClick={onClose} className="text-text-muted hover:text-text-primary text-lg border-none bg-transparent cursor-pointer font-bold leading-none">&times;</button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 mb-5">
                            <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                                <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-1.5">Cliente</p>
                                <p className="text-sm font-medium text-text-primary">{client.nombre}</p>
                                <p className="text-[11px] text-text-muted mt-0.5">Motivo Original: {motivo}</p>
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
                                        {activeTecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-text-secondary font-medium mb-1.5 block">IP del equipo</label>
                                    <input type="text" value={soporteIP} onChange={e => setSoporteIP(e.target.value)} placeholder="192.168.x.x" className="w-full" />
                                </div>
                            </div>

                            <DiagnosticFields
                                tecnologia={client.tecnologia}
                                value={diagnostico}
                                onChange={setDiagnostico}
                            />

                            <div>
                                <label className="text-xs text-text-secondary font-medium mb-1.5 block">Resultados y Observaciones</label>
                                <textarea value={soporteObservaciones} onChange={e => setSoporteObservaciones(e.target.value)} className="bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[80px] resize-y outline-none focus:border-accent-blue w-full" placeholder="Detalle lo realizado en el equipo..." />
                            </div>

                            <Adjuntos value={soporteAdjuntos} onChange={setSoporteAdjuntos} max={5} />

                            <label className="flex items-center gap-2.5 cursor-pointer bg-bg-secondary rounded-lg p-3 border border-border/50 hover:border-accent-purple/40 transition-colors">
                                <input type="checkbox" checked={soporteDerivar} onChange={e => setSoporteDerivar(e.target.checked)} className="w-4 h-4 accent-accent-purple cursor-pointer" />
                                <div>
                                    <p className="text-sm font-medium text-text-primary">Derivar a Visita Técnica</p>
                                    <p className="text-[11px] text-text-muted">Si el problema no fue resuelto, agenda una visita automática.</p>
                                </div>
                            </label>

                            <div className="flex gap-3 mt-1">
                                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm font-semibold hover:bg-bg-card-hover transition-colors">Cancelar</button>
                                <button type="button" onClick={handleSubmit} disabled={!soporteTecnico} className="flex-1 py-2.5 rounded-lg bg-accent-cyan border-none text-white cursor-pointer text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                                    {soporteDerivar ? 'Registrar y Derivar' : 'Guardar Sesión'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
