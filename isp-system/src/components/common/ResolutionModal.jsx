import { useState } from 'react';
import { CheckCircle2, FileText } from 'lucide-react';
import Adjuntos from './Adjuntos';

// Mapeo de colores para evitar clases Tailwind dinámicas (se eliminan en producción)
const COLOR_MAP = {
  'accent-green': { bg: 'bg-accent-green/20', text: 'text-accent-green', border: 'border-accent-green/20', bgLight: 'bg-accent-green/10', btnBg: 'bg-accent-green' },
  'accent-blue': { bg: 'bg-accent-blue/20', text: 'text-accent-blue', border: 'border-accent-blue/20', bgLight: 'bg-accent-blue/10', btnBg: 'bg-accent-blue' },
  'accent-yellow': { bg: 'bg-accent-yellow/20', text: 'text-accent-yellow', border: 'border-accent-yellow/20', bgLight: 'bg-accent-yellow/10', btnBg: 'bg-accent-yellow' },
  'accent-red': { bg: 'bg-accent-red/20', text: 'text-accent-red', border: 'border-accent-red/20', bgLight: 'bg-accent-red/10', btnBg: 'bg-accent-red' },
};

export default function ResolutionModal({ open, onClose, onConfirm, title, entityId, entityLabel, newStatus, accentColor = 'accent-green' }) {
  const [solucion, setSolucion] = useState('');
  const [acciones, setAcciones] = useState('');
  const [adjuntos, setAdjuntos] = useState([]);

  const [ping, setPing] = useState('');
  const [download, setDownload] = useState('');
  const [upload, setUpload] = useState('');
  const [packetLoss, setPacketLoss] = useState('');
  const [jitter, setJitter] = useState('');

  if (!open) return null;

  const colors = COLOR_MAP[accentColor] || COLOR_MAP['accent-green'];

  const handleConfirm = () => {
    if (!solucion.trim()) return;
    onConfirm({
      solucion: solucion.trim(),
      accionesRealizadas: acciones.trim(),
      adjuntosResolucion: adjuntos,
      diagnosticosFinales: newStatus === 'Resuelto' ? {
        ping: ping ? parseFloat(ping) : null,
        download: download ? parseFloat(download) : null,
        upload: upload ? parseFloat(upload) : null,
        packetLoss: packetLoss ? parseFloat(packetLoss) : null,
        jitter: jitter ? parseFloat(jitter) : null,
      } : null
    });
    setSolucion(''); setAcciones(''); setAdjuntos([]);
    setPing(''); setDownload(''); setUpload(''); setPacketLoss(''); setJitter('');
  };

  const handleClose = () => {
    setSolucion(''); setAcciones(''); setAdjuntos([]);
    setPing(''); setDownload(''); setUpload(''); setPacketLoss(''); setJitter('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={handleClose}>
      <div className="bg-bg-card rounded-2xl p-6 w-full max-w-[560px] border border-border max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
            <FileText size={20} className={colors.text} />
          </div>
          <div>
            <h3 className="text-lg font-bold">{title || `Cerrar ${entityLabel}`}</h3>
            <p className="text-xs text-text-muted">
              <span className="font-mono">{entityId}</span> → <span className={`${colors.text} font-semibold`}>{newStatus}</span>
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className={`${colors.bgLight} border ${colors.border} rounded-lg p-3 mb-5`}>
          <p className="text-xs text-text-secondary">
            Para cambiar el estado a <strong>{newStatus}</strong> es necesario completar el informe de resolución.
            Describa la solución aplicada y las acciones realizadas.
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-text-secondary font-medium mb-1.5 block">
              Descripción de la solución *
            </label>
            <textarea
              value={solucion}
              onChange={e => setSolucion(e.target.value)}
              placeholder="Describa detalladamente la solución aplicada, causa raíz identificada y resultado obtenido..."
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
              placeholder="Ej: Se reinició el equipo, se cambió el cable, se reconfiguró la antena, se reemplazó la ONU..."
              className="bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[70px] resize-y outline-none focus:border-accent-blue w-full"
            />
          </div>

          <Adjuntos value={adjuntos} onChange={setAdjuntos} max={10} label="Evidencia / Adjuntos" />

          {newStatus === 'Resuelto' && (
            <div className="bg-bg-secondary/50 border border-border rounded-lg p-4 mt-1">
              <p className="text-[10px] text-accent-blue uppercase tracking-wide font-semibold mb-3">Parámetros Técnicos Finales</p>
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className="text-[10px] text-text-secondary mb-1 block">Ping (ms)</label>
                  <input type="number" value={ping} onChange={e => setPing(e.target.value)} placeholder="0" className="w-full text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-text-secondary mb-1 block">Down (Mbps)</label>
                  <input type="number" value={download} onChange={e => setDownload(e.target.value)} placeholder="0" className="w-full text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-text-secondary mb-1 block">Up (Mbps)</label>
                  <input type="number" value={upload} onChange={e => setUpload(e.target.value)} placeholder="0" className="w-full text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-text-secondary mb-1 block">Pkt Loss (%)</label>
                  <input type="number" value={packetLoss} onChange={e => setPacketLoss(e.target.value)} placeholder="0" className="w-full text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-text-secondary mb-1 block">Jitter (ms)</label>
                  <input type="number" value={jitter} onChange={e => setJitter(e.target.value)} placeholder="0" className="w-full text-xs" />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-1">
            <button type="button" onClick={handleClose} className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm hover:bg-bg-card-hover transition-colors">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!solucion.trim()}
              className={`flex-1 py-2.5 rounded-lg ${colors.btnBg} border-none text-white cursor-pointer text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
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
