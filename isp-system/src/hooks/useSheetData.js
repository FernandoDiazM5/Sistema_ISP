import { useState, useCallback } from 'react';
import { readSheet, writeSheet } from '../api/googleSheets';
import { transformClientData } from '../api/dataTransformer';
import useStore from '../store/useStore';

export default function useSheetData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const setClients = useStore(s => s.setClients);

  const fetchFromSheets = useCallback(async (sheetName = 'Sheet1') => {
    setLoading(true);
    setError(null);
    try {
      const rows = await readSheet(sheetName);
      if (!rows || rows.length < 2) {
        setError('No se encontraron datos en la hoja');
        return [];
      }

      const headers = rows[0];
      const data = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i] || ''; });
        return obj;
      });

      const transformed = data.map(transformClientData);
      setClients(transformed);
      return transformed;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setClients]);

  const saveToSheets = useCallback(async (sheetName, data) => {
    setLoading(true);
    setError(null);
    try {
      await writeSheet(sheetName, data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchFromSheets, saveToSheets, loading, error };
}
