import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import StatusBadge from '../common/StatusBadge';
import Adjuntos from '../common/Adjuntos';
import {
  ArrowLeft, Ticket, Monitor, Wrench, ShoppingBag, AlertTriangle,
  Clock, ChevronDown, ChevronUp, CheckCircle2, FileText, MapPin,
  Gauge, Radio, Zap, Paperclip
} from 'lucide-react';

// ========== Helpers ==========
const formatMoney = (amount) => {
  const num = Number(amount);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const formatDate = (d) => {
  if (!d) return '—';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return d; }
};

const formatDateTime = (d) => {
  if (!d) return '—';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return d; }
};

// ========== Sub-components ==========

function Section({ title, children }) {
  return (
    <div className="bg-bg-card rounded-[14px] p-5 border border-border">
      <h3 className="text-[13px] font-semibold text-accent-blue mb-3.5 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div className="mb-2.5">
      <span className="text-[11px] text-text-muted block mb-0.5">{label}</span>
      <span className={`text-[13px] font-medium break-all ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

function TabButton({ active, icon: Icon, label, count, onClick, colorVar }) {
  const activeStyle = active ? { backgroundColor: `${colorVar}22`, color: colorVar } : {};
  const badgeStyle = active ? { backgroundColor: `${colorVar}30` } : {};
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer border-none whitespace-nowrap
        ${active ? 'shadow-sm' : 'bg-transparent text-text-muted hover:bg-bg-card-hover hover:text-text-primary'}`}
      style={activeStyle}
    >
      <Icon size={14} />
      {label}
      {count > 0 && (
        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center
          ${active ? '' : 'bg-bg-secondary'}`}
          style={badgeStyle}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function DetailField({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <span className="text-[10px] text-text-muted uppercase tracking-wide">{label}</span>
      <span className="text-[12px] text-text-primary font-medium block mt-0.5">{value}</span>
    </div>
  );
}

function DetailBlock({ label, value, color }) {
  if (!value) return null;
  return (
    <div className={`rounded-lg p-3 border ${color ? `bg-${color}/5 border-${color}/20` : 'bg-bg-secondary border-border/50'}`}>
      <p className={`text-[10px] uppercase tracking-wide font-semibold mb-1 ${color ? `text-${color}` : 'text-text-muted'}`}>{label}</p>
      <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function AttachmentSection({ label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="col-span-2 mt-1">
      <p className="text-[10px] text-text-muted mb-1.5 flex items-center gap-1">
        <Paperclip size={10} /> {label} ({items.length})
      </p>
      <Adjuntos value={items} readOnly max={10} />
    </div>
  );
}

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

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-text-muted">
      <Icon size={32} className="mb-3 opacity-30" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

// ========== Expandable History Card ==========

function HistoryCard({ color, icon: Icon, title, subtitle, status, date, children }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden transition-all hover:border-opacity-60"
      style={{ borderLeftWidth: '3px', borderLeftColor: color }}
    >
      <div className="flex items-center gap-3 p-4 cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-text-primary truncate">{title}</span>
            {status && <StatusBadge status={status} size="sm" />}
          </div>
          <span className="text-[11px] text-text-muted truncate block">{subtitle}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-text-muted font-mono">{formatDate(date)}</span>
          {expanded ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/50 animate-fade">
          <div className="mt-3 space-y-3">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// ========== Ticket Card Content ==========
function TicketExpandedContent({ t }) {
  return (
    <>
      {/* Detalles principales */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-2">
        <DetailField label="ID" value={t.id} />
        <DetailField label="Estado" value={t.estado} />
        <DetailField label="Prioridad" value={t.prioridad} />
        <DetailField label="Tipo Atención" value={t.tipoAtencion || t.tipo} />
        <DetailField label="Categoría" value={t.categoriaNombre} />
        <DetailField label="Subcategoría" value={t.subcategoriaNombre} />
        <DetailField label="Técnico Asignado" value={t.asignado || 'Sin asignar'} />
        <DetailField label="Fecha Creación" value={formatDateTime(t.fecha || t.createdAt)} />
        <DetailField label="Fecha Resolución" value={t.fechaResolucion ? formatDateTime(t.fechaResolucion) : null} />
      </div>

      {/* SLA */}
      {(t.slaTiempoLimite || t.slaImpacto) && (
        <div className="bg-accent-yellow/10 rounded-lg p-3 border border-accent-yellow/20">
          <p className="text-[10px] text-accent-yellow uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
            <Clock size={12} /> SLA
          </p>
          <div className="flex items-center gap-4 text-xs">
            {t.slaTiempoLimite && <div><span className="text-text-muted">Tiempo límite: </span><span className="text-accent-yellow font-semibold">{t.slaTiempoLimite}</span></div>}
            {t.slaImpacto && <div><span className="text-text-muted">Impacto: </span><span className="text-text-primary font-medium">{t.slaImpacto}</span></div>}
          </div>
        </div>
      )}

      {/* Descripción / Reporte */}
      {t.descripcion && (
        <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
          <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mb-1.5 flex items-center gap-1"><FileText size={12} /> Reporte</p>
          <p className="text-[12px] text-text-primary leading-relaxed whitespace-pre-wrap">{t.descripcion}</p>
        </div>
      )}

      {/* Adjuntos del reporte */}
      <AttachmentSection label="Evidencia del Reporte" items={t.adjuntos} />

      {/* Resolución */}
      {(t.solucion || t.accionesRealizadas || t.adjuntosResolucion?.length > 0) && (
        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
          <p className="text-[10px] text-green-400 uppercase tracking-wide mb-2 font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} /> Resolución
          </p>
          {t.solucion && (
            <div className="mb-2">
              <p className="text-[10px] text-text-muted mb-0.5">Solución:</p>
              <p className="text-[12px] text-text-secondary whitespace-pre-wrap">{t.solucion}</p>
            </div>
          )}
          {t.accionesRealizadas && (
            <div className="mb-2">
              <p className="text-[10px] text-text-muted mb-0.5">Acciones Realizadas:</p>
              <p className="text-[12px] text-text-secondary whitespace-pre-wrap">{t.accionesRealizadas}</p>
            </div>
          )}
          <AttachmentSection label="Evidencia de Resolución" items={t.adjuntosResolucion} />
        </div>
      )}

      {/* Reprogramación */}
      {(t.motivoReprogramacion || t.adjuntosReprogramacion?.length > 0) && (
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
          <p className="text-[10px] text-orange-400 uppercase tracking-wide mb-2 font-semibold flex items-center gap-1">
            <Clock size={12} /> Reprogramación
          </p>
          {t.motivoReprogramacion && (
            <div className="mb-2">
              <p className="text-[10px] text-text-muted mb-0.5">Motivo:</p>
              <p className="text-[12px] text-text-secondary whitespace-pre-wrap">{t.motivoReprogramacion}</p>
            </div>
          )}
          {t.fechaReprogramacion && <DetailField label="Nueva Fecha" value={formatDateTime(t.fechaReprogramacion)} />}
          <AttachmentSection label="Evidencia de Reprogramación" items={t.adjuntosReprogramacion} />
        </div>
      )}

      {/* Historial de cambios */}
      {t.historial && t.historial.length > 0 && (
        <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2 font-semibold">Historial de Cambios</p>
          <div className="space-y-1.5">
            {[...t.historial].reverse().map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className={`w-2 h-2 rounded-full shrink-0 ${h.estadoNuevo === 'Abierto' ? 'bg-red-400' :
                  h.estadoNuevo === 'En Proceso' ? 'bg-yellow-400' :
                    h.estadoNuevo.startsWith('Escalado') ? 'bg-orange-400' :
                      h.estadoNuevo === 'Resuelto' ? 'bg-green-400' : 'bg-gray-400'
                  }`}></span>
                <span className="text-text-primary font-medium">{h.estadoNuevo}</span>
                <span className="text-text-muted">—</span>
                <span className="text-text-muted truncate">{h.motivo || 'Sin motivo'}</span>
                <span className="text-text-muted font-mono text-[9px] ml-auto shrink-0">{formatDate(h.fecha)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ========== Soporte Remoto Card Content ==========
function SoporteExpandedContent({ s, ticket }) {
  const d = s.diagnosticos;
  const hasDiag = d && Object.values(d).some(v => v !== '' && v !== null && v !== undefined);
  const techStr = (s.tecnologia || '').toLowerCase();
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
    <>
      <div className="grid grid-cols-3 gap-x-4 gap-y-2">
        <DetailField label="ID" value={s.id} />
        <DetailField label="Estado" value={s.estado} />
        <DetailField label="Ticket Asociado" value={s.ticketId} />
        <DetailField label="Tipo" value={s.tipo} />
        <DetailField label="Técnico" value={s.tecnicoNombre || s.tecnico || ticket?.asignado} />
        <DetailField label="Fecha" value={formatDateTime(s.fecha)} />
        <DetailField label="Hora Inicio" value={s.horaInicio} />
        <DetailField label="Hora Fin" value={s.horaFin} />
        <DetailField label="IP" value={s.ip} />
        <DetailField label="Herramienta" value={s.herramienta} />
        <DetailField label="Duración" value={s.duracion ? `${s.duracion} min` : null} />
        <DetailField label="Tecnología" value={s.tecnologia} />
      </div>

      <DetailBlock label="Descripción" value={s.descripcion} />
      <DetailBlock label="Resultado / Observaciones" value={s.resultado || s.observaciones} color="green-400" />

      {(s.solucion || s.accionesRealizadas || s.adjuntosResolucion?.length > 0) && (
        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
          <p className="text-[10px] text-green-400 uppercase tracking-wide mb-2 font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} /> Resolución
          </p>
          {s.solucion && <div className="mb-2"><p className="text-[10px] text-text-muted mb-0.5">Solución:</p><p className="text-[12px] text-text-secondary whitespace-pre-wrap">{s.solucion}</p></div>}
          {s.accionesRealizadas && <div className="mb-2"><p className="text-[10px] text-text-muted mb-0.5">Acciones:</p><p className="text-[12px] text-text-secondary whitespace-pre-wrap">{s.accionesRealizadas}</p></div>}
          <AttachmentSection label="Evidencia de Resolución" items={s.adjuntosResolucion} />
        </div>
      )}

      {/* Diagnósticos */}
      {hasDiag && (
        <div className="border-t border-border pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Gauge size={14} className="text-accent-cyan" />
            <h4 className="text-[11px] font-bold text-text-primary uppercase">Diagnóstico de Red</h4>
          </div>
          {(d.ping || d.download || d.upload || d.packetLoss || d.jitter) && (
            <div className="mb-3">
              <p className="text-[9px] text-text-muted uppercase tracking-wide font-semibold mb-1.5">Parámetros generales</p>
              <div className="grid grid-cols-3 gap-1.5">
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
              <div className="grid grid-cols-3 gap-1.5">
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
              <div className="grid grid-cols-3 gap-1.5">
                <DiagValue label="Pot. Rx" value={d.potenciaRx} unit="dBm" warn={warns.potenciaRx} />
                <DiagValue label="Pot. Tx" value={d.potenciaTx} unit="dBm" />
                <DiagValue label="Atenuación" value={d.atenuacion} unit="dB" warn={warns.atenuacion} />
                <DiagValue label="Puerto OLT" value={d.puertoOLT} />
                <DiagValue label="Estado ONU" value={d.estadoONU} warn={warns.estadoONU} />
              </div>
            </div>
          )}
        </div>
      )}

      <AttachmentSection label="Evidencia Inicial" items={s.adjuntos} />
    </>
  );
}

// ========== Visita Técnica Card Content ==========
function VisitaExpandedContent({ v, ticket, clientDir }) {
  const d = v.diagnosticos;
  const hasDiag = d && Object.values(d).some(val => val !== '' && val !== null && val !== undefined);
  const techStr = (v.tecnologia || '').toLowerCase();
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
    <>
      <div className="grid grid-cols-3 gap-x-4 gap-y-2">
        <DetailField label="ID" value={v.id} />
        <DetailField label="Estado" value={v.estado} />
        <DetailField label="Ticket Asociado" value={v.ticketId} />
        <DetailField label="Tipo" value={v.tipo} />
        <DetailField label="Prioridad" value={v.prioridad} />
        <DetailField label="Técnico" value={v.tecnicoNombre || v.tecnico || ticket?.asignado} />
        <DetailField label="Fecha" value={formatDateTime(v.fecha)} />
        <DetailField label="Hora Inicio" value={v.horaInicio} />
        <DetailField label="Hora Fin" value={v.horaFin} />
      </div>

      {(v.direccion || clientDir) && (
        <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
          <p className="text-[10px] text-text-muted uppercase mb-0.5">Dirección</p>
          <p className="text-[12px] font-medium flex items-center gap-1"><MapPin size={12} className="text-text-muted" />{v.direccion || clientDir}</p>
        </div>
      )}

      <DetailBlock label="Descripción" value={v.descripcion} />
      <DetailBlock label="Resultado / Observaciones" value={v.resultado || v.observaciones} color="green-400" />

      {(v.solucion || v.accionesRealizadas || v.adjuntosResolucion?.length > 0) && (
        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
          <p className="text-[10px] text-green-400 uppercase tracking-wide mb-2 font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} /> Resolución
          </p>
          {v.solucion && <div className="mb-2"><p className="text-[10px] text-text-muted mb-0.5">Solución:</p><p className="text-[12px] text-text-secondary whitespace-pre-wrap">{v.solucion}</p></div>}
          {v.accionesRealizadas && <div className="mb-2"><p className="text-[10px] text-text-muted mb-0.5">Acciones:</p><p className="text-[12px] text-text-secondary whitespace-pre-wrap">{v.accionesRealizadas}</p></div>}
          <AttachmentSection label="Evidencia de Resolución" items={v.adjuntosResolucion} />
        </div>
      )}

      {/* Diagnósticos */}
      {hasDiag && (
        <div className="border-t border-border pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Gauge size={14} className="text-accent-cyan" />
            <h4 className="text-[11px] font-bold text-text-primary uppercase">Diagnóstico de Red</h4>
          </div>
          {(d.ping || d.download || d.upload) && (
            <div className="mb-3">
              <div className="grid grid-cols-3 gap-1.5">
                <DiagValue label="Ping" value={d.ping} unit="ms" warn={warns.ping} />
                <DiagValue label="Download" value={d.download} unit="Mbps" warn={warns.download} />
                <DiagValue label="Upload" value={d.upload} unit="Mbps" warn={warns.upload} />
                <DiagValue label="Packet Loss" value={d.packetLoss} unit="%" warn={warns.packetLoss} />
                <DiagValue label="Jitter" value={d.jitter} unit="ms" warn={warns.jitter} />
              </div>
            </div>
          )}
          {showRadio && (d.senalRecibida || d.ccq) && (
            <div className="mb-3">
              <p className="text-[9px] text-accent-purple uppercase font-semibold mb-1.5 flex items-center gap-1"><Radio size={10} /> Radio</p>
              <div className="grid grid-cols-3 gap-1.5">
                <DiagValue label="Señal" value={d.senalRecibida} unit="dBm" warn={warns.senalRecibida} />
                <DiagValue label="CCQ" value={d.ccq} unit="%" warn={warns.ccq} />
                <DiagValue label="Frecuencia" value={d.frecuencia} unit="GHz" />
              </div>
            </div>
          )}
          {showFibra && (d.potenciaRx || d.atenuacion) && (
            <div className="mb-3">
              <p className="text-[9px] text-green-400 uppercase font-semibold mb-1.5 flex items-center gap-1"><Zap size={10} /> Fibra</p>
              <div className="grid grid-cols-3 gap-1.5">
                <DiagValue label="Pot. Rx" value={d.potenciaRx} unit="dBm" warn={warns.potenciaRx} />
                <DiagValue label="Atenuación" value={d.atenuacion} unit="dB" warn={warns.atenuacion} />
                <DiagValue label="Estado ONU" value={d.estadoONU} warn={warns.estadoONU} />
              </div>
            </div>
          )}
        </div>
      )}

      <AttachmentSection label="Evidencia Inicial" items={v.adjuntos} />
    </>
  );
}

// ========== PostVenta Card Content ==========
function PostVentaExpandedContent({ p }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-x-4 gap-y-2">
        <DetailField label="ID" value={p.id} />
        <DetailField label="Estado" value={p.estado} />
        <DetailField label="Tipo Servicio" value={p.tipoServicio} />
        <DetailField label="Técnico" value={p.tecnicoNombre || 'Sin asignar'} />
        <DetailField label="Fecha Creación" value={formatDate(p.fecha)} />
        <DetailField label="Fecha Ejecución" value={formatDate(p.fechaEjecucion)} />
        <DetailField label="Costo Estimado" value={p.costoEstimado ? `S/. ${formatMoney(p.costoEstimado)}` : null} />
        <DetailField label="Costo Real" value={p.costoReal ? `S/. ${formatMoney(p.costoReal)}` : null} />
      </div>

      <DetailBlock label="Descripción" value={p.descripcion} />
      <DetailBlock label="Observaciones" value={p.observaciones} />

      <AttachmentSection label="Evidencia" items={p.adjuntos} />
    </>
  );
}

// ========== Avería Card Content ==========
function AveriaExpandedContent({ a }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-x-4 gap-y-2">
        <DetailField label="ID" value={a.id} />
        <DetailField label="Estado" value={a.estado} />
        <DetailField label="Ticket Asociado" value={a.ticketId} />
        <DetailField label="Tipo" value={a.tipo} />
        <DetailField label="Zona Afectada" value={a.zona} />
        <DetailField label="Técnico" value={a.tecnicoNombre || a.tecnico} />
        <DetailField label="Fecha Reporte" value={formatDateTime(a.fecha)} />
        <DetailField label="Fecha Resolución" value={a.fechaResolucion ? formatDateTime(a.fechaResolucion) : null} />
        <DetailField label="Clientes Afectados" value={a.clientesAfectados} />
      </div>

      <DetailBlock label="Descripción" value={a.descripcion} />
      <DetailBlock label="Solución" value={a.solucion} color="green-400" />
      <DetailBlock label="Observaciones" value={a.observaciones} />

      <AttachmentSection label="Evidencia" items={a.adjuntos} />
      <AttachmentSection label="Evidencia de Resolución" items={a.adjuntosResolucion} />
    </>
  );
}

// ==================== MAIN COMPONENT ====================

export default function ClienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const clients = useStore(s => s.clients);
  const tickets = useStore(s => s.tickets);
  const visitas = useStore(s => s.visitas);
  const sesionesRemoto = useStore(s => s.sesionesRemoto);
  const postVenta = useStore(s => s.postVenta);
  const averias = useStore(s => s.averias);

  const [activeTab, setActiveTab] = useState('tickets');

  const c = clients.find(client => client.id === id);

  useEffect(() => {
    if (!c && clients.length > 0) {
      navigate('/clientes');
    }
  }, [c, clients, navigate]);

  // --- Data filtered by client ---
  const clientTickets = useMemo(() =>
    tickets.filter(t => t.clienteId === id).sort((a, b) => new Date(b.fecha || b.createdAt || 0) - new Date(a.fecha || a.createdAt || 0)),
    [tickets, id]
  );

  const clientTicketIds = useMemo(() => new Set(clientTickets.map(t => t.id)), [clientTickets]);

  const clientVisitas = useMemo(() =>
    visitas.filter(v => clientTicketIds.has(v.ticketId)).sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0)),
    [visitas, clientTicketIds]
  );

  const clientSesiones = useMemo(() =>
    sesionesRemoto.filter(s => clientTicketIds.has(s.ticketId)).sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0)),
    [sesionesRemoto, clientTicketIds]
  );

  const clientPostVenta = useMemo(() =>
    postVenta.filter(p => p.clienteId === id).sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0)),
    [postVenta, id]
  );

  const clientAverias = useMemo(() =>
    averias.filter(a => clientTicketIds.has(a.ticketId)).sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0)),
    [averias, clientTicketIds]
  );

  if (!c) return <div className="p-8 text-center text-text-muted">Cargando cliente o no encontrado...</div>;

  const tabs = [
    { key: 'tickets', label: 'Tickets', icon: Ticket, count: clientTickets.length, color: '#3b82f6' },
    { key: 'soporte', label: 'Soporte Remoto', icon: Monitor, count: clientSesiones.length, color: '#06b6d4' },
    { key: 'visitas', label: 'Visitas Técnicas', icon: Wrench, count: clientVisitas.length, color: '#f97316' },
    { key: 'postventa', label: 'Post-Venta', icon: ShoppingBag, count: clientPostVenta.length, color: '#a855f7' },
    { key: 'averias', label: 'Averías', icon: AlertTriangle, count: clientAverias.length, color: '#ef4444' },
  ];

  const totalHistorial = clientTickets.length + clientSesiones.length + clientVisitas.length + clientPostVenta.length + clientAverias.length;

  return (
    <div className="animate-fade p-6 px-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/clientes')}
          className="bg-bg-card border border-border rounded-[10px] py-2 px-4 text-text-primary cursor-pointer text-[13px] font-medium hover:border-accent-blue transition-colors flex items-center gap-2">
          <ArrowLeft size={14} /> Volver
        </button>
        <div className="flex-1">
          <h1 className="text-[22px] font-bold">{c.nombre}</h1>
          <div className="flex gap-2 mt-1.5">
            <StatusBadge status={c.estado_cuenta} size="md" />
            <StatusBadge status={c.status} size="md" />
            <StatusBadge status={c.tecnologia} size="md" />
          </div>
        </div>
      </div>

      {/* Grid de Información */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <Section title="Datos Personales">
          <Field label="ID Cliente" value={c.id} mono />
          <Field label="Código" value={c.codigo} mono />
          <Field label="DNI" value={c.dni} mono />
          <Field label="Móvil 1" value={c.movil_1} mono />
          {c.movil_2 && <Field label="Móvil 2" value={c.movil_2} mono />}
          <Field label="Email" value={c.email || 'No registrado'} />
          <Field label="Zona" value={c.zona} />
        </Section>

        <Section title="Ubicación">
          <Field label="Dirección Principal" value={c.direccion} />
          <Field label="Dirección Servicio" value={c.direccion_servicio} />
          <Field label="Tipo Estrato" value={c.tipo_estrato} />
        </Section>

        <Section title="Servicio Contratado">
          <Field label="Plan" value={c.plan} />
          <Field label="Precio" value={`S/. ${formatMoney(c.precio)}`} mono />
          <Field label="Tecnología" value={c.tecnologia} />
          <Field label="Nodo / Router" value={c.nodo_router} />
          <Field label="Fecha Instalación" value={c.fecha_instalacion} />
          <Field label="Estado Servicio" value={c.estado_servicio} />
        </Section>

        <Section title="Conexión Técnica">
          <Field label="IP Asignada" value={c.ip} mono />
          <Field label="IP Receptor" value={c.ip_receptor} mono />
          <Field label="MAC Address" value={c.mac} mono />
          <Field label="User PPP" value={c.user_ppp} mono />
        </Section>

        <Section title="Facturación">
          <Field label="Día de Pago" value={c.dia_pago} />
          <Field label="Próximo Pago" value={c.proximo_pago} />
          <Field label="Último Pago" value={c.ultimo_pago} />
          <Field label="Deuda" value={c.deuda_monto > 0 ? `${c.deuda_meses} mes(es) — S/. ${formatMoney(c.deuda_monto)}` : 'Sin deuda'} />
          <Field label="Saldo" value={c.saldo} mono />
        </Section>

        <Section title="Notas Técnicas / Servicios TV">
          <Field label="Notas del Equipo" value={c.notas_tecnicas} />
          {c.servicios_adicionales?.length > 0 ? (
            <div>
              <span className="text-[11px] text-text-muted block mb-1.5">Servicios Adicionales</span>
              {c.servicios_adicionales?.map((s, i) => (
                <div key={i} className="flex justify-between py-1 px-2.5 bg-bg-secondary rounded-md mb-1 text-xs">
                  <span>{s.tipo}</span>
                  <span className="font-mono text-accent-cyan">S/. {formatMoney(s.precio)}</span>
                </div>
              ))}
            </div>
          ) : (
            <Field label="Servicios Adicionales" value="Ninguno" />
          )}
        </Section>
      </div>

      {/* ====== HISTORIAL DEL CLIENTE ====== */}
      <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-text-primary flex items-center gap-2">
                <Clock size={18} className="text-accent-blue" />
                Historial del Cliente
              </h2>
              <p className="text-[12px] text-text-muted mt-1">{totalHistorial} registros en total</p>
            </div>
          </div>
          <div className="flex gap-1.5 mt-4 overflow-x-auto pb-1">
            {tabs.map(tab => (
              <TabButton
                key={tab.key}
                active={activeTab === tab.key}
                icon={tab.icon}
                label={tab.label}
                count={tab.count}
                colorVar={tab.color}
                onClick={() => setActiveTab(tab.key)}
              />
            ))}
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">

            {/* TICKETS */}
            {activeTab === 'tickets' && (
              clientTickets.length === 0
                ? <EmptyState icon={Ticket} text="No hay tickets registrados para este cliente" />
                : clientTickets.map(t => (
                  <HistoryCard key={t.id} color="#3b82f6" icon={Ticket}
                    title={`${t.id} — ${t.categoriaNombre || t.tipo || 'Ticket'}`}
                    subtitle={t.descripcion?.substring(0, 100) || 'Sin descripción'}
                    status={t.estado} date={t.fecha || t.createdAt}
                  >
                    <TicketExpandedContent t={t} />
                  </HistoryCard>
                ))
            )}

            {/* SOPORTE REMOTO */}
            {activeTab === 'soporte' && (
              clientSesiones.length === 0
                ? <EmptyState icon={Monitor} text="No hay sesiones de soporte remoto registradas" />
                : clientSesiones.map(s => {
                  const ticket = tickets.find(t => t.id === s.ticketId);
                  return (
                    <HistoryCard key={s.id} color="#06b6d4" icon={Monitor}
                      title={`${s.id} — Soporte Remoto`}
                      subtitle={`Ticket: ${s.ticketId} • ${s.descripcion?.substring(0, 80) || ''}`}
                      status={s.estado} date={s.fecha}
                    >
                      <SoporteExpandedContent s={s} ticket={ticket} />
                    </HistoryCard>
                  );
                })
            )}

            {/* VISITAS TÉCNICAS */}
            {activeTab === 'visitas' && (
              clientVisitas.length === 0
                ? <EmptyState icon={Wrench} text="No hay visitas técnicas registradas" />
                : clientVisitas.map(v => {
                  const ticket = tickets.find(t => t.id === v.ticketId);
                  return (
                    <HistoryCard key={v.id} color="#f97316" icon={Wrench}
                      title={`${v.id} — Visita Técnica`}
                      subtitle={`Ticket: ${v.ticketId} • ${v.descripcion?.substring(0, 80) || ''}`}
                      status={v.estado} date={v.fecha}
                    >
                      <VisitaExpandedContent v={v} ticket={ticket} clientDir={c.direccion} />
                    </HistoryCard>
                  );
                })
            )}

            {/* POST-VENTA */}
            {activeTab === 'postventa' && (
              clientPostVenta.length === 0
                ? <EmptyState icon={ShoppingBag} text="No hay registros de post-venta" />
                : clientPostVenta.map(p => (
                  <HistoryCard key={p.id} color="#a855f7" icon={ShoppingBag}
                    title={`${p.id} — ${p.tipoServicio || 'Post-Venta'}`}
                    subtitle={p.descripcion?.substring(0, 100) || 'Sin descripción'}
                    status={p.estado} date={p.fecha}
                  >
                    <PostVentaExpandedContent p={p} />
                  </HistoryCard>
                ))
            )}

            {/* AVERÍAS */}
            {activeTab === 'averias' && (
              clientAverias.length === 0
                ? <EmptyState icon={AlertTriangle} text="No hay averías registradas" />
                : clientAverias.map(a => (
                  <HistoryCard key={a.id} color="#ef4444" icon={AlertTriangle}
                    title={`${a.id} — ${a.tipo || 'Avería'}`}
                    subtitle={a.descripcion?.substring(0, 100) || 'Sin descripción'}
                    status={a.estado} date={a.fecha}
                  >
                    <AveriaExpandedContent a={a} />
                  </HistoryCard>
                ))
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
