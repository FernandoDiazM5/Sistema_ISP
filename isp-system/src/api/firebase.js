import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, writeBatch, deleteDoc, onSnapshot } from 'firebase/firestore';
import { CONFIG } from '../utils/constants';

// Obtener configuración de Firebase desde CONFIG (usa getters lazy)
const getConfig = () => CONFIG.FIREBASE;

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

// Exportar la instancia de app para que otros módulos (Auth, etc.) la reutilicen
export const getFirebaseApp = () => {
    if (!app) {
        initFirebase();
    }
    return app;
};

// ===================== HELPERS =====================
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Tamaño máximo de clientes por chunk (Firestore doc ~1MB limit)
const CLIENT_CHUNK_SIZE = 200;

// ===================== PUSH (SUBIR RESPALDO) =====================
// TODO: Todo se guarda SÓLO en backups_history/{versionId}/data/*
// Ya no se escriben colecciones separadas "backups" ni "clients"
// onProgress(info) → { step, totalSteps, label, percent }
export const pushToCloud = async (data, onProgress = () => { }) => {
    const database = initFirebase();
    if (!database) throw new Error('Firebase no configurado');

    const now = new Date();
    const versionId = now.toISOString().replace(/[:.]/g, '-');
    const timestamp = now.toISOString();
    const clients = data.clients || [];

    // Calcular pasos totales
    const clientChunkCount = Math.max(1, Math.ceil(clients.length / CLIENT_CHUNK_SIZE));
    // Steps: 1(meta) + clientChunks + 1(collections) + 1(config) + 1(_meta) = clientChunks + 4
    const totalSteps = clientChunkCount + 4;
    let currentStep = 0;

    const reportProgress = (label) => {
        currentStep++;
        onProgress({
            step: currentStep,
            totalSteps,
            label,
            percent: Math.round((currentStep / totalSteps) * 100),
        });
    };

    // 1. Escribir metadata de la versión
    const versionMeta = {
        createdAt: timestamp,
        versionId,
        totalClients: clients.length,
        totalTickets: (data.tickets || []).length,
        totalAverias: (data.averias || []).length,
        totalEquipos: (data.equipos || []).length,
        totalVisitas: (data.visitas || []).length,
        totalTecnicos: (data.tecnicos || []).length,
        label: `Respaldo ${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE')}`,
    };

    await setDoc(doc(database, 'backups_history', versionId), versionMeta);
    reportProgress('Metadata guardada');

    // 2. Guardar clientes en chunks
    const clientChunks = [];
    for (let i = 0; i < clients.length; i += CLIENT_CHUNK_SIZE) {
        clientChunks.push(clients.slice(i, i + CLIENT_CHUNK_SIZE));
    }

    for (let i = 0; i < clientChunks.length; i++) {
        const chunkRef = doc(database, 'backups_history', versionId, 'data', `clients_${i}`);
        await setDoc(chunkRef, { data: clientChunks[i] });
        reportProgress(`Clientes ${i + 1}/${clientChunks.length}`);
        if (i < clientChunks.length - 1) await delay(300);
    }

    // 3. Guardar cada colección por separado (evitar superar 1MB por doc)
    const COLLECTION_NAMES = [
        'tickets', 'averias', 'tecnicos', 'equipos', 'visitas',
        'instalaciones', 'derivaciones', 'postVenta', 'sesionesRemoto',
        'movimientosEquipos', 'whatsappLogs', 'templates',
    ];

    const MAX_DOC_BYTES = 800000; // 800KB safe limit (Firestore max 1MB)
    const collectionChunks = {}; // Track chunks per collection for _meta

    for (const colName of COLLECTION_NAMES) {
        const colData = data[colName] || [];
        const jsonSize = new Blob([JSON.stringify(colData)]).size;

        if (jsonSize > MAX_DOC_BYTES && Array.isArray(colData) && colData.length > 0) {
            // Split large collection into chunks
            const chunkSize = Math.ceil(colData.length / Math.ceil(jsonSize / MAX_DOC_BYTES));
            const chunks = [];
            for (let i = 0; i < colData.length; i += chunkSize) {
                chunks.push(colData.slice(i, i + chunkSize));
            }
            collectionChunks[colName] = chunks.length;
            for (let i = 0; i < chunks.length; i++) {
                await setDoc(doc(database, 'backups_history', versionId, 'data', `${colName}_${i}`), { data: chunks[i] });
                if (i < chunks.length - 1) await delay(200);
            }
        } else {
            // Single document
            collectionChunks[colName] = 1;
            await setDoc(doc(database, 'backups_history', versionId, 'data', colName), { data: colData });
        }
        await delay(150);
    }
    reportProgress('Colecciones guardadas');

    await delay(300);

    // 4. Config (includes branding + role permissions)
    await setDoc(doc(database, 'backups_history', versionId, 'data', 'config'), {
        columnPrefs: data.columnPrefs || {},
        cleaningOptions: data.cleaningOptions || {},
        importHistory: data.importHistory || [],
        branding: data.branding || {},
        customRolePermissions: data.customRolePermissions || null,
        whatsappCategories: data.whatsappCategories || [],
    });
    reportProgress('Configuración guardada');

    // 5. Meta de datos — incluye info de chunks por colección
    await setDoc(doc(database, 'backups_history', versionId, 'data', '_meta'), {
        clientChunks: clientChunks.length,
        collectionChunks, // e.g. { tickets: 2, averias: 1, ... }
    });
    reportProgress('¡Backup completado!');

    return { success: true, versionId, timestamp };
};

// ===================== PULL LATEST (RESTAURAR ÚLTIMO) =====================
export const pullFromCloud = async () => {
    const database = initFirebase();
    if (!database) throw new Error('Firebase no configurado');

    const versions = await listBackupVersions();
    if (versions.length === 0) throw new Error('No hay backups disponibles');

    return pullBackupVersion(versions[0].id);
};

// ===================== LISTAR VERSIONES DE BACKUP =====================
export const listBackupVersions = async () => {
    const database = initFirebase();
    if (!database) throw new Error('Firebase no configurado');

    const versionsSnap = await getDocs(collection(database, 'backups_history'));
    const versions = [];

    versionsSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.createdAt) {
            versions.push({ id: docSnap.id, ...data });
        }
    });

    versions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return versions;
};

// ===================== RESTAURAR VERSIÓN ESPECÍFICA =====================
export const pullBackupVersion = async (versionId) => {
    const database = initFirebase();
    if (!database) throw new Error('Firebase no configurado');

    // 1. Leer metadata
    const metaSnap = await getDoc(doc(database, 'backups_history', versionId, 'data', '_meta'));
    const meta = metaSnap.exists() ? metaSnap.data() : { clientChunks: 0, collectionChunks: {} };

    // 2. Leer clientes en chunks
    let allClients = [];
    for (let i = 0; i < (meta.clientChunks || 0); i++) {
        const chunkSnap = await getDoc(doc(database, 'backups_history', versionId, 'data', `clients_${i}`));
        if (chunkSnap.exists()) {
            allClients = [...allClients, ...(chunkSnap.data().data || [])];
        }
    }

    // 3. Leer colecciones (cada una puede tener N chunks)
    const COLLECTION_NAMES = [
        'tickets', 'averias', 'tecnicos', 'equipos', 'visitas',
        'instalaciones', 'derivaciones', 'postVenta', 'sesionesRemoto',
        'movimientosEquipos', 'whatsappLogs', 'templates',
    ];

    const collectionsData = {};
    const cChunks = meta.collectionChunks || {};

    for (const colName of COLLECTION_NAMES) {
        const numChunks = cChunks[colName] || 1;
        let colData = [];

        if (numChunks > 1) {
            // Read multiple chunks
            for (let i = 0; i < numChunks; i++) {
                const snap = await getDoc(doc(database, 'backups_history', versionId, 'data', `${colName}_${i}`));
                if (snap.exists()) colData = [...colData, ...(snap.data().data || [])];
            }
        } else {
            // Read single document
            const snap = await getDoc(doc(database, 'backups_history', versionId, 'data', colName));
            if (snap.exists()) colData = snap.data().data || [];
        }
        collectionsData[colName] = colData;
    }

    // 4. Config
    const configSnap = await getDoc(doc(database, 'backups_history', versionId, 'data', 'config'));
    const configData = configSnap.exists() ? configSnap.data() : {};

    // 5. Armar resultado completo
    return {
        clients: allClients,
        tickets: collectionsData.tickets || [],
        averias: collectionsData.averias || [],
        tecnicos: collectionsData.tecnicos || [],
        equipos: collectionsData.equipos || [],
        visitas: collectionsData.visitas || [],
        instalaciones: collectionsData.instalaciones || [],
        derivaciones: collectionsData.derivaciones || [],
        postVenta: collectionsData.postVenta || [],
        sesionesRemoto: collectionsData.sesionesRemoto || [],
        movimientosEquipos: collectionsData.movimientosEquipos || [],
        whatsappLogs: collectionsData.whatsappLogs || [],
        templates: collectionsData.templates || [],
        columnPrefs: configData.columnPrefs,
        cleaningOptions: configData.cleaningOptions,
        importHistory: configData.importHistory,
        branding: configData.branding,
        customRolePermissions: configData.customRolePermissions,
        whatsappCategories: configData.whatsappCategories,
    };
};

// ===================== LIVE DATA SYNC =====================
// Sincronizacion en tiempo real: todos los datos se guardan en live_data/
// y se escuchan cambios con onSnapshot para reflejar en todos los clientes

const LIVE_CHUNK_SIZE = 200;

export const pushLiveData = async (data, pusherId) => {
    const database = initFirebase();
    if (!database) return false;

    try {
        const clients = data.clients || [];

        // 1. Guardar clientes en chunks
        const clientChunks = [];
        for (let i = 0; i < clients.length; i += LIVE_CHUNK_SIZE) {
            clientChunks.push(clients.slice(i, i + LIVE_CHUNK_SIZE));
        }

        for (let i = 0; i < clientChunks.length; i++) {
            await setDoc(doc(database, 'live_data', `clients_${i}`), { data: clientChunks[i] });
        }

        // 2. Guardar cada coleccion
        const COLLECTIONS = [
            'tickets', 'averias', 'tecnicos', 'equipos', 'visitas',
            'instalaciones', 'derivaciones', 'postVenta', 'sesionesRemoto',
            'movimientosEquipos', 'whatsappLogs', 'templates',
        ];

        const MAX_DOC_BYTES = 800000;
        const collectionChunks = {};

        for (const colName of COLLECTIONS) {
            const colData = data[colName] || [];
            const jsonSize = new Blob([JSON.stringify(colData)]).size;

            if (jsonSize > MAX_DOC_BYTES && Array.isArray(colData) && colData.length > 0) {
                const chunkSize = Math.ceil(colData.length / Math.ceil(jsonSize / MAX_DOC_BYTES));
                const chunks = [];
                for (let i = 0; i < colData.length; i += chunkSize) {
                    chunks.push(colData.slice(i, i + chunkSize));
                }
                collectionChunks[colName] = chunks.length;
                for (let i = 0; i < chunks.length; i++) {
                    await setDoc(doc(database, 'live_data', `${colName}_${i}`), { data: chunks[i] });
                }
            } else {
                collectionChunks[colName] = 1;
                await setDoc(doc(database, 'live_data', colName), { data: colData });
            }
        }

        // 3. Config
        await setDoc(doc(database, 'live_data', 'config'), {
            columnPrefs: data.columnPrefs || {},
            cleaningOptions: data.cleaningOptions || {},
            importHistory: data.importHistory || [],
            branding: data.branding || {},
            customRolePermissions: data.customRolePermissions || null,
            whatsappCategories: data.whatsappCategories || [],
        });

        // 4. Meta (triggers onSnapshot for other clients)
        await setDoc(doc(database, 'live_data', '_meta'), {
            clientChunks: clientChunks.length,
            collectionChunks,
            updatedAt: new Date().toISOString(),
            pusherId: pusherId || 'unknown',
            totalClients: clients.length,
        });

        return true;
    } catch (error) {
        console.error('Error pushing live data:', error);
        return false;
    }
};

export const pullLiveData = async () => {
    const database = initFirebase();
    if (!database) return null;

    try {
        // 1. Leer meta
        const metaSnap = await getDoc(doc(database, 'live_data', '_meta'));
        if (!metaSnap.exists()) return null;
        const meta = metaSnap.data();

        // 2. Leer clientes
        let allClients = [];
        for (let i = 0; i < (meta.clientChunks || 0); i++) {
            const snap = await getDoc(doc(database, 'live_data', `clients_${i}`));
            if (snap.exists()) allClients = [...allClients, ...(snap.data().data || [])];
        }

        // 3. Leer colecciones
        const COLLECTIONS = [
            'tickets', 'averias', 'tecnicos', 'equipos', 'visitas',
            'instalaciones', 'derivaciones', 'postVenta', 'sesionesRemoto',
            'movimientosEquipos', 'whatsappLogs', 'templates',
        ];

        const collectionsData = {};
        const cChunks = meta.collectionChunks || {};

        for (const colName of COLLECTIONS) {
            const numChunks = cChunks[colName] || 1;
            let colData = [];
            if (numChunks > 1) {
                for (let i = 0; i < numChunks; i++) {
                    const snap = await getDoc(doc(database, 'live_data', `${colName}_${i}`));
                    if (snap.exists()) colData = [...colData, ...(snap.data().data || [])];
                }
            } else {
                const snap = await getDoc(doc(database, 'live_data', colName));
                if (snap.exists()) colData = snap.data().data || [];
            }
            collectionsData[colName] = colData;
        }

        // 4. Config
        const configSnap = await getDoc(doc(database, 'live_data', 'config'));
        const configData = configSnap.exists() ? configSnap.data() : {};

        return {
            clients: allClients,
            ...collectionsData,
            columnPrefs: configData.columnPrefs,
            cleaningOptions: configData.cleaningOptions,
            importHistory: configData.importHistory,
            branding: configData.branding,
            customRolePermissions: configData.customRolePermissions,
            whatsappCategories: configData.whatsappCategories,
            _meta: meta,
        };
    } catch (error) {
        console.error('Error pulling live data:', error);
        return null;
    }
};

// Escuchar cambios en tiempo real del documento _meta
// Cuando otro usuario sube datos, el callback se dispara
let liveUnsubscribe = null;

export const subscribeLiveUpdates = (callback) => {
    const database = initFirebase();
    if (!database) return () => {};

    // Cancelar suscripcion anterior si existe
    if (liveUnsubscribe) {
        liveUnsubscribe();
    }

    liveUnsubscribe = onSnapshot(doc(database, 'live_data', '_meta'), (snap) => {
        if (snap.exists()) {
            callback(snap.data());
        }
    }, (error) => {
        console.warn('Live sync listener error:', error);
    });

    return () => {
        if (liveUnsubscribe) {
            liveUnsubscribe();
            liveUnsubscribe = null;
        }
    };
};

// ===================== SETTINGS REALTIME SYNC =====================
// Documento dedicado para settings (branding + permisos de roles)
// Se sincroniza automaticamente al guardar, y se carga al iniciar la app

export const pushSettings = async (settings) => {
    const database = initFirebase();
    if (!database) {
        console.warn('Firebase no configurado, settings solo guardados localmente');
        return false;
    }

    try {
        await setDoc(doc(database, 'settings', 'app'), {
            ...settings,
            updatedAt: new Date().toISOString(),
        });
        return true;
    } catch (error) {
        console.error('Error pushing settings to Firebase:', error);
        return false;
    }
};

export const pullSettings = async () => {
    const database = initFirebase();
    if (!database) return null;

    try {
        const snap = await getDoc(doc(database, 'settings', 'app'));
        if (snap.exists()) {
            return snap.data();
        }
        return null;
    } catch (error) {
        console.error('Error pulling settings from Firebase:', error);
        return null;
    }
};

// ===================== ELIMINAR VERSIÓN =====================
export const deleteBackupVersion = async (versionId) => {
    const database = initFirebase();
    if (!database) throw new Error('Firebase no configurado');

    // Eliminar sub-documentos en data/
    const dataSnap = await getDocs(collection(database, 'backups_history', versionId, 'data'));

    // Usar batch para eliminar (max 500 por batch)
    const docs = [];
    dataSnap.forEach(d => docs.push(d.ref));

    const BATCH_SIZE = 450;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = writeBatch(database);
        docs.slice(i, i + BATCH_SIZE).forEach(ref => batch.delete(ref));
        await batch.commit();
        if (i + BATCH_SIZE < docs.length) await delay(200);
    }

    // Eliminar documento principal
    await deleteDoc(doc(database, 'backups_history', versionId));
    return true;
};
