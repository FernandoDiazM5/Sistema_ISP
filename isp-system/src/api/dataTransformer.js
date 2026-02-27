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
  // Helpers para buscar atributos ignorando Mayúsculas/Minúsculas en caso de CSV mal formateado
  const getVal = (key) => raw[key] || raw[key.toLowerCase()] || raw[key.toUpperCase()];

  // Limpiar campos numéricos que pueden venir en notación científica
  let idRaw = cleanNumericField(getVal('Id') || raw.B || '');

  // Normalizar IDs: Si viene como un número corto (ej. "1", "2918") en un CSV, rellenar ceros hasta 6 dígitos (ej. "000001", "002918")
  if (idRaw && /^\d+$/.test(idRaw) && idRaw.length < 6) {
    idRaw = idRaw.padStart(6, '0');
  }
  const telefonoRaw = cleanNumericField(getVal('Telefono') || raw.R || '');
  const movilRaw = cleanNumericField(getVal('Movil') || raw.U || '');
  const dniRaw = cleanNumericField(getVal('Cedula') || raw.Z || '');

  // Limpieza específica para Código: solo números y sin ceros a la izquierda
  let codigoRaw = cleanNumericField(getVal('Codigo') || raw.AC || '');
  codigoRaw = codigoRaw.replace(/\D/g, ''); // Eliminar todo lo que no sea número
  if (codigoRaw !== '') {
    codigoRaw = codigoRaw.replace(/^0+/, '') || '0'; // Eliminar ceros a la izquierda (si queda vacío es 0)
  }

  return {
    id: idRaw,
    nombre: cleanNombre(getVal('Nombre') || raw.C || '').nombre,
    estado_cuenta: cleanNombre(getVal('Nombre') || raw.C || '').estado,
    mac: getVal('Mac') || raw.D || '',
    ip: getVal('Ip') || raw.E || '',
    ip_receptor: getVal('IP Receptor') || raw.F || '',
    ultimo_vencimiento: getVal('Ultimo vencimiento') || raw.G || '',
    ultimo_pago: getVal('Ultimo pago') || raw.H || '',
    tipo_estrato: getVal('Tipo estrato') || raw.I || '',
    direccion: getVal('Dirección Principal') || getVal('Direccion Principal') || raw.K || '',
    fecha_suspendido: getVal('Fecha suspendido') || raw.L || '',
    direccion_servicio: getVal('Dirección Servicio') || getVal('Direccion Servicio') || raw.N || '',
    dia_pago: getVal('Dia pago') || raw.O || '',
    deuda_raw: getVal('Deuda actual') || raw.P || '',
    deuda_meses: parseDeuda(getVal('Deuda actual') || raw.P).meses,
    deuda_monto: parseDeuda(getVal('Deuda actual') || raw.P).monto,
    notas_tecnicas: isEmail(getVal('Correo') || raw.Q) ? '' : (getVal('Correo') || raw.Q || ''),
    email: isEmail(getVal('Correo') || raw.Q) ? (getVal('Correo') || raw.Q) : '',
    telefono: telefonoRaw,
    plan: cleanPlan(getVal('Plan') || raw.S || ''),
    proximo_pago: getVal('Proximo pago') || raw.T || '',
    movil_1: splitMovil(movilRaw).movil1,
    movil_2: splitMovil(movilRaw).movil2,
    saldo: getVal('Saldo') || raw.V || 'S/. 0.00',
    nodo_router: getVal('Router') || raw.X || '',
    nodo: getVal('Router') || raw.X || '', // Alias para compatibilidad con componentes que buscan .nodo
    fecha_instalacion: getVal('Instalado') || raw.Y || '',
    dni: padDNI(dniRaw),
    user_ppp: getVal('User PPP/Hotspot') || raw.AA || '',
    codigo: codigoRaw,
    total_cobrar: getVal('Total cobrar') || raw.AF || '',
    precio: parseMoney(getVal('Total cobrar') || raw.AF),
    zona: getVal('Zona') || raw.AG || '',
    status: getVal('Status') || raw.AH || '',
    servicios_adicionales: parseServiciosTV(getVal('Servicios personalizados') || raw.AI),
    tecnologia: inferTecnologia(getVal('Router') || raw.X, getVal('Plan') || raw.S),
    estado_servicio: getEstadoServicio(getVal('Plan') || raw.S, getVal('Nombre') || raw.C),
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
    { key: 'movil_1', label: 'Móvil 1' },
    { key: 'movil_2', label: 'Móvil 2' },
    { key: 'ultimo_vencimiento', label: 'Último Vencimiento' },
    { key: 'ultimo_pago', label: 'Último Pago' },
    { key: 'direccion', label: 'Dirección Ppal.' },
    { key: 'direccion_servicio', label: 'Dirección Serv.' },
    { key: 'mac', label: 'MAC' },
    { key: 'dni', label: 'DNI/Cédula' },
  ];

  for (const f of fields) {
    const oldVal = existing[f.key];
    const newVal = incoming[f.key];
    if (String(oldVal || '') !== String(newVal || '')) {
      const fmt = f.format || (v => v);
      diffs.push({ field: f.label, old: fmt(oldVal || '-'), new: fmt(newVal || '-') });
    }
  }
  return diffs;
}

// Mezcla profunda de datos preservando información local
// Sobrescribe todo lo que trae el Excel, pero si el Excel trae un campo vacío
// y nosotros lo teníamos lleno, preservamos el nuestro.
export function deepMergeClient(existing, incoming) {
  const merged = { ...existing }; // Empezamos con la base de lo que ya tenemos

  // Iterar por cada llave que nos trajo el transformador de excel
  for (const key of Object.keys(incoming)) {
    const incomingVal = incoming[key];
    const existingVal = existing[key];

    // Excepciones donde la BD local MANDA aunque el excel traiga algo
    if (key === 'notas_tecnicas' && existingVal && String(existingVal).trim().length > 0) {
      continue; // No aplastamos las notas técnicas locales
    }

    // Si el excel viene vacío, y nosotros lo tenemos lleno, NO APLASTAR
    if ((incomingVal === null || incomingVal === undefined || incomingVal === '') &&
      (existingVal !== null && existingVal !== undefined && existingVal !== '')) {
      continue;
    }

    // De lo contrario, el Excel manda
    merged[key] = incomingVal;
  }

  return merged;
}
