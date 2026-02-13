import * as XLSX from 'xlsx';
import useStore from '../store/useStore';
import { CONFIG } from '../utils/constants'; // Asumiendo que existe, si no, usa las variables de entorno directo

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1010107284451-t2ibr0o7i7e7vnv4qftvgvov7hl387kj.apps.googleusercontent.com';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || 'AIzaSyDcQj9F2Sj-vLwr3Bht80fPsii1SkrVi0A';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive';

let tokenClient = null;
let gapiInited = false;
let gisInited = false;

export function isDriveReady() {
  return gapiInited && gisInited;
}

export function getInitStatus() {
  return { gapiInited, gisInited };
}

// Helper para obtener el token persistente desde IndexedDB (vía Store)
function getAuthToken() {
  const user = useStore.getState().user;
  return user?.accessToken || null;
}

export async function initGoogleDrive() {
  if (gapiInited && gisInited) return true;

  // Wait for global libs
  if (!window.gapi || !window.google) {
    return new Promise((resolve) => {
      const check = () => {
        if (window.gapi && window.google) resolve(doInit());
        else setTimeout(check, 500);
      };
      check();
    });
  }

  return doInit();
}

async function doInit() {
  // Init GAPI
  if (!gapiInited) {
    await new Promise((resolve, reject) => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
          });
          gapiInited = true;
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  // Init GIS
  if (!gisInited) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: () => {},
    });
    gisInited = true;
  }

  return true;
}

export function requestAuth() {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject(new Error('Google no inicializado'));
    tokenClient.callback = (resp) => {
      if (resp.error) reject(new Error(resp.error));
      else resolve(resp);
    };
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

export function hasToken() {
  try {
    return !!getAuthToken();
  } catch {
    return false;
  }
}

export async function listDriveFiles() {
  const token = getAuthToken();
  if (!token) throw new Error('Sin autenticación');

  const q = "mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=20&fields=files(id,name,mimeType,modifiedTime)`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error(`Error al listar archivos: ${response.status}`);
  const data = await response.json();
  return data.files || [];
}

export async function importDriveFile(fileId, mimeType) {
  const token = getAuthToken();
  if (!token) throw new Error('Sin autenticación');

  let arrayBuffer;
  const headers = { Authorization: `Bearer ${token}` };

  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`Error exportación: ${response.status}`);
    arrayBuffer = await response.arrayBuffer();
  } else {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`Error descarga: ${response.status}`);
    arrayBuffer = await response.arrayBuffer();
  }

  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  return {
    workbook,
    sheetNames: workbook.SheetNames,
  };
}

export function parseSheet(workbook, sheetName) {
  const ws = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(ws, { range: 1 });
}

export async function saveToDrive(clients, existingFileId = null) {
  const token = getAuthToken();
  if (!token) throw new Error('Sin autenticación');

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(clients);
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  if (existingFileId) {
    // Update existing
    const url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
    await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': blob.type,
      },
      body: blob,
    });
    return existingFileId;
  }

  // Create new
  const metadata = {
    name: `ISP_Clientes_${new Date().toISOString().slice(0, 10)}.xlsx`,
    mimeType: blob.type,
  };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Error al crear: ${res.status}`);
  const data = await res.json();
  return data.id;
}
