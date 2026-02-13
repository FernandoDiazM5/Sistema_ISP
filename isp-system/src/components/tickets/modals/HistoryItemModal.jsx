import { X, MapPin, CheckCircle2, AlertTriangle, Radio, Zap, Gauge } from 'lucide-react';
import Adjuntos from '../../common/Adjuntos';

const ESTADOS_COLOR = {
    'Abierto': { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
    'En Proceso': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
    'Escalado': { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-400' },
    'Resuelto': { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-400' },
    'Cerrado': { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-400' },
    'Cancelado': { bg: 'bg-gray-500/20', text: 'text-gray-500', dot: 'bg-gray-500' },
};

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

export default function HistoryItemModal({ item, type, onClose }) {
    if (!item) return null;

    const isVisita = type === 'visita';
    const d = item.diagnosticos;
    const warns = getDiagWarnings(d);
    const hasDiag = d && Object.values(d).some(v => v !== '' && v !== null && v !== undefined);
    const techStr = (item.tecnologia || '').toLowerCase();
    const showRadio = techStr.includes('radio');
    const showFibra = techStr.includes('fibra');

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center" style={{ zIndex: 60 }} onClick={onClose}>
            <div className="bg-bg-card rounded-2xl p-6 w-[500px] border border-border max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
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
                        <h3 className="text-lg font-bold">{isVisita ? 'Detalle de Visita' : 'Detalle de Soporte Remoto'}</h3>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer"><X size={20} /></button>
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
                                <p className="text-sm font-medium flex items-center gap-1"><MapPin size={12} className="text-text-muted" />{item.direccion}</p>
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

                    {(item.solucion || item.accionesRealizadas) && (
                        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                            <p className="text-[10px] text-green-400 uppercase mb-1 flex items-center gap-1"><CheckCircle2 size={12} /> Resolución</p>
                            {item.solucion && <div className="mb-2"><p className="text-[10px] text-text-muted mb-0.5">Solución:</p><p className="text-sm text-text-secondary">{item.solucion}</p></div>}
                            {item.accionesRealizadas && <div className="mb-2"><p className="text-[10px] text-text-muted mb-0.5">Acciones:</p><p className="text-sm text-text-secondary">{item.accionesRealizadas}</p></div>}
                            {item.adjuntosResolucion && item.adjuntosResolucion.length > 0 && (
                                <div className="mt-2"><p className="text-[10px] text-text-muted mb-1">Evidencia:</p><Adjuntos value={item.adjuntosResolucion} readOnly max={5} /></div>
                            )}
                        </div>
                    )}

                    {!isVisita && hasDiag && (
                        <div className="border-t border-border pt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Gauge size={16} className="text-accent-cyan" />
                                <h4 className="text-sm font-bold text-text-primary">Reporte de Diagnóstico</h4>
                            </div>

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
                            <p className="text-[10px] text-text-muted mb-1">Evidencia Inicial:</p>
                            <Adjuntos value={item.adjuntos} readOnly max={5} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
