import { create } from 'zustand';
import { DEMO_RAW_DATA } from '../utils/constants';
import { transformClientData } from '../api/dataTransformer';
import * as db from '../utils/db';

// ===================== SLICE IMPORTS =====================
import { createClientsSlice } from './slices/clientsSlice';
import { createTicketsSlice } from './slices/ticketsSlice';
import { createOperationsSlice } from './slices/operationsSlice';
import { createUISlice } from './slices/uiSlice';
import { createAuthSlice } from './slices/authSlice';

// ===================== HELPERS =====================
async function saveToDB(key, data) {
  try {
    await db.set(key, data);
  } catch (e) {
    console.error(`Error saving to DB (${key}):`, e);
  }
}

// ===================== DEMO DATA =====================
import { getSeedData } from '../utils/seedData';

// ===================== CATÁLOGOS (solo lectura) =====================
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

const TIPOS_REQUERIMIENTO = [
  { id: 'TREQ-01', nombre: 'Compra de Materiales', categoria: 'Operativo' },
  { id: 'TREQ-02', nombre: 'Compra de Equipos', categoria: 'Operativo' },
  { id: 'TREQ-03', nombre: 'Solicitud de Presupuesto', categoria: 'Administrativo' },
  { id: 'TREQ-04', nombre: 'Contratación de Servicio', categoria: 'Administrativo' },
  { id: 'TREQ-05', nombre: 'Permiso Municipal', categoria: 'Legal' },
  { id: 'TREQ-06', nombre: 'Trámite Legal', categoria: 'Legal' },
  { id: 'TREQ-07', nombre: 'Pago a Proveedor', categoria: 'Financiero' },
  { id: 'TREQ-08', nombre: 'Solicitud de Boleta', categoria: 'Financiero' },
  { id: 'TREQ-09', nombre: 'Solicitud de Factura', categoria: 'Financiero' },
  { id: 'TREQ-10', nombre: 'Cambio de Titularidad', categoria: 'Administrativo' },
  { id: 'TREQ-11', nombre: 'Otro', categoria: 'General' },
];

// ===================== STORE COMPOSITION =====================
const useStore = create((set, get) => ({
  storeReady: false,

  // ===================== COMPOSE SLICES =====================
  ...createClientsSlice(set, get),
  ...createTicketsSlice(set, get),
  ...createOperationsSlice(set, get),
  ...createUISlice(set, get),
  ...createAuthSlice(set, get),

  // ===================== HYDRATION & MIGRATION =====================
  hydrateStore: async () => {
    try {
      const dbKeys = await db.keys();

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
        }
      }

      const currentKeys = await db.keys();
      const loadedState = {};

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
        'isp_catalogoServicios': 'catalogoServicios',
        'isp_requerimientos': 'requerimientos',
        'isp_tiposRequerimiento': 'tiposRequerimiento',
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
      set({ storeReady: true });
    }
  },

  // ===================== DEMO DATA =====================
  loadDemoData: async () => {
    const seed = getSeedData(transformClientData);
    set({ dataSource: 'demo', ...seed });

    for (const [key, val] of Object.entries(seed)) {
      await saveToDB(`isp_${key}`, val);
    }
    await saveToDB('isp_dataSource', 'demo');
  },

  // ===================== TÉCNICOS =====================
  tecnicos: [],

  addTecnico: (tecnico) => set(s => {
    const getNextId = (col, prefix) => {
      if (!col || col.length === 0) return `${prefix}-001`;
      const maxId = col.reduce((max, item) => {
        const parts = item.id.split('-');
        const num = parseInt(parts[parts.length - 1] || 0);
        return !isNaN(num) && num > max ? num : max;
      }, 0);
      return `${prefix}-${String(maxId + 1).padStart(3, '0')}`;
    };
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

  // ===================== CATÁLOGOS =====================
  categorias: CATEGORIAS,
  subcategorias: SUBCATEGORIAS,
  prioridadesSLA: PRIORIDADES_SLA,
  estadosCatalogo: ESTADOS_CATALOGO,
  catalogoServicios: CATALOGO_SERVICIOS,
  tiposRequerimiento: TIPOS_REQUERIMIENTO,

  addServicioCatalogo: (servicio) => set(s => {
    const maxId = s.catalogoServicios.reduce((max, srv) => {
      const num = parseInt(srv.id.split('-')[1] || 0);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const newId = `SRV-${String(maxId + 1).padStart(2, '0')}`;
    const newCatalogo = [...s.catalogoServicios, { ...servicio, id: newId }];
    saveToDB('isp_catalogoServicios', newCatalogo);
    return { catalogoServicios: newCatalogo };
  }),

  updateServicioCatalogo: (id, updates) => set(s => {
    const newCatalogo = s.catalogoServicios.map(srv => srv.id === id ? { ...srv, ...updates } : srv);
    saveToDB('isp_catalogoServicios', newCatalogo);
    return { catalogoServicios: newCatalogo };
  }),

  deleteServicioCatalogo: (id) => set(s => {
    const newCatalogo = s.catalogoServicios.filter(srv => srv.id !== id);
    saveToDB('isp_catalogoServicios', newCatalogo);
    return { catalogoServicios: newCatalogo };
  }),

  addTipoRequerimiento: (tipo) => set(s => {
    const maxId = s.tiposRequerimiento.reduce((max, t) => {
      const num = parseInt(t.id.split('-')[1] || 0);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const newId = `TREQ-${String(maxId + 1).padStart(2, '0')}`;
    const newTipos = [...s.tiposRequerimiento, { ...tipo, id: newId }];
    saveToDB('isp_tiposRequerimiento', newTipos);
    return { tiposRequerimiento: newTipos };
  }),

  updateTipoRequerimiento: (id, updates) => set(s => {
    const newTipos = s.tiposRequerimiento.map(t => t.id === id ? { ...t, ...updates } : t);
    saveToDB('isp_tiposRequerimiento', newTipos);
    return { tiposRequerimiento: newTipos };
  }),

  deleteTipoRequerimiento: (id) => set(s => {
    const newTipos = s.tiposRequerimiento.filter(t => t.id !== id);
    saveToDB('isp_tiposRequerimiento', newTipos);
    return { tiposRequerimiento: newTipos };
  }),

  getSubcategoriasByCategoria: (catId) => SUBCATEGORIAS.filter(s => s.categoriaId === catId),
  getEstadosByEntidad: (entidad) => ESTADOS_CATALOGO.filter(e => e.entidad === entidad),
  getSLABySubcategoria: (subId) => PRIORIDADES_SLA.find(p => p.subcategoriaId === subId),

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
