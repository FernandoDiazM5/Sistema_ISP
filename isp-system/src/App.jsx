import { useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './auth/GoogleAuthProvider';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import LoadingSpinner from './components/common/LoadingSpinner';
// import ReloadPrompt from './components/common/ReloadPrompt';
import ToastContainer from './components/ui/Toast';
import useStore from './store/useStore';

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

function AppContent() {
  const { user, loading } = useAuth();
  const loadDemoData = useStore(s => s.loadDemoData);
  const clients = useStore(s => s.clients);

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
    if (storeReady && user && clients.length === 0) {
      loadDemoData();
    }
  }, [storeReady, user, clients.length, loadDemoData]);

  if (loading || !storeReady) return <LoadingSpinner />;
  if (!user) return <LoginPage />;

  return (
    <MainLayout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/clientes/:id" element={<ClienteDetalle />} />
          <Route path="/importar" element={<ImportacionPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/averias" element={<AveriasPage />} />
          <Route path="/soporte" element={<SoporteRemotoPage />} />
          <Route path="/whatsapp" element={<WhatsAppPage />} />
          <Route path="/tecnicos" element={<TecnicosPage />} />
          <Route path="/visitas" element={<VisitasTecnicasPage />} />
          <Route path="/instalaciones" element={<InstalacionesPage />} />
          <Route path="/planta-externa" element={<PlantaExternaPage />} />
          <Route path="/post-venta" element={<PostVentaPage />} />
          <Route path="/requerimientos" element={<RequerimientosPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/equipos" element={<EquiposPage />} />
          <Route path="/config" element={<ConfiguracionPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <ReloadPrompt />
      <ToastContainer />
    </AuthProvider>
  );
}
