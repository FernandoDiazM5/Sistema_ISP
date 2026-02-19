import { Wifi, LayoutDashboard, Users, Ticket, CloudUpload, Box, Settings, LogOut, AlertTriangle, MonitorSmartphone, BarChart3, MessageSquare, Wrench, HardHat, Calendar, Cable, ShoppingBag, FileText, UserCog } from 'lucide-react';
import { useAuth } from '../../auth/GoogleAuthProvider';
import { ROLES } from '../../auth/roles';
import { NavLink } from 'react-router-dom';
import { ROLES as USER_ROLES, MODULES } from '../../types/user';
import useStore from '../../store/useStore';

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

const ROUTE_TO_MODULE = {
  '/': MODULES.DASHBOARD,
  '/clientes': MODULES.CLIENTES,
  '/tickets': MODULES.TICKETS,
  '/averias': MODULES.AVERIAS,
  '/soporte': MODULES.SOPORTE_REMOTO,
  '/whatsapp': MODULES.WHATSAPP,
  '/tecnicos': MODULES.TECNICOS,
  '/visitas': MODULES.VISITAS,
  '/instalaciones': MODULES.INSTALACIONES,
  '/planta-externa': MODULES.PLANTA_EXTERNA,
  '/post-venta': MODULES.POST_VENTA,
  '/requerimientos': MODULES.REQUERIMIENTOS,
  '/equipos': MODULES.EQUIPOS,
  '/reportes': MODULES.REPORTES,
  '/usuarios': MODULES.USUARIOS,
  '/config': MODULES.CONFIGURACION,
  '/importar': MODULES.CLIENTES, // Asumimos permiso de clientes o config
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const role = ROLES[user?.rol] || ROLES.TECNICO;
  const hasPermission = useStore(s => s.hasPermission);
  const branding = useStore(s => s.branding);

  // Filtrar items de navegación basado en permisos
  const getFilteredItems = (items) => {
    return items.filter(item => {
      // 1. Caso especial: Usuarios solo para SUPER_ADMIN
      if (item.to === '/usuarios') {
        return user?.rol === USER_ROLES.SUPER_ADMIN;
      }

      // 2. Verificar permiso del módulo correspondiente
      const module = ROUTE_TO_MODULE[item.to];
      if (module) {
        // Si el usuario es SUPER_ADMIN, siempre mostrar (seguridad extra)
        if (user?.rol === USER_ROLES.SUPER_ADMIN) return true;

        // Verificar nivel de lectura mínimo
        return hasPermission(module, 'read');
      }

      return true;
    });
  };

  const sidebarContent = (
    <div className="w-64 h-full bg-bg-sidebar border-r border-border flex flex-col py-5 px-3 shadow-2xl lg:shadow-none">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-8">
        {branding?.appIcon ? (
          <img src={branding.appIcon} className="w-9 h-9 rounded-[10px] object-cover shrink-0" alt="Logo" />
        ) : (
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <Wifi size={18} />
          </div>
        )}
        <div>
          <p className="font-bold text-sm tracking-tight text-white">{branding?.appName || 'ISP System'}</p>
          <p className="text-[10px] text-text-muted">{branding?.appVersion || 'v2.0 Mobile'}</p>
        </div>
        <button onClick={onClose} className="lg:hidden ml-auto text-text-muted p-1">
          <LogOut size={18} className="rotate-180" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
        {navSections.map((section, idx) => {
          const filteredItems = getFilteredItems(section.items);

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
                    onClick={() => { if (onClose) onClose(); }} // Cerrar drawer al navegar
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
      <div className="p-3 rounded-xl bg-bg-secondary border border-border mt-2">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: role.color + '30', color: role.color }}>
            {user?.nombre?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-text-primary">{user?.nombre}</p>
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

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {sidebarContent}
      </div>
    </>
  );
}
