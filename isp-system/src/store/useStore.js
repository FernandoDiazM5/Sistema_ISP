import { create } from 'zustand';
import { DEMO_RAW_DATA } from '../utils/constants';
import { transformClientData } from '../api/dataTransformer';
import * as db from '../utils/db'; // Importamos el wrapper de IndexedDB

// ===================== HELPERS PERSISTENCIA (MIGRADO A DB) =====================
// Ya no usamos saveToLS ni loadFromLS sincrónicos.
// Cada setter debe ser asíncrono o "fire and forget" hacia la DB.

async function saveToDB(key, data) {
  try {
    await db.set(key, data);
  } catch (e) {
    console.error(`Error saving to DB (${key}):`, e);
  }
}

// Helper para generar IDs autoincrementales
function getNextId(collection, prefix, idField = 'id') {
  if (!collection || collection.length === 0) return `${prefix}-001`;
  const maxId = collection.reduce((max, item) => {
    if (!item[idField]) return max;
    const parts = item[idField].split('-');
    const num = parseInt(parts[parts.length - 1] || 0);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  return `${prefix}-${String(maxId + 1).padStart(3, '0')}`;
}

// ===================== DEMO DATA (CONSTAMTES) =====================
import { getSeedData } from '../utils/seedData';

// ===================== DEMO DATA (MIGRADO A seedData.js) =====================
// Las constantes se han movido a src/utils/seedData.js para mantener este archivo limpio.
// Se cargarán bajo demanda con loadDemoData().

// ===================== CATÁLOGOS =====================
const CATEGORIAS = [
  { id: 'CAT-01', nombre: 'Falla de Internet', descripcion: 'Problemas de navegación, velocidad y latencia' },
  { id: 'CAT-02', nombre: 'Falla de Cable', descripcion: 'Problemas con señal de TV o decodificadores' },
  { id: 'CAT-03', nombre: 'Configuración', descripcion: 'Cambios lógicos (WiFi, puertos, reseteo)' },
  { id: 'CAT-04', nombre: 'Infraestructura', descripcion: 'Daños en red externa (postes, cajas, cables)' },
  { id: 'CAT-05', nombre: 'Hardware', descripcion: 'Fallas físicas en equipos del cliente' },
  { id: 'CAT-06', nombre: 'Administrativo', descripcion: 'Facturación, cortes por pago, planes' },
];

const SUBCATEGORIAS = [
  { id: 'SUB-101', categoriaId: 'CAT-01', nombre: 'Corte Total de Internet', tipoAtencion: 'Soporte Remoto' },
  { id: 'SUB-102', categoriaId: 'CAT-01', nombre: 'Baja Velocidad', tipoAtencion: 'Soporte Remoto' },
  { id: 'SUB-103', categoriaId: 'CAT-01', nombre: 'Intermitencia', tipoAtencion: 'Soporte Remoto' },
  { id: 'SUB-104', categoriaId: 'CAT-01', nombre: 'Páginas Específicas', tipoAtencion: 'Soporte Remoto' },
  { id: 'SUB-105', categoriaId: 'CAT-01', nombre: 'Internet Lento', tipoAtencion: 'Soporte Remoto' },
  { id: 'SUB-201', categoriaId: 'CAT-02', nombre: 'Sin Señal de TV', tipoAtencion: 'Visita Técnica' },
  { id: 'SUB-202', categoriaId: 'CAT-02', nombre: 'Imagen Congelada', tipoAtencion: 'Visita Técnica' },
  { id: 'SUB-203', categoriaId: 'CAT-02', nombre: 'Decodificador', tipoAtencion: 'Visita Técnica' },
  { id: 'SUB-301', categoriaId: 'CAT-03', nombre: 'Configurar WiFi', tipoAtencion: 'Soporte Remoto' },
  { id: 'SUB-302', categoriaId: 'CAT-03', nombre: 'Abrir Puertos', tipoAtencion: 'Soporte Remoto' },
  { id: 'SUB-303', categoriaId: 'CAT-03', nombre: 'Reseteo de Equipo', tipoAtencion: 'Soporte Remoto' },
  { id: 'SUB-401', categoriaId: 'CAT-04', nombre: 'Daño en Acometida', tipoAtencion: 'Visita Técnica' },
  { id: 'SUB-402', categoriaId: 'CAT-04', nombre: 'Daño en NAP', tipoAtencion: 'Visita Técnica' },
  { id: 'SUB-403', categoriaId: 'CAT-04', nombre: 'Traslado de Servicio', tipoAtencion: 'Visita Técnica' },
  { id: 'SUB-501', categoriaId: 'CAT-05', nombre: 'Router/ONT Averiado', tipoAtencion: 'Visita Técnica' },
  { id: 'SUB-502', categoriaId: 'CAT-05', nombre: 'Transformador/POE', tipoAtencion: 'Visita Técnica' },
  { id: 'SUB-503', categoriaId: 'CAT-05', nombre: 'Puerto LAN Dañado', tipoAtencion: 'Visita Técnica' },
  { id: 'SUB-601', categoriaId: 'CAT-06', nombre: 'Reconexión por Pago', tipoAtencion: 'Soporte Remoto' },
  { id: 'SUB-602', categoriaId: 'CAT-06', nombre: 'Cambio de Plan', tipoAtencion: 'Soporte Remoto' },
  { id: 'SUB-603', categoriaId: 'CAT-06', nombre: 'Facturación', tipoAtencion: 'Soporte Remoto' },
];

const PRIORIDADES_SLA = [
  { id: 'PRI-01', subcategoriaId: 'SUB-101', prioridad: 'Crítica', tiempoLimite: '4 horas', impacto: 'Cliente incomunicado' },
  { id: 'PRI-02', subcategoriaId: 'SUB-102', prioridad: 'Media', tiempoLimite: '24 horas', impacto: 'Servicio degradado' },
  { id: 'PRI-03', subcategoriaId: 'SUB-201', prioridad: 'Alta', tiempoLimite: '12 horas', impacto: 'Sin TV' },
  { id: 'PRI-04', subcategoriaId: 'SUB-301', prioridad: 'Baja', tiempoLimite: '48 horas', impacto: 'Cambio estético' },
  { id: 'PRI-05', subcategoriaId: 'SUB-501', prioridad: 'Alta', tiempoLimite: '8 horas', impacto: 'Hardware dañado' },
  { id: 'PRI-06', subcategoriaId: 'SUB-601', prioridad: 'Media', tiempoLimite: '4 horas', impacto: 'Reconexión' },
  { id: 'PRI-07', subcategoriaId: 'SUB-401', prioridad: 'Alta', tiempoLimite: '12 horas', impacto: 'Infraestructura dañada' },
];

const ESTADOS_CATALOGO = [
  { id: 'EST-01', entidad: 'Ticket', nombre: 'Abierto', color: '#ef4444', orden: 1, esFinal: false },
  { id: 'EST-02', entidad: 'Ticket', nombre: 'En Proceso', color: '#f59e0b', orden: 2, esFinal: false },
  { id: 'EST-03', entidad: 'Ticket', nombre: 'Escalado', color: '#f97316', orden: 3, esFinal: false },
  { id: 'EST-04', entidad: 'Ticket', nombre: 'Resuelto', color: '#10b981', orden: 4, esFinal: true },
  { id: 'EST-05', entidad: 'Ticket', nombre: 'Cerrado', color: '#6b7280', orden: 5, esFinal: true },
  { id: 'EST-06', entidad: 'Ticket', nombre: 'Cancelado', color: '#9ca3af', orden: 6, esFinal: true },
  { id: 'EST-07', entidad: 'Cliente', nombre: 'Activo', color: '#10b981', orden: 1, esFinal: false },
  { id: 'EST-08', entidad: 'Cliente', nombre: 'Suspendido', color: '#f59e0b', orden: 2, esFinal: false },
  { id: 'EST-09', entidad: 'Cliente', nombre: 'Retirado', color: '#ef4444', orden: 3, esFinal: true },
  { id: 'EST-10', entidad: 'Visita', nombre: 'Programada', color: '#3b82f6', orden: 1, esFinal: false },
  { id: 'EST-11', entidad: 'Visita', nombre: 'En Ruta', color: '#8b5cf6', orden: 2, esFinal: false },
  { id: 'EST-12', entidad: 'Visita', nombre: 'En Sitio', color: '#f59e0b', orden: 3, esFinal: false },
  { id: 'EST-13', entidad: 'Visita', nombre: 'Completada', color: '#10b981', orden: 4, esFinal: true },
  { id: 'EST-14', entidad: 'Visita', nombre: 'Cancelada', color: '#9ca3af', orden: 5, esFinal: true },
  { id: 'EST-15', entidad: 'Solicitud', nombre: 'Pendiente', color: '#f59e0b', orden: 1, esFinal: false },
  { id: 'EST-16', entidad: 'Solicitud', nombre: 'Aprobada', color: '#3b82f6', orden: 2, esFinal: false },
  { id: 'EST-17', entidad: 'Solicitud', nombre: 'En Ejecución', color: '#8b5cf6', orden: 3, esFinal: false },
  { id: 'EST-18', entidad: 'Solicitud', nombre: 'Ejecutada', color: '#10b981', orden: 4, esFinal: true },
  { id: 'EST-19', entidad: 'Solicitud', nombre: 'Rechazada', color: '#ef4444', orden: 5, esFinal: true },
];

const CATALOGO_SERVICIOS = [
  { id: 'SRV-01', nombre: 'Punto Adicional CATV', tipo: 'Presencial', precio: 15, descripcion: 'Instalación de punto adicional de cable TV' },
  { id: 'SRV-02', nombre: 'Punto Adicional Red', tipo: 'Presencial', precio: 80, descripcion: 'Instalación de punto de red cableado' },
  { id: 'SRV-03', nombre: 'Traslado de Servicio', tipo: 'Presencial', precio: 120, descripcion: 'Reubicación del servicio a otra dirección' },
  { id: 'SRV-04', nombre: 'Configuración IPTV', tipo: 'Remoto', precio: 0, descripcion: 'Configuración de IPTV (solo Radio Enlace)' },
  { id: 'SRV-05', nombre: 'Repetidor WiFi', tipo: 'Presencial', precio: 50, descripcion: 'Instalación de repetidor WiFi' },
  { id: 'SRV-06', nombre: 'Cambio de Plan', tipo: 'Remoto', precio: 0, descripcion: 'Upgrade o downgrade de plan de internet' },
  { id: 'SRV-07', nombre: 'Reconexión', tipo: 'Remoto', precio: 0, descripcion: 'Reconexión de servicio por pago' },
];

const useStore = create((set, get) => ({
  storeReady: false, // Flag de hidratación

  // ===================== HYDRATION & MIGRATION =====================
  hydrateStore: async () => {
    try {
      const dbKeys = await db.keys();

      // === LÓGICA DE MIGRACIÓN ===
      // Si la DB está vacía, intentamos migrar de localStorage
      if (dbKeys.length === 0) {
        console.log('IndexedDB vacía. Iniciando migración desde localStorage...');
        const lsMigrationKeys = [
          'isp_clients', 'isp_dataSource', 'isp_col_prefs', 'isp_lastImport',
          'isp_importHistory', 'isp_cleaningOptions', 'isp_templates',
          'isp_whatsappLogs', 'isp_tecnicos', 'isp_tickets', 'isp_averias',
          'isp_equipos', 'isp_sesionesRemoto', 'isp_visitas',
          'isp_instalaciones', 'isp_derivaciones', 'isp_postVenta',
          'isp_movimientosEquipos'
        ];

        const entries = [];
        lsMigrationKeys.forEach(key => {
          const val = localStorage.getItem(key);
          if (val) {
            try {
              entries.push([key, JSON.parse(val)]);
            } catch (e) {
              console.warn(`Error parseando ${key} de LS para migración`, e);
            }
          }
        });

        if (entries.length > 0) {
          await db.setMany(entries);
          console.log(`Migrados ${entries.length} items a IndexedDB.`);
          // Opcional: Limpiar LS después de migrar
          // lsMigrationKeys.forEach(key => localStorage.removeItem(key));
        } else {
          console.log('No hay datos en localStorage para migrar.');
        }
      }

      // === CARGAR DATOS DESDE DB ===
      // Leemos de nuevo las keys (por si acabamos de migrar)
      const currentKeys = await db.keys();
      const loadedState = {};

      // Mapeo de keys de DB a keys del State
      const keyMap = {
        'isp_clients': 'clients',
        'isp_dataSource': 'dataSource',
        'isp_col_prefs': 'columnPrefs',
        'isp_lastImport': 'lastImport',
        'isp_importHistory': 'importHistory',
        'isp_cleaningOptions': 'cleaningOptions',
        'isp_templates': 'templates',
        'isp_whatsappLogs': 'whatsappLogs',
        'isp_tecnicos': 'tecnicos',
        'isp_tickets': 'tickets',
        'isp_averias': 'averias',
        'isp_equipos': 'equipos',
        'isp_sesionesRemoto': 'sesionesRemoto',
        'isp_visitas': 'visitas',
        'isp_instalaciones': 'instalaciones',
        'isp_derivaciones': 'derivaciones',
        'isp_postVenta': 'postVenta',
        'isp_movimientosEquipos': 'movimientosEquipos',
        'isp_theme': 'theme'
      };

      for (const dbKey of currentKeys) {
        if (keyMap[dbKey]) {
          const val = await db.get(dbKey);
          if (val !== undefined && val !== null) {
            loadedState[keyMap[dbKey]] = val;
          }
        }
      }

      set({ ...loadedState, storeReady: true });

    } catch (e) {
      console.error("Error durante hydrateStore:", e);
      // En caso de error crítico, al menos habilitamos la UI
      set({ storeReady: true });
    }
  },


  // ===================== AUTH STATE =====================
  // Auth se mantiene en LS por simplicidad y porque no ocupa espacio significativo
  user: null,
  loading: true,

  setUser: (user) => {
    set({ user });
    if (user) localStorage.setItem('isp_user', JSON.stringify(user));
    else localStorage.removeItem('isp_user');
  },

  initAuth: () => {
    const saved = localStorage.getItem('isp_user');
    if (saved) {
      try { set({ user: JSON.parse(saved), loading: false }); }
      catch { localStorage.removeItem('isp_user'); set({ loading: false }); }
    } else {
      set({ loading: false });
    }
  },

  logout: () => {
    set({ user: null });
    localStorage.removeItem('isp_user');
  },

  // ===================== CLIENTES =====================
  clients: [],
  clientsLoading: false,
  dataSource: 'demo',

  loadDemoData: async () => {
    const seed = getSeedData(transformClientData);
    set({ dataSource: 'demo', ...seed });

    // Guardar todo en DB
    for (const [key, val] of Object.entries(seed)) {
      await saveToDB(`isp_${key}`, val);
    }
    await saveToDB('isp_dataSource', 'demo');
  },

  // ===================== FILES / IMAGES (MOCK) =====================
  uploadImage: async (file, path) => {
    // TODO: Integrar con Firebase Storage real
    // Por ahora, simulamos subida y retornamos una URL local
    console.log(`[STORE] Mock uploading ${file.name} to ${path}`);
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(URL.createObjectURL(file));
      }, 800);
    });
  },

  setClients: (clients) => {
    set({ clients });
    saveToDB('isp_clients', clients);
  },

  importClients: (newClients) => {
    set({ clients: newClients, dataSource: 'excel' });
    saveToDB('isp_clients', newClients);
    saveToDB('isp_dataSource', 'excel');
  },

  // ===================== COLUMN PREFERENCES =====================
  columnPrefs: {
    visible: ['id', 'nombre', 'tecnologia', 'plan', 'precio', 'estado_cuenta', 'status', 'deuda_monto'],
    order: ['id', 'nombre', 'tecnologia', 'plan', 'precio', 'estado_cuenta', 'status', 'deuda_monto'],
  },
  setColumnPrefs: (prefs) => {
    set({ columnPrefs: prefs });
    saveToDB('isp_col_prefs', prefs);
  },

  // ===================== IMPORTACIÓN =====================
  lastImport: null,
  setLastImport: (info) => {
    set({ lastImport: info });
    saveToDB('isp_lastImport', info);
  },

  importHistory: [],
  addImportRecord: (record) => set(s => {
    const maxId = s.importHistory.reduce((max, item) => {
      const num = parseInt(item.id.split('-')[1] || 0);
      return num > max ? num : max;
    }, 0);
    const newHistory = [{ ...record, id: `IMP-${String(maxId + 1).padStart(3, '0')}`, fecha: new Date().toISOString() }, ...s.importHistory];
    saveToDB('isp_importHistory', newHistory);
    return { importHistory: newHistory };
  }),

  cleaningOptions: {
    separateNameStatus: true, classifyEmail: true, splitMobile: true,
    parseDebt: true, parsePrices: true, inferTechnology: true,
    separateTV: true, normalizeCortePorDeuda: true, formatDNI: true,
  },
  setCleaningOptions: (opts) => {
    set({ cleaningOptions: opts });
    saveToDB('isp_cleaningOptions', opts);
  },

  // ===================== THEME =====================
  theme: 'default', // 'default' | 'light' | 'black' | 'purple'
  setTheme: (theme) => {
    set({ theme });
    saveToDB('isp_theme', theme);
    // Apply immediately to DOM
    if (theme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  },

  // Navigation
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),

  // ===================== CROSS-MODULE PREFILL =====================
  prefillVisita: null,
  setPrefillVisita: (data) => set({ prefillVisita: data }),
  clearPrefillVisita: () => set({ prefillVisita: null }),

  prefillSoporte: null,
  setPrefillSoporte: (data) => set({ prefillSoporte: data }),
  clearPrefillSoporte: () => set({ prefillSoporte: null }),

  // ===================== TEMPLATES / WHATSAPP =====================
  templates: [], // Inicialmente vacío

  addTemplate: (tpl) => set(s => {
    const newId = getNextId(s.templates, 'TPL');
    const newTemplates = [{ ...tpl, id: newId, uso: 0 }, ...s.templates];
    saveToDB('isp_templates', newTemplates);
    return { templates: newTemplates };
  }),

  updateTemplate: (id, updates) => set(s => {
    const newTemplates = s.templates.map(t => t.id === id ? { ...t, ...updates } : t);
    saveToDB('isp_templates', newTemplates);
    return { templates: newTemplates };
  }),

  deleteTemplate: (id) => set(s => {
    const newTemplates = s.templates.filter(t => t.id !== id);
    saveToDB('isp_templates', newTemplates);
    return { templates: newTemplates };
  }),

  incrementTemplateUse: (id) => set(s => {
    const newTemplates = s.templates.map(t => t.id === id ? { ...t, uso: (t.uso || 0) + 1 } : t);
    saveToDB('isp_templates', newTemplates);
    return { templates: newTemplates };
  }),

  whatsappLogs: [],
  addWhatsappLog: (log) => set(s => {
    const newId = getNextId(s.whatsappLogs, 'WA');
    const newLogs = [{ ...log, id: newId, fecha: new Date().toISOString() }, ...s.whatsappLogs];
    saveToDB('isp_whatsappLogs', newLogs);
    return { whatsappLogs: newLogs };
  }),

  campaignActive: false, campaignQueue: [], campaignIndex: 0,
  setCampaign: (data) => set(data),

  // ===================== TÉCNICOS =====================
  tecnicos: [],

  addTecnico: (tecnico) => set(s => {
    const newId = getNextId(s.tecnicos, 'TEC');
    const newTecnicos = [{ ...tecnico, id: newId }, ...s.tecnicos];
    saveToDB('isp_tecnicos', newTecnicos);
    return { tecnicos: newTecnicos };
  }),

  updateTecnico: (id, updates) => set(s => {
    const newTecnicos = s.tecnicos.map(t => t.id === id ? { ...t, ...updates } : t);
    saveToDB('isp_tecnicos', newTecnicos);
    return { tecnicos: newTecnicos };
  }),

  deleteTecnico: (id) => set(s => {
    const newTecnicos = s.tecnicos.filter(t => t.id !== id);
    saveToDB('isp_tecnicos', newTecnicos);
    return { tecnicos: newTecnicos };
  }),

  // ===================== TICKETS =====================
  tickets: [],

  addTicket: (ticket) => set(s => {
    const newTickets = [{ ...ticket, id: getNextId(s.tickets, 'TK'), fecha: new Date().toISOString().split('T')[0], fechaUpdate: new Date().toISOString().split('T')[0] }, ...s.tickets];
    saveToDB('isp_tickets', newTickets);
    return { tickets: newTickets };
  }),

  updateTicket: (id, updates) => set(s => {
    const newTickets = s.tickets.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updates, fechaUpdate: new Date().toISOString().split('T')[0] };

        // Logic for history tracking
        if (updates.estado && updates.estado !== t.estado) {
          const historyItem = {
            fecha: new Date().toISOString(),
            estadoAnterior: t.estado,
            estadoNuevo: updates.estado,
            motivo: updates._historyComment || null // Capture reason if provided
          };
          updated.historial = [historyItem, ...(t.historial || [])];

          // Clean up internal field if present
          delete updated._historyComment;
        }
        return updated;
      }
      return t;
    });
    saveToDB('isp_tickets', newTickets);
    return { tickets: newTickets };
  }),

  deleteTicket: (id) => set(s => {
    const newTickets = s.tickets.filter(t => t.id !== id);
    saveToDB('isp_tickets', newTickets);
    return { tickets: newTickets };
  }),

  // ===================== AVERÍAS =====================
  averias: [],

  addAveria: (averia) => set(s => {
    const newAverias = [{ ...averia, id: getNextId(s.averias, 'AV'), fecha: new Date().toISOString().split('T')[0], fechaResolucion: null }, ...s.averias];
    saveToDB('isp_averias', newAverias);
    return { averias: newAverias };
  }),

  updateAveria: (id, updates) => set(s => {
    const newAverias = s.averias.map(a => {
      if (a.id === id) {
        const updated = { ...a, ...updates };

        // Logic for history tracking
        if (updates.estado && updates.estado !== a.estado) {
          const historyItem = {
            fecha: new Date().toISOString(),
            estadoAnterior: a.estado,
            estadoNuevo: updates.estado,
            motivo: updates._historyComment || null
          };
          updated.historial = [historyItem, ...(a.historial || [])];

          // Clean up internal field
          delete updated._historyComment;
        }
        return updated;
      }
      return a;
    });
    saveToDB('isp_averias', newAverias);
    return { averias: newAverias };
  }),

  // ===================== EQUIPOS =====================
  equipos: [],

  addEquipo: (equipo) => set(s => {
    const newEquipos = [{ ...equipo, id: getNextId(s.equipos, 'EQ') }, ...s.equipos];
    saveToDB('isp_equipos', newEquipos);
    return { equipos: newEquipos };
  }),

  updateEquipo: (id, updates) => set(s => {
    const newEquipos = s.equipos.map(e => e.id === id ? { ...e, ...updates } : e);
    saveToDB('isp_equipos', newEquipos);
    return { equipos: newEquipos };
  }),

  // ===================== SOPORTE REMOTO =====================
  sesionesRemoto: [],

  addSesionRemoto: (sesion) => set(s => {
    const newSesiones = [{ ...sesion, id: getNextId(s.sesionesRemoto, 'SR'), fecha: new Date().toISOString().split('T')[0] }, ...s.sesionesRemoto];
    saveToDB('isp_sesionesRemoto', newSesiones);
    return { sesionesRemoto: newSesiones };
  }),

  updateSesionRemoto: (id, updates) => set(s => {
    const newSesiones = s.sesionesRemoto.map(sr => sr.id === id ? { ...sr, ...updates } : sr);
    saveToDB('isp_sesionesRemoto', newSesiones);
    return { sesionesRemoto: newSesiones };
  }),

  // ===================== VISITAS TÉCNICAS =====================
  visitas: [],

  addVisita: (visita) => set(s => {
    const newId = getNextId(s.visitas, 'VT');
    const newVisitas = [{ ...visita, id: newId, fecha: visita.fecha || new Date().toISOString().split('T')[0] }, ...s.visitas];
    saveToDB('isp_visitas', newVisitas);
    return { visitas: newVisitas };
  }),

  updateVisita: (id, updates) => set(s => {
    const newVisitas = s.visitas.map(v => {
      if (v.id === id) {
        const updated = { ...v, ...updates };
        if (updates.estado && updates.estado !== v.estado) {
          const historyItem = { fecha: new Date().toISOString(), estadoAnterior: v.estado, estadoNuevo: updates.estado };
          updated.historial = [historyItem, ...(v.historial || [])];
        }
        return updated;
      }
      return v;
    });
    saveToDB('isp_visitas', newVisitas);
    return { visitas: newVisitas };
  }),

  deleteVisita: (id) => set(s => {
    const newVisitas = s.visitas.filter(v => v.id !== id);
    saveToDB('isp_visitas', newVisitas);
    return { visitas: newVisitas };
  }),

  // ===================== INSTALACIONES =====================
  instalaciones: [],

  addInstalacion: (inst) => set(s => {
    const newId = getNextId(s.instalaciones, 'INS');
    const newInstalaciones = [{ ...inst, id: newId, fecha: inst.fecha || new Date().toISOString().split('T')[0] }, ...s.instalaciones];
    saveToDB('isp_instalaciones', newInstalaciones);
    return { instalaciones: newInstalaciones };
  }),

  updateInstalacion: (id, updates) => set(s => {
    const newInstalaciones = s.instalaciones.map(i => i.id === id ? { ...i, ...updates } : i);
    saveToDB('isp_instalaciones', newInstalaciones);
    return { instalaciones: newInstalaciones };
  }),

  deleteInstalacion: (id) => set(s => {
    const newInstalaciones = s.instalaciones.filter(i => i.id !== id);
    saveToDB('isp_instalaciones', newInstalaciones);
    return { instalaciones: newInstalaciones };
  }),

  // ===================== DERIVACIONES PLANTA EXTERNA =====================
  derivaciones: [],

  addDerivacion: (deriv) => set(s => {
    const newId = getNextId(s.derivaciones, 'DPE');
    const newDerivaciones = [{ ...deriv, id: newId, fecha: deriv.fecha || new Date().toISOString().split('T')[0], fechaCompletado: null }, ...s.derivaciones];
    saveToDB('isp_derivaciones', newDerivaciones);
    return { derivaciones: newDerivaciones };
  }),

  updateDerivacion: (id, updates) => set(s => {
    const newDerivaciones = s.derivaciones.map(d => d.id === id ? { ...d, ...updates } : d);
    saveToDB('isp_derivaciones', newDerivaciones);
    return { derivaciones: newDerivaciones };
  }),

  deleteDerivacion: (id) => set(s => {
    const newDerivaciones = s.derivaciones.filter(d => d.id !== id);
    saveToDB('isp_derivaciones', newDerivaciones);
    return { derivaciones: newDerivaciones };
  }),

  // ===================== CATÁLOGOS (solo lectura) =====================
  categorias: CATEGORIAS,
  subcategorias: SUBCATEGORIAS,
  prioridadesSLA: PRIORIDADES_SLA,
  estadosCatalogo: ESTADOS_CATALOGO,
  catalogoServicios: CATALOGO_SERVICIOS,

  getSubcategoriasByCategoria: (catId) => SUBCATEGORIAS.filter(s => s.categoriaId === catId),
  getEstadosByEntidad: (entidad) => ESTADOS_CATALOGO.filter(e => e.entidad === entidad),
  getSLABySubcategoria: (subId) => PRIORIDADES_SLA.find(p => p.subcategoriaId === subId),

  // ===================== POST-VENTA =====================
  postVenta: [],

  addPostVenta: (pv) => set(s => {
    const newPostVenta = [{ ...pv, id: getNextId(s.postVenta, 'PV'), fecha: pv.fecha || new Date().toISOString().split('T')[0] }, ...s.postVenta];
    saveToDB('isp_postVenta', newPostVenta);
    return { postVenta: newPostVenta };
  }),

  updatePostVenta: (id, updates) => set(s => {
    const newPostVenta = s.postVenta.map(p => p.id === id ? { ...p, ...updates } : p);
    saveToDB('isp_postVenta', newPostVenta);
    return { postVenta: newPostVenta };
  }),

  deletePostVenta: (id) => set(s => {
    const newPostVenta = s.postVenta.filter(p => p.id !== id);
    saveToDB('isp_postVenta', newPostVenta);
    return { postVenta: newPostVenta };
  }),

  // ===================== MOVIMIENTOS EQUIPOS =====================
  movimientosEquipos: [],

  addMovimientoEquipo: (mov) => set(s => {
    const newId = getNextId(s.movimientosEquipos, 'MOV');
    const newMovimientos = [{ ...mov, id: newId, fecha: new Date().toISOString().split('T')[0] }, ...s.movimientosEquipos];
    saveToDB('isp_movimientosEquipos', newMovimientos);
    return { movimientosEquipos: newMovimientos };
  }),

  // ===================== SISTEMA: RESTAURACIÓN =====================
  restoreSystem: (data) => set(() => {
    const keysToRestore = [
      'clients', 'tickets', 'averias', 'visitas', 'tecnicos',
      'equipos', 'instalaciones', 'postVenta', 'sesionesRemoto',
      'derivaciones', 'importHistory', 'whatsappLogs', 'templates',
      'columnPrefs', 'cleaningOptions', 'movimientosEquipos'
    ];

    const newState = {};
    keysToRestore.forEach(key => {
      if (data[key]) {
        newState[key] = data[key];
        saveToDB(`isp_${key}`, data[key]);
      }
    });
    return newState;
  }),
}));

export default useStore;
