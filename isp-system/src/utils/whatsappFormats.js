/**
 * Formatos WhatsApp para copiar al portapapeles
 * Cada función genera un texto formateado listo para enviar por WhatsApp
 */

export function formatInstalacion(inst, client) {
  const tecnologia = inst.tecnologia || client?.tecnologia || 'FIBRA OPTICA';
  return `📌 INSTALACIÓN ${tecnologia.toUpperCase()}

👤 DATOS DEL CLIENTE
▶️ Cliente: ${inst.clienteNombre || client?.nombre || '—'}
▶️ DNI: ${client?.dni || 'SOLICITAR'}
▶️ Dirección: ${inst.direccion || client?.direccion || '—'}
▶️ Contacto: ${inst.contacto || client?.movil_1 || '—'}
--------------------------------
💰 DETALLE DEL PLAN
▶️ Plan: ${inst.plan || client?.plan || '—'}
▶️ Costo Plan: S/ ${inst.precio || client?.precio || '0.00'}
▶️ Adelanto: ${inst.adelanto || 'NO'}
--------------------------------
🛠 INFORMACIÓN TÉCNICA
▶️ Fecha Instalación: ${inst.fecha || '—'}
▶️ Hora: ${inst.hora || inst.horaInicio || '—'}
▶️ Estado: ${inst.estado || '—'}
▶️ Equipos: ${inst.equipos || '—'}
▶️ Cuadrilla: ${inst.tecnicoNombre || inst.cuadrilla || '—'}
📝 Observaciones: ${inst.observaciones || inst.descripcion || ''}`;
}

export function formatAveria(averia, client) {
  const estadoEmoji = averia.estado === 'Pendiente' ? '⏳' : averia.estado === 'En Proceso' ? '🔄' : averia.estado === 'Resuelta' ? '✅' : '';
  return `👨‍🔧 *REPORTE DE AVERÍA* ${averia.id}
────────────────────────
🆔 *Código:* ${averia.id}
👤 *Cliente:* ${averia.clienteNombre || client?.nombre || '—'}
📱 *Teléfono:* ${averia.contacto || client?.movil_1 || '—'}
📍 *Dirección:* ${averia.direccion || client?.direccion || '—'}
────────────────────────
🚨 *Problema:* ${averia.descripcion || averia.problema || '—'}
🔧 *Diagnóstico:* ${averia.diagnostico || '—'}
📅 *Cita:* ${averia.fechaCita || averia.fecha || '—'} ${averia.horaCita ? '🕒 ' + averia.horaCita : ''}
📊 *Estado:* ${estadoEmoji} ${averia.estado || '—'}
────────────────────────
📝 *Nota:* ${averia.nota || averia.observaciones || ''}`;
}

export function formatTicket(ticket, client) {
  const estadoEmoji = ticket.estado === 'Abierto' ? '🔴' : ticket.estado === 'En Proceso' ? '🟡' : ticket.estado === 'Resuelto' ? '🟢' : '⚪';
  return `🎫 *TICKET DE SOPORTE* ${ticket.id}
────────────────────────
🆔 *Código:* ${ticket.id}
👤 *Cliente:* ${ticket.clienteNombre || client?.nombre || '—'}
📱 *Teléfono:* ${ticket.contacto || client?.movil_1 || '—'}
📍 *Dirección:* ${ticket.direccion || client?.direccion || '—'}
────────────────────────
⚠️ *Motivo:* ${ticket.descripcion || '—'}
📊 *Prioridad:* ${ticket.prioridad || '—'}
📊 *Estado:* ${estadoEmoji} ${ticket.estado || '—'}
🏷️ *Categoría:* ${ticket.categoria || '—'}
👨‍🔧 *Asignado:* ${ticket.tecnicoNombre || ticket.asignado || 'Sin asignar'}
────────────────────────
📝 *Nota:* ${ticket.observaciones || ticket.nota || ''}`;
}

export function formatPostVenta(pv, client) {
  return `🎧 TICKET POST-VENTA
────────────────────────
👤 Cliente: ${pv.clienteNombre || client?.nombre || '—'}
📱 Contacto: ${pv.contacto || client?.movil_1 || '—'}
📍 Dirección: ${pv.direccion || client?.direccion || '—'}
────────────────────────
⚠️ Motivo: ${pv.motivo || pv.descripcion || '—'}
📊 Estado: ${pv.estado || '—'}
🕒 Fecha: ${pv.fecha || '—'}
👨‍🔧 Asignado: ${pv.tecnicoNombre || pv.asignado || 'Sin asignar'}
────────────────────────
📝 Observaciones: ${pv.observaciones || ''}`;
}

export function formatVisitaTecnica(visita, client) {
  return `🔧 *VISITA TÉCNICA* ${visita.id}
────────────────────────
👤 *Cliente:* ${visita.clienteNombre || client?.nombre || '—'}
📱 *Contacto:* ${client?.movil_1 || '—'}
📍 *Dirección:* ${visita.direccion || client?.direccion || '—'}
────────────────────────
🛠 *Tipo:* ${visita.tipo || '—'}
📊 *Prioridad:* ${visita.prioridad || '—'}
📅 *Fecha:* ${visita.fecha || '—'} 🕒 ${visita.horaInicio || '—'}${visita.horaFin ? ' - ' + visita.horaFin : ''}
👨‍🔧 *Técnico:* ${visita.tecnicoNombre || '—'}
📊 *Estado:* ${visita.estado || '—'}
${visita.ticketId ? '🎫 *Ticket:* ' + visita.ticketId : ''}
────────────────────────
📝 *Descripción:* ${visita.descripcion || ''}`;
}

export function formatSoporteRemoto(sesion, client) {
  return `💻 *SOPORTE REMOTO* ${sesion.id}
────────────────────────
👤 *Cliente:* ${sesion.clienteNombre || client?.nombre || '—'}
📱 *Contacto:* ${client?.movil_1 || '—'}
📍 *Dirección:* ${sesion.direccion || client?.direccion || '—'}
────────────────────────
🔧 *Tipo:* ${sesion.tipo || '—'}
🌐 *IP:* ${sesion.ip || '—'}
👨‍🔧 *Técnico:* ${sesion.tecnico || '—'}
📊 *Estado:* ${sesion.estado || '—'}
⏱ *Duración:* ${sesion.duracion || '—'}
${sesion.ticketId ? '🎫 *Ticket:* ' + sesion.ticketId : ''}
────────────────────────
📝 *Resultado:* ${sesion.resultado || ''}`;
}

export function formatEquipo(equipo) {
  return `📦 *EQUIPO* ${equipo.id}
────────────────────────
🏷️ *Tipo:* ${equipo.tipo || '—'}
📋 *Marca:* ${equipo.marca || '—'}
📋 *Modelo:* ${equipo.modelo || '—'}
🔢 *Serie:* ${equipo.serie || '—'}
📊 *Estado:* ${equipo.estado || '—'}
📍 *Ubicación:* ${equipo.ubicacion || '—'}
${equipo.clienteNombre ? '👤 *Asignado a:* ' + equipo.clienteNombre : ''}
────────────────────────
📝 *Nota:* ${equipo.observaciones || equipo.nota || ''}`;
}

export function formatCliente(client) {
  return `👤 *CLIENTE* ${client.id}
────────────────────────
▶️ *Nombre:* ${client.nombre || '—'}
▶️ *DNI:* ${client.dni || '—'}
📱 *Teléfono:* ${client.movil_1 || '—'}
📍 *Dirección:* ${client.direccion || '—'}
────────────────────────
📶 *Tecnología:* ${client.tecnologia || '—'}
💰 *Plan:* ${client.plan || '—'}
💵 *Precio:* S/ ${client.precio || '0.00'}
📊 *Estado:* ${client.estado_cuenta || '—'}
🌐 *IP:* ${client.ip || '—'}
🔌 *Nodo:* ${client.nodo_router || '—'}
📍 *Zona:* ${client.zona || '—'}`;
}

/**
 * Copia texto al portapapeles y retorna true/false
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}
