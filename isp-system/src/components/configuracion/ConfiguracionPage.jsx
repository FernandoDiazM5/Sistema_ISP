import { useState, useEffect } from 'react';
import { Settings, Shield, Database, Globe, Key, Users, Save, RefreshCw, CheckCircle, AlertTriangle, Wifi, UploadCloud, DownloadCloud, Moon, Sun, Monitor, Sparkles, Smartphone, Flower, Leaf, Wind, Clock, Trash2, FileJson, FileSpreadsheet, FileText, History, Loader2, Image, RotateCcw, Pencil } from 'lucide-react';
import { useAuth } from '../../auth/GoogleAuthProvider';
import { ROLES as UI_ROLES, DEMO_USERS } from '../../auth/roles';
import { ROLES, DEFAULT_PERMISSIONS, PERMISSION_LEVELS, MODULES, MODULE_LABELS, ROLE_LABELS } from '../../types/user';
import { CONFIG } from '../../utils/constants';
import useStore from '../../store/useStore';
import useSyncStore from '../../store/syncStore';
import useToast from '../../hooks/useToast';
import { downloadAsJSON, downloadAsCSV, downloadAsExcel } from '../../utils/exportBackup';
import AuthorizedUsersManager from './AuthorizedUsersManager';

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

// ===================== BACKUP HISTORY SECTION =====================
function BackupHistorySection() {
  const { backupVersions, loadingVersions, loadVersions, restoreVersion, removeVersion, restoringVersion, downloadVersionData } = useSyncStore();
  const toast = useToast();
  const [downloadingId, setDownloadingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const handleRestore = async (versionId) => {
    if (!window.confirm('¿Estás seguro de restaurar esta versión? Esto reemplazará TODOS los datos actuales.')) return;
    const ok = await restoreVersion(versionId);
    if (ok) toast.success('Versión restaurada correctamente');
    else toast.error('Error al restaurar la versión');
  };

  const handleDelete = async (versionId) => {
    const ok = await removeVersion(versionId);
    if (ok) {
      toast.success('Versión eliminada');
      setShowDeleteConfirm(null);
    }
    else toast.error('Error al eliminar');
  };

  const handleDownload = async (version, format) => {
    setDownloadingId(version.id);
    try {
      const data = await downloadVersionData(version.id);
      if (!data) {
        toast.error('Error al descargar datos');
        return;
      }
      const filename = `backup_${version.createdAt?.split('T')[0] || 'unknown'}_${version.createdAt?.split('T')[1]?.split('.')[0]?.replace(/:/g, '-') || ''}`;

      switch (format) {
        case 'json':
          downloadAsJSON(data, filename);
          toast.success('Descarga JSON completada');
          break;
        case 'csv':
          downloadAsCSV(data, filename);
          toast.success('Descarga CSV completada');
          break;
        case 'excel':
          await downloadAsExcel(data, filename);
          toast.success('Descarga Excel completada');
          break;
      }
    } catch (e) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="bg-bg-card rounded-2xl p-6 border border-border">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center">
            <History size={18} className="text-accent-purple" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Historial de Backups</h3>
            <p className="text-[11px] text-text-muted">Versiones guardadas en Firebase</p>
          </div>
        </div>
        <button
          onClick={loadVersions}
          disabled={loadingVersions}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border text-xs font-medium hover:bg-bg-card-hover cursor-pointer transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loadingVersions ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {loadingVersions && backupVersions.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-text-muted" />
          <span className="ml-3 text-sm text-text-muted">Cargando versiones...</span>
        </div>
      ) : backupVersions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center mb-3">
            <Database size={24} className="text-text-muted" />
          </div>
          <p className="text-sm font-medium text-text-secondary">No hay backups guardados</p>
          <p className="text-xs text-text-muted mt-1">Sube tu primer respaldo para empezar</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
          {backupVersions.map((version, idx) => {
            const date = new Date(version.createdAt);
            const isLatest = idx === 0;
            const isDeleting = showDeleteConfirm === version.id;
            const isRestoring = restoringVersion === version.id;
            const isDownloading = downloadingId === version.id;

            return (
              <div key={version.id} className={`relative p-4 rounded-xl border transition-all ${isLatest ? 'bg-accent-blue/5 border-accent-blue/30' : 'bg-bg-secondary border-border hover:border-accent-blue/20'}`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-text-muted" />
                    <div>
                      <p className="text-sm font-semibold">
                        {date.toLocaleDateString('es-PE', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        <span className="ml-2 text-text-muted font-mono text-xs">{date.toLocaleTimeString('es-PE')}</span>
                      </p>
                    </div>
                    {isLatest && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-blue/10 text-accent-blue">
                        ÚLTIMO
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-3 mb-3">
                  <Stat label="Clientes" value={version.totalClients} />
                  <Stat label="Tickets" value={version.totalTickets} />
                  <Stat label="Averías" value={version.totalAverias} />
                  <Stat label="Equipos" value={version.totalEquipos} />
                  <Stat label="Visitas" value={version.totalVisitas} />
                  <Stat label="Técnicos" value={version.totalTecnicos} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Restore */}
                  <button
                    onClick={() => handleRestore(version.id)}
                    disabled={isRestoring}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-purple/10 text-accent-purple text-[11px] font-bold hover:bg-accent-purple/20 disabled:opacity-50 transition-colors cursor-pointer border-none"
                  >
                    {isRestoring ? <Loader2 size={12} className="animate-spin" /> : <DownloadCloud size={12} />}
                    Restaurar
                  </button>

                  {/* Download buttons */}
                  <div className="flex items-center gap-1 ml-1">
                    <span className="text-[10px] text-text-muted mr-1">Descargar:</span>
                    <button
                      onClick={() => handleDownload(version, 'json')}
                      disabled={isDownloading}
                      title="Descargar JSON"
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[11px] font-bold hover:bg-emerald-500/20 disabled:opacity-50 transition-colors cursor-pointer border-none"
                    >
                      <FileJson size={12} /> JSON
                    </button>
                    <button
                      onClick={() => handleDownload(version, 'csv')}
                      disabled={isDownloading}
                      title="Descargar CSV"
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-[11px] font-bold hover:bg-blue-500/20 disabled:opacity-50 transition-colors cursor-pointer border-none"
                    >
                      <FileText size={12} /> CSV
                    </button>
                    <button
                      onClick={() => handleDownload(version, 'excel')}
                      disabled={isDownloading}
                      title="Descargar Excel"
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-orange-500/10 text-orange-500 text-[11px] font-bold hover:bg-orange-500/20 disabled:opacity-50 transition-colors cursor-pointer border-none"
                    >
                      <FileSpreadsheet size={12} /> Excel
                    </button>
                  </div>

                  {/* Delete */}
                  {isDeleting ? (
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-[11px] text-red-400">¿Eliminar?</span>
                      <button
                        onClick={() => handleDelete(version.id)}
                        className="px-2 py-1 rounded-lg bg-red-500/20 text-red-500 text-[11px] font-bold hover:bg-red-500/30 cursor-pointer border-none"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-2 py-1 rounded-lg bg-bg-card text-text-muted text-[11px] font-medium hover:bg-bg-card-hover cursor-pointer border-none"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(version.id)}
                      className="ml-auto p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 cursor-pointer border-none bg-transparent transition-colors"
                      title="Eliminar versión"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {isDownloading && (
                  <div className="absolute inset-0 bg-bg-card/80 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Loader2 size={20} className="animate-spin text-accent-blue mr-2" />
                    <span className="text-sm text-text-secondary">Descargando...</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-card border border-border">
      <span className="text-[10px] text-text-muted">{label}:</span>
      <span className="text-[11px] font-bold text-text-primary">{value ?? 0}</span>
    </div>
  );
}

// ===================== MAIN PAGE =====================
export default function ConfiguracionPage() {
  const { user } = useAuth();

  // Verificación de seguridad adicional
  if (!user || user.rol !== ROLES.SUPER_ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Shield size={48} className="text-accent-red mb-4" />
        <h1 className="text-2xl font-bold text-accent-red mb-2">Acceso Restringido</h1>
        <p className="text-text-secondary">Esta sección es exclusiva para Super Administradores.</p>
      </div>
    );
  }

  const clients = useStore(s => s.clients);
  const dataSource = useStore(s => s.dataSource);
  const tickets = useStore(s => s.tickets);
  const averias = useStore(s => s.averias);
  const equipos = useStore(s => s.equipos);
  const theme = useStore(s => s.theme);
  const branding = useStore(s => s.branding);
  const setBranding = useStore(s => s.setBranding);
  const customRolePermissions = useStore(s => s.customRolePermissions);
  const setCustomRolePermissions = useStore(s => s.setCustomRolePermissions);

  const { syncPush, syncPull, isSyncing, lastSync, syncProgress } = useSyncStore();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('general');

  // Branding local state
  const [brandingForm, setBrandingForm] = useState({
    appName: branding?.appName || 'ISP System',
    appVersion: branding?.appVersion || 'v2.0 Mobile',
    appIcon: branding?.appIcon || null,
    zoneName: branding?.zoneName || 'CARABAYLLO',
    syncLabel: branding?.syncLabel || '',
  });
  const [brandingSaved, setBrandingSaved] = useState(false);

  // Roles editor local state
  const EDITABLE_ROLES = [ROLES.ADMIN, ROLES.TECNICO, ROLES.VIEWER];
  const EDITABLE_MODULES = Object.values(MODULES).filter(m => m !== MODULES.USUARIOS);
  const PERM_OPTIONS = [
    { value: PERMISSION_LEVELS.NONE, label: 'Ninguno' },
    { value: PERMISSION_LEVELS.READ, label: 'Lectura' },
    { value: PERMISSION_LEVELS.WRITE, label: 'Escritura' },
    { value: PERMISSION_LEVELS.ADMIN, label: 'Admin' },
  ];

  const [editingRole, setEditingRole] = useState(null);
  const [rolePerms, setRolePerms] = useState(() => {
    const base = {};
    EDITABLE_ROLES.forEach(role => {
      base[role] = { ...(customRolePermissions?.[role] || DEFAULT_PERMISSIONS[role]) };
    });
    return base;
  });
  const [rolesSaved, setRolesSaved] = useState(false);

  const handleSaveBranding = () => {
    setBranding(brandingForm);
    setBrandingSaved(true);
    toast.success('Marca actualizada correctamente');
    setTimeout(() => setBrandingSaved(false), 3000);
  };

  const handleIconUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512000) {
      toast.error('El archivo es muy grande. Maximo 500KB.');
      return;
    }
    if (!file.type.match(/^image\/(png|jpeg|jpg|svg\+xml|webp)$/)) {
      toast.error('Formato no soportado. Usa PNG, JPG, SVG o WebP.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBrandingForm(p => ({ ...p, appIcon: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveRoles = () => {
    setCustomRolePermissions(rolePerms);
    setRolesSaved(true);
    toast.success('Permisos de roles actualizados');
    setTimeout(() => setRolesSaved(false), 3000);
  };

  const handleRestoreRoleDefaults = (role) => {
    setRolePerms(p => ({ ...p, [role]: { ...DEFAULT_PERMISSIONS[role] } }));
    toast.success(`Permisos de ${ROLE_LABELS[role]?.label || role} restaurados a defaults`);
  };

  const handleRestoreAllDefaults = () => {
    const base = {};
    EDITABLE_ROLES.forEach(role => {
      base[role] = { ...DEFAULT_PERMISSIONS[role] };
    });
    setRolePerms(base);
    setCustomRolePermissions(null);
    toast.success('Todos los permisos restaurados a defaults');
  };

  const [apiValues, setApiValues] = useState(() => ({
    googleApiKey: localStorage.getItem('isp_google_api_key') || CONFIG.GOOGLE_API_KEY || '',
    googleClientId: localStorage.getItem('isp_google_client_id') || CONFIG.GOOGLE_CLIENT_ID || '',
    googleSheetId: localStorage.getItem('isp_google_sheet_id') || CONFIG.GOOGLE_SHEET_ID || '',
    geminiApiKey: localStorage.getItem('isp_gemini_api_key') || CONFIG.GEMINI_API_KEY || '',
    firebaseApiKey: localStorage.getItem('isp_firebase_api_key') || CONFIG.FIREBASE.apiKey || '',
    firebaseAuthDomain: localStorage.getItem('isp_firebase_auth_domain') || CONFIG.FIREBASE.authDomain || '',
    firebaseProjectId: localStorage.getItem('isp_firebase_project_id') || CONFIG.FIREBASE.projectId || '',
    firebaseStorageBucket: localStorage.getItem('isp_firebase_storage_bucket') || CONFIG.FIREBASE.storageBucket || '',
    firebaseMessagingSenderId: localStorage.getItem('isp_firebase_messaging_sender_id') || CONFIG.FIREBASE.messagingSenderId || '',
    firebaseAppId: localStorage.getItem('isp_firebase_app_id') || CONFIG.FIREBASE.appId || '',
  }));
  const [apiSaved, setApiSaved] = useState(false);

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
    localStorage.setItem('isp_firebase_api_key', apiValues.firebaseApiKey);
    localStorage.setItem('isp_firebase_auth_domain', apiValues.firebaseAuthDomain);
    localStorage.setItem('isp_firebase_project_id', apiValues.firebaseProjectId);
    localStorage.setItem('isp_firebase_storage_bucket', apiValues.firebaseStorageBucket);
    localStorage.setItem('isp_firebase_messaging_sender_id', apiValues.firebaseMessagingSenderId);
    localStorage.setItem('isp_firebase_app_id', apiValues.firebaseAppId);
    setApiSaved(true);
    toast.success('Credenciales API guardadas');
    setTimeout(() => setApiSaved(false), 3000);
  };

  const handleSaveSys = () => {
    Object.entries(sysValues).forEach(([key, val]) => {
      localStorage.setItem('isp_' + key.replace(/([A-Z])/g, '_$1').toLowerCase(), val);
    });
    setSysSaved(true);
    toast.success('Parámetros guardados');
    setTimeout(() => setSysSaved(false), 3000);
  };

  const handleSyncPush = async () => {
    const result = await syncPush();
    if (result) toast.success('Respaldo subido correctamente a Firebase');
    else toast.error('Error al subir respaldo');
  };

  const handleSyncPull = async () => {
    if (!window.confirm('ADVERTENCIA: Esto reemplazará TODOS los datos actuales con la versión más reciente de la nube. ¿Deseas continuar?')) return;
    const ok = await syncPull();
    if (ok) toast.success('Datos restaurados desde Firebase');
    else toast.error('Error al restaurar datos');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'usuarios', label: 'Usuarios & Roles', icon: Users },
    { id: 'api', label: 'Conexión API', icon: Globe },
    { id: 'backups', label: 'Backups', icon: Database },
    { id: 'sistema', label: 'Sistema', icon: Database },
  ];

  return (
    <div className="animate-fade p-4 sm:p-6 sm:px-8 h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-[26px] font-bold tracking-tight">Configuración</h1>
          <p className="text-text-secondary text-sm mt-1">Parámetros del sistema, roles y conexiones</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-secondary rounded-xl p-1 mb-6 w-full sm:w-fit overflow-x-auto">
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
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-5">
              {brandingForm.appIcon ? (
                <img src={brandingForm.appIcon} className="w-10 h-10 rounded-xl object-cover" alt="Logo" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                  <Wifi size={18} className="text-accent-blue" />
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold">{brandingForm.appName || 'ISP System'}</h3>
                <p className="text-[11px] text-text-muted">Sistema de Gestión para Proveedores de Internet</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <InfoRow label="Versión" value="1.1.0" />
              <InfoRow label="Framework" value="React 18 + Vite 5" />
              <InfoRow label="Estado" value="Producción" badge="bg-emerald-500/10 text-emerald-400" />
              <InfoRow label="Última actualización" value={new Date().toLocaleDateString('es-PE')} />
            </div>
          </div>

          {/* Branding / Personalizar Marca */}
          <div className="bg-bg-card rounded-2xl p-6 border border-border col-span-1 md:col-span-2">
            <h3 className="text-sm font-semibold mb-4 text-text-secondary flex items-center gap-2">
              <Pencil size={16} className="text-accent-purple" /> Personalizar Marca
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo Upload */}
              <div className="p-4 rounded-xl bg-bg-secondary border border-border sm:col-span-2">
                <label className="text-xs font-semibold mb-2 block">Logo del Sistema</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden shrink-0">
                    {brandingForm.appIcon ? (
                      <img src={brandingForm.appIcon} className="w-full h-full object-cover" alt="Logo" />
                    ) : (
                      <Wifi size={24} className="text-text-muted" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-blue/10 text-accent-blue text-xs font-bold hover:bg-accent-blue/20 cursor-pointer transition-colors border-none w-fit">
                      <Image size={14} /> Subir Logo
                      <input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp" onChange={handleIconUpload} className="hidden" />
                    </label>
                    {brandingForm.appIcon && (
                      <button onClick={() => setBrandingForm(p => ({ ...p, appIcon: null }))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 cursor-pointer border-none w-fit transition-colors">
                        <RotateCcw size={12} /> Restaurar default
                      </button>
                    )}
                    <p className="text-[10px] text-text-muted">PNG, JPG, SVG o WebP. Max 500KB.</p>
                  </div>
                </div>
              </div>
              {/* App Name */}
              <div className="p-4 rounded-xl bg-bg-secondary border border-border">
                <label className="text-xs font-semibold mb-1 block">Nombre del Software</label>
                <input type="text" value={brandingForm.appName} onChange={e => setBrandingForm(p => ({ ...p, appName: e.target.value }))}
                  placeholder="ISP System" className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted" />
              </div>
              {/* App Version */}
              <div className="p-4 rounded-xl bg-bg-secondary border border-border">
                <label className="text-xs font-semibold mb-1 block">Subtitulo / Version</label>
                <input type="text" value={brandingForm.appVersion} onChange={e => setBrandingForm(p => ({ ...p, appVersion: e.target.value }))}
                  placeholder="v2.0 Mobile" className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted" />
              </div>
              {/* Zone Name */}
              <div className="p-4 rounded-xl bg-bg-secondary border border-border">
                <label className="text-xs font-semibold mb-1 block">Nombre de Zona (Header)</label>
                <input type="text" value={brandingForm.zoneName} onChange={e => setBrandingForm(p => ({ ...p, zoneName: e.target.value }))}
                  placeholder="CARABAYLLO" className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted" />
              </div>
              {/* Sync Label */}
              <div className="p-4 rounded-xl bg-bg-secondary border border-border">
                <label className="text-xs font-semibold mb-1 block">Etiqueta de Estado (Header)</label>
                <input type="text" value={brandingForm.syncLabel} onChange={e => setBrandingForm(p => ({ ...p, syncLabel: e.target.value }))}
                  placeholder="Dejar vacio para auto (Demo/Sincronizado)" className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted" />
                <p className="text-[10px] text-text-muted mt-1">Si esta vacio, se muestra automaticamente segun la fuente de datos.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button onClick={handleSaveBranding} className="py-2.5 px-6 rounded-xl bg-accent-purple border-none text-white text-sm font-semibold cursor-pointer flex items-center gap-2 hover:opacity-90">
                <Save size={14} /> Guardar Marca
              </button>
              {brandingSaved && (
                <span className="text-xs text-accent-green flex items-center gap-1">
                  <CheckCircle size={14} /> Guardado correctamente
                </span>
              )}
            </div>
          </div>

          {/* Theme Selector */}
          <div className="bg-bg-card rounded-2xl p-6 border border-border col-span-2">
            <h3 className="text-sm font-semibold mb-4 text-text-secondary flex items-center gap-2">
              <Sparkles size={16} className="text-accent-yellow" /> Personalización
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <ThemeOption id="default" label="Azul Noche" color="#0a0e1a" accent="#3b82f6" icon={Moon} active={theme === 'default'} onClick={() => useStore.getState().setTheme('default')} />
              <ThemeOption id="light" label="Modo Claro" color="#ffffff" accent="#2563eb" icon={Sun} active={theme === 'light'} onClick={() => useStore.getState().setTheme('light')} />
              <ThemeOption id="black" label="Negro OLED" color="#000000" accent="#e5e5e5" icon={Smartphone} active={theme === 'black'} onClick={() => useStore.getState().setTheme('black')} />
              <ThemeOption id="purple" label="Lila Suave" color="#faf5ff" accent="#a855f7" icon={Sparkles} active={theme === 'purple'} onClick={() => useStore.getState().setTheme('purple')} />
              <ThemeOption id="rose" label="Rosa Nórdico" color="#fff1f2" accent="#e11d48" icon={Flower} active={theme === 'rose'} onClick={() => useStore.getState().setTheme('rose')} />
              <ThemeOption id="ocean" label="Brisa Marina" color="#ecfeff" accent="#0891b2" icon={Wind} active={theme === 'ocean'} onClick={() => useStore.getState().setTheme('ocean')} />
              <ThemeOption id="sage" label="Jardín Salvia" color="#f0fdf4" accent="#16a34a" icon={Leaf} active={theme === 'sage'} onClick={() => useStore.getState().setTheme('sage')} />
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
                style={{ background: (UI_ROLES[user?.rol] || UI_ROLES.TECNICO).color + '20', color: (UI_ROLES[user?.rol] || UI_ROLES.TECNICO).color }}>
                {user?.nombre?.[0] || '?'}
              </div>
              <div className="flex-1">
                <p className="text-base font-bold">{user?.nombre}</p>
                <p className="text-sm text-text-secondary">{user?.email}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: (UI_ROLES[user?.rol] || UI_ROLES.TECNICO).color }}>
                  {(UI_ROLES[user?.rol] || UI_ROLES.TECNICO).label}
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-[11px] text-emerald-400 font-semibold">Sesión activa</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Usuarios & Roles */}
      {activeTab === 'usuarios' && (
        <div className="flex flex-col gap-6">
          {/* Roles Overview Cards */}
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-secondary">Roles del Sistema</h3>
              <div className="flex items-center gap-2">
                {customRolePermissions && (
                  <button onClick={handleRestoreAllDefaults}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 cursor-pointer border-none transition-colors">
                    <RotateCcw size={12} /> Restaurar Todos
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {/* SUPER_ADMIN card (read-only) */}
              <div className="p-4 rounded-xl bg-bg-secondary border border-border opacity-70">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: (UI_ROLES.SUPER_ADMIN?.color || '#a855f7') + '20', color: UI_ROLES.SUPER_ADMIN?.color || '#a855f7' }}>
                    <Shield size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Super Admin</p>
                    <p className="text-[10px] text-text-muted">Acceso total (no editable)</p>
                  </div>
                </div>
              </div>
              {/* Editable role cards */}
              {EDITABLE_ROLES.map(role => {
                const rl = ROLE_LABELS[role] || {};
                const uiRole = UI_ROLES[role] || {};
                const isEditing = editingRole === role;
                return (
                  <button key={role} onClick={() => setEditingRole(isEditing ? null : role)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${isEditing
                      ? 'bg-accent-blue/5 border-accent-blue/40 shadow-[0_0_12px_-3px_rgba(59,130,246,0.3)]'
                      : 'bg-bg-secondary border-border hover:border-accent-blue/30'
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: (uiRole.color || '#6b7280') + '20', color: uiRole.color || '#6b7280' }}>
                        <Shield size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{rl.label || role}</p>
                        <p className="text-[10px] text-text-muted">{isEditing ? 'Editando...' : 'Click para editar'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-text-muted">
                        {Object.values(rolePerms[role] || {}).filter(v => v !== PERMISSION_LEVELS.NONE).length} modulos activos
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Role Permission Editor */}
            {editingRole && (
              <div className="mt-2 p-4 rounded-xl bg-bg-secondary border border-border animate-fade">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                    <Shield size={14} style={{ color: UI_ROLES[editingRole]?.color || '#6b7280' }} />
                    Permisos de {ROLE_LABELS[editingRole]?.label || editingRole}
                  </h4>
                  <button onClick={() => handleRestoreRoleDefaults(editingRole)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-card text-text-muted text-[10px] font-medium hover:text-accent-blue cursor-pointer border border-border transition-colors">
                    <RotateCcw size={10} /> Defaults
                  </button>
                </div>
                <p className="text-[10px] text-text-muted mb-3">Para ocultar un modulo del sidebar, establece su permiso en "Ninguno".</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EDITABLE_MODULES.map(mod => (
                    <div key={mod} className="flex items-center justify-between py-2 px-3 rounded-lg bg-bg-card border border-border">
                      <span className="text-[11px] font-medium">{MODULE_LABELS[mod] || mod}</span>
                      <select
                        value={rolePerms[editingRole]?.[mod] || PERMISSION_LEVELS.NONE}
                        onChange={e => setRolePerms(p => ({
                          ...p,
                          [editingRole]: { ...p[editingRole], [mod]: e.target.value }
                        }))}
                        className="py-1 px-2 rounded-md bg-bg-secondary border border-border text-[11px] text-text-primary outline-none cursor-pointer focus:border-accent-blue"
                      >
                        {PERM_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mt-4">
              <button onClick={handleSaveRoles} className="py-2.5 px-6 rounded-xl bg-accent-blue border-none text-white text-sm font-semibold cursor-pointer flex items-center gap-2 hover:opacity-90">
                <Save size={14} /> Guardar Permisos
              </button>
              {rolesSaved && (
                <span className="text-xs text-accent-green flex items-center gap-1">
                  <CheckCircle size={14} /> Guardado correctamente
                </span>
              )}
            </div>
          </div>

          {/* User Management Info */}
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-secondary">Gestión de Usuarios</h3>
              <div className="flex items-center gap-2 text-accent-blue text-xs">
                <Users size={14} />
                <span>Sistema basado en Firebase</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-accent-blue/5 border border-accent-blue/20">
              <p className="text-sm text-text-primary mb-2 font-medium">
                Para gestionar usuarios del sistema:
              </p>
              <ol className="text-xs text-text-secondary space-y-1.5 ml-4">
                <li>1. Ve al modulo <strong className="text-accent-blue">Sistema &rarr; Usuarios</strong> en el menu lateral</li>
                <li>2. Solo usuarios con rol <strong className="text-accent-purple">SUPER_ADMIN</strong> pueden acceder</li>
                <li>3. Alli podras crear, editar, activar/desactivar usuarios</li>
                <li>4. Tambien podras personalizar permisos por modulo para cada usuario</li>
              </ol>
            </div>
          </div>

          {/* Authorized Users Manager */}
          <AuthorizedUsersManager />
        </div>
      )}

      {/* Tab: Conexión API */}
      {activeTab === 'api' && (
        <div className="flex flex-col gap-6">
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-sm font-semibold mb-4 text-text-secondary">Google Cloud Platform</h3>
            <div className="flex flex-col gap-4">
              <EditableApiRow label="Google API Key" envVar="VITE_GOOGLE_API_KEY" value={apiValues.googleApiKey} onChange={v => setApiValues(p => ({ ...p, googleApiKey: v }))} placeholder="AIza..." />
              <EditableApiRow label="Google Client ID (OAuth)" envVar="VITE_GOOGLE_CLIENT_ID" value={apiValues.googleClientId} onChange={v => setApiValues(p => ({ ...p, googleClientId: v }))} placeholder="123456789-abc.apps.googleusercontent.com" />
              <EditableApiRow label="Google Sheet ID" envVar="VITE_GOOGLE_SHEET_ID" value={apiValues.googleSheetId} onChange={v => setApiValues(p => ({ ...p, googleSheetId: v }))} placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" />
              <EditableApiRow label="Gemini API Key" envVar="VITE_GEMINI_API_KEY" value={apiValues.geminiApiKey} onChange={v => setApiValues(p => ({ ...p, geminiApiKey: v }))} placeholder="AIza..." />

              <div className="pt-4 border-t border-border mt-2">
                <h4 className="text-xs font-bold mb-3 text-accent-cyan flex items-center gap-2">
                  <Database size={14} /> Firebase Sync (Respaldo en la Nube)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <EditableApiRow label="API Key" envVar="VITE_FIREBASE_API_KEY" value={apiValues.firebaseApiKey} onChange={v => setApiValues(p => ({ ...p, firebaseApiKey: v }))} placeholder="AIza..." />
                  <EditableApiRow label="Project ID" envVar="VITE_FIREBASE_PROJECT_ID" value={apiValues.firebaseProjectId} onChange={v => setApiValues(p => ({ ...p, firebaseProjectId: v }))} placeholder="isp-sistema-xxx" />
                  <EditableApiRow label="Auth Domain" envVar="VITE_FIREBASE_AUTH_DOMAIN" value={apiValues.firebaseAuthDomain} onChange={v => setApiValues(p => ({ ...p, firebaseAuthDomain: v }))} placeholder="isp-sistema.firebaseapp.com" />
                  <EditableApiRow label="Storage Bucket" envVar="VITE_FIREBASE_STORAGE_BUCKET" value={apiValues.firebaseStorageBucket} onChange={v => setApiValues(p => ({ ...p, firebaseStorageBucket: v }))} placeholder="isp-sistema.appspot.com" />
                  <EditableApiRow label="Msg Sender ID" envVar="VITE_FIREBASE_MESSAG..." value={apiValues.firebaseMessagingSenderId} onChange={v => setApiValues(p => ({ ...p, firebaseMessagingSenderId: v }))} placeholder="123456..." />
                  <EditableApiRow label="App ID" envVar="VITE_FIREBASE_APP_ID" value={apiValues.firebaseAppId} onChange={v => setApiValues(p => ({ ...p, firebaseAppId: v }))} placeholder="1:123456:web:abcd..." />
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
            <h3 className="text-sm font-semibold mb-4 text-text-secondary">Estado de Servicios</h3>
            <div className="flex flex-col gap-3">
              <ServiceRow name="Google Sheets API v4" status={!!CONFIG.GOOGLE_SHEET_ID} />
              <ServiceRow name="Google Identity Services (OAuth 2.0)" status={!!CONFIG.GOOGLE_CLIENT_ID} />
              <ServiceRow name="Google Drive API" status={!!CONFIG.GOOGLE_API_KEY} />
              <ServiceRow name="Gemini AI" status={!!(apiValues.geminiApiKey || CONFIG.GEMINI_API_KEY)} />
              <ServiceRow name="Firebase Firestore" status={!!(apiValues.firebaseApiKey || CONFIG.FIREBASE.apiKey)} />
              <ServiceRow name="SheetJS (Lectura Excel local)" status={true} />
            </div>
          </div>

          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-accent-yellow mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold mb-1">Configuración de APIs</h3>
                <p className="text-[12px] text-text-secondary leading-relaxed">
                  Las credenciales se configuran mediante variables de entorno en <code className="text-accent-blue">.env</code> o
                  directamente desde esta página (se guardan en localStorage).
                  Nunca compartas las API keys en repositorios públicos.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Backups */}
      {activeTab === 'backups' && (
        <div className="flex flex-col gap-6">
          {/* ====== PROGRESS OVERLAY ====== */}
          {syncProgress && (
            <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade p-4">
              <div className="bg-bg-card border border-border rounded-2xl p-8 w-full max-w-[420px] shadow-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                    <UploadCloud size={20} className="text-accent-blue animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Subiendo Respaldo a Firebase</h3>
                    <p className="text-[11px] text-text-muted">No cierres esta ventana</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-bg-secondary rounded-full h-3 mb-3 overflow-hidden border border-border">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${syncProgress.percent}%`,
                      background: syncProgress.percent === 100
                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                        : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary font-medium">{syncProgress.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted">
                      Paso {syncProgress.step}/{syncProgress.totalSteps}
                    </span>
                    <span className="text-sm font-bold text-accent-blue">{syncProgress.percent}%</span>
                  </div>
                </div>

                {syncProgress.percent === 100 && (
                  <div className="mt-4 flex items-center gap-2 justify-center text-emerald-400">
                    <CheckCircle size={16} />
                    <span className="text-xs font-semibold">¡Completado!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sync Push/Pull */}
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
                  onClick={handleSyncPush}
                  disabled={isSyncing || !(apiValues.firebaseApiKey || CONFIG.FIREBASE.apiKey)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-blue/10 text-accent-blue text-xs font-bold hover:bg-accent-blue/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer border-none"
                >
                  <UploadCloud size={16} />
                  {isSyncing ? 'Sincronizando...' : 'Subir Respaldo'}
                </button>
                <button
                  onClick={handleSyncPull}
                  disabled={isSyncing || !(apiValues.firebaseApiKey || CONFIG.FIREBASE.apiKey)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-purple/10 text-accent-purple text-xs font-bold hover:bg-accent-purple/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer border-none"
                >
                  <DownloadCloud size={16} />
                  {isSyncing ? 'Sincronizando...' : 'Restaurar Último'}
                </button>
              </div>
            </div>
          </div>

          {/* Backup Version History */}
          <BackupHistorySection />
        </div>
      )}

      {/* Tab: Sistema */}
      {activeTab === 'sistema' && (
        <div className="flex flex-col gap-6">
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-sm font-semibold mb-4 text-text-secondary">Parámetros de la Empresa</h3>
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-bg-secondary border border-border">
                <label className="text-xs font-semibold mb-1 block">Nombre de la Empresa</label>
                <input type="text" value={sysValues.empresaNombre} onChange={e => setSysValues(p => ({ ...p, empresaNombre: e.target.value }))} placeholder="ISP Carabayllo" className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted" />
              </div>
              <div className="p-4 rounded-xl bg-bg-secondary border border-border">
                <label className="text-xs font-semibold mb-1 block">Teléfono</label>
                <input type="text" value={sysValues.empresaTelefono} onChange={e => setSysValues(p => ({ ...p, empresaTelefono: e.target.value }))} placeholder="999-000-111" className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted" />
              </div>
              <div className="p-4 rounded-xl bg-bg-secondary border border-border">
                <label className="text-xs font-semibold mb-1 block">Email de Soporte</label>
                <input type="email" value={sysValues.empresaEmail} onChange={e => setSysValues(p => ({ ...p, empresaEmail: e.target.value }))} placeholder="soporte@isp.com" className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted" />
              </div>
              <div className="p-4 rounded-xl bg-bg-secondary border border-border">
                <label className="text-xs font-semibold mb-1 block">Dirección</label>
                <input type="text" value={sysValues.empresaDireccion} onChange={e => setSysValues(p => ({ ...p, empresaDireccion: e.target.value }))} placeholder="Carabayllo, Lima" className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-bg-secondary border border-border">
                  <label className="text-xs font-semibold mb-1 block">Moneda</label>
                  <input type="text" value={sysValues.moneda} onChange={e => setSysValues(p => ({ ...p, moneda: e.target.value }))} placeholder="PEN" className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted" />
                </div>
                <div className="p-4 rounded-xl bg-bg-secondary border border-border">
                  <label className="text-xs font-semibold mb-1 block">Zona Horaria</label>
                  <input type="text" value={sysValues.zonaHoraria} onChange={e => setSysValues(p => ({ ...p, zonaHoraria: e.target.value }))} placeholder="America/Lima" className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted" />
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
              <InfoRow label="Método" value="Zustand (memoria) + IndexedDB (persistencia)" />
              <InfoRow label="Datos en memoria" value={`${clients.length} clientes, ${tickets.length} tickets, ${equipos.length} equipos`} />
              <InfoRow label="Motor ETL" value="9 reglas de limpieza (dataTransformer.js)" />
              <InfoRow label="Formatos soportados" value=".xlsx, .xls (lectura vía SheetJS)" />
            </div>
          </div>

          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-sm font-semibold mb-4 text-text-secondary">Stack Tecnológico</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: 'React 18', desc: 'UI Framework' },
                { name: 'Vite 5', desc: 'Build tool' },
                { name: 'Tailwind CSS v4', desc: 'Estilos' },
                { name: 'Zustand', desc: 'Estado global' },
                { name: 'Firebase', desc: 'Cloud Backup' },
                { name: 'SheetJS', desc: 'Lectura Excel' },
                { name: 'Lucide React', desc: 'Iconografía' },
                { name: 'Google OAuth 2.0', desc: 'Autenticación' },
                { name: 'IndexedDB', desc: 'Storage local' },
              ].map(tech => (
                <div key={tech.name} className="p-3 rounded-xl bg-bg-secondary border border-border text-center">
                  <p className="text-xs font-bold">{tech.name}</p>
                  <p className="text-xs text-text-muted">{tech.desc}</p>
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
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badge}`}>{value}</span>
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
      <span className={`font-mono font-bold ${color}`}>{value}</span>
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
