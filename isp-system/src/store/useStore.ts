import { create } from 'zustand';
import { subscribeToCollection, saveDocument, deleteDocument, migrateDataToCollections } from '../api/firebase';
import * as db from '../utils/db'; // Legacy DB access for migration
import { getNextId, ISP_KEY_MAP, STORE_TO_DB_KEY_MAP } from '../utils/helpers';

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
  // CAT-01: Falla de Internet
  { id: 'PRI-01', subcategoriaId: 'SUB-101', prioridad: 'Crítica', tiempoLimite: '4 horas', impacto: 'Cliente incomunicado' },
  { id: 'PRI-02', subcategoriaId: 'SUB-102', prioridad: 'Media', tiempoLimite: '24 horas', impacto: 'Servicio degradado' },
  { id: 'PRI-03', subcategoriaId: 'SUB-103', prioridad: 'Media', tiempoLimite: '24 horas', impacto: 'Conexión intermitente' },
  { id: 'PRI-04', subcategoriaId: 'SUB-104', prioridad: 'Baja', tiempoLimite: '48 horas', impacto: 'Acceso parcial a sitios' },
  { id: 'PRI-05', subcategoriaId: 'SUB-105', prioridad: 'Baja', tiempoLimite: '48 horas', impacto: 'Velocidad por debajo del plan' },
  // CAT-02: Falla de Cable
  { id: 'PRI-06', subcategoriaId: 'SUB-201', prioridad: 'Alta', tiempoLimite: '12 horas', impacto: 'Sin señal de TV' },
  { id: 'PRI-07', subcategoriaId: 'SUB-202', prioridad: 'Alta', tiempoLimite: '12 horas', impacto: 'Imagen congelada / mala calidad' },
  { id: 'PRI-08', subcategoriaId: 'SUB-203', prioridad: 'Media', tiempoLimite: '24 horas', impacto: 'Decodificador con falla' },
  // CAT-03: Configuración
  { id: 'PRI-09', subcategoriaId: 'SUB-301', prioridad: 'Baja', tiempoLimite: '48 horas', impacto: 'Cambio de red WiFi' },
  { id: 'PRI-10', subcategoriaId: 'SUB-302', prioridad: 'Baja', tiempoLimite: '72 horas', impacto: 'Apertura de puertos' },
  { id: 'PRI-11', subcategoriaId: 'SUB-303', prioridad: 'Baja', tiempoLimite: '48 horas', impacto: 'Reseteo de equipo remoto' },
  // CAT-04: Infraestructura
  { id: 'PRI-12', subcategoriaId: 'SUB-401', prioridad: 'Alta', tiempoLimite: '12 horas', impacto: 'Infraestructura dañada' },
  { id: 'PRI-13', subcategoriaId: 'SUB-402', prioridad: 'Alta', tiempoLimite: '12 horas', impacto: 'Nodo o NAP dañado' },
  { id: 'PRI-14', subcategoriaId: 'SUB-403', prioridad: 'Media', tiempoLimite: '48 horas', impacto: 'Cambio de domicilio del servicio' },
  // CAT-05: Hardware
  { id: 'PRI-15', subcategoriaId: 'SUB-501', prioridad: 'Alta', tiempoLimite: '8 horas', impacto: 'Router u ONT averiado' },
  { id: 'PRI-16', subcategoriaId: 'SUB-502', prioridad: 'Alta', tiempoLimite: '8 horas', impacto: 'Transformador o POE dañado' },
  { id: 'PRI-17', subcategoriaId: 'SUB-503', prioridad: 'Alta', tiempoLimite: '8 horas', impacto: 'Puerto LAN inutilizable' },
  // CAT-06: Administrativo
  { id: 'PRI-18', subcategoriaId: 'SUB-601', prioridad: 'Media', tiempoLimite: '4 horas', impacto: 'Cliente sin servicio por pago' },
  { id: 'PRI-19', subcategoriaId: 'SUB-602', prioridad: 'Baja', tiempoLimite: '48 horas', impacto: 'Cambio de plan solicitado' },
  { id: 'PRI-20', subcategoriaId: 'SUB-603', prioridad: 'Baja', tiempoLimite: '72 horas', impacto: 'Consulta o error de facturación' },
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

const AVERIAS_TIPOS = [
  { id: 'AVTP-01', nombre: 'Corte de fibra' },
  { id: 'AVTP-02', nombre: 'Caída de nodo' },
  { id: 'AVTP-03', nombre: 'Interferencia' },
  { id: 'AVTP-04', nombre: 'Falla eléctrica' },
  { id: 'AVTP-05', nombre: 'Daño de equipo' },
  { id: 'AVTP-06', nombre: 'Otra' },
];

const TIPOS_VISITA = [
  { id: 'TVIS-01', nombre: 'Reparacion' },
  { id: 'TVIS-02', nombre: 'Diagnostico' },
  { id: 'TVIS-03', nombre: 'Instalacion' },
  { id: 'TVIS-04', nombre: 'Cambio de plan' },
  { id: 'TVIS-05', nombre: 'Mantenimiento' },
];

const TIPOS_SESION_SOPORTE = [
  { id: 'TSS-01', nombre: 'Diagnóstico' },
  { id: 'TSS-02', nombre: 'Configuración' },
  { id: 'TSS-03', nombre: 'Monitoreo' },
  { id: 'TSS-04', nombre: 'Reinicio remoto' },
];

const TIPOS_DERIVACION = [
  { id: 'TDER-01', nombre: 'Tendido de fibra' },
  { id: 'TDER-02', nombre: 'Reparación de poste' },
  { id: 'TDER-03', nombre: 'AP Saturado' },
  { id: 'TDER-04', nombre: 'Corte de fibra' },
  { id: 'TDER-05', nombre: 'Atenuación excesiva' },
  { id: 'TDER-06', nombre: 'Mantenimiento NAP' },
  { id: 'TDER-07', nombre: 'Extensión de red' },
];

const TIPOS_EQUIPO = [
  { id: 'TEQ-01', nombre: 'ONU' },
  { id: 'TEQ-02', nombre: 'Router' },
  { id: 'TEQ-03', nombre: 'Antena CPE' },
  { id: 'TEQ-04', nombre: 'Antena AP' },
  { id: 'TEQ-05', nombre: 'Switch' },
  { id: 'TEQ-06', nombre: 'OLT' },
  { id: 'TEQ-07', nombre: 'Media Converter' },
];

const MARCAS_EQUIPO = [
  { id: 'MEQ-01', nombre: 'Huawei' },
  { id: 'MEQ-02', nombre: 'VSOL' },
  { id: 'MEQ-03', nombre: 'Mikrotik' },
  { id: 'MEQ-04', nombre: 'Ubiquiti' },
  { id: 'MEQ-05', nombre: 'TP-Link' },
  { id: 'MEQ-06', nombre: 'Tenda' },
  { id: 'MEQ-07', nombre: 'ZTE' },
  { id: 'MEQ-08', nombre: 'Nokia' },
];

const PLANES_INSTALACION = [
  { id: 'PLAN-01', nombre: 'INTERNET FIBRA 100MB', velocidad: '100MB', tecnologia: 'Fibra Óptica' },
  { id: 'PLAN-02', nombre: 'INTERNET FIBRA 200MB', velocidad: '200MB', tecnologia: 'Fibra Óptica' },
  { id: 'PLAN-03', nombre: 'INTERNET FIBRA 300MB', velocidad: '300MB', tecnologia: 'Fibra Óptica' },
  { id: 'PLAN-04', nombre: 'INTERNET RADIO 30MB', velocidad: '30MB', tecnologia: 'Radio Enlace' },
  { id: 'PLAN-05', nombre: 'INTERNET RADIO 50MB', velocidad: '50MB', tecnologia: 'Radio Enlace' },
  { id: 'PLAN-06', nombre: 'INTERNET RADIO 65MB', velocidad: '65MB', tecnologia: 'Radio Enlace' },
  { id: 'PLAN-07', nombre: 'INTERNET RADIO 100MB', velocidad: '100MB', tecnologia: 'Radio Enlace' },
];

const TECNOLOGIAS_INSTALACION = [
  { id: 'TEC-01', nombre: 'Radio Enlace' },
  { id: 'TEC-02', nombre: 'Fibra Óptica' },
];

const CARGOS_TECNICO = [
  { id: 'CAR-01', nombre: 'Técnico Instalador' },
  { id: 'CAR-02', nombre: 'Liniero de Planta Externa' },
  { id: 'CAR-03', nombre: 'Técnico de Soporte NOC' },
  { id: 'CAR-04', nombre: 'Supervisor de Zona' },
];

const ESPECIALIDADES_TECNICO = [
  { id: 'ESP-01', nombre: 'Fibra Óptica (FTTH)' },
  { id: 'ESP-02', nombre: 'Radio Enlace (WISP)' },
  { id: 'ESP-03', nombre: 'Redes Estructuradas (HFC/LAN)' },
  { id: 'ESP-04', nombre: 'Electricidad y Energía' },
];

const VEHICULOS_TECNICO = [
  { id: 'VEH-01', nombre: 'Camioneta 4x4' },
  { id: 'VEH-02', nombre: 'Motocicleta' },
  { id: 'VEH-03', nombre: 'Transporte A Pie / Púbico' },
  { id: 'VEH-04', nombre: 'Auto Sedán' },
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

  // CRUD Categorías
  addCategoria: (data: { nombre: string; descripcion: string }) => void;
  updateCategoria: (id: string, updates: { nombre?: string; descripcion?: string }) => void;
  deleteCategoria: (id: string) => void;

  // CRUD Subcategorías
  addSubcategoria: (data: { categoriaId: string; nombre: string; tipoAtencion: string }) => void;
  updateSubcategoria: (id: string, updates: any) => void;
  deleteSubcategoria: (id: string) => void;

  // CRUD Prioridades SLA
  addPrioridadSLA: (data: { subcategoriaId: string; prioridad: string; tiempoLimite: string; impacto: string }) => void;
  updatePrioridadSLA: (id: string, updates: any) => void;
  deletePrioridadSLA: (id: string) => void;

  // CRUD Estados Catálogo
  addEstadoCatalogo: (data: { entidad: string; nombre: string; color: string; orden: number; esFinal: boolean }) => void;
  updateEstadoCatalogo: (id: string, updates: any) => void;
  deleteEstadoCatalogo: (id: string) => void;

  // CRUD Tipos de Averías
  averiasTipos: any[];
  addAveriaTipo: (nombre: string) => void;
  updateAveriaTipo: (id: string, nombre: string) => void;
  deleteAveriaTipo: (id: string) => void;

  // CRUD Tipos de Visita
  tiposVisita: any[];
  addTipoVisita: (nombre: string) => void;
  updateTipoVisita: (id: string, nombre: string) => void;
  deleteTipoVisita: (id: string) => void;

  // CRUD Tipos de Sesión Soporte Remoto
  tiposSesionSoporte: any[];
  addTipoSesionSoporte: (nombre: string) => void;
  updateTipoSesionSoporte: (id: string, nombre: string) => void;
  deleteTipoSesionSoporte: (id: string) => void;

  // CRUD Tipos de Derivación Planta Externa
  tiposDerivacion: any[];
  addTipoDerivacion: (nombre: string) => void;
  updateTipoDerivacion: (id: string, nombre: string) => void;
  deleteTipoDerivacion: (id: string) => void;

  // CRUD Tipos de Equipo
  tiposEquipo: any[];
  addTipoEquipo: (nombre: string) => void;
  updateTipoEquipo: (id: string, nombre: string) => void;
  deleteTipoEquipo: (id: string) => void;

  // CRUD Marcas de Equipo
  marcasEquipo: any[];
  addMarcaEquipo: (nombre: string) => void;
  updateMarcaEquipo: (id: string, nombre: string) => void;
  deleteMarcaEquipo: (id: string) => void;

  // CRUD Planes de Instalación
  planesInstalacion: any[];
  addPlanInstalacion: (data: { nombre: string; velocidad: string; tecnologia: string }) => void;
  updatePlanInstalacion: (id: string, updates: any) => void;
  deletePlanInstalacion: (id: string) => void;

  // CRUD Tecnologías de Instalación
  tecnologiasInstalacion: any[];
  addTecnologiaInstalacion: (nombre: string) => void;
  updateTecnologiaInstalacion: (id: string, nombre: string) => void;
  deleteTecnologiaInstalacion: (id: string) => void;

  // CRUD Catálogos de Técnicos
  cargosTecnico: any[];
  addCargoTecnico: (nombre: string) => void;
  updateCargoTecnico: (id: string, nombre: string) => void;
  deleteCargoTecnico: (id: string) => void;

  especialidadesTecnico: any[];
  addEspecialidadTecnico: (nombre: string) => void;
  updateEspecialidadTecnico: (id: string, nombre: string) => void;
  deleteEspecialidadTecnico: (id: string) => void;

  vehiculosTecnico: any[];
  addVehiculoTecnico: (nombre: string) => void;
  updateVehiculoTecnico: (id: string, nombre: string) => void;
  deleteVehiculoTecnico: (id: string) => void;

  getSubcategoriasByCategoria: (catId: string) => any[];
  getEstadosByEntidad: (entidad: string) => any[];
  getSLABySubcategoria: (subId: string) => any;
  hydrateStore: () => Promise<void>;

  [key: string]: any; // Permite integrar los slices gradualmente

  // ==== GLOBAL LOADING UI ====
  isLoadingGlobal: boolean;
  loadingMessageGlobal: string;
  setLoadingGlobal: (isLoading: boolean, message?: string) => void;
}

const useStore = create<StoreState>((set: any, get: any) => ({
  storeReady: false,
  isMigrating: false,

  // ==== GLOBAL LOADING UI ====
  isLoadingGlobal: false,
  loadingMessageGlobal: '',
  setLoadingGlobal: (isLoading: boolean, message = '') => set({ isLoadingGlobal: isLoading, loadingMessageGlobal: message }),

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
      const updates: any = {};

      // Lista de colecciones maestras que NO deben ser reemplazadas por arrays vacíos.
      const catalogKeysToProtect = [
        'categorias', 'subcategorias', 'prioridadesSLA',
        'estadosCatalogo', 'catalogoServicios', 'tiposRequerimiento', 'averiasTipos',
        'tiposVisita', 'tiposSesionSoporte', 'tiposDerivacion',
        'tiposEquipo', 'marcasEquipo', 'planesInstalacion', 'tecnologiasInstalacion',
        'cargosTecnico', 'especialidadesTecnico', 'vehiculosTecnico'
      ];

      for (const [dbKey, stateKey] of Object.entries(ISP_KEY_MAP)) {
        try {
          const val = await db.get(dbKey);
          if (val !== undefined && val !== null) {
            // Protección contra catálogos vacíos
            if (catalogKeysToProtect.includes(stateKey) && Array.isArray(val) && val.length === 0) {
              continue; // Evitamos hidratar un catálogo maestro vacío, preservando los por defecto
            }
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
      'estadosCatalogo', 'catalogoServicios', 'tiposRequerimiento',
      'averiasTipos', 'clientChanges',
      'tiposVisita', 'tiposSesionSoporte', 'tiposDerivacion',
      'tiposEquipo', 'marcasEquipo', 'planesInstalacion', 'tecnologiasInstalacion',
      'cargosTecnico', 'especialidadesTecnico', 'vehiculosTecnico'
    ];

    set((state: any) => {
      const updates: any = {};
      for (const key of keysToRestore) {
        if (data[key] && Array.isArray(data[key])) {

          // Nunca reemplazar con arreglos vacíos (protege catálogos y cualquier colección)
          if (data[key].length === 0) {
            continue;
          }

          const incomingItems = data[key];
          const existingItems = state[key] || [];

          if (!Array.isArray(existingItems)) {
            updates[key] = incomingItems;
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

    // Guardar en DB de forma síncrona dentro del mismo ciclo de actualización
    const state = get();
    for (const key of keysToRestore) {
      if (data[key] && Array.isArray(data[key]) && data[key].length > 0) {
        const dbKey = (STORE_TO_DB_KEY_MAP as any)[key];
        if (dbKey && state[key] !== undefined) {
          db.set(dbKey, state[key]).catch((err: any) => {
            console.error(`[IndexedDB] Error al persistir delta '${key}':`, err);
          });
        }
      }
    }
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
      'estadosCatalogo', 'catalogoServicios', 'tiposRequerimiento',
      'averiasTipos', 'clientChanges',
      'tiposVisita', 'tiposSesionSoporte', 'tiposDerivacion',
      'tiposEquipo', 'marcasEquipo', 'planesInstalacion', 'tecnologiasInstalacion',
    ];

    const catalogKeysToProtect = [
      'categorias', 'subcategorias', 'prioridadesSLA',
      'estadosCatalogo', 'catalogoServicios', 'tiposRequerimiento', 'averiasTipos',
      'tiposVisita', 'tiposSesionSoporte', 'tiposDerivacion',
      'tiposEquipo', 'marcasEquipo', 'planesInstalacion', 'tecnologiasInstalacion',
    ];

    const updates: any = {};
    for (const key of keysToRestore) {
      if (data[key] !== undefined) {
        // Validación: No reemplazar catálogos maestros con arreglos vacíos
        if (catalogKeysToProtect.includes(key) && Array.isArray(data[key]) && data[key].length === 0) {
          continue; // Saltar, manteniendo la constante de catálogo precargada
        }
        updates[key] = data[key];
      }
    }
    if (Object.keys(updates).length > 0) {
      set(updates);
      // Persistir localmente en IndexedDB
      for (const [stateKey, dbKey] of Object.entries(STORE_TO_DB_KEY_MAP)) {
        if (updates[stateKey] !== undefined) {
          db.set(dbKey, updates[stateKey]).catch((err: any) => {
            console.error(`[IndexedDB] Error al persistir '${stateKey}' en '${dbKey}':`, err);
          });
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

  // ===================== CATÁLOGOS OPERATIVOS =====================
  tiposVisita: TIPOS_VISITA,
  addTipoVisita: (nombre: string) => {
    const s = get();
    const max = s.tiposVisita.reduce((m: number, t: any) => { const n = parseInt(t.id?.split('-')[1] || '0'); return isNaN(n) ? m : Math.max(m, n); }, 0);
    const newItem = { id: `TVIS-${String(max + 1).padStart(2, '0')}`, nombre };
    const updated = [...s.tiposVisita, newItem];
    set({ tiposVisita: updated });
    db.set('isp_tiposVisita', updated).catch((e: any) => console.error('[IndexedDB] tiposVisita:', e));
    saveDocument('tiposVisita', newItem);
  },
  updateTipoVisita: (id: string, nombre: string) => {
    const updated = get().tiposVisita.map((t: any) => t.id === id ? { ...t, nombre } : t);
    set({ tiposVisita: updated });
    db.set('isp_tiposVisita', updated).catch((e: any) => console.error('[IndexedDB] tiposVisita:', e));
    saveDocument('tiposVisita', { id, nombre });
  },
  deleteTipoVisita: (id: string) => {
    const updated = get().tiposVisita.filter((t: any) => t.id !== id);
    set({ tiposVisita: updated });
    db.set('isp_tiposVisita', updated).catch((e: any) => console.error('[IndexedDB] tiposVisita:', e));
    deleteDocument('tiposVisita', id);
  },

  tiposSesionSoporte: TIPOS_SESION_SOPORTE,
  addTipoSesionSoporte: (nombre: string) => {
    const s = get();
    const max = s.tiposSesionSoporte.reduce((m: number, t: any) => { const n = parseInt(t.id?.split('-')[1] || '0'); return isNaN(n) ? m : Math.max(m, n); }, 0);
    const newItem = { id: `TSS-${String(max + 1).padStart(2, '0')}`, nombre };
    const updated = [...s.tiposSesionSoporte, newItem];
    set({ tiposSesionSoporte: updated });
    db.set('isp_tiposSesionSoporte', updated).catch((e: any) => console.error('[IndexedDB] tiposSesionSoporte:', e));
    saveDocument('tiposSesionSoporte', newItem);
  },
  updateTipoSesionSoporte: (id: string, nombre: string) => {
    const updated = get().tiposSesionSoporte.map((t: any) => t.id === id ? { ...t, nombre } : t);
    set({ tiposSesionSoporte: updated });
    db.set('isp_tiposSesionSoporte', updated).catch((e: any) => console.error('[IndexedDB] tiposSesionSoporte:', e));
    saveDocument('tiposSesionSoporte', { id, nombre });
  },
  deleteTipoSesionSoporte: (id: string) => {
    const updated = get().tiposSesionSoporte.filter((t: any) => t.id !== id);
    set({ tiposSesionSoporte: updated });
    db.set('isp_tiposSesionSoporte', updated).catch((e: any) => console.error('[IndexedDB] tiposSesionSoporte:', e));
    deleteDocument('tiposSesionSoporte', id);
  },

  tiposDerivacion: TIPOS_DERIVACION,
  addTipoDerivacion: (nombre: string) => {
    const s = get();
    const max = s.tiposDerivacion.reduce((m: number, t: any) => { const n = parseInt(t.id?.split('-')[1] || '0'); return isNaN(n) ? m : Math.max(m, n); }, 0);
    const newItem = { id: `TDER-${String(max + 1).padStart(2, '0')}`, nombre };
    const updated = [...s.tiposDerivacion, newItem];
    set({ tiposDerivacion: updated });
    db.set('isp_tiposDerivacion', updated).catch((e: any) => console.error('[IndexedDB] tiposDerivacion:', e));
    saveDocument('tiposDerivacion', newItem);
  },
  updateTipoDerivacion: (id: string, nombre: string) => {
    const updated = get().tiposDerivacion.map((t: any) => t.id === id ? { ...t, nombre } : t);
    set({ tiposDerivacion: updated });
    db.set('isp_tiposDerivacion', updated).catch((e: any) => console.error('[IndexedDB] tiposDerivacion:', e));
    saveDocument('tiposDerivacion', { id, nombre });
  },
  deleteTipoDerivacion: (id: string) => {
    const updated = get().tiposDerivacion.filter((t: any) => t.id !== id);
    set({ tiposDerivacion: updated });
    db.set('isp_tiposDerivacion', updated).catch((e: any) => console.error('[IndexedDB] tiposDerivacion:', e));
    deleteDocument('tiposDerivacion', id);
  },

  tiposEquipo: TIPOS_EQUIPO,
  addTipoEquipo: (nombre: string) => {
    const s = get();
    const max = s.tiposEquipo.reduce((m: number, t: any) => { const n = parseInt(t.id?.split('-')[1] || '0'); return isNaN(n) ? m : Math.max(m, n); }, 0);
    const newItem = { id: `TEQ-${String(max + 1).padStart(2, '0')}`, nombre };
    const updated = [...s.tiposEquipo, newItem];
    set({ tiposEquipo: updated });
    db.set('isp_tiposEquipo', updated).catch((e: any) => console.error('[IndexedDB] tiposEquipo:', e));
    saveDocument('tiposEquipo', newItem);
  },
  updateTipoEquipo: (id: string, nombre: string) => {
    const updated = get().tiposEquipo.map((t: any) => t.id === id ? { ...t, nombre } : t);
    set({ tiposEquipo: updated });
    db.set('isp_tiposEquipo', updated).catch((e: any) => console.error('[IndexedDB] tiposEquipo:', e));
    saveDocument('tiposEquipo', { id, nombre });
  },
  deleteTipoEquipo: (id: string) => {
    const updated = get().tiposEquipo.filter((t: any) => t.id !== id);
    set({ tiposEquipo: updated });
    db.set('isp_tiposEquipo', updated).catch((e: any) => console.error('[IndexedDB] tiposEquipo:', e));
    deleteDocument('tiposEquipo', id);
  },

  marcasEquipo: MARCAS_EQUIPO,
  addMarcaEquipo: (nombre: string) => {
    const s = get();
    const max = s.marcasEquipo.reduce((m: number, t: any) => { const n = parseInt(t.id?.split('-')[1] || '0'); return isNaN(n) ? m : Math.max(m, n); }, 0);
    const newItem = { id: `MEQ-${String(max + 1).padStart(2, '0')}`, nombre };
    const updated = [...s.marcasEquipo, newItem];
    set({ marcasEquipo: updated });
    db.set('isp_marcasEquipo', updated).catch((e: any) => console.error('[IndexedDB] marcasEquipo:', e));
    saveDocument('marcasEquipo', newItem);
  },
  updateMarcaEquipo: (id: string, nombre: string) => {
    const updated = get().marcasEquipo.map((t: any) => t.id === id ? { ...t, nombre } : t);
    set({ marcasEquipo: updated });
    db.set('isp_marcasEquipo', updated).catch((e: any) => console.error('[IndexedDB] marcasEquipo:', e));
    saveDocument('marcasEquipo', { id, nombre });
  },
  deleteMarcaEquipo: (id: string) => {
    const updated = get().marcasEquipo.filter((t: any) => t.id !== id);
    set({ marcasEquipo: updated });
    db.set('isp_marcasEquipo', updated).catch((e: any) => console.error('[IndexedDB] marcasEquipo:', e));
    deleteDocument('marcasEquipo', id);
  },

  planesInstalacion: PLANES_INSTALACION,
  addPlanInstalacion: (data: { nombre: string; velocidad: string; tecnologia: string }) => {
    const s = get();
    const max = s.planesInstalacion.reduce((m: number, t: any) => { const n = parseInt(t.id?.split('-')[1] || '0'); return isNaN(n) ? m : Math.max(m, n); }, 0);
    const newItem = { id: `PLAN-${String(max + 1).padStart(2, '0')}`, ...data };
    const updated = [...s.planesInstalacion, newItem];
    set({ planesInstalacion: updated });
    db.set('isp_planesInstalacion', updated).catch((e: any) => console.error('[IndexedDB] planesInstalacion:', e));
    saveDocument('planesInstalacion', newItem);
  },
  updatePlanInstalacion: (id: string, updates: any) => {
    const updated = get().planesInstalacion.map((t: any) => t.id === id ? { ...t, ...updates } : t);
    set({ planesInstalacion: updated });
    db.set('isp_planesInstalacion', updated).catch((e: any) => console.error('[IndexedDB] planesInstalacion:', e));
    saveDocument('planesInstalacion', { id, ...updates });
  },
  deletePlanInstalacion: (id: string) => {
    const updated = get().planesInstalacion.filter((t: any) => t.id !== id);
    set({ planesInstalacion: updated });
    db.set('isp_planesInstalacion', updated).catch((e: any) => console.error('[IndexedDB] planesInstalacion:', e));
    deleteDocument('planesInstalacion', id);
  },

  tecnologiasInstalacion: TECNOLOGIAS_INSTALACION,
  addTecnologiaInstalacion: (nombre: string) => {
    const s = get();
    const max = s.tecnologiasInstalacion.reduce((m: number, t: any) => { const n = parseInt(t.id?.split('-')[1] || '0'); return isNaN(n) ? m : Math.max(m, n); }, 0);
    const newItem = { id: `TEC-${String(max + 1).padStart(2, '0')}`, nombre };
    const updated = [...s.tecnologiasInstalacion, newItem];
    set({ tecnologiasInstalacion: updated });
    db.set('isp_tecnologiasInstalacion', updated).catch((e: any) => console.error('[IndexedDB] tecnologiasInstalacion:', e));
    saveDocument('tecnologiasInstalacion', newItem);
  },
  updateTecnologiaInstalacion: (id: string, nombre: string) => {
    const updated = get().tecnologiasInstalacion.map((t: any) => t.id === id ? { ...t, nombre } : t);
    set({ tecnologiasInstalacion: updated });
    db.set('isp_tecnologiasInstalacion', updated).catch((e: any) => console.error('[IndexedDB] tecnologiasInstalacion:', e));
    saveDocument('tecnologiasInstalacion', { id, nombre });
  },
  deleteTecnologiaInstalacion: (id: string) => {
    const updated = get().tecnologiasInstalacion.filter((t: any) => t.id !== id);
    set({ tecnologiasInstalacion: updated });
    db.set('isp_tecnologiasInstalacion', updated).catch((e: any) => console.error('[IndexedDB] tecnologiasInstalacion:', e));
    deleteDocument('tecnologiasInstalacion', id);
  },

  // CRUD Cargos Técnico
  cargosTecnico: CARGOS_TECNICO,
  addCargoTecnico: (nombre) => {
    const s = get();
    const max = s.cargosTecnico.reduce((m: number, t: any) => { const n = parseInt(t.id?.split('-')[1] || '0'); return isNaN(n) ? m : Math.max(m, n); }, 0);
    const newItem = { id: `CAR-${String(max + 1).padStart(2, '0')}`, nombre };
    const updated = [...s.cargosTecnico, newItem];
    set({ cargosTecnico: updated });
    db.set('isp_cargosTecnico', updated).catch(console.error);
    saveDocument('cargosTecnico', newItem);
  },
  updateCargoTecnico: (id, nombre) => {
    const updated = get().cargosTecnico.map((t: any) => t.id === id ? { ...t, nombre } : t);
    set({ cargosTecnico: updated });
    db.set('isp_cargosTecnico', updated).catch(console.error);
    saveDocument('cargosTecnico', { id, nombre });
  },
  deleteCargoTecnico: (id) => {
    const updated = get().cargosTecnico.filter((t: any) => t.id !== id);
    set({ cargosTecnico: updated });
    db.set('isp_cargosTecnico', updated).catch(console.error);
    deleteDocument('cargosTecnico', id);
  },

  // CRUD Especialidades Técnico
  especialidadesTecnico: ESPECIALIDADES_TECNICO,
  addEspecialidadTecnico: (nombre) => {
    const s = get();
    const max = s.especialidadesTecnico.reduce((m: number, t: any) => { const n = parseInt(t.id?.split('-')[1] || '0'); return isNaN(n) ? m : Math.max(m, n); }, 0);
    const newItem = { id: `ESP-${String(max + 1).padStart(2, '0')}`, nombre };
    const updated = [...s.especialidadesTecnico, newItem];
    set({ especialidadesTecnico: updated });
    db.set('isp_especialidadesTecnico', updated).catch(console.error);
    saveDocument('especialidadesTecnico', newItem);
  },
  updateEspecialidadTecnico: (id, nombre) => {
    const updated = get().especialidadesTecnico.map((t: any) => t.id === id ? { ...t, nombre } : t);
    set({ especialidadesTecnico: updated });
    db.set('isp_especialidadesTecnico', updated).catch(console.error);
    saveDocument('especialidadesTecnico', { id, nombre });
  },
  deleteEspecialidadTecnico: (id) => {
    const updated = get().especialidadesTecnico.filter((t: any) => t.id !== id);
    set({ especialidadesTecnico: updated });
    db.set('isp_especialidadesTecnico', updated).catch(console.error);
    deleteDocument('especialidadesTecnico', id);
  },

  // CRUD Vehiculos Técnico
  vehiculosTecnico: VEHICULOS_TECNICO,
  addVehiculoTecnico: (nombre) => {
    const s = get();
    const max = s.vehiculosTecnico.reduce((m: number, t: any) => { const n = parseInt(t.id?.split('-')[1] || '0'); return isNaN(n) ? m : Math.max(m, n); }, 0);
    const newItem = { id: `VEH-${String(max + 1).padStart(2, '0')}`, nombre };
    const updated = [...s.vehiculosTecnico, newItem];
    set({ vehiculosTecnico: updated });
    db.set('isp_vehiculosTecnico', updated).catch(console.error);
    saveDocument('vehiculosTecnico', newItem);
  },
  updateVehiculoTecnico: (id, nombre) => {
    const updated = get().vehiculosTecnico.map((t: any) => t.id === id ? { ...t, nombre } : t);
    set({ vehiculosTecnico: updated });
    db.set('isp_vehiculosTecnico', updated).catch(console.error);
    saveDocument('vehiculosTecnico', { id, nombre });
  },
  deleteVehiculoTecnico: (id) => {
    const updated = get().vehiculosTecnico.filter((t: any) => t.id !== id);
    set({ vehiculosTecnico: updated });
    db.set('isp_vehiculosTecnico', updated).catch(console.error);
    deleteDocument('vehiculosTecnico', id);
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

  // ===================== AVERIAS TIPOS =====================
  averiasTipos: AVERIAS_TIPOS,

  addAveriaTipo: (nombre: string) => {
    const s = get();
    const max = s.averiasTipos.reduce((m: number, t: any) => {
      const n = parseInt(t.id?.split('-')[1] || '0'); return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    const newItem = { id: `AVTP-${String(max + 1).padStart(2, '0')}`, nombre };
    const updated = [...s.averiasTipos, newItem];
    set({ averiasTipos: updated });
    db.set('isp_averiasTipos', updated).catch((e: any) => console.error('[IndexedDB] averiasTipos:', e));
    saveDocument('averiasTipos', newItem);
  },

  updateAveriaTipo: (id: string, nombre: string) => {
    const updated = get().averiasTipos.map((t: any) => t.id === id ? { ...t, nombre } : t);
    set({ averiasTipos: updated });
    db.set('isp_averiasTipos', updated).catch((e: any) => console.error('[IndexedDB] averiasTipos:', e));
    saveDocument('averiasTipos', { id, nombre });
  },

  deleteAveriaTipo: (id: string) => {
    const updated = get().averiasTipos.filter((t: any) => t.id !== id);
    set({ averiasTipos: updated });
    db.set('isp_averiasTipos', updated).catch((e: any) => console.error('[IndexedDB] averiasTipos:', e));
    deleteDocument('averiasTipos', id);
  },

  // ===================== CRUD CATEGORÍAS =====================
  addCategoria: (data: { nombre: string; descripcion: string }) => {
    const s = get();
    const max = s.categorias.reduce((m: number, c: any) => {
      const n = parseInt(c.id?.split('-')[1] || '0'); return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    const newItem = { ...data, id: `CAT-${String(max + 1).padStart(2, '0')}` };
    const updated = [...s.categorias, newItem];
    set({ categorias: updated });
    db.set('isp_categorias', updated).catch((e: any) => console.error('[IndexedDB] categorias:', e));
    saveDocument('categorias', newItem);
  },

  updateCategoria: (id: string, updates: any) => {
    const updated = get().categorias.map((c: any) => c.id === id ? { ...c, ...updates } : c);
    set({ categorias: updated });
    db.set('isp_categorias', updated).catch((e: any) => console.error('[IndexedDB] categorias:', e));
    saveDocument('categorias', { id, ...updates });
  },

  deleteCategoria: (id: string) => {
    const s = get();
    const subIds = s.subcategorias.filter((sub: any) => sub.categoriaId === id).map((sub: any) => sub.id);
    const slaIds = s.prioridadesSLA.filter((p: any) => subIds.includes(p.subcategoriaId)).map((p: any) => p.id);
    const updatedCats = s.categorias.filter((c: any) => c.id !== id);
    const updatedSubs = s.subcategorias.filter((sub: any) => sub.categoriaId !== id);
    const updatedSLAs = s.prioridadesSLA.filter((p: any) => !subIds.includes(p.subcategoriaId));
    set({ categorias: updatedCats, subcategorias: updatedSubs, prioridadesSLA: updatedSLAs });
    db.set('isp_categorias', updatedCats).catch((e: any) => console.error('[IndexedDB] categorias:', e));
    db.set('isp_subcategorias', updatedSubs).catch((e: any) => console.error('[IndexedDB] subcategorias:', e));
    db.set('isp_prioridadesSLA', updatedSLAs).catch((e: any) => console.error('[IndexedDB] prioridadesSLA:', e));
    deleteDocument('categorias', id);
    subIds.forEach((sid: string) => deleteDocument('subcategorias', sid));
    slaIds.forEach((sid: string) => deleteDocument('prioridadesSLA', sid));
  },

  // ===================== CRUD SUBCATEGORÍAS =====================
  addSubcategoria: (data: { categoriaId: string; nombre: string; tipoAtencion: string }) => {
    const s = get();
    const max = s.subcategorias.reduce((m: number, sub: any) => {
      const n = parseInt(sub.id?.split('-')[1] || '0'); return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    const newItem = { ...data, id: `SUB-${String(max + 1).padStart(3, '0')}` };
    const updated = [...s.subcategorias, newItem];
    set({ subcategorias: updated });
    db.set('isp_subcategorias', updated).catch((e: any) => console.error('[IndexedDB] subcategorias:', e));
    saveDocument('subcategorias', newItem);
  },

  updateSubcategoria: (id: string, updates: any) => {
    const updated = get().subcategorias.map((s: any) => s.id === id ? { ...s, ...updates } : s);
    set({ subcategorias: updated });
    db.set('isp_subcategorias', updated).catch((e: any) => console.error('[IndexedDB] subcategorias:', e));
    saveDocument('subcategorias', { id, ...updates });
  },

  deleteSubcategoria: (id: string) => {
    const s = get();
    const slaIds = s.prioridadesSLA.filter((p: any) => p.subcategoriaId === id).map((p: any) => p.id);
    const updatedSubs = s.subcategorias.filter((sub: any) => sub.id !== id);
    const updatedSLAs = s.prioridadesSLA.filter((p: any) => p.subcategoriaId !== id);
    set({ subcategorias: updatedSubs, prioridadesSLA: updatedSLAs });
    db.set('isp_subcategorias', updatedSubs).catch((e: any) => console.error('[IndexedDB] subcategorias:', e));
    db.set('isp_prioridadesSLA', updatedSLAs).catch((e: any) => console.error('[IndexedDB] prioridadesSLA:', e));
    deleteDocument('subcategorias', id);
    slaIds.forEach((sid: string) => deleteDocument('prioridadesSLA', sid));
  },

  // ===================== CRUD PRIORIDADES SLA =====================
  addPrioridadSLA: (data: { subcategoriaId: string; prioridad: string; tiempoLimite: string; impacto: string }) => {
    const s = get();
    const max = s.prioridadesSLA.reduce((m: number, p: any) => {
      const n = parseInt(p.id?.split('-')[1] || '0'); return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    const newItem = { ...data, id: `PRI-${String(max + 1).padStart(2, '0')}` };
    const updated = [...s.prioridadesSLA, newItem];
    set({ prioridadesSLA: updated });
    db.set('isp_prioridadesSLA', updated).catch((e: any) => console.error('[IndexedDB] prioridadesSLA:', e));
    saveDocument('prioridadesSLA', newItem);
  },

  updatePrioridadSLA: (id: string, updates: any) => {
    const updated = get().prioridadesSLA.map((p: any) => p.id === id ? { ...p, ...updates } : p);
    set({ prioridadesSLA: updated });
    db.set('isp_prioridadesSLA', updated).catch((e: any) => console.error('[IndexedDB] prioridadesSLA:', e));
    saveDocument('prioridadesSLA', { id, ...updates });
  },

  deletePrioridadSLA: (id: string) => {
    const updated = get().prioridadesSLA.filter((p: any) => p.id !== id);
    set({ prioridadesSLA: updated });
    db.set('isp_prioridadesSLA', updated).catch((e: any) => console.error('[IndexedDB] prioridadesSLA:', e));
    deleteDocument('prioridadesSLA', id);
  },

  // ===================== CRUD ESTADOS CATÁLOGO =====================
  addEstadoCatalogo: (data: { entidad: string; nombre: string; color: string; orden: number; esFinal: boolean }) => {
    const s = get();
    const max = s.estadosCatalogo.reduce((m: number, e: any) => {
      const n = parseInt(e.id?.split('-')[1] || '0'); return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    const newItem = { ...data, id: `EST-${String(max + 1).padStart(2, '0')}` };
    const updated = [...s.estadosCatalogo, newItem];
    set({ estadosCatalogo: updated });
    db.set('isp_estadosCatalogo', updated).catch((e: any) => console.error('[IndexedDB] estadosCatalogo:', e));
    saveDocument('estadosCatalogo', newItem);
  },

  updateEstadoCatalogo: (id: string, updates: any) => {
    const updated = get().estadosCatalogo.map((e: any) => e.id === id ? { ...e, ...updates } : e);
    set({ estadosCatalogo: updated });
    db.set('isp_estadosCatalogo', updated).catch((e: any) => console.error('[IndexedDB] estadosCatalogo:', e));
    saveDocument('estadosCatalogo', { id, ...updates });
  },

  deleteEstadoCatalogo: (id: string) => {
    const updated = get().estadosCatalogo.filter((e: any) => e.id !== id);
    set({ estadosCatalogo: updated });
    db.set('isp_estadosCatalogo', updated).catch((e: any) => console.error('[IndexedDB] estadosCatalogo:', e));
    deleteDocument('estadosCatalogo', id);
  },

  // Helpers de lectura dinámicos
  getSubcategoriasByCategoria: (catId) => get().subcategorias.filter((s: any) => s.categoriaId === catId),
  getEstadosByEntidad: (entidad) => get().estadosCatalogo.filter((e: any) => e.entidad === entidad),
  getSLABySubcategoria: (subId) => get().prioridadesSLA.find((p: any) => p.subcategoriaId === subId),
}));

export default useStore;
