import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';

// Helper para obtener config desde window.ENV_CONFIG (PRIORIDAD), localStorage (fallback) o import.meta.env (dev)
const getConfig = () => {
    const getVar = (key, localKey) => {
        // 1. window.ENV_CONFIG (GitHub Secrets)
        if (typeof window !== 'undefined' && window.ENV_CONFIG && window.ENV_CONFIG[key]) {
            return window.ENV_CONFIG[key];
        }
        // 2. localStorage (configuración manual)
        if (typeof window !== 'undefined') {
            const val = localStorage.getItem(localKey);
            if (val) return val;
        }
        // 3. import.meta.env (desarrollo local)
        return import.meta.env[`VITE_${key}`] || '';
    };

    return {
        apiKey: getVar('FIREBASE_API_KEY', 'isp_firebase_api_key'),
        authDomain: getVar('FIREBASE_AUTH_DOMAIN', 'isp_firebase_auth_domain'),
        projectId: getVar('FIREBASE_PROJECT_ID', 'isp_firebase_project_id'),
        storageBucket: getVar('FIREBASE_STORAGE_BUCKET', 'isp_firebase_storage_bucket'),
        messagingSenderId: getVar('FIREBASE_MESSAGING_SENDER_ID', 'isp_firebase_messaging_sender_id'),
        appId: getVar('FIREBASE_APP_ID', 'isp_firebase_app_id'),
    };
};

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

    // 4. Config
    await setDoc(doc(database, 'backups_history', versionId, 'data', 'config'), {
        columnPrefs: data.columnPrefs || {},
        cleaningOptions: data.cleaningOptions || {},
        importHistory: data.importHistory || [],
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
    };
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
