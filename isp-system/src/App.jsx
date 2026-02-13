import { useEffect } from 'react';
import { AuthProvider, useAuth } from './auth/GoogleAuthProvider';
import LoginPage from './auth/LoginPage';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './components/dashboard/DashboardPage';
import ClientesPage from './components/clientes/ClientesPage';
import ImportacionPage from './components/importacion/ImportacionPage';
import TicketsPage from './components/tickets/TicketsPage';
import AveriasPage from './components/averias/AveriasPage';
import SoporteRemotoPage from './components/soporte/SoporteRemotoPage';
import ReportesPage from './components/reportes/ReportesPage';
import EquiposPage from './components/equipos/EquiposPage';
import ConfiguracionPage from './components/configuracion/ConfiguracionPage';
import WhatsAppPage from './components/whatsapp/WhatsAppPage';
import TecnicosPage from './components/tecnicos/TecnicosPage';
import VisitasTecnicasPage from './components/visitas/VisitasTecnicasPage';
import InstalacionesPage from './components/instalaciones/InstalacionesPage';
import PlantaExternaPage from './components/planta-externa/PlantaExternaPage';
import PostVentaPage from './components/post-venta/PostVentaPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import ReloadPrompt from './components/common/ReloadPrompt';
import useStore from './store/useStore';

function AppContent() {
  const { user, loading } = useAuth();
  const activePage = useStore(s => s.activePage);
  const loadDemoData = useStore(s => s.loadDemoData);
  const clients = useStore(s => s.clients);

  const hydrateStore = useStore(s => s.hydrateStore);
  const storeReady = useStore(s => s.storeReady);

  useEffect(() => {
    hydrateStore();
  }, [hydrateStore]);

  useEffect(() => {
    if (storeReady && user && clients.length === 0) {
      loadDemoData();
    }
  }, [storeReady, user, clients.length, loadDemoData]);

  if (loading || !storeReady) return <LoadingSpinner />;
  if (!user) return <LoginPage />;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />;
      case 'clientes': return <ClientesPage />;
      case 'importar': return <ImportacionPage />;
      case 'tickets': return <TicketsPage />;
      case 'averias': return <AveriasPage />;
      case 'soporte': return <SoporteRemotoPage />;
      case 'whatsapp': return <WhatsAppPage />;
      case 'tecnicos': return <TecnicosPage />;
      case 'visitas': return <VisitasTecnicasPage />;
      case 'instalaciones': return <InstalacionesPage />;
      case 'planta-externa': return <PlantaExternaPage />;
      case 'post-venta': return <PostVentaPage />;
      case 'reportes': return <ReportesPage />;
      case 'equipos': return <EquiposPage />;
      case 'config': return <ConfiguracionPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <MainLayout>
      {renderPage()}
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <ReloadPrompt />
    </AuthProvider>
  );
}
