import { Wifi, LayoutDashboard, Users, Ticket, CloudUpload, Box, Settings, LogOut, AlertTriangle, MonitorSmartphone, BarChart3, MessageSquare, Wrench, HardHat, Calendar, Cable, ShoppingBag, FileText, UserCog } from 'lucide-react';
import { useAuth } from '../../auth/GoogleAuthProvider';
import { ROLES } from '../../auth/roles';
import { NavLink } from 'react-router-dom';
import { ROLES as USER_ROLES } from '../../types/user';

const navSections = [
  {
    label: 'Principal', items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/clientes', label: 'Clientes', icon: Users },
    ]
  },
  {
    label: 'Soporte', items: [
      { to: '/tickets', label: 'Tickets', icon: Ticket },
      { to: '/averias', label: 'Averías', icon: AlertTriangle },
      { to: '/soporte', label: 'Soporte Remoto', icon: MonitorSmartphone },
      { to: '/whatsapp', label: 'WhatsApp', icon: MessageSquare },
    ]
  },
  {
    label: 'Operaciones', items: [
      { to: '/tecnicos', label: 'Técnicos', icon: Wrench },
      { to: '/visitas', label: 'Visitas Técnicas', icon: Calendar },
      { to: '/instalaciones', label: 'Instalaciones', icon: HardHat },
      { to: '/planta-externa', label: 'Planta Externa', icon: Cable },
      { to: '/post-venta', label: 'Post-Venta', icon: ShoppingBag },
      { to: '/requerimientos', label: 'Requerimientos', icon: FileText },
    ]
  },
  {
    label: 'Sistema', items: [
      { to: '/equipos', label: 'Equipos', icon: Box },
      { to: '/reportes', label: 'Reportes', icon: BarChart3 },
      { to: '/usuarios', label: 'Usuarios', icon: UserCog },
      { to: '/importar', label: 'Importar Datos', icon: CloudUpload },
      { to: '/config', label: 'Configuración', icon: Settings },
    ]
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const role = ROLES[user?.rol] || ROLES.TECNICO;

  // Filtrar items de navegación basado en permisos
  const getFilteredItems = (items) => {
    return items.filter(item => {
      // Solo mostrar "Usuarios" si es SUPER_ADMIN
      if (item.to === '/usuarios') {
        return user?.rol === USER_ROLES.SUPER_ADMIN;
      }
      // Otros items son visibles para todos (se pueden agregar más filtros aquí)
      return true;
    });
  };

  return (
    <div className="w-60 h-screen bg-bg-sidebar border-r border-border flex flex-col py-5 px-3">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
          <Wifi size={18} />
        </div>
        <div>
          <p className="font-bold text-sm tracking-tight">ISP System</p>
          <p className="text-[10px] text-text-muted">v1.0</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
        {navSections.map((section, idx) => {
          const filteredItems = getFilteredItems(section.items);

          // No mostrar sección si no tiene items visibles
          if (filteredItems.length === 0) return null;

          return (
            <div key={idx}>
              <p className="text-[9px] uppercase tracking-widest text-text-muted px-3 pt-3 pb-1 font-semibold">{section.label}</p>
              {filteredItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `flex items-center gap-2.5 py-2 px-3 rounded-[10px] border-none text-[13px] cursor-pointer transition-all w-full text-left
                      ${isActive
                        ? 'bg-accent-blue/12 text-accent-blue font-semibold'
                        : 'bg-transparent text-text-secondary font-normal hover:bg-white/[0.04]'
                      }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-3 rounded-xl bg-bg-secondary border border-border">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: role.color + '30', color: role.color }}>
            {user?.nombre?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{user?.nombre}</p>
            <p className="text-[10px] font-medium" style={{ color: role.color }}>{role.label}</p>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-1.5 w-full justify-center py-1.5 rounded-lg border border-border bg-transparent text-text-muted text-[11px] cursor-pointer hover:border-accent-red hover:text-accent-red transition-colors">
          <LogOut size={12} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
