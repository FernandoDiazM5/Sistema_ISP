import { create } from 'zustand';
import useStore from './useStore';
import { pushToCloud, pullFromCloud, listBackupVersions, pullBackupVersion, deleteBackupVersion, pushLiveData, pullLiveData, subscribeLiveUpdates } from '../api/firebase';

// ID unico de esta sesion (para no re-aplicar nuestros propios pushes)
const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Debounce timer
let livePushTimer = null;

function getDataSnapshot() {
    const s = useStore.getState();
    return {
        clients: s.clients,
        tickets: s.tickets,
        averias: s.averias,
        tecnicos: s.tecnicos,
        equipos: s.equipos,
        visitas: s.visitas,
        instalaciones: s.instalaciones,
        derivaciones: s.derivaciones,
        postVenta: s.postVenta,
        sesionesRemoto: s.sesionesRemoto,
        movimientosEquipos: s.movimientosEquipos,
        requerimientos: s.requerimientos,
        whatsappLogs: s.whatsappLogs,
        templates: s.templates,
        columnPrefs: s.columnPrefs,
        cleaningOptions: s.cleaningOptions,
        importHistory: s.importHistory,
        branding: s.branding,
        customRolePermissions: s.customRolePermissions,
        whatsappCategories: s.whatsappCategories,
    };
}

const useSyncStore = create((set, get) => ({
    isSyncing: false,
    lastSync: localStorage.getItem('isp_last_sync') || null,
    syncError: null,
    syncMode: 'manual', // 'manual' | 'auto'

    // Versioned backup state
    backupVersions: [],
    loadingVersions: false,
    restoringVersion: null,

    // Progress tracking
    syncProgress: null,

    // Live sync state
    liveEnabled: false,
    livePushing: false,
    lastLiveUpdate: null,
    liveUnsubscribe: null,

    setSyncMode: (mode) => set({ syncMode: mode }),

    // ===================== LIVE SYNC (TIEMPO REAL) =====================
    startLiveSync: () => {
        if (get().liveEnabled) return;

        // 1. Escuchar cambios de otros usuarios via onSnapshot
        const unsub = subscribeLiveUpdates((meta) => {
            // Si el push fue de esta misma sesion, ignorar
            if (meta.pusherId === SESSION_ID) return;

            // Otro usuario hizo push -> auto-pull
            console.log('[LiveSync] Cambio detectado de otro usuario, descargando...');
            get().livePull();
        });

        // 2. Suscribirse a cambios locales del store para auto-push
        const storeUnsub = useStore.subscribe((state, prevState) => {
            if (!get().liveEnabled) return;
            // Detectar si hubo cambios en datos (no en UI state como activePage)
            const dataKeys = [
                'clients', 'tickets', 'averias', 'tecnicos', 'equipos',
                'visitas', 'instalaciones', 'derivaciones', 'postVenta',
                'sesionesRemoto', 'movimientosEquipos', 'requerimientos',
                'whatsappLogs', 'templates', 'branding', 'customRolePermissions',
                'whatsappCategories',
            ];
            const changed = dataKeys.some(k => state[k] !== prevState[k]);
            if (changed) {
                get().debouncedLivePush();
            }
        });

        set({
            liveEnabled: true,
            liveUnsubscribe: () => {
                unsub();
                storeUnsub();
            }
        });

        // 3. Hacer un pull inicial para tener la ultima version
        get().livePull();

        console.log('[LiveSync] Sincronizacion en tiempo real activada');
    },

    stopLiveSync: () => {
        const unsub = get().liveUnsubscribe;
        if (unsub) unsub();
        if (livePushTimer) clearTimeout(livePushTimer);
        set({ liveEnabled: false, liveUnsubscribe: null });
        console.log('[LiveSync] Sincronizacion en tiempo real desactivada');
    },

    // Push debounced (5 segundos despues del ultimo cambio)
    debouncedLivePush: () => {
        if (livePushTimer) clearTimeout(livePushTimer);
        livePushTimer = setTimeout(async () => {
            if (!get().liveEnabled || get().livePushing) return;
            set({ livePushing: true });
            try {
                const data = getDataSnapshot();
                await pushLiveData(data, SESSION_ID);
                const now = new Date().toISOString();
                set({ livePushing: false, lastLiveUpdate: now });
                console.log('[LiveSync] Datos subidos automaticamente');
            } catch (e) {
                console.warn('[LiveSync] Error en auto-push:', e);
                set({ livePushing: false });
            }
        }, 5000);
    },

    // Pull datos del live
    livePull: async () => {
        try {
            const data = await pullLiveData();
            if (data && data._meta) {
                // No aplicar si nosotros mismos hicimos el push
                if (data._meta.pusherId === SESSION_ID) return;

                const restoreSystem = useStore.getState().restoreSystem;
                if (restoreSystem) {
                    restoreSystem(data);
                }
                set({ lastLiveUpdate: data._meta.updatedAt });
                console.log('[LiveSync] Datos actualizados desde la nube');
            }
        } catch (e) {
            console.warn('[LiveSync] Error en pull:', e);
        }
    },

    // ===================== PUSH (SUBIR RESPALDO - BACKUP MANUAL) =====================
    syncPush: async () => {
        set({ isSyncing: true, syncError: null, syncProgress: { step: 0, totalSteps: 1, label: 'Preparando datos...', percent: 0 } });
        try {
            const dataToSync = getDataSnapshot();
            const onProgress = (info) => set({ syncProgress: info });
            const result = await pushToCloud(dataToSync, onProgress);

            const now = new Date().toISOString();
            localStorage.setItem('isp_last_sync', now);
            set({ lastSync: now, isSyncing: false, syncProgress: null });

            // Refresh versions list after push
            get().loadVersions();

            return result;
        } catch (error) {
            console.error('Sync Push Error:', error);
            set({ isSyncing: false, syncError: error.message, syncProgress: null });
            return false;
        }
    },

    // ===================== PULL LATEST (RESTAURAR ÚLTIMO - BACKUP MANUAL) =====================
    syncPull: async () => {
        set({ isSyncing: true, syncError: null });
        try {
            const data = await pullFromCloud();
            if (data) {
                const restoreSystem = useStore.getState().restoreSystem;
                if (restoreSystem) {
                    restoreSystem(data);
                }

                const now = new Date().toISOString();
                localStorage.setItem('isp_last_sync', now);
                set({ lastSync: now, isSyncing: false });
                return true;
            } else {
                throw new Error('No se encontraron datos de respaldo en la nube.');
            }
        } catch (error) {
            console.error('Sync Pull Error:', error);
            set({ isSyncing: false, syncError: error.message });
            return false;
        }
    },

    // ===================== LISTAR VERSIONES =====================
    loadVersions: async () => {
        set({ loadingVersions: true });
        try {
            const versions = await listBackupVersions();
            set({ backupVersions: versions, loadingVersions: false });
            return versions;
        } catch (error) {
            console.error('Error loading versions:', error);
            set({ loadingVersions: false, syncError: error.message });
            return [];
        }
    },

    // ===================== RESTAURAR VERSIÓN ESPECÍFICA =====================
    restoreVersion: async (versionId) => {
        set({ restoringVersion: versionId, syncError: null });
        try {
            const data = await pullBackupVersion(versionId);
            if (data) {
                const restoreSystem = useStore.getState().restoreSystem;
                if (restoreSystem) {
                    restoreSystem(data);
                }
                const now = new Date().toISOString();
                localStorage.setItem('isp_last_sync', now);
                set({ restoringVersion: null, lastSync: now });
                return true;
            }
            throw new Error('No se encontraron datos para esa versión.');
        } catch (error) {
            console.error('Restore Version Error:', error);
            set({ restoringVersion: null, syncError: error.message });
            return false;
        }
    },

    // ===================== ELIMINAR VERSIÓN =====================
    removeVersion: async (versionId) => {
        try {
            await deleteBackupVersion(versionId);
            set(s => ({
                backupVersions: s.backupVersions.filter(v => v.id !== versionId)
            }));
            return true;
        } catch (error) {
            console.error('Delete Version Error:', error);
            set({ syncError: error.message });
            return false;
        }
    },

    // ===================== DESCARGAR VERSIÓN (Local) =====================
    downloadVersionData: async (versionId) => {
        set({ restoringVersion: versionId });
        try {
            const data = await pullBackupVersion(versionId);
            set({ restoringVersion: null });
            return data;
        } catch (error) {
            console.error('Download Version Error:', error);
            set({ restoringVersion: null, syncError: error.message });
            return null;
        }
    },
}));

export default useSyncStore;
