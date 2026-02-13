import { useState } from 'react';
import { CheckCircle2, FileText } from 'lucide-react';
import Adjuntos from './Adjuntos';

/**
 * Modal that requires a resolution report before changing status to resolved/completed/closed.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onConfirm: ({ solucion, accionesRealizadas, adjuntos }) => void
 *  - title: string (e.g. "Cerrar Ticket", "Completar Visita")
 *  - entityId: string (e.g. "TK-001")
 *  - entityLabel: string (e.g. "Ticket", "Visita", "Sesion")
 *  - newStatus: string (the target status name)
 *  - accentColor: string (tailwind color class, e.g. "accent-green")
 */
export default function ResolutionModal({ open, onClose, onConfirm, title, entityId, entityLabel, newStatus, accentColor = 'accent-green' }) {
  const [solucion, setSolucion] = useState('');
  const [acciones, setAcciones] = useState('');
  const [adjuntos, setAdjuntos] = useState([]);

  if (!open) return null;

  const handleConfirm = () => {
    if (!solucion.trim()) return;
    onConfirm({
      solucion: solucion.trim(),
      accionesRealizadas: acciones.trim(),
      adjuntosResolucion: adjuntos,
    });
    setSolucion('');
    setAcciones('');
    setAdjuntos([]);
  };

  const handleClose = () => {
    setSolucion('');
    setAcciones('');
    setAdjuntos([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]" onClick={handleClose}>
      <div className="bg-bg-card rounded-2xl p-6 w-[560px] border border-border max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-lg bg-${accentColor}/20 flex items-center justify-center`}>
            <FileText size={20} className={`text-${accentColor}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold">{title || `Cerrar ${entityLabel}`}</h3>
            <p className="text-xs text-text-muted">
              <span className="font-mono">{entityId}</span> → <span className={`text-${accentColor} font-semibold`}>{newStatus}</span>
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className={`bg-${accentColor}/10 border border-${accentColor}/20 rounded-lg p-3 mb-5`}>
          <p className="text-xs text-text-secondary">
            Para cambiar el estado a <strong>{newStatus}</strong> es necesario completar el informe de resolucion.
            Describa la solucion aplicada y las acciones realizadas.
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-text-secondary font-medium mb-1.5 block">
              Descripcion de la solucion *
            </label>
            <textarea
              value={solucion}
              onChange={e => setSolucion(e.target.value)}
              placeholder="Describa detalladamente la solucion aplicada, causa raiz identificada y resultado obtenido..."
              className="bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[100px] resize-y outline-none focus:border-accent-blue w-full"
            />
          </div>

          <div>
            <label className="text-xs text-text-secondary font-medium mb-1.5 block">
              Acciones realizadas
            </label>
            <textarea
              value={acciones}
              onChange={e => setAcciones(e.target.value)}
              placeholder="Ej: Se reinicio el equipo, se cambio el cable, se reconfiguro la antena, se reemplazo la ONU..."
              className="bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[70px] resize-y outline-none focus:border-accent-blue w-full"
            />
          </div>

          {/* Adjuntos */}
          <Adjuntos
            value={adjuntos}
            onChange={setAdjuntos}
            max={5}
            label="Evidencia / Adjuntos"
          />

          {/* Buttons */}
          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm hover:bg-bg-card-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!solucion.trim()}
              className={`flex-1 py-2.5 rounded-lg bg-${accentColor} border-none text-white cursor-pointer text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              <CheckCircle2 size={14} />
              Confirmar y {newStatus === 'Cerrado' ? 'Cerrar' : newStatus === 'Resuelto' ? 'Resolver' : 'Completar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
