export function parseMoney(val) {
  if (!val) return 0;
  const match = String(val).match(/([\d.]+)/);
  const num = match ? parseFloat(match[1]) : 0;
  return num < 0 ? 0 : num;
}

export function parseDate(val) {
  if (!val) return null;
  if (typeof val === 'string' && val.includes('/')) {
    const [d, m, y] = val.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
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
