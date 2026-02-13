/**
 * Validadores de datos para el ISP Sistema.
 * Se aplican antes de persistir datos en el store.
 */

export function validateTicket(ticket) {
    const errors = [];
    if (!ticket.clienteId) errors.push('clienteId es requerido');
    if (!ticket.descripcion || ticket.descripcion.trim().length < 3) errors.push('descripcion debe tener al menos 3 caracteres');
    if (!ticket.tipo) errors.push('tipo es requerido');
    if (!ticket.estado) errors.push('estado es requerido');
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
    if (!client.nombre || client.nombre.trim().length < 2) errors.push('nombre es requerido');
    if (!client.id) errors.push('id es requerido');
    return { valid: errors.length === 0, errors };
}

export function validateVisita(visita) {
    const errors = [];
    if (!visita.clienteId) errors.push('clienteId es requerido');
    if (!visita.tecnicoId) errors.push('tecnicoId es requerido');
    if (!visita.tipo) errors.push('tipo es requerido');
    return { valid: errors.length === 0, errors };
}

export function validateTecnico(tecnico) {
    const errors = [];
    if (!tecnico.nombre || tecnico.nombre.trim().length < 2) errors.push('nombre es requerido');
    return { valid: errors.length === 0, errors };
}
