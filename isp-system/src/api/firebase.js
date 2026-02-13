import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';

// Helper para obtener config desde localStorage o variables de entorno
const getConfig = () => ({
    apiKey: localStorage.getItem('isp_firebase_api_key') || import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: localStorage.getItem('isp_firebase_auth_domain') || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: localStorage.getItem('isp_firebase_project_id') || import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: localStorage.getItem('isp_firebase_storage_bucket') || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: localStorage.getItem('isp_firebase_messaging_sender_id') || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: localStorage.getItem('isp_firebase_app_id') || import.meta.env.VITE_FIREBASE_APP_ID,
});

let db = null;
let app = null;

export const initFirebase = () => {
    const config = getConfig();
    if (!config.apiKey || !config.projectId) {
        console.warn('Firebase config missing');
        return null;
    }

    if (!app) {
        try {
            app = initializeApp(config);
            db = getFirestore(app);
            console.log('Firebase initialized');
        } catch (e) {
            console.error('Error initializing Firebase', e);
        }
    }
    return db;
};

// Sincronizar subida (Full push)
export const pushToCloud = async (data) => {
    const database = initFirebase();
    if (!database) throw new Error('Firebase no configurado');

    const empresaId = 'isp_default';
    const BATCH_SIZE = 450; // Safety margin below 500

    // 1. Prepare Clients Batches
    const clients = data.clients || [];
    const clientBatches = [];
    for (let i = 0; i < clients.length; i += BATCH_SIZE) {
        clientBatches.push(clients.slice(i, i + BATCH_SIZE));
    }

    // 2. Commit Client Batches sequentially
    // We do this first because if we fail here, the main backup metadata won't update
    for (const batchClients of clientBatches) {
        const batch = writeBatch(database);
        batchClients.forEach(client => {
            const ref = doc(database, 'clients', client.id); // Use client.id as doc ID
            batch.set(ref, {
                ...client,
                _empresaId: empresaId,
                updatedAt: new Date().toISOString()
            });
        });
        await batch.commit();
    }

    // 3. Main Backup (Collections & Config) in a single batch
    const mainBatch = writeBatch(database);

    // === COLECCIONES PRINCIPALES ===
    const collections = [
        'tickets', 'averias', 'tecnicos', 'equipos', 'visitas',
        'instalaciones', 'derivaciones', 'postVenta', 'sesionesRemoto',
        'movimientosEquipos', 'whatsappLogs', 'templates'
    ];

    collections.forEach(col => {
        const ref = doc(database, 'backups', `${empresaId}_${col}`);
        mainBatch.set(ref, { data: data[col] || [], updatedAt: new Date().toISOString() });
    });

    // === CONFIGURACIÓN Y METADATA ===
    const configRef = doc(database, 'backups', `${empresaId}_config`);
    mainBatch.set(configRef, {
        columnPrefs: data.columnPrefs || {},
        cleaningOptions: data.cleaningOptions || {},
        importHistory: data.importHistory || [],
        updatedAt: new Date().toISOString()
    });

    // Metadata General
    const metaRef = doc(database, 'backups', `${empresaId}_meta`);
    mainBatch.set(metaRef, {
        lastSync: new Date().toISOString(),
        totalClients: clients.length,
        version: 'v2_clients_collection' // Marker for new structure
    });

    await mainBatch.commit();
    return true;
};

// Sincronizar bajada (Full pull)
export const pullFromCloud = async () => {
    const database = initFirebase();
    if (!database) throw new Error('Firebase no configurado');

    const empresaId = 'isp_default';

    // 1. Metadata
    const metaSnap = await getDoc(doc(database, 'backups', `${empresaId}_meta`));
    const meta = metaSnap.exists() ? metaSnap.data() : {};

    // 2. Clientes (Individual Docs or Legacy Chunks)
    let allClients = [];

    if (meta.version === 'v2_clients_collection') {
        // New strategy: Read from 'clients' collection
        // TODO: Implement pagination or where clause for empresaId if multi-tenant
        const clientsSnap = await getDocs(collection(database, 'clients'));
        clientsSnap.forEach(doc => {
            // Basic filter if we ever support multi-tenant (though collection is global here)
            const data = doc.data();
            if (data._empresaId === empresaId || !data._empresaId) {
                // Remove metadata fields if needed, or keep them
                const { _empresaId, updatedAt, ...clientData } = data;
                allClients.push(clientData);
            }
        });

    } else {
        // Legacy strategy: Read chunks from 'backups'
        const numChunks = meta.clientChunks || 1;
        const chunkPromises = [];
        for (let i = 0; i < numChunks; i++) {
            chunkPromises.push(getDoc(doc(database, 'backups', `${empresaId}_clients_${i}`)));
        }
        const chunkSnaps = await Promise.all(chunkPromises);
        chunkSnaps.forEach(snap => {
            if (snap.exists()) {
                allClients = [...allClients, ...(snap.data().data || [])];
            }
        });
    }

    // 3. Estructura de colecciones (Backups blob)
    const collections = [
        'tickets', 'averias', 'tecnicos', 'equipos', 'visitas',
        'instalaciones', 'derivaciones', 'postVenta', 'sesionesRemoto',
        'movimientosEquipos', 'whatsappLogs', 'templates', 'config'
    ];

    const colPromises = collections.map(col => getDoc(doc(database, 'backups', `${empresaId}_${col}`)));
    const colSnaps = await Promise.all(colPromises);

    // Mapear resultados
    const result = { clients: allClients };

    colSnaps.forEach((snap, index) => {
        const colName = collections[index];
        if (snap.exists()) {
            const d = snap.data();
            if (colName === 'config') {
                result.columnPrefs = d.columnPrefs;
                result.cleaningOptions = d.cleaningOptions;
                result.importHistory = d.importHistory;
            } else {
                result[colName] = d.data || [];
            }
        } else {
            if (colName !== 'config') result[colName] = [];
        }
    });

    return result;
};
