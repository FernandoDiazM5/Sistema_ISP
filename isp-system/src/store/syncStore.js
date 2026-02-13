import { create } from 'zustand';
import useStore from './useStore';
import { pushToCloud, pullFromCloud, listBackupVersions, pullBackupVersion, deleteBackupVersion } from '../api/firebase';

const useSyncStore = create((set, get) => ({
    isSyncing: false,
    lastSync: localStorage.getItem('isp_last_sync') || null,
    syncError: null,
    syncMode: 'manual', // 'manual' | 'auto'

    // Versioned backup state
    backupVersions: [],
    loadingVersions: false,
    restoringVersion: null, // versionId being restored

    // Progress tracking
    syncProgress: null, // { step, totalSteps, label, percent } or null

    setSyncMode: (mode) => set({ syncMode: mode }),

    // ===================== PUSH (SUBIR RESPALDO) =====================
    syncPush: async () => {
        set({ isSyncing: true, syncError: null, syncProgress: { step: 0, totalSteps: 1, label: 'Preparando datos...', percent: 0 } });
        try {
            const mainState = useStore.getState();
            const dataToSync = {
                clients: mainState.clients,
                tickets: mainState.tickets,
                averias: mainState.averias,
                tecnicos: mainState.tecnicos,
                equipos: mainState.equipos,
                visitas: mainState.visitas,
                instalaciones: mainState.instalaciones,
                derivaciones: mainState.derivaciones,
                postVenta: mainState.postVenta,
                sesionesRemoto: mainState.sesionesRemoto,
                movimientosEquipos: mainState.movimientosEquipos,
                whatsappLogs: mainState.whatsappLogs,
                templates: mainState.templates,
                columnPrefs: mainState.columnPrefs,
                cleaningOptions: mainState.cleaningOptions,
                importHistory: mainState.importHistory,
            };

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

    // ===================== PULL LATEST (RESTAURAR ÚLTIMO) =====================
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
