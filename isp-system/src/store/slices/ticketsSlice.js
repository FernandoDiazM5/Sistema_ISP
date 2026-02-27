import * as db from '../../utils/db';
import { getNextId } from '../../utils/helpers';

async function saveToDB(key, data) {
    try {
        await db.set(key, data);
    } catch (e) {
        console.error(`Error saving to DB (${key}):`, e);
    }
}

export const createTicketsSlice = (set, get) => ({
    // ===================== TICKETS =====================
    tickets: [],

    addTicket: (ticket) => set(s => {
        const newTickets = [{ ...ticket, id: getNextId(s.tickets, 'TK'), fecha: new Date().toISOString().split('T')[0], fechaUpdate: new Date().toISOString().split('T')[0], historial: [] }, ...s.tickets];
        saveToDB('isp_tickets', newTickets);
        return { tickets: newTickets };
    }),

    updateTicket: (id, updates) => set(s => {
        const newTickets = s.tickets.map(t => {
            if (t.id === id) {
                const updated = { ...t, ...updates, fechaUpdate: new Date().toISOString().split('T')[0] };
                if (updates.estado && updates.estado !== t.estado) {
                    const historyItem = {
                        fecha: new Date().toISOString(),
                        estadoAnterior: t.estado,
                        estadoNuevo: updates._historyEstadoLabel || updates.estado,
                        motivo: updates._historyComment || null
                    };
                    updated.historial = [historyItem, ...(t.historial || [])];
                    delete updated._historyComment;
                    delete updated._historyEstadoLabel;
                }
                return updated;
            }
            return t;
        });
        saveToDB('isp_tickets', newTickets);
        return { tickets: newTickets };
    }),

    deleteTicket: (id) => set(s => {
        const newTickets = s.tickets.filter(t => t.id !== id);
        saveToDB('isp_tickets', newTickets);
        return { tickets: newTickets };
    }),

    // Eliminación en cascada: ticket + visitas + sesiones de soporte vinculadas
    deleteTicketCascade: (ticketId) => set(s => {
        const newTickets = s.tickets.filter(t => t.id !== ticketId);
        const newVisitas = s.visitas.filter(v => v.ticketId !== ticketId);
        const newSesiones = s.sesionesRemoto.filter(sr => sr.ticketId !== ticketId);

        saveToDB('isp_tickets', newTickets);
        saveToDB('isp_visitas', newVisitas);
        saveToDB('isp_sesionesRemoto', newSesiones);

        return {
            tickets: newTickets,
            visitas: newVisitas,
            sesionesRemoto: newSesiones,
        };
    }),

    // ===================== AVERÍAS =====================
    averias: [],

    addAveria: (averia) => set(s => {
        const newAverias = [{ ...averia, id: getNextId(s.averias, 'AV'), fecha: new Date().toISOString().split('T')[0], fechaResolucion: null, historial: [] }, ...s.averias];
        saveToDB('isp_averias', newAverias);
        return { averias: newAverias };
    }),

    updateAveria: (id, updates) => set(s => {
        const newAverias = s.averias.map(a => {
            if (a.id === id) {
                const updated = { ...a, ...updates };
                if (updates.estado && updates.estado !== a.estado) {
                    const historyItem = {
                        fecha: new Date().toISOString(),
                        estadoAnterior: a.estado,
                        estadoNuevo: updates.estado,
                        motivo: updates._historyComment || null
                    };
                    updated.historial = [historyItem, ...(a.historial || [])];
                    delete updated._historyComment;
                }
                return updated;
            }
            return a;
        });
        saveToDB('isp_averias', newAverias);
        return { averias: newAverias };
    }),

    // ===================== SOPORTE REMOTO =====================
    sesionesRemoto: [],

    addSesionRemoto: (sesion) => set(s => {
        const newSesiones = [{ ...sesion, id: getNextId(s.sesionesRemoto, 'SR'), fecha: new Date().toISOString().split('T')[0] }, ...s.sesionesRemoto];
        saveToDB('isp_sesionesRemoto', newSesiones);
        return { sesionesRemoto: newSesiones };
    }),

    updateSesionRemoto: (id, updates) => set(s => {
        const newSesiones = s.sesionesRemoto.map(sr => {
            if (sr.id === id) {
                const updated = { ...sr, ...updates };
                if (updates.estado && updates.estado !== sr.estado) {
                    const historyItem = {
                        fecha: new Date().toISOString(),
                        estadoAnterior: sr.estado,
                        estadoNuevo: updates._historyEstadoLabel || updates.estado,
                        motivo: updates._historyComment || null
                    };
                    updated.historial = [historyItem, ...(sr.historial || [])];
                    delete updated._historyComment;
                    delete updated._historyEstadoLabel;
                }
                return updated;
            }
            return sr;
        });
        saveToDB('isp_sesionesRemoto', newSesiones);
        return { sesionesRemoto: newSesiones };
    }),

    deleteSesionRemoto: (id) => set(s => {
        const newSesiones = s.sesionesRemoto.filter(sr => sr.id !== id);
        saveToDB('isp_sesionesRemoto', newSesiones);
        return { sesionesRemoto: newSesiones };
    }),

    // ===================== VISITAS TÉCNICAS =====================
    visitas: [],

    addVisita: (visita) => set(s => {
        const newId = getNextId(s.visitas, 'VT');
        const newVisitas = [{ ...visita, id: newId, fecha: visita.fecha || new Date().toISOString().split('T')[0] }, ...s.visitas];
        saveToDB('isp_visitas', newVisitas);
        return { visitas: newVisitas };
    }),

    updateVisita: (id, updates) => set(s => {
        const newVisitas = s.visitas.map(v => {
            if (v.id === id) {
                const updated = { ...v, ...updates };

                // Handle history
                let historyItem = null;

                if (updates._historyEntry) {
                    // Manual rich history entry
                    historyItem = {
                        fecha: new Date().toISOString(),
                        ...updates._historyEntry
                    };
                    delete updated._historyEntry;
                } else if (updates.estado && updates.estado !== v.estado) {
                    // Automatic state change history
                    historyItem = {
                        fecha: new Date().toISOString(),
                        estadoAnterior: v.estado,
                        estadoNuevo: updates.estado,
                        motivo: updates._historyComment || null
                    };
                    delete updated._historyComment;
                }

                if (historyItem) {
                    updated.historial = [historyItem, ...(v.historial || [])];
                }

                return updated;
            }
            return v;
        });
        saveToDB('isp_visitas', newVisitas);
        return { visitas: newVisitas };
    }),

    deleteVisita: (id) => set(s => {
        const newVisitas = s.visitas.filter(v => v.id !== id);
        saveToDB('isp_visitas', newVisitas);
        return { visitas: newVisitas };
    }),
});
