import { useRef } from 'react';
import { CloudUpload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ExcelUploader({ onDataLoaded, loading }) {
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, {
        type: 'array',
        cellText: false,    // Mantener formato original
        cellDates: false,   // No parsear fechas automáticamente
        raw: false          // No usar valores raw (que pueden ser números)
      });
      const ws = wb.Sheets[wb.SheetNames[0]];

      // Convertir todo a array de arrays temporalmente para detectar dónde están las cabeceras
      const allRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });

      let headerRowIndex = 0;
      // Buscar en las primeras 10 filas alguna que parezca cabecera
      for (let i = 0; i < Math.min(10, allRows.length); i++) {
        const rowString = allRows[i].join('').toLowerCase();
        if (rowString.includes('nombre') || rowString.includes('id') || rowString.includes('mac') || rowString.includes('ip') || rowString.includes('plan')) {
          headerRowIndex = i;
          break;
        }
      }

      // Procesar finalmente con el range correcto
      const rawData = XLSX.utils.sheet_to_json(ws, {
        range: headerRowIndex,
        defval: '',
        raw: false  // Forzar lectura como texto formateado, no valores raw
      });

      // Mapeo defensivo: Los archivos CSV o Excel sucios pueden tener espacios
      // en los headers (ej. "Nombre " o " Id"). Limpiamos las llaves.
      const sanitizedData = rawData.map(row => {
        const cleanRow = {};
        for (const [key, value] of Object.entries(row)) {
          // Removemos BOM character (\uFEFF) y espacios al inicio/final del header
          const cleanKey = key.replace(/^\uFEFF/, '').trim();
          cleanRow[cleanKey] = value;
        }
        return cleanRow;
      });

      onDataLoaded(sanitizedData, file.name);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      handleFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => fileRef.current?.click()}
      className="bg-bg-card rounded-2xl p-10 border-2 border-dashed border-border text-center cursor-pointer transition-colors hover:border-accent-blue/50 group"
    >
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={e => handleFile(e.target.files[0])}
      />

      <div className="mb-6 text-accent-blue group-hover:scale-110 transition-transform inline-block">
        <CloudUpload size={48} strokeWidth={1.5} />
      </div>

      <h3 className="text-lg font-semibold mb-2">
        {loading ? 'Procesando archivo...' : 'Arrastra tu archivo Excel o CSV aquí'}
      </h3>

      <p className="text-text-muted text-[13px] mb-6 max-w-[400px] mx-auto">
        El sistema aplicará automáticamente las 9 reglas de limpieza:
        separación de nombres, corrección de móviles, detección de tecnología, parseo de deuda y más.
      </p>

      <div className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-accent-blue text-white text-sm font-semibold">
        <FileSpreadsheet size={16} />
        Seleccionar archivo
      </div>

      <p className="mt-4 text-[11px] text-text-muted">
        Soporta .xlsx, .xls, .csv — Formato estándar "Lista de Usuarios" del ISP externo
      </p>
    </div>
  );
}
