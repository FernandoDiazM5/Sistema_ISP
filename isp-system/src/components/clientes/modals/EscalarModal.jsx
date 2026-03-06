import { useState, useEffect } from 'react';
import { ArrowUpRight, Wrench, Monitor, Radio, X, CheckCircle2, FileText, ShoppingBag } from 'lucide-react';

/**
 * Modal to handle direct client escalation/derivation with options.
 */
export default function EscalarModal({ client, onClose, onConfirm }) {
    const [tipo, setTipo] = useState('visita'); // 'visita', 'soporte', 'planta', 'requerimiento'

    useEffect(() => {
        if (client) {
            setTipo('visita');
        }
    }, [client]);

    if (!client) return null;

    const handleConfirm = () => {
        onConfirm({ tipo, motivo: 'Derivación directa desde cliente' });
    };

    const options = [
        { id: 'visita', label: 'Derivar a Visita Técnica', icon: Wrench, color: 'text-accent-orange', bg: 'bg-accent-orange/15', text: 'Agenda una visita técnica al domicilio del cliente.' },
        { id: 'soporte', label: 'Derivar a Soporte Remoto', icon: Monitor, color: 'text-accent-cyan', bg: 'bg-accent-cyan/15', text: 'Registra una sesión de soporte avanzado.' },
        { id: 'planta', label: 'Derivación a Planta Externa', icon: Radio, color: 'text-accent-purple', bg: 'bg-accent-purple/15', text: 'Escalamiento por saturación o falla de infraestructura.' },
        { id: 'requerimiento', label: 'Derivar a Req. Administrativo', icon: FileText, color: 'text-accent-blue', bg: 'bg-accent-blue/15', text: 'Genera un requerimiento administrativo vinculado.' },
        { id: 'postVenta', label: 'Crear Post-Venta', icon: ShoppingBag, color: 'text-accent-purple', bg: 'bg-accent-purple/15', text: 'Registra un servicio de post-venta para el cliente.' },
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
                            <h3 className="text-lg font-bold">Derivar Cliente</h3>
                            <p className="text-xs text-text-muted">Cliente: <span className="font-semibold text-text-primary">{client.nombre}</span></p>
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
                                        {opt.text}
                                    </p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${tipo === opt.id ? 'border-accent-blue' : 'border-text-muted/30'
                                    }`}>
                                    {tipo === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-accent-blue animate-scale-in" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 mt-5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm font-semibold hover:bg-bg-card-hover transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-2.5 rounded-lg bg-accent-orange border-none text-white cursor-pointer text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={14} />
                        Continuar
                    </button>
                </div>
            </div>
        </div>
    );
}
