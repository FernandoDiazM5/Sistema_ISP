import { useAuth } from './GoogleAuthProvider';
import LoginPage from './LoginPage';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <LoginPage />;

  return children;
}
