import { Wifi, LayoutDashboard, Users, Ticket, CloudUpload, Box, Settings, LogOut, AlertTriangle, MonitorSmartphone, BarChart3, MessageSquare, Wrench, HardHat, Calendar, Cable, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../auth/GoogleAuthProvider';
import { ROLES } from '../../auth/roles';
import useStore from '../../store/useStore';

const navSections = [
  { label: 'Principal', items: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes', icon: Users },
  ]},
  { label: 'Soporte', items: [
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'averias', label: 'Averías', icon: AlertTriangle },
    { id: 'soporte', label: 'Soporte Remoto', icon: MonitorSmartphone },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  ]},
  { label: 'Operaciones', items: [
    { id: 'tecnicos', label: 'Técnicos', icon: Wrench },
    { id: 'visitas', label: 'Visitas Técnicas', icon: Calendar },
    { id: 'instalaciones', label: 'Instalaciones', icon: HardHat },
    { id: 'planta-externa', label: 'Planta Externa', icon: Cable },
    { id: 'post-venta', label: 'Post-Venta', icon: ShoppingBag },
  ]},
  { label: 'Sistema', items: [
    { id: 'equipos', label: 'Equipos', icon: Box },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    { id: 'importar', label: 'Importar Datos', icon: CloudUpload },
    { id: 'config', label: 'Configuración', icon: Settings },
  ]},
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const activePage = useStore(s => s.activePage);
  const setActivePage = useStore(s => s.setActivePage);
  const role = ROLES[user?.rol] || ROLES.TECNICO;

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
        {navSections.map(section => (
          <div key={section.label}>
            <p className="text-[9px] uppercase tracking-widest text-text-muted px-3 pt-3 pb-1 font-semibold">{section.label}</p>
            {section.items.map(item => {
              const isActive = activePage === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`flex items-center gap-2.5 py-2 px-3 rounded-[10px] border-none text-[13px] cursor-pointer transition-all w-full text-left
                    ${isActive
                      ? 'bg-accent-blue/12 text-accent-blue font-semibold'
                      : 'bg-transparent text-text-secondary font-normal hover:bg-white/[0.04]'
                    }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
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
