export function parseMoney(val) {
  if (!val) return 0;
  const match = String(val).match(/([\d.]+)/);
  const num = match ? parseFloat(match[1]) : 0;
  return num < 0 ? 0 : num;
}

export function parseDate(val) {
  if (!val) return null;
  if (typeof val === 'string' && val.includes('/')) {
    const parts = val.split('/');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    if (!d || !m || !y) return null;
    const day = d.padStart(2, '0');
    const month = m.padStart(2, '0');
    // Validar rangos básicos antes de devolver
    if (parseInt(month, 10) < 1 || parseInt(month, 10) > 12) return null;
    if (parseInt(day, 10) < 1 || parseInt(day, 10) > 31) return null;
    return `${y}-${month}-${day}`;
  }
  return val;
}

export function padDNI(val) {
  if (!val) return '';
  return String(val).padStart(8, '0');
}

export function formatCurrency(amount) {
  return `S/. ${Number(amount || 0).toFixed(2)}`;
}

export function formatPercentage(value, total) {
  if (!total) return '0.0';
  return ((value / total) * 100).toFixed(1);
}
