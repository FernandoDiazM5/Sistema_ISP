// =====================================================
// Sistema Unificado de Roles
// =====================================================
// Este archivo re-exporta desde types/user.js para
// mantener compatibilidad con componentes antiguos.
// Usa los nuevos roles: SUPER_ADMIN, ADMIN, TECNICO, VIEWER

import { ROLES as USER_ROLES } from '../types/user';

// Mapeo visual de roles para la UI
export const ROLES = {
  SUPER_ADMIN: {
    label: 'Super Administrador',
    color: '#a855f7', // Púrpura
    permissions: ['*'], // Acceso total
  },
  ADMIN: {
    label: 'Administrador',
    color: '#3b82f6', // Azul
    permissions: ['*'], // Acceso total operativo
  },
  TECNICO: {
    label: 'Técnico',
    color: '#10b981', // Verde
    permissions: ['visitas', 'equipos', 'tickets', 'clientes', 'averias', 'instalaciones'],
  },
  VIEWER: {
    label: 'Visualizador',
    color: '#64748b', // Gris
    permissions: ['dashboard', 'reportes'], // Solo lectura
  },
};

// Usuario demo (usa SUPER_ADMIN ahora)
export const DEMO_USERS = [
  { email: 'admin@isp-system.com', rol: USER_ROLES.SUPER_ADMIN, nombre: 'Fernando Díaz' },
];

// Función helper para verificar permisos
export function hasPermission(user, perm) {
  if (!user) return false;
  const role = ROLES[user.rol];
  if (!role) return false;
  return role.permissions.includes('*') || role.permissions.includes(perm);
}
