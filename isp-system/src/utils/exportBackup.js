/**
 * Utilidades de exportación de backups.
 * Soporta JSON, CSV y Excel (xlsx).
 */

/**
 * Descarga un objeto como JSON.
 */
export function downloadAsJSON(data, filename = 'backup') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    triggerDownload(blob, `${filename}.json`);
}

/**
 * Descarga datos como CSV. Usa la primera colección encontrada o flatten de todas.
 */
export function downloadAsCSV(data, filename = 'backup') {
    const allCollections = {};

    for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value) && value.length > 0) {
            allCollections[key] = value;
        }
    }

    let csvContent = '';

    for (const [collectionName, items] of Object.entries(allCollections)) {
        // Header with collection name
        csvContent += `\n=== ${collectionName.toUpperCase()} ===\n`;

        // Get all unique keys from items
        const allKeys = new Set();
        items.forEach(item => {
            Object.keys(item).forEach(key => allKeys.add(key));
        });
        const headers = [...allKeys];

        // CSV header row
        csvContent += headers.map(h => `"${h}"`).join(',') + '\n';

        // CSV data rows
        items.forEach(item => {
            const row = headers.map(h => {
                const val = item[h];
                if (val === null || val === undefined) return '';
                if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
                return `"${String(val).replace(/"/g, '""')}"`;
            });
            csvContent += row.join(',') + '\n';
        });
    }

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${filename}.csv`);
}

/**
 * Descarga datos como Excel usando xlsx.
 */
export async function downloadAsExcel(data, filename = 'backup') {
    // Importar xlsx dinámicamente
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value) && value.length > 0) {
            // Flatten objects for Excel
            const flatData = value.map(item => {
                const flat = {};
                for (const [k, v] of Object.entries(item)) {
                    flat[k] = typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
                }
                return flat;
            });

            const ws = XLSX.utils.json_to_sheet(flatData);
            // Truncate sheet name to 31 chars (Excel limit)
            const sheetName = key.substring(0, 31);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
    }

    // Config/metadata as separate sheet
    const configData = {};
    for (const [key, value] of Object.entries(data)) {
        if (!Array.isArray(value)) {
            configData[key] = typeof value === 'object' ? JSON.stringify(value) : value;
        }
    }
    if (Object.keys(configData).length > 0) {
        const configEntries = Object.entries(configData).map(([k, v]) => ({ key: k, value: v }));
        const wsConfig = XLSX.utils.json_to_sheet(configEntries);
        XLSX.utils.book_append_sheet(wb, wsConfig, 'config');
    }

    XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Helper para descargar un blob como archivo.
 */
function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
