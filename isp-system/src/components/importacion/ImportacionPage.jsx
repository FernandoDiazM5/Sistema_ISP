import { useState, useRef } from 'react';
import { Wifi, Download, Database, RefreshCw, Plus, FileSpreadsheet, Archive, Upload, Trash2, ChevronDown, CheckSquare, Square } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import useStore from '../../store/useStore';
import { transformClientData, compareClients, deepMergeClient } from '../../api/dataTransformer';
import ExcelUploader from './ExcelUploader';
import ImportPreview from './ImportPreview';
import ImportProgress from './ImportProgress';
import ImportLog from './ImportLog';
import DataCleaningOptions from './DataCleaningOptions';
import ManualReviewTable from './ManualReviewTable';
import SyncStatus from './SyncStatus';

export default function ImportacionPage() {
  const { clients, importClients, setLastImport, addImportRecord, cleaningOptions, restoreSystem, factoryReset, importHistory, setCleaningOptions, addClientChanges } = useStore();

  const [step, setStep] = useState('upload'); // upload | processing | preview | finished
  const [fileName, setFileName] = useState('');
  const [stats, setStats] = useState({ new: 0, modified: 0, unchanged: 0, total: 0 });
  const [changes, setChanges] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [reviewItems, setReviewItems] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, stage: 'reading' });
  const [importMode, setImportMode] = useState('inteligente'); // completa | inteligente | nuevos
  const [showCleaningOptions, setShowCleaningOptions] = useState(false);
  const [exportTables, setExportTables] = useState(['clients']); // Default una seleccionada
  const [showTableSelect, setShowTableSelect] = useState(false);
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [isExporting, setIsExporting] = useState(false);

  const tablesList = [
    { id: 'clients', label: 'Clientes' },
    { id: 'tickets', label: 'Tickets' },
    { id: 'averias', label: 'Averías' },
    { id: 'visitas', label: 'Visitas Técnicas' },
    { id: 'tecnicos', label: 'Técnicos' },
    { id: 'equipos', label: 'Equipos' },
    { id: 'instalaciones', label: 'Instalaciones' },
    { id: 'postVenta', label: 'Post Venta' },
    { id: 'sesionesRemoto', label: 'Soporte Remoto' },
    { id: 'derivaciones', label: 'Derivaciones' },
    { id: 'importHistory', label: 'Historial Importación' },
    { id: 'whatsappLogs', label: 'Logs WhatsApp' },
    { id: 'templates', label: 'Plantillas' }
  ];

  const handleToggleTable = (id) => {
    setExportTables(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSelectAllTables = () => {
    if (exportTables.length === tablesList.length) {
      setExportTables([]); // Deseleccionar todas
    } else {
      setExportTables(tablesList.map(t => t.id)); // Seleccionar todas
    }
  };

  const handleDataLoaded = (rawRows, name) => {
    setFileName(name);
    setStep('processing');
    setProgress({ current: 0, total: rawRows.length, stage: 'reading' });

    setTimeout(() => {
      setProgress(p => ({ ...p, stage: 'transforming' }));

      // 1. Transformación ETL con reglas seleccionadas
      const manualReview = [];
      const newData = [];

      rawRows.forEach((row, i) => {
        if (i % 50 === 0) setProgress(p => ({ ...p, current: i, stage: 'transforming' }));

        const transformed = transformClientData(row);

        // Evitar procesar basurillas del excel que son filas en blanco con solo comas
        if (!transformed.id && !transformed.nombre) return;

        // Detectar registros que necesitan revisión manual
        if (cleaningOptions.splitMobile) {
          const movil = transformed.movil_1?.replace(/\D/g, '') || '';
          if (movil.length > 0 && movil.length < 9) {
            manualReview.push({ id: transformed.id, nombre: transformed.nombre, tipo: 'movil', campo: 'Móvil', valorOriginal: transformed.movil_1 });
          }
        }
        if (cleaningOptions.inferTechnology && transformed.tecnologia === 'No determinada') {
          manualReview.push({ id: transformed.id, nombre: transformed.nombre, tipo: 'tecnologia', campo: 'Tecnología', valorOriginal: transformed.nodo_router || '—' });
        }

        newData.push(transformed);
      });

      setProgress({ current: rawRows.length, total: rawRows.length, stage: 'comparing' });
      setReviewItems(manualReview);

      // 2. Comparación según modo seleccionado
      const newRecords = [];
      const modifiedRecords = [];
      let unchangedCount = 0;

      // Optimización: Crear mapa de clientes existentes para búsqueda O(1)
      const clientMap = new Map(clients.map(c => [c.id, c]));

      newData.forEach(row => {
        const existing = clientMap.get(row.id);

        if (!existing) {
          newRecords.push(row);
        } else if (importMode !== 'nuevos') {
          const diffs = compareClients(existing, row);
          if (diffs.length > 0) {
            modifiedRecords.push({ id: row.id, nombre: row.nombre, diffs, newData: row });
          } else {
            unchangedCount++;
          }
        } else {
          unchangedCount++;
        }
      });

      setStats({
        new: newRecords.length,
        modified: modifiedRecords.length,
        unchanged: unchangedCount,
        total: newData.length,
      });

      setChanges([
        ...newRecords.map(r => ({ type: 'NEW', data: r })),
        ...modifiedRecords.map(r => ({ type: 'MOD', ...r })),
      ]);

      setProcessedData(newData);
      setProgress({ current: rawRows.length, total: rawRows.length, stage: 'done' });

      setTimeout(() => setStep('preview'), 500);
    }, 100);
  };

  const handleFixReviewItem = (clientId, newValue, tipo) => {
    // 1. Quitar de la lista de revisión
    setReviewItems(prev => prev.filter(item => !(item.id === clientId && item.tipo === tipo)));

    // 2. Determinar campo de la tabla a actualizar
    const fieldMap = {
      'movil': 'movil_1',
      'tecnologia': 'nodo_router'
    };
    const targetField = fieldMap[tipo];
    if (!targetField) return;

    // 3. Actualizar la data procesada globalmente
    const newProcessedData = processedData.map(client => {
      if (client.id === clientId) return { ...client, [targetField]: newValue };
      return client;
    });
    setProcessedData(newProcessedData);

    // 4. Actualizar estado intermedio del render visual (Nuevos o Modificados)
    const newChanges = changes.map(change => {
      const isMatch = change.type === 'NEW' ? change.data.id === clientId : change.id === clientId;
      if (isMatch) {
        if (change.type === 'NEW') {
          return { ...change, data: { ...change.data, [targetField]: newValue } };
        } else {
          const existing = clients.find(c => c.id === clientId);
          const newData = { ...change.newData, [targetField]: newValue };
          const diffs = compareClients(existing, newData);
          return { ...change, newData, diffs };
        }
      }
      return change;
    });
    setChanges(newChanges);
  };

  const handleSkipReviewItem = (clientId, tipo) => {
    // Solo ignorar la advertencia, se aplicarán los datos defectuosos del excel.
    setReviewItems(prev => prev.filter(item => !(item.id === clientId && item.tipo === tipo)));
  };

  const confirmImport = () => {
    let finalData;
    if (importMode === 'completa') {
      finalData = processedData;
    } else if (importMode === 'nuevos') {
      const newIds = new Set(changes.filter(c => c.type === 'NEW').map(c => c.data.id));
      finalData = [...clients, ...processedData.filter(d => newIds.has(d.id))];
    } else {
      // INTELIGENTE 2.0: Optimizado y Seguro
      const modifiedMap = new Map();
      const newRecords = [];

      // Solo guardamos en memoria los que realmente tienen diferencias o son nuevos
      changes.forEach(change => {
        if (change.type === 'MOD') {
          modifiedMap.set(change.id, change.newData);
        } else if (change.type === 'NEW') {
          newRecords.push(change.data);
        }
      });

      // Iteramos la BD existente SOLO una vez y mergeamos seguro
      finalData = clients.map(existingClient => {
        if (modifiedMap.has(existingClient.id)) {
          // DeepMerge: Aplican datos nuevos sin borrar los existentes que Excel no trajo
          return deepMergeClient(existingClient, modifiedMap.get(existingClient.id));
        }
        return existingClient; // Sin tocar
      });

      // Añadimos los registros 100% nuevos
      finalData = [...finalData, ...newRecords];
    }

    importClients(finalData);

    // [NUEVO] Registrar auditoría de cambios para la Pestaña "Cambios"
    if (importMode !== 'completa') {
      const logsToSave = changes
        .filter(c => c.type === 'MOD')
        .map(c => ({
          id: `CCH-${Date.now()}-${c.id}`,
          clientId: c.id,
          fecha: new Date().toISOString(),
          origen: 'Importación Excel',
          archivo: fileName,
          cambios: c.diffs
        }));

      if (logsToSave.length > 0) {
        addClientChanges(logsToSave);
      }
    }

    const importInfo = {
      date: new Date().toISOString(),
      fileName,
      total: stats.total,
      new: stats.new,
      modified: stats.modified,
      unchanged: stats.unchanged,
    };
    setLastImport(importInfo);
    addImportRecord({ ...importInfo, mode: importMode });
    setStep('finished');
  };

  const handleExport = () => {
    const exportData = clients.map(c => ({
      'Id': c.id,
      'Nombre': `${c.nombre}  ${c.estado_cuenta}`,
      'Mac': c.mac,
      'Ip': c.ip,
      'IP Receptor': c.ip_receptor,
      'Ultimo pago': c.ultimo_pago,
      'Tipo estrato': c.tipo_estrato,
      'Dirección Principal': c.direccion,
      'Dirección Servicio': c.direccion_servicio,
      'Dia pago': c.dia_pago,
      'Deuda actual': c.deuda_monto > 0 ? `${c.deuda_meses} S/. ${c.deuda_monto.toFixed(2)}` : '',
      'Correo': c.email || c.notas_tecnicas,
      'Plan': c.plan,
      'Proximo pago': c.proximo_pago,
      'Movil': c.movil_2 ? `${c.movil_1}${c.movil_2}` : c.movil_1,
      'Saldo': c.saldo,
      'Router': c.nodo_router,
      'Instalado': c.fecha_instalacion,
      'Cedula': c.dni,
      'User PPP/Hotspot': c.user_ppp,
      'Codigo': c.codigo,
      'Total cobrar': `S/. ${c.precio.toFixed(2)}`,
      'Zona': c.zona,
      'Status': c.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Lista_de_Usuarios_Actualizada.xlsx');
  };

  const handleCustomExport = async () => {
    const state = useStore.getState();

    // NOTA VITAL: jsPDF-autoTable colapsa catastróficamente si se le pasan >15 columnas
    // con texto moderadamente largo (calcula layout infinito/negativo).
    // Para PDF ES OBLIGATORIO usar 'cols' limitados para que no explote. Excel/CSV exportarán todo.
    const sheets = [
      { id: 'clients', name: "Clientes", data: state.clients, cols: ['id', 'nombre', 'estado_cuenta', 'dni', 'movil_1', 'plan', 'precio', 'nodo_router', 'direccion', 'ip'] },
      { id: 'tickets', name: "Tickets", data: state.tickets, cols: ['id', 'cliente_nombre', 'tipo_falla', 'estado', 'prioridad', 'fecha_creacion', 'fecha_cierre', 'tecnico_asignado'] },
      { id: 'averias', name: "Averias", data: state.averias, cols: ['id', 'cliente', 'problema', 'estado', 'fecha', 'solucion'] },
      { id: 'visitas', name: "Visitas", data: state.visitas, cols: ['id', 'ticket_id', 'tecnico_id', 'fecha', 'estado', 'motivo'] },
      { id: 'tecnicos', name: "Tecnicos", data: state.tecnicos, cols: ['id', 'nombre', 'rol', 'telefono', 'estado'] },
      { id: 'equipos', name: "Equipos", data: state.equipos, cols: ['id', 'mac', 'modelo', 'estado', 'cliente_id', 'tipo'] },
      { id: 'instalaciones', name: "Instalaciones", data: state.instalaciones, cols: ['id', 'cliente_nombre', 'fecha_programada', 'estado', 'direccion'] },
      { id: 'postVenta', name: "PostVenta", data: state.postVenta, cols: ['id', 'cliente', 'motivo', 'estado', 'fecha'] },
      { id: 'sesionesRemoto', name: "SoporteRemoto", data: state.sesionesRemoto, cols: ['id', 'cliente', 'operador', 'duracion', 'fecha'] },
      { id: 'derivaciones', name: "Derivaciones", data: state.derivaciones, cols: ['id', 'ticket_id', 'motivo', 'estado', 'tecnico_origen', 'tecnico_destino'] },
      { id: 'importHistory', name: "HistorialImport", data: state.importHistory, cols: ['id', 'date', 'fileName', 'total', 'mode'] },
      { id: 'whatsappLogs', name: "LogsWhatsApp", data: state.whatsappLogs, cols: ['id', 'numero', 'mensaje', 'fecha', 'estado'] },
      { id: 'templates', name: "Plantillas", data: state.templates, cols: ['id', 'nombre', 'tipo'] },
    ];

    if (exportTables.length === 0) {
      alert("Por favor selecciona al menos una tabla para exportar.");
      return;
    }

    const tablesToExport = sheets.filter(s => exportTables.includes(s.id));
    setIsExporting(true);

    try {
      // Usamos un pequeño delay para permitir que React renderice el estado "Exportando..."
      await new Promise(resolve => setTimeout(resolve, 100));

      if (exportFormat === 'xlsx') {
        const wb = XLSX.utils.book_new();
        tablesToExport.forEach(({ name, data }) => {
          if (data && Array.isArray(data) && data.length > 0) {
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, name);
          }
        });
        XLSX.writeFile(wb, `ISP_Export_Multiple_${new Date().toISOString().slice(0, 10)}.xlsx`);
      } else if (exportFormat === 'csv') {
        tablesToExport.forEach(({ name, data }) => {
          if (data && Array.isArray(data) && data.length > 0) {
            const ws = XLSX.utils.json_to_sheet(data);
            const csv = XLSX.utils.sheet_to_csv(ws);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `ISP_Export_${name}_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        });
      } else if (exportFormat === 'pdf') {
        const doc = new jsPDF('landscape');

        for (let index = 0; index < tablesToExport.length; index++) {
          const { name, data, cols } = tablesToExport[index];
          if (data && Array.isArray(data) && data.length > 0) {

            // Pausa asíncrona para liberar el main thread del navegador
            await new Promise(resolve => setTimeout(resolve, 50));

            if (index > 0) doc.addPage();
            doc.text(`Tabla: ${name} (${data.length} registros)`, 14, 14);

            let headers = Object.keys(data[0]);
            if (cols && cols.length > 0) {
              headers = cols.filter(c => headers.includes(c));
            } else {
              headers = headers.slice(0, 8);
            }

            const rows = data.map(obj => headers.map(h => {
              const val = obj[h];
              return typeof val === 'object' ? JSON.stringify(val).substring(0, 30) : String(val ?? '').substring(0, 40);
            }));

            // AutoTable renderizado de altísimo volumen
            doc.autoTable({
              head: [headers.map(h => h.toUpperCase().replace(/_/g, ' '))],
              body: rows,
              startY: 19,
              theme: 'grid',
              styles: {
                fontSize: 6,
                cellPadding: 1,
                overflow: 'linebreak',
              },
              headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            });
          }
        }

        // Pausa antes de guardar archivo final masivo
        await new Promise(resolve => setTimeout(resolve, 100));
        doc.save(`ISP_Export_Multiple_${new Date().toISOString().slice(0, 10)}.pdf`);
      }
    } catch (error) {
      console.error("Error al exportar:", error);
      alert("Hubo un error al generar el archivo. Si la base de datos es muy grande, intenta exportar en formato Excel o CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFactoryReset = () => {
    if (window.confirm("⚠️ ¿Estás seguro de realizar un FACTORY RESET?\n\nEsta acción eliminará TODOS los datos guardados en la base de datos local (IndexedDB) y recargará el sistema con los datos iniciales del archivo db.json.\n\nSe recomienda exportar un backup antes.")) {
      factoryReset();
    }
  };

  if (step === 'finished') {
    return (
      <div className="p-10 text-center h-full flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-accent-green text-white flex items-center justify-center mb-6">
          <Wifi size={28} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Importación Exitosa</h2>
        <p className="text-text-secondary mb-2">
          Se procesaron <span className="text-text-primary font-semibold">{stats.total}</span> registros del archivo <span className="font-mono text-xs text-accent-blue">{fileName}</span>
        </p>
        <p className="text-text-muted text-sm mb-2">
          {stats.new} nuevos · {stats.modified} modificados · {stats.unchanged} sin cambios
        </p>
        <p className="text-[11px] text-text-muted mb-6">
          Modo: <span className="font-semibold">{importMode === 'completa' ? 'Reemplazo completo' : importMode === 'nuevos' ? 'Solo nuevos' : 'Sincronización inteligente'}</span>
        </p>
        <div className="flex gap-3">
          <button onClick={() => setStep('upload')}
            className="py-2.5 px-6 rounded-lg bg-bg-secondary border border-border text-text-primary cursor-pointer text-sm">
            Nueva importación
          </button>
          <button onClick={handleExport}
            className="py-2.5 px-6 rounded-lg bg-accent-blue border-none text-white cursor-pointer text-sm font-semibold flex items-center gap-2">
            <Download size={16} />
            Exportar Excel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade p-4 sm:p-6 sm:px-8 h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-[26px] font-bold">Importar Datos</h1>
          <p className="text-text-secondary text-sm">Sincronización desde Excel fuente (ISP Externo)</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {clients.length > 0 && (
            <button onClick={handleExport}
              className="py-2 px-4 rounded-lg bg-bg-card border border-border text-text-secondary text-xs font-semibold cursor-pointer flex items-center gap-1.5 hover:border-accent-blue transition-colors">
              <Download size={14} />
              Exportar datos
            </button>
          )}
        </div>
      </div>

      {/* Sync Status */}
      <SyncStatus />

      {step === 'upload' && (
        <>
          {/* Backup Section */}
          <div className="bg-bg-card rounded-2xl border border-border p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Archive size={18} className="text-accent-green" />
              <h3 className="text-sm font-semibold">Copia de Seguridad (Backup)</h3>
            </div>
            <p className="text-[11px] text-text-muted mb-4">
              Descarga una copia completa de toda la información del sistema (Clientes, Tickets, Visitas, etc.) para evitar pérdida de datos.
            </p>
            <div className="flex gap-3 flex-wrap items-center">
              {/* Multi-Select Custom Dropdown para Tablas */}
              <div className="relative">
                <button
                  onClick={() => setShowTableSelect(!showTableSelect)}
                  className="flex items-center justify-between gap-3 bg-bg-secondary border border-border text-text-primary text-xs font-semibold rounded-lg px-3 py-2.5 outline-none focus:border-accent-blue min-w-[180px] hover:border-text-muted transition-colors"
                >
                  <span className="truncate max-w-[130px]">
                    {exportTables.length === 0 ? 'Ninguna seleccionada' :
                      exportTables.length === tablesList.length ? 'Todas las tablas' :
                        exportTables.length === 1 ? tablesList.find(t => t.id === exportTables[0])?.label :
                          `${exportTables.length} tablas selecc.`}
                  </span>
                  <ChevronDown size={14} className={`text-text-muted transition-transform ${showTableSelect ? 'rotate-180' : ''}`} />
                </button>

                {showTableSelect && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTableSelect(false)}></div>
                    <div className="absolute top-full left-0 mt-1 w-56 bg-bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden flex flex-col max-h-[300px]">
                      <div className="p-2 border-b border-border bg-bg-secondary/50">
                        <button
                          onClick={handleSelectAllTables}
                          className="w-full text-left px-2 py-1.5 text-[11px] font-semibold text-accent-blue hover:bg-accent-blue/10 rounded flex items-center gap-2 transition-colors"
                        >
                          {exportTables.length === tablesList.length ? <CheckSquare size={13} /> : <Square size={13} />}
                          {exportTables.length === tablesList.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                        </button>
                      </div>
                      <div className="overflow-y-auto p-1 py-1.5 custom-scrollbar">
                        {tablesList.map(table => (
                          <div
                            key={table.id}
                            onClick={(e) => {
                              e.preventDefault(); // Evitamos scroll to top u otros behaviors raros
                              e.stopPropagation(); // Mantenemos el dropdown abierto
                              handleToggleTable(table.id);
                            }}
                            className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-bg-secondary cursor-pointer rounded-lg transition-colors group"
                          >
                            <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${exportTables.includes(table.id) ? 'bg-accent-blue border-accent-blue text-white' : 'border-text-muted/50 group-hover:border-accent-blue/50'}`}>
                              {exportTables.includes(table.id) && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </div>
                            <span className="text-[11px] text-text-primary group-hover:text-accent-blue transition-colors select-none">{table.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="bg-bg-secondary border border-border text-text-primary text-xs font-semibold rounded-lg px-3 py-2.5 outline-none focus:border-accent-blue"
              >
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="pdf">PDF (.pdf)</option>
              </select>

              <button
                onClick={handleCustomExport}
                disabled={isExporting}
                className={`flex items-center gap-2 py-2.5 px-4 rounded-lg text-white text-xs font-semibold shadow-md transition-colors ${isExporting ? 'bg-bg-secondary text-text-muted cursor-not-allowed' : 'bg-accent-blue hover:bg-accent-blue/90 cursor-pointer'
                  }`}
              >
                {isExporting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Exportar ahora
                  </>
                )}
              </button>

              <button onClick={handleFactoryReset}
                title="Borrar toda la base de datos (Reset)"
                className="flex items-center gap-2 py-2.5 px-4 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs font-semibold cursor-pointer hover:bg-accent-red/20 transition-colors ml-auto">
                <Trash2 size={16} />
                Factory Reset
              </button>
            </div>
          </div>

          {/* Import Mode Selection */}
          <div className="bg-bg-card rounded-2xl border border-border p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Database size={18} className="text-accent-blue" />
              <h3 className="text-sm font-semibold">Modo de Importación</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'inteligente', label: 'Inteligente', desc: 'Compara e integra nuevos y modificados sin perder datos existentes', icon: <RefreshCw size={16} /> },
                { value: 'completa', label: 'Reemplazo Completo', desc: 'Reemplaza toda la base de datos con el archivo importado', icon: <Database size={16} /> },
                { value: 'nuevos', label: 'Solo Nuevos', desc: 'Agrega únicamente registros que no existen en el sistema', icon: <Plus size={16} /> },
              ].map(mode => (
                <label key={mode.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all
                    ${importMode === mode.value
                      ? 'border-accent-blue bg-accent-blue/5'
                      : 'border-border bg-bg-secondary hover:border-border'}`}>
                  <input type="radio" name="importMode" value={mode.value}
                    checked={importMode === mode.value}
                    onChange={() => setImportMode(mode.value)}
                    className="mt-1 accent-accent-blue" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-accent-blue">{mode.icon}</span>
                      <p className="text-sm font-semibold">{mode.label}</p>
                    </div>
                    <p className="text-[11px] text-text-muted mt-1">{mode.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Cleaning Options Toggle */}
          <div className="mb-4">
            <button onClick={() => setShowCleaningOptions(!showCleaningOptions)}
              className="text-xs text-accent-purple font-semibold cursor-pointer bg-transparent border-none flex items-center gap-1 hover:opacity-80">
              <span>{showCleaningOptions ? '▾' : '▸'}</span>
              Configurar reglas de limpieza ETL ({Object.values(cleaningOptions).filter(Boolean).length}/9 activas)
            </button>
          </div>

          {showCleaningOptions && <DataCleaningOptions />}

          <ExcelUploader onDataLoaded={handleDataLoaded} loading={false} />

          {/* Import History */}
          <div className="mt-6">
            <ImportLog />
          </div>
        </>
      )}

      {step === 'processing' && (
        <ImportProgress current={progress.current} total={progress.total} stage={progress.stage} />
      )}

      {step === 'preview' && (
        <>
          {reviewItems.length > 0 && <ManualReviewTable items={reviewItems} onFix={handleFixReviewItem} onSkip={(id) => handleSkipReviewItem(id, reviewItems.find(t => t.id === id).tipo)} />}
          <ImportPreview
            stats={stats}
            changes={changes}
            onConfirm={confirmImport}
            onCancel={() => setStep('upload')}
          />
        </>
      )}
    </div>
  );
}
