import { useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './auth/GoogleAuthProvider';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import LoadingSpinner from './components/common/LoadingSpinner';
import ReloadPrompt from './components/common/ReloadPrompt';
import ToastContainer from './components/ui/Toast';
import useStore from './store/useStore';
import useSyncStore from './store/syncStore';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ROLES } from './types/user';

// Cargar utilidad de inicialización en desarrollo
if (import.meta.env.DEV) {
  import('./utils/initSuperAdmin');
}

// Lazy Load Pages
const LoginPage = lazy(() => import('./auth/LoginPage'));
const DashboardPage = lazy(() => import('./components/dashboard/DashboardPage'));
const ClientesPage = lazy(() => import('./components/clientes/ClientesPage'));
const ClienteDetalle = lazy(() => import('./components/clientes/ClienteDetalle'));
const ImportacionPage = lazy(() => import('./components/importacion/ImportacionPage'));
const TicketsPage = lazy(() => import('./components/tickets/TicketsPage'));
const AveriasPage = lazy(() => import('./components/averias/AveriasPage'));
const SoporteRemotoPage = lazy(() => import('./components/soporte/SoporteRemotoPage'));
const ReportesPage = lazy(() => import('./components/reportes/ReportesPage'));
const EquiposPage = lazy(() => import('./components/equipos/EquiposPage'));
const ConfiguracionPage = lazy(() => import('./components/configuracion/ConfiguracionPage'));
const WhatsAppPage = lazy(() => import('./components/whatsapp/WhatsAppPage'));
const TecnicosPage = lazy(() => import('./components/tecnicos/TecnicosPage'));
const VisitasTecnicasPage = lazy(() => import('./components/visitas/VisitasTecnicasPage'));
const InstalacionesPage = lazy(() => import('./components/instalaciones/InstalacionesPage'));
const PlantaExternaPage = lazy(() => import('./components/planta-externa/PlantaExternaPage'));
const PostVentaPage = lazy(() => import('./components/post-venta/PostVentaPage'));
const RequerimientosPage = lazy(() => import('./components/requerimientos/RequerimientosPage'));
const UsuariosPage = lazy(() => import('./components/usuarios/UsuariosPage'));

function AppContent() {
  const { user, loading } = useAuth();
  const loadDemoData = useStore(s => s.loadDemoData);
  const clients = useStore(s => s.clients);
  const dataSource = useStore(s => s.dataSource);

  const hydrateStore = useStore(s => s.hydrateStore);
  const storeReady = useStore(s => s.storeReady);
  const theme = useStore(s => s.theme);

  useEffect(() => {
    hydrateStore();
  }, [hydrateStore]);

  // Aplicar tema
  useEffect(() => {
    if (theme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (storeReady && user && clients.length === 0 && dataSource === 'demo') {
      loadDemoData();
    }
  }, [storeReady, user, clients.length, dataSource, loadDemoData]);

  // Iniciar live sync cuando el store esta listo y el usuario autenticado
  useEffect(() => {
    if (storeReady && user) {
      const { startLiveSync, stopLiveSync } = useSyncStore.getState();
      startLiveSync();
      return () => stopLiveSync();
    }
  }, [storeReady, user]);

  if (loading || !storeReady) return <LoadingSpinner />;
  if (!user) return (
    <Suspense fallback={<LoadingSpinner />}>
      <Navigate to="/" replace />
      <LoginPage />
    </Suspense>
  );

  return (
    <MainLayout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />

          {/* Módulos Operativos Generales */}
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/clientes/:id" element={<ClienteDetalle />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/averias" element={<AveriasPage />} />
          <Route path="/instalaciones" element={<InstalacionesPage />} />

          {/* Módulos de Soporte y Operaciones (Restringidos a Técnicos+) */}
          <Route path="/tecnicos" element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TECNICO]}>
              <TecnicosPage />
            </ProtectedRoute>
          } />
          <Route path="/visitas" element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TECNICO]}>
              <VisitasTecnicasPage />
            </ProtectedRoute>
          } />
          <Route path="/planta-externa" element={<PlantaExternaPage />} />
          <Route path="/post-venta" element={<PostVentaPage />} />
          <Route path="/requerimientos" element={<RequerimientosPage />} />
          <Route path="/soporte" element={<SoporteRemotoPage />} />
          <Route path="/whatsapp" element={<WhatsAppPage />} />
          <Route path="/equipos" element={<EquiposPage />} />

          {/* Módulos Administrativos */}
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/importar" element={<ImportacionPage />} />

          {/* Módulos Críticos (Solo SUPER_ADMIN) */}
          <Route path="/usuarios" element={
            <ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}>
              <UsuariosPage />
            </ProtectedRoute>
          } />
          <Route path="/config" element={
            <ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}>
              <ConfiguracionPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </MainLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
        <ReloadPrompt />
        <ToastContainer />
      </AuthProvider>
    </ErrorBoundary>
  );
}
