import * as db from '../../utils/db';
import { getNextId } from '../../utils/helpers';

async function saveToDB(key, data) {
    try {
        await db.set(key, data);
    } catch (e) {
        console.error(`Error saving to DB (${key}):`, e);
    }
}

export const createClientsSlice = (set, get) => ({
    // ===================== CLIENTES =====================
    clients: [],
    clientsLoading: false,
    dataSource: 'demo',

    setClients: (clients) => {
        set({ clients });
        saveToDB('isp_clients', clients);
    },

    importClients: (newClients) => {
        set({ clients: newClients, dataSource: 'excel' });
        saveToDB('isp_clients', newClients);
        saveToDB('isp_dataSource', 'excel');
    },

    // ===================== BAJAS DE CLIENTE =====================
    autoCancelClientOperations: (clientId, reason = 'Cliente dado de baja') => {
        const state = get();

        // 1. Cancelar Tickets Pendientes
        const pendingTickets = state.tickets.filter(t => t.clienteId === clientId && (t.estado === 'Abierto' || t.estado === 'En Proceso' || t.estado === 'Escalado'));
        pendingTickets.forEach(t => {
            state.updateTicket(t.id, { estado: 'Cancelado', _historyComment: reason });
        });

        // 2. Cancelar Post-Venta
        const pendingPV = state.postVenta.filter(p => p.clienteId === clientId && (p.estado === 'Pendiente' || p.estado === 'En Proceso'));
        pendingPV.forEach(p => {
            state.updatePostVenta(p.id, { estado: 'Rechazado', _historyComment: reason }); // PostVenta cancelado se trata como Rechazado
        });

        // 3. Cancelar Instalaciones Programadas (si tuvieran link al ID)
        // Usualmente las instalaciones pueden no estar linkeadas a un cliente existitente sino a un nuevo prospecto.
        // Pero si coincide el nombre exacto o cedula, quizás deberíamos anularlo.
        const pendingInst = state.instalaciones.filter(i => (i.clienteNombre === state.clients.find(c => c.id === clientId)?.nombre) && (i.estado === 'Pendiente' || i.estado === 'Programada'));
        pendingInst.forEach(i => {
            state.updateInstalacion(i.id, { estado: 'Cancelada' });
            // Agregar historial interno si la app lo soporta
        });

        // 4. Liberar Equipos Asignados (Inventario)
        if (state.equipos && state.updateEquipo) {
            const assignedEquipos = state.equipos.filter(e => e.clienteId === clientId && e.estado === 'En uso');
            assignedEquipos.forEach(e => {
                state.updateEquipo(e.id, {
                    estado: 'Disponible',
                    clienteId: '',
                    clienteNombre: '',
                    fechaAsignacion: null,
                    ubicacion: 'Almacén (Devolución por Baja)'
                });
            });
        }

        // Retorna un true para logueo
        return true;
    },

    // ===================== HISTORIAL DE CAMBIOS DEL CLIENTE =====================
    clientChanges: [],

    addClientChanges: (changesArray) => set(s => {
        if (!changesArray || changesArray.length === 0) return s;
        const newChanges = [...changesArray, ...(s.clientChanges || [])];
        saveToDB('isp_client_changes', newChanges);
        return { clientChanges: newChanges };
    }),

    // ===================== COLUMN PREFERENCES =====================
    columnPrefs: {
        visible: ['id', 'nombre', 'tecnologia', 'plan', 'precio', 'estado_cuenta', 'status', 'deuda_monto'],
        order: ['id', 'nombre', 'tecnologia', 'plan', 'precio', 'estado_cuenta', 'status', 'deuda_monto'],
    },
    setColumnPrefs: (prefs) => {
        set({ columnPrefs: prefs });
        saveToDB('isp_col_prefs', prefs);
    },

    // ===================== IMPORTACIÓN =====================
    lastImport: null,
    setLastImport: (info) => {
        set({ lastImport: info });
        saveToDB('isp_lastImport', info);
    },

    importHistory: [],
    addImportRecord: (record) => set(s => {
        const maxId = s.importHistory.reduce((max, item) => {
            const num = parseInt(item.id.split('-')[1] || 0);
            return num > max ? num : max;
        }, 0);
        const newHistory = [{ ...record, id: `IMP-${String(maxId + 1).padStart(3, '0')}`, fecha: new Date().toISOString() }, ...s.importHistory];
        saveToDB('isp_importHistory', newHistory);
        return { importHistory: newHistory };
    }),

    cleaningOptions: {
        separateNameStatus: true, classifyEmail: true, splitMobile: true,
        parseDebt: true, parsePrices: true, inferTechnology: true,
        separateTV: true, normalizeCortePorDeuda: true, formatDNI: true,
    },
    setCleaningOptions: (opts) => {
        set({ cleaningOptions: opts });
        saveToDB('isp_cleaningOptions', opts);
    },
});
