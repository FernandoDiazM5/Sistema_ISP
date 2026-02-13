import { create } from 'zustand';
import useStore from './useStore';
import { pushToCloud, pullFromCloud } from '../api/firebase';

const useSyncStore = create((set, get) => ({
    isSyncing: false,
    lastSync: localStorage.getItem('isp_last_sync') || null,
    syncError: null,
    syncMode: 'manual', // 'manual' | 'auto'

    setSyncMode: (mode) => set({ syncMode: mode }),

    syncPush: async () => {
        set({ isSyncing: true, syncError: null });
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

            await pushToCloud(dataToSync);

            const now = new Date().toISOString();
            localStorage.setItem('isp_last_sync', now);
            set({ lastSync: now, isSyncing: false });
            return true;
        } catch (error) {
            console.error('Sync Push Error:', error);
            set({ isSyncing: false, syncError: error.message });
            return false;
        }
    },

    syncPull: async () => {
        set({ isSyncing: true, syncError: null });
        try {
            const data = await pullFromCloud();
            if (data) {
                const importClients = useStore.getState().importClients;
                // Importamos tickets y averias tambien?
                // Por ahora el main store solo tiene importClients exposer, 
                // deberiamos agregar acciones para setTickets y setAverias si queremos full restore.
                // Asumiendo que importClients hace un reemplazo o merge.

                // Dado que es una restauración, vamos a usar importClients para clientes.
                // Para tickets y averias, necesitamos acceso a los setters del store principal.
                // Accedemos directamente al estado para invocar los setters si existen, o usamos setState de useStore.

                useStore.setState({
                    clients: data.clients,
                    tickets: data.tickets,
                    averias: data.averias
                });

                // Guardar en IndexedDB también, ya que useStore (ahora con DB wrapper)
                // persiste en cada cambio si la logica esta en los setters, 
                // pero useStore.setState no dispara los side-effects de persistencia automatica 
                // a menos que estemos usando el middleware o la logica interna.
                // REVISAR: useStore.js tiene logica de persistencia en los actions.
                // Si hago useStore.setState, no se llama a saveToDB.

                // Solucion: Llamar a una accion de "restoreFullState" en useStore 
                // o guardar manualmente en DB.
                const restoreSystem = useStore.getState().restoreSystem;
                if (restoreSystem) {
                    await restoreSystem(data);
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
    }
}));

export default useSyncStore;
