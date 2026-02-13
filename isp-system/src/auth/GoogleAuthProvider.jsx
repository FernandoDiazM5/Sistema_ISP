import { createContext, useContext, useCallback, useEffect } from 'react';
import useStore from '../store/useStore';
import { ROLES } from './roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const user = useStore(s => s.user);
  const loading = useStore(s => s.loading);
  const setUser = useStore(s => s.setUser);
  const logout = useStore(s => s.logout);
  const initAuth = useStore(s => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = useCallback((userData) => {
    setUser(userData);
  }, [setUser]);

  const hasPermission = useCallback((perm) => {
    if (!user) return false;
    const role = ROLES[user.rol];
    if (!role) return false;
    return role.permissions.includes('*') || role.permissions.includes(perm);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
