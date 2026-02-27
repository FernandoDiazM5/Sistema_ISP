/**
 * Validadores de datos para el ISP Sistema.
 * Se aplican antes de persistir datos en el store.
 */

const VALID_TICKET_ESTADOS = [
    'EST-01', 'EST-02', 'EST-03', 'EST-04', 'EST-05', 'EST-06',
    'Abierto', 'En Proceso', 'Escalado', 'Resuelto', 'Cerrado', 'Cancelado',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s,+\-().]{6,30}$/;

export function validateTicket(ticket) {
    const errors = [];
    if (!ticket.clienteId) errors.push('clienteId es requerido');
    if (!ticket.descripcion || ticket.descripcion.trim().length < 3) errors.push('descripcion debe tener al menos 3 caracteres');
    if (!ticket.tipo) errors.push('tipo es requerido');
    if (!ticket.estado) errors.push('estado es requerido');
    if (ticket.estado && !VALID_TICKET_ESTADOS.includes(ticket.estado)) errors.push(`estado "${ticket.estado}" no es un valor válido`);
    if (ticket.prioridad !== undefined && typeof ticket.prioridad !== 'string') errors.push('prioridad debe ser un string');
    return { valid: errors.length === 0, errors };
}

export function validateEquipo(equipo) {
    const errors = [];
    if (!equipo.serial || equipo.serial.trim().length < 2) errors.push('serial es requerido');
    if (!equipo.tipo) errors.push('tipo es requerido');
    if (!equipo.marca) errors.push('marca es requerido');
    if (!equipo.modelo) errors.push('modelo es requerido');
    return { valid: errors.length === 0, errors };
}

export function validateClient(client) {
    const errors = [];
    if (!client.nombre || client.nombre.trim().length < 2) errors.push('nombre es requerido (mínimo 2 caracteres)');
    if (!client.id) errors.push('id es requerido');
    if (client.email && !EMAIL_REGEX.test(client.email.trim())) errors.push('email no tiene formato válido');
    if (client.telefono && !PHONE_REGEX.test(String(client.telefono))) errors.push('teléfono tiene caracteres no válidos');
    if (client.dni && String(client.dni).length > 12) errors.push('DNI/documento no debe exceder 12 caracteres');
    return { valid: errors.length === 0, errors };
}

export function validateVisita(visita) {
    const errors = [];
    if (!visita.clienteId) errors.push('clienteId es requerido');
    if (!visita.tecnicoId) errors.push('tecnicoId es requerido');
    if (!visita.tipo) errors.push('tipo es requerido');
    if (visita.fecha && isNaN(Date.parse(visita.fecha))) errors.push('fecha no tiene un formato de fecha válido');
    return { valid: errors.length === 0, errors };
}

export function validateTecnico(tecnico) {
    const errors = [];
    if (!tecnico.nombre || tecnico.nombre.trim().length < 2) errors.push('nombre es requerido (mínimo 2 caracteres)');
    if (tecnico.email && !EMAIL_REGEX.test(tecnico.email.trim())) errors.push('email no tiene formato válido');
    if (tecnico.telefono && !PHONE_REGEX.test(String(tecnico.telefono))) errors.push('teléfono tiene caracteres no válidos');
    return { valid: errors.length === 0, errors };
}

export function validateAveria(averia) {
    const errors = [];
    if (!averia.descripcion || averia.descripcion.trim().length < 3) errors.push('descripcion debe tener al menos 3 caracteres');
    if (!averia.estado) errors.push('estado es requerido');
    return { valid: errors.length === 0, errors };
}
