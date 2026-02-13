/**
 * Sanitización de inputs para prevenir XSS.
 * Escapa caracteres HTML peligrosos.
 */

const ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
};

const ESCAPE_REGEX = /[&<>"'/]/g;

/**
 * Sanitiza un string escapando caracteres HTML peligrosos.
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
export function sanitizeHTML(text) {
    if (typeof text !== 'string') return text;
    return text.replace(ESCAPE_REGEX, char => ESCAPE_MAP[char] || char);
}

/**
 * Sanitiza todas las propiedades string de un objeto (shallow).
 * @param {Object} obj - Objeto a sanitizar
 * @returns {Object} Objeto con strings sanitizados
 */
export function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = typeof value === 'string' ? sanitizeHTML(value) : value;
    }
    return sanitized;
}

/**
 * Limpia un string eliminando espacios extras.
 * @param {string} text - Texto a limpiar 
 * @returns {string} Texto limpio
 */
export function cleanText(text) {
    if (typeof text !== 'string') return text;
    return text.trim().replace(/\s+/g, ' ');
}
