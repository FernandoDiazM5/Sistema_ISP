import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/GoogleAuthProvider';
import { ROLES } from '../../types/user';

/**
 * Componente para proteger rutas basado en autenticación y roles.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente hijo a renderizar si tiene acceso
 * @param {string} [props.requiredRole] - Rol requerido (opcional)
 * @param {string[]} [props.allowedRoles] - Lista de roles permitidos (opcional)
 */
export default function ProtectedRoute({ children, requiredRole, allowedRoles }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // Puedes mostrar un spinner aquí si lo prefieres
        return <div className="flex items-center justify-center h-screen">Cargando...</div>;
    }

    // 1. Verificar autenticación
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Verificar roles (si se especifican)
    if (requiredRole && user.rol !== requiredRole) {
        return <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <h1 className="text-2xl font-bold text-accent-red mb-2">Acceso Denegado</h1>
            <p className="text-text-secondary">No tienes permisos para ver esta página.</p>
        </div>;
    }

    if (allowedRoles && !allowedRoles.includes(user.rol)) {
        return <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <h1 className="text-2xl font-bold text-accent-red mb-2">Acceso Denegado</h1>
            <p className="text-text-secondary">No tienes permisos para ver esta página.</p>
        </div>;
    }

    return children;
}
