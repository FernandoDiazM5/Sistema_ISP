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

export const createOperationsSlice = (set, get) => ({
    // ===================== EQUIPOS =====================
    equipos: [],

    addEquipo: (equipo) => set(s => {
        const newEquipos = [{ ...equipo, id: getNextId(s.equipos, 'EQ') }, ...s.equipos];
        saveToDB('isp_equipos', newEquipos);
        return { equipos: newEquipos };
    }),

    updateEquipo: (id, updates) => set(s => {
        const newEquipos = s.equipos.map(e => e.id === id ? { ...e, ...updates } : e);
        saveToDB('isp_equipos', newEquipos);
        return { equipos: newEquipos };
    }),

    // ===================== INSTALACIONES =====================
    instalaciones: [],

    addInstalacion: (inst) => set(s => {
        const newId = getNextId(s.instalaciones, 'INS');
        const newInstalaciones = [{ ...inst, id: newId, fecha: inst.fecha || new Date().toISOString().split('T')[0] }, ...s.instalaciones];
        saveToDB('isp_instalaciones', newInstalaciones);
        return { instalaciones: newInstalaciones };
    }),

    updateInstalacion: (id, updates) => set(s => {
        const newInstalaciones = s.instalaciones.map(i => i.id === id ? { ...i, ...updates } : i);
        saveToDB('isp_instalaciones', newInstalaciones);
        return { instalaciones: newInstalaciones };
    }),

    deleteInstalacion: (id) => set(s => {
        const newInstalaciones = s.instalaciones.filter(i => i.id !== id);
        saveToDB('isp_instalaciones', newInstalaciones);
        return { instalaciones: newInstalaciones };
    }),

    // ===================== DERIVACIONES PLANTA EXTERNA =====================
    derivaciones: [],

    addDerivacion: (deriv) => set(s => {
        const newId = getNextId(s.derivaciones, 'DPE');
        const newDerivaciones = [{ ...deriv, id: newId, fecha: deriv.fecha || new Date().toISOString().split('T')[0], fechaCompletado: null }, ...s.derivaciones];
        saveToDB('isp_derivaciones', newDerivaciones);
        return { derivaciones: newDerivaciones };
    }),

    updateDerivacion: (id, updates) => set(s => {
        const newDerivaciones = s.derivaciones.map(d => {
            if (d.id === id) {
                const updated = { ...d, ...updates };
                if (updates.estado && updates.estado !== d.estado) {
                    const historyItem = {
                        fecha: new Date().toISOString(),
                        estadoAnterior: d.estado,
                        estadoNuevo: updates._historyEstadoLabel || updates.estado,
                        motivo: updates._historyComment || null
                    };
                    updated.historial = [historyItem, ...(d.historial || [])];
                    delete updated._historyComment;
                    delete updated._historyEstadoLabel;
                }
                return updated;
            }
            return d;
        });
        saveToDB('isp_derivaciones', newDerivaciones);
        return { derivaciones: newDerivaciones };
    }),

    deleteDerivacion: (id) => set(s => {
        const newDerivaciones = s.derivaciones.filter(d => d.id !== id);
        saveToDB('isp_derivaciones', newDerivaciones);
        return { derivaciones: newDerivaciones };
    }),

    // ===================== POST-VENTA =====================
    postVenta: [],

    addPostVenta: (pv) => set(s => {
        const newPostVenta = [{ ...pv, id: getNextId(s.postVenta, 'PV'), fecha: pv.fecha || new Date().toISOString().split('T')[0] }, ...s.postVenta];
        saveToDB('isp_postVenta', newPostVenta);
        return { postVenta: newPostVenta };
    }),

    updatePostVenta: (id, updates) => set(s => {
        const newPostVenta = s.postVenta.map(p => {
            if (p.id === id) {
                const updated = { ...p, ...updates };
                if (updates.estado && updates.estado !== p.estado) {
                    const historyItem = {
                        fecha: new Date().toISOString(),
                        estadoAnterior: p.estado,
                        estadoNuevo: updates._historyEstadoLabel || updates.estado,
                        motivo: updates._historyComment || null
                    };
                    updated.historial = [historyItem, ...(p.historial || [])];
                    delete updated._historyComment;
                    delete updated._historyEstadoLabel;
                }
                return updated;
            }
            return p;
        });
        saveToDB('isp_postVenta', newPostVenta);
        return { postVenta: newPostVenta };
    }),

    deletePostVenta: (id) => set(s => {
        const newPostVenta = s.postVenta.filter(p => p.id !== id);
        saveToDB('isp_postVenta', newPostVenta);
        return { postVenta: newPostVenta };
    }),

    // ===================== REQUERIMIENTOS ADMINISTRATIVOS =====================
    requerimientos: [],

    addRequerimiento: (req) => set(s => {
        const newId = getNextId(s.requerimientos, 'REQ');
        const newReqs = [{ ...req, id: newId, fecha: req.fecha || new Date().toISOString().split('T')[0], historial: [] }, ...s.requerimientos];
        saveToDB('isp_requerimientos', newReqs);
        return { requerimientos: newReqs };
    }),

    updateRequerimiento: (id, updates) => set(s => {
        const newReqs = s.requerimientos.map(r => {
            if (r.id === id) {
                const updated = { ...r, ...updates };
                if (updates.estado && updates.estado !== r.estado) {
                    const historyItem = {
                        fecha: new Date().toISOString(),
                        estadoAnterior: r.estado,
                        estadoNuevo: updates.estado,
                        motivo: updates._historyComment || null
                    };
                    updated.historial = [historyItem, ...(r.historial || [])];
                    delete updated._historyComment;
                }
                return updated;
            }
            return r;
        });
        saveToDB('isp_requerimientos', newReqs);
        return { requerimientos: newReqs };
    }),

    deleteRequerimiento: (id) => set(s => {
        const newReqs = s.requerimientos.filter(r => r.id !== id);
        saveToDB('isp_requerimientos', newReqs);
        return { requerimientos: newReqs };
    }),

    // ===================== MOVIMIENTOS EQUIPOS =====================
    movimientosEquipos: [],

    addMovimientoEquipo: (mov) => set(s => {
        const newId = getNextId(s.movimientosEquipos, 'MOV');
        const newMovimientos = [{ ...mov, id: newId, fecha: new Date().toISOString().split('T')[0] }, ...s.movimientosEquipos];
        saveToDB('isp_movimientosEquipos', newMovimientos);
        return { movimientosEquipos: newMovimientos };
    }),
});
