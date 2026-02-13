import { useState } from 'react';
import { Settings, Shield, Database, Globe, Key, Users, Save, RefreshCw, CheckCircle, AlertTriangle, Wifi, UploadCloud, DownloadCloud, Moon, Sun, Monitor, Sparkles, Smartphone, Flower, Leaf, Wind } from 'lucide-react';
import { useAuth } from '../../auth/GoogleAuthProvider';
import { ROLES, DEMO_USERS } from '../../auth/roles';
import { CONFIG } from '../../utils/constants';
import useStore from '../../store/useStore';
import useSyncStore from '../../store/syncStore';

function EditableApiRow({ label, envVar, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="p-4 rounded-xl bg-bg-secondary border border-border">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-semibold">{label}</p>
          <p className="text-[10px] text-text-muted font-mono">{envVar}</p>
        </div>
        <button
          onClick={() => setShow(!show)}
          className="text-[10px] text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded cursor-pointer border-none hover:bg-accent-blue/20"
        >
          {show ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted font-mono"
      />
    </div>
  );
}

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const clients = useStore(s => s.clients);
  const dataSource = useStore(s => s.dataSource);
  const tickets = useStore(s => s.tickets);
  const averias = useStore(s => s.averias);
  const equipos = useStore(s => s.equipos);
  const theme = useStore(s => s.theme); // Moved hook to top level

  const { syncPush, syncPull, isSyncing, lastSync } = useSyncStore();

  const [activeTab, setActiveTab] = useState('general');

  // Editable API values
  const [apiValues, setApiValues] = useState(() => ({
    googleApiKey: localStorage.getItem('isp_google_api_key') || CONFIG.GOOGLE_API_KEY || '',
    googleClientId: localStorage.getItem('isp_google_client_id') || CONFIG.GOOGLE_CLIENT_ID || '',
    googleSheetId: localStorage.getItem('isp_google_sheet_id') || CONFIG.GOOGLE_SHEET_ID || '',
    geminiApiKey: localStorage.getItem('isp_gemini_api_key') || '',
    // Firebase Config
    firebaseApiKey: localStorage.getItem('isp_firebase_api_key') || '',
    firebaseAuthDomain: localStorage.getItem('isp_firebase_auth_domain') || '',
    firebaseProjectId: localStorage.getItem('isp_firebase_project_id') || '',
    firebaseStorageBucket: localStorage.getItem('isp_firebase_storage_bucket') || '',
    firebaseMessagingSenderId: localStorage.getItem('isp_firebase_messaging_sender_id') || '',
    firebaseAppId: localStorage.getItem('isp_firebase_app_id') || '',
  }));
  const [apiSaved, setApiSaved] = useState(false);

  // Editable system values
  const [sysValues, setSysValues] = useState(() => ({
    empresaNombre: localStorage.getItem('isp_empresa_nombre') || 'ISP Carabayllo',
    empresaTelefono: localStorage.getItem('isp_empresa_telefono') || '999-000-111',
    empresaEmail: localStorage.getItem('isp_empresa_email') || 'soporte@isp.com',
    empresaDireccion: localStorage.getItem('isp_empresa_direccion') || 'Carabayllo, Lima',
    moneda: localStorage.getItem('isp_moneda') || 'PEN',
    zonaHoraria: localStorage.getItem('isp_zona_horaria') || 'America/Lima',
  }));
  const [sysSaved, setSysSaved] = useState(false);

  const handleSaveApi = () => {
    localStorage.setItem('isp_google_api_key', apiValues.googleApiKey);
    localStorage.setItem('isp_google_client_id', apiValues.googleClientId);
    localStorage.setItem('isp_google_sheet_id', apiValues.googleSheetId);
    localStorage.setItem('isp_gemini_api_key', apiValues.geminiApiKey);

    // Firebase
    localStorage.setItem('isp_firebase_api_key', apiValues.firebaseApiKey);
    localStorage.setItem('isp_firebase_auth_domain', apiValues.firebaseAuthDomain);
    localStorage.setItem('isp_firebase_project_id', apiValues.firebaseProjectId);
    localStorage.setItem('isp_firebase_storage_bucket', apiValues.firebaseStorageBucket);
    localStorage.setItem('isp_firebase_messaging_sender_id', apiValues.firebaseMessagingSenderId);
    localStorage.setItem('isp_firebase_app_id', apiValues.firebaseAppId);

    setApiSaved(true);
    setTimeout(() => setApiSaved(false), 3000);
  };

  const handleSaveSys = () => {
    Object.entries(sysValues).forEach(([key, val]) => {
      localStorage.setItem('isp_' + key.replace(/([A-Z])/g, '_$1').toLowerCase(), val);
    });
    setSysSaved(true);
    setTimeout(() => setSysSaved(false), 3000);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'usuarios', label: 'Usuarios & Roles', icon: Users },
    { id: 'api', label: 'Conexión API', icon: Globe },
    { id: 'sistema', label: 'Sistema', icon: Database },
  ];

  return (
    <div className="animate-fade p-6 px-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Configuración</h1>
          <p className="text-text-secondary text-sm mt-1">Parámetros del sistema, roles y conexiones</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-secondary rounded-xl p-1 mb-6 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-4 rounded-lg text-sm border-none cursor-pointer transition-all ${activeTab === tab.id
                ? 'bg-accent-blue text-white font-semibold shadow-sm'
                : 'bg-transparent text-text-secondary hover:text-text-primary'
                }`}>
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: General */}
      {
        activeTab === 'general' && (
          <div className="grid grid-cols-2 gap-6">
            {/* ... (ISP System info card) */}
            <div className="bg-bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                  <Wifi size={18} className="text-accent-blue" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">ISP System</h3>
                  <p className="text-[11px] text-text-muted">Sistema de Gestión para Proveedores de Internet</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <InfoRow label="Versión" value="1.0.0" />
                <InfoRow label="Framework" value="React 18 + Vite 5" />
                <InfoRow label="Estado" value="Producción" badge="bg-emerald-500/10 text-emerald-400" />
                <InfoRow label="Última actualización" value={new Date().toLocaleDateString('es-PE')} />
              </div>
            </div>

            {/* Theme Selector Section */}
            <div className="bg-bg-card rounded-2xl p-6 border border-border col-span-2">
              <h3 className="text-sm font-semibold mb-4 text-text-secondary flex items-center gap-2">
                <Sparkles size={16} className="text-accent-yellow" /> Personalización
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ThemeOption
                  id="default"
                  label="Azul Noche"
                  color="#0a0e1a"
                  accent="#3b82f6"
                  icon={Moon}
                  active={theme === 'default'}
                  onClick={() => useStore.getState().setTheme('default')}
                />
                <ThemeOption
                  id="light"
                  label="Modo Claro"
                  color="#ffffff"
                  accent="#2563eb"
                  icon={Sun}
                  active={theme === 'light'}
                  onClick={() => useStore.getState().setTheme('light')}
                />
                <ThemeOption
                  id="black"
                  label="Negro OLED"
                  color="#000000"
                  accent="#e5e5e5"
                  icon={Smartphone}
                  active={theme === 'black'}
                  onClick={() => useStore.getState().setTheme('black')}
                />
                <ThemeOption
                  id="purple"
                  label="Lila Suave"
                  color="#faf5ff"
                  accent="#a855f7"
                  icon={Sparkles}
                  active={theme === 'purple'}
                  onClick={() => useStore.getState().setTheme('purple')}
                />
                <ThemeOption
                  id="rose"
                  label="Rosa Nórdico"
                  color="#fff1f2"
                  accent="#e11d48"
                  icon={Flower}
                  active={theme === 'rose'}
                  onClick={() => useStore.getState().setTheme('rose')}
                />
                <ThemeOption
                  id="ocean"
                  label="Brisa Marina"
                  color="#ecfeff"
                  accent="#0891b2"
                  icon={Wind}
                  active={theme === 'ocean'}
                  onClick={() => useStore.getState().setTheme('ocean')}
                />
                <ThemeOption
                  id="sage"
                  label="Jardín Salvia"
                  color="#f0fdf4"
                  accent="#16a34a"
                  icon={Leaf}
                  active={theme === 'sage'}
                  onClick={() => useStore.getState().setTheme('sage')}
                />
              </div>
            </div>

            <div className="bg-bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-sm font-semibold mb-4 text-text-secondary">Resumen del Sistema</h3>
              <div className="flex flex-col gap-3">
                <StatRow label="Clientes registrados" value={clients.length} color="text-accent-blue" />
                <StatRow label="Tickets" value={tickets.length} color="text-accent-purple" />
                <StatRow label="Averías registradas" value={averias.length} color="text-accent-red" />
                <StatRow label="Equipos en inventario" value={equipos.length} color="text-accent-yellow" />
                <StatRow label="Fuente de datos" value={dataSource === 'demo' ? 'Demo (30 registros)' : 'Excel importado'} color="text-text-secondary" />
              </div>
            </div>

            <div className="bg-bg-card rounded-2xl p-6 border border-border col-span-2">
              <h3 className="text-sm font-semibold mb-4 text-text-secondary">Sesión Activa</h3>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold"
                  style={{ background: (ROLES[user?.rol] || ROLES.TECNICO).color + '20', color: (ROLES[user?.rol] || ROLES.TECNICO).color }}>
                  {user?.nombre?.[0] || '?'}
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold">{user?.nombre}</p>
                  <p className="text-sm text-text-secondary">{user?.email}</p>
                  <p className="text-xs mt-1 font-medium" style={{ color: (ROLES[user?.rol] || ROLES.TECNICO).color }}>
                    {(ROLES[user?.rol] || ROLES.TECNICO).label}
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg">
                  <CheckCircle size={14} className="text-emerald-400" />
                  <span className="text-[11px] text-emerald-400 font-semibold">Sesión activa</span>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Tab: Usuarios & Roles */}
      {
        activeTab === 'usuarios' && (
          <div className="flex flex-col gap-6">
            <div className="bg-bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-sm font-semibold mb-4 text-text-secondary">Roles del Sistema</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(ROLES).map(([key, role]) => (
                  <div key={key} className="p-4 rounded-xl bg-bg-secondary border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: role.color + '20', color: role.color }}>
                        <Shield size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{role.label}</p>
                        <p className="text-[11px] text-text-muted font-mono">{key}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.map(p => (
                        <span key={p} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.05] text-text-secondary border border-border">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-sm font-semibold mb-4 text-text-secondary">Usuarios Autorizados</h3>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] text-text-muted uppercase">
                    <th className="py-2 px-3">Correo</th>
                    <th className="py-2 px-3">Rol</th>
                    <th className="py-2 px-3">Permisos</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_USERS.map(u => {
                    const r = ROLES[u.rol] || ROLES.TECNICO;
                    return (
                      <tr key={u.email} className="border-t border-border">
                        <td className="py-2.5 px-3 font-mono text-xs">{u.email}</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{ background: r.color + '15', color: r.color }}>
                            {r.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-text-muted text-[11px]">{r.permissions.length} permisos</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-[11px] text-text-muted mt-3">
                * Los usuarios se gestionan desde Google Cloud Console y la hoja <code className="text-accent-blue">tb_Usuarios_Auth</code>
              </p>
            </div>
          </div>
        )
      }

      {/* Tab: Conexión API */}
      {
        activeTab === 'api' && (
          <div className="flex flex-col gap-6">
            <div className="bg-bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-sm font-semibold mb-4 text-text-secondary">Google Cloud Platform</h3>
              <div className="flex flex-col gap-4">
                <EditableApiRow
                  label="Google API Key"
                  envVar="VITE_GOOGLE_API_KEY"
                  value={apiValues.googleApiKey}
                  onChange={v => setApiValues(p => ({ ...p, googleApiKey: v }))}
                  placeholder="AIza..."
                />
                <EditableApiRow
                  label="Google Client ID (OAuth)"
                  envVar="VITE_GOOGLE_CLIENT_ID"
                  value={apiValues.googleClientId}
                  onChange={v => setApiValues(p => ({ ...p, googleClientId: v }))}
                  placeholder="123456789-abc.apps.googleusercontent.com"
                />
                <EditableApiRow
                  label="Google Sheet ID"
                  envVar="VITE_GOOGLE_SHEET_ID"
                  value={apiValues.googleSheetId}
                  onChange={v => setApiValues(p => ({ ...p, googleSheetId: v }))}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                />
                <EditableApiRow
                  label="Gemini API Key"
                  envVar="VITE_GEMINI_API_KEY"
                  value={apiValues.geminiApiKey}
                  onChange={v => setApiValues(p => ({ ...p, geminiApiKey: v }))}
                  placeholder="AIza..."
                />

                <div className="pt-4 border-t border-border mt-2">
                  <h4 className="text-xs font-bold mb-3 text-accent-cyan flex items-center gap-2">
                    <Database size={14} /> Firebase Sync (Respaldo en la Nube)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <EditableApiRow
                      label="API Key"
                      envVar="VITE_FIREBASE_API_KEY"
                      value={apiValues.firebaseApiKey}
                      onChange={v => setApiValues(p => ({ ...p, firebaseApiKey: v }))}
                      placeholder="AIza..."
                    />
                    <EditableApiRow
                      label="Project ID"
                      envVar="VITE_FIREBASE_PROJECT_ID"
                      value={apiValues.firebaseProjectId}
                      onChange={v => setApiValues(p => ({ ...p, firebaseProjectId: v }))}
                      placeholder="isp-sistema-xxx"
                    />
                    <EditableApiRow
                      label="Auth Domain"
                      envVar="VITE_FIREBASE_AUTH_DOMAIN"
                      value={apiValues.firebaseAuthDomain}
                      onChange={v => setApiValues(p => ({ ...p, firebaseAuthDomain: v }))}
                      placeholder="isp-sistema.firebaseapp.com"
                    />
                    <EditableApiRow
                      label="Storage Bucket"
                      envVar="VITE_FIREBASE_STORAGE_BUCKET"
                      value={apiValues.firebaseStorageBucket}
                      onChange={v => setApiValues(p => ({ ...p, firebaseStorageBucket: v }))}
                      placeholder="isp-sistema.appspot.com"
                    />
                    <EditableApiRow
                      label="Msg Sender ID"
                      envVar="VITE_FIREBASE_MESSAG..."
                      value={apiValues.firebaseMessagingSenderId}
                      onChange={v => setApiValues(p => ({ ...p, firebaseMessagingSenderId: v }))}
                      placeholder="123456..."
                    />
                    <EditableApiRow
                      label="App ID"
                      envVar="VITE_FIREBASE_APP_ID"
                      value={apiValues.firebaseAppId}
                      onChange={v => setApiValues(p => ({ ...p, firebaseAppId: v }))}
                      placeholder="1:123456:web:abcd..."
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button onClick={handleSaveApi} className="py-2.5 px-6 rounded-xl bg-accent-blue border-none text-white text-sm font-semibold cursor-pointer flex items-center gap-2 hover:opacity-90">
                  <Save size={14} /> Guardar Cambios
                </button>
                {apiSaved && (
                  <span className="text-xs text-accent-green flex items-center gap-1">
                    <CheckCircle size={14} /> Guardado correctamente
                  </span>
                )}
              </div>
            </div>

            <div className="bg-bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-sm font-semibold mb-4 text-text-secondary">Sincronización Manual</h3>
              <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-xl border border-border">
                <div>
                  <p className="text-sm font-medium text-text-primary">Respaldo y Restauración</p>
                  <p className="text-[11px] text-text-muted mt-1">
                    {lastSync ? `Última sincronización: ${new Date(lastSync).toLocaleString()}` : 'No se ha sincronizado aún'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={syncPush}
                    disabled={isSyncing || !apiValues.firebaseApiKey}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-blue/10 text-accent-blue text-xs font-bold hover:bg-accent-blue/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer border-none"
                  >
                    <UploadCloud size={16} />
                    {isSyncing ? 'Sincronizando...' : 'Subir Respaldo'}
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('ADVERTENCIA: Esto reemplazará TODOS los datos actuales con la versión de la nube. ¿Deseas continuar?')) {
                        await syncPull();
                      }
                    }}
                    disabled={isSyncing || !apiValues.firebaseApiKey}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-purple/10 text-accent-purple text-xs font-bold hover:bg-accent-purple/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer border-none"
                  >
                    <DownloadCloud size={16} />
                    {isSyncing ? 'Sincronizando...' : 'Restaurar'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-sm font-semibold mb-4 text-text-secondary">Estado de Servicios</h3>
              <div className="flex flex-col gap-3">
                <ServiceRow name="Google Sheets API v4" status={!!CONFIG.GOOGLE_SHEET_ID} />
                <ServiceRow name="Google Identity Services (OAuth 2.0)" status={!!CONFIG.GOOGLE_CLIENT_ID} />
                <ServiceRow name="Google Drive API" status={!!CONFIG.GOOGLE_API_KEY} />
                <ServiceRow name="SheetJS (Lectura Excel local)" status={true} />
              </div>
            </div>

            <div className="bg-bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-accent-yellow mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold mb-1">Configuración de APIs</h3>
                  <p className="text-[12px] text-text-secondary leading-relaxed">
                    Las credenciales de Google se configuran mediante variables de entorno en el archivo <code className="text-accent-blue">.env</code> o
                    directamente desde esta página (se guardan en localStorage).
                    Para obtener las credenciales, accede a{' '}
                    <span className="text-accent-blue">Google Cloud Console &gt; APIs & Services &gt; Credentials</span>.
                    Nunca compartas las API keys en repositorios públicos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Tab: Sistema */}
      {
        activeTab === 'sistema' && (
          <div className="flex flex-col gap-6">
            {/* Editable system parameters */}
            <div className="bg-bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-sm font-semibold mb-4 text-text-secondary">Parámetros de la Empresa</h3>
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-xl bg-bg-secondary border border-border">
                  <label className="text-xs font-semibold mb-1 block">Nombre de la Empresa</label>
                  <input
                    type="text"
                    value={sysValues.empresaNombre}
                    onChange={e => setSysValues(p => ({ ...p, empresaNombre: e.target.value }))}
                    placeholder="ISP Carabayllo"
                    className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted"
                  />
                </div>
                <div className="p-4 rounded-xl bg-bg-secondary border border-border">
                  <label className="text-xs font-semibold mb-1 block">Teléfono</label>
                  <input
                    type="text"
                    value={sysValues.empresaTelefono}
                    onChange={e => setSysValues(p => ({ ...p, empresaTelefono: e.target.value }))}
                    placeholder="999-000-111"
                    className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted"
                  />
                </div>
                <div className="p-4 rounded-xl bg-bg-secondary border border-border">
                  <label className="text-xs font-semibold mb-1 block">Email de Soporte</label>
                  <input
                    type="email"
                    value={sysValues.empresaEmail}
                    onChange={e => setSysValues(p => ({ ...p, empresaEmail: e.target.value }))}
                    placeholder="soporte@isp.com"
                    className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted"
                  />
                </div>
                <div className="p-4 rounded-xl bg-bg-secondary border border-border">
                  <label className="text-xs font-semibold mb-1 block">Dirección</label>
                  <input
                    type="text"
                    value={sysValues.empresaDireccion}
                    onChange={e => setSysValues(p => ({ ...p, empresaDireccion: e.target.value }))}
                    placeholder="Carabayllo, Lima"
                    className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-bg-secondary border border-border">
                    <label className="text-xs font-semibold mb-1 block">Moneda</label>
                    <input
                      type="text"
                      value={sysValues.moneda}
                      onChange={e => setSysValues(p => ({ ...p, moneda: e.target.value }))}
                      placeholder="PEN"
                      className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted"
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-bg-secondary border border-border">
                    <label className="text-xs font-semibold mb-1 block">Zona Horaria</label>
                    <input
                      type="text"
                      value={sysValues.zonaHoraria}
                      onChange={e => setSysValues(p => ({ ...p, zonaHoraria: e.target.value }))}
                      placeholder="America/Lima"
                      className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button onClick={handleSaveSys} className="py-2.5 px-6 rounded-xl bg-accent-blue border-none text-white text-sm font-semibold cursor-pointer flex items-center gap-2 hover:opacity-90">
                  <Save size={14} /> Guardar Parámetros
                </button>
                {sysSaved && (
                  <span className="text-xs text-accent-green flex items-center gap-1">
                    <CheckCircle size={14} /> Guardado correctamente
                  </span>
                )}
              </div>
            </div>

            <div className="bg-bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-sm font-semibold mb-4 text-text-secondary">Almacenamiento Local</h3>
              <div className="flex flex-col gap-3">
                <InfoRow label="Método" value="Zustand (memoria) + LocalStorage (persistencia de sesión)" />
                <InfoRow label="Datos en memoria" value={`${clients.length} clientes, ${tickets.length} tickets, ${equipos.length} equipos`} />
                <InfoRow label="Motor ETL" value="9 reglas de limpieza (dataTransformer.js)" />
                <InfoRow label="Formatos soportados" value=".xlsx, .xls (lectura vía SheetJS)" />
              </div>
            </div>

            <div className="bg-bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-sm font-semibold mb-4 text-text-secondary">Stack Tecnológico</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: 'React 18', desc: 'UI Framework' },
                  { name: 'Vite 5', desc: 'Build tool' },
                  { name: 'Tailwind CSS v4', desc: 'Estilos' },
                  { name: 'Zustand', desc: 'Estado global' },
                  { name: 'SheetJS', desc: 'Lectura Excel' },
                  { name: 'Lucide React', desc: 'Iconografía' },
                  { name: 'Google OAuth 2.0', desc: 'Autenticación' },
                  { name: 'Google Sheets API', desc: 'CRUD datos' },
                  { name: 'GitHub Pages', desc: 'Deploy' },
                ].map(tech => (
                  <div key={tech.name} className="p-3 rounded-xl bg-bg-secondary border border-border text-center">
                    <p className="text-xs font-bold">{tech.name}</p>
                    <p className="text-[10px] text-text-muted">{tech.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-sm font-semibold mb-4 text-text-secondary">Módulos del Sistema</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Dashboard', desc: 'KPIs y métricas generales', active: true },
                  { name: 'Clientes', desc: 'Gestión de clientes con búsqueda y filtros', active: true },
                  { name: 'Tickets & Soporte', desc: 'Sistema de tickets con estados', active: true },
                  { name: 'Averías', desc: 'Registro y seguimiento de incidencias', active: true },
                  { name: 'Soporte Remoto', desc: 'Sesiones de diagnóstico remoto', active: true },
                  { name: 'Reportes & Cobranza', desc: 'Análisis financiero y exportación', active: true },
                  { name: 'Inventario de Equipos', desc: 'ONTs, CPEs, routers', active: true },
                  { name: 'Importar Datos', desc: 'Importación Excel con ETL', active: true },
                  { name: 'Configuración', desc: 'Parámetros del sistema', active: true },
                ].map(mod => (
                  <div key={mod.name} className="flex items-center gap-3 p-3 rounded-lg bg-bg-secondary border border-border">
                    <CheckCircle size={14} className={mod.active ? 'text-emerald-400' : 'text-text-muted'} />
                    <div>
                      <p className="text-xs font-semibold">{mod.name}</p>
                      <p className="text-[10px] text-text-muted">{mod.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

function InfoRow({ label, value, badge }) {
  return (
    <div className="flex justify-between items-center py-1.5 text-xs">
      <span className="text-text-muted">{label}</span>
      {badge ? (
        <span className={`px - 2 py - 0.5 rounded - full text - [11px] font - medium ${badge} `}>{value}</span>
      ) : (
        <span className="font-medium text-text-primary">{value}</span>
      )}
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex justify-between items-center py-1.5 text-xs">
      <span className="text-text-muted">{label}</span>
      <span className={`font - mono font - bold ${color} `}>{value}</span>
    </div>
  );
}

function ServiceRow({ name, status }) {
  return (
    <div className="flex items-center justify-between py-2 text-xs">
      <span className="font-medium">{name}</span>
      {status ? (
        <span className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle size={12} /> Listo
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-accent-yellow">
          <AlertTriangle size={12} /> Pendiente
        </span>
      )}
    </div>
  );
}

function ThemeOption({ id, label, color, accent, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-3 group
        ${active
          ? 'border-accent-blue bg-accent-blue/5 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]'
          : 'border-border bg-bg-secondary hover:border-accent-blue/50 hover:bg-bg-card'
        }
      `}
    >
      <div className="w-full h-16 rounded-lg mb-1 relative overflow-hidden border border-border/50 shadow-inner" style={{ background: color }}>
        {/* Mock UI inside preview */}
        <div className="absolute top-2 left-2 w-8 h-2 rounded bg-white/20"></div>
        <div className="absolute top-6 left-2 w-12 h-2 rounded bg-white/10"></div>
        <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: accent }}>
          <Icon size={12} />
        </div>
      </div>

      <div className="text-center">
        <span className={`text-xs font-semibold block ${active ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
          {label}
        </span>
      </div>

      {active && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-accent-blue rounded-full flex items-center justify-center text-white shadow-sm">
          <CheckCircle size={12} fill="currentColor" className="text-white" />
        </div>
      )}
    </button>
  );
}
