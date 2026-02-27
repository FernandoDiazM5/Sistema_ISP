/**
 * Funciones utilitarias compartidas entre slices y módulos del store.
 * Centraliza lógica común para evitar duplicación.
 */

/**
 * Genera el siguiente ID secuencial para una colección.
 * @param {Array} collection - Array de objetos de la colección
 * @param {string} prefix - Prefijo del ID (ej: 'TK', 'EQ', 'VT')
 * @param {string} idField - Campo usado como ID (por defecto 'id')
 * @returns {string} ID con formato PREFIX-NNN (ej: 'TK-001')
 */
export function getNextId(collection, prefix, idField = 'id') {
    if (!collection || collection.length === 0) return `${prefix}-001`;
    const maxId = collection.reduce((max, item) => {
        if (!item[idField]) return max;
        const parts = item[idField].split('-');
        const num = parseInt(parts[parts.length - 1] || 0);
        return !isNaN(num) && num > max ? num : max;
    }, 0);
    return `${prefix}-${String(maxId + 1).padStart(3, '0')}`;
}

/**
 * Mapa canónico entre claves de IndexedDB (isp_*) y claves del store de Zustand.
 * Usado en hydrateStore, applyDeltas y restoreSystem para sincronización local ↔ store.
 */
export const ISP_KEY_MAP = {
    isp_clients:              'clients',
    isp_tickets:              'tickets',
    isp_averias:              'averias',
    isp_equipos:              'equipos',
    isp_visitas:              'visitas',
    isp_instalaciones:        'instalaciones',
    isp_derivaciones:         'derivaciones',
    isp_postVenta:            'postVenta',
    isp_sesionesRemoto:       'sesionesRemoto',
    isp_movimientosEquipos:   'movimientosEquipos',
    isp_whatsappLogs:         'whatsappLogs',
    isp_templates:            'templates',
    isp_requerimientos:       'requerimientos',
    isp_col_prefs:            'columnPrefs',
    isp_cleaningOptions:      'cleaningOptions',
    isp_importHistory:        'importHistory',
    isp_branding:             'branding',
    isp_customRolePermissions:'customRolePermissions',
    isp_whatsappCategories:   'whatsappCategories',
    isp_theme:                'theme',
    isp_categorias:           'categorias',
    isp_subcategorias:        'subcategorias',
    isp_prioridadesSLA:       'prioridadesSLA',
    isp_estadosCatalogo:      'estadosCatalogo',
    isp_catalogoServicios:    'catalogoServicios',
    isp_tiposRequerimiento:   'tiposRequerimiento',
};

/**
 * Mapa inverso: clave del store → clave de IndexedDB.
 * Generado automáticamente a partir de ISP_KEY_MAP.
 */
export const STORE_TO_DB_KEY_MAP = Object.fromEntries(
    Object.entries(ISP_KEY_MAP).map(([dbKey, storeKey]) => [storeKey, dbKey])
);
