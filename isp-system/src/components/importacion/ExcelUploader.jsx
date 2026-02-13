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

      // Headers en fila 2, datos desde fila 3 (range: 1 = skip fila 1 que es título)
      // defval: '' asegura que celdas vacías sean strings vacíos, no undefined
      const data = XLSX.utils.sheet_to_json(ws, {
        range: 1,
        defval: '',
        raw: false  // Forzar lectura como texto formateado, no valores raw
      });

      onDataLoaded(data, file.name);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
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
        accept=".xlsx,.xls"
        className="hidden"
        onChange={e => handleFile(e.target.files[0])}
      />

      <div className="mb-6 text-accent-blue group-hover:scale-110 transition-transform inline-block">
        <CloudUpload size={48} strokeWidth={1.5} />
      </div>

      <h3 className="text-lg font-semibold mb-2">
        {loading ? 'Procesando archivo...' : 'Arrastra tu archivo Excel aquí'}
      </h3>

      <p className="text-text-muted text-[13px] mb-6 max-w-[400px] mx-auto">
        El sistema aplicará automáticamente las 9 reglas de limpieza:
        separación de nombres, corrección de móviles, detección de tecnología, parseo de deuda y más.
      </p>

      <div className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-accent-blue text-white text-sm font-semibold">
        <FileSpreadsheet size={16} />
        Seleccionar archivo Excel
      </div>

      <p className="mt-4 text-[11px] text-text-muted">
        Soporta .xlsx, .xls — Formato estándar "Lista de Usuarios" del ISP externo
      </p>
    </div>
  );
}
