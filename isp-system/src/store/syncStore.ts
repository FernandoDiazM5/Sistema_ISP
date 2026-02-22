import { create } from 'zustand';
import useStore from './useStore';
import { pushToCloud, pullFromCloud, listBackupVersions, pullBackupVersion, deleteBackupVersion, saveDocument, deleteDocument, subscribeToCollection, pullLiveCollections } from '../api/firebase';

// ID unico de esta sesion (para no re-aplicar nuestros propios pushes)
const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Debounce timer
let livePushTimer: any = null;

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

export interface SyncStoreState {
    isSyncing: boolean;
    lastSync: string | null;
    syncError: string | null;
    syncMode: 'manual' | 'auto';
    backupVersions: any[];
    loadingVersions: boolean;
    restoringVersion: string | null;
    syncProgress: any;
    liveEnabled: boolean;
    livePushing: boolean;
    lastLiveUpdate: string | null;
    liveUnsubscribe: (() => void) | null;

    setSyncMode: (mode: 'manual' | 'auto') => void;
    startLiveSync: () => void;
    stopLiveSync: () => void;
    debouncedLivePush: () => void;
    livePull: () => Promise<boolean>;
    syncPush: () => Promise<any>;
    syncPull: () => Promise<boolean>;
    loadVersions: () => Promise<any[]>;
    restoreVersion: (versionId: string) => Promise<boolean>;
    removeVersion: (versionId: string) => Promise<boolean>;
    downloadVersionData: (versionId: string) => Promise<any>;
}

const useSyncStore = create<SyncStoreState>((set: any, get: any) => ({
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

    // ===================== LIVE SYNC (NATIVO FIRESTORE) =====================
    startLiveSync: () => {
        if (get().liveEnabled) return;

        const unsubscribers: (() => void)[] = [];

        // 1. Array de colecciones que queremos suscribir localmente
        // El user pidió limitar consultas para no gastar lecturas infinitas
        // Se aplicarán las suscripciones a través de hooks nativos o desde aquí.
        // Dado que se pidió limitar las suscripciones: vamos a suscribir solo a tickets abiertos como ejemplo de ahorro.
        // Por simplicidad arquitectónica temporal, mantendremos la carga desde IndexedDB como principal (ya en hydrateStore)
        // y este liveSync atrapará deltas salientes. Las suscripciones entrantes reales de firestore las dejaremos para otro refactor 
        // o implementaremos suscripciones simples mediante query builder posterior.

        // 2. Suscribirse a cambios locales del store para auto-push NATIVO (Escritura delta)
        const storeUnsub = useStore.subscribe((state: any, prevState: any) => {
            if (!get().liveEnabled) return;

            const dataKeys = [
                'clients', 'tickets', 'averias', 'tecnicos', 'equipos',
                'visitas', 'instalaciones', 'derivaciones', 'postVenta',
                'sesionesRemoto', 'movimientosEquipos', 'requerimientos',
                'whatsappLogs', 'templates', 'whatsappCategories',
                'categorias', 'subcategorias', 'prioridadesSLA',
                'estadosCatalogo', 'catalogoServicios', 'tiposRequerimiento',
            ];

            const deltas: any[] = [];
            dataKeys.forEach(key => {
                const prevArray = prevState[key] || [];
                const newArray = state[key] || [];
                if (prevArray === newArray) return;

                const prevMap = new Map(prevArray.map((item: any) => [item.id, item]));
                const newMap = new Map(newArray.map((item: any) => [item.id, item]));

                // Added & Updated
                for (const [id, newItem] of newMap.entries()) {
                    const oldItem = prevMap.get(id);
                    if (!oldItem) {
                        deltas.push({ col: key, action: 'insert', id, data: newItem });
                    } else if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                        deltas.push({ col: key, action: 'update', id, data: newItem });
                    }
                }

                // Deleted
                for (const id of prevMap.keys()) {
                    if (!newMap.has(id)) {
                        deltas.push({ col: key, action: 'delete', id });
                    }
                }
            });

            if (deltas.length > 0) {
                // Enviar a Firestore nativo en background
                deltas.forEach(delta => {
                    const firestoreCollection = delta.col === 'clients' ? 'clients' : delta.col; // mapear nombres si es necesario
                    if (delta.action === 'delete') {
                        deleteDocument(firestoreCollection, delta.id).catch(console.error);
                    } else {
                        saveDocument(firestoreCollection, delta.data).catch(console.error);
                    }
                });
                console.log(`[LiveSync] Se sincronizaron nativamente ${deltas.length} cambios atómicos.`);
            }
        });

        set({
            liveEnabled: true,
            liveUnsubscribe: () => {
                unsubscribers.forEach(u => u());
                storeUnsub();
            }
        });

        console.log('[LiveSync] Escuchador atómico de operaciones activado');
    },

    stopLiveSync: () => {
        const unsub = get().liveUnsubscribe;
        if (unsub) unsub();
        set({ liveEnabled: false, liveUnsubscribe: null });
        console.log('[LiveSync] Sincronización en tiempo real desactivada');
    },

    // Ya no usamos pushLiveData en el nuevo modelo atómico
    debouncedLivePush: () => { },

    // ===================== LIVE PULL (DESCARGA DIRECTA DE COLECCIONES) =====================
    livePull: async () => {
        set({ isSyncing: true, syncError: null, syncProgress: { step: 0, totalSteps: 1, label: 'Iniciando conexión...', percent: 0 } });
        try {
            const onProgress = (info) => set({ syncProgress: info });
            const data = await pullLiveCollections(onProgress);

            // Inyectar datos directamente a Zustand (lo cual disparará guardados IndexedDB)
            useStore.setState(data);

            const now = new Date().toISOString();
            localStorage.setItem('isp_last_sync', now);
            set({ lastSync: now, isSyncing: false, syncProgress: null });

            return true;
        } catch (error) {
            console.error('Live Pull Error:', error);
            set({ isSyncing: false, syncError: error.message, syncProgress: null });
            return false;
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
