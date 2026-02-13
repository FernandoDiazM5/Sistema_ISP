import StatusBadge from '../common/StatusBadge';

// Helper seguro para moneda (evita crash si el valor es string o null)
const formatMoney = (amount) => {
  const num = Number(amount);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

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

export default function ClienteDetalle({ cliente: c, onBack }) {
  return (
    <div className="animate-fade p-6 px-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack}
          className="bg-bg-card border border-border rounded-[10px] py-2 px-4 text-text-primary cursor-pointer text-[13px] font-medium hover:border-accent-blue transition-colors">
          ← Volver
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

      {/* Grid Responsivo: 1 col móvil, 2 tablet, 3 desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
          {c.servicios_adicionales.length > 0 ? (
            <div>
              <span className="text-[11px] text-text-muted block mb-1.5">Servicios Adicionales</span>
              {c.servicios_adicionales.map((s, i) => (
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
    </div>
  );
}
