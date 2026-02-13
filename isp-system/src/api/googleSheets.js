import { CONFIG } from '../utils/constants';
import useStore from '../store/useStore';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

function getAccessToken() {
  // Leer el usuario directamente del estado global (ya cargado desde IndexedDB)
  const user = useStore.getState().user;
  return user?.accessToken || null;
}

export async function readSheet(sheetName, range = '') {
  const token = getAccessToken();
  if (!token || !CONFIG.GOOGLE_SHEET_ID) {
    console.warn('Google Sheets API: No token or sheet ID configured. Using demo data.');
    return null;
  }

  const rangeParam = range ? `${sheetName}!${range}` : sheetName;
  const url = `${SHEETS_API}/${CONFIG.GOOGLE_SHEET_ID}/values/${encodeURIComponent(rangeParam)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error reading sheet');
  }

  const data = await res.json();
  return data.values || [];
}

export async function writeSheet(sheetName, data) {
  const token = getAccessToken();
  if (!token || !CONFIG.GOOGLE_SHEET_ID) return null;

  const url = `${SHEETS_API}/${CONFIG.GOOGLE_SHEET_ID}/values/${encodeURIComponent(sheetName)}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: data }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error writing sheet');
  }

  return res.json();
}

export async function appendToSheet(sheetName, rows) {
  const token = getAccessToken();
  if (!token || !CONFIG.GOOGLE_SHEET_ID) return null;

  const url = `${SHEETS_API}/${CONFIG.GOOGLE_SHEET_ID}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: rows }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error appending to sheet');
  }

  return res.json();
}

export async function getAuthUsers() {
  try {
    const rows = await readSheet(CONFIG.AUTH_SHEET);
    if (!rows || rows.length < 2) return [];

    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      return obj;
    });
  } catch {
    return [];
  }
}
