import { parseMoney, padDNI } from '../utils/formatters';

// ====== UTILIDAD: Convertir notación científica a string normal ======
// Excel exporta números largos (teléfonos, DNIs) en formato científico: 9.47753741902369E+26
// Esta función convierte estos valores de vuelta a texto normal
export function fromScientificNotation(value) {
  if (!value) return '';

  const str = String(value).trim();

  // Detectar si está en notación científica (contiene 'E' o 'e')
  if (!/[eE][+-]?\d+/.test(str)) {
    return str; // No está en notación científica, retornar tal cual
  }

  try {
    // Usar toLocaleString con fullwide para expandir la notación científica
    // Esto evita la pérdida de precisión en enteros grandes que toFixed podría causar
    return Number(str).toLocaleString('fullwide', { useGrouping: false });
  } catch (e) {
    return str; // Si falla, retornar original
  }
}

// ====== UTILIDAD: Limpiar campo que puede estar en notación científica ======
export function cleanNumericField(value) {
  if (!value) return '';

  const str = String(value).trim();

  // Si está en notación científica, convertir primero
  if (/[eE][+-]?\d+/.test(str)) {
    return fromScientificNotation(str);
  }

  // Si no, retornar limpio
  return str;
}

// Motor ETL: 9 reglas de limpieza de datos del Excel ISP
export function transformClientData(raw) {
  // Limpiar campos numéricos que pueden venir en notación científica
  const idRaw = cleanNumericField(raw.Id || raw.B || '');
  const telefonoRaw = cleanNumericField(raw.Telefono || raw.R || '');
  const movilRaw = cleanNumericField(raw.Movil || raw.U || '');
  const dniRaw = cleanNumericField(raw.Cedula || raw.Z || '');
  
  // Limpieza específica para Código: solo números y sin ceros a la izquierda
  let codigoRaw = cleanNumericField(raw.Codigo || raw.AC || '');
  codigoRaw = codigoRaw.replace(/\D/g, ''); // Eliminar todo lo que no sea número
  if (codigoRaw !== '') {
    codigoRaw = codigoRaw.replace(/^0+/, '') || '0'; // Eliminar ceros a la izquierda (si queda vacío es 0)
  }

  return {
    id: idRaw,
    nombre: cleanNombre(raw.Nombre || raw.C || '').nombre,
    estado_cuenta: cleanNombre(raw.Nombre || raw.C || '').estado,
    mac: raw.Mac || raw.D || '',
    ip: raw.Ip || raw.E || '',
    ip_receptor: raw['IP Receptor'] || raw.F || '',
    ultimo_vencimiento: raw['Ultimo vencimiento'] || raw.G || '',
    ultimo_pago: raw['Ultimo pago'] || raw.H || '',
    tipo_estrato: raw['Tipo estrato'] || raw.I || '',
    direccion: raw['Dirección Principal'] || raw['Direccion Principal'] || raw.K || '',
    fecha_suspendido: raw['Fecha suspendido'] || raw.L || '',
    direccion_servicio: raw['Dirección Servicio'] || raw['Direccion Servicio'] || raw.N || '',
    dia_pago: raw['Dia pago'] || raw.O || '',
    deuda_raw: raw['Deuda actual'] || raw.P || '',
    deuda_meses: parseDeuda(raw['Deuda actual'] || raw.P).meses,
    deuda_monto: parseDeuda(raw['Deuda actual'] || raw.P).monto,
    notas_tecnicas: isEmail(raw.Correo || raw.Q) ? '' : (raw.Correo || raw.Q || ''),
    email: isEmail(raw.Correo || raw.Q) ? (raw.Correo || raw.Q) : '',
    telefono: telefonoRaw,
    plan: cleanPlan(raw.Plan || raw.S || ''),
    proximo_pago: raw['Proximo pago'] || raw.T || '',
    movil_1: splitMovil(movilRaw).movil1,
    movil_2: splitMovil(movilRaw).movil2,
    saldo: raw.Saldo || raw.V || 'S/. 0.00',
    nodo_router: raw.Router || raw.X || '',
    nodo: raw.Router || raw.X || '', // Alias para compatibilidad con componentes que buscan .nodo
    fecha_instalacion: raw.Instalado || raw.Y || '',
    dni: padDNI(dniRaw),
    user_ppp: raw['User PPP/Hotspot'] || raw.AA || '',
    codigo: codigoRaw,
    total_cobrar: raw['Total cobrar'] || raw.AF || '',
    precio: parseMoney(raw['Total cobrar'] || raw.AF),
    zona: raw.Zona || raw.AG || '',
    status: raw.Status || raw.AH || '',
    servicios_adicionales: parseServiciosTV(raw['Servicios personalizados'] || raw.AI),
    tecnologia: inferTecnologia(raw.Router || raw.X, raw.Plan || raw.S),
    estado_servicio: getEstadoServicio(raw.Plan || raw.S, raw.Nombre || raw.C),
  };
}

// Regla 1: Separar nombre y estado (ACTIVO/SUSPENDIDO)
export function cleanNombre(raw) {
  if (!raw) return { nombre: '', estado: 'DESCONOCIDO' };
  const str = String(raw).trim();
  const match = str.match(/^(.+?)\s{2,}(ACTIVO|SUSPENDIDO)\s*$/);
  if (match) return { nombre: match[1].trim(), estado: match[2] };
  if (str.endsWith('ACTIVO')) return { nombre: str.replace(/\s*ACTIVO$/, '').trim(), estado: 'ACTIVO' };
  if (str.endsWith('SUSPENDIDO')) return { nombre: str.replace(/\s*SUSPENDIDO$/, '').trim(), estado: 'SUSPENDIDO' };
  return { nombre: str, estado: 'ACTIVO' };
}

// Regla 2: Clasificar campo Correo (email vs notas técnicas)
export function isEmail(val) {
  return val && String(val).includes('@');
}

// Regla 3: Separar móviles concatenados
export function splitMovil(raw) {
  if (!raw) return { movil1: '', movil2: '' };

  // Convertir de notación científica si es necesario
  let str = cleanNumericField(raw);

  // Remover espacios
  str = str.replace(/\s/g, '');

  // Si tiene comas, separar por comas
  if (str.includes(',')) {
    const parts = str.split(',').filter(Boolean);
    return { movil1: parts[0] || '', movil2: parts[1] || '' };
  }

  // Si es muy largo (más de 12 dígitos), asumir que son 2 móviles concatenados
  // Típicamente móviles peruanos tienen 9 dígitos
  if (str.length > 12) {
    return { movil1: str.substring(0, 9), movil2: str.substring(9) };
  }

  return { movil1: str, movil2: '' };
}

// Regla 4: Normalizar "CORTE POR DEUDA" a estado
export function cleanPlan(plan) {
  if (!plan) return '';
  if (plan.toUpperCase() === 'CORTE POR DEUDA') return 'CORTE POR DEUDA (Sin plan asignado)';
  return plan;
}

// Regla 5: Parsear deuda compuesta
export function parseDeuda(val) {
  if (!val) return { meses: 0, monto: 0 };
  const match = String(val).match(/(\d+)\s*S\/\.\s*([\d.]+)/);
  if (match) return { meses: parseInt(match[1]), monto: parseFloat(match[2]) };
  return { meses: 0, monto: 0 };
}

// Regla 6: Inferir tecnología desde Router y Plan
export function inferTecnologia(router, plan) {
  const r = String(router || '').toUpperCase();
  const p = String(plan || '').toUpperCase();
  if (['OLT', 'FIBRA', 'GPON', 'DIXON', 'HUWEI'].some(kw => r.includes(kw))) return 'Fibra Óptica';
  if (p.includes('FIBRA') || p.includes('GPON')) return 'Fibra Óptica';
  if (['ND1', 'ND2', 'ND3', '/1100', '/4011', 'ORCHALL'].some(kw => r.includes(kw))) return 'Radio Enlace';
  if (p.includes('ANTENA')) return 'Radio Enlace';
  return 'No Determinado';
}

// Regla 7: Determinar estado de servicio
export function getEstadoServicio(plan, nombre) {
  if (String(plan).toUpperCase() === 'CORTE POR DEUDA') return 'Cortado';
  if (String(nombre).includes('SUSPENDIDO')) return 'Suspendido';
  return 'Activo';
}

// Regla 8: Parsear servicios TV concatenados
export function parseServiciosTV(raw) {
  if (!raw) return [];
  const regex = /([^(]+)\(S\/\.\s*([\d.]+)\)/g;
  const servicios = [];
  let match;
  while ((match = regex.exec(String(raw))) !== null) {
    servicios.push({ tipo: match[1].trim(), precio: parseFloat(match[2]) });
  }
  return servicios;
}

// Comparar dos registros para sincronización incremental
export function compareClients(existing, incoming) {
  const diffs = [];
  const fields = [
    { key: 'status', label: 'Estado Conexión' },
    { key: 'estado_cuenta', label: 'Estado Cuenta' },
    { key: 'deuda_monto', label: 'Deuda', format: v => `S/. ${v}` },
    { key: 'plan', label: 'Plan' },
    { key: 'precio', label: 'Precio', format: v => `S/. ${v}` },
    { key: 'ip', label: 'IP' },
    { key: 'nodo_router', label: 'Nodo/Router' },
    { key: 'movil_1', label: 'Móvil' },
    { key: 'ultimo_pago', label: 'Último Pago' },
  ];

  for (const f of fields) {
    const oldVal = existing[f.key];
    const newVal = incoming[f.key];
    if (String(oldVal) !== String(newVal)) {
      const fmt = f.format || (v => v);
      diffs.push({ field: f.label, old: fmt(oldVal), new: fmt(newVal) });
    }
  }
  return diffs;
}
