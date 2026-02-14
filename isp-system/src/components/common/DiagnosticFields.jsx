import { useState } from 'react';
import { ChevronDown, ChevronRight, Activity, Radio, Wifi } from 'lucide-react';

const EMPTY_DIAG = {
    ping: '',
    velocidadBajada: '',
    velocidadSubida: '',
    // Fibra
    nivelOLT: '',
    nivelONT: '',
    atenuacion: '',
    puertoPON: '',
    // Radio
    equipoAP: '',
    equipoCPE: '',
    senalAP: '',
    senalCPE: '',
    ccq: '',
    frecuencia: '',
    // General
    observaciones: '',
};

export function getEmptyDiag() {
    return { ...EMPTY_DIAG };
}

/**
 * DiagnosticFields - Campos de diagnóstico técnico según tecnología
 * @param {string} tecnologia - 'Fibra Óptica', 'Radio Enlace', etc.
 * @param {object} value - Estado actual
 * @param {function} onChange - Setter del estado
 */
export default function DiagnosticFields({ tecnologia, value, onChange, onTecnologiaChange, readOnly = false, warnings = {} }) {
    const [expanded, setExpanded] = useState(!!tecnologia);

    // Auto-expand when technology changes or is detected
    useState(() => {
        if (tecnologia) setExpanded(true);
    }, [tecnologia]);

    const isFibra = tecnologia?.toLowerCase().includes('fibra');
    const isRadio = tecnologia?.toLowerCase().includes('radio');

    const upd = (field, val) => !readOnly && onChange(prev => ({ ...prev, [field]: val }));

    const getInputClass = (field) => {
        const base = "w-full py-2.5 px-3 rounded-lg text-xs outline-none transition-all placeholder:text-slate-600";
        if (readOnly) {
            const warn = warnings[field];
            return `${base} ${warn ? 'bg-accent-orange/10 border border-accent-orange text-accent-orange font-bold' : 'bg-slate-800/50 border border-transparent text-slate-300'}`;
        }
        return `${base} bg-[#1e293b]/50 border border-slate-700 text-slate-200 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20`;
    };

    const labelClass = "text-[10px] text-slate-400 block mb-1.5 font-medium uppercase tracking-wider";

    return (
        <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${expanded ? 'border-accent-cyan/30 shadow-lg shadow-accent-cyan/5' : 'border-border'}`}>
            <div
                onClick={() => setExpanded(!expanded)}
                className={`w-full flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-colors ${expanded ? 'bg-accent-cyan/5' : 'bg-bg-secondary hover:bg-bg-card-hover'}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${expanded ? 'bg-accent-cyan text-white' : 'bg-accent-cyan/10 text-accent-cyan'}`}>
                        <Activity size={16} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-text-primary">Parámetros Técnicos</span>
                            <span className="text-[10px] text-text-muted bg-bg-card px-1.5 py-0.5 rounded border border-border">(Opcional)</span>
                        </div>

                        {/* Technology Selector / Badge */}
                        <div className="mt-1" onClick={e => e.stopPropagation()}>
                            {onTecnologiaChange && !readOnly ? (
                                <div className="relative group inline-block">
                                    <button
                                        type="button"
                                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] border transition-colors cursor-pointer ${tecnologia
                                                ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20 hover:bg-accent-cyan/20'
                                                : 'bg-bg-card text-text-muted border-dashed border-border hover:text-text-primary hover:border-text-secondary'
                                            }`}
                                    >
                                        {tecnologia || 'Seleccionar Tecnología'}
                                        <ChevronDown size={10} />
                                    </button>
                                    <div className="absolute top-full left-0 mt-1 w-36 bg-[#0f172a] border border-slate-700 rounded-lg shadow-xl py-1 z-20 hidden group-hover:block transition-all animate-in fade-in zoom-in-95 duration-200">
                                        <button
                                            type="button"
                                            onClick={() => { onTecnologiaChange('Fibra Óptica'); setExpanded(true); }}
                                            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-accent-green shadow-[0_0_8px_rgba(34,197,94,0.5)]" /> Fibra Óptica
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { onTecnologiaChange('Radio Enlace'); setExpanded(true); }}
                                            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                                        >
                                            <Radio size={12} className="text-accent-purple" /> Radio Enlace
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                tecnologia && (
                                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                                        {tecnologia}
                                    </span>
                                )
                            )}
                        </div>
                    </div>
                </div>
                {expanded ? <ChevronDown size={16} className="text-accent-cyan" /> : <ChevronRight size={16} className="text-text-muted" />}
            </div>

            {expanded && (
                <div className="p-5 flex flex-col gap-6 bg-[#0f172a]/30 border-t border-accent-cyan/10 backdrop-blur-sm">
                    {/* Conectividad */}
                    <div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Wifi size={12} className="text-slate-500" /> CONECTIVIDAD
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>Ping (ms)</label>
                                <input
                                    type="number" step="0.1" min="0" placeholder="Ej: 12.5"
                                    value={value.ping} onChange={e => upd('ping', e.target.value)}
                                    className={getInputClass('ping')} readOnly={readOnly}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Vel. Bajada (Mbps)</label>
                                <input
                                    type="number" step="0.1" min="0" placeholder="Ej: 45.2"
                                    value={value.velocidadBajada} onChange={e => upd('velocidadBajada', e.target.value)}
                                    className={getInputClass('download')} readOnly={readOnly}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Vel. Subida (Mbps)</label>
                                <input
                                    type="number" step="0.1" min="0" placeholder="Ej: 22.8"
                                    value={value.velocidadSubida} onChange={e => upd('velocidadSubida', e.target.value)}
                                    className={getInputClass('upload')} readOnly={readOnly}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fibra Óptica */}
                    {isFibra && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <p className="text-[11px] text-accent-green font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-accent-green shadow-[0_0_10px_rgba(34,197,94,0.6)]" /> Fibra Óptica
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Nivel OLT (dBm)</label>
                                    <input
                                        type="number" step="0.01" placeholder="Ej: -18.5"
                                        value={value.nivelOLT} onChange={e => upd('nivelOLT', e.target.value)}
                                        className={getInputClass('nivelOLT')} readOnly={readOnly}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Nivel ONT/ONU (dBm)</label>
                                    <input
                                        type="number" step="0.01" placeholder="Ej: -22.3"
                                        value={value.nivelONT} onChange={e => upd('nivelONT', e.target.value)}
                                        className={getInputClass('nivelONT')} readOnly={readOnly}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Atenuación (dB)</label>
                                    <input
                                        type="number" step="0.01" min="0" placeholder="Ej: 3.8"
                                        value={value.atenuacion} onChange={e => upd('atenuacion', e.target.value)}
                                        className={getInputClass('atenuacion')} readOnly={readOnly}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Puerto PON</label>
                                    <input
                                        type="text" placeholder="Ej: PON 1/1/3"
                                        value={value.puertoPON} onChange={e => upd('puertoPON', e.target.value)}
                                        className={getInputClass('puertoPON')} readOnly={readOnly}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Radio Enlace */}
                    {isRadio && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <p className="text-[11px] text-accent-purple font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Radio size={12} className="text-accent-purple" /> Radio Enlace
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Equipo AP</label>
                                    <input
                                        type="text" placeholder="Ej: Ubiquiti Rocket M5"
                                        value={value.equipoAP} onChange={e => upd('equipoAP', e.target.value)}
                                        className={getInputClass('equipoAP')} readOnly={readOnly}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Equipo CPE</label>
                                    <input
                                        type="text" placeholder="Ej: Ubiquiti NanoStation 5AC"
                                        value={value.equipoCPE} onChange={e => upd('equipoCPE', e.target.value)}
                                        className={getInputClass('equipoCPE')} readOnly={readOnly}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Señal AP (dBm)</label>
                                    <input
                                        type="number" step="1" placeholder="Ej: -65"
                                        value={value.senalAP} onChange={e => upd('senalAP', e.target.value)}
                                        className={getInputClass('senalAP')} readOnly={readOnly}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Señal CPE (dBm)</label>
                                    <input
                                        type="number" step="1" placeholder="Ej: -62"
                                        value={value.senalCPE} onChange={e => upd('senalCPE', e.target.value)}
                                        className={getInputClass('senalCPE')} readOnly={readOnly}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>CCQ (%)</label>
                                    <input
                                        type="number" step="1" min="0" max="100" placeholder="Ej: 85"
                                        value={value.ccq} onChange={e => upd('ccq', e.target.value)}
                                        className={getInputClass('ccq')} readOnly={readOnly}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Frecuencia (MHz)</label>
                                    <input
                                        type="number" step="1" placeholder="Ej: 5180"
                                        value={value.frecuencia} onChange={e => upd('frecuencia', e.target.value)}
                                        className={getInputClass('frecuencia')} readOnly={readOnly}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No technology detected */}
                    {!isFibra && !isRadio && (
                        <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 text-center">
                            <p className="text-xs text-text-muted italic mb-3">
                                No se ha seleccionado una tecnología.
                                {!readOnly && " Por favor seleccione una arriba para ver los campos específicos."}
                            </p>
                            {!readOnly && (
                                <div className="flex justify-center gap-3">
                                    <button type="button" onClick={() => onTecnologiaChange && onTecnologiaChange('Fibra Óptica')} className="px-3 py-1.5 rounded-md bg-accent-green/10 text-accent-green text-[10px] font-bold border border-accent-green/20 hover:bg-accent-green/20 transition-colors">
                                        Fibra Óptica
                                    </button>
                                    <button type="button" onClick={() => onTecnologiaChange && onTecnologiaChange('Radio Enlace')} className="px-3 py-1.5 rounded-md bg-accent-purple/10 text-accent-purple text-[10px] font-bold border border-accent-purple/20 hover:bg-accent-purple/20 transition-colors">
                                        Radio Enlace
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Observaciones */}
                    <div>
                        <label className={labelClass}>Observaciones técnicas</label>
                        <textarea
                            placeholder="Detalles adicionales del diagnóstico..."
                            value={value.observaciones}
                            onChange={e => upd('observaciones', e.target.value)}
                            className={`w-full p-3 rounded-lg text-xs min-h-[80px] resize-y outline-none transition-all placeholder:text-slate-600 ${readOnly
                                    ? 'bg-slate-800/50 border border-transparent text-slate-300'
                                    : 'bg-[#1e293b]/50 border border-slate-700 text-slate-200 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20'
                                }`}
                            readOnly={readOnly}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
