import { Gauge, Radio, Zap, AlertTriangle } from 'lucide-react';

function DiagValue({ label, value, unit, warn }) {
    if (value === undefined || value === null || value === '') return null;
    return (
        <div className={`bg-bg-secondary rounded-lg p-2 border ${warn ? 'border-accent-orange/50' : 'border-border/50'}`}>
            <p className="text-[9px] text-text-muted uppercase tracking-wide font-semibold mb-0.5">{label}</p>
            <p className={`text-[11px] font-mono font-semibold ${warn ? 'text-accent-orange' : 'text-text-primary'}`}>
                {value}{unit ? ` ${unit}` : ''}
                {warn && <AlertTriangle size={10} className="inline ml-1 text-accent-orange" />}
            </p>
        </div>
    );
}

export default function NetworkDiagnostics({ data: d, type = '' }) {
    if (!d || !Object.values(d).some(v => v !== '' && v !== null && v !== undefined)) return null;

    const techStr = type.toLowerCase();
    const showRadio = techStr.includes('radio');
    const showFibra = techStr.includes('fibra');

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

    const warns = getDiagWarnings(d);

    return (
        <div className="border-t border-border pt-3 mt-1">
            <div className="flex items-center gap-2 mb-2">
                <Gauge size={14} className="text-accent-cyan" />
                <h4 className="text-[11px] font-bold text-text-primary uppercase tracking-wide">Diagnóstico de Red</h4>
            </div>

            {(d.ping || d.download || d.upload || d.packetLoss || d.jitter) && (
                <div className="mb-3">
                    <p className="text-[9px] text-text-muted uppercase tracking-wide font-semibold mb-1.5">Parámetros generales</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        <DiagValue label="Ping" value={d.ping} unit="ms" warn={warns.ping} />
                        <DiagValue label="Download" value={d.download} unit="Mbps" warn={warns.download} />
                        <DiagValue label="Upload" value={d.upload} unit="Mbps" warn={warns.upload} />
                        <DiagValue label="Packet Loss" value={d.packetLoss} unit="%" warn={warns.packetLoss} />
                        <DiagValue label="Jitter" value={d.jitter} unit="ms" warn={warns.jitter} />
                    </div>
                </div>
            )}

            {showRadio && (d.senalRecibida || d.noiseFloor || d.ccq || d.frecuencia) && (
                <div className="mb-3">
                    <p className="text-[9px] text-accent-purple uppercase tracking-wide font-semibold mb-1.5 flex items-center gap-1"><Radio size={10} /> Radio Enlace</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        <DiagValue label="Señal" value={d.senalRecibida} unit="dBm" warn={warns.senalRecibida} />
                        <DiagValue label="Noise Floor" value={d.noiseFloor} unit="dBm" />
                        <DiagValue label="CCQ" value={d.ccq} unit="%" warn={warns.ccq} />
                        <DiagValue label="Frecuencia" value={d.frecuencia} unit="GHz" />
                        <DiagValue label="Canal" value={d.canal} />
                        <DiagValue label="Ancho Banda" value={d.anchoBandaEnlace} />
                    </div>
                </div>
            )}

            {showFibra && (d.potenciaRx || d.potenciaTx || d.atenuacion) && (
                <div className="mb-3">
                    <p className="text-[9px] text-green-400 uppercase tracking-wide font-semibold mb-1.5 flex items-center gap-1"><Zap size={10} /> Fibra Óptica</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        <DiagValue label="Pot. Rx" value={d.potenciaRx} unit="dBm" warn={warns.potenciaRx} />
                        <DiagValue label="Pot. Tx" value={d.potenciaTx} unit="dBm" />
                        <DiagValue label="Atenuación" value={d.atenuacion} unit="dB" warn={warns.atenuacion} />
                        <DiagValue label="Puerto OLT" value={d.puertoOLT} />
                        <DiagValue label="Estado ONU" value={d.estadoONU} warn={warns.estadoONU} />
                    </div>
                </div>
            )}
        </div>
    );
}
