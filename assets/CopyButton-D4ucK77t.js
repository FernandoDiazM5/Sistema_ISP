import{c as d,r as m,j as n}from"./index-BUoWx0aW.js";const l=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],b=d("check",l);const u=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]],C=d("copy",u);function E(o,e){return`📌 INSTALACIÓN ${(o.tecnologia||e?.tecnologia||"FIBRA OPTICA").toUpperCase()}

👤 DATOS DEL CLIENTE
▶️ Cliente: ${o.clienteNombre||e?.nombre||"—"}
▶️ DNI: ${e?.dni||"SOLICITAR"}
▶️ Dirección: ${o.direccion||e?.direccion||"—"}
▶️ Contacto: ${o.contacto||e?.movil_1||"—"}
--------------------------------
💰 DETALLE DEL PLAN
▶️ Plan: ${o.plan||e?.plan||"—"}
▶️ Costo Plan: S/ ${o.precio||e?.precio||"0.00"}
▶️ Adelanto: ${o.adelanto||"NO"}
--------------------------------
🛠 INFORMACIÓN TÉCNICA
▶️ Fecha Instalación: ${o.fecha||"—"}
▶️ Hora: ${o.hora||o.horaInicio||"—"}
▶️ Estado: ${o.estado||"—"}
▶️ Equipos: ${o.equipos||"—"}
▶️ Cuadrilla: ${o.tecnicoNombre||o.cuadrilla||"—"}
📝 Observaciones: ${o.observaciones||o.descripcion||""}`}function T(o,e){const c=o.estado==="Pendiente"?"⏳":o.estado==="En Proceso"?"🔄":o.estado==="Resuelta"?"✅":"";return`👨‍🔧 *REPORTE DE AVERÍA* ${o.id}
────────────────────────
🆔 *Código:* ${o.id}
👤 *Cliente:* ${o.clienteNombre||e?.nombre||"—"}
📱 *Teléfono:* ${o.contacto||e?.movil_1||"—"}
📍 *Dirección:* ${o.direccion||e?.direccion||"—"}
────────────────────────
🚨 *Problema:* ${o.descripcion||o.problema||"—"}
🔧 *Diagnóstico:* ${o.diagnostico||"—"}
📅 *Cita:* ${o.fechaCita||o.fecha||"—"} ${o.horaCita?"🕒 "+o.horaCita:""}
📊 *Estado:* ${c} ${o.estado||"—"}
────────────────────────
📝 *Nota:* ${o.nota||o.observaciones||""}`}function g(o,e){const c=o.estado==="Abierto"?"🔴":o.estado==="En Proceso"?"🟡":o.estado==="Resuelto"?"🟢":"⚪";return`🎫 *TICKET DE SOPORTE* ${o.id}
────────────────────────
🆔 *Código:* ${o.id}
👤 *Cliente:* ${o.clienteNombre||e?.nombre||"—"}
📱 *Teléfono:* ${o.contacto||e?.movil_1||"—"}
📍 *Dirección:* ${o.direccion||e?.direccion||"—"}
────────────────────────
⚠️ *Motivo:* ${o.descripcion||"—"}
📊 *Prioridad:* ${o.prioridad||"—"}
📊 *Estado:* ${c} ${o.estado||"—"}
🏷️ *Categoría:* ${o.categoria||"—"}
👨‍🔧 *Asignado:* ${o.tecnicoNombre||o.asignado||"Sin asignar"}
────────────────────────
📝 *Nota:* ${o.observaciones||o.nota||""}`}function N(o,e){return`🎧 TICKET POST-VENTA
────────────────────────
👤 Cliente: ${o.clienteNombre||e?.nombre||"—"}
📱 Contacto: ${o.contacto||e?.movil_1||"—"}
📍 Dirección: ${o.direccion||e?.direccion||"—"}
────────────────────────
⚠️ Motivo: ${o.motivo||o.descripcion||"—"}
📊 Estado: ${o.estado||"—"}
🕒 Fecha: ${o.fecha||"—"}
👨‍🔧 Asignado: ${o.tecnicoNombre||o.asignado||"Sin asignar"}
────────────────────────
📝 Observaciones: ${o.observaciones||""}`}function I(o,e){return`🔧 *VISITA TÉCNICA* ${o.id}
────────────────────────
👤 *Cliente:* ${o.clienteNombre||e?.nombre||"—"}
📱 *Contacto:* ${e?.movil_1||"—"}
📍 *Dirección:* ${o.direccion||e?.direccion||"—"}
────────────────────────
🛠 *Tipo:* ${o.tipo||"—"}
📊 *Prioridad:* ${o.prioridad||"—"}
📅 *Fecha:* ${o.fecha||"—"} 🕒 ${o.horaInicio||"—"}${o.horaFin?" - "+o.horaFin:""}
👨‍🔧 *Técnico:* ${o.tecnicoNombre||"—"}
📊 *Estado:* ${o.estado||"—"}
${o.ticketId?"🎫 *Ticket:* "+o.ticketId:""}
────────────────────────
📝 *Descripción:* ${o.descripcion||""}`}function y(o,e){return`💻 *SOPORTE REMOTO* ${o.id}
────────────────────────
👤 *Cliente:* ${o.clienteNombre||e?.nombre||"—"}
📱 *Contacto:* ${e?.movil_1||"—"}
📍 *Dirección:* ${o.direccion||e?.direccion||"—"}
────────────────────────
🔧 *Tipo:* ${o.tipo||"—"}
🌐 *IP:* ${o.ip||"—"}
👨‍🔧 *Técnico:* ${o.tecnico||"—"}
📊 *Estado:* ${o.estado||"—"}
⏱ *Duración:* ${o.duracion||"—"}
${o.ticketId?"🎫 *Ticket:* "+o.ticketId:""}
────────────────────────
📝 *Resultado:* ${o.resultado||""}`}function A(o){return`📦 *EQUIPO* ${o.id}
────────────────────────
🏷️ *Tipo:* ${o.tipo||"—"}
📋 *Marca:* ${o.marca||"—"}
📋 *Modelo:* ${o.modelo||"—"}
🔢 *Serie:* ${o.serie||"—"}
📊 *Estado:* ${o.estado||"—"}
📍 *Ubicación:* ${o.ubicacion||"—"}
${o.clienteNombre?"👤 *Asignado a:* "+o.clienteNombre:""}
────────────────────────
📝 *Nota:* ${o.observaciones||o.nota||""}`}async function h(o){try{return await navigator.clipboard.writeText(o),!0}catch{const e=document.createElement("textarea");e.value=o,e.style.position="fixed",e.style.opacity="0",document.body.appendChild(e),e.select();try{return document.execCommand("copy"),document.body.removeChild(e),!0}catch{return document.body.removeChild(e),!1}}}function x({getTextFn:o,title:e="Copiar para WhatsApp",size:c="sm"}){const[r,t]=m.useState(!1),i=async $=>{$.stopPropagation();const s=o();await h(s)&&(t(!0),setTimeout(()=>t(!1),2e3))},a=c==="sm"?13:16;return n.jsx("button",{onClick:i,title:r?"¡Copiado!":e,className:`inline-flex items-center justify-center rounded-lg border transition-all cursor-pointer ${r?"bg-green-500/20 border-green-500/30 text-green-400":"bg-bg-secondary border-border text-text-muted hover:text-accent-blue hover:border-accent-blue/50 hover:bg-accent-blue/10"} ${c==="sm"?"w-7 h-7":"w-8 h-8"}`,children:r?n.jsx(b,{size:a}):n.jsx(C,{size:a})})}export{b as C,x as a,T as b,y as c,A as d,C as e,g as f,I as g,E as h,N as i};
