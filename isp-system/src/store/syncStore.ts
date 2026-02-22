import { create } from 'zustand';
import useStore from './useStore';
import { pushToCloud, pullFromCloud, listBackupVersions, pullBackupVersion, deleteBackupVersion, saveDocument, deleteDocument, subscribeToCollection, pullLiveCollections, subscribeToOpenTickets, setOfflineQueueCallback, saveDocumentDirect, deleteDocumentDirect } from '../api/firebase';

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
    isReceivingRemoteData: boolean;

    // Cola Offline
    offlineQueue: any[];
    addOfflineAction: (action: any) => void;
    removeOfflineAction: (id: string, col: string) => void;
    processOfflineQueue: () => Promise<void>;

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
    isReceivingRemoteData: false,

    // ===================== OFFLINE QUEUE =====================
    offlineQueue: JSON.parse(localStorage.getItem('isp_offline_queue') || '[]'),

    addOfflineAction: (action: any) => {
        set((state: any) => {
            const newQueue = state.offlineQueue.filter((item: any) =>
                !(item.collectionName === action.collectionName && item.id === action.id)
            );
            newQueue.push({ ...action, timestamp: Date.now() });
            localStorage.setItem('isp_offline_queue', JSON.stringify(newQueue));
            return { offlineQueue: newQueue };
        });
    },

    removeOfflineAction: (id: string, col: string) => {
        set((state: any) => {
            const newQueue = state.offlineQueue.filter((item: any) =>
                !(item.collectionName === col && item.id === id)
            );
            localStorage.setItem('isp_offline_queue', JSON.stringify(newQueue));
            return { offlineQueue: newQueue };
        });
    },

    processOfflineQueue: async () => {
        const state = get();
        if (state.offlineQueue.length === 0 || !navigator.onLine) return;

        set({ isSyncing: true });

        // Clonamos la cola para procesarla
        const queueToProcess = [...state.offlineQueue];
        for (const action of queueToProcess) {
            try {
                if (action.type === 'save') {
                    await saveDocumentDirect(action.collectionName, action.data);
                } else if (action.type === 'delete') {
                    await deleteDocumentDirect(action.collectionName, action.id);
                }
                // Si tuvo éxito nativo (no lanzó error), lo removemos de la cola definitivamente
                get().removeOfflineAction(action.id, action.collectionName);
            } catch (err) {
                console.error(`Error purgando elemento offline col:${action.collectionName} id:${action.id}`, err);
                // Queda atrapado en localStorage para el próximo intento online
            }
        }

        set({ isSyncing: false });
    },

    setSyncMode: (mode) => set({ syncMode: mode }),

    // ===================== LIVE SYNC (NATIVO FIRESTORE) =====================
    startLiveSync: () => {
        if (get().liveEnabled) return;

        const unsubscribers: (() => void)[] = [];

        // 1. Suscripciones Híbridas (Lecturas Activas pero Controladas)
        // Escuchamos SÓLO los tickets abiertos en Firestore.
        // Cada vez que hay un nuevo ticket o se edita en la nube, entra silenciosamente aquí.
        const unsubTickets = subscribeToOpenTickets((liveOpenTickets: any[]) => {
            const storeState = useStore.getState();
            if (storeState.applyDeltas && liveOpenTickets.length > 0) {
                // Bloqueamos el hook de auto-push local para no generar The Ping Pong Loop
                set({ isReceivingRemoteData: true });
                // Sobrescribe el store local con estos mini-cambios y los guarda en IndexedDB.
                storeState.applyDeltas({ tickets: liveOpenTickets });
                // Liberamos el candado una vez inyectada la mutación
                set({ isReceivingRemoteData: false });
            }
        });
        unsubscribers.push(unsubTickets as () => void);

        // 2. Suscribirse a cambios locales del store para auto-push NATIVO (Escritura delta)
        const storeUnsub = useStore.subscribe((state: any, prevState: any) => {
            if (!get().liveEnabled || get().isReceivingRemoteData) return;

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
            const onProgress = (info: any) => set({ syncProgress: info });

            // Obtener el registro de la última sincronización
            const lastSyncStr = get().lastSync; // ej. ISO string

            // Descargar sólo las novedades (Deltas) si tenemos registro previo, sino descarga completa
            const data = await pullLiveCollections(lastSyncStr, onProgress);

            // Inyectar a Zustand y persistir permanentemente en IndexedDB
            const storeState = useStore.getState();

            set({ isReceivingRemoteData: true }); // BLOQUEO ANTI-REBOTE

            if (lastSyncStr && storeState.applyDeltas) {
                // Fusión inteligente: Solo sobreescribir los items nuevos/modificados
                storeState.applyDeltas(data);
            } else if (storeState.restoreSystem) {
                // Sincronización completa: Sobreescritura total
                storeState.restoreSystem(data);
            } else {
                useStore.setState(data);
            }

            set({ isReceivingRemoteData: false }); // DESBLOQUEO

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

// ===================== OFFLINE GLUE =====================
setOfflineQueueCallback((action: any) => {
    useSyncStore.getState().addOfflineAction(action);
});

if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        const state = useSyncStore.getState();
        if (state.offlineQueue.length > 0) {
            console.log('🌐 Conexión recuperada. Aplicando retenciones offline...');
            state.processOfflineQueue();
        }
    });
}

export default useSyncStore;
