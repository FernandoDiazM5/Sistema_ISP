export type RoleType = 'SUPER_ADMIN' | 'ADMIN' | 'TECNICO' | 'VENDEDOR' | 'VIEWER';

export interface UserPermission {
    id: string;
    name: string;
}

export interface UserRole {
    id: RoleType;
    name: string;
    permissions: string[];
}

export interface User {
    uid: string;
    email: string;
    nombre: string;
    foto?: string | null;
    rol: RoleType;
    permisos: string[];
    activo: boolean; // Note: 'activo' in interface, 'active' might be used elsewhere, check consistency
    createdAt: string;
    updatedAt: string;
    lastLogin?: string;
    authType?: 'google_oauth' | 'email_password';
    createdBy?: string;
    ultimoAcceso?: string | null;
}

// MANTENER COMPATIBILIDAD: ROLES debe seguir siendo un objeto de strings
export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    TECNICO: 'TECNICO',
    VIEWER: 'VIEWER',
} as const;

export const PERMISSION_LEVELS = {
    NONE: 'none',
    READ: 'read',
    WRITE: 'write',
    ADMIN: 'admin',
} as const;

export const MODULES = {
    DASHBOARD: 'dashboard',
    CLIENTES: 'clientes',
    TICKETS: 'tickets',
    AVERIAS: 'averias',
    INSTALACIONES: 'instalaciones',
    VISITAS: 'visitas',
    TECNICOS: 'tecnicos',
    EQUIPOS: 'equipos',
    PLANTA_EXTERNA: 'planta_externa',
    POST_VENTA: 'post_venta',
    SOPORTE_REMOTO: 'soporte_remoto',
    REQUERIMIENTOS: 'requerimientos',
    WHATSAPP: 'whatsapp',
    REPORTES: 'reportes',
    CONFIGURACION: 'configuracion',
    USUARIOS: 'usuarios',
} as const;

export const DEFAULT_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: {
        [MODULES.DASHBOARD]: PERMISSION_LEVELS.ADMIN,
        [MODULES.CLIENTES]: PERMISSION_LEVELS.ADMIN,
        [MODULES.TICKETS]: PERMISSION_LEVELS.ADMIN,
        [MODULES.AVERIAS]: PERMISSION_LEVELS.ADMIN,
        [MODULES.INSTALACIONES]: PERMISSION_LEVELS.ADMIN,
        [MODULES.VISITAS]: PERMISSION_LEVELS.ADMIN,
        [MODULES.TECNICOS]: PERMISSION_LEVELS.ADMIN,
        [MODULES.EQUIPOS]: PERMISSION_LEVELS.ADMIN,
        [MODULES.PLANTA_EXTERNA]: PERMISSION_LEVELS.ADMIN,
        [MODULES.POST_VENTA]: PERMISSION_LEVELS.ADMIN,
        [MODULES.SOPORTE_REMOTO]: PERMISSION_LEVELS.ADMIN,
        [MODULES.REQUERIMIENTOS]: PERMISSION_LEVELS.ADMIN,
        [MODULES.WHATSAPP]: PERMISSION_LEVELS.ADMIN,
        [MODULES.REPORTES]: PERMISSION_LEVELS.ADMIN,
        [MODULES.CONFIGURACION]: PERMISSION_LEVELS.ADMIN,
        [MODULES.USUARIOS]: PERMISSION_LEVELS.ADMIN,
    },
    [ROLES.ADMIN]: {
        [MODULES.DASHBOARD]: PERMISSION_LEVELS.ADMIN,
        [MODULES.CLIENTES]: PERMISSION_LEVELS.ADMIN,
        [MODULES.TICKETS]: PERMISSION_LEVELS.ADMIN,
        [MODULES.AVERIAS]: PERMISSION_LEVELS.ADMIN,
        [MODULES.INSTALACIONES]: PERMISSION_LEVELS.ADMIN,
        [MODULES.VISITAS]: PERMISSION_LEVELS.ADMIN,
        [MODULES.TECNICOS]: PERMISSION_LEVELS.ADMIN,
        [MODULES.EQUIPOS]: PERMISSION_LEVELS.ADMIN,
        [MODULES.PLANTA_EXTERNA]: PERMISSION_LEVELS.ADMIN,
        [MODULES.POST_VENTA]: PERMISSION_LEVELS.ADMIN,
        [MODULES.SOPORTE_REMOTO]: PERMISSION_LEVELS.ADMIN,
        [MODULES.REQUERIMIENTOS]: PERMISSION_LEVELS.ADMIN,
        [MODULES.WHATSAPP]: PERMISSION_LEVELS.ADMIN,
        [MODULES.REPORTES]: PERMISSION_LEVELS.ADMIN,
        [MODULES.CONFIGURACION]: PERMISSION_LEVELS.WRITE,
        [MODULES.USUARIOS]: PERMISSION_LEVELS.NONE,
    },
    [ROLES.TECNICO]: {
        [MODULES.DASHBOARD]: PERMISSION_LEVELS.READ,
        [MODULES.CLIENTES]: PERMISSION_LEVELS.WRITE,
        [MODULES.TICKETS]: PERMISSION_LEVELS.WRITE,
        [MODULES.AVERIAS]: PERMISSION_LEVELS.WRITE,
        [MODULES.INSTALACIONES]: PERMISSION_LEVELS.WRITE,
        [MODULES.VISITAS]: PERMISSION_LEVELS.WRITE,
        [MODULES.TECNICOS]: PERMISSION_LEVELS.READ,
        [MODULES.EQUIPOS]: PERMISSION_LEVELS.WRITE,
        [MODULES.PLANTA_EXTERNA]: PERMISSION_LEVELS.WRITE,
        [MODULES.POST_VENTA]: PERMISSION_LEVELS.WRITE,
        [MODULES.SOPORTE_REMOTO]: PERMISSION_LEVELS.WRITE,
        [MODULES.REQUERIMIENTOS]: PERMISSION_LEVELS.WRITE,
        [MODULES.WHATSAPP]: PERMISSION_LEVELS.WRITE,
        [MODULES.REPORTES]: PERMISSION_LEVELS.READ,
        [MODULES.CONFIGURACION]: PERMISSION_LEVELS.NONE,
        [MODULES.USUARIOS]: PERMISSION_LEVELS.NONE,
    },
    [ROLES.VIEWER]: {
        [MODULES.DASHBOARD]: PERMISSION_LEVELS.READ,
        [MODULES.CLIENTES]: PERMISSION_LEVELS.READ,
        [MODULES.TICKETS]: PERMISSION_LEVELS.READ,
        [MODULES.AVERIAS]: PERMISSION_LEVELS.READ,
        [MODULES.INSTALACIONES]: PERMISSION_LEVELS.READ,
        [MODULES.VISITAS]: PERMISSION_LEVELS.READ,
        [MODULES.TECNICOS]: PERMISSION_LEVELS.READ,
        [MODULES.EQUIPOS]: PERMISSION_LEVELS.READ,
        [MODULES.PLANTA_EXTERNA]: PERMISSION_LEVELS.READ,
        [MODULES.POST_VENTA]: PERMISSION_LEVELS.READ,
        [MODULES.SOPORTE_REMOTO]: PERMISSION_LEVELS.READ,
        [MODULES.REQUERIMIENTOS]: PERMISSION_LEVELS.READ,
        [MODULES.WHATSAPP]: PERMISSION_LEVELS.READ,
        [MODULES.REPORTES]: PERMISSION_LEVELS.READ,
        [MODULES.CONFIGURACION]: PERMISSION_LEVELS.NONE,
        [MODULES.USUARIOS]: PERMISSION_LEVELS.NONE,
    },
};

// Nueva configuración extendida (antes llamada ROLES en user.ts erróneo)
export const ROLES_CONFIG = {
    SUPER_ADMIN: {
        id: ROLES.SUPER_ADMIN,
        name: 'Super Administrador',
        permissions: ['*']
    },
    ADMIN: {
        id: ROLES.ADMIN,
        name: 'Administrador',
        permissions: Object.keys(DEFAULT_PERMISSIONS.ADMIN)
    },
    TECNICO: {
        id: ROLES.TECNICO,
        name: 'Técnico',
        permissions: Object.keys(DEFAULT_PERMISSIONS.TECNICO)
    },
    VIEWER: {
        id: ROLES.VIEWER,
        name: 'Observador',
        permissions: Object.keys(DEFAULT_PERMISSIONS.VIEWER)
    }
};

export const MODULE_LABELS = {
    [MODULES.DASHBOARD]: 'Dashboard',
    [MODULES.CLIENTES]: 'Clientes',
    [MODULES.TICKETS]: 'Tickets',
    [MODULES.AVERIAS]: 'Averías',
    [MODULES.INSTALACIONES]: 'Instalaciones',
    [MODULES.VISITAS]: 'Visitas Técnicas',
    [MODULES.TECNICOS]: 'Técnicos',
    [MODULES.EQUIPOS]: 'Equipos',
    [MODULES.PLANTA_EXTERNA]: 'Planta Externa',
    [MODULES.POST_VENTA]: 'Post-Venta',
    [MODULES.SOPORTE_REMOTO]: 'Soporte Remoto',
    [MODULES.REQUERIMIENTOS]: 'Requerimientos',
    [MODULES.WHATSAPP]: 'WhatsApp',
    [MODULES.REPORTES]: 'Reportes',
    [MODULES.CONFIGURACION]: 'Configuración',
    [MODULES.USUARIOS]: 'Usuarios',
} as const;

export const ROLE_LABELS = {
    [ROLES.SUPER_ADMIN]: { label: 'Super Administrador', desc: 'Acceso total + gestión de usuarios', color: 'purple' },
    [ROLES.ADMIN]: { label: 'Administrador', desc: 'Acceso total operativo', color: 'blue' },
    [ROLES.TECNICO]: { label: 'Técnico', desc: 'Acceso a módulos operativos', color: 'green' },
    [ROLES.VIEWER]: { label: 'Visualizador', desc: 'Solo lectura', color: 'gray' },
};
