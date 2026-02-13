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

    const batch = writeBatch(database);
    const empresaId = 'isp_default';

    // === CLIENTES: CHUNKING (evitar límite 1MB) ===
    const CHUNK_SIZE = 400;
    const clientChunks = [];
    for (let i = 0; i < (data.clients || []).length; i += CHUNK_SIZE) {
        clientChunks.push(data.clients.slice(i, i + CHUNK_SIZE));
    }

    clientChunks.forEach((chunk, index) => {
        const ref = doc(database, 'backups', `${empresaId}_clients_${index}`);
        batch.set(ref, {
            data: chunk,
            chunkIndex: index,
            totalChunks: clientChunks.length,
            updatedAt: new Date().toISOString()
        });
    });

    // === COLECCIONES PRINCIPALES ===
    const collections = [
        'tickets', 'averias', 'tecnicos', 'equipos', 'visitas',
        'instalaciones', 'derivaciones', 'postVenta', 'sesionesRemoto',
        'movimientosEquipos', 'whatsappLogs', 'templates'
    ];

    collections.forEach(col => {
        const ref = doc(database, 'backups', `${empresaId}_${col}`);
        batch.set(ref, { data: data[col] || [], updatedAt: new Date().toISOString() });
    });

    // === CONFIGURACIÓN Y METADATA ===
    // Guardamos preferencias y otros datos pequeños en un solo doc 'config'
    const configRef = doc(database, 'backups', `${empresaId}_config`);
    batch.set(configRef, {
        columnPrefs: data.columnPrefs || {},
        cleaningOptions: data.cleaningOptions || {},
        importHistory: data.importHistory || [],
        updatedAt: new Date().toISOString()
    });

    // Metadata General
    const metaRef = doc(database, 'backups', `${empresaId}_meta`);
    batch.set(metaRef, {
        lastSync: new Date().toISOString(),
        totalClients: (data.clients || []).length,
        clientChunks: clientChunks.length
    });

    await batch.commit();
    return true;
};

// Sincronizar bajada (Full pull)
export const pullFromCloud = async () => {
    const database = initFirebase();
    if (!database) throw new Error('Firebase no configurado');

    const empresaId = 'isp_default';

    // 1. Metadata
    const metaSnap = await getDoc(doc(database, 'backups', `${empresaId}_meta`));
    const meta = metaSnap.exists() ? metaSnap.data() : { clientChunks: 1 };

    // 2. Clientes (Chunks)
    let allClients = [];
    const numChunks = meta.clientChunks || 1;
    const chunkPromises = [];
    for (let i = 0; i < numChunks; i++) {
        chunkPromises.push(getDoc(doc(database, 'backups', `${empresaId}_clients_${i}`)));
    }

    // 3. Otras Colecciones
    const collections = [
        'tickets', 'averias', 'tecnicos', 'equipos', 'visitas',
        'instalaciones', 'derivaciones', 'postVenta', 'sesionesRemoto',
        'movimientosEquipos', 'whatsappLogs', 'templates', 'config'
    ];

    const colPromises = collections.map(col => getDoc(doc(database, 'backups', `${empresaId}_${col}`)));

    // Ejecutar todo en paralelo
    const [chunkSnaps, ...colSnaps] = await Promise.all([
        Promise.all(chunkPromises),
        ...colPromises
    ]);

    // Procesar Clientes
    chunkSnaps.forEach(snap => {
        if (snap.exists()) {
            allClients = [...allClients, ...(snap.data().data || [])];
        }
    });

    // Procesar Colecciones
    const result = { clients: allClients };

    // Mapear resultados de colecciones
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
            // Default arrays if missing
            if (colName !== 'config') result[colName] = [];
        }
    });

    return result;
};
