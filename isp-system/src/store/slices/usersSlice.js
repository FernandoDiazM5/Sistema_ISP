import * as usersAPI from '../../api/usersAPI';
import { PERMISSION_LEVELS, MODULES } from '../../types/user';

export const createUsersSlice = (set, get) => ({
  // ===================== ESTADO =====================
  currentUser: null,        // Usuario autenticado actual
  allUsers: [],             // Lista de todos los usuarios del sistema
  usersLoading: false,      // Estado de carga
  usersError: null,         // Error en operaciones

  // ===================== CARGAR USUARIO ACTUAL =====================
  setCurrentUser: (user) => set({ currentUser: user }),

  clearCurrentUser: () => set({ currentUser: null }),

  // Cargar usuario desde Firebase por email (después del login de Google)
  loadCurrentUserByEmail: async (email) => {
    try {
      set({ usersLoading: true, usersError: null });
      const user = await usersAPI.getUserByEmail(email);

      if (!user) {
        set({
          currentUser: null,
          usersLoading: false,
          usersError: 'Usuario no autorizado. Contacta al administrador.'
        });
        return null;
      }

      if (!user.activo) {
        set({
          currentUser: null,
          usersLoading: false,
          usersError: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
        });
        return null;
      }

      // Actualizar último acceso
      await usersAPI.updateLastAccess(user.uid);

      // BUGFIX: Sincronizar currentUser y user para evitar inconsistencias
      set({ currentUser: user, user: user, usersLoading: false });
      // También persistir en localstorage para la próxima sesión
      localStorage.setItem('isp_user', JSON.stringify(user));

      return user;
    } catch (error) {
      console.error('Error loading current user:', error);
      set({
        currentUser: null,
        usersLoading: false,
        usersError: error.message
      });
      return null;
    }
  },

  // Cargar usuario desde Firebase por UID (después del login con email/password)
  getUserByUid: async (uid) => {
    try {
      const user = await usersAPI.getUserByUid(uid);

      if (!user) {
        return null;
      }

      if (!user.activo) {
        return null;
      }

      // Actualizar último acceso
      await usersAPI.updateLastAccess(user.uid);

      return user;
    } catch (error) {
      console.error('Error loading user by UID:', error);
      return null;
    }
  },

  // ===================== GESTIÓN DE USUARIOS (CRUD) =====================
  loadAllUsers: async () => {
    try {
      set({ usersLoading: true, usersError: null });
      const users = await usersAPI.getAllUsers();
      set({ allUsers: users, usersLoading: false });
      return users;
    } catch (error) {
      console.error('Error loading users:', error);
      set({ usersError: error.message, usersLoading: false });
      return [];
    }
  },

  createUser: async (userData) => {
    try {
      set({ usersLoading: true, usersError: null });
      const currentUser = get().currentUser;
      const newUser = await usersAPI.createUser(userData, currentUser?.uid || 'system');

      // Actualizar lista local
      const allUsers = get().allUsers;
      set({ allUsers: [newUser, ...allUsers], usersLoading: false });

      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      set({ usersError: error.message, usersLoading: false });
      throw error;
    }
  },

  updateUser: async (uid, updates) => {
    try {
      set({ usersLoading: true, usersError: null });
      const updatedUser = await usersAPI.updateUser(uid, updates);

      // Actualizar lista local
      const allUsers = get().allUsers.map(u => u.uid === uid ? updatedUser : u);
      set({ allUsers, usersLoading: false });

      // Si es el usuario actual, actualizar también IMMEDIATAMENTE
      const currentUser = get().currentUser;
      if (currentUser?.uid === uid) {
        set({ currentUser: { ...currentUser, ...updatedUser } });

        // También actualizar en localStorage si existe referencia allí (para persistencia básica)
        const storedUser = localStorage.getItem('isp_user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed.uid === uid) {
              localStorage.setItem('isp_user', JSON.stringify({ ...parsed, ...updatedUser }));
            }
          } catch (e) { /* ignore */ }
        }
      }

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      set({ usersError: error.message, usersLoading: false });
      throw error;
    }
  },

  deleteUser: async (uid) => {
    try {
      set({ usersLoading: true, usersError: null });
      await usersAPI.deleteUser(uid);

      // Actualizar lista local
      const allUsers = get().allUsers.filter(u => u.uid !== uid);
      set({ allUsers, usersLoading: false });

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      set({ usersError: error.message, usersLoading: false });
      throw error;
    }
  },

  toggleUserStatus: async (uid) => {
    try {
      const user = get().allUsers.find(u => u.uid === uid);
      if (!user) throw new Error('Usuario no encontrado');

      const newStatus = !user.activo;
      await get().updateUser(uid, { activo: newStatus });

      return newStatus;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  },

  updateUserPermissions: async (uid, permisos) => {
    try {
      // Usar la función updateUser optimizada de arriba
      return await get().updateUser(uid, { permisos });
    } catch (error) {
      console.error('Error updating permissions:', error);
      throw error;
    }
  },

  // ===================== VERIFICACIÓN DE PERMISOS =====================
  hasPermission: (module, requiredLevel = PERMISSION_LEVELS.READ) => {
    const currentUser = get().currentUser;
    if (!currentUser) return false;

    // 0. SUPER_ADMIN siempre tiene acceso total
    if (currentUser.rol === 'SUPER_ADMIN') return true;

    // 1. Obtener permisos explícitos o predeterminados del rol
    let userPermission = currentUser.permisos?.[module];

    // Si no tiene permisos explícitos, usar los del rol
    if (!userPermission) {
      const rolePermissions = DEFAULT_PERMISSIONS[currentUser.rol];
      if (rolePermissions) {
        userPermission = rolePermissions[module];
      }
    }

    if (!userPermission) return false;

    const levels = [
      PERMISSION_LEVELS.NONE,
      PERMISSION_LEVELS.READ,
      PERMISSION_LEVELS.WRITE,
      PERMISSION_LEVELS.ADMIN,
    ];

    const userLevelIndex = levels.indexOf(userPermission);
    const requiredLevelIndex = levels.indexOf(requiredLevel);

    return userLevelIndex >= requiredLevelIndex;
  },

  canRead: (module) => get().hasPermission(module, PERMISSION_LEVELS.READ),
  canWrite: (module) => get().hasPermission(module, PERMISSION_LEVELS.WRITE),
  canAdmin: (module) => get().hasPermission(module, PERMISSION_LEVELS.ADMIN),

  // Verificar si puede gestionar usuarios (solo SUPER_ADMIN)
  canManageUsers: () => {
    return get().hasPermission(MODULES.USUARIOS, PERMISSION_LEVELS.ADMIN);
  },

  // Obtener módulos accesibles para el usuario actual
  getAccessibleModules: () => {
    const currentUser = get().currentUser;
    if (!currentUser) return [];

    return Object.keys(MODULES).filter(key => {
      const module = MODULES[key];
      return get().hasPermission(module, PERMISSION_LEVELS.READ);
    });
  },
});
