import { useState } from 'react';
import { ArrowUpRight, Wrench, Monitor, Radio, X, CheckCircle2 } from 'lucide-react';

/**
 * Modal to handle ticket escalation with options.
 */
export default function EscalationModal({ open, onClose, onConfirm, ticketId }) {
    const [tipo, setTipo] = useState('visita'); // 'visita', 'soporte', 'planta'
    const [motivo, setMotivo] = useState('');

    if (!open) return null;

    const handleConfirm = () => {
        if (!motivo.trim()) return;
        onConfirm({ tipo, motivo: motivo.trim() });
        setMotivo('');
        setTipo('visita');
    };

    const options = [
        { id: 'visita', label: 'Derivar a Visita Técnica', icon: Wrench, color: 'text-accent-orange', bg: 'bg-accent-orange/15' },
        { id: 'soporte', label: 'Derivar a Soporte Remoto', icon: Monitor, color: 'text-accent-cyan', bg: 'bg-accent-cyan/15' },
        { id: 'planta', label: 'Derivación a Planta Externa', icon: Radio, color: 'text-accent-purple', bg: 'bg-accent-purple/15' },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]" onClick={onClose}>
            <div className="bg-bg-card rounded-2xl p-6 w-[500px] border border-border" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent-orange/20 flex items-center justify-center">
                            <ArrowUpRight size={20} className="text-accent-orange" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Escalar Ticket</h3>
                            <p className="text-xs text-text-muted">Ticket: <span className="font-mono">{ticketId}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col gap-5">
                    {/* Option Selection */}
                    <div className="grid grid-cols-1 gap-2.5">
                        <p className="text-xs text-text-secondary font-medium mb-1">Seleccione el destino de la derivación:</p>
                        {options.map(opt => (
                            <div
                                key={opt.id}
                                onClick={() => setTipo(opt.id)}
                                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${tipo === opt.id
                                        ? 'border-accent-blue bg-accent-blue/5 shadow-sm'
                                        : 'border-border bg-bg-secondary hover:border-border-hover'
                                    }`}
                            >
                                <div className={`w-9 h-9 rounded-lg ${opt.bg} flex items-center justify-center`}>
                                    <opt.icon size={18} className={opt.color} />
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-bold ${tipo === opt.id ? 'text-accent-blue' : 'text-text-primary'}`}>
                                        {opt.label}
                                    </p>
                                    <p className="text-[11px] text-text-muted">
                                        {opt.id === 'visita' ? 'Agenda una visita técnica al domicilio.' :
                                            opt.id === 'soporte' ? 'Registra una sesión de soporte avanzado.' :
                                                'Escalamiento por saturación o falla de infraestructura.'}
                                    </p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${tipo === opt.id ? 'border-accent-blue' : 'border-text-muted/30'
                                    }`}>
                                    {tipo === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-accent-blue animate-scale-in" />}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="text-xs text-text-secondary font-medium mb-1.5 block">
                            Motivo del escalamiento *
                        </label>
                        <textarea
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                            placeholder="Describa el motivo por el cual se deriva este caso... (Ej: AP saturado, requiere cambio de equipo, etc.)"
                            className="bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[100px] resize-y outline-none focus:border-accent-blue w-full"
                        />
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm font-semibold hover:bg-bg-card-hover transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!motivo.trim()}
                            className="flex-1 py-2.5 rounded-lg bg-accent-orange border-none text-white cursor-pointer text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={14} />
                            Escalar Ticket
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
