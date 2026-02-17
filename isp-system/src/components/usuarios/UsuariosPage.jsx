import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, User, Mail, Shield, Edit3, Trash2, X, Eye, EyeOff, CheckCircle2, XCircle, Calendar, Clock, Crown, Settings, Lock, KeyRound, Loader2, AlertCircle } from 'lucide-react';
import useStore from '../../store/useStore';
import { ROLES, ROLE_LABELS, MODULES, MODULE_LABELS, PERMISSION_LEVELS, DEFAULT_PERMISSIONS } from '../../types/user';
import { createUserWithPassword } from '../../api/authAPI';

const ESTADO_COLORS = {
  true: { bg: 'bg-accent-green/15', text: 'text-accent-green', icon: CheckCircle2 },
  false: { bg: 'bg-accent-red/15', text: 'text-accent-red', icon: XCircle },
};

const ROLE_COLORS = {
  [ROLES.SUPER_ADMIN]: 'purple',
  [ROLES.ADMIN]: 'blue',
  [ROLES.TECNICO]: 'green',
  [ROLES.VIEWER]: 'gray',
};

const PERMISSION_LEVEL_LABELS = {
  [PERMISSION_LEVELS.NONE]: { label: 'Sin Acceso', color: 'text-gray-500' },
  [PERMISSION_LEVELS.READ]: { label: 'Lectura', color: 'text-blue-500' },
  [PERMISSION_LEVELS.WRITE]: { label: 'Escritura', color: 'text-green-500' },
  [PERMISSION_LEVELS.ADMIN]: { label: 'Admin', color: 'text-purple-500' },
};

const EMPTY_FORM = {
  email: '',
  nombre: '',
  foto: '',
  rol: ROLES.VIEWER,
  permisos: { ...DEFAULT_PERMISSIONS[ROLES.VIEWER] },
  authType: 'google_oauth', // 'google_oauth' o 'email_password'
  password: '', // Solo para authType='email_password'
};

export default function UsuariosPage() {
  const currentUser = useStore(s => s.currentUser);
  const allUsers = useStore(s => s.allUsers);
  const loadAllUsers = useStore(s => s.loadAllUsers);
  const createUser = useStore(s => s.createUser);
  const updateUser = useStore(s => s.updateUser);
  const deleteUser = useStore(s => s.deleteUser);
  const toggleUserStatus = useStore(s => s.toggleUserStatus);
  const usersLoading = useStore(s => s.usersLoading);
  const canManageUsers = useStore(s => s.canManageUsers);
  const addToast = useStore(s => s.addToast);

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [customPermissions, setCustomPermissions] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Verificar si puede gestionar usuarios
  useEffect(() => {
    if (!canManageUsers()) {
      // Redirigir o mostrar mensaje de acceso denegado
      return;
    }
    loadAllUsers();
  }, []);

  // ==================== STATS ====================
  const stats = useMemo(() => {
    const total = allUsers.length;
    const activos = allUsers.filter(u => u.activo).length;
    const inactivos = total - activos;
    const superAdmins = allUsers.filter(u => u.rol === ROLES.SUPER_ADMIN).length;
    const admins = allUsers.filter(u => u.rol === ROLES.ADMIN).length;
    const tecnicos = allUsers.filter(u => u.rol === ROLES.TECNICO).length;
    const viewers = allUsers.filter(u => u.rol === ROLES.VIEWER).length;

    return { total, activos, inactivos, superAdmins, admins, tecnicos, viewers };
  }, [allUsers]);

  // ==================== FILTERED LIST ====================
  const filtered = useMemo(() => {
    if (!search) return allUsers;
    const q = search.toLowerCase();
    return allUsers.filter(u =>
      u.nombre.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      ROLE_LABELS[u.rol]?.label.toLowerCase().includes(q)
    );
  }, [allUsers, search]);

  // ==================== HANDLERS ====================
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingId(user.uid);
    setForm({
      email: user.email,
      nombre: user.nombre,
      foto: user.foto || '',
      rol: user.rol,
      permisos: { ...user.permisos },
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setIsSubmitting(false);
  };

  const handleRoleChange = (rol) => {
    setForm(prev => ({
      ...prev,
      rol,
      permisos: { ...DEFAULT_PERMISSIONS[rol] },
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!form.email) {
      errors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'El email no es válido';
    }

    if (!form.nombre || form.nombre.trim().length < 3) {
      errors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!form.rol) {
      errors.rol = 'Debes seleccionar un rol';
    }

    if (!editingId && form.authType === 'email_password') {
      if (!form.password) {
        errors.password = 'La contraseña es obligatoria';
      } else if (form.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast({
        type: 'error',
        message: 'Por favor corrige los errores en el formulario',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingId) {
        // Editar usuario existente
        await updateUser(editingId, {
          nombre: form.nombre,
          foto: form.foto,
          rol: form.rol,
          permisos: form.permisos,
        });
        addToast({
          type: 'success',
          message: `Usuario ${form.nombre} actualizado exitosamente`,
        });
      } else {
        // Crear nuevo usuario
        let authUid = null;

        // Si es con email/password, primero crear en Firebase Auth
        if (form.authType === 'email_password') {
          const authResult = await createUserWithPassword(form.email, form.password);

          if (!authResult.success) {
            addToast({
              type: 'error',
              message: authResult.error || 'Error al crear usuario en Firebase Auth',
            });
            setIsSubmitting(false);
            return;
          }

          authUid = authResult.uid;
        }

        // Crear usuario en Firestore
        await createUser({
          email: form.email,
          nombre: form.nombre,
          foto: form.foto,
          rol: form.rol,
          permisos: form.permisos,
          authType: form.authType,
        }, currentUser?.uid || 'system', authUid);

        addToast({
          type: 'success',
          message: `Usuario ${form.nombre} creado exitosamente`,
        });
      }
      closeModal();
    } catch (error) {
      addToast({
        type: 'error',
        message: error.message || 'Error al guardar el usuario',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (uid) => {
    setIsDeleting(true);
    try {
      const userToDelete = allUsers.find(u => u.uid === uid);
      await deleteUser(uid);
      addToast({
        type: 'success',
        message: `Usuario ${userToDelete?.nombre || ''} eliminado exitosamente`,
      });
      setShowDeleteConfirm(null);
    } catch (error) {
      addToast({
        type: 'error',
        message: error.message || 'Error al eliminar el usuario',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (uid) => {
    try {
      const user = allUsers.find(u => u.uid === uid);
      await toggleUserStatus(uid);
      addToast({
        type: 'success',
        message: `Usuario ${user?.nombre || ''} ${user?.activo ? 'desactivado' : 'activado'} exitosamente`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        message: error.message || 'Error al cambiar el estado del usuario',
      });
    }
  };

  const openPermissions = (user) => {
    setSelectedUser(user);
    setCustomPermissions({ ...user.permisos });
    setShowPermissionsModal(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setIsSavingPermissions(true);
    try {
      await updateUser(selectedUser.uid, { permisos: customPermissions });
      addToast({
        type: 'success',
        message: `Permisos de ${selectedUser.nombre} actualizados exitosamente`,
      });
      setShowPermissionsModal(false);
      setSelectedUser(null);
    } catch (error) {
      addToast({
        type: 'error',
        message: error.message || 'Error al actualizar los permisos',
      });
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // Verificar si puede gestionar usuarios
  if (!canManageUsers()) {
    return (
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-accent-red" />
        <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
        <p className="text-gray-400">No tienes permisos para gestionar usuarios.</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <User className="w-8 h-8" />
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Control de acceso y permisos del sistema
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Crear Usuario
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-400">Total</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="card p-4 border-l-4 border-accent-green">
          <div className="text-sm text-gray-400">Activos</div>
          <div className="text-2xl font-bold text-accent-green">{stats.activos}</div>
        </div>
        <div className="card p-4 border-l-4 border-accent-red">
          <div className="text-sm text-gray-400">Inactivos</div>
          <div className="text-2xl font-bold text-accent-red">{stats.inactivos}</div>
        </div>
        <div className="card p-4 border-l-4 border-purple-500">
          <div className="text-sm text-gray-400">Super Admins</div>
          <div className="text-2xl font-bold text-purple-500">{stats.superAdmins}</div>
        </div>
        <div className="card p-4 border-l-4 border-blue-500">
          <div className="text-sm text-gray-400">Admins</div>
          <div className="text-2xl font-bold text-blue-500">{stats.admins}</div>
        </div>
        <div className="card p-4 border-l-4 border-green-500">
          <div className="text-sm text-gray-400">Técnicos</div>
          <div className="text-2xl font-bold text-green-500">{stats.tecnicos}</div>
        </div>
        <div className="card p-4 border-l-4 border-gray-500">
          <div className="text-sm text-gray-400">Viewers</div>
          <div className="text-2xl font-bold text-gray-500">{stats.viewers}</div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, email o rol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10 w-full"
        />
      </div>

      {/* TABLE */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-lighter border-b border-dark-border">
              <tr>
                <th className="text-left p-4 font-medium text-gray-400">Usuario</th>
                <th className="text-left p-4 font-medium text-gray-400">Email</th>
                <th className="text-left p-4 font-medium text-gray-400">Rol</th>
                <th className="text-left p-4 font-medium text-gray-400">Estado</th>
                <th className="text-left p-4 font-medium text-gray-400">Último Acceso</th>
                <th className="text-left p-4 font-medium text-gray-400">Creado</th>
                <th className="text-right p-4 font-medium text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {usersLoading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const roleInfo = ROLE_LABELS[user.rol];
                  const estadoColor = ESTADO_COLORS[user.activo];
                  const Icon = estadoColor.icon;

                  return (
                    <tr key={user.uid} className="hover:bg-dark-lighter/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {user.foto ? (
                            <img src={user.foto} alt={user.nombre} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center">
                              <User className="w-6 h-6 text-accent-blue" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{user.nombre}</div>
                            {user.uid === currentUser?.uid && (
                              <span className="text-xs text-accent-blue">(Tú)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-${ROLE_COLORS[user.rol]}-500/15 text-${ROLE_COLORS[user.rol]}-500`}>
                          {user.rol === ROLES.SUPER_ADMIN && <Crown className="w-4 h-4" />}
                          {user.rol === ROLES.ADMIN && <Shield className="w-4 h-4" />}
                          <span className="text-sm font-medium">{roleInfo?.label}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${estadoColor.bg} ${estadoColor.text}`}>
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{user.activo ? 'Activo' : 'Inactivo'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-400">
                          {user.ultimoAcceso ? (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {new Date(user.ultimoAcceso).toLocaleDateString('es-PE')}
                            </div>
                          ) : (
                            '-'
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(user.createdAt).toLocaleDateString('es-PE')}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openPermissions(user)}
                            className="p-2 hover:bg-dark-lighter rounded-lg text-gray-400 hover:text-accent-blue"
                            title="Permisos"
                          >
                            <Settings className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.uid)}
                            className={`p-2 hover:bg-dark-lighter rounded-lg ${user.activo ? 'text-gray-400 hover:text-accent-red' : 'text-gray-400 hover:text-accent-green'}`}
                            title={user.activo ? 'Desactivar' : 'Activar'}
                            disabled={user.uid === currentUser?.uid}
                          >
                            {user.activo ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => openEdit(user)}
                            className="p-2 hover:bg-dark-lighter rounded-lg text-gray-400 hover:text-accent-blue"
                            title="Editar"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(user.uid)}
                            className="p-2 hover:bg-dark-lighter rounded-lg text-gray-400 hover:text-accent-red"
                            title="Eliminar"
                            disabled={user.uid === currentUser?.uid}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREATE/EDIT */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingId ? 'Editar Usuario' : 'Crear Usuario'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-dark-lighter rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo de Autenticación (solo al crear) */}
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Autenticación *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        form.authType === 'google_oauth'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-dark-border hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="authType"
                        value="google_oauth"
                        checked={form.authType === 'google_oauth'}
                        onChange={(e) => setForm(prev => ({ ...prev, authType: e.target.value, password: '' }))}
                        className="hidden"
                      />
                      <Mail className="w-5 h-5 text-blue-500" />
                      <div className="flex-1">
                        <div className="font-medium text-blue-500">Google OAuth</div>
                        <div className="text-xs text-gray-400">Inicia sesión con Google</div>
                      </div>
                      {form.authType === 'google_oauth' && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                    </label>

                    <label
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        form.authType === 'email_password'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-dark-border hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="authType"
                        value="email_password"
                        checked={form.authType === 'email_password'}
                        onChange={(e) => setForm(prev => ({ ...prev, authType: e.target.value }))}
                        className="hidden"
                      />
                      <KeyRound className="w-5 h-5 text-purple-500" />
                      <div className="flex-1">
                        <div className="font-medium text-purple-500">Email y Contraseña</div>
                        <div className="text-xs text-gray-400">Usuario y clave</div>
                      </div>
                      {form.authType === 'email_password' && <CheckCircle2 className="w-5 h-5 text-purple-500" />}
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm(prev => ({ ...prev, email: e.target.value }));
                    if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                  }}
                  className={`input w-full ${formErrors.email ? 'border-accent-red focus:border-accent-red' : ''}`}
                  required
                  disabled={!!editingId}
                />
                {formErrors.email && (
                  <p className="text-xs text-accent-red mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.email}
                  </p>
                )}
                {!editingId && !formErrors.email && (
                  <p className="text-xs text-gray-400 mt-1">
                    {form.authType === 'google_oauth'
                      ? 'El usuario se autenticará con su cuenta de Google'
                      : 'Se usará este email para iniciar sesión'}
                  </p>
                )}
              </div>

              {/* Campo de contraseña (solo para email_password y al crear) */}
              {!editingId && form.authType === 'email_password' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Contraseña *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => {
                        setForm(prev => ({ ...prev, password: e.target.value }));
                        if (formErrors.password) setFormErrors(prev => ({ ...prev, password: '' }));
                      }}
                      className={`input w-full pr-10 ${formErrors.password ? 'border-accent-red focus:border-accent-red' : ''}`}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-xs text-accent-red mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.password}
                    </p>
                  )}
                  {!formErrors.password && (
                    <p className="text-xs text-gray-400 mt-1">
                      El usuario podrá cambiar su contraseña después
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Nombre Completo *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => {
                    setForm(prev => ({ ...prev, nombre: e.target.value }));
                    if (formErrors.nombre) setFormErrors(prev => ({ ...prev, nombre: '' }));
                  }}
                  className={`input w-full ${formErrors.nombre ? 'border-accent-red focus:border-accent-red' : ''}`}
                  required
                />
                {formErrors.nombre && (
                  <p className="text-xs text-accent-red mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.nombre}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">URL de Foto (Opcional)</label>
                <input
                  type="url"
                  value={form.foto}
                  onChange={(e) => setForm(prev => ({ ...prev, foto: e.target.value }))}
                  className="input w-full"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Rol *</label>
                <div className="grid grid-cols-1 gap-3">
                  {Object.values(ROLES).map((rol) => {
                    const info = ROLE_LABELS[rol];
                    return (
                      <label
                        key={rol}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          form.rol === rol
                            ? `border-${ROLE_COLORS[rol]}-500 bg-${ROLE_COLORS[rol]}-500/10`
                            : 'border-dark-border hover:border-gray-500'
                        }`}
                      >
                        <input
                          type="radio"
                          name="rol"
                          value={rol}
                          checked={form.rol === rol}
                          onChange={(e) => handleRoleChange(e.target.value)}
                          className="hidden"
                        />
                        <div className="flex-1">
                          <div className={`font-medium text-${ROLE_COLORS[rol]}-500`}>
                            {info.label}
                          </div>
                          <div className="text-sm text-gray-400">{info.desc}</div>
                        </div>
                        {form.rol === rol && <CheckCircle2 className={`w-5 h-5 text-${ROLE_COLORS[rol]}-500`} />}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting
                    ? (editingId ? 'Guardando...' : 'Creando...')
                    : (editingId ? 'Guardar Cambios' : 'Crear Usuario')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PERMISOS */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="card w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Permisos de {selectedUser.nombre}</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Rol: {ROLE_LABELS[selectedUser.rol]?.label}
                </p>
              </div>
              <button onClick={() => setShowPermissionsModal(false)} className="p-2 hover:bg-dark-lighter rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {Object.keys(MODULES).map((key) => {
                const module = MODULES[key];
                const moduleLabel = MODULE_LABELS[module];
                const currentPermission = customPermissions[module] || PERMISSION_LEVELS.NONE;

                return (
                  <div key={module} className="card bg-dark-lighter p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{moduleLabel}</h3>
                      <div className={PERMISSION_LEVEL_LABELS[currentPermission].color}>
                        {PERMISSION_LEVEL_LABELS[currentPermission].label}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.values(PERMISSION_LEVELS).map((level) => (
                        <button
                          key={level}
                          onClick={() => setCustomPermissions(prev => ({ ...prev, [module]: level }))}
                          className={`p-2 rounded-lg text-sm transition-all ${
                            currentPermission === level
                              ? 'bg-accent-blue text-white'
                              : 'bg-dark hover:bg-dark-lighter text-gray-400'
                          }`}
                        >
                          {PERMISSION_LEVEL_LABELS[level].label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="btn-secondary flex-1"
                disabled={isSavingPermissions}
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePermissions}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={isSavingPermissions}
              >
                {isSavingPermissions && <Loader2 className="w-5 h-5 animate-spin" />}
                {isSavingPermissions ? 'Guardando...' : 'Guardar Permisos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="card w-full max-w-md animate-slideUp">
            <h3 className="text-xl font-bold mb-4">¿Eliminar Usuario?</h3>
            <p className="text-gray-400 mb-6">
              Esta acción no se puede deshacer. El usuario perderá acceso inmediatamente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn-secondary flex-1"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="btn-danger flex-1 flex items-center justify-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="w-5 h-5 animate-spin" />}
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
