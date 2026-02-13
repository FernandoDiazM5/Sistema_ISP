export const ROLES = {
  ADMIN: {
    label: 'Administrador',
    color: '#e74c3c',
    permissions: ['*'],
  },
  SUPERVISOR: {
    label: 'Supervisor',
    color: '#f39c12',
    permissions: ['dashboard', 'clientes', 'tickets', 'reportes'],
  },
  ASESOR: {
    label: 'Asesor Soporte',
    color: '#3b82f6',
    permissions: ['clientes.read', 'tickets', 'soporte'],
  },
  TECNICO: {
    label: 'Técnico',
    color: '#27ae60',
    permissions: ['visitas', 'equipos', 'tickets.read'],
  },
};

export const DEMO_USERS = [
  { email: 'admin@isp-system.com', rol: 'ADMIN', nombre: 'Fernando Díaz' },
];

export function hasPermission(user, perm) {
  if (!user) return false;
  const role = ROLES[user.rol];
  if (!role) return false;
  return role.permissions.includes('*') || role.permissions.includes(perm);
}
