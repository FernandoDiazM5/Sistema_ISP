import { useAuth } from './GoogleAuthProvider';
import { Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ProtectedRoute({ children, requiredRole, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <LoginPage />;

  // Verificar rol
  if (requiredRole && user.rol !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
