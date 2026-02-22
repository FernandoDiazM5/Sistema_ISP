import { create } from 'zustand';
import { subscribeToCollection, saveDocument, deleteDocument, migrateDataToCollections } from '../api/firebase';
import * as db from '../utils/db'; // Legacy DB access for migration

// ===================== SLICE IMPORTS =====================
import { createClientsSlice } from './slices/clientsSlice';
import { createTicketsSlice } from './slices/ticketsSlice';
import { createOperationsSlice } from './slices/operationsSlice';
import { createUISlice } from './slices/uiSlice';
import { createAuthSlice } from './slices/authSlice';
import { createUsersSlice } from './slices/usersSlice';

// ===================== TYPE IMPORTS =====================
import { ITecnico, ICatalogoServicio } from '../types/models';

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
export interface StoreState {
  storeReady: boolean;
  isMigrating: boolean;
  theme?: string;

  tecnicos: ITecnico[];
  addTecnico: (tecnico: Omit<ITecnico, 'id'>) => void;
  updateTecnico: (id: string, updates: Partial<ITecnico>) => void;
  deleteTecnico: (id: string) => void;

  restoreSystem: (data: any) => void;

  categorias: any[];
  subcategorias: any[];
  prioridadesSLA: any[];
  estadosCatalogo: any[];
  catalogoServicios: ICatalogoServicio[];
  tiposRequerimiento: any[];

  addServicioCatalogo: (servicio: Omit<ICatalogoServicio, 'id'>) => void;
  deleteServicioCatalogo: (id: string) => void;
  addTipoRequerimiento: (tipo: any) => void;
  updateTipoRequerimiento: (id: string, updates: any) => void;
  deleteTipoRequerimiento: (id: string) => void;

  getSubcategoriasByCategoria: (catId: string) => any[];
  getEstadosByEntidad: (entidad: string) => any[];
  getSLABySubcategoria: (subId: string) => any;
  hydrateStore: () => Promise<void>;

  [key: string]: any; // Permite integrar los slices gradualmente
}

const useStore = create<StoreState>((set: any, get: any) => ({
  storeReady: false,
  isMigrating: false,

  // ===================== COMPOSE SLICES =====================
  ...createClientsSlice(set, get),
  ...createTicketsSlice(set, get),
  ...createOperationsSlice(set, get),
  ...createUISlice(set, get),
  ...createAuthSlice(set, get),
  ...createUsersSlice(set, get),

  // ===================== INITIALIZATION =====================
  hydrateStore: async () => {
    try {
      // 1. Verificar si necesitamos migrar datos legacy
      const legacyKeys = await db.keys();
      const hasLegacyData = legacyKeys.some(k => k.startsWith('isp_'));
      const migrationDone = localStorage.getItem('migration_v1_done');

      if (hasLegacyData && !migrationDone) {
        set({ isMigrating: true });
        console.log("Detectados datos legacy. Iniciando migración...");

        // Cargar todo desde IndexedDB
        const legacyData = {};
        for (const key of legacyKeys) {
          if (key.startsWith('isp_')) {
            const val = await db.get(key);
            legacyData[key.replace('isp_', '')] = val;
          }
        }

        // Ejecutar migración
        const success = await migrateDataToCollections(legacyData);
        if (success) {
          localStorage.setItem('migration_v1_done', 'true');
          // Opcional: Limpiar IndexedDB viejo
          // await db.clear(); 
          console.log("Migración finalizada.");
        } else {
          console.error("Falló la migración.");
        }
        set({ isMigrating: false });
      }

      // 2. Suscribirse a colecciones en tiempo real
      // Esto poblará el store automáticamente desde la caché local o la nube
      // Hidratar desde IndexedDB primero (datos locales rápidos)
      const keyMap = {
        isp_clients: 'clients',
        isp_tickets: 'tickets',
        isp_averias: 'averias',
        isp_equipos: 'equipos',
        isp_visitas: 'visitas',
        isp_instalaciones: 'instalaciones',
        isp_derivaciones: 'derivaciones',
        isp_postVenta: 'postVenta',
        isp_sesionesRemoto: 'sesionesRemoto',
        isp_movimientosEquipos: 'movimientosEquipos',
        isp_whatsappLogs: 'whatsappLogs',
        isp_templates: 'templates',
        isp_requerimientos: 'requerimientos',
        isp_col_prefs: 'columnPrefs',
        isp_cleaningOptions: 'cleaningOptions',
        isp_importHistory: 'importHistory',
        isp_branding: 'branding',
        isp_customRolePermissions: 'customRolePermissions',
        isp_whatsappCategories: 'whatsappCategories',
        isp_theme: 'theme',
        isp_categorias: 'categorias',
        isp_subcategorias: 'subcategorias',
        isp_prioridadesSLA: 'prioridadesSLA',
        isp_estadosCatalogo: 'estadosCatalogo',
        isp_catalogoServicios: 'catalogoServicios',
        isp_tiposRequerimiento: 'tiposRequerimiento',
      };

      const updates: any = {};
      for (const [dbKey, stateKey] of Object.entries(keyMap)) {
        try {
          const val = await db.get(dbKey);
          if (val !== undefined && val !== null) {
            updates[stateKey] = val;
          }
        } catch (e) { /* ignore missing keys */ }
      }
      if (Object.keys(updates).length > 0) {
        set(updates);
      }

      // Aplicar tema si fue cargado
      if (updates.theme && updates.theme !== 'default') {
        document.documentElement.setAttribute('data-theme', updates.theme);
      }

      // Cargar settings de Firebase (no bloqueante)
      get().loadSettingsFromCloud?.();

      // Marca la tienda como lista
      set({ storeReady: true });

    } catch (e) {
      console.error("Error durante hydrateStore:", e);
      set({ storeReady: true });
    }
  },

  // ===================== TÉCNICOS (Wrapper para Firestore) =====================
  tecnicos: [],

  addTecnico: (tecnico: Omit<ITecnico, 'id'>) => {
    const s = get();
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
    const newTecnico = { ...tecnico, id: newId };

    // Actualización optimista local
    set(state => ({ tecnicos: [newTecnico, ...state.tecnicos] }));
    // Persistencia
    saveDocument('tecnicos', newTecnico);
  },

  updateTecnico: (id: string, updates: Partial<ITecnico>) => {
    set((s: any) => ({
      tecnicos: s.tecnicos.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
    saveDocument('tecnicos', { id, ...updates });
  },

  deleteTecnico: (id: string) => {
    set((s: any) => ({ tecnicos: s.tecnicos.filter((t: any) => t.id !== id) }));
    deleteDocument('tecnicos', id);
  },

  // ===================== APPLY DELTAS (para live sync incremental) =====================
  applyDeltas: (data: any) => {
    const keysToRestore = [
      'clients', 'tickets', 'averias', 'tecnicos', 'equipos', 'visitas',
      'instalaciones', 'derivaciones', 'postVenta', 'sesionesRemoto',
      'movimientosEquipos', 'whatsappLogs', 'templates', 'requerimientos',
      'columnPrefs', 'cleaningOptions', 'importHistory',
      'branding', 'customRolePermissions', 'whatsappCategories',
      'categorias', 'subcategorias', 'prioridadesSLA',
      'estadosCatalogo', 'catalogoServicios', 'tiposRequerimiento'
    ];

    set((state: any) => {
      const updates: any = {};
      for (const key of keysToRestore) {
        if (data[key] && Array.isArray(data[key]) && data[key].length > 0) {
          const incomingItems = data[key];
          const existingItems = state[key] || [];

          if (!Array.isArray(existingItems)) {
            updates[key] = incomingItems; // Fallback para objetos planos
          } else {
            // Fusionar arrays por ID, el incoming sobreescribe al local existente
            const mergedMap = new Map(existingItems.map((item: any) => [item.id, item]));
            for (const incoming of incomingItems) {
              mergedMap.set(incoming.id, incoming);
            }
            updates[key] = Array.from(mergedMap.values());
          }
        }
      }
      return updates;
    });

    // Guardar en DB asíncronamente luego de setear
    setTimeout(() => {
      const state = get();
      const dbKeyMap = {
        clients: 'isp_clients', tickets: 'isp_tickets', averias: 'isp_averias',
        equipos: 'isp_equipos', visitas: 'isp_visitas', instalaciones: 'isp_instalaciones',
        derivaciones: 'isp_derivaciones', postVenta: 'isp_postVenta',
        sesionesRemoto: 'isp_sesionesRemoto', movimientosEquipos: 'isp_movimientosEquipos',
        whatsappLogs: 'isp_whatsappLogs', templates: 'isp_templates',
        requerimientos: 'isp_requerimientos', columnPrefs: 'isp_col_prefs',
        cleaningOptions: 'isp_cleaningOptions', importHistory: 'isp_importHistory',
        branding: 'isp_branding', customRolePermissions: 'isp_customRolePermissions',
        whatsappCategories: 'isp_whatsappCategories',
        categorias: 'isp_categorias',
        subcategorias: 'isp_subcategorias',
        prioridadesSLA: 'isp_prioridadesSLA',
        estadosCatalogo: 'isp_estadosCatalogo',
        catalogoServicios: 'isp_catalogoServicios',
        tiposRequerimiento: 'isp_tiposRequerimiento',
      };

      for (const key of keysToRestore) {
        if (data[key] && Array.isArray(data[key]) && data[key].length > 0) {
          const dbKey = (dbKeyMap as any)[key];
          if (dbKey && state[key] !== undefined) {
            db.set(dbKey, state[key]).catch(() => { });
          }
        }
      }
    }, 0);
  },

  // ===================== RESTORE SYSTEM (para backups y live sync full) =====================
  restoreSystem: (data: any) => {
    const keysToRestore = [
      'clients', 'tickets', 'averias', 'tecnicos', 'equipos', 'visitas',
      'instalaciones', 'derivaciones', 'postVenta', 'sesionesRemoto',
      'movimientosEquipos', 'whatsappLogs', 'templates', 'requerimientos',
      'columnPrefs', 'cleaningOptions', 'importHistory',
      'branding', 'customRolePermissions', 'whatsappCategories',
      'categorias', 'subcategorias', 'prioridadesSLA',
      'estadosCatalogo', 'catalogoServicios', 'tiposRequerimiento'
    ];
    const updates: any = {};
    for (const key of keysToRestore) {
      if (data[key] !== undefined) {
        updates[key] = data[key];
      }
    }
    if (Object.keys(updates).length > 0) {
      set(updates);
      // Persistir localmente en IndexedDB
      const dbKeyMap = {
        clients: 'isp_clients', tickets: 'isp_tickets', averias: 'isp_averias',
        equipos: 'isp_equipos', visitas: 'isp_visitas', instalaciones: 'isp_instalaciones',
        derivaciones: 'isp_derivaciones', postVenta: 'isp_postVenta',
        sesionesRemoto: 'isp_sesionesRemoto', movimientosEquipos: 'isp_movimientosEquipos',
        whatsappLogs: 'isp_whatsappLogs', templates: 'isp_templates',
        requerimientos: 'isp_requerimientos', columnPrefs: 'isp_col_prefs',
        cleaningOptions: 'isp_cleaningOptions', importHistory: 'isp_importHistory',
        branding: 'isp_branding', customRolePermissions: 'isp_customRolePermissions',
        whatsappCategories: 'isp_whatsappCategories',
        categorias: 'isp_categorias',
        subcategorias: 'isp_subcategorias',
        prioridadesSLA: 'isp_prioridadesSLA',
        estadosCatalogo: 'isp_estadosCatalogo',
        catalogoServicios: 'isp_catalogoServicios',
        tiposRequerimiento: 'isp_tiposRequerimiento',
      };
      for (const [stateKey, dbKey] of Object.entries(dbKeyMap)) {
        if (updates[stateKey] !== undefined) {
          db.set(dbKey, updates[stateKey]).catch(() => { });
        }
      }
    }
    // Aplicar tema si viene en los datos
    if (data.theme) {
      set({ theme: data.theme });
      if (data.theme === 'default') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', data.theme);
      }
    }
  },

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
    return { catalogoServicios: [...s.catalogoServicios, { ...servicio, id: newId }] };
  }),

  deleteServicioCatalogo: (id) => set(s => ({
    catalogoServicios: s.catalogoServicios.filter(srv => srv.id !== id),
  })),

  // CRUD para Tipos de Requerimiento
  addTipoRequerimiento: (tipo) => set(s => {
    const maxId = s.tiposRequerimiento.reduce((max, t) => {
      const num = parseInt(t.id.split('-')[1] || 0);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const newId = `TREQ-${String(maxId + 1).padStart(2, '0')}`;
    return { tiposRequerimiento: [...s.tiposRequerimiento, { ...tipo, id: newId }] };
  }),

  updateTipoRequerimiento: (id, updates) => set(s => ({
    tiposRequerimiento: s.tiposRequerimiento.map(t => t.id === id ? { ...t, ...updates } : t),
  })),

  deleteTipoRequerimiento: (id) => set(s => ({
    tiposRequerimiento: s.tiposRequerimiento.filter(t => t.id !== id),
  })),

  // Helpers de lectura dinámicos
  getSubcategoriasByCategoria: (catId) => get().subcategorias.filter((s: any) => s.categoriaId === catId),
  getEstadosByEntidad: (entidad) => get().estadosCatalogo.filter((e: any) => e.entidad === entidad),
  getSLABySubcategoria: (subId) => get().prioridadesSLA.find((p: any) => p.subcategoriaId === subId),
}));

export default useStore;
