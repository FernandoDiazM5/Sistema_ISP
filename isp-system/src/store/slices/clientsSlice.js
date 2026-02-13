import * as db from '../../utils/db';

async function saveToDB(key, data) {
    try {
        await db.set(key, data);
    } catch (e) {
        console.error(`Error saving to DB (${key}):`, e);
    }
}

function getNextId(collection, prefix, idField = 'id') {
    if (!collection || collection.length === 0) return `${prefix}-001`;
    const maxId = collection.reduce((max, item) => {
        if (!item[idField]) return max;
        const parts = item[idField].split('-');
        const num = parseInt(parts[parts.length - 1] || 0);
        return !isNaN(num) && num > max ? num : max;
    }, 0);
    return `${prefix}-${String(maxId + 1).padStart(3, '0')}`;
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
