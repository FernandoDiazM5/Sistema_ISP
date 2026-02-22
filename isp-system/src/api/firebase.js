import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    getDocs,
    writeBatch,
    deleteDoc,
    onSnapshot,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    query,
    where
} from 'firebase/firestore';
import { CONFIG } from '../utils/constants';

// Obtener configuración de Firebase desde CONFIG
const getConfig = () => CONFIG.FIREBASE;

let db = null;
let app = null;

// ===================== OFFLINE QUEUE INTERCEPTOR =====================
let offlineCallback = null;
export const setOfflineQueueCallback = (cb) => {
    offlineCallback = cb;
};

export const initFirebase = () => {
    const config = getConfig();
    if (!config || !config.apiKey || !config.projectId) {
        console.warn('Firebase config missing');
        return null;
    }

    if (!app) {
        try {
            app = initializeApp(config);
            // Inicializar Firestore con persistencia moderna v9/v10
            db = initializeFirestore(app, {
                localCache: persistentLocalCache({
                    tabManager: persistentMultipleTabManager()
                })
            });

            console.log('Firebase initialized with persistence');
        } catch (e) {
            console.error('Error initializing Firebase', e);
        }
    }
    return db;
};

export const getFirebaseApp = () => {
    if (!app) {
        initFirebase();
    }
    return app;
};

// ===================== EXPORTED UTILS =====================

/**
 * Guarda un documento en una colección específica (con soporte Offline Queue)
 * @param {string} collectionName 
 * @param {object} data - Debe incluir 'id' si es posible
 * @returns {Promise<boolean>}
 */
export const saveDocument = async (collectionName, data) => {
    const database = initFirebase();
    if (!database) return false;

    const docId = data.id || doc(collection(database, collectionName)).id;
    const finalData = { ...data, updatedAt: new Date().toISOString() };
    if (!finalData.id) finalData.id = docId;

    try {
        await setDoc(doc(database, collectionName, docId), finalData, { merge: true });
        return true;
    } catch (error) {
        console.error(`Error saving document to ${collectionName}:`, error);
        // Si no hay red, la petición de Firebase suele lanzar 'unavailable'
        if (error.code === 'unavailable' || !navigator.onLine) {
            console.log(`Guardado offline encolado: ${collectionName}/${docId}`);
            if (offlineCallback) offlineCallback({ type: 'save', collectionName, id: docId, data: finalData });
        }
        return false;
    }
};

/**
 * Guarda un documento sin interceptar errores para purgar la cola interna
 */
export const saveDocumentDirect = async (collectionName, data) => {
    const database = initFirebase();
    if (!database) throw new Error('Firebase no configurado');
    const docRef = doc(database, collectionName, data.id);
    await setDoc(docRef, data, { merge: true });
};

/**
 * Guarda multiples documentos en batch
 * @param {string} collectionName 
 * @param {Array} items 
 */
export const saveBatchDocuments = async (collectionName, items) => {
    const database = initFirebase();
    if (!database) return false;

    const BATCH_SIZE = 450;
    try {
        for (let i = 0; i < items.length; i += BATCH_SIZE) {
            const batch = writeBatch(database);
            const chunk = items.slice(i, i + BATCH_SIZE);

            chunk.forEach(item => {
                const docRef = doc(database, collectionName, item.id);
                batch.set(docRef, { ...item, updatedAt: new Date().toISOString() }, { merge: true });
            });

            await batch.commit();
        }
        return true;
    } catch (error) {
        console.error(`Error saving batch to ${collectionName}:`, error);
        return false;
    }
};

/**
 * Escucha cambios en tiempo real en una colección
 * @param {string} collectionName 
 * @param {function} callback 
 * @returns {function} unsubscribe
 */
export const subscribeToCollection = (collectionName, callback) => {
    const database = initFirebase();
    if (!database) return () => { };

    // TODO: Add support for queries/filters if needed
    const q = collection(database, collectionName);

    return onSnapshot(q, (snapshot) => {
        const items = [];
        snapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() });
        });
        callback(items);
    }, (error) => {
        console.error(`Error listening to ${collectionName}:`, error);
    });
};

/**
 * Escucha cambios en tiempo real SÓLO en tickets abiertos para ahorrar cuotas de lectura API
 * @param {function} callback
 * @returns {function} unsubscribe
 */
export const subscribeToOpenTickets = (callback) => {
    const database = initFirebase();
    if (!database) return () => { };

    const openStatus = ['EST-01', 'EST-02', 'EST-03', 'Abierto', 'En Proceso', 'Escalado'];
    const q = query(
        collection(database, 'tickets'),
        where('estado', 'in', openStatus)
    );

    return onSnapshot(q, (snapshot) => {
        const items = [];
        snapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() });
        });
        callback(items);
    }, (error) => {
        console.error(`Error en Stream Híbrido de Tickets:`, error);
    });
};

/**
 * Elimina un documento (con soporte Offline Queue)
 */
export const deleteDocument = async (collectionName, docId) => {
    const database = initFirebase();
    if (!database) return false;

    try {
        await deleteDoc(doc(database, collectionName, docId));
        return true;
    } catch (error) {
        console.error(`Error deleting from ${collectionName}:`, error);
        if (error.code === 'unavailable' || !navigator.onLine) {
            console.log(`Borrado offline encolado para ${collectionName}/${docId}`);
            if (offlineCallback) offlineCallback({ type: 'delete', collectionName, id: docId });
        }
        return false;
    }
};

/**
 * Elimina un documento sin interceptar errores. Útil para reintentar desde la Offline Queue.
 */
export const deleteDocumentDirect = async (collectionName, docId) => {
    const database = initFirebase();
    if (!database) throw new Error('Firebase no configurado');
    await deleteDoc(doc(database, collectionName, docId));
};

/**
 * Extrae todos los documentos de las colecciones activas para una sincronizacion viva
 * Si pasamos lastSyncTimestamp, realizará una sincronización Delta (incremental).
 * @param {string|null} lastSyncTimestamp Fecha ISO de la ultima sincronizacion
 * @param {function} onProgress Callback para la barra de progreso
 */
export const pullLiveCollections = async (lastSyncTimestamp = null, onProgress = (info) => { }) => {
    const database = initFirebase();
    if (!database) throw new Error('Firebase no configurado');

    const collectionsToSync = [
        'clients', 'tickets', 'averias', 'tecnicos', 'equipos',
        'visitas', 'instalaciones', 'derivaciones', 'postVenta',
        'sesionesRemoto', 'movimientosEquipos', 'requerimientos',
        'whatsappLogs', 'templates', 'whatsappCategories',
        'categorias', 'subcategorias', 'prioridadesSLA',
        'estadosCatalogo', 'catalogoServicios', 'tiposRequerimiento'
    ];

    const data = {};
    let currentStep = 0;
    const totalSteps = collectionsToSync.length;

    for (const colName of collectionsToSync) {
        currentStep++;
        onProgress({
            step: currentStep,
            totalSteps,
            label: `Sincronizando ${colName}...`,
            percent: Math.round((currentStep / totalSteps) * 100)
        });

        try {
            const colRef = collection(database, colName);
            let q = colRef;

            if (lastSyncTimestamp) {
                // Sincronización Delta Incremental
                q = query(colRef, where('updatedAt', '>', lastSyncTimestamp));
            }

            const querySnapshot = await getDocs(q);
            const items = [];
            querySnapshot.forEach(doc => {
                items.push({ id: doc.id, ...doc.data() });
            });
            data[colName] = items;
        } catch (e) {
            console.error(`Error al descargar coleccion viva ${colName}:`, e);
            data[colName] = [];
        }
    }

    return data;
};

// ===================== MIGRATION HELPERS (LEGACY SUPPORT) =====================

// ===================== MIGRATION HELPERS (LEGACY SUPPORT) =====================

/**
 * Migra datos de chunks a colecciones
 * @param {object} legacyData 
 */
export const migrateDataToCollections = async (legacyData) => {
    const database = initFirebase();
    if (!database) return false;

    console.log('Iniciando migración de datos...');
    const COLLECTIONS = [
        'clients', 'tickets', 'averias', 'tecnicos', 'equipos', 'visitas',
        'instalaciones', 'derivaciones', 'postVenta', 'sesionesRemoto',
        'movimientosEquipos', 'whatsappLogs', 'templates'
    ];

    try {
        const batchSize = 450;
        let batch = writeBatch(database);
        let operationCount = 0;

        for (const colName of COLLECTIONS) {
            const items = legacyData[colName] || [];
            console.log(`Migrando ${items.length} items de ${colName}...`);

            for (const item of items) {
                if (!item.id) continue;

                const docRef = doc(database, colName, item.id);
                // Asegurar que tengan createdAt/updatedAt
                const dataToSave = {
                    ...item,
                    updatedAt: new Date().toISOString()
                };
                if (!dataToSave.createdAt) dataToSave.createdAt = new Date().toISOString();

                batch.set(docRef, dataToSave, { merge: true });
                operationCount++;

                if (operationCount >= batchSize) {
                    await batch.commit();
                    batch = writeBatch(database);
                    operationCount = 0;
                }
            }
        }

        if (operationCount > 0) {
            await batch.commit();
        }

        // Migrar Configuración
        await setDoc(doc(database, 'config', 'app_settings'), {
            columnPrefs: legacyData.columnPrefs || {},
            cleaningOptions: legacyData.cleaningOptions || {},
            importHistory: legacyData.importHistory || [],
            branding: legacyData.branding || {},
            customRolePermissions: legacyData.customRolePermissions || null,
            whatsappCategories: legacyData.whatsappCategories || [],
        }, { merge: true });

        console.log('Migración completada exitosamente.');
        return true;
    } catch (error) {
        console.error('Error during migration:', error);
        return false;
    }
};

// ===================== HELPERS =====================
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Tamaño máximo de clientes por chunk (Firestore doc ~1MB limit)
const CLIENT_CHUNK_SIZE = 200;

// ===================== PUSH (SUBIR RESPALDO) =====================
// TODO: Todo se guarda SÓLO en backups_history/{versionId}/data/*
// Ya no se escriben colecciones separadas "backups" ni "clients"
// onProgress(info) → { step, totalSteps, label, percent }
export const pushToCloud = async (data, onProgress = (info) => { }) => {
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
        'movimientosEquipos', 'requerimientos', 'whatsappLogs', 'templates',
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
        'movimientosEquipos', 'requerimientos', 'whatsappLogs', 'templates',
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
        requerimientos: collectionsData.requerimientos || [],
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
    if (!database) return () => { };

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
